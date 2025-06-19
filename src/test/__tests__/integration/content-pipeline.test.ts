/**
 * Content Pipeline Integration Tests
 * Tests the complete content generation and processing workflow
 */

import { mockAIService } from '../../mocks/ai';
import { mockDatabase } from '../../mocks/database';
import { factories } from '../../factories';

describe('Content Pipeline Integration', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
  });

  describe('AI Content Generation', () => {
    it('should generate high-quality articles from tweets', async () => {
      const request = {
        briefingType: 'morning' as const,
        sourceTweetIds: ['tweet_001', 'tweet_002'],
        targetWordCount: 800,
        tone: 'witty' as const,
        includeImages: true,
      };

      const article = await mockAIService.generateArticle(request);

      expect(article.title).toBeDefined();
      expect(article.sections).toHaveLength(3);
      expect(article.wordCount).toBeGreaterThan(200);
      expect(article.estimatedReadTime).toBeGreaterThan(0);

      // Verify sections are properly ordered
      article.sections.forEach((section, index) => {
        expect(section.order).toBe(index);
        expect(section.wordCount).toBeGreaterThan(0);
      });
    });

    it('should assess transfer relevance accurately', async () => {
      const tweets = [
        'BREAKING: Arsenal complete signing of Declan Rice for £105m',
        'Beautiful sunset from my holiday in Italy 🌅',
        'Manchester United interested in Bellingham according to sources',
      ];

      const assessments = await Promise.all(
        tweets.map((tweet) => mockAIService.assessTransferRelevance(tweet))
      );

      // First tweet should be high relevance
      expect(assessments[0].isTransferRelated).toBe(true);
      expect(assessments[0].confidence).toBeGreaterThan(0.8);
      expect(assessments[0].priority).toBe('high');

      // Second tweet should not be transfer related
      expect(assessments[1].isTransferRelated).toBe(false);
      expect(assessments[1].confidence).toBeLessThan(0.3);

      // Third tweet should be medium relevance
      expect(assessments[2].isTransferRelated).toBe(true);
      expect(assessments[2].confidence).toBeLessThan(0.9);
      expect(assessments[2].priority).toBe('medium');
    });

    it('should validate content quality appropriately', async () => {
      const content =
        'This is a well-written article about transfer news with proper grammar and structure.';

      const quality = await mockAIService.validateContentQuality(content);

      expect(quality.grammarScore).toBeGreaterThan(80);
      expect(quality.readabilityScore).toBeGreaterThan(70);
      expect(quality.overallScore).toBeGreaterThan(75);
      expect(quality.flags).toHaveLength(0);
      expect(quality.humanReviewRequired).toBe(false);
    });

    it('should handle different quality levels', async () => {
      mockAIService.setQualityLevel('low');

      const article = await mockAIService.generateArticle({
        briefingType: 'morning',
        sourceTweetIds: ['tweet_001'],
        targetWordCount: 400,
        tone: 'witty',
        includeImages: false,
      });

      expect(article.sections).toHaveLength(1); // Minimal content for low quality
      expect(article.wordCount).toBeLessThan(200);
      expect(article.estimatedReadTime).toBe(1);
    });
  });

  describe('Database Operations', () => {
    it('should store and retrieve articles correctly', async () => {
      const article = factories.article({
        title: 'Test Database Article',
        briefingType: 'afternoon',
        status: 'published',
      });

      // Create article
      const created = await mockDatabase.createArticle(article);
      expect(created.id).toBeDefined();
      expect(created.title).toBe(article.title);

      // Retrieve article
      const retrieved = await mockDatabase.getArticleById(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.title).toBe(article.title);

      // Update article
      const updated = await mockDatabase.updateArticle(created.id, {
        status: 'archived',
      });
      expect(updated?.status).toBe('archived');
      expect(updated?.lastModified).toBeInstanceOf(Date);
    });

    it('should handle concurrent database operations', async () => {
      const articles = factories.multiple.articles(5);

      // Create multiple articles concurrently
      const createPromises = articles.map((article) =>
        mockDatabase.createArticle(article)
      );

      const createdArticles = await Promise.all(createPromises);

      expect(createdArticles).toHaveLength(5);
      createdArticles.forEach((article, index) => {
        expect(article.id).toBeDefined();
        expect(article.title).toBe(articles[index].title);
      });

      // Verify all articles can be retrieved
      const retrievePromises = createdArticles.map((article) =>
        mockDatabase.getArticleById(article.id)
      );

      const retrievedArticles = await Promise.all(retrievePromises);
      expect(retrievedArticles.every((article) => article !== null)).toBe(true);
    });

    it('should maintain data integrity during transactions', async () => {
      const transaction = await mockDatabase.beginTransaction();

      try {
        const article = factories.article();
        const created = await mockDatabase.createArticle(article);

        // Simulate error condition
        if (created.title.includes('error')) {
          throw new Error('Simulated error');
        }

        await transaction.commit();

        // Verify article exists after commit
        const retrieved = await mockDatabase.getArticleById(created.id);
        expect(retrieved).not.toBeNull();
      } catch (error) {
        await transaction.rollback();

        // After rollback, database should be in original state
        const initialCount = mockDatabase.getTableRowCount('articles');
        expect(initialCount).toBe(1); // Only the seed data
      }
    });

    it('should handle database errors gracefully', async () => {
      mockDatabase.setError(true);

      await expect(
        mockDatabase.createArticle(factories.article())
      ).rejects.toThrow('Database error');

      // Reset and verify normal operation resumes
      mockDatabase.setError(false);

      const article = await mockDatabase.createArticle(factories.article());
      expect(article.id).toBeDefined();
    });
  });

  describe('Complete Content Pipeline', () => {
    it('should process tweets through full pipeline', async () => {
      // 1. Generate processed tweets
      const tweets = [
        factories.processedTweet({
          relevance: factories.transferRelevance('high'),
          originalTweet: factories.twitterTweet({
            text: 'BREAKING: Arsenal complete Declan Rice signing for £105m',
          }),
        }),
        factories.processedTweet({
          relevance: factories.transferRelevance('medium'),
          originalTweet: factories.twitterTweet({
            text: 'Manchester United monitoring Bellingham situation',
          }),
        }),
      ];

      // 2. Store processed tweets
      const storedTweets = await Promise.all(
        tweets.map((tweet) => mockDatabase.createProcessedTweet(tweet))
      );

      expect(storedTweets).toHaveLength(2);

      // 3. Get high-relevance tweets for content generation
      const relevantTweets =
        await mockDatabase.getProcessedTweetsByRelevance(0.8);
      expect(relevantTweets).toHaveLength(1);
      expect(relevantTweets[0].relevance.priority).toBe('high');

      // 4. Generate article content
      const article = await mockAIService.generateArticle({
        briefingType: 'morning',
        sourceTweetIds: relevantTweets.map((t) => t.originalTweet.id),
        targetWordCount: 600,
        tone: 'witty',
        includeImages: true,
      });

      expect(article.sections).toHaveLength(3);
      expect(article.tags).toContain('Transfer');

      // 5. Store generated article
      const storedArticle = await mockDatabase.createArticle({
        ...article,
        sourceTweets: relevantTweets.map((t) => t.originalTweet.id),
        aiGeneration: await mockAIService.generateMetadata(),
      });

      expect(storedArticle.id).toBeDefined();
      expect(storedArticle.sourceTweets).toHaveLength(1);
    });

    it('should handle low-quality content appropriately', async () => {
      mockAIService.setQualityLevel('low');

      const article = await mockAIService.generateArticle({
        briefingType: 'evening',
        sourceTweetIds: ['tweet_001'],
        targetWordCount: 800,
        tone: 'informative',
        includeImages: false,
      });

      const quality = await mockAIService.validateContentQuality(
        article.summary
      );

      expect(quality.overallScore).toBeLessThan(70);
      expect(quality.humanReviewRequired).toBe(true);
      expect(quality.flags).toContain('grammar_issues');

      // Low quality content should not be auto-published
      const storedArticle = await mockDatabase.createArticle({
        ...article,
        status: quality.humanReviewRequired ? 'under_review' : 'approved',
        quality,
      });

      expect(storedArticle.status).toBe('under_review');
    });

    it('should measure pipeline performance', async () => {
      const startTime = Date.now();

      // Simulate realistic processing delays
      testUtils.setResponseDelays({
        ai: 100,
        database: 50,
      });

      const tweet = factories.processedTweet({
        relevance: factories.transferRelevance('high'),
      });

      await mockDatabase.createProcessedTweet(tweet);

      const article = await mockAIService.generateArticle({
        briefingType: 'morning',
        sourceTweetIds: [tweet.originalTweet.id],
        targetWordCount: 600,
        tone: 'witty',
        includeImages: true,
      });

      await mockDatabase.createArticle(article);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Pipeline should complete within reasonable time
      expect(totalTime).toBeLessThan(1000);
      expect(totalTime).toBeGreaterThan(150); // Should account for delays
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle AI service failures gracefully', async () => {
      mockAIService.setError(true);

      await expect(
        mockAIService.generateArticle({
          briefingType: 'morning',
          sourceTweetIds: ['tweet_001'],
          targetWordCount: 600,
          tone: 'witty',
          includeImages: false,
        })
      ).rejects.toThrow('AI service temporarily unavailable');

      // Verify system can recover
      mockAIService.setError(false);

      const article = await mockAIService.generateArticle({
        briefingType: 'morning',
        sourceTweetIds: ['tweet_001'],
        targetWordCount: 600,
        tone: 'witty',
        includeImages: false,
      });

      expect(article.title).toBeDefined();
    });

    it('should handle partial pipeline failures', async () => {
      // Create content successfully
      const article = await mockAIService.generateArticle({
        briefingType: 'afternoon',
        sourceTweetIds: ['tweet_001'],
        targetWordCount: 500,
        tone: 'sarcastic',
        includeImages: false,
      });

      // Simulate database failure during storage
      mockDatabase.setError(true);

      await expect(mockDatabase.createArticle(article)).rejects.toThrow(
        'Database error'
      );

      // Verify content generation worked but storage failed
      expect(article.title).toBeDefined();
      expect(article.sections).toHaveLength(1); // Low quality due to small word count
    });
  });

  describe('Performance Optimization', () => {
    it('should batch process multiple tweets efficiently', async () => {
      const tweets = factories.multiple.tweets(50);
      const startTime = Date.now();

      // Process tweets in batches
      const batchSize = 10;
      const batches = [];

      for (let i = 0; i < tweets.length; i += batchSize) {
        const batch = tweets.slice(i, i + batchSize);
        batches.push(
          Promise.all(
            batch.map((tweet) =>
              mockAIService.assessTransferRelevance(tweet.text)
            )
          )
        );
      }

      const results = await Promise.all(batches);
      const flatResults = results.flat();

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(flatResults).toHaveLength(50);
      expect(processingTime).toBeLessThan(1000); // Should be fast with mocks

      // Verify some tweets were classified as transfer-related
      const transferRelated = flatResults.filter(
        (result) => result.isTransferRelated
      );
      expect(transferRelated.length).toBeGreaterThan(0);
    });
  });
});
