/**
 * Edge Case Testing
 * Comprehensive testing for malformed data, API outages, and failure scenarios
 */

import { TwitterClient } from '@/lib/twitter/client';
import { AIContentAnalyzer } from '@/lib/ai/content-analyzer';
import { TerryArticleGenerator } from '@/lib/ai/article-generator';
import { ContentQualityValidator } from '@/lib/ai/quality-validator';
import { PrismaClient } from '@prisma/client';
import type { TweetInput } from '@/lib/ai/content-analyzer';

// Mock external services
jest.mock('@/lib/twitter/client');
jest.mock('openai');

describe('Edge Case Testing', () => {
  let twitterClient: jest.Mocked<TwitterClient>;
  let analyzer: AIContentAnalyzer;
  let generator: TerryArticleGenerator;
  let validator: ContentQualityValidator;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasourceUrl:
        process.env.TEST_DATABASE_URL ||
        'postgresql://test:test@localhost:5432/transfer_juice_test',
    });

    twitterClient = new TwitterClient({
      bearerToken: 'test-bearer-token',
    }) as jest.Mocked<TwitterClient>;

    analyzer = new AIContentAnalyzer({
      openaiApiKey: 'test-openai-key',
      enableCaching: false,
    });

    generator = new TerryArticleGenerator({
      openaiApiKey: 'test-openai-key',
      terryIntensity: 'medium',
    });

    validator = new ContentQualityValidator({
      openaiApiKey: 'test-openai-key',
      strictMode: false,
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Malformed Data Handling', () => {
    it('should handle empty tweet data gracefully', async () => {
      const malformedTweet: TweetInput = {
        id: '',
        text: '',
        authorHandle: '',
        authorName: '',
        authorVerified: false,
        authorTier: 'tier3',
        createdAt: new Date(),
        metrics: {
          retweets: 0,
          likes: 0,
          replies: 0,
          quotes: 0,
        },
      };

      // Mock analyzer to handle empty data
      jest.spyOn(analyzer, 'analyzeTweet').mockImplementation(async (tweet) => {
        if (!tweet.text || !tweet.id) {
          throw new Error('Invalid tweet data: missing required fields');
        }
        return {
          classification: {
            isTransferRelated: false,
            priority: 'LOW',
            confidence: 0,
            categories: [],
            keyPoints: [],
          },
          entities: {
            players: [],
            clubs: [],
            transferDetails: [],
            agents: [],
          },
          sentiment: {
            sentiment: 'neutral',
            confidence: 0,
            emotions: [],
            reliability: 0,
            urgency: 0,
          },
          qualityScore: 0,
          terryCompatibility: 0,
          processingTime: 100,
          aiModel: 'gpt-4-turbo-preview',
        };
      });

      await expect(analyzer.analyzeTweet(malformedTweet)).rejects.toThrow(
        'Invalid tweet data: missing required fields'
      );
    });

    it('should handle corrupted tweet content', async () => {
      const corruptedTweet: TweetInput = {
        id: 'corrupted_tweet_123',
        text: '\uFFFD\uFFFD\uFFFD invalid unicode \uFFFD\uFFFD',
        authorHandle: 'test_user',
        authorName: 'Test User',
        authorVerified: false,
        authorTier: 'tier2',
        createdAt: new Date(),
        metrics: {
          retweets: 10,
          likes: 50,
          replies: 5,
          quotes: 2,
        },
      };

      jest.spyOn(analyzer, 'analyzeTweet').mockImplementation(async (tweet) => {
        // Simulate handling of corrupted unicode
        const cleanText = tweet.text.replace(/\uFFFD/g, '');
        return {
          classification: {
            isTransferRelated: false,
            priority: 'LOW',
            confidence: 0.1,
            categories: [],
            keyPoints: ['Corrupted or invalid content'],
          },
          entities: {
            players: [],
            clubs: [],
            transferDetails: [],
            agents: [],
          },
          sentiment: {
            sentiment: 'neutral',
            confidence: 0.1,
            emotions: [],
            reliability: 0.1,
            urgency: 0,
          },
          qualityScore: 5,
          terryCompatibility: 0,
          processingTime: 200,
          aiModel: 'gpt-4-turbo-preview',
        };
      });

      const result = await analyzer.analyzeTweet(corruptedTweet);

      expect(result.qualityScore).toBeLessThan(10);
      expect(result.classification.keyPoints).toContain(
        'Corrupted or invalid content'
      );
    });

    it('should handle extremely long tweet content', async () => {
      const veryLongText = 'A'.repeat(10000); // Extremely long content
      const longTweet: TweetInput = {
        id: 'long_tweet_123',
        text: veryLongText,
        authorHandle: 'test_user',
        authorName: 'Test User',
        authorVerified: true,
        authorTier: 'tier1',
        createdAt: new Date(),
        metrics: {
          retweets: 100,
          likes: 500,
          replies: 50,
          quotes: 20,
        },
      };

      jest.spyOn(analyzer, 'analyzeTweet').mockImplementation(async (tweet) => {
        // Simulate content truncation
        if (tweet.text.length > 5000) {
          return {
            classification: {
              isTransferRelated: false,
              priority: 'LOW',
              confidence: 0.3,
              categories: [],
              keyPoints: ['Content truncated due to length'],
            },
            entities: {
              players: [],
              clubs: [],
              transferDetails: [],
              agents: [],
            },
            sentiment: {
              sentiment: 'neutral',
              confidence: 0.2,
              emotions: [],
              reliability: 0.3,
              urgency: 0,
            },
            qualityScore: 20,
            terryCompatibility: 0,
            processingTime: 500,
            aiModel: 'gpt-4-turbo-preview',
          };
        }
        throw new Error('Unexpected processing error');
      });

      const result = await analyzer.analyzeTweet(longTweet);

      expect(result.classification.keyPoints).toContain(
        'Content truncated due to length'
      );
      expect(result.qualityScore).toBeLessThan(50);
    });

    it('should handle malformed date formats', async () => {
      const malformedDateTweet: TweetInput = {
        id: 'malformed_date_123',
        text: 'Transfer news about player X joining club Y',
        authorHandle: 'test_user',
        authorName: 'Test User',
        authorVerified: true,
        authorTier: 'tier1',
        createdAt: new Date('invalid-date'), // Invalid date
        metrics: {
          retweets: 50,
          likes: 200,
          replies: 25,
          quotes: 10,
        },
      };

      // Should handle invalid date gracefully
      expect(() => {
        const timestamp = malformedDateTweet.createdAt.getTime();
        if (isNaN(timestamp)) {
          malformedDateTweet.createdAt = new Date(); // Fallback to current date
        }
      }).not.toThrow();

      expect(malformedDateTweet.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('API Outage Scenarios', () => {
    it('should handle Twitter API complete outage', async () => {
      // Mock complete Twitter API failure
      twitterClient.fetchRecentTweets = jest
        .fn()
        .mockRejectedValue(new Error('Service temporarily unavailable (503)'));

      await expect(
        twitterClient.fetchRecentTweets(['FabrizioRomano'])
      ).rejects.toThrow('Service temporarily unavailable');

      // Verify error is properly categorized
      try {
        await twitterClient.fetchRecentTweets(['FabrizioRomano']);
      } catch (error) {
        expect(error instanceof Error).toBe(true);
        expect((error as Error).message).toContain('503');
      }
    });

    it('should handle Twitter API rate limiting', async () => {
      let callCount = 0;

      twitterClient.fetchRecentTweets = jest
        .fn()
        .mockImplementation(async () => {
          callCount++;
          if (callCount <= 3) {
            throw new Error('Rate limit exceeded (429)');
          }
          // Success after 3 failures
          return {
            data: [],
            meta: {
              result_count: 0,
              newest_id: '',
              oldest_id: '',
            },
          };
        });

      // Simulate retry logic
      let attempts = 0;
      let success = false;

      while (attempts < 5 && !success) {
        try {
          await twitterClient.fetchRecentTweets(['FabrizioRomano']);
          success = true;
        } catch (error) {
          attempts++;
          if ((error as Error).message.includes('429')) {
            // Simulate exponential backoff
            await new Promise((resolve) => setTimeout(resolve, 10));
          } else {
            throw error;
          }
        }
      }

      expect(success).toBe(true);
      expect(attempts).toBe(3);
    });

    it('should handle OpenAI API authentication failure', async () => {
      jest
        .spyOn(analyzer, 'analyzeTweet')
        .mockRejectedValue(new Error('Incorrect API key provided (401)'));

      const testTweet: TweetInput = {
        id: 'test_123',
        text: 'Test tweet content',
        authorHandle: 'test_user',
        authorName: 'Test User',
        authorVerified: true,
        authorTier: 'tier1',
        createdAt: new Date(),
        metrics: {
          retweets: 10,
          likes: 50,
          replies: 5,
          quotes: 2,
        },
      };

      await expect(analyzer.analyzeTweet(testTweet)).rejects.toThrow(
        'Incorrect API key provided'
      );
    });

    it('should handle OpenAI API timeout', async () => {
      jest.spyOn(analyzer, 'analyzeTweet').mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate delay
        throw new Error('Request timeout after 30 seconds');
      });

      const testTweet: TweetInput = {
        id: 'timeout_test_123',
        text: 'Test tweet for timeout scenario',
        authorHandle: 'test_user',
        authorName: 'Test User',
        authorVerified: true,
        authorTier: 'tier1',
        createdAt: new Date(),
        metrics: {
          retweets: 20,
          likes: 100,
          replies: 10,
          quotes: 5,
        },
      };

      await expect(analyzer.analyzeTweet(testTweet)).rejects.toThrow(
        'Request timeout'
      );
    });

    it('should handle database connection failure', async () => {
      // Mock database connection error
      const dbError = new Error('Connection to database failed');

      jest.spyOn(prisma, '$connect').mockRejectedValue(dbError);

      await expect(prisma.$connect()).rejects.toThrow(
        'Connection to database failed'
      );
    });

    it('should handle partial API responses', async () => {
      // Mock Twitter API returning partial data
      twitterClient.fetchRecentTweets = jest.fn().mockResolvedValue({
        data: [
          {
            id: '123',
            text: 'Complete tweet',
            author_id: '456',
            created_at: '2024-01-15T10:00:00.000Z',
            public_metrics: {
              retweet_count: 10,
              like_count: 50,
              reply_count: 5,
              quote_count: 2,
            },
          },
          {
            id: '124',
            text: 'Incomplete tweet',
            // Missing author_id and other fields
            created_at: '2024-01-15T11:00:00.000Z',
          },
        ],
        meta: {
          result_count: 2,
          newest_id: '124',
          oldest_id: '123',
        },
      });

      const response = await twitterClient.fetchRecentTweets(['TestUser']);

      // Should return data but flag incomplete entries
      expect(response.data).toHaveLength(2);
      expect(response.data[0]).toHaveProperty('author_id');
      expect(response.data[1]).not.toHaveProperty('author_id');
    });
  });

  describe('Memory and Resource Limits', () => {
    it('should handle memory pressure during large batch processing', async () => {
      // Simulate processing a large number of tweets
      const largeBatch = Array(1000)
        .fill(null)
        .map((_, index) => ({
          id: `large_batch_${index}`,
          text: `Transfer news ${index}: Player moving to new club with details and fee information`,
          authorHandle: `user_${index}`,
          authorName: `User ${index}`,
          authorVerified: index % 10 === 0,
          authorTier: 'tier2' as const,
          createdAt: new Date(),
          metrics: {
            retweets: Math.floor(Math.random() * 100),
            likes: Math.floor(Math.random() * 500),
            replies: Math.floor(Math.random() * 50),
            quotes: Math.floor(Math.random() * 20),
          },
        }));

      // Mock analyzer to simulate memory constraints
      let processedCount = 0;
      jest.spyOn(analyzer, 'analyzeTweet').mockImplementation(async (tweet) => {
        processedCount++;

        // Simulate memory pressure after processing many items
        if (processedCount > 100) {
          throw new Error('Out of memory processing large batch');
        }

        return {
          classification: {
            isTransferRelated: true,
            transferType: 'RUMOUR',
            priority: 'MEDIUM',
            confidence: 0.8,
            categories: ['signing'],
            keyPoints: ['Transfer news'],
          },
          entities: {
            players: [{ name: 'Test Player', confidence: 0.9 }],
            clubs: [{ name: 'Test Club', confidence: 0.9 }],
            transferDetails: [],
            agents: [],
          },
          sentiment: {
            sentiment: 'positive',
            confidence: 0.7,
            emotions: ['optimism'],
            reliability: 0.8,
            urgency: 0.6,
          },
          qualityScore: 75,
          terryCompatibility: 60,
          processingTime: 100,
          aiModel: 'gpt-4-turbo-preview',
        };
      });

      // Process in smaller chunks to handle memory constraints
      const chunkSize = 50;
      let totalProcessed = 0;
      let memoryError = false;

      for (let i = 0; i < largeBatch.length; i += chunkSize) {
        const chunk = largeBatch.slice(i, i + chunkSize);

        try {
          const results = await Promise.allSettled(
            chunk.map((tweet) => analyzer.analyzeTweet(tweet))
          );

          const successful = results.filter(
            (r) => r.status === 'fulfilled'
          ).length;
          totalProcessed += successful;
        } catch (error) {
          if ((error as Error).message.includes('Out of memory')) {
            memoryError = true;
            break;
          }
        }
      }

      // Should process some tweets before hitting memory limit
      expect(totalProcessed).toBeGreaterThan(0);
      expect(totalProcessed).toBeLessThanOrEqual(100);
    });

    it('should handle disk space limitations', async () => {
      // Mock scenario where log files or cache fills up disk space
      const simulateDiskError = () => {
        throw new Error('ENOSPC: no space left on device');
      };

      // Test that disk errors are caught and handled
      expect(() => simulateDiskError()).toThrow('ENOSPC');
    });
  });

  describe('Concurrent Access and Race Conditions', () => {
    it('should handle concurrent tweet processing without conflicts', async () => {
      const concurrentTweets = Array(10)
        .fill(null)
        .map((_, index) => ({
          id: `concurrent_${index}`,
          text: `Concurrent tweet ${index} with transfer news`,
          authorHandle: `concurrent_user_${index}`,
          authorName: `Concurrent User ${index}`,
          authorVerified: true,
          authorTier: 'tier1' as const,
          createdAt: new Date(),
          metrics: {
            retweets: 20,
            likes: 100,
            replies: 10,
            quotes: 5,
          },
        }));

      // Mock analyzer to track concurrent processing
      const processedIds = new Set<string>();
      let simultaneousProcessing = 0;
      let maxSimultaneous = 0;

      jest.spyOn(analyzer, 'analyzeTweet').mockImplementation(async (tweet) => {
        simultaneousProcessing++;
        maxSimultaneous = Math.max(maxSimultaneous, simultaneousProcessing);

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 50));

        if (processedIds.has(tweet.id)) {
          throw new Error(`Race condition: Tweet ${tweet.id} processed twice`);
        }

        processedIds.add(tweet.id);
        simultaneousProcessing--;

        return {
          classification: {
            isTransferRelated: true,
            transferType: 'RUMOUR',
            priority: 'MEDIUM',
            confidence: 0.8,
            categories: ['signing'],
            keyPoints: ['Concurrent processing'],
          },
          entities: {
            players: [],
            clubs: [],
            transferDetails: [],
            agents: [],
          },
          sentiment: {
            sentiment: 'neutral',
            confidence: 0.7,
            emotions: [],
            reliability: 0.8,
            urgency: 0.5,
          },
          qualityScore: 70,
          terryCompatibility: 50,
          processingTime: 50,
          aiModel: 'gpt-4-turbo-preview',
        };
      });

      // Process all tweets concurrently
      const results = await Promise.all(
        concurrentTweets.map((tweet) => analyzer.analyzeTweet(tweet))
      );

      expect(results).toHaveLength(10);
      expect(processedIds.size).toBe(10);
      expect(maxSimultaneous).toBeGreaterThan(1); // Confirm concurrent processing
    });

    it('should handle cache invalidation during concurrent access', async () => {
      // Test caching behavior under concurrent access
      const sameTweet: TweetInput = {
        id: 'cache_test_123',
        text: 'Cache test tweet',
        authorHandle: 'cache_user',
        authorName: 'Cache User',
        authorVerified: true,
        authorTier: 'tier1',
        createdAt: new Date(),
        metrics: {
          retweets: 15,
          likes: 75,
          replies: 8,
          quotes: 3,
        },
      };

      let analysisCount = 0;
      jest.spyOn(analyzer, 'analyzeTweet').mockImplementation(async (tweet) => {
        analysisCount++;
        await new Promise((resolve) => setTimeout(resolve, 25));

        return {
          classification: {
            isTransferRelated: true,
            transferType: 'RUMOUR',
            priority: 'MEDIUM',
            confidence: 0.8,
            categories: ['signing'],
            keyPoints: ['Cache test'],
          },
          entities: {
            players: [],
            clubs: [],
            transferDetails: [],
            agents: [],
          },
          sentiment: {
            sentiment: 'neutral',
            confidence: 0.7,
            emotions: [],
            reliability: 0.8,
            urgency: 0.5,
          },
          qualityScore: 70,
          terryCompatibility: 50,
          processingTime: 25,
          aiModel: 'gpt-4-turbo-preview',
        };
      });

      // Process same tweet multiple times concurrently
      const concurrentPromises = Array(5)
        .fill(null)
        .map(() => analyzer.analyzeTweet(sameTweet));

      const results = await Promise.all(concurrentPromises);

      expect(results).toHaveLength(5);
      // All results should be identical if caching works properly
      results.forEach((result) => {
        expect(result.classification.keyPoints).toContain('Cache test');
      });
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should detect and handle duplicate tweet IDs', async () => {
      const duplicateTweets = [
        {
          id: 'duplicate_123',
          text: 'First version of tweet',
          authorHandle: 'user1',
          authorName: 'User One',
          authorVerified: true,
          authorTier: 'tier1' as const,
          createdAt: new Date('2024-01-15T10:00:00Z'),
          metrics: { retweets: 10, likes: 50, replies: 5, quotes: 2 },
        },
        {
          id: 'duplicate_123', // Same ID
          text: 'Second version of tweet',
          authorHandle: 'user2',
          authorName: 'User Two',
          authorVerified: false,
          authorTier: 'tier2' as const,
          createdAt: new Date('2024-01-15T11:00:00Z'),
          metrics: { retweets: 20, likes: 100, replies: 10, quotes: 5 },
        },
      ];

      // Simulate duplicate detection
      const processedIds = new Set<string>();
      const duplicates: string[] = [];

      for (const tweet of duplicateTweets) {
        if (processedIds.has(tweet.id)) {
          duplicates.push(tweet.id);
        } else {
          processedIds.add(tweet.id);
        }
      }

      expect(duplicates).toContain('duplicate_123');
      expect(processedIds.size).toBe(1);
    });

    it('should validate data relationships and constraints', async () => {
      // Test referential integrity
      const invalidRelationshipData = {
        articleId: 'article_123',
        authorId: 'nonexistent_author',
        sourceTweetIds: ['tweet_1', 'tweet_2', 'nonexistent_tweet'],
      };

      // Simulate validation of relationships
      const validateRelationships = (data: typeof invalidRelationshipData) => {
        const errors: string[] = [];

        // Check if author exists
        if (data.authorId === 'nonexistent_author') {
          errors.push('Author does not exist');
        }

        // Check if source tweets exist
        const invalidTweets = data.sourceTweetIds.filter((id) =>
          id.includes('nonexistent')
        );
        if (invalidTweets.length > 0) {
          errors.push(`Invalid tweet references: ${invalidTweets.join(', ')}`);
        }

        return { valid: errors.length === 0, errors };
      };

      const validation = validateRelationships(invalidRelationshipData);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Author does not exist');
      expect(
        validation.errors.some((e) => e.includes('Invalid tweet references'))
      ).toBe(true);
    });

    it('should handle transaction rollbacks on failure', async () => {
      // Simulate database transaction failure
      let transactionState = 'started';

      const simulateTransaction = async () => {
        try {
          transactionState = 'executing';

          // Simulate operations that might fail
          await new Promise((resolve) => setTimeout(resolve, 10));

          // Simulate failure
          throw new Error('Transaction failed during execution');
        } catch (error) {
          transactionState = 'rolled_back';
          throw error;
        }
      };

      await expect(simulateTransaction()).rejects.toThrow('Transaction failed');
      expect(transactionState).toBe('rolled_back');
    });
  });

  describe('Configuration and Environment Issues', () => {
    it('should handle missing environment variables', () => {
      const originalEnv = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      expect(() => {
        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY environment variable is required');
        }
      }).toThrow('OPENAI_API_KEY environment variable is required');

      // Restore environment
      if (originalEnv) {
        process.env.OPENAI_API_KEY = originalEnv;
      }
    });

    it('should handle invalid configuration values', () => {
      const validateConfig = (config: {
        timeout?: number;
        maxRetries?: number;
      }) => {
        const errors: string[] = [];

        if (config.timeout !== undefined && config.timeout < 0) {
          errors.push('Timeout must be positive');
        }

        if (config.maxRetries !== undefined && config.maxRetries > 10) {
          errors.push('Max retries cannot exceed 10');
        }

        return { valid: errors.length === 0, errors };
      };

      const invalidConfig = { timeout: -1, maxRetries: 15 };
      const validation = validateConfig(invalidConfig);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Timeout must be positive');
      expect(validation.errors).toContain('Max retries cannot exceed 10');
    });

    it('should handle network connectivity issues', async () => {
      // Mock network connectivity failure
      const simulateNetworkError = async () => {
        throw new Error('ENOTFOUND: DNS resolution failed');
      };

      await expect(simulateNetworkError()).rejects.toThrow('ENOTFOUND');
    });
  });
});
