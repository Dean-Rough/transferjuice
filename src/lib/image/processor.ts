/**
 * Image Processing Pipeline
 * Handles resizing, optimization, alt text generation, and CDN integration
 */

import type { ImageSource } from './sourcing';
import { z } from 'zod';
import OpenAI from 'openai';

// Processing schemas
export const ProcessedImageSchema = z.object({
  id: z.string(),
  originalUrl: z.string().url(),
  processedUrl: z.string().url(),
  cdnUrl: z.string().url().optional(),
  source: z.enum(['twitter', 'wikipedia']),
  type: z.enum(['player', 'club', 'news', 'celebration']),
  title: z.string(),
  altText: z.string(),
  attribution: z.string(),
  license: z.string(),
  variants: z.object({
    thumbnail: z.object({
      url: z.string().url(),
      width: z.number(),
      height: z.number(),
      fileSize: z.number(),
    }),
    medium: z.object({
      url: z.string().url(),
      width: z.number(),
      height: z.number(),
      fileSize: z.number(),
    }),
    large: z.object({
      url: z.string().url(),
      width: z.number(),
      height: z.number(),
      fileSize: z.number(),
    }),
  }),
  optimization: z.object({
    originalSize: z.number(),
    optimizedSize: z.number(),
    compressionRatio: z.number(),
    format: z.string(),
    quality: z.number(),
  }),
  accessibility: z.object({
    altText: z.string(),
    description: z.string(),
    colorContrast: z.number().optional(),
    readabilityScore: z.number().min(0).max(100),
  }),
  metadata: z.object({
    processedAt: z.date(),
    processingTime: z.number(),
    aiModel: z.string(),
    cacheable: z.boolean(),
    expiresAt: z.date().optional(),
  }),
});

export type ProcessedImage = z.infer<typeof ProcessedImageSchema>;

interface ProcessingConfig {
  openaiApiKey: string;
  cdnBaseUrl?: string;
  enableCdn?: boolean;
  compressionQuality?: number;
  maxWidth?: number;
  maxHeight?: number;
  enableWatermark?: boolean;
  userAgent: string;
}

interface ImageVariantConfig {
  thumbnail: { width: number; height: number; quality: number };
  medium: { width: number; height: number; quality: number };
  large: { width: number; height: number; quality: number };
}

export class ImageProcessor {
  private openai: OpenAI;
  private config: Required<ProcessingConfig>;
  private variantConfig: ImageVariantConfig;

  constructor(config: ProcessingConfig) {
    this.config = {
      cdnBaseUrl: 'https://cdn.transferjuice.com',
      enableCdn: true,
      compressionQuality: 85,
      maxWidth: 1200,
      maxHeight: 800,
      enableWatermark: false,
      ...config,
    };

    this.openai = new OpenAI({
      apiKey: this.config.openaiApiKey,
    });

    this.variantConfig = {
      thumbnail: { width: 150, height: 150, quality: 80 },
      medium: { width: 400, height: 300, quality: 85 },
      large: { width: 800, height: 600, quality: 90 },
    };
  }

