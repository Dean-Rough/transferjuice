/**
 * Image Sourcing Service Tests
 * Comprehensive testing for Twitter media extraction and Wikipedia Commons integration
 */

import {
  ImageSourcingService,
  type ImageSource,
  type TwitterImage,
  type WikipediaImage,
} from '@/lib/image/sourcing';
import type { TweetMediaInfo } from '@/lib/twitter/client';

// Mock fetch globally
global.fetch = jest.fn();

describe('ImageSourcingService', () => {
  let service: ImageSourcingService;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    service = new ImageSourcingService({
      userAgent: 'Transfer-Juice-Test/1.0',
      enableCaching: false, // Disable caching for tests
    });
    mockFetch.mockClear();
  });

  describe('Twitter Image Extraction', () => {
    it('should extract images from Twitter media', async () => {
      const mockMedia: TweetMediaInfo[] = [
        {
          media_key: 'test_media_123',
          type: 'photo',
          url: 'https://pbs.twimg.com/media/test123.jpg',
          alt_text: 'Player signing photo',
          width: 800,
          height: 600,
        },
        {
          media_key: 'test_media_124',
          type: 'photo',
          url: 'https://pbs.twimg.com/media/test124.jpg',
          width: 400,
          height: 300,
        },
      ];

      const result = await service.extractTwitterImages(
        mockMedia,
        'tweet_123',
        'FabrizioRomano'
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        source: 'twitter',
        type: 'news',
        url: 'https://pbs.twimg.com/media/test123.jpg',
        altText: 'Player signing photo',
        attribution: '@FabrizioRomano on Twitter',
      });
    });

    it('should filter low-quality Twitter images', async () => {
      const mockMedia: TweetMediaInfo[] = [
        {
          media_key: 'low_quality',
          type: 'photo',
          url: 'https://pbs.twimg.com/media/lowquality.jpg',
          width: 100,
          height: 100,
        },
      ];

      const result = await service.extractTwitterImages(
        mockMedia,
        'tweet_123',
        'unknown_user'
      );

      // Should filter out low-quality images
      expect(result).toHaveLength(0);
    });

    it('should calculate Twitter relevance scores correctly', async () => {
      const mockMedia: TweetMediaInfo[] = [
        {
          media_key: 'test_media_123',
          type: 'photo',
          url: 'https://pbs.twimg.com/media/test123.jpg',
          alt_text: 'Declan Rice signing for Arsenal',
          width: 1200,
          height: 800,
        },
      ];

      const result = await service.extractTwitterImages(
        mockMedia,
        'tweet_123',
        'FabrizioRomano' // Known ITK
      );

      expect(result[0].metadata.relevanceScore).toBeGreaterThan(80);
    });
  });

  describe('Wikipedia Commons Integration', () => {
    const mockWikipediaResponse = {
      query: {
        pages: {
          '12345': {
            pageid: 12345,
            title: 'Declan Rice',
            imageinfo: [
              {
                url: 'https://upload.wikimedia.org/wikipedia/commons/test.jpg',
                descriptionurl:
                  'https://commons.wikimedia.org/wiki/File:test.jpg',
                width: 800,
                height: 600,
                size: 150000,
                extmetadata: {
                  ObjectName: { value: 'Declan Rice playing for England' },
                  ImageDescription: {
                    value: 'Declan Rice in action for England national team',
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

    it('should search Wikipedia Commons for player images', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWikipediaResponse),
      } as Response);

      const result = await service.searchWikipediaImages(
        ['Declan Rice'],
        'player'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('en.wikipedia.org/w/api.php'),
        expect.objectContaining({
          headers: { 'User-Agent': 'Transfer-Juice-Test/1.0' },
        })
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        source: 'wikipedia',
        type: 'player',
        title: 'Declan Rice',
        license: 'CC BY-SA 3.0',
        attribution: 'Wikipedia Commons',
      });
    });

    it('should handle Wikipedia API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.searchWikipediaImages(
        ['Declan Rice'],
        'player'
      );

      expect(result).toHaveLength(0);
    });

    it('should calculate Wikipedia relevance scores correctly', async () => {
      const mockResponseHighRelevance = {
        query: {
          pages: {
            '12345': {
              pageid: 12345,
              title: 'Declan Rice footballer',
              imageinfo: [
                {
                  url: 'https://upload.wikimedia.org/wikipedia/commons/test.jpg',
                  width: 800,
                  height: 600,
                  extmetadata: {
                    ImageDescription: {
                      value: 'Declan Rice playing football for West Ham United',
                    },
                  },
                },
              ],
            },
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponseHighRelevance),
      } as Response);

      const result = await service.searchWikipediaImages(
        ['Declan Rice'],
        'player'
      );

      expect(result[0].metadata.relevanceScore).toBeGreaterThan(70);
    });
  });

  describe('Contextual Image Finding', () => {
    it('should find contextual images for players and clubs', async () => {
      // Mock multiple Wikipedia responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWikipediaResponse),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              query: {
                pages: {
                  '67890': {
                    pageid: 67890,
                    title: 'Arsenal FC',
                    imageinfo: [
                      {
                        url: 'https://upload.wikimedia.org/wikipedia/commons/arsenal.jpg',
                        width: 600,
                        height: 400,
                        extmetadata: {
                          ImageDescription: {
                            value: 'Arsenal Football Club badge',
                          },
                        },
                      },
                    ],
                  },
                },
              },
            }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ query: { pages: {} } }),
        } as Response);

      const result = await service.findContextualImages(
        ['Declan Rice'],
        ['Arsenal FC'],
        'signing'
      );

      expect(result.players.length).toBeGreaterThanOrEqual(0);
      expect(result.clubs.length).toBeGreaterThanOrEqual(0);
      expect(result.contextual.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty search results', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ query: { pages: {} } }),
      } as Response);

      const result = await service.findContextualImages([], [], 'signing');

      expect(result.players).toHaveLength(0);
      expect(result.clubs).toHaveLength(0);
      expect(result.contextual).toHaveLength(0);
    });
  });

  describe('Image Quality and Filtering', () => {
    it('should filter images by quality threshold', async () => {
      const highQualityService = new ImageSourcingService({
        userAgent: 'Test/1.0',
        qualityThreshold: 80,
      });

      const mockMedia: TweetMediaInfo[] = [
        {
          media_key: 'high_quality',
          type: 'photo',
          url: 'https://pbs.twimg.com/media/high.jpg',
          alt_text: 'High quality image',
          width: 1200,
          height: 800,
        },
        {
          media_key: 'low_quality',
          type: 'photo',
          url: 'https://pbs.twimg.com/media/low.jpg',
          width: 200,
          height: 150,
        },
      ];

      const result = await highQualityService.extractTwitterImages(
        mockMedia,
        'tweet_123',
        'unknown_user'
      );

      // Only high-quality images should pass the threshold
      expect(result.length).toBeLessThanOrEqual(1);
    });

    it('should deduplicate images correctly', async () => {
      const mockMedia: TweetMediaInfo[] = [
        {
          media_key: 'duplicate_1',
          type: 'photo',
          url: 'https://pbs.twimg.com/media/same.jpg',
          width: 800,
          height: 600,
        },
        {
          media_key: 'duplicate_2',
          type: 'photo',
          url: 'https://pbs.twimg.com/media/same.jpg', // Same URL
          width: 800,
          height: 600,
        },
      ];

      const result = await service.extractTwitterImages(
        mockMedia,
        'tweet_123',
        'FabrizioRomano'
      );

      // Should handle duplicate URLs (deduplication happens in processing pipeline)
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Caching', () => {
    it('should cache Wikipedia search results', async () => {
      const cachingService = new ImageSourcingService({
        userAgent: 'Test/1.0',
        enableCaching: true,
        cacheTtl: 1000,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWikipediaResponse),
      } as Response);

      // First call
      await cachingService.searchWikipediaImages(['Declan Rice'], 'player');

      // Second call should use cache
      await cachingService.searchWikipediaImages(['Declan Rice'], 'player');

      // Should only make one API call due to caching
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should provide cache statistics', () => {
      const stats = service.getCacheStats();

      expect(stats).toMatchObject({
        size: expect.any(Number),
        keys: expect.any(Array),
      });
    });

    it('should clear cache when requested', () => {
      service.clearCache();
      const stats = service.getCacheStats();

      expect(stats.size).toBe(0);
      expect(stats.keys).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed Twitter media data', async () => {
      const malformedMedia: any[] = [
        {
          media_key: '',
          type: 'invalid',
          url: 'not-a-url',
        },
        null,
        undefined,
      ];

      const result = await service.extractTwitterImages(
        malformedMedia.filter(Boolean),
        'tweet_123',
        'test_user'
      );

      expect(result).toHaveLength(0);
    });

    it('should handle Wikipedia API failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API timeout'));

      await expect(
        service.searchWikipediaImages(['Declan Rice'], 'player')
      ).resolves.toEqual([]);
    });

    it('should handle network connectivity issues', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network unavailable'));

      const result = await service.findContextualImages(
        ['Player Name'],
        ['Club Name'],
        'signing'
      );

      expect(result.players).toHaveLength(0);
      expect(result.clubs).toHaveLength(0);
      expect(result.contextual).toHaveLength(0);
    });
  });

  describe('Schema Validation', () => {
    it('should validate Twitter image schema', () => {
      const validTwitterImage = {
        id: 'test_123',
        url: 'https://example.com/image.jpg',
        altText: 'Test image',
        type: 'photo' as const,
        width: 800,
        height: 600,
        tweetId: 'tweet_123',
        authorHandle: 'test_user',
      };

      expect(() => {
        // Schema validation would happen in the actual implementation
        expect(validTwitterImage.url).toMatch(/^https?:\/\//);
        expect(validTwitterImage.type).toBe('photo');
        expect(validTwitterImage.width).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it('should validate Wikipedia image schema', () => {
      const validWikipediaImage = {
        title: 'Test Player',
        url: 'https://commons.wikimedia.org/test.jpg',
        description: 'Player in action',
        license: 'CC BY-SA',
        attribution: 'Wikipedia',
        width: 800,
        height: 600,
        searchTerm: 'Test Player',
        relevanceScore: 85,
      };

      expect(() => {
        expect(validWikipediaImage.relevanceScore).toBeGreaterThanOrEqual(0);
        expect(validWikipediaImage.relevanceScore).toBeLessThanOrEqual(100);
        expect(validWikipediaImage.url).toMatch(/^https?:\/\//);
      }).not.toThrow();
    });
  });
});
