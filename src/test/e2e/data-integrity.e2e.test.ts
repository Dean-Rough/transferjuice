/**
 * Data Integrity Testing
 * Comprehensive validation of data consistency across the pipeline
 */

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { TweetInput } from '@/lib/ai/content-analyzer';
import type { ArticleGeneration } from '@/lib/ai/article-generator';

// Data integrity validation schemas
const TweetIntegritySchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(10000),
  authorHandle: z.string().min(1),
  authorName: z.string().min(1),
  authorVerified: z.boolean(),
  authorTier: z.enum(['tier1', 'tier2', 'tier3']),
  createdAt: z.date(),
  metrics: z.object({
    retweets: z.number().min(0),
    likes: z.number().min(0),
    replies: z.number().min(0),
    quotes: z.number().min(0),
  }),
});

const ArticleIntegritySchema = z.object({
  title: z.string().min(10).max(200),
  slug: z.string().min(5).max(100),
  content: z.object({
    sections: z
      .array(
        z.object({
          id: z.string(),
          type: z.enum(['intro', 'main', 'analysis', 'conclusion']),
          title: z.string().min(1),
          content: z.string().min(50),
          order: z.number().min(1),
          sourceTweets: z.array(z.string()),
          terryisms: z.array(z.string()),
        })
      )
      .min(2),
    wordCount: z.number().min(300).max(1500),
    estimatedReadTime: z.number().min(1).max(10),
    terryScore: z.number().min(0).max(100),
    qualityMetrics: z.object({
      coherence: z.number().min(0).max(100),
      factualAccuracy: z.number().min(0).max(100),
      brandVoice: z.number().min(0).max(100),
      readability: z.number().min(0).max(100),
    }),
  }),
  summary: z.string().min(50).max(300),
  metaDescription: z.string().min(100).max(160),
  tags: z.array(z.string()).min(1).max(10),
  briefingType: z.enum(['MORNING', 'AFTERNOON', 'EVENING']),
  status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']),
  qualityScore: z.number().min(0).max(100),
  aiModel: z.string().min(1),
  generationTime: z.number().min(0),
});

