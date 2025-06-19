import {
  TwitterUserSchema,
  TwitterTweetSchema,
  TwitterUsersResponseSchema,
  TwitterTweetsResponseSchema,
  TransferRelevanceSchema,
  ProcessedTweetSchema,
} from '../twitter';

describe('Twitter Validation Schemas', () => {
  describe('TwitterUserSchema', () => {
    it('should validate a complete Twitter user object', () => {
      const validUser = testUtils.createMockTwitterUser();
      expect(validUser).toBeValidZodSchema(TwitterUserSchema);
    });

    it('should validate a minimal Twitter user object', () => {
      const minimalUser = {
        id: '12345',
        username: 'testuser',
        name: 'Test User',
      };
      expect(minimalUser).toBeValidZodSchema(TwitterUserSchema);
    });

    it('should reject invalid username length', () => {
      const invalidUser = testUtils.createMockTwitterUser({
        username: 'a'.repeat(16), // Too long
      });
      expect(invalidUser).toHaveZodError(TwitterUserSchema);
    });

    it('should reject invalid name length', () => {
      const invalidUser = testUtils.createMockTwitterUser({
        name: 'a'.repeat(51), // Too long
      });
      expect(invalidUser).toHaveZodError(TwitterUserSchema);
    });

    it('should reject invalid profile image URL', () => {
      const invalidUser = testUtils.createMockTwitterUser({
        profile_image_url: 'not-a-url',
      });
      expect(invalidUser).toHaveZodError(TwitterUserSchema, 'Invalid url');
    });

    it('should reject negative follower counts', () => {
      const invalidUser = testUtils.createMockTwitterUser({
        public_metrics: {
          followers_count: -1,
          following_count: 500,
          tweet_count: 2000,
          listed_count: 10,
        },
      });
      expect(invalidUser).toHaveZodError(TwitterUserSchema);
    });
  });

  describe('TwitterTweetSchema', () => {
    it('should validate a complete Twitter tweet object', () => {
      const validTweet = testUtils.createMockTwitterTweet();
      expect(validTweet).toBeValidZodSchema(TwitterTweetSchema);
    });

    it('should validate tweet with entities', () => {
      const tweetWithEntities = testUtils.createMockTwitterTweet({
        entities: {
          hashtags: [
            {
              start: 0,
              end: 10,
              tag: 'transfer',
            },
          ],
          mentions: [
            {
              start: 11,
              end: 20,
              username: 'arsenal',
              id: '87818409',
            },
          ],
          urls: [
            {
              start: 21,
              end: 44,
              url: 'https://t.co/abc123',
              expanded_url: 'https://example.com/full-article',
              display_url: 'example.com/full-article',
            },
          ],
        },
      });
      expect(tweetWithEntities).toBeValidZodSchema(TwitterTweetSchema);
    });

    it('should reject tweet with invalid datetime', () => {
      const invalidTweet = testUtils.createMockTwitterTweet({
        created_at: 'not-a-datetime',
      });
      expect(invalidTweet).toHaveZodError(
        TwitterTweetSchema,
        'Invalid datetime'
      );
    });

    it('should reject tweet with empty text', () => {
      const invalidTweet = testUtils.createMockTwitterTweet({
        text: '',
      });
      expect(invalidTweet).toHaveZodError(TwitterTweetSchema);
    });

    it('should reject tweet with text over 280 characters', () => {
      const invalidTweet = testUtils.createMockTwitterTweet({
        text: 'a'.repeat(281),
      });
      expect(invalidTweet).toHaveZodError(TwitterTweetSchema);
    });

    it('should reject invalid public metrics', () => {
      const invalidTweet = testUtils.createMockTwitterTweet({
        public_metrics: {
          retweet_count: -1,
          reply_count: 2,
          like_count: 15,
          quote_count: 1,
        },
      });
      expect(invalidTweet).toHaveZodError(TwitterTweetSchema);
    });
  });

  describe('TwitterUsersResponseSchema', () => {
    it('should validate successful users response', () => {
      const response = {
        data: [testUtils.createMockTwitterUser()],
        meta: {
          result_count: 1,
        },
      };
      expect(response).toBeValidZodSchema(TwitterUsersResponseSchema);
    });

    it('should validate response with includes', () => {
      const response = {
        data: [testUtils.createMockTwitterUser()],
        includes: {
          tweets: [testUtils.createMockTwitterTweet()],
        },
        meta: {
          result_count: 1,
        },
      };
      expect(response).toBeValidZodSchema(TwitterUsersResponseSchema);
    });

    it('should validate error response', () => {
      const response = {
        errors: [
          {
            detail: 'User not found',
            title: 'Not Found Error',
            resource_type: 'user',
            parameter: 'username',
            resource_id: 'nonexistent',
            type: 'https://api.twitter.com/2/problems/resource-not-found',
          },
        ],
      };
      expect(response).toBeValidZodSchema(TwitterUsersResponseSchema);
    });

    it('should validate empty response', () => {
      const response = {};
      expect(response).toBeValidZodSchema(TwitterUsersResponseSchema);
    });
  });

  describe('TwitterTweetsResponseSchema', () => {
    it('should validate successful tweets response', () => {
      const response = {
        data: [testUtils.createMockTwitterTweet()],
        includes: {
          users: [testUtils.createMockTwitterUser()],
        },
        meta: {
          result_count: 1,
          newest_id: '1234567890',
          oldest_id: '1234567890',
        },
      };
      expect(response).toBeValidZodSchema(TwitterTweetsResponseSchema);
    });

    it('should validate response with pagination', () => {
      const response = {
        data: [testUtils.createMockTwitterTweet()],
        meta: {
          result_count: 1,
          next_token: 'next_page_token',
          previous_token: 'prev_page_token',
        },
      };
      expect(response).toBeValidZodSchema(TwitterTweetsResponseSchema);
    });
  });

  describe('TransferRelevanceSchema', () => {
    it('should validate transfer relevance data', () => {
      const relevance = {
        isTransferRelated: true,
        confidence: 0.95,
        keywords: ['signing', 'medical', 'fee'],
        entities: {
          players: ['Haaland'],
          clubs: ['Manchester City', 'Borussia Dortmund'],
          agents: ['Mino Raiola'],
          journalists: ['Fabrizio Romano'],
        },
        transferType: 'confirmed',
        priority: 'high',
      };
      expect(relevance).toBeValidZodSchema(TransferRelevanceSchema);
    });

    it('should reject invalid confidence values', () => {
      const invalidRelevance = {
        isTransferRelated: true,
        confidence: 1.5, // > 1
        keywords: ['signing'],
        entities: {
          players: [],
          clubs: [],
          agents: [],
          journalists: [],
        },
        priority: 'high',
      };
      expect(invalidRelevance).toHaveZodError(TransferRelevanceSchema);
    });

    it('should reject invalid transfer type', () => {
      const invalidRelevance = {
        isTransferRelated: true,
        confidence: 0.8,
        keywords: ['signing'],
        entities: {
          players: [],
          clubs: [],
          agents: [],
          journalists: [],
        },
        transferType: 'invalid_type',
        priority: 'high',
      };
      expect(invalidRelevance).toHaveZodError(TransferRelevanceSchema);
    });

    it('should reject invalid priority', () => {
      const invalidRelevance = {
        isTransferRelated: true,
        confidence: 0.8,
        keywords: ['signing'],
        entities: {
          players: [],
          clubs: [],
          agents: [],
          journalists: [],
        },
        priority: 'invalid_priority',
      };
      expect(invalidRelevance).toHaveZodError(TransferRelevanceSchema);
    });
  });

  describe('ProcessedTweetSchema', () => {
    it('should validate processed tweet data', () => {
      const processedTweet = {
        id: '1234567890',
        originalTweet: testUtils.createMockTwitterTweet(),
        author: testUtils.createMockTwitterUser(),
        processedAt: new Date(),
        relevance: {
          isTransferRelated: true,
          confidence: 0.9,
          keywords: ['signing', 'medical'],
          entities: {
            players: ['Haaland'],
            clubs: ['Manchester City'],
            agents: [],
            journalists: ['Fabrizio Romano'],
          },
          transferType: 'confirmed',
          priority: 'high',
        },
        content: {
          cleanText: 'Haaland has completed his medical at Manchester City',
          mentions: ['@ManCity'],
          hashtags: ['#MCFC'],
          urls: ['https://example.com'],
          mediaUrls: ['https://example.com/image.jpg'],
        },
        metadata: {
          wordCount: 9,
          readabilityScore: 85,
          sentimentScore: 0.7,
          spamScore: 0.1,
        },
      };
      expect(processedTweet).toBeValidZodSchema(ProcessedTweetSchema);
    });

    it('should reject invalid sentiment score', () => {
      const invalidProcessedTweet = {
        id: '1234567890',
        originalTweet: testUtils.createMockTwitterTweet(),
        author: testUtils.createMockTwitterUser(),
        processedAt: new Date(),
        relevance: {
          isTransferRelated: true,
          confidence: 0.9,
          keywords: ['signing'],
          entities: {
            players: [],
            clubs: [],
            agents: [],
            journalists: [],
          },
          priority: 'high',
        },
        content: {
          cleanText: 'Test tweet',
          mentions: [],
          hashtags: [],
          urls: [],
          mediaUrls: [],
        },
        metadata: {
          wordCount: 2,
          readabilityScore: 85,
          sentimentScore: 1.5, // Invalid: > 1
          spamScore: 0.1,
        },
      };
      expect(invalidProcessedTweet).toHaveZodError(ProcessedTweetSchema);
    });

    it('should reject invalid spam score', () => {
      const invalidProcessedTweet = {
        id: '1234567890',
        originalTweet: testUtils.createMockTwitterTweet(),
        author: testUtils.createMockTwitterUser(),
        processedAt: new Date(),
        relevance: {
          isTransferRelated: true,
          confidence: 0.9,
          keywords: ['signing'],
          entities: {
            players: [],
            clubs: [],
            agents: [],
            journalists: [],
          },
          priority: 'high',
        },
        content: {
          cleanText: 'Test tweet',
          mentions: [],
          hashtags: [],
          urls: [],
          mediaUrls: [],
        },
        metadata: {
          wordCount: 2,
          readabilityScore: 85,
          sentimentScore: 0.5,
          spamScore: -0.1, // Invalid: < 0
        },
      };
      expect(invalidProcessedTweet).toHaveZodError(ProcessedTweetSchema);
    });
  });
});