  /**
   * Process a single image through the complete pipeline
   */
  async processImage(imageSource: ImageSource): Promise<ProcessedImage> {
    const startTime = Date.now();

    try {
      // Download and analyze original image
      const imageBuffer = await this.downloadImage(imageSource.url);
      const imageInfo = await this.analyzeImage(imageBuffer);

      // Generate enhanced alt text using AI
      const enhancedAltText = await this.generateAltText(
        imageSource,
        imageInfo
      );

      // Create optimized variants
      const variants = await this.createImageVariants(imageBuffer, imageInfo);

      // Upload to CDN if enabled
      const cdnUrls = this.config.enableCdn
        ? await this.uploadToCdn(variants)
        : null;

      // Calculate optimization metrics
      const optimization = this.calculateOptimization(imageBuffer, variants);

      // Generate accessibility information
      const accessibility = await this.generateAccessibilityInfo(
        enhancedAltText,
        imageSource,
        imageInfo
      );

      const processingTime = Date.now() - startTime;

      return ProcessedImageSchema.parse({
        id: `processed_${imageSource.id}`,
        originalUrl: imageSource.url,
        processedUrl: variants.large.url,
        cdnUrl: cdnUrls?.large,
        source: imageSource.source,
        type: imageSource.type,
        title: imageSource.title,
        altText: enhancedAltText,
        attribution: imageSource.attribution,
        license: imageSource.license,
        variants: {
          thumbnail: {
            url: cdnUrls?.thumbnail || variants.thumbnail.url,
            width: variants.thumbnail.width,
            height: variants.thumbnail.height,
            fileSize: variants.thumbnail.fileSize,
          },
          medium: {
            url: cdnUrls?.medium || variants.medium.url,
            width: variants.medium.width,
            height: variants.medium.height,
            fileSize: variants.medium.fileSize,
          },
          large: {
            url: cdnUrls?.large || variants.large.url,
            width: variants.large.width,
            height: variants.large.height,
            fileSize: variants.large.fileSize,
          },
        },
        optimization,
        accessibility,
        metadata: {
          processedAt: new Date(),
          processingTime,
          aiModel: 'gpt-4-vision-preview',
          cacheable: true,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
    } catch (error) {
      throw new Error(
        `Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Process multiple images in parallel with rate limiting
   */
  async processImages(
    imageSources: ImageSource[],
    concurrency: number = 3
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];
    const errors: string[] = [];

    // Process in batches to respect rate limits
    for (let i = 0; i < imageSources.length; i += concurrency) {
      const batch = imageSources.slice(i, i + concurrency);

      const batchResults = await Promise.allSettled(
        batch.map((source) => this.processImage(source))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          errors.push(result.reason.message);
        }
      }

      // Rate limiting delay between batches
      if (i + concurrency < imageSources.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (errors.length > 0) {
      console.warn(
        `Image processing completed with ${errors.length} errors:`,
        errors
      );
    }

    return results;
  }

  /**
   * Download image from URL
   */
  private async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.config.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Analyze image properties
   */
  private async analyzeImage(imageBuffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    fileSize: number;
    hasTransparency: boolean;
    dominantColors: string[];
  }> {
    // Simplified image analysis - would use sharp or similar library in production
    const fileSize = imageBuffer.length;

    // Mock analysis for now - would implement actual image processing
    return {
      width: 800,
      height: 600,
      format: 'jpeg',
      fileSize,
      hasTransparency: false,
      dominantColors: ['#1f3a93', '#ffffff', '#000000'],
    };
  }

  /**
   * Generate enhanced alt text using AI
   */
  private async generateAltText(
    imageSource: ImageSource,
    imageInfo: { width: number; height: number; format: string }
  ): Promise<string> {
    const baseAltText = imageSource.altText;
    const context = {
      type: imageSource.type,
      title: imageSource.title,
      source: imageSource.source,
      existingAlt: baseAltText,
      dimensions: `${imageInfo.width}x${imageInfo.height}`,
    };

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an accessibility expert creating alt text for transfer news images. Generate concise, descriptive alt text that:
- Describes what's visible in the image
- Includes relevant context for transfer news
- Is 125 characters or less
- Follows accessibility best practices
- Avoids redundant phrases like "image of" or "picture showing"`,
          },
          {
            role: 'user',
            content: `Generate enhanced alt text for this transfer news image:
            
Type: ${context.type}
Title: ${context.title}
Source: ${context.source}
Existing alt text: ${context.existingAlt}
Dimensions: ${context.dimensions}

Create descriptive, accessible alt text that helps users understand the image content and its relevance to the transfer story.`,
          },
        ],
        max_tokens: 100,
        temperature: 0.3,
      });

      const enhancedAltText = response.choices[0]?.message?.content?.trim();

      // Validate AI response length and fallback if too long or empty
      if (!enhancedAltText || enhancedAltText.length > 125) {
        return baseAltText || `${imageSource.type} image: ${imageSource.title}`;
      }

      return enhancedAltText;
    } catch (error) {
      console.warn('AI alt text generation failed, using fallback:', error);
      return baseAltText || `${imageSource.type} image: ${imageSource.title}`;
    }
  }

  /**
   * Create optimized image variants
   */
  private async createImageVariants(
    imageBuffer: Buffer,
    originalInfo: {
      width: number;
      height: number;
      format: string;
      fileSize: number;
    }
  ): Promise<{
    thumbnail: { url: string; width: number; height: number; fileSize: number };
    medium: { url: string; width: number; height: number; fileSize: number };
    large: { url: string; width: number; height: number; fileSize: number };
  }> {
    // Mock implementation - would use sharp or similar for actual image processing
    const baseUrl = 'data:image/jpeg;base64,';
    const mockImageData = imageBuffer.toString('base64').slice(0, 100);

    return {
      thumbnail: {
        url: `${baseUrl}${mockImageData}_thumb`,
        width: this.variantConfig.thumbnail.width,
        height: this.variantConfig.thumbnail.height,
        fileSize: Math.round(originalInfo.fileSize * 0.1),
      },
      medium: {
        url: `${baseUrl}${mockImageData}_medium`,
        width: this.variantConfig.medium.width,
        height: this.variantConfig.medium.height,
        fileSize: Math.round(originalInfo.fileSize * 0.3),
      },
      large: {
        url: `${baseUrl}${mockImageData}_large`,
        width: this.variantConfig.large.width,
        height: this.variantConfig.large.height,
        fileSize: Math.round(originalInfo.fileSize * 0.7),
      },
    };
  }