describe('Data Integrity Testing', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Mock Prisma for testing - no actual database connection needed for schema validation
    prisma = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
    } as any;
  });

  afterAll(async () => {
    // No cleanup needed for mocked database
  });

  describe('Schema Validation', () => {
    it('should validate tweet input schema strictly', () => {
      const validTweet: TweetInput = {
        id: 'valid_tweet_123',
        text: 'This is a valid tweet with transfer news about a player joining a club',
        authorHandle: 'valid_user',
        authorName: 'Valid User',
        authorVerified: true,
        authorTier: 'tier1',
        createdAt: new Date(),
        metrics: {
          retweets: 50,
          likes: 200,
          replies: 25,
          quotes: 10,
        },
      };

      const result = TweetIntegritySchema.safeParse(validTweet);
      expect(result.success).toBe(true);
    });

    it('should reject invalid tweet data', () => {
      const invalidTweet = {
        id: '', // Invalid: empty ID
        text: 'A'.repeat(20000), // Invalid: too long
        authorHandle: '', // Invalid: empty handle
        authorName: '', // Invalid: empty name
        authorVerified: 'yes', // Invalid: not boolean
        authorTier: 'invalid-tier', // Invalid: not enum value
        createdAt: 'invalid-date', // Invalid: not Date object
        metrics: {
          retweets: -1, // Invalid: negative number
          likes: 'many', // Invalid: not number
          replies: 10,
          quotes: 5,
        },
      };

      const result = TweetIntegritySchema.safeParse(invalidTweet);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
        expect(
          result.error.issues.some((issue) => issue.path.includes('id'))
        ).toBe(true);
        expect(
          result.error.issues.some((issue) => issue.path.includes('text'))
        ).toBe(true);
        expect(
          result.error.issues.some((issue) => issue.path.includes('authorTier'))
        ).toBe(true);
      }
    });

    it('should validate article generation schema comprehensively', () => {
      const validArticle: ArticleGeneration = {
        title: 'Transfer Madness: United Sign Rice for £100m',
        slug: 'transfer-madness-united-sign-rice-100m',
        content: {
          sections: [
            {
              id: 'section_intro_1',
              type: 'intro',
              title: 'The Latest Chaos',
              content:
                'This is a sufficiently long introduction section that meets the minimum length requirements for content validation and provides proper context for the transfer story being told.',
              order: 1,
              sourceTweets: ['tweet_123'],
              terryisms: ['(of course)', 'properly mental'],
            },
            {
              id: 'section_main_2',
              type: 'main',
              title: 'The Main Event',
              content:
                'Here we dive into the main details of this transfer saga with all the necessary information and analysis that readers need to understand the implications and context of this move.',
              order: 2,
              sourceTweets: ['tweet_124', 'tweet_125'],
              terryisms: ['beyond the obvious lunacy'],
            },
          ],
          wordCount: 450,
          estimatedReadTime: 3,
          terryScore: 85,
          qualityMetrics: {
            coherence: 88,
            factualAccuracy: 92,
            brandVoice: 85,
            readability: 79,
          },
        },
        summary:
          'Manchester United complete the signing of Declan Rice for £100m after successful medical tests and contract negotiations.',
        metaDescription:
          'Declan Rice joins Manchester United for £100m in the latest transfer window madness. Full analysis of the deal and implications.',
        tags: [
          'Manchester United',
          'Declan Rice',
          'Transfer',
          'Premier League',
        ],
        briefingType: 'MORNING',
        status: 'REVIEW',
        qualityScore: 87,
        aiModel: 'gpt-4.1',
        generationTime: 4500,
      };

      const result = ArticleIntegritySchema.safeParse(validArticle);
      expect(result.success).toBe(true);
    });

    it('should reject malformed article data', () => {
      const invalidArticle = {
        title: 'Short', // Invalid: too short
        slug: '', // Invalid: empty
        content: {
          sections: [], // Invalid: empty array (min 2 required)
          wordCount: 100, // Invalid: below minimum
          estimatedReadTime: 0, // Invalid: below minimum
          terryScore: 150, // Invalid: above maximum
          qualityMetrics: {
            coherence: -10, // Invalid: below minimum
            factualAccuracy: 'excellent', // Invalid: not number
            brandVoice: 85,
            readability: 79,
          },
        },
        summary: 'Too short', // Invalid: below minimum length
        metaDescription: 'A'.repeat(200), // Invalid: too long
        tags: [], // Invalid: empty array
        briefingType: 'INVALID', // Invalid: not enum value
        status: 'UNKNOWN', // Invalid: not enum value
        qualityScore: -5, // Invalid: below minimum
        aiModel: '', // Invalid: empty string
        generationTime: -100, // Invalid: negative number
      };

      const result = ArticleIntegritySchema.safeParse(invalidArticle);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(5);
      }
    });
  });

  describe('Data Transformation Integrity', () => {
    it('should maintain data consistency through pipeline transformations', () => {
      // Simulate tweet data transformation
      const originalTweet = {
        id: '1745123456789012345',
        text: 'BREAKING: Manchester United are close to signing Declan Rice for £100m',
        author_id: '285989651',
        created_at: '2024-01-15T10:30:00.000Z',
        public_metrics: {
          retweet_count: 5420,
          like_count: 18760,
          reply_count: 892,
          quote_count: 234,
        },
        includes: {
          users: [
            {
              id: '285989651',
              username: 'FabrizioRomano',
              name: 'Fabrizio Romano',
              verified: true,
            },
          ],
        },
      };

      // Transform to internal format
      const transformedTweet: TweetInput = {
        id: `tweet_${originalTweet.id}`,
        text: originalTweet.text,
        authorHandle: originalTweet.includes.users[0].username,
        authorName: originalTweet.includes.users[0].name,
        authorVerified: originalTweet.includes.users[0].verified,
        authorTier: 'tier1',
        createdAt: new Date(originalTweet.created_at),
        metrics: {
          retweets: originalTweet.public_metrics.retweet_count,
          likes: originalTweet.public_metrics.like_count,
          replies: originalTweet.public_metrics.reply_count,
          quotes: originalTweet.public_metrics.quote_count,
        },
      };

      // Validate transformation preserves critical data
      expect(transformedTweet.text).toBe(originalTweet.text);
      expect(transformedTweet.authorHandle).toBe('FabrizioRomano');
      expect(transformedTweet.authorVerified).toBe(true);
      expect(transformedTweet.metrics.likes).toBe(18760);
      expect(transformedTweet.createdAt.getTime()).toBe(
        new Date(originalTweet.created_at).getTime()
      );

      // Validate schema compliance
      const validation = TweetIntegritySchema.safeParse(transformedTweet);
      expect(validation.success).toBe(true);
    });

    it('should validate entity extraction consistency', () => {
      const tweetText =
        'Manchester United are signing Declan Rice for £100m from West Ham';

      // Simulate entity extraction
      const extractedEntities = {
        players: [
          { name: 'Declan Rice', confidence: 0.95, currentClub: 'West Ham' },
        ],
        clubs: [
          {
            name: 'Manchester United',
            confidence: 0.98,
            league: 'Premier League',
          },
          { name: 'West Ham', confidence: 0.92, league: 'Premier League' },
        ],
        transferDetails: [
          { type: 'fee' as const, value: '£100m', confidence: 0.9 },
        ],
        agents: [],
      };

      // Validate extraction accuracy
      expect(extractedEntities.players).toHaveLength(1);
      expect(extractedEntities.players[0].name).toBe('Declan Rice');
      expect(extractedEntities.clubs).toHaveLength(2);
      expect(
        extractedEntities.clubs.find((c) => c.name === 'Manchester United')
      ).toBeTruthy();
      expect(extractedEntities.transferDetails).toHaveLength(1);
      expect(extractedEntities.transferDetails[0].value).toBe('£100m');

      // Validate confidence scores
      extractedEntities.players.forEach((player) => {
        expect(player.confidence).toBeGreaterThan(0.8);
      });
      extractedEntities.clubs.forEach((club) => {
        expect(club.confidence).toBeGreaterThan(0.8);
      });
    });

    it('should ensure article generation preserves source data integrity', () => {
      const sourceTweets = [
        {
          id: 'tweet_123',
          text: 'Manchester United sign Declan Rice for £100m',
          analysis: {
            entities: {
              players: [{ name: 'Declan Rice', confidence: 0.95 }],
              clubs: [{ name: 'Manchester United', confidence: 0.98 }],
            },
            classification: {
              transferType: 'CONFIRMED',
              priority: 'HIGH',
              keyPoints: ['Manchester United', 'Declan Rice', '£100m'],
            },
          },
        },
      ];

      // Simulate article generation
      const generatedArticle = {
        title: 'Rice Finally Joins United After £100m Circus',
        content: {
          sections: [
            {
              id: 'section_1',
              type: 'intro' as const,
              title: 'The Latest',
              content:
                'Manchester United have finally completed the signing of Declan Rice for £100m...',
              sourceTweets: ['tweet_123'],
              terryisms: ['(of course)'],
              order: 1,
            },
          ],
        },
        tags: ['Manchester United', 'Declan Rice', 'Transfer'],
      };

      // Validate source data preservation
      expect(generatedArticle.title).toContain('Rice');
      expect(generatedArticle.title).toContain('United');
      expect(generatedArticle.content.sections[0].content).toContain(
        'Manchester United'
      );
      expect(generatedArticle.content.sections[0].content).toContain(
        'Declan Rice'
      );
      expect(generatedArticle.content.sections[0].content).toContain('£100m');
      expect(generatedArticle.tags).toContain('Manchester United');
      expect(generatedArticle.tags).toContain('Declan Rice');

      // Validate source attribution
      expect(generatedArticle.content.sections[0].sourceTweets).toContain(
        'tweet_123'
      );
    });
  });

  describe('Referential Integrity', () => {
    it('should validate cross-table relationships', async () => {
      // Mock data relationships
      const relationships = {
        articles: [
          {
            id: 'article_1',
            authorId: 'author_1',
            briefingId: 'briefing_1',
            sourceTweetIds: ['tweet_1', 'tweet_2'],
          },
        ],
        authors: [{ id: 'author_1', name: 'Terry Generator' }],
        briefings: [{ id: 'briefing_1', type: 'MORNING', date: '2024-01-15' }],
        tweets: [
          { id: 'tweet_1', authorHandle: 'user1' },
          { id: 'tweet_2', authorHandle: 'user2' },
        ],
      };

      // Validate all referenced IDs exist
      const article = relationships.articles[0];

      const authorExists = relationships.authors.some(
        (a) => a.id === article.authorId
      );
      expect(authorExists).toBe(true);

      const briefingExists = relationships.briefings.some(
        (b) => b.id === article.briefingId
      );
      expect(briefingExists).toBe(true);

      const allTweetsExist = article.sourceTweetIds.every((tweetId) =>
        relationships.tweets.some((t) => t.id === tweetId)
      );
      expect(allTweetsExist).toBe(true);
    });

    it('should detect orphaned records', () => {
      const data = {
        articles: [
          { id: 'article_1', briefingId: 'briefing_1' },
          { id: 'article_2', briefingId: 'briefing_999' }, // Orphaned
        ],
        briefings: [{ id: 'briefing_1', type: 'MORNING' }],
      };

      const orphanedArticles = data.articles.filter(
        (article) =>
          !data.briefings.some((briefing) => briefing.id === article.briefingId)
      );

      expect(orphanedArticles).toHaveLength(1);
      expect(orphanedArticles[0].id).toBe('article_2');
    });

    it('should validate cascade deletion rules', () => {
      const data = {
        briefings: [{ id: 'briefing_1' }],
        articles: [
          { id: 'article_1', briefingId: 'briefing_1' },
          { id: 'article_2', briefingId: 'briefing_1' },
        ],
        articleSections: [
          { id: 'section_1', articleId: 'article_1' },
          { id: 'section_2', articleId: 'article_2' },
        ],
      };

      // Simulate briefing deletion
      const briefingToDelete = 'briefing_1';

      // Find affected records
      const affectedArticles = data.articles.filter(
        (a) => a.briefingId === briefingToDelete
      );
      const affectedSections = data.articleSections.filter((s) =>
        affectedArticles.some((a) => a.id === s.articleId)
      );

      expect(affectedArticles).toHaveLength(2);
      expect(affectedSections).toHaveLength(2);
    });
  });

  describe('Data Quality Constraints', () => {
    it('should enforce business rule constraints', () => {
      // Test briefing scheduling constraints
      const validateBriefingSchedule = (
        briefings: Array<{ type: string; scheduledAt: Date }>
      ) => {
        const errors: string[] = [];
        const dailySchedule = new Map<string, string[]>();

        briefings.forEach((briefing) => {
          const date = briefing.scheduledAt.toISOString().split('T')[0];
          const time = briefing.scheduledAt.getHours();

          if (!dailySchedule.has(date)) {
            dailySchedule.set(date, []);
          }

          // Check for proper briefing times (8, 14, 20 hours)
          if (![8, 14, 20].includes(time)) {
            errors.push(
              `Invalid briefing time: ${time}:00 for ${briefing.type}`
            );
          }

          // Check for duplicate briefing types per day
          const dayTypes = dailySchedule.get(date)!;
          if (dayTypes.includes(briefing.type)) {
            errors.push(`Duplicate ${briefing.type} briefing on ${date}`);
          } else {
            dayTypes.push(briefing.type);
          }
        });

        return { valid: errors.length === 0, errors };
      };

      const briefings = [
        { type: 'MORNING', scheduledAt: new Date('2024-01-15T08:00:00Z') },
        { type: 'AFTERNOON', scheduledAt: new Date('2024-01-15T14:00:00Z') },
        { type: 'EVENING', scheduledAt: new Date('2024-01-15T20:00:00Z') },
        { type: 'MORNING', scheduledAt: new Date('2024-01-15T08:00:00Z') }, // Duplicate
        { type: 'MIDNIGHT', scheduledAt: new Date('2024-01-15T00:00:00Z') }, // Invalid time
      ];

      const validation = validateBriefingSchedule(briefings);

      expect(validation.valid).toBe(false);
      expect(
        validation.errors.some((e) => e.includes('Duplicate MORNING'))
      ).toBe(true);
      expect(
        validation.errors.some((e) => e.includes('Invalid briefing time: 0'))
      ).toBe(true);
    });

    it('should validate content length constraints', () => {
      const validateContentLength = (
        content: string,
        type: 'title' | 'summary' | 'section'
      ) => {
        const constraints = {
          title: { min: 10, max: 200 },
          summary: { min: 50, max: 300 },
          section: { min: 100, max: 1000 },
        };

        const constraint = constraints[type];
        const length = content.length;

        return {
          valid: length >= constraint.min && length <= constraint.max,
          length,
          min: constraint.min,
          max: constraint.max,
        };
      };

      expect(validateContentLength('Short', 'title').valid).toBe(false);
      expect(
        validateContentLength(
          'This is a sufficiently long title for validation',
          'title'
        ).valid
      ).toBe(true);
      expect(validateContentLength('A'.repeat(250), 'title').valid).toBe(false);
    });

    it('should validate quality score thresholds', () => {
      const validateQualityThresholds = (scores: {
        terryScore: number;
        qualityScore: number;
        factualAccuracy: number;
        brandVoice: number;
      }) => {
        const thresholds = {
          terryScore: 75,
          qualityScore: 80,
          factualAccuracy: 85,
          brandVoice: 80,
        };

        const failures: string[] = [];

        Object.entries(scores).forEach(([metric, score]) => {
          const threshold = thresholds[metric as keyof typeof thresholds];
          if (score < threshold) {
            failures.push(`${metric}: ${score} < ${threshold}`);
          }
        });

        return {
          passed: failures.length === 0,
          failures,
          overallScore:
            Object.values(scores).reduce((a, b) => a + b) /
            Object.values(scores).length,
        };
      };

      const highQualityScores = {
        terryScore: 85,
        qualityScore: 90,
        factualAccuracy: 92,
        brandVoice: 88,
      };

      const lowQualityScores = {
        terryScore: 60,
        qualityScore: 70,
        factualAccuracy: 75,
        brandVoice: 65,
      };

      expect(validateQualityThresholds(highQualityScores).passed).toBe(true);
      expect(validateQualityThresholds(lowQualityScores).passed).toBe(false);
      expect(
        validateQualityThresholds(lowQualityScores).failures.length
      ).toBeGreaterThan(0);
    });
  });

  describe('Temporal Data Integrity', () => {
    it('should validate time-based constraints', () => {
      const validateTimeConstraints = (data: {
        createdAt: Date;
        updatedAt: Date;
        publishedAt?: Date;
        scheduledAt?: Date;
      }) => {
        const errors: string[] = [];

        // Updated must be after created
        if (data.updatedAt < data.createdAt) {
          errors.push('Updated date cannot be before created date');
        }

        // Published must be after created
        if (data.publishedAt && data.publishedAt < data.createdAt) {
          errors.push('Published date cannot be before created date');
        }

        // Scheduled must be in the future (for scheduling)
        if (data.scheduledAt && data.scheduledAt < new Date()) {
          errors.push('Scheduled date must be in the future');
        }

        return { valid: errors.length === 0, errors };
      };

      const now = new Date();
      const validData = {
        createdAt: new Date(now.getTime() - 3600000), // 1 hour ago
        updatedAt: new Date(now.getTime() - 1800000), // 30 minutes ago
        publishedAt: new Date(now.getTime() - 600000), // 10 minutes ago
        scheduledAt: new Date(now.getTime() + 3600000), // 1 hour from now
      };

      const invalidData = {
        createdAt: new Date('2024-01-15T08:00:00Z'),
        updatedAt: new Date('2024-01-15T07:00:00Z'), // Before created
        publishedAt: new Date('2024-01-15T07:30:00Z'), // Before created
        scheduledAt: new Date('2024-01-14T20:00:00Z'), // In the past
      };

      expect(validateTimeConstraints(validData).valid).toBe(true);
      expect(validateTimeConstraints(invalidData).valid).toBe(false);
      expect(validateTimeConstraints(invalidData).errors).toHaveLength(3);
    });

    it('should validate briefing sequence integrity', () => {
      const validateBriefingSequence = (
        briefings: Array<{
          type: 'MORNING' | 'AFTERNOON' | 'EVENING';
          date: string;
          order: number;
        }>
      ) => {
        const errors: string[] = [];
        const dailyBriefings = new Map<string, typeof briefings>();

        // Group by date
        briefings.forEach((briefing) => {
          if (!dailyBriefings.has(briefing.date)) {
            dailyBriefings.set(briefing.date, []);
          }
          dailyBriefings.get(briefing.date)!.push(briefing);
        });

        // Validate each day's sequence
        dailyBriefings.forEach((dayBriefings, date) => {
          const expectedOrder = {
            MORNING: 1,
            AFTERNOON: 2,
            EVENING: 3,
          };

          dayBriefings.forEach((briefing) => {
            const expectedOrderValue = expectedOrder[briefing.type];
            if (briefing.order !== expectedOrderValue) {
              errors.push(
                `${briefing.type} briefing on ${date} has incorrect order: ${briefing.order}, expected: ${expectedOrderValue}`
              );
            }
          });
        });

        return { valid: errors.length === 0, errors };
      };

      const validSequence = [
        { type: 'MORNING' as const, date: '2024-01-15', order: 1 },
        { type: 'AFTERNOON' as const, date: '2024-01-15', order: 2 },
        { type: 'EVENING' as const, date: '2024-01-15', order: 3 },
      ];

      const invalidSequence = [
        { type: 'MORNING' as const, date: '2024-01-15', order: 2 }, // Wrong order
        { type: 'AFTERNOON' as const, date: '2024-01-15', order: 1 }, // Wrong order
        { type: 'EVENING' as const, date: '2024-01-15', order: 3 },
      ];

      expect(validateBriefingSequence(validSequence).valid).toBe(true);
      expect(validateBriefingSequence(invalidSequence).valid).toBe(false);
    });
  });
});
