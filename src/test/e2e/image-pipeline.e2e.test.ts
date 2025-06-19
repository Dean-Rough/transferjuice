/**
 * Image Pipeline End-to-End Tests
 * Comprehensive testing of the complete image integration pipeline
 */

import {
  ImagePipeline,
  type ImagePipelineConfig,
  type ImagePipelineResult,
} from '@/lib/image';
import type { ArticleSection } from '@/lib/ai/article-generator';
import type { ContentAnalysis } from '@/lib/ai/content-analyzer';
import type { TweetMediaInfo } from '@/lib/twitter/client';
import OpenAI from 'openai';

// Mock external dependencies
jest.mock('openai');
const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

global.fetch = jest.fn();

describe('Image Pipeline E2E Tests', () => {
  let pipeline: ImagePipeline;
  let mockOpenAIInstance: jest.Mocked<OpenAI>;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  const mockConfig: ImagePipelineConfig = {
    openaiApiKey: 'test-openai-key',
    userAgent: 'Transfer-Juice-Test/1.0',
    enableCaching: false,
    enableCdn: false,
    maxImagesPerArticle: 5,
    minRelevanceScore: 60,
  };

  beforeEach(() => {
    mockOpenAIInstance = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    } as any;

    mockOpenAI.mockImplementation(() => mockOpenAIInstance);

    pipeline = new ImagePipeline(mockConfig);
    mockFetch.mockClear();
  });

  describe('Complete Article Processing', () => {
    const mockSections: ArticleSection[] = [
      {
        id: 'section_intro_1',
        type: 'intro',
        title: 'The Latest Chaos',
        content:
          'Manchester United are close to signing Declan Rice from West Ham for £100m. Arsenal are also interested in the England midfielder.',
        order: 1,
        sourceTweets: ['tweet_123'],
        terryisms: ['close to signing', '(of course)'],
      },
      {
        id: 'section_main_2',
        type: 'main',
        title: 'The Main Event',
        content:
          "Rice has been United's primary target all summer. The 24-year-old midfielder would provide the defensive stability Solskjaer has been seeking.",
        order: 2,
        sourceTweets: ['tweet_124'],
        terryisms: ['primary target', 'defensive stability'],
      },
    ];

    const mockContentAnalyses: ContentAnalysis[] = [
      {
        tweetId: 'tweet_123',
        classification: {
          isTransferRelated: true,
          transferType: 'RUMOUR',
          priority: 'HIGH',
          confidence: 0.95,
          categories: ['signing'],
          keyPoints: ['Manchester United', 'Declan Rice', 'West Ham', '£100m'],
        },
        entities: {
          players: [{ name: 'Declan Rice', confidence: 0.98 }],
          clubs: [
            { name: 'Manchester United', confidence: 0.95 },
            { name: 'West Ham', confidence: 0.9 },
            { name: 'Arsenal', confidence: 0.85 },
          ],
          transferDetails: [{ type: 'fee', value: '£100m', confidence: 0.95 }],
          agents: [],
        },
        sentiment: {
          sentiment: 'positive',
          confidence: 0.85,
          emotions: ['excitement'],
          reliability: 0.9,
          urgency: 0.8,
        },
        qualityScore: 92,
        terryCompatibility: 88,
        processingTime: 450,
        aiModel: 'gpt-4-turbo-preview',
      },
      {
        tweetId: 'tweet_124',
        classification: {
          isTransferRelated: true,
          transferType: 'CONFIRMED',
          priority: 'HIGH',
          confidence: 0.92,
          categories: ['signing'],
          keyPoints: ['Declan Rice', 'Manchester United', 'midfielder'],
        },
        entities: {
          players: [{ name: 'Declan Rice', confidence: 0.96 }],
          clubs: [{ name: 'Manchester United', confidence: 0.93 }],
          transferDetails: [],
          agents: [],
        },
        sentiment: {
          sentiment: 'positive',
          confidence: 0.8,
          emotions: ['optimism'],
          reliability: 0.85,
          urgency: 0.7,
        },
        qualityScore: 88,
        terryCompatibility: 85,
        processingTime: 400,
        aiModel: 'gpt-4-turbo-preview',
      },
    ];

    const mockTwitterMedia = [
      {
        tweetId: 'tweet_123',
        media: [
          {
            media_key: 'twitter_media_123',
            type: 'photo' as const,
            url: 'https://pbs.twimg.com/media/rice_signing.jpg',
            alt_text: 'Declan Rice signing announcement',
            width: 1200,
            height: 800,
          },
        ],
        authorHandle: 'FabrizioRomano',
      },
    ];

    it('should process complete article with images successfully', async () => {
      // Mock Wikipedia API response
      const mockWikipediaResponse = {
        query: {
          pages: {
            '12345': {
              pageid: 12345,
              title: 'Declan Rice',
              imageinfo: [
                {
                  url: 'https://upload.wikimedia.org/wikipedia/commons/rice.jpg',
                  width: 800,
                  height: 600,
                  size: 120000,
                  extmetadata: {
                    ObjectName: { value: 'Declan Rice England' },
                    ImageDescription: {
                      value: 'Declan Rice playing for England',
                    },
                    LicenseShortName: { value: 'CC BY-SA 3.0' },
                    Attribution: { value: 'Wikipedia Commons' },
                  },
                },
              ],
            },
          },
        },
      };

      // Mock Twitter image download
      const mockTwitterImageBuffer = Buffer.from('twitter-image-data');
      // Mock Wikipedia image download
      const mockWikipediaImageBuffer = Buffer.from('wikipedia-image-data');

      mockFetch
        // Wikipedia API call
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWikipediaResponse),
        } as Response)
        // Twitter image download
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockTwitterImageBuffer.buffer),
        } as Response)
        // Wikipedia image download
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockWikipediaImageBuffer.buffer),
        } as Response);

      // Mock OpenAI responses for image processing and placement
      mockOpenAIInstance.chat.completions.create
        // Alt text generation for Twitter image
        .mockResolvedValueOnce({
          choices: [
            { message: { content: 'Declan Rice signing announcement photo' } },
          ],
        } as any)
        // Description generation for Twitter image
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content:
                  'Official announcement of Declan Rice transfer with signing photo',
              },
            },
          ],
        } as any)
        // Alt text generation for Wikipedia image
        .mockResolvedValueOnce({
          choices: [
            {
              message: { content: 'Declan Rice in England national team kit' },
            },
          ],
        } as any)
        // Description generation for Wikipedia image
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content:
                  'Declan Rice representing England national team during international match',
              },
            },
          ],
        } as any)
        // Topic relevance scoring
        .mockResolvedValueOnce({
          choices: [{ message: { content: '95' } }],
        } as any)
        .mockResolvedValueOnce({
          choices: [{ message: { content: '88' } }],
        } as any)
        // Caption generation
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: 'Declan Rice signing announcement (Twitter)',
              },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: 'Declan Rice in England colors (Wikipedia Commons)',
              },
            },
          ],
        } as any);

      const result = await pipeline.processArticleImages(
        mockSections,
        mockContentAnalyses,
        mockTwitterMedia
      );

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metrics.imagesSourced).toBeGreaterThan(0);
      expect(result.metrics.imagesProcessed).toBeGreaterThan(0);
      expect(result.metrics.imagesPlaced).toBeGreaterThan(0);
      expect(result.metrics.averageRelevance).toBeGreaterThan(60);

      // Check that images were sourced
      expect(result.sourcedImages).toHaveLength(2); // Twitter + Wikipedia
      expect(result.sourcedImages.some((img) => img.source === 'twitter')).toBe(
        true
      );
      expect(
        result.sourcedImages.some((img) => img.source === 'wikipedia')
      ).toBe(true);

      // Check that images were processed
      expect(result.processedImages).toHaveLength(2);
      result.processedImages.forEach((img) => {
        expect(img.variants.thumbnail).toBeDefined();
        expect(img.variants.medium).toBeDefined();
        expect(img.variants.large).toBeDefined();
        expect(img.accessibility.altText).toBeTruthy();
        expect(img.optimization.compressionRatio).toBeGreaterThan(0);
      });

      // Check that layout was created
      expect(result.articleLayout).toBeDefined();
      expect(result.articleLayout?.heroImage).toBeDefined();
      expect(result.articleLayout?.sections).toHaveLength(2);
      expect(result.articleLayout?.metadata.totalImages).toBeGreaterThan(0);
    }, 30000); // Increased timeout for comprehensive test

    it('should handle articles with no suitable images', async () => {
      // Mock empty responses
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ query: { pages: {} } }),
      } as Response);

      const result = await pipeline.processArticleImages(
        mockSections,
        mockContentAnalyses,
        [] // No Twitter media
      );

      expect(result.success).toBe(true);
      expect(result.warnings).toContain(
        'No images sourced - article will have no images'
      );
      expect(result.metrics.imagesSourced).toBe(0);
      expect(result.metrics.imagesProcessed).toBe(0);
      expect(result.metrics.imagesPlaced).toBe(0);
      expect(result.articleLayout).toBeUndefined();
    });

    it('should handle partial failures gracefully', async () => {
      // Mock partial Wikipedia response
      const mockPartialResponse = {
        query: {
          pages: {
            '12345': {
              pageid: 12345,
              title: 'Declan Rice',
              imageinfo: [
                {
                  url: 'https://upload.wikimedia.org/wikipedia/commons/rice.jpg',
                  width: 800,
                  height: 600,
                  size: 120000,
                  extmetadata: {
                    ImageDescription: { value: 'Declan Rice' },
                  },
                },
              ],
            },
          },
        },
      };

      mockFetch
        // Wikipedia API success
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPartialResponse),
        } as Response)
        // Twitter image download failure
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as Response)
        // Wikipedia image download success
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(Buffer.from('wiki-image').buffer),
        } as Response);

      // Mock OpenAI responses
      mockOpenAIInstance.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Declan Rice playing football' } }],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: 'Declan Rice in action on the football pitch',
              },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [{ message: { content: '85' } }],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            {
              message: { content: 'Declan Rice in action (Wikipedia Commons)' },
            },
          ],
        } as any);

      const result = await pipeline.processArticleImages(
        mockSections,
        mockContentAnalyses,
        mockTwitterMedia
      );

      expect(result.success).toBe(true);
      expect(result.metrics.imagesSourced).toBe(1); // Only Wikipedia
      expect(result.metrics.imagesProcessed).toBe(1);
      expect(result.processedImages).toHaveLength(1);
      expect(result.processedImages[0].source).toBe('wikipedia');
    });
  });

  describe('Single Tweet Processing', () => {
    const mockTweetMedia: TweetMediaInfo[] = [
      {
        media_key: 'tweet_media_456',
        type: 'photo',
        url: 'https://pbs.twimg.com/media/transfer_news.jpg',
        alt_text: 'Transfer announcement photo',
        width: 1000,
        height: 750,
      },
    ];

    const mockContentAnalysis: ContentAnalysis = {
      tweetId: 'tweet_456',
      classification: {
        isTransferRelated: true,
        transferType: 'CONFIRMED',
        priority: 'HIGH',
        confidence: 0.9,
        categories: ['signing'],
        keyPoints: ['Transfer', 'Confirmed'],
      },
      entities: {
        players: [{ name: 'Test Player', confidence: 0.9 }],
        clubs: [{ name: 'Test Club', confidence: 0.85 }],
        transferDetails: [],
        agents: [],
      },
      sentiment: {
        sentiment: 'positive',
        confidence: 0.8,
        emotions: ['excitement'],
        reliability: 0.85,
        urgency: 0.7,
      },
      qualityScore: 85,
      terryCompatibility: 80,
      processingTime: 400,
      aiModel: 'gpt-4-turbo-preview',
    };

    it('should process tweet images successfully', async () => {
      // Mock image download
      const mockImageBuffer = Buffer.from('tweet-image-data');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer),
      } as Response);

      // Mock OpenAI responses
      mockOpenAIInstance.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: 'Official transfer announcement with player photo',
              },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content:
                  'Player officially announced as new signing for the club',
              },
            },
          ],
        } as any);

      const result = await pipeline.processTweetImages(
        mockTweetMedia,
        'tweet_456',
        'TransferExpert',
        mockContentAnalysis
      );

      expect(result.errors).toHaveLength(0);
      expect(result.processedImages).toHaveLength(1);

      const processedImage = result.processedImages[0];
      expect(processedImage.source).toBe('twitter');
      expect(processedImage.type).toBe('news');
      expect(processedImage.altText).toBe(
        'Official transfer announcement with player photo'
      );
      expect(processedImage.variants).toMatchObject({
        thumbnail: expect.objectContaining({ width: 150, height: 150 }),
        medium: expect.objectContaining({ width: 400, height: 300 }),
        large: expect.objectContaining({ width: 800, height: 600 }),
      });
    });

    it('should handle tweet with no media', async () => {
      const result = await pipeline.processTweetImages(
        [], // No media
        'tweet_empty',
        'TestUser'
      );

      expect(result.errors).toHaveLength(0);
      expect(result.processedImages).toHaveLength(0);
    });
  });

  describe('Contextual Image Search', () => {
    it('should find contextual images for entities', async () => {
      // Mock Wikipedia responses for different search terms
      const mockPlayerResponse = {
        query: {
          pages: {
            '11111': {
              pageid: 11111,
              title: 'Harry Kane',
              imageinfo: [
                {
                  url: 'https://upload.wikimedia.org/wikipedia/commons/kane.jpg',
                  width: 800,
                  height: 600,
                  extmetadata: {
                    ImageDescription: {
                      value: 'Harry Kane playing for England',
                    },
                  },
                },
              ],
            },
          },
        },
      };

      const mockClubResponse = {
        query: {
          pages: {
            '22222': {
              pageid: 22222,
              title: 'Bayern Munich',
              imageinfo: [
                {
                  url: 'https://upload.wikimedia.org/wikipedia/commons/bayern.jpg',
                  width: 600,
                  height: 600,
                  extmetadata: {
                    ImageDescription: { value: 'Bayern Munich badge' },
                  },
                },
              ],
            },
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPlayerResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockClubResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ query: { pages: {} } }),
        } as Response);

      const result = await pipeline.findContextualImages(
        ['Harry Kane'],
        ['Bayern Munich'],
        'signing'
      );

      expect(result.errors).toHaveLength(0);
      expect(result.images).toHaveLength(2);
      expect(result.images.some((img) => img.type === 'player')).toBe(true);
      expect(result.images.some((img) => img.type === 'club')).toBe(true);
    });

    it('should handle API failures in contextual search', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await pipeline.findContextualImages(
        ['Test Player'],
        ['Test Club'],
        'signing'
      );

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Contextual image search failed');
      expect(result.images).toHaveLength(0);
    });
  });

  describe('Performance and Quality Metrics', () => {
    it('should provide accurate performance metrics', async () => {
      // Mock minimal successful pipeline
      const mockWikipediaResponse = {
        query: {
          pages: {
            '12345': {
              pageid: 12345,
              title: 'Test Player',
              imageinfo: [
                {
                  url: 'https://upload.wikimedia.org/wikipedia/commons/test.jpg',
                  width: 800,
                  height: 600,
                  size: 100000,
                  extmetadata: {
                    ImageDescription: { value: 'Test player' },
                  },
                },
              ],
            },
          },
        },
      };

      const mockImageBuffer = Buffer.alloc(100000); // 100KB
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWikipediaResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer),
        } as Response);

      // Mock OpenAI responses
      mockOpenAIInstance.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Test player image' } }],
        } as any)
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Test player description' } }],
        } as any)
        .mockResolvedValueOnce({
          choices: [{ message: { content: '80' } }],
        } as any)
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Test image caption' } }],
        } as any);

      const result = await pipeline.processArticleImages(
        mockSections,
        mockContentAnalyses,
        []
      );

      expect(result.metrics).toMatchObject({
        totalProcessingTime: expect.any(Number),
        imagesSourced: 1,
        imagesProcessed: 1,
        imagesPlaced: expect.any(Number),
        averageRelevance: expect.any(Number),
        totalImageSize: expect.any(Number),
        compressionRatio: expect.any(Number),
        cdnDeliveryEnabled: false,
      });

      expect(result.metrics.totalProcessingTime).toBeGreaterThan(0);
      expect(result.metrics.compressionRatio).toBeGreaterThan(0);
    });

    it('should track quality thresholds correctly', async () => {
      const highQualityPipeline = new ImagePipeline({
        ...mockConfig,
        minRelevanceScore: 90, // Very high threshold
      });

      // Mock low-quality response
      const mockLowQualityResponse = {
        query: {
          pages: {
            '12345': {
              pageid: 12345,
              title: 'Random image',
              imageinfo: [
                {
                  url: 'https://upload.wikimedia.org/wikipedia/commons/random.jpg',
                  width: 200,
                  height: 150,
                  extmetadata: {
                    ImageDescription: { value: 'Random image' },
                  },
                },
              ],
            },
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLowQualityResponse),
      } as Response);

      const result = await highQualityPipeline.processArticleImages(
        mockSections,
        mockContentAnalyses,
        []
      );

      // Should filter out low-quality images
      expect(result.metrics.imagesSourced).toBe(0);
      expect(result.warnings).toContain(
        'No images sourced - article will have no images'
      );
    });
  });

  describe('Service Statistics and Configuration', () => {
    it('should provide service statistics', async () => {
      const stats = await pipeline.getServiceStats();

      expect(stats).toMatchObject({
        sourcing: {
          size: expect.any(Number),
          keys: expect.any(Array),
        },
        processing: {
          supportedFormats: expect.arrayContaining([
            'jpeg',
            'jpg',
            'png',
            'webp',
          ]),
          variantSizes: expect.any(Object),
          compressionQuality: expect.any(Number),
          cdnEnabled: expect.any(Boolean),
        },
      });
    });

    it('should return correct configuration', () => {
      const config = pipeline.getConfig();

      expect(config).toMatchObject({
        openaiApiKey: 'test-openai-key',
        userAgent: 'Transfer-Juice-Test/1.0',
        enableCaching: false,
        enableCdn: false,
        maxImagesPerArticle: 5,
        minRelevanceScore: 60,
      });
    });

    it('should clear caches when requested', () => {
      pipeline.clearCaches();

      // Should not throw and should be callable
      expect(() => pipeline.clearCaches()).not.toThrow();
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from complete API failures', async () => {
      // Mock all external calls to fail
      mockFetch.mockRejectedValue(new Error('Complete network failure'));
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('OpenAI API down')
      );

      const result = await pipeline.processArticleImages(
        mockSections,
        mockContentAnalyses,
        mockTwitterMedia
      );

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.metrics.imagesSourced).toBe(0);
      expect(result.metrics.imagesProcessed).toBe(0);
      expect(result.metrics.totalProcessingTime).toBeGreaterThan(0);
    });

    it('should handle malformed configuration gracefully', () => {
      expect(() => {
        new ImagePipeline({
          openaiApiKey: '', // Invalid
          userAgent: 'Test/1.0',
        });
      }).toThrow(); // Should validate config
    });

    it('should handle concurrent processing correctly', async () => {
      const mockImageBuffer = Buffer.from('concurrent-test-data');

      // Mock successful responses for concurrent requests
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockImageBuffer.buffer),
      } as Response);

      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Concurrent test response' } }],
      } as any);

      const multipleTweetMedia = Array(3)
        .fill(null)
        .map((_, i) => ({
          tweetId: `concurrent_tweet_${i}`,
          media: [
            {
              media_key: `concurrent_media_${i}`,
              type: 'photo' as const,
              url: `https://example.com/concurrent${i}.jpg`,
              width: 800,
              height: 600,
            },
          ],
          authorHandle: `user${i}`,
        }));

      const concurrentPromises = multipleTweetMedia.map(
        ({ tweetId, media, authorHandle }) =>
          pipeline.processTweetImages(media, tweetId, authorHandle)
      );

      const results = await Promise.all(concurrentPromises);

      // All should succeed
      results.forEach((result) => {
        expect(result.errors).toHaveLength(0);
        expect(result.processedImages).toHaveLength(1);
      });
    });
  });
});
