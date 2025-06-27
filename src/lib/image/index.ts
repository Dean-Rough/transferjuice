/**
 * Image Integration and Processing System
 * Main orchestrator for the complete image pipeline
 */

import { ImageSourcingService, type ImageSource } from "./sourcing";
import { ImageProcessor, type ProcessedImage } from "./processor";
import {
  ImagePlacementService,
  type ArticleLayout,
  type ImagePlacement,
} from "./placement";
import type { ArticleSection } from "@/lib/ai/article-generator";
import type { ContentAnalysis } from "@/lib/ai/content-analyzer";
// Define TweetMediaInfo type based on Twitter API structure
type TweetMediaInfo = {
  media_key: string;
  type: string;
  url?: string;
  preview_image_url?: string;
  alt_text?: string;
  width?: number;
  height?: number;
};
import { z } from "zod";

// Main pipeline schemas
export const ImagePipelineConfigSchema = z.object({
  openaiApiKey: z.string().min(1),
  userAgent: z.string().min(1),
  enableCaching: z.boolean().optional().default(true),
  enableCdn: z.boolean().optional().default(true),
  cdnBaseUrl: z.string().url().optional(),
  compressionQuality: z.number().min(10).max(100).optional().default(85),
  maxImagesPerArticle: z.number().min(1).max(20).optional().default(8),
  minRelevanceScore: z.number().min(0).max(100).optional().default(60),
});

export const ImagePipelineResultSchema = z.object({
  success: z.boolean(),
  articleLayout: z.any().optional(), // ArticleLayout
  processedImages: z.array(z.any()), // ProcessedImage[]
  sourcedImages: z.array(z.any()), // ImageSource[]
  metrics: z.object({
    totalProcessingTime: z.number(),
    imagesSourced: z.number(),
    imagesProcessed: z.number(),
    imagesPlaced: z.number(),
    averageRelevance: z.number(),
    totalImageSize: z.number(),
    compressionRatio: z.number(),
    cdnDeliveryEnabled: z.boolean(),
  }),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
});

export type ImagePipelineConfig = z.infer<typeof ImagePipelineConfigSchema>;
export type ImagePipelineResult = z.infer<typeof ImagePipelineResultSchema>;

// Re-export types for convenience
export type { ImageSource, ProcessedImage, ImagePlacement, ArticleLayout };

export class ImagePipeline {
  private sourcingService: ImageSourcingService;
  private processor: ImageProcessor;
  private placementService: ImagePlacementService;
  private config: ImagePipelineConfig;

  constructor(config: ImagePipelineConfig) {
    this.config = ImagePipelineConfigSchema.parse(config);

    this.sourcingService = new ImageSourcingService({
      userAgent: this.config.userAgent,
      enableCaching: this.config.enableCaching,
    });

    this.processor = new ImageProcessor({
      openaiApiKey: this.config.openaiApiKey,
      cdnBaseUrl: this.config.cdnBaseUrl,
      enableCdn: this.config.enableCdn,
      compressionQuality: this.config.compressionQuality,
      userAgent: this.config.userAgent,
    });

    this.placementService = new ImagePlacementService({
      openaiApiKey: this.config.openaiApiKey,
      minRelevanceScore: this.config.minRelevanceScore,
    });
  }

  /**
   * Complete image pipeline for article generation
   */
  async processArticleImages(
    sections: ArticleSection[],
    contentAnalyses: ContentAnalysis[],
    twitterMedia: Array<{
      tweetId: string;
      media: TweetMediaInfo[];
      authorHandle: string;
    }> = [],
  ): Promise<ImagePipelineResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Step 1: Source images from multiple channels
      const sourcedImages = await this.sourceImages(
        contentAnalyses,
        twitterMedia,
        errors,
        warnings,
      );

      if (sourcedImages.length === 0) {
        warnings.push("No images sourced - article will have no images");
      }

      // Step 2: Process images (resize, optimize, generate alt text)
      const processedImages = await this.processImages(
        sourcedImages,
        errors,
        warnings,
      );

