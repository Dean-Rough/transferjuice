/**
 * Image Processor Tests
 * Comprehensive testing for image processing pipeline including optimization and AI alt text
 */

import { ImageProcessor, type ProcessedImage } from '@/lib/image/processor';
import type { ImageSource } from '@/lib/image/sourcing';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');
const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

// Mock fetch globally
global.fetch = jest.fn();

describe('ImageProcessor', () => {
  let processor: ImageProcessor;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
  let mockOpenAIInstance: jest.Mocked<OpenAI>;

  beforeEach(() => {
    mockOpenAIInstance = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    } as any;

    mockOpenAI.mockImplementation(() => mockOpenAIInstance);

    processor = new ImageProcessor({
      openaiApiKey: 'test-key',
      userAgent: 'Transfer-Juice-Test/1.0',
      enableCdn: false, // Disable CDN for tests
    });

    mockFetch.mockClear();
  });

  describe('Single Image Processing', () => {
    const mockImageSource: ImageSource = {
      id: 'test_image_123',
      url: 'https://example.com/test-image.jpg',
      source: 'twitter',
      type: 'player',
      title: 'Declan Rice signing photo',
      altText: 'Player holding Arsenal jersey',
      attribution: '@FabrizioRomano on Twitter',
      license: 'Twitter Terms of Service',
      dimensions: { width: 800, height: 600 },
      metadata: {
        tweetId: 'tweet_123',
        authorHandle: 'FabrizioRomano',
        relevanceScore: 85,
      },
      quality: {
        resolution: 'high',
        format: 'jpeg',
        fileSize: 150000,
      },
    };

    it('should process image successfully', async () => {
      // Mock image download
      const mockImageBuffer = Buffer.from('mock-image-data');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer),
      } as Response);

      // Mock AI alt text generation
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: 'Declan Rice holding Arsenal jersey at Emirates Stadium',
            },
          },
        ],
      } as any);

      const result = await processor.processImage(mockImageSource);

      expect(result).toMatchObject({
        id: 'processed_test_image_123',
        originalUrl: mockImageSource.url,
        source: 'twitter',
        type: 'player',
        altText: 'Declan Rice holding Arsenal jersey at Emirates Stadium',
        variants: {
          thumbnail: expect.objectContaining({
            width: 150,
            height: 150,
          }),
          medium: expect.objectContaining({
            width: 400,
            height: 300,
          }),
          large: expect.objectContaining({
            width: 800,
            height: 600,
          }),
        },
      });
    });

    it('should handle image download failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(processor.processImage(mockImageSource)).rejects.toThrow(
        'Failed to download image: 404'
      );
    });

    it('should fallback to original alt text if AI fails', async () => {
      const mockImageBuffer = Buffer.from('mock-image-data');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer),
      } as Response);

      // Mock AI failure
      mockOpenAIInstance.chat.completions.create.mockRejectedValueOnce(
        new Error('API timeout')
      );

      const result = await processor.processImage(mockImageSource);

      expect(result.altText).toBe(mockImageSource.altText);
    });

    it('should generate accessible alt text with proper length', async () => {
      const mockImageBuffer = Buffer.from('mock-image-data');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer),
      } as Response);

      // Mock AI response that's too long (over 125 characters)
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content:
                'A very long description that exceeds the 125 character limit and should definitely be rejected in favor of the original alt text which is much shorter',
            },
          },
        ],
      } as any);

      const result = await processor.processImage(mockImageSource);

      // Should fallback to original alt text
      expect(result.altText).toBe(mockImageSource.altText);
      expect(result.altText.length).toBeLessThanOrEqual(125);
    });
  });

  describe('Batch Image Processing', () => {
    const mockImageSources: ImageSource[] = [
      {
        id: 'image_1',
        url: 'https://example.com/image1.jpg',
        source: 'twitter',
        type: 'player',
        title: 'Player 1',
        altText: 'Player 1 image',
        attribution: 'Twitter',
        license: 'Twitter TOS',
        dimensions: { width: 800, height: 600 },
        metadata: { relevanceScore: 80 },
        quality: { resolution: 'high', format: 'jpeg' },
      },
      {
        id: 'image_2',
        url: 'https://example.com/image2.jpg',
        source: 'wikipedia',
        type: 'club',
        title: 'Club Badge',
        altText: 'Club badge',
        attribution: 'Wikipedia',
        license: 'CC BY-SA',
        dimensions: { width: 400, height: 400 },
        metadata: { relevanceScore: 75 },
        quality: { resolution: 'medium', format: 'png' },
      },
    ];

    it('should process multiple images with concurrency control', async () => {
      // Mock successful downloads
      const mockImageBuffer = Buffer.from('mock-image-data');
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer),
      } as Response);

      // Mock AI responses
      mockOpenAIInstance.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Enhanced alt text 1' } }],
        } as any)
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Enhanced alt text 2' } }],
        } as any);

      const results = await processor.processImages(mockImageSources, 2);

      expect(results).toHaveLength(2);
      expect(results[0].altText).toBe('Enhanced alt text 1');
      expect(results[1].altText).toBe('Enhanced alt text 2');
    });

    it('should handle partial failures in batch processing', async () => {
      const mockImageBuffer = Buffer.from('mock-image-data');

      // First image succeeds, second fails
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response);

      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Enhanced alt text' } }],
      } as any);

      const results = await processor.processImages(mockImageSources, 2);

      // Should return only the successful one
      expect(results).toHaveLength(1);
      expect(results[0].altText).toBe('Enhanced alt text');
    });
  });

  describe('Image Optimization', () => {
    const mockImageSource: ImageSource = {
      id: 'optimization_test',
      url: 'https://example.com/large-image.jpg',
      source: 'wikipedia',
      type: 'player',
      title: 'Large Image',
      altText: 'Large test image',
      attribution: 'Wikipedia',
      license: 'CC BY-SA',
      dimensions: { width: 2000, height: 1500 },
      metadata: { relevanceScore: 90 },
      quality: { resolution: 'high', format: 'jpeg', fileSize: 500000 },
    };

    it('should calculate compression metrics correctly', async () => {
      const mockImageBuffer = Buffer.alloc(500000); // 500KB original
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer),
      } as Response);

      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Optimized alt text' } }],
      } as any);

      const result = await processor.processImage(mockImageSource);

      expect(result.optimization).toMatchObject({
        originalSize: 500000,
        optimizedSize: expect.any(Number),
        compressionRatio: expect.any(Number),
        format: 'jpeg',
        quality: 85, // Default compression quality
      });

      expect(result.optimization.compressionRatio).toBeGreaterThan(0);
      expect(result.optimization.optimizedSize).toBeLessThan(
        result.optimization.originalSize
      );
    });

    it('should create proper image variants', async () => {
      const mockImageBuffer = Buffer.from('mock-image-data');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer),
      } as Response);

      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Test alt text' } }],
      } as any);

      const result = await processor.processImage(mockImageSource);

      expect(result.variants).toMatchObject({
        thumbnail: {
          width: 150,
          height: 150,
          fileSize: expect.any(Number),
          url: expect.stringContaining('_thumb'),
        },
        medium: {
          width: 400,
          height: 300,
          fileSize: expect.any(Number),
          url: expect.stringContaining('_medium'),
        },
        large: {
          width: 800,
          height: 600,
          fileSize: expect.any(Number),
          url: expect.stringContaining('_large'),
        },
      });

      // File sizes should increase with image size
      expect(result.variants.thumbnail.fileSize).toBeLessThan(
        result.variants.medium.fileSize
      );
      expect(result.variants.medium.fileSize).toBeLessThan(
        result.variants.large.fileSize
      );
    });
  });

  describe('Accessibility Features', () => {
    it('should generate detailed descriptions for accessibility', async () => {
      const mockImageSource: ImageSource = {
        id: 'accessibility_test',
        url: 'https://example.com/accessible-image.jpg',
        source: 'twitter',
        type: 'player',
        title: 'Player celebration',
        altText: 'Player celebrating goal',
        attribution: 'Twitter',
        license: 'Twitter TOS',
        dimensions: { width: 800, height: 600 },
        metadata: { relevanceScore: 85 },
        quality: { resolution: 'high', format: 'jpeg' },
      };

      const mockImageBuffer = Buffer.from('mock-image-data');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer),
      } as Response);

      // Mock AI responses for alt text and description
      mockOpenAIInstance.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: 'Player celebrating decisive goal in front of fans',
              },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content:
                  'The player raises both arms in celebration after scoring what appears to be a crucial goal, with excited fans visible in the background.',
              },
            },
          ],
        } as any);

      const result = await processor.processImage(mockImageSource);

      expect(result.accessibility).toMatchObject({
        altText: 'Player celebrating decisive goal in front of fans',
        description: expect.stringContaining('celebration'),
        readabilityScore: expect.any(Number),
        colorContrast: expect.any(Number),
      });

      expect(result.accessibility.readabilityScore).toBeGreaterThanOrEqual(0);
      expect(result.accessibility.readabilityScore).toBeLessThanOrEqual(100);
      expect(result.accessibility.colorContrast).toBeGreaterThan(0);
    });

    it('should calculate readability scores correctly', async () => {
      const mockImageSource: ImageSource = {
        id: 'readability_test',
        url: 'https://example.com/test.jpg',
        source: 'wikipedia',
        type: 'club',
        title: 'Club Stadium',
        altText:
          'Modern football stadium with excellent facilities and atmosphere',
        attribution: 'Wikipedia',
        license: 'CC BY-SA',
        dimensions: { width: 800, height: 600 },
        metadata: { relevanceScore: 80 },
        quality: { resolution: 'high', format: 'jpeg' },
      };

      const mockImageBuffer = Buffer.from('mock-image-data');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer),
      } as Response);

      mockOpenAIInstance.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{ message: { content: mockImageSource.altText } }],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: 'Detailed description of the stadium' } },
          ],
        } as any);

      const result = await processor.processImage(mockImageSource);

      // Good length alt text should score well
      expect(result.accessibility.readabilityScore).toBeGreaterThan(70);
    });
  });

  describe('Image Validation', () => {
    it('should validate processed images correctly', () => {
      const validProcessedImage: ProcessedImage = {
        id: 'valid_image',
        originalUrl: 'https://example.com/original.jpg',
        processedUrl: 'https://example.com/processed.jpg',
        source: 'twitter',
        type: 'player',
        title: 'Valid Image',
        altText: 'Valid alt text with good length',
        attribution: 'Twitter',
        license: 'Twitter TOS',
        variants: {
          thumbnail: {
            url: 'thumb.jpg',
            width: 150,
            height: 150,
            fileSize: 10000,
          },
          medium: {
            url: 'medium.jpg',
            width: 400,
            height: 300,
            fileSize: 30000,
          },
          large: { url: 'large.jpg', width: 800, height: 600, fileSize: 70000 },
        },
        optimization: {
          originalSize: 100000,
          optimizedSize: 70000,
          compressionRatio: 0.3,
          format: 'jpeg',
          quality: 85,
        },
        accessibility: {
          altText: 'Valid alt text with good length',
          description: 'Detailed description',
          readabilityScore: 85,
          colorContrast: 4.5,
        },
        metadata: {
          processedAt: new Date(),
          processingTime: 1000,
          aiModel: 'gpt-4-vision-preview',
          cacheable: true,
          expiresAt: new Date(Date.now() + 86400000),
        },
      };

      const validation = processor.validateProcessedImage(validProcessedImage);

      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should identify validation issues', () => {
      const invalidProcessedImage: Partial<ProcessedImage> = {
        id: 'invalid_image',
        altText: 'Short', // Too short
        optimization: {
          originalSize: 100000,
          optimizedSize: 95000,
          compressionRatio: 0.05, // Insufficient compression
          format: 'jpeg',
          quality: 85,
        },
        accessibility: {
          altText: 'Short',
          description: 'Description',
          readabilityScore: 60, // Low score
        },
        variants: {
          thumbnail: {
            url: 'thumb.jpg',
            width: 150,
            height: 150,
            fileSize: 10000,
          },
          // Missing medium and large variants
        },
      } as ProcessedImage;

      const validation = processor.validateProcessedImage(
        invalidProcessedImage
      );

      expect(validation.valid).toBe(false);
      expect(validation.issues).toContain('Alt text too short');
      expect(validation.issues).toContain('Insufficient compression');
      expect(validation.issues).toContain('Low readability score');
    });
  });

  describe('Configuration and Statistics', () => {
    it('should return processing statistics', () => {
      const stats = processor.getProcessingStats();

      expect(stats).toMatchObject({
        supportedFormats: expect.arrayContaining([
          'jpeg',
          'jpg',
          'png',
          'webp',
        ]),
        variantSizes: {
          thumbnail: { width: 150, height: 150, quality: 80 },
          medium: { width: 400, height: 300, quality: 85 },
          large: { width: 800, height: 600, quality: 90 },
        },
        compressionQuality: 85,
        cdnEnabled: false,
      });
    });

    it('should use custom configuration', () => {
      const customProcessor = new ImageProcessor({
        openaiApiKey: 'test-key',
        userAgent: 'Test/1.0',
        compressionQuality: 70,
        enableCdn: true,
        cdnBaseUrl: 'https://custom-cdn.com',
      });

      const stats = customProcessor.getProcessingStats();

      expect(stats.compressionQuality).toBe(70);
      expect(stats.cdnEnabled).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      const mockImageSource: ImageSource = {
        id: 'timeout_test',
        url: 'https://slow-server.com/image.jpg',
        source: 'twitter',
        type: 'player',
        title: 'Timeout Test',
        altText: 'Test image',
        attribution: 'Twitter',
        license: 'Twitter TOS',
        dimensions: { width: 800, height: 600 },
        metadata: { relevanceScore: 80 },
        quality: { resolution: 'high', format: 'jpeg' },
      };

      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(processor.processImage(mockImageSource)).rejects.toThrow(
        'Image processing failed'
      );
    });

    it('should handle OpenAI API errors gracefully', async () => {
      const mockImageSource: ImageSource = {
        id: 'ai_error_test',
        url: 'https://example.com/test.jpg',
        source: 'twitter',
        type: 'player',
        title: 'AI Error Test',
        altText: 'Original alt text',
        attribution: 'Twitter',
        license: 'Twitter TOS',
        dimensions: { width: 800, height: 600 },
        metadata: { relevanceScore: 80 },
        quality: { resolution: 'high', format: 'jpeg' },
      };

      const mockImageBuffer = Buffer.from('mock-image-data');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer),
      } as Response);

      // Mock API failure
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const result = await processor.processImage(mockImageSource);

      // Should fallback to original alt text
      expect(result.altText).toBe('Original alt text');
    });
  });
});
