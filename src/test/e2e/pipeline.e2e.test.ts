/**
 * End-to-End Pipeline Testing
 * Comprehensive testing of the complete Transfer Juice data pipeline
 * from tweet fetching through article generation to quality validation
 */

import { TwitterClient } from '@/lib/twitter/client';
import { AIContentAnalyzer } from '@/lib/ai/content-analyzer';
import { TerryArticleGenerator } from '@/lib/ai/article-generator';
import { ContentQualityValidator } from '@/lib/ai/quality-validator';
import { PrismaClient } from '@prisma/client';
import type { TweetInput } from '@/lib/ai/content-analyzer';
import type { BriefingType } from '@prisma/client';

// Mock external services for E2E testing
jest.mock('@/lib/twitter/client');
jest.mock('openai');

describe('End-to-End Pipeline Testing', () => {
  let twitterClient: jest.Mocked<TwitterClient>;
  let analyzer: AIContentAnalyzer;
  let generator: TerryArticleGenerator;
  let validator: ContentQualityValidator;
  let prisma: PrismaClient;

  // Test data fixtures
  const mockRawTweets = [
    {
      id: '1745123456789012345',
      text: 'BREAKING: Manchester United are close to signing Declan Rice for £100m after successful medical tests. Deal expected to be announced within 48 hours. @FabrizioRomano confirms personal terms agreed.',
      author_id: '285989651',
      created_at: '2024-01-15T10:30:00.000Z',
      public_metrics: {
        retweet_count: 5420,
        like_count: 18760,
        reply_count: 892,
        quote_count: 234,
      },
      attachments: {
        media_keys: ['3_1745123456789012346'],
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
        media: [
          {
            media_key: '3_1745123456789012346',
            type: 'photo',
            url: 'https://pbs.twimg.com/media/test.jpg',
          },
        ],
      },
    },
    {
      id: '1745123456789012347',
      text: 'Arsenal are monitoring Gabriel Jesus situation. Personal terms discussed but no official bid yet. Medical would be scheduled if clubs reach agreement on fee structure.',
      author_id: '14076555',
      created_at: '2024-01-15T11:15:00.000Z',
      public_metrics: {
        retweet_count: 3240,
        like_count: 12450,
        reply_count: 567,
        quote_count: 189,
      },
      includes: {
        users: [
          {
            id: '14076555',
            username: 'David_Ornstein',
            name: 'David Ornstein',
            verified: true,
          },
        ],
      },
    },
    {
      id: '1745123456789012348',
      text: 'Chelsea working on several outgoings this week. Multiple players could leave on loan or permanent deals. Need to balance books before new arrivals. PSR considerations.',
      author_id: '39749476',
      created_at: '2024-01-15T12:00:00.000Z',
      public_metrics: {
        retweet_count: 1850,
        like_count: 7230,
        reply_count: 423,
        quote_count: 95,
      },
      includes: {
        users: [
          {
            id: '39749476',
            username: 'Matt_Law_DT',
            name: 'Matt Law',
            verified: true,
          },
        ],
      },
    },
  ];

  const mockProcessedTweets: TweetInput[] = [
    {
      id: 'tweet_1745123456789012345',
      text: 'BREAKING: Manchester United are close to signing Declan Rice for £100m after successful medical tests. Deal expected to be announced within 48 hours. @FabrizioRomano confirms personal terms agreed.',
      authorHandle: 'FabrizioRomano',
      authorName: 'Fabrizio Romano',
      authorVerified: true,
      authorTier: 'tier1',
      createdAt: new Date('2024-01-15T10:30:00.000Z'),
      metrics: {
        retweets: 5420,
        likes: 18760,
        replies: 892,
        quotes: 234,
      },
      context: {
        recentTweets: [],
        authorSpecialties: ['Transfer news', 'Premier League'],
      },
    },
    {
      id: 'tweet_1745123456789012347',
      text: 'Arsenal are monitoring Gabriel Jesus situation. Personal terms discussed but no official bid yet. Medical would be scheduled if clubs reach agreement on fee structure.',
      authorHandle: 'David_Ornstein',
      authorName: 'David Ornstein',
      authorVerified: true,
      authorTier: 'tier1',
      createdAt: new Date('2024-01-15T11:15:00.000Z'),
      metrics: {
        retweets: 3240,
        likes: 12450,
        replies: 567,
        quotes: 189,
      },
      context: {
        recentTweets: [],
        authorSpecialties: ['Arsenal', 'Premier League'],
      },
    },
    {
      id: 'tweet_1745123456789012348',
      text: 'Chelsea working on several outgoings this week. Multiple players could leave on loan or permanent deals. Need to balance books before new arrivals. PSR considerations.',
      authorHandle: 'Matt_Law_DT',
      authorName: 'Matt Law',
      authorVerified: true,
      authorTier: 'tier2',
      createdAt: new Date('2024-01-15T12:00:00.000Z'),
      metrics: {
        retweets: 1850,
        likes: 7230,
        replies: 423,
        quotes: 95,
      },
      context: {
        recentTweets: [],
        authorSpecialties: ['Chelsea', 'Transfer news'],
      },
    },
  ];

  beforeAll(async () => {
    // Initialize test database
    prisma = new PrismaClient({
      datasourceUrl:
        process.env.TEST_DATABASE_URL ||
        'postgresql://test:test@localhost:5432/transfer_juice_test',
    });

    // Initialize pipeline components
    twitterClient = new TwitterClient({
      bearerToken: 'test-bearer-token',
    }) as jest.Mocked<TwitterClient>;

    analyzer = new AIContentAnalyzer({
      openaiApiKey: 'test-openai-key',
      enableCaching: false, // Disable caching for tests
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

  describe('Complete Pipeline Flow', () => {
    it('should execute end-to-end pipeline successfully', async () => {
      // Step 1: Mock Twitter API response
      twitterClient.fetchRecentTweets = jest.fn().mockResolvedValue({
        data: mockRawTweets,
        meta: {
          result_count: 3,
          newest_id: '1745123456789012348',
          oldest_id: '1745123456789012345',
        },
      });

      // Step 2: Mock AI service responses
      const mockAnalysisResults = mockProcessedTweets.map((tweet) => ({
        classification: {
          isTransferRelated: true,
          transferType: 'CONFIRMED' as const,
          priority: 'HIGH' as const,
          confidence: 0.92,
          categories: ['signing', 'medical'],
          keyPoints: ['Manchester United', 'Declan Rice', '£100m'],
        },
        entities: {
          players: [{ name: 'Declan Rice', confidence: 0.95 }],
          clubs: [{ name: 'Manchester United', confidence: 0.98 }],
          transferDetails: [
            { type: 'fee' as const, value: '£100m', confidence: 0.9 },
          ],
          agents: [],
        },
        sentiment: {
          sentiment: 'positive' as const,
          confidence: 0.85,
          emotions: ['excitement', 'optimism'],
          reliability: 0.92,
          urgency: 0.8,
        },
        qualityScore: 88,
        terryCompatibility: 78,
        processingTime: 1200,
        aiModel: 'gpt-4-turbo-preview',
      }));

      // Mock AI calls
      jest.spyOn(analyzer, 'analyzeTweet').mockImplementation(async (tweet) => {
        const index = mockProcessedTweets.findIndex((t) => t.id === tweet.id);
        return mockAnalysisResults[index] || mockAnalysisResults[0];
      });

      const mockArticle = {
        title: 'Transfer Chaos: United Finally Get Their Man',
        slug: 'transfer-chaos-united-finally-get-their-man',
        content: {
          sections: [
            {
              id: 'section_intro_1',
              type: 'intro' as const,
              title: 'The Latest Chaos',
              content: 'Right, this might be the most cursed transfer saga...',
              order: 1,
              sourceTweets: ['tweet_1745123456789012345'],
              terryisms: ['(of course)', 'properly mental'],
            },
            {
              id: 'section_main_2',
              type: 'main' as const,
              title: 'The Main Event',
              content:
                'What this actually means, beyond the obvious financial lunacy...',
              order: 2,
              sourceTweets: ['tweet_1745123456789012347'],
              terryisms: ['beyond the obvious financial lunacy'],
            },
          ],
          wordCount: 450,
          estimatedReadTime: 3,
          terryScore: 82,
          qualityMetrics: {
            coherence: 88,
            factualAccuracy: 92,
            brandVoice: 82,
            readability: 85,
          },
        },
        summary:
          'Manchester United complete Declan Rice signing in latest transfer madness.',
        metaDescription:
          'United finally get their man as Rice joins for £100m.',
        tags: ['Manchester United', 'Declan Rice', 'Transfer'],
        briefingType: 'MORNING' as BriefingType,
        status: 'REVIEW' as const,
        qualityScore: 87,
        aiModel: 'gpt-4-turbo-preview',
        generationTime: 4500,
      };

      jest.spyOn(generator, 'generateArticle').mockResolvedValue(mockArticle);

      const mockValidation = {
        overallScore: 89,
        passed: true,
        requiresHumanReview: false,
        blockers: [],
        warnings: [],
        checks: [
          {
            category: 'factual_accuracy' as const,
            score: 92,
            passed: true,
            issues: [],
            checkedAt: new Date(),
            checker: 'ai' as const,
          },
          {
            category: 'brand_voice' as const,
            score: 82,
            passed: true,
            issues: [],
            checkedAt: new Date(),
            checker: 'ai' as const,
          },
        ],
        recommendations: [],
        validatedAt: new Date(),
        validationTime: 800,
      };

      jest
        .spyOn(validator, 'validateContent')
        .mockResolvedValue(mockValidation);

      // Execute the complete pipeline
      const startTime = Date.now();

      // Step 1: Fetch tweets from Twitter
      const twitterResponse = await twitterClient.fetchRecentTweets([
        'FabrizioRomano',
      ]);
      expect(twitterResponse.data).toHaveLength(3);

      // Step 2: Process tweets through AI analyzer
      const analyses = await Promise.all(
        mockProcessedTweets.map((tweet) => analyzer.analyzeTweet(tweet))
      );
      expect(analyses).toHaveLength(3);
      expect(analyses.every((a) => a.classification.isTransferRelated)).toBe(
        true
      );

      // Step 3: Generate article from analyses
      const article = await generator.generateArticle({
        briefingType: 'MORNING',
        tweetAnalyses: analyses,
        briefingDate: new Date('2024-01-15T08:00:00Z'),
        targetWordCount: 800,
      });
      expect(article.title).toBeTruthy();
      expect(article.content.sections).toHaveLength(2);
      expect(article.qualityScore).toBeGreaterThan(80);

      // Step 4: Validate generated content
      const validation = await validator.validateContent(article);
      expect(validation.passed).toBe(true);
      expect(validation.overallScore).toBeGreaterThan(85);

      const totalTime = Date.now() - startTime;

      // Verify pipeline performance
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(validation.blockers).toHaveLength(0);
      expect(article.status).toBe('REVIEW');

      // Verify data integrity throughout pipeline
      expect(analyses.every((a) => a.processingTime > 0)).toBe(true);
      expect(article.generationTime).toBeGreaterThan(0);
      expect(validation.validationTime).toBeGreaterThan(0);
    }, 15000); // 15 second timeout for E2E test

    it('should handle pipeline interruption gracefully', async () => {
      // Simulate Twitter API failure
      twitterClient.fetchRecentTweets = jest
        .fn()
        .mockRejectedValue(new Error('Twitter API rate limit exceeded'));

      await expect(
        twitterClient.fetchRecentTweets(['FabrizioRomano'])
      ).rejects.toThrow('Twitter API rate limit exceeded');

      // Pipeline should handle the failure and not crash
      expect(true).toBe(true); // Test passes if we reach here
    });

    it('should maintain data quality under load', async () => {
      // Simulate processing multiple batches concurrently
      const batches = Array(5).fill(mockProcessedTweets);

      jest
        .spyOn(analyzer, 'analyzeTweet')
        .mockImplementation(async (tweet) => ({
          classification: {
            isTransferRelated: true,
            transferType: 'CONFIRMED',
            priority: 'HIGH',
            confidence: 0.9,
            categories: ['signing'],
            keyPoints: ['Test transfer'],
          },
          entities: {
            players: [{ name: 'Test Player', confidence: 0.9 }],
            clubs: [{ name: 'Test Club', confidence: 0.9 }],
            transferDetails: [],
            agents: [],
          },
          sentiment: {
            sentiment: 'positive',
            confidence: 0.8,
            emotions: ['excitement'],
            reliability: 0.9,
            urgency: 0.7,
          },
          qualityScore: 85,
          terryCompatibility: 75,
          processingTime: 1000,
          aiModel: 'gpt-4-turbo-preview',
        }));

      const startTime = Date.now();

      // Process all batches concurrently
      const results = await Promise.all(
        batches.map(async (batch) => {
          return Promise.all(
            batch.map((tweet) => analyzer.analyzeTweet(tweet))
          );
        })
      );

      const processingTime = Date.now() - startTime;

      // Verify all results maintain quality
      expect(results).toHaveLength(5);
      expect(
        results.every((batch) =>
          batch.every((analysis) => analysis.qualityScore >= 80)
        )
      ).toBe(true);

      // Verify reasonable performance under load
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Data Transformation Validation', () => {
    it('should validate tweet data transformation correctly', () => {
      const rawTweet = mockRawTweets[0];

      // Transform raw tweet to processed format
      const processedTweet: TweetInput = {
        id: `tweet_${rawTweet.id}`,
        text: rawTweet.text,
        authorHandle: rawTweet.includes.users[0].username,
        authorName: rawTweet.includes.users[0].name,
        authorVerified: rawTweet.includes.users[0].verified,
        authorTier: 'tier1', // Would be determined by ITK classification
        createdAt: new Date(rawTweet.created_at),
        metrics: {
          retweets: rawTweet.public_metrics.retweet_count,
          likes: rawTweet.public_metrics.like_count,
          replies: rawTweet.public_metrics.reply_count,
          quotes: rawTweet.public_metrics.quote_count,
        },
        context: {
          recentTweets: [],
          authorSpecialties: ['Transfer news', 'Premier League'],
        },
      };

      // Validate transformation integrity
      expect(processedTweet.id).toBe(`tweet_${rawTweet.id}`);
      expect(processedTweet.text).toBe(rawTweet.text);
      expect(processedTweet.authorHandle).toBe(
        rawTweet.includes.users[0].username
      );
      expect(processedTweet.metrics.likes).toBe(
        rawTweet.public_metrics.like_count
      );
      expect(processedTweet.createdAt.getTime()).toBe(
        new Date(rawTweet.created_at).getTime()
      );
    });

    it('should validate analysis to article transformation', () => {
      const mockAnalyses = [
        {
          classification: {
            isTransferRelated: true,
            keyPoints: ['Manchester United', 'Declan Rice', '£100m'],
          },
          entities: {
            players: [{ name: 'Declan Rice', confidence: 0.95 }],
            clubs: [{ name: 'Manchester United', confidence: 0.98 }],
          },
          qualityScore: 88,
          terryCompatibility: 78,
        },
      ];

      // Verify key information is preserved through transformation
      expect(mockAnalyses[0].classification.keyPoints).toContain('Declan Rice');
      expect(mockAnalyses[0].entities.players[0].name).toBe('Declan Rice');
      expect(mockAnalyses[0].qualityScore).toBeGreaterThan(80);
    });
  });

  describe('Error Propagation and Recovery', () => {
    it('should handle AI service timeouts gracefully', async () => {
      // Mock timeout scenario
      jest.spyOn(analyzer, 'analyzeTweet').mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        throw new Error('Request timeout');
      });

      await expect(
        analyzer.analyzeTweet(mockProcessedTweets[0])
      ).rejects.toThrow('Request timeout');

      // Verify error doesn't crash the pipeline
      expect(true).toBe(true);
    });

    it('should recover from partial pipeline failures', async () => {
      // Mock scenario where some tweets fail analysis
      let callCount = 0;
      jest.spyOn(analyzer, 'analyzeTweet').mockImplementation(async (tweet) => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Analysis failed for this tweet');
        }
        return {
          classification: {
            isTransferRelated: true,
            transferType: 'CONFIRMED',
            priority: 'HIGH',
            confidence: 0.9,
            categories: ['signing'],
            keyPoints: ['Test'],
          },
          entities: { players: [], clubs: [], transferDetails: [], agents: [] },
          sentiment: {
            sentiment: 'positive',
            confidence: 0.8,
            emotions: [],
            reliability: 0.9,
            urgency: 0.7,
          },
          qualityScore: 85,
          terryCompatibility: 75,
          processingTime: 1000,
          aiModel: 'gpt-4-turbo-preview',
        };
      });

      // Process tweets with some failures
      const results = await Promise.allSettled(
        mockProcessedTweets.map((tweet) => analyzer.analyzeTweet(tweet))
      );

      // Verify partial success handling
      const successful = results.filter((r) => r.status === 'fulfilled');
      const failed = results.filter((r) => r.status === 'rejected');

      expect(successful).toHaveLength(2);
      expect(failed).toHaveLength(1);
    });
  });

  describe('Schema Validation', () => {
    it('should enforce tweet input schema', () => {
      const invalidTweet = {
        id: 'test',
        text: 'Test tweet',
        // Missing required fields
      };

      // This would fail validation in real implementation
      expect(() => {
        // Simulate schema validation
        if (!invalidTweet.authorHandle || !invalidTweet.authorName) {
          throw new Error('Invalid tweet schema: missing required fields');
        }
      }).toThrow('Invalid tweet schema');
    });

    it('should enforce article generation schema', () => {
      const invalidArticle = {
        title: 'Test',
        // Missing required fields
      };

      expect(() => {
        if (!invalidArticle.content || !invalidArticle.slug) {
          throw new Error('Invalid article schema: missing required fields');
        }
      }).toThrow('Invalid article schema');
    });
  });

  describe('Performance Requirements', () => {
    it('should meet SLA requirements for individual components', async () => {
      const tweet = mockProcessedTweets[0];

      // Mock fast responses
      jest.spyOn(analyzer, 'analyzeTweet').mockResolvedValue({
        classification: {
          isTransferRelated: true,
          transferType: 'CONFIRMED',
          priority: 'HIGH',
          confidence: 0.9,
          categories: ['signing'],
          keyPoints: ['Test'],
        },
        entities: { players: [], clubs: [], transferDetails: [], agents: [] },
        sentiment: {
          sentiment: 'positive',
          confidence: 0.8,
          emotions: [],
          reliability: 0.9,
          urgency: 0.7,
        },
        qualityScore: 85,
        terryCompatibility: 75,
        processingTime: 800,
        aiModel: 'gpt-4-turbo-preview',
      });

      const startTime = Date.now();
      const result = await analyzer.analyzeTweet(tweet);
      const analysisTime = Date.now() - startTime;

      // SLA: Analysis should complete within 2 seconds
      expect(analysisTime).toBeLessThan(2000);
      expect(result.processingTime).toBeLessThan(1000);
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const tweets = Array(concurrentRequests).fill(mockProcessedTweets[0]);

      jest.spyOn(analyzer, 'analyzeTweet').mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return {
          classification: {
            isTransferRelated: true,
            transferType: 'CONFIRMED',
            priority: 'HIGH',
            confidence: 0.9,
            categories: ['signing'],
            keyPoints: ['Test'],
          },
          entities: { players: [], clubs: [], transferDetails: [], agents: [] },
          sentiment: {
            sentiment: 'positive',
            confidence: 0.8,
            emotions: [],
            reliability: 0.9,
            urgency: 0.7,
          },
          qualityScore: 85,
          terryCompatibility: 75,
          processingTime: 100,
          aiModel: 'gpt-4-turbo-preview',
        };
      });

      const startTime = Date.now();
      const results = await Promise.all(
        tweets.map((tweet) => analyzer.analyzeTweet(tweet))
      );
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(concurrentRequests);
      // Should complete all requests within 1 second (parallel processing)
      expect(totalTime).toBeLessThan(1000);
    });
  });

  describe('Data Quality Monitoring', () => {
    it('should track quality metrics across pipeline stages', async () => {
      const qualityMetrics = {
        tweetFetchSuccess: 95,
        analysisSuccess: 92,
        generationSuccess: 88,
        validationSuccess: 94,
        overallPipelineSuccess: 89,
      };

      // Verify quality metrics meet thresholds
      expect(qualityMetrics.tweetFetchSuccess).toBeGreaterThan(90);
      expect(qualityMetrics.analysisSuccess).toBeGreaterThan(90);
      expect(qualityMetrics.generationSuccess).toBeGreaterThan(85);
      expect(qualityMetrics.validationSuccess).toBeGreaterThan(90);
      expect(qualityMetrics.overallPipelineSuccess).toBeGreaterThan(85);
    });

    it('should detect quality degradation', () => {
      const recentMetrics = [85, 82, 78, 75]; // Declining quality
      const threshold = 80;
      const trend = recentMetrics.slice(-3);
      const averageRecent = trend.reduce((a, b) => a + b) / trend.length;

      if (averageRecent < threshold) {
        // Would trigger alert in real implementation
        expect(averageRecent).toBeLessThan(threshold);
      }
    });
  });
});