      // Step 3: Create optimal layout and placements
      const articleLayout =
        processedImages.length > 0
          ? await this.createLayout(
              sections,
              processedImages,
              contentAnalyses,
              errors,
              warnings,
            )
          : undefined;

      // Calculate final metrics
      const metrics = this.calculatePipelineMetrics(
        sourcedImages,
        processedImages,
        articleLayout,
        Date.now() - startTime,
      );

      return ImagePipelineResultSchema.parse({
        success: errors.length === 0,
        articleLayout,
        processedImages,
        sourcedImages,
        metrics,
        errors,
        warnings,
      });
    } catch (error) {
      errors.push(
        `Pipeline failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );

      return ImagePipelineResultSchema.parse({
        success: false,
        processedImages: [],
        sourcedImages: [],
        metrics: {
          totalProcessingTime: Date.now() - startTime,
          imagesSourced: 0,
          imagesProcessed: 0,
          imagesPlaced: 0,
          averageRelevance: 0,
          totalImageSize: 0,
          compressionRatio: 0,
          cdnDeliveryEnabled: this.config.enableCdn,
        },
        errors,
        warnings,
      });
    }
  }

  /**
   * Process images for a single tweet (for real-time processing)
   */
  async processTweetImages(
    tweetMedia: TweetMediaInfo[],
    tweetId: string,
    authorHandle: string,
    contentAnalysis?: ContentAnalysis,
  ): Promise<{
    processedImages: ProcessedImage[];
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Extract Twitter images
      const twitterImages = await this.sourcingService.extractTwitterImages(
        tweetMedia,
        tweetId,
        authorHandle,
      );

      if (twitterImages.length === 0) {
        return { processedImages: [], errors: [] };
      }

      // Process images
      const processedImages = await this.processor.processImages(
        twitterImages,
        2,
      );

      return {
        processedImages,
        errors,
      };
    } catch (error) {
      errors.push(
        `Tweet image processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return {
        processedImages: [],
        errors,
      };
    }
  }

  /**
   * Find contextual images for specific entities
   */
  async findContextualImages(
    playerNames: string[],
    clubNames: string[],
    transferType: string = "signing",
  ): Promise<{
    images: ImageSource[];
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      const contextualImages = await this.sourcingService.findContextualImages(
        playerNames,
        clubNames,
        transferType,
      );

      return {
        images: [
          ...contextualImages.players,
          ...contextualImages.clubs,
          ...contextualImages.contextual,
        ],
        errors,
      };
    } catch (error) {
      errors.push(
        `Contextual image search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return {
        images: [],
        errors,
      };
    }
  }

  /**
   * Source images from all available channels
   */
  private async sourceImages(
    contentAnalyses: ContentAnalysis[],
    twitterMedia: Array<{
      tweetId: string;
      media: TweetMediaInfo[];
      authorHandle: string;
    }>,
    errors: string[],
    warnings: string[],
  ): Promise<ImageSource[]> {
    const allImages: ImageSource[] = [];

    // Extract Twitter images
    for (const { tweetId, media, authorHandle } of twitterMedia) {
      try {
        const twitterImages = await this.sourcingService.extractTwitterImages(
          media,
          tweetId,
          authorHandle,
        );
        allImages.push(...twitterImages);
      } catch (error) {
        warnings.push(
          `Failed to extract Twitter images for tweet ${tweetId}: ${error}`,
        );
      }
    }

    // Search Wikipedia for relevant images
    const allPlayerNames = contentAnalyses.flatMap((analysis) =>
      analysis.entities.players.map((p) => p.name),
    );
    const allClubNames = contentAnalyses.flatMap((analysis) =>
      analysis.entities.clubs.map((c) => c.name),
    );

    if (allPlayerNames.length > 0 || allClubNames.length > 0) {
      try {
        const contextualImages =
          await this.sourcingService.findContextualImages(
            [...new Set(allPlayerNames)], // Deduplicate
            [...new Set(allClubNames)],
            "signing",
          );

        allImages.push(
          ...contextualImages.players,
          ...contextualImages.clubs,
          ...contextualImages.contextual,
        );
      } catch (error) {
        warnings.push(`Wikipedia image search failed: ${error}`);
      }
    }

    // Filter and deduplicate
    const filteredImages = allImages
      .filter(
        (img) => img.metadata.relevanceScore >= this.config.minRelevanceScore,
      )
      .slice(0, this.config.maxImagesPerArticle);

    return filteredImages;
  }

  /**
   * Process sourced images
   */
  private async processImages(
    sourcedImages: ImageSource[],
    errors: string[],
    warnings: string[],
  ): Promise<ProcessedImage[]> {
    if (sourcedImages.length === 0) return [];

    try {
      const processedImages = await this.processor.processImages(
        sourcedImages,
        3,
      );

      // Validate processed images
      for (const image of processedImages) {
        const validation = this.processor.validateProcessedImage(image);
        if (!validation.valid) {
          warnings.push(
            `Image ${image.id} validation issues: ${validation.issues.join(", ")}`,
          );
        }
      }

      return processedImages;
    } catch (error) {
      errors.push(
        `Image processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return [];
    }
  }

  /**
   * Create article layout
   */
  private async createLayout(
    sections: ArticleSection[],
    processedImages: ProcessedImage[],
    contentAnalyses: ContentAnalysis[],
    errors: string[],
    warnings: string[],
  ): Promise<ArticleLayout | undefined> {
    try {
      const layout = await this.placementService.createArticleLayout(
        sections,
        processedImages,
        contentAnalyses,
      );

      // Validate layout
      if (layout.metadata.averageRelevance < 50) {
        warnings.push("Low average image relevance in layout");
      }

      if (layout.performance.totalImageSize > 5000000) {
        // 5MB
        warnings.push("Large total image size may impact loading performance");
      }

      return layout;
    } catch (error) {
      errors.push(
        `Layout creation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return undefined;
    }
  }

  /**
   * Calculate pipeline metrics
   */
  private calculatePipelineMetrics(
    sourcedImages: ImageSource[],
    processedImages: ProcessedImage[],
    articleLayout: ArticleLayout | undefined,
    totalProcessingTime: number,
  ): ImagePipelineResult["metrics"] {
    const averageRelevance =
      sourcedImages.length > 0
        ? sourcedImages.reduce(
            (sum, img) => sum + img.metadata.relevanceScore,
            0,
          ) / sourcedImages.length
        : 0;

    const totalImageSize = processedImages.reduce(
      (sum, img) => sum + img.variants.large.fileSize,
      0,
    );

    const totalOriginalSize = processedImages.reduce(
      (sum, img) => sum + img.optimization.originalSize,
      0,
    );

    const compressionRatio =
      totalOriginalSize > 0
        ? (totalOriginalSize - totalImageSize) / totalOriginalSize
        : 0;

    const imagesPlaced =
      articleLayout?.sections.reduce(
        (sum, section) => sum + section.placements.length,
        0,
      ) || 0;

    return {
      totalProcessingTime,
      imagesSourced: sourcedImages.length,
      imagesProcessed: processedImages.length,
      imagesPlaced,
      averageRelevance: Math.round(averageRelevance),
      totalImageSize,
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      cdnDeliveryEnabled: this.config.enableCdn,
    };
  }

  /**
   * Get pipeline configuration
   */
  getConfig(): ImagePipelineConfig {
    return this.config;
  }

  /**
   * Get service statistics
   */
  async getServiceStats(): Promise<{
    sourcing: ReturnType<ImageSourcingService["getCacheStats"]>;
    processing: ReturnType<ImageProcessor["getProcessingStats"]>;
  }> {
    return {
      sourcing: this.sourcingService.getCacheStats(),
      processing: this.processor.getProcessingStats(),
    };
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.sourcingService.clearCache();
  }
}

// Export individual services for direct use
export { ImageSourcingService, ImageProcessor, ImagePlacementService };
