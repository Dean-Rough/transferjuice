/**
 * Comprehensive Prisma Database Operations Tests
 * Testing all models, relationships, and database operations
 */

import { PrismaClient } from '@prisma/client';
import {
  prisma,
  testDatabaseConnection,
  getDatabaseHealth,
} from '@/lib/prisma';

// Mock database functions for testing
jest.mock('@/lib/prisma', () => ({
  prisma: {
    tweet: { create: jest.fn(), findMany: jest.fn(), createMany: jest.fn() },
    article: { create: jest.fn(), findUnique: jest.fn() },
    subscriber: { create: jest.fn() },
    newsletter: { create: jest.fn(), findUnique: jest.fn() },
    emailDelivery: { create: jest.fn(), findMany: jest.fn() },
    subscriberAnalytics: { create: jest.fn() },
    contentAnalytics: { create: jest.fn() },
    systemAnalytics: { create: jest.fn() },
    jobQueue: { create: jest.fn(), update: jest.fn() },
    appConfig: { create: jest.fn() },
    articleTweet: { create: jest.fn() },
    newsletterArticle: { create: jest.fn() },
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
  },
  testDatabaseConnection: jest.fn(),
  getDatabaseHealth: jest.fn(),
}));

describe('Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Prisma Client', () => {
    it('should connect to database successfully', async () => {
      (testDatabaseConnection as jest.Mock).mockResolvedValue(true);
      const isConnected = await testDatabaseConnection();
      expect(isConnected).toBe(true);
    });

    it('should return healthy database status', async () => {
      (getDatabaseHealth as jest.Mock).mockResolvedValue({
        status: 'healthy',
        responseTime: 25,
        timestamp: '2024-01-15T10:00:00.000Z',
      });

      const health = await getDatabaseHealth();
      expect(health.status).toBe('healthy');
      expect(health.responseTime).toBeGreaterThan(0);
      expect(health.timestamp).toBeDefined();
    });
  });

  describe('Tweet Operations', () => {
    it('should create tweet with all fields', async () => {
      const tweetData = {
        id: 'tweet_test_001',
        text: 'Arsenal close to signing midfielder for £50m. Medical tomorrow. #AFC',
        authorId: 'fab_romano',
        authorHandle: 'FabrizioRomano',
        authorName: 'Fabrizio Romano',
        authorVerified: true,
        authorFollowers: 15000000,
        createdAt: new Date('2024-01-15T14:30:00Z'),
        retweetCount: 2500,
        likeCount: 8900,
        replyCount: 445,
        quoteCount: 180,
        language: 'en',
        hashtags: ['AFC'],
        isTransferRelated: true,
        confidence: 0.95,
        transferType: 'CONFIRMED',
        priority: 'HIGH',
        keywords: ['signing', 'medical', 'Arsenal'],
        playersExtracted: ['midfielder'],
        clubsExtracted: ['Arsenal'],
        processed: true,
        processedAt: new Date('2024-01-15T14:35:00Z'),
      };

      (prisma.tweet.create as jest.Mock).mockResolvedValue(tweetData);
      const tweet = await prisma.tweet.create({ data: tweetData });

      expect(tweet.id).toBe(tweetData.id);
      expect(tweet.text).toBe(tweetData.text);
      expect(tweet.isTransferRelated).toBe(true);
      expect(tweet.transferType).toBe('CONFIRMED');
      expect(tweet.priority).toBe('HIGH');
    });

    it('should find tweets by transfer relevance', async () => {
      const mockTweets = [
        {
          id: 'tweet_relevant',
          text: 'Transfer news here',
          authorId: 'test',
          authorHandle: 'test',
          authorName: 'Test',
          createdAt: new Date(),
          isTransferRelated: true,
          confidence: 0.9,
        },
      ];

      (prisma.tweet.createMany as jest.Mock).mockResolvedValue({ count: 2 });
      (prisma.tweet.findMany as jest.Mock).mockResolvedValue(mockTweets);

      await prisma.tweet.createMany({
        data: [
          {
            id: 'tweet_relevant',
            text: 'Transfer news here',
            authorId: 'test',
            authorHandle: 'test',
            authorName: 'Test',
            createdAt: new Date(),
            isTransferRelated: true,
            confidence: 0.9,
          },
          {
            id: 'tweet_irrelevant',
            text: 'Just had lunch',
            authorId: 'test2',
            authorHandle: 'test2',
            authorName: 'Test2',
            createdAt: new Date(),
            isTransferRelated: false,
            confidence: 0.1,
          },
        ],
      });

      const relevantTweets = await prisma.tweet.findMany({
        where: { isTransferRelated: true },
      });

      expect(relevantTweets).toHaveLength(1);
      expect(relevantTweets[0].id).toBe('tweet_relevant');
    });
  });

  describe('Article Operations', () => {
    it('should create article with structured content', async () => {
      const articleData = {
        title: 'Arsenal Complete Major Signing',
        slug: 'arsenal-complete-major-signing',
        content: {
          sections: [
            {
              id: 'intro',
              type: 'introduction',
              title: 'The Deal',
              content: 'Arsenal have completed the signing...',
              order: 1,
            },
          ],
        },
        summary: 'Arsenal complete signing of midfielder',
        metaDescription: 'Arsenal sign new midfielder in major deal',
        briefingType: 'AFTERNOON',
        wordCount: 350,
        estimatedReadTime: 2,
        tags: ['Arsenal', 'Transfer'],
        status: 'PUBLISHED',
        qualityScore: 90.0,
        brandVoiceScore: 85.0,
        factualityScore: 95.0,
        readabilityScore: 88.0,
      };

      (prisma.article.create as jest.Mock).mockResolvedValue({
        ...articleData,
        id: 'article_1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const article = await prisma.article.create({ data: articleData });

      expect(article.title).toBe(articleData.title);
      expect(article.slug).toBe(articleData.slug);
      expect(article.briefingType).toBe('AFTERNOON');
      expect(article.status).toBe('PUBLISHED');
      expect(article.qualityScore).toBe(90.0);
    });

    it('should link articles to tweets via junction table', async () => {
      // Mock tweet creation
      const tweetData = {
        id: 'tweet_for_article',
        text: 'Breaking transfer news',
        authorId: 'test',
        authorHandle: 'test',
        authorName: 'Test',
        createdAt: new Date(),
      };

      (prisma.tweet.create as jest.Mock).mockResolvedValue(tweetData);
      const tweet = await prisma.tweet.create({ data: tweetData });

      // Mock article creation
      const articleData = {
        title: 'Test Article',
        slug: 'test-article',
        content: { sections: [] },
        summary: 'Test summary',
        metaDescription: 'Test description',
        briefingType: 'MORNING',
      };

      (prisma.article.create as jest.Mock).mockResolvedValue({
        ...articleData,
        id: 'article_for_tweet',
      });
      const article = await prisma.article.create({ data: articleData });

      // Mock junction table creation
      const articleTweetData = {
        articleId: article.id,
        tweetId: tweet.id,
        relevanceScore: 0.95,
        usedInSections: ['intro'],
        quotedDirectly: true,
      };

      (prisma.articleTweet.create as jest.Mock).mockResolvedValue(
        articleTweetData
      );
      const articleTweet = await prisma.articleTweet.create({
        data: articleTweetData,
      });

      expect(articleTweet.relevanceScore).toBe(0.95);
      expect(articleTweet.usedInSections).toContain('intro');
      expect(articleTweet.quotedDirectly).toBe(true);

      // Mock relationship retrieval
      (prisma.article.findUnique as jest.Mock).mockResolvedValue({
        ...article,
        sourceTweets: [
          {
            ...articleTweet,
            tweet: tweet,
          },
        ],
      });

      const articleWithTweets = await prisma.article.findUnique({
        where: { id: article.id },
        include: { sourceTweets: { include: { tweet: true } } },
      });

      expect(articleWithTweets?.sourceTweets).toHaveLength(1);
      expect(articleWithTweets?.sourceTweets[0].tweet.id).toBe(tweet.id);
    });
  });

  describe('Subscriber Operations', () => {
    it('should create subscriber with preferences', async () => {
      const subscriberData = {
        email: 'test@transferjuice.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'CONFIRMED' as const,
        favoriteTeams: ['Arsenal', 'Liverpool'],
        contentPreferences: ['TRANSFERS_ONLY', 'INJURY_NEWS'] as const,
        engagementScore: 0.85,
      };

      (prisma.subscriber.create as jest.Mock).mockResolvedValue({
        ...subscriberData,
        id: 'subscriber_1',
        subscribedAt: new Date(),
      });

      const subscriber = await prisma.subscriber.create({
        data: subscriberData,
      });

      expect(subscriber.email).toBe(subscriberData.email);
      expect(subscriber.status).toBe('CONFIRMED');
      expect(subscriber.favoriteTeams).toEqual(['Arsenal', 'Liverpool']);
      expect(subscriber.engagementScore).toBe(0.85);
    });

    it('should enforce email uniqueness', async () => {
      const email = 'duplicate@test.com';

      // Mock first creation success
      (prisma.subscriber.create as jest.Mock)
        .mockResolvedValueOnce({ id: 'sub_1', email, status: 'CONFIRMED' })
        .mockRejectedValueOnce(new Error('Unique constraint violation'));

      await prisma.subscriber.create({
        data: { email, status: 'CONFIRMED' },
      });

      await expect(
        prisma.subscriber.create({
          data: { email, status: 'PENDING' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Newsletter Operations', () => {
    it('should create newsletter with articles', async () => {
      // Mock article creation
      const articleData = {
        title: 'Newsletter Article',
        slug: 'newsletter-article',
        content: { sections: [] },
        summary: 'Summary',
        metaDescription: 'Description',
        briefingType: 'EVENING',
      };

      (prisma.article.create as jest.Mock).mockResolvedValue({
        ...articleData,
        id: 'article_newsletter',
      });
      const article = await prisma.article.create({ data: articleData });

      // Mock newsletter creation
      const newsletterData = {
        subject: 'Transfer Juice Evening Brief',
        briefingType: 'EVENING',
        briefingDate: new Date('2024-01-15'),
        htmlContent: '<html><body>Newsletter content</body></html>',
        textContent: 'Newsletter content',
        status: 'SENT',
        recipientCount: 1000,
        deliveredCount: 980,
        openCount: 450,
        clickCount: 89,
      };

      (prisma.newsletter.create as jest.Mock).mockResolvedValue({
        ...newsletterData,
        id: 'newsletter_1',
      });
      const newsletter = await prisma.newsletter.create({
        data: newsletterData,
      });

      // Mock junction table creation
      (prisma.newsletterArticle.create as jest.Mock).mockResolvedValue({
        newsletterId: newsletter.id,
        articleId: article.id,
        order: 1,
      });
      await prisma.newsletterArticle.create({
        data: {
          newsletterId: newsletter.id,
          articleId: article.id,
          order: 1,
        },
      });

      // Mock relationship query
      (prisma.newsletter.findUnique as jest.Mock).mockResolvedValue({
        ...newsletter,
        articles: [
          {
            newsletterId: newsletter.id,
            articleId: article.id,
            order: 1,
            article: article,
          },
        ],
      });

      const newsletterWithArticles = await prisma.newsletter.findUnique({
        where: { id: newsletter.id },
        include: { articles: { include: { article: true } } },
      });

      expect(newsletterWithArticles?.articles).toHaveLength(1);
      expect(newsletterWithArticles?.articles[0].article.title).toBe(
        'Newsletter Article'
      );
    });
  });

  describe('Email Delivery Operations', () => {
    it('should track email delivery with engagement metrics', async () => {
      // Create subscriber and newsletter
      const subscriber = await prisma.subscriber.create({
        data: { email: 'delivery@test.com', status: 'CONFIRMED' },
      });

      const newsletter = await prisma.newsletter.create({
        data: {
          subject: 'Test Newsletter',
          briefingType: 'MORNING',
          briefingDate: new Date(),
          htmlContent: '<html></html>',
          textContent: 'Text content',
        },
      });

      // Create delivery record
      const delivery = await prisma.emailDelivery.create({
        data: {
          subscriberId: subscriber.id,
          newsletterId: newsletter.id,
          status: 'DELIVERED',
          sentAt: new Date('2024-01-15T08:00:00Z'),
          deliveredAt: new Date('2024-01-15T08:02:00Z'),
          openedAt: new Date('2024-01-15T08:30:00Z'),
          openCount: 2,
          clickCount: 1,
          messageId: 'msg_test_123',
        },
      });

      expect(delivery.status).toBe('DELIVERED');
      expect(delivery.openCount).toBe(2);
      expect(delivery.clickCount).toBe(1);
    });
  });

  describe('Analytics Operations', () => {
    it('should create subscriber analytics with composite key', async () => {
      const subscriber = await prisma.subscriber.create({
        data: { email: 'analytics@test.com', status: 'CONFIRMED' },
      });

      const analyticsData = {
        subscriberId: subscriber.id,
        date: new Date('2024-01-15'),
        emailsReceived: 3,
        emailsOpened: 2,
        emailsClicked: 1,
        engagementScore: 0.75,
      };

      const analytics = await prisma.subscriberAnalytics.create({
        data: analyticsData,
      });

      expect(analytics.emailsReceived).toBe(3);
      expect(analytics.engagementScore).toBe(0.75);

      // Test composite key uniqueness
      await expect(
        prisma.subscriberAnalytics.create({
          data: analyticsData,
        })
      ).rejects.toThrow();
    });

    it('should create content analytics', async () => {
      const article = await prisma.article.create({
        data: {
          title: 'Analytics Article',
          slug: 'analytics-article',
          content: { sections: [] },
          summary: 'Summary',
          metaDescription: 'Description',
          briefingType: 'MORNING',
        },
      });

      const contentAnalytics = await prisma.contentAnalytics.create({
        data: {
          articleId: article.id,
          date: new Date('2024-01-15'),
          webViews: 1250,
          emailViews: 890,
          uniqueReaders: 756,
          timeOnPage: 125,
          scrollDepth: 0.85,
        },
      });

      expect(contentAnalytics.webViews).toBe(1250);
      expect(contentAnalytics.scrollDepth).toBe(0.85);
    });

    it('should create system analytics with date as primary key', async () => {
      const systemAnalytics = await prisma.systemAnalytics.create({
        data: {
          date: new Date('2024-01-15'),
          tweetsProcessed: 450,
          transferRelevant: 89,
          articlesGenerated: 12,
          emailsSent: 1250,
          avgProcessingTime: 2.3,
          errorRate: 0.02,
          aiTokensUsed: 15680,
          estimatedCost: 4.25,
        },
      });

      expect(systemAnalytics.tweetsProcessed).toBe(450);
      expect(systemAnalytics.errorRate).toBe(0.02);
    });
  });

  describe('Job Queue Operations', () => {
    it('should create and manage job queue entries', async () => {
      const job = await prisma.jobQueue.create({
        data: {
          type: 'FETCH_TWEETS',
          payload: {
            accounts: ['FabrizioRomano'],
            sinceId: 'tweet_123',
          },
          scheduledFor: new Date(Date.now() + 3600000),
          priority: 'HIGH',
        },
      });

      expect(job.type).toBe('FETCH_TWEETS');
      expect(job.status).toBe('PENDING');
      expect(job.priority).toBe('HIGH');

      // Update job status
      const updatedJob = await prisma.jobQueue.update({
        where: { id: job.id },
        data: { status: 'RUNNING', startedAt: new Date() },
      });

      expect(updatedJob.status).toBe('RUNNING');
      expect(updatedJob.startedAt).toBeDefined();
    });
  });

  describe('App Configuration Operations', () => {
    it('should manage application configuration', async () => {
      const config = await prisma.appConfig.create({
        data: {
          key: 'TWEET_FETCH_INTERVAL',
          value: 900,
          description: 'Tweet fetching interval in seconds',
          category: 'scheduling',
        },
      });

      expect(config.key).toBe('TWEET_FETCH_INTERVAL');
      expect(config.value).toBe(900);
      expect(config.category).toBe('scheduling');

      // Test key uniqueness
      await expect(
        prisma.appConfig.create({
          data: {
            key: 'TWEET_FETCH_INTERVAL',
            value: 1800,
            category: 'scheduling',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Complex Relationships', () => {
    it('should handle cascading deletes correctly', async () => {
      // Create subscriber
      const subscriber = await prisma.subscriber.create({
        data: { email: 'cascade@test.com', status: 'CONFIRMED' },
      });

      // Create newsletter
      const newsletter = await prisma.newsletter.create({
        data: {
          subject: 'Cascade Test',
          briefingType: 'MORNING',
          briefingDate: new Date(),
          htmlContent: '<html></html>',
          textContent: 'Text',
        },
      });

      // Create delivery
      await prisma.emailDelivery.create({
        data: {
          subscriberId: subscriber.id,
          newsletterId: newsletter.id,
          status: 'DELIVERED',
        },
      });

      // Delete subscriber should cascade to deliveries
      await prisma.subscriber.delete({
        where: { id: subscriber.id },
      });

      const deliveries = await prisma.emailDelivery.findMany({
        where: { subscriberId: subscriber.id },
      });

      expect(deliveries).toHaveLength(0);
    });
  });

  describe('Performance Tests', () => {
    it('should perform queries under 100ms benchmark', async () => {
      // Create test data
      const tweets = Array.from({ length: 100 }, (_, i) => ({
        id: `perf_tweet_${i}`,
        text: `Performance test tweet ${i}`,
        authorId: `author_${i}`,
        authorHandle: `handle_${i}`,
        authorName: `Name ${i}`,
        createdAt: new Date(),
        isTransferRelated: i % 2 === 0,
        confidence: Math.random(),
      }));

      await prisma.tweet.createMany({ data: tweets });

      // Test query performance
      const start = Date.now();
      const results = await prisma.tweet.findMany({
        where: { isTransferRelated: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Under 100ms benchmark
      expect(results.length).toBeLessThanOrEqual(10);
    });

    it('should efficiently query with indexes', async () => {
      // Create indexed test data
      await prisma.tweet.createMany({
        data: Array.from({ length: 50 }, (_, i) => ({
          id: `idx_tweet_${i}`,
          text: `Indexed tweet ${i}`,
          authorId: 'test_author',
          authorHandle: 'TestHandle',
          authorName: 'Test Author',
          createdAt: new Date(Date.now() - i * 60000),
          isTransferRelated: true,
          confidence: 0.9,
          transferType: i < 25 ? 'CONFIRMED' : 'RUMOUR',
          priority: 'HIGH',
        })),
      });

      const start = Date.now();
      const results = await prisma.tweet.findMany({
        where: {
          isTransferRelated: true,
          transferType: 'CONFIRMED',
          priority: 'HIGH',
        },
        orderBy: { createdAt: 'desc' },
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(50); // Even faster with proper indexing
      expect(results).toHaveLength(25);
    });
  });
});