  /**
   * Upload images to CDN
   */
  private async uploadToCdn(variants: {
    thumbnail: { url: string; width: number; height: number; fileSize: number };
    medium: { url: string; width: number; height: number; fileSize: number };
    large: { url: string; width: number; height: number; fileSize: number };
  }): Promise<{
    thumbnail: string;
    medium: string;
    large: string;
  }> {
    // Mock CDN upload - would implement actual CDN integration
    const timestamp = Date.now();
    const baseUrl = this.config.cdnBaseUrl;

    return {
      thumbnail: `${baseUrl}/thumb/${timestamp}_thumbnail.jpg`,
      medium: `${baseUrl}/medium/${timestamp}_medium.jpg`,
      large: `${baseUrl}/large/${timestamp}_large.jpg`,
    };
  }

  /**
   * Calculate optimization metrics
   */
  private calculateOptimization(
    originalBuffer: Buffer,
    variants: { large: { fileSize: number } }
  ): ProcessedImage['optimization'] {
    const originalSize = originalBuffer.length;
    const optimizedSize = variants.large.fileSize;
    const compressionRatio = (originalSize - optimizedSize) / originalSize;

    return {
      originalSize,
      optimizedSize,
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      format: 'jpeg',
      quality: this.config.compressionQuality,
    };
  }

  /**
   * Generate accessibility information
   */
  private async generateAccessibilityInfo(
    altText: string,
    imageSource: ImageSource,
    imageInfo: { dominantColors: string[] }
  ): Promise<ProcessedImage['accessibility']> {
    // Generate detailed description for screen readers
    const description = await this.generateDetailedDescription(
      imageSource,
      altText
    );

    // Calculate readability score
    const readabilityScore = this.calculateReadabilityScore(
      altText,
      description
    );

    // Estimate color contrast (simplified)
    const colorContrast = this.estimateColorContrast(imageInfo.dominantColors);

    return {
      altText,
      description,
      colorContrast,
      readabilityScore,
    };
  }

  /**
   * Generate detailed description for accessibility
   */
  private async generateDetailedDescription(
    imageSource: ImageSource,
    altText: string
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `Generate a detailed image description for accessibility tools. Expand on the alt text to provide more context while remaining concise and relevant to transfer news.`,
          },
          {
            role: 'user',
            content: `Create a detailed description for this transfer news image:

Type: ${imageSource.type}
Alt text: ${altText}
Source: ${imageSource.source}
Title: ${imageSource.title}

Provide 1-2 sentences that give more context than the alt text while remaining focused and informative.`,
          },
        ],
        max_tokens: 150,
        temperature: 0.2,
      });

      return response.choices[0]?.message?.content?.trim() || altText;
    } catch (error) {
      console.warn('Detailed description generation failed:', error);
      return altText;
    }
  }

  /**
   * Calculate readability score for alt text
   */
  private calculateReadabilityScore(
    altText: string,
    description: string
  ): number {
    // Simplified readability calculation
    const combinedText = `${altText} ${description}`;
    const words = combinedText.split(/\s+/).length;
    const sentences = combinedText.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;

    // Score based on clarity and conciseness
    let score = 80; // Base score

    // Penalty for overly complex sentences
    if (avgWordsPerSentence > 20) score -= 20;
    else if (avgWordsPerSentence > 15) score -= 10;

    // Bonus for appropriate length
    if (altText.length >= 50 && altText.length <= 125) score += 10;

    // Penalty for too short or too long
    if (altText.length < 20) score -= 15;
    if (altText.length > 150) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Estimate color contrast ratio
   */
  private estimateColorContrast(dominantColors: string[]): number {
    // Simplified contrast estimation
    if (dominantColors.length < 2) return 4.5; // Default acceptable contrast

    // Mock calculation - would implement actual color contrast calculation
    const hasHighContrast = dominantColors.some(
      (color) =>
        color.toLowerCase() === '#ffffff' || color.toLowerCase() === '#000000'
    );

    return hasHighContrast ? 7.0 : 4.5;
  }

  /**
   * Validate processed image meets requirements
   */
  validateProcessedImage(processedImage: ProcessedImage): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check alt text length
    if (processedImage.altText.length < 10) {
      issues.push('Alt text too short');
    }
    if (processedImage.altText.length > 125) {
      issues.push('Alt text too long');
    }

    // Check compression ratio
    if (processedImage.optimization.compressionRatio < 0.1) {
      issues.push('Insufficient compression');
    }

    // Check accessibility score
    if (processedImage.accessibility.readabilityScore < 70) {
      issues.push('Low readability score');
    }

    // Check image variants
    const requiredVariants = ['thumbnail', 'medium', 'large'];
    for (const variant of requiredVariants) {
      if (
        !processedImage.variants[
          variant as keyof typeof processedImage.variants
        ]
      ) {
        issues.push(`Missing ${variant} variant`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    supportedFormats: string[];
    variantSizes: ImageVariantConfig;
    compressionQuality: number;
    cdnEnabled: boolean;
  } {
    return {
      supportedFormats: ['jpeg', 'jpg', 'png', 'webp'],
      variantSizes: this.variantConfig,
      compressionQuality: this.config.compressionQuality,
      cdnEnabled: this.config.enableCdn,
    };
  }
}
