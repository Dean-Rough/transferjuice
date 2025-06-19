/**
 * Image Placement Service Tests
 * Comprehensive testing for contextual image placement and AI-powered matching
 */

import {
  ImagePlacementService,
  type ImagePlacement,
  type ArticleLayout,
} from '@/lib/image/placement';
import type { ProcessedImage } from '@/lib/image/processor';
import type { ArticleSection } from '@/lib/ai/article-generator';
import type { ContentAnalysis } from '@/lib/ai/content-analyzer';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');
const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

describe('ImagePlacementService', () => {
  let service: ImagePlacementService;
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

    service = new ImagePlacementService({
      openaiApiKey: 'test-key',
      maxImagesPerSection: 2,
      minRelevanceScore: 60,
    });
  });

  describe('Article Layout Creation', () => {
    const mockSections: ArticleSection[] = [
      {
        id: 'section_intro_1',
        type: 'intro',
        title: 'The Latest Chaos',
        content:
          'Manchester United are reportedly close to signing Declan Rice from West Ham for a fee of £100m. The England midfielder has been a long-term target.',
        order: 1,
        sourceTweets: ['tweet_123'],
        terryisms: ['reportedly', '(of course)'],
      },
      {
        id: 'section_main_2',
        type: 'main',
        title: 'The Main Event',
        content:
          "Arsenal have also been linked with Rice throughout the summer, creating a London derby battle for his signature. The Gunners are prepared to match United's offer.",
        order: 2,
        sourceTweets: ['tweet_124'],
        terryisms: ['prepared to match'],
      },
    ];

    const mockProcessedImages: ProcessedImage[] = [
      {
        id: 'processed_rice_1',
        originalUrl: 'https://example.com/rice.jpg',
        processedUrl: 'https://cdn.example.com/rice_processed.jpg',
        source: 'wikipedia',
        type: 'player',
        title: 'Declan Rice',
        altText: 'Declan Rice playing for England',
        attribution: 'Wikipedia Commons',
        license: 'CC BY-SA',
        variants: {
          thumbnail: {
            url: 'rice_thumb.jpg',
            width: 150,
            height: 150,
            fileSize: 10000,
          },
          medium: {
            url: 'rice_medium.jpg',
            width: 400,
            height: 300,
            fileSize: 30000,
          },
          large: {
            url: 'rice_large.jpg',
            width: 800,
            height: 600,
            fileSize: 70000,
          },
        },
        optimization: {
          originalSize: 100000,
          optimizedSize: 70000,
          compressionRatio: 0.3,
          format: 'jpeg',
          quality: 85,
        },
        accessibility: {
          altText: 'Declan Rice playing for England',
          description:
            'England midfielder Declan Rice in action during a match',
          readabilityScore: 85,
          colorContrast: 4.5,
        },
        metadata: {
          processedAt: new Date(),
          processingTime: 1000,
          aiModel: 'gpt-4-vision-preview',
          cacheable: true,
        },
      },
      {
        id: 'processed_arsenal_1',
        originalUrl: 'https://example.com/arsenal.jpg',
        processedUrl: 'https://cdn.example.com/arsenal_processed.jpg',
        source: 'wikipedia',
        type: 'club',
        title: 'Arsenal FC',
        altText: 'Arsenal Football Club badge',
        attribution: 'Wikipedia Commons',
        license: 'CC BY-SA',
        variants: {
          thumbnail: {
            url: 'arsenal_thumb.jpg',
            width: 150,
            height: 150,
            fileSize: 8000,
          },
          medium: {
            url: 'arsenal_medium.jpg',
            width: 400,
            height: 300,
            fileSize: 25000,
          },
          large: {
            url: 'arsenal_large.jpg',
            width: 800,
            height: 600,
            fileSize: 60000,
          },
        },
        optimization: {
          originalSize: 80000,
          optimizedSize: 60000,
          compressionRatio: 0.25,
          format: 'png',
          quality: 85,
        },
        accessibility: {
          altText: 'Arsenal Football Club badge',
          description: 'The official crest of Arsenal Football Club',
          readabilityScore: 90,
        },
        metadata: {
          processedAt: new Date(),
          processingTime: 800,
          aiModel: 'gpt-4-vision-preview',
          cacheable: true,
        },
      },
    ];

    const mockContentAnalyses: ContentAnalysis[] = [
      {
        tweetId: 'tweet_123',
        classification: {
          isTransferRelated: true,
          transferType: 'RUMOUR',
          priority: 'HIGH',
          confidence: 0.9,
          categories: ['signing'],
          keyPoints: ['Manchester United', 'Declan Rice', '£100m'],
        },
        entities: {
          players: [{ name: 'Declan Rice', confidence: 0.95 }],
          clubs: [
            { name: 'Manchester United', confidence: 0.9 },
            { name: 'West Ham', confidence: 0.85 },
          ],
          transferDetails: [{ type: 'fee', value: '£100m', confidence: 0.9 }],
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
        processingTime: 500,
        aiModel: 'gpt-4-turbo-preview',
      },
    ];

    it('should create complete article layout', async () => {
      // Mock AI responses for topic matching and caption generation
      mockOpenAIInstance.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{ message: { content: '95' } }], // High topic relevance
        } as any)
        .mockResolvedValueOnce({
          choices: [{ message: { content: '88' } }], // High topic relevance
        } as any)
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: 'Declan Rice in England colors (Wikipedia Commons)',
              },
            },
          ], // Caption
        } as any)
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content:
                  'Arsenal badge representing the London club (Wikipedia Commons)',
              },
            },
          ], // Caption
        } as any);

      const layout = await service.createArticleLayout(
        mockSections,
        mockProcessedImages,
        mockContentAnalyses
      );

      expect(layout).toMatchObject({
        articleId: expect.stringMatching(/^layout_/),
        sections: expect.arrayContaining([
          expect.objectContaining({
            sectionId: 'section_intro_1',
            placements: expect.any(Array),
          }),
        ]),
        heroImage: expect.objectContaining({
          position: 'header',
          size: 'full-width',
          imageId: expect.any(String),
        }),
        thumbnailImage: expect.objectContaining({
          size: 'thumbnail',
          imageId: expect.any(String),
        }),
        metadata: {
          totalImages: expect.any(Number),
          averageRelevance: expect.any(Number),
          layoutScore: expect.any(Number),
          readabilityImpact: expect.any(Number),
          loadTime: expect.any(Number),
        },
      });
    });

    it('should select appropriate hero image', async () => {
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Hero image caption' } }],
      } as any);

      const layout = await service.createArticleLayout(
        mockSections,
        mockProcessedImages,
        mockContentAnalyses
      );

      expect(layout.heroImage).toBeDefined();
      expect(layout.heroImage?.position).toBe('header');
      expect(layout.heroImage?.size).toBe('full-width');
      expect(layout.heroImage?.relevanceScore).toBeGreaterThan(90);
    });

    it('should handle layout without images', async () => {
      const layout = await service.createArticleLayout(
        mockSections,
        [], // No images
        mockContentAnalyses
      );

      expect(layout.heroImage).toBeUndefined();
      expect(layout.thumbnailImage).toBeUndefined();
      expect(layout.metadata.totalImages).toBe(0);
      expect(layout.sections.every((s) => s.placements.length === 0)).toBe(
        true
      );
    });
  });

  describe('Image Relevance Scoring', () => {
    const mockContent =
      'Declan Rice is set to join Arsenal from West Ham in a £100m deal';
    const mockContentAnalysis: ContentAnalysis = {
      tweetId: 'tweet_123',
      classification: {
        isTransferRelated: true,
        transferType: 'CONFIRMED',
        priority: 'HIGH',
        confidence: 0.95,
        categories: ['signing'],
        keyPoints: ['Arsenal', 'Declan Rice', 'West Ham', '£100m'],
      },
      entities: {
        players: [{ name: 'Declan Rice', confidence: 0.98 }],
        clubs: [
          { name: 'Arsenal', confidence: 0.95 },
          { name: 'West Ham', confidence: 0.9 },
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
      qualityScore: 90,
      terryCompatibility: 85,
      processingTime: 400,
      aiModel: 'gpt-4-turbo-preview',
    };

    it('should score player image relevance highly when player names match', async () => {
      const playerImage: ProcessedImage = {
        id: 'player_rice',
        originalUrl: 'https://example.com/rice.jpg',
        processedUrl: 'https://cdn.example.com/rice.jpg',
        source: 'wikipedia',
        type: 'player',
        title: 'Declan Rice footballer',
        altText: 'Declan Rice playing for West Ham',
        attribution: 'Wikipedia',
        license: 'CC BY-SA',
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
          altText: 'Declan Rice playing for West Ham',
          description: 'Player in action',
          readabilityScore: 85,
        },
        metadata: {
          processedAt: new Date(),
          processingTime: 1000,
          aiModel: 'gpt-4-vision-preview',
          cacheable: true,
        },
      };

      // Mock high AI topic relevance
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce({
        choices: [{ message: { content: '95' } }],
      } as any);

      const placements = await service.findOptimalPlacements(
        mockContent,
        [playerImage],
        mockContentAnalysis
      );

      expect(placements).toHaveLength(1);
      expect(placements[0].contextMatch.playerMatch).toBeGreaterThan(80);
      expect(placements[0].relevanceScore).toBeGreaterThan(85);
    });

    it('should score club image relevance when club names match', async () => {
      const clubImage: ProcessedImage = {
        id: 'club_arsenal',
        originalUrl: 'https://example.com/arsenal.jpg',
        processedUrl: 'https://cdn.example.com/arsenal.jpg',
        source: 'wikipedia',
        type: 'club',
        title: 'Arsenal Football Club badge',
        altText: 'Arsenal FC crest',
        attribution: 'Wikipedia',
        license: 'CC BY-SA',
        variants: {
          thumbnail: {
            url: 'thumb.jpg',
            width: 150,
            height: 150,
            fileSize: 8000,
          },
          medium: {
            url: 'medium.jpg',
            width: 400,
            height: 300,
            fileSize: 25000,
          },
          large: { url: 'large.jpg', width: 800, height: 600, fileSize: 60000 },
        },
        optimization: {
          originalSize: 80000,
          optimizedSize: 60000,
          compressionRatio: 0.25,
          format: 'png',
          quality: 85,
        },
        accessibility: {
          altText: 'Arsenal FC crest',
          description: 'Club badge',
          readabilityScore: 90,
        },
        metadata: {
          processedAt: new Date(),
          processingTime: 800,
          aiModel: 'gpt-4-vision-preview',
          cacheable: true,
        },
      };

      // Mock high AI topic relevance
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce({
        choices: [{ message: { content: '92' } }],
      } as any);

      const placements = await service.findOptimalPlacements(
        mockContent,
        [clubImage],
        mockContentAnalysis
      );

      expect(placements).toHaveLength(1);
      expect(placements[0].contextMatch.clubMatch).toBeGreaterThan(80);
      expect(placements[0].relevanceScore).toBeGreaterThan(80);
    });

    it('should filter out low-relevance images', async () => {
      const irrelevantImage: ProcessedImage = {
        id: 'irrelevant_image',
        originalUrl: 'https://example.com/random.jpg',
        processedUrl: 'https://cdn.example.com/random.jpg',
        source: 'twitter',
        type: 'news',
        title: 'Random football image',
        altText: 'Generic football image',
        attribution: 'Twitter',
        license: 'Twitter TOS',
        variants: {
          thumbnail: {
            url: 'thumb.jpg',
            width: 150,
            height: 150,
            fileSize: 5000,
          },
          medium: {
            url: 'medium.jpg',
            width: 400,
            height: 300,
            fileSize: 15000,
          },
          large: { url: 'large.jpg', width: 800, height: 600, fileSize: 40000 },
        },
        optimization: {
          originalSize: 50000,
          optimizedSize: 40000,
          compressionRatio: 0.2,
          format: 'jpeg',
          quality: 85,
        },
        accessibility: {
          altText: 'Generic football image',
          description: 'Generic image',
          readabilityScore: 70,
        },
        metadata: {
          processedAt: new Date(),
          processingTime: 600,
          aiModel: 'gpt-4-vision-preview',
          cacheable: true,
        },
      };

      // Mock low AI topic relevance
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce({
        choices: [{ message: { content: '30' } }],
      } as any);

      const placements = await service.findOptimalPlacements(
        mockContent,
        [irrelevantImage],
        mockContentAnalysis
      );

      expect(placements).toHaveLength(0); // Should be filtered out
    });
  });

  describe('Image Placement Optimization', () => {
    it('should determine optimal position based on content length', async () => {
      const shortContent = 'Brief transfer update.';
      const longContent = 'A'.repeat(1500); // Long content

      const testImage: ProcessedImage = {
        id: 'test_image',
        originalUrl: 'https://example.com/test.jpg',
        processedUrl: 'https://cdn.example.com/test.jpg',
        source: 'twitter',
        type: 'news',
        title: 'Test Image',
        altText: 'Test image',
        attribution: 'Twitter',
        license: 'Twitter TOS',
        variants: {
          thumbnail: {
            url: 'thumb.jpg',
            width: 150,
            height: 150,
            fileSize: 5000,
          },
          medium: {
            url: 'medium.jpg',
            width: 400,
            height: 300,
            fileSize: 15000,
          },
          large: { url: 'large.jpg', width: 800, height: 600, fileSize: 40000 },
        },
        optimization: {
          originalSize: 50000,
          optimizedSize: 40000,
          compressionRatio: 0.2,
          format: 'jpeg',
          quality: 85,
        },
        accessibility: {
          altText: 'Test image',
          description: 'Test description',
          readabilityScore: 75,
        },
        metadata: {
          processedAt: new Date(),
          processingTime: 500,
          aiModel: 'gpt-4-vision-preview',
          cacheable: true,
        },
      };

      const mockAnalysis: ContentAnalysis = {
        tweetId: 'tweet_test',
        classification: {
          isTransferRelated: true,
          transferType: 'RUMOUR',
          priority: 'MEDIUM',
          confidence: 0.8,
          categories: ['signing'],
          keyPoints: ['Test'],
        },
        entities: { players: [], clubs: [], transferDetails: [], agents: [] },
        sentiment: {
          sentiment: 'neutral',
          confidence: 0.7,
          emotions: [],
          reliability: 0.7,
          urgency: 0.5,
        },
        qualityScore: 75,
        terryCompatibility: 70,
        processingTime: 300,
        aiModel: 'gpt-4-turbo-preview',
      };

      // Mock AI responses
      mockOpenAIInstance.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{ message: { content: '70' } }],
        } as any) // Short content
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Caption for short' } }],
        } as any)
        .mockResolvedValueOnce({
          choices: [{ message: { content: '75' } }],
        } as any) // Long content
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Caption for long' } }],
        } as any);

      const shortPlacements = await service.findOptimalPlacements(
        shortContent,
        [testImage],
        mockAnalysis
      );

      const longPlacements = await service.findOptimalPlacements(
        longContent,
        [testImage],
        mockAnalysis
      );

      expect(shortPlacements[0]?.position).toBe('sidebar');
      expect(longPlacements[0]?.position).toBe('inline');
    });

    it('should create responsive layout configurations', async () => {
      const testImage: ProcessedImage = {
        id: 'responsive_test',
        originalUrl: 'https://example.com/test.jpg',
        processedUrl: 'https://cdn.example.com/test.jpg',
        source: 'wikipedia',
        type: 'player',
        title: 'Test Player',
        altText: 'Player in action',
        attribution: 'Wikipedia',
        license: 'CC BY-SA',
        variants: {
          thumbnail: {
            url: 'thumb.jpg',
            width: 150,
            height: 150,
            fileSize: 8000,
          },
          medium: {
            url: 'medium.jpg',
            width: 400,
            height: 300,
            fileSize: 25000,
          },
          large: { url: 'large.jpg', width: 800, height: 600, fileSize: 60000 },
        },
        optimization: {
          originalSize: 80000,
          optimizedSize: 60000,
          compressionRatio: 0.25,
          format: 'jpeg',
          quality: 85,
        },
        accessibility: {
          altText: 'Player in action',
          description: 'Player during match',
          readabilityScore: 85,
        },
        metadata: {
          processedAt: new Date(),
          processingTime: 800,
          aiModel: 'gpt-4-vision-preview',
          cacheable: true,
        },
      };

      const mockAnalysis: ContentAnalysis = {
        tweetId: 'tweet_responsive',
        classification: {
          isTransferRelated: true,
          transferType: 'CONFIRMED',
          priority: 'HIGH',
          confidence: 0.9,
          categories: ['signing'],
          keyPoints: ['Player', 'Transfer'],
        },
        entities: {
          players: [{ name: 'Test Player', confidence: 0.9 }],
          clubs: [],
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
        qualityScore: 88,
        terryCompatibility: 82,
        processingTime: 450,
        aiModel: 'gpt-4-turbo-preview',
      };

      // Mock AI responses
      mockOpenAIInstance.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{ message: { content: '85' } }],
        } as any)
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Responsive image caption' } }],
        } as any);

      const placements = await service.findOptimalPlacements(
        'Test content for responsive layout',
        [testImage],
        mockAnalysis
      );

      expect(placements[0].layout.responsive).toMatchObject({
        mobile: {
          size: expect.any(String),
          alignment: expect.any(String),
        },
        tablet: {
          size: expect.any(String),
          alignment: expect.any(String),
        },
        desktop: {
          size: expect.any(String),
          alignment: expect.any(String),
        },
      });
    });

    it('should generate appropriate srcSet for responsive images', async () => {
      const testImage: ProcessedImage = {
        id: 'srcset_test',
        originalUrl: 'https://example.com/test.jpg',
        processedUrl: 'https://cdn.example.com/test.jpg',
        source: 'twitter',
        type: 'news',
        title: 'Test Image',
        altText: 'Test image for srcSet',
        attribution: 'Twitter',
        license: 'Twitter TOS',
        variants: {
          thumbnail: {
            url: 'https://cdn.example.com/thumb.jpg',
            width: 150,
            height: 150,
            fileSize: 5000,
          },
          medium: {
            url: 'https://cdn.example.com/medium.jpg',
            width: 400,
            height: 300,
            fileSize: 15000,
          },
          large: {
            url: 'https://cdn.example.com/large.jpg',
            width: 800,
            height: 600,
            fileSize: 40000,
          },
        },
        optimization: {
          originalSize: 50000,
          optimizedSize: 40000,
          compressionRatio: 0.2,
          format: 'jpeg',
          quality: 85,
        },
        accessibility: {
          altText: 'Test image for srcSet',
          description: 'Test description',
          readabilityScore: 80,
        },
        metadata: {
          processedAt: new Date(),
          processingTime: 600,
          aiModel: 'gpt-4-vision-preview',
          cacheable: true,
        },
      };

      const mockAnalysis: ContentAnalysis = {
        tweetId: 'tweet_srcset',
        classification: {
          isTransferRelated: true,
          transferType: 'RUMOUR',
          priority: 'MEDIUM',
          confidence: 0.8,
          categories: ['signing'],
          keyPoints: ['Transfer', 'News'],
        },
        entities: { players: [], clubs: [], transferDetails: [], agents: [] },
        sentiment: {
          sentiment: 'neutral',
          confidence: 0.7,
          emotions: [],
          reliability: 0.7,
          urgency: 0.5,
        },
        qualityScore: 75,
        terryCompatibility: 70,
        processingTime: 350,
        aiModel: 'gpt-4-turbo-preview',
      };

      // Mock AI responses
      mockOpenAIInstance.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{ message: { content: '70' } }],
        } as any)
        .mockResolvedValueOnce({
          choices: [{ message: { content: 'Test caption with srcSet' } }],
        } as any);

      const placements = await service.findOptimalPlacements(
        'Content for srcSet testing',
        [testImage],
        mockAnalysis
      );

      expect(placements[0].optimization.srcSet).toEqual([
        'https://cdn.example.com/thumb.jpg 150w',
        'https://cdn.example.com/medium.jpg 400w',
        'https://cdn.example.com/large.jpg 800w',
      ]);
    });
  });

  describe('Performance Optimization', () => {
    it('should configure lazy loading appropriately', async () => {
      const images: ProcessedImage[] = Array(3)
        .fill(null)
        .map((_, i) => ({
          id: `image_${i}`,
          originalUrl: `https://example.com/image${i}.jpg`,
          processedUrl: `https://cdn.example.com/image${i}.jpg`,
          source: 'wikipedia',
          type: 'player',
          title: `Image ${i}`,
          altText: `Test image ${i}`,
          attribution: 'Wikipedia',
          license: 'CC BY-SA',
          variants: {
            thumbnail: {
              url: `thumb${i}.jpg`,
              width: 150,
              height: 150,
              fileSize: 8000,
            },
            medium: {
              url: `medium${i}.jpg`,
              width: 400,
              height: 300,
              fileSize: 25000,
            },
            large: {
              url: `large${i}.jpg`,
              width: 800,
              height: 600,
              fileSize: 60000,
            },
          },
          optimization: {
            originalSize: 80000,
            optimizedSize: 60000,
            compressionRatio: 0.25,
            format: 'jpeg',
            quality: 85,
          },
          accessibility: {
            altText: `Test image ${i}`,
            description: `Description ${i}`,
            readabilityScore: 85,
          },
          metadata: {
            processedAt: new Date(),
            processingTime: 800,
            aiModel: 'gpt-4-vision-preview',
            cacheable: true,
          },
        }));

      const mockAnalysis: ContentAnalysis = {
        tweetId: 'tweet_lazy',
        classification: {
          isTransferRelated: true,
          transferType: 'RUMOUR',
          priority: 'MEDIUM',
          confidence: 0.8,
          categories: ['signing'],
          keyPoints: ['Player'],
        },
        entities: {
          players: [{ name: 'Test Player', confidence: 0.9 }],
          clubs: [],
          transferDetails: [],
          agents: [],
        },
        sentiment: {
          sentiment: 'neutral',
          confidence: 0.7,
          emotions: [],
          reliability: 0.7,
          urgency: 0.5,
        },
        qualityScore: 75,
        terryCompatibility: 70,
        processingTime: 300,
        aiModel: 'gpt-4-turbo-preview',
      };

      // Mock AI responses for all images
      mockOpenAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: '80' } }],
      } as any);

      const placements = await service.findOptimalPlacements(
        'Content with multiple images for lazy loading test',
        images,
        mockAnalysis
      );

      // First image should not be lazy loaded
      expect(placements[0]?.optimization.lazyLoad).toBe(false);
      expect(placements[0]?.optimization.preload).toBe(true);
      expect(placements[0]?.optimization.priority).toBe('high');

      // Subsequent images should be lazy loaded
      placements.slice(1).forEach((placement) => {
        expect(placement.optimization.lazyLoad).toBe(true);
        expect(placement.optimization.priority).toBe('medium');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle OpenAI API failures gracefully', async () => {
      // Use a service with lower relevance threshold for this test
      const errorTestService = new ImagePlacementService({
        openaiApiKey: 'test-key',
        maxImagesPerSection: 2,
        minRelevanceScore: 40, // Lower threshold to ensure placement is created
      });

      const testImage: ProcessedImage = {
        id: 'error_test',
        originalUrl: 'https://example.com/test.jpg',
        processedUrl: 'https://cdn.example.com/test.jpg',
        source: 'twitter',
        type: 'news',
        title: 'Error Test Image',
        altText: 'Test image for error handling',
        attribution: 'Twitter',
        license: 'Twitter TOS',
        variants: {
          thumbnail: {
            url: 'thumb.jpg',
            width: 150,
            height: 150,
            fileSize: 5000,
          },
          medium: {
            url: 'medium.jpg',
            width: 400,
            height: 300,
            fileSize: 15000,
          },
          large: { url: 'large.jpg', width: 800, height: 600, fileSize: 40000 },
        },
        optimization: {
          originalSize: 50000,
          optimizedSize: 40000,
          compressionRatio: 0.2,
          format: 'jpeg',
          quality: 85,
        },
        accessibility: {
          altText: 'Test image for error handling',
          description: 'Test description',
          readabilityScore: 75,
        },
        metadata: {
          processedAt: new Date(),
          processingTime: 500,
          aiModel: 'gpt-4-vision-preview',
          cacheable: true,
        },
      };

      const mockAnalysis: ContentAnalysis = {
        tweetId: 'tweet_error',
        classification: {
          isTransferRelated: true,
          transferType: 'RUMOUR',
          priority: 'MEDIUM',
          confidence: 0.8,
          categories: ['signing'],
          keyPoints: ['Transfer'],
        },
        entities: { players: [], clubs: [], transferDetails: [], agents: [] },
        sentiment: {
          sentiment: 'neutral',
          confidence: 0.7,
          emotions: [],
          reliability: 0.7,
          urgency: 0.5,
        },
        qualityScore: 75,
        terryCompatibility: 70,
        processingTime: 300,
        aiModel: 'gpt-4-turbo-preview',
      };

      // Mock API failure
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('API timeout')
      );

      const placements = await errorTestService.findOptimalPlacements(
        'Content for error handling test',
        [testImage],
        mockAnalysis
      );

      // Should still create placements with neutral relevance
      expect(placements).toHaveLength(1);
      expect(placements[0].contextMatch.topicMatch).toBe(50); // Neutral fallback
    });

    it('should handle empty content gracefully', async () => {
      const testImage: ProcessedImage = {
        id: 'empty_content_test',
        originalUrl: 'https://example.com/test.jpg',
        processedUrl: 'https://cdn.example.com/test.jpg',
        source: 'twitter',
        type: 'news',
        title: 'Empty Content Test',
        altText: 'Test image',
        attribution: 'Twitter',
        license: 'Twitter TOS',
        variants: {
          thumbnail: {
            url: 'thumb.jpg',
            width: 150,
            height: 150,
            fileSize: 5000,
          },
          medium: {
            url: 'medium.jpg',
            width: 400,
            height: 300,
            fileSize: 15000,
          },
          large: { url: 'large.jpg', width: 800, height: 600, fileSize: 40000 },
        },
        optimization: {
          originalSize: 50000,
          optimizedSize: 40000,
          compressionRatio: 0.2,
          format: 'jpeg',
          quality: 85,
        },
        accessibility: {
          altText: 'Test image',
          description: 'Test description',
          readabilityScore: 75,
        },
        metadata: {
          processedAt: new Date(),
          processingTime: 500,
          aiModel: 'gpt-4-vision-preview',
          cacheable: true,
        },
      };

      const mockAnalysis: ContentAnalysis = {
        tweetId: 'tweet_empty',
        classification: {
          isTransferRelated: false,
          transferType: 'RUMOUR',
          priority: 'LOW',
          confidence: 0.3,
          categories: [],
          keyPoints: [],
        },
        entities: { players: [], clubs: [], transferDetails: [], agents: [] },
        sentiment: {
          sentiment: 'neutral',
          confidence: 0.5,
          emotions: [],
          reliability: 0.5,
          urgency: 0.2,
        },
        qualityScore: 40,
        terryCompatibility: 30,
        processingTime: 200,
        aiModel: 'gpt-4-turbo-preview',
      };

      const placements = await service.findOptimalPlacements(
        '', // Empty content
        [testImage],
        mockAnalysis
      );

      // Should handle empty content and filter out low-relevance images
      expect(placements).toHaveLength(0);
    });
  });
});
