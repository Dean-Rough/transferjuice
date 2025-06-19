/**
 * Twitter Service Integration Tests
 * Tests the complete Twitter API integration workflow
 */

import { mockTwitterClient } from '../../mocks/twitter';
import { factories } from '../../factories';

describe('Twitter Service Integration', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
  });

  describe('User Fetching', () => {
    it('should fetch ITK users successfully', async () => {
      const usernames = ['FabrizioRomano', 'DavidOrnstein'];
      const response = await mockTwitterClient.getUsersByUsernames(usernames);

      expect(response.data).toBeDefined();
      expect(response.meta.result_count).toBeGreaterThan(0);
      expect(
        response.data?.every((user) => usernames.includes(user.username))
      ).toBe(true);
    });

    it('should handle rate limiting gracefully', async () => {
      mockTwitterClient.setRateLimitError(true);

      await expect(
        mockTwitterClient.getUsersByUsernames(['FabrizioRomano'])
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle API errors gracefully', async () => {
      mockTwitterClient.setError(true);

      await expect(
        mockTwitterClient.getUsersByUsernames(['FabrizioRomano'])
      ).rejects.toThrow('Twitter API error');
    });
  });

  describe('Tweet Fetching', () => {
    it('should fetch tweets for specific user', async () => {
      const userId = '123456789';
      const response = await mockTwitterClient.getTweetsByUserId(userId, {
        max_results: 50,
      });

      expect(response.data).toBeDefined();
      expect(response.includes?.users).toBeDefined();
      expect(response.meta.result_count).toBeGreaterThan(0);

      // Verify all tweets belong to the specified user
      response.data?.forEach((tweet) => {
        expect(tweet.author_id).toBe(userId);
      });
    });

    it('should respect pagination limits', async () => {
      const userId = '123456789';
      const maxResults = 10;

      const response = await mockTwitterClient.getTweetsByUserId(userId, {
        max_results: maxResults,
      });

      expect(response.data?.length).toBeLessThanOrEqual(maxResults);
    });

    it('should search tweets by keyword', async () => {
      const query = 'transfer Arsenal';
      const response = await mockTwitterClient.searchTweets(query, {
        max_results: 20,
      });

      expect(response.data).toBeDefined();
      expect(response.meta.result_count).toBeGreaterThanOrEqual(0);

      // Verify search relevance (mock implementation checks text contains query)
      response.data?.forEach((tweet) => {
        expect(tweet.text.toLowerCase()).toContain('arsenal');
      });
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle high-volume requests efficiently', async () => {
      const startTime = Date.now();
      const requests = [];

      // Simulate multiple concurrent requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          mockTwitterClient.getTweetsByUserId('123456789', { max_results: 100 })
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should complete successfully
      expect(responses).toHaveLength(10);
      responses.forEach((response) => {
        expect(response.data).toBeDefined();
      });

      // Should complete reasonably fast (mock should be very fast)
      expect(duration).toBeLessThan(1000);

      // Verify request count tracking
      expect(mockTwitterClient.getRequestCount()).toBe(10);
    });

    it('should track API usage correctly', async () => {
      const initialCount = mockTwitterClient.getRequestCount();

      await mockTwitterClient.getUsersByUsernames(['FabrizioRomano']);
      await mockTwitterClient.getTweetsByUserId('123456789');
      await mockTwitterClient.searchTweets('transfer');

      const finalCount = mockTwitterClient.getRequestCount();
      expect(finalCount - initialCount).toBe(3);
    });

    it('should handle network delays gracefully', async () => {
      // This test would be more relevant with actual HTTP delays
      // but demonstrates how to test timeout scenarios
      const startTime = Date.now();

      const response = await mockTwitterClient.getTweetsByUserId('123456789');

      const endTime = Date.now();
      expect(response.data).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Mock should be fast
    });
  });

  describe('Error Recovery', () => {
    it('should retry on transient failures', async () => {
      let attemptCount = 0;

      // Mock a function that fails twice then succeeds
      const originalGetTweets = mockTwitterClient.getTweetsByUserId;
      mockTwitterClient.getTweetsByUserId = async (...args) => {
        attemptCount++;
        if (attemptCount <= 2) {
          throw new Error('Transient error');
        }
        return originalGetTweets.apply(mockTwitterClient, args);
      };

      // This would be implemented in the actual service layer
      // Here we just verify the mock behavior
      let result;
      for (let i = 0; i < 3; i++) {
        try {
          result = await mockTwitterClient.getTweetsByUserId('123456789');
          break;
        } catch (error) {
          if (i === 2) throw error; // Last attempt
        }
      }

      expect(result).toBeDefined();
      expect(attemptCount).toBe(3);
    });
  });

  describe('Data Validation', () => {
    it('should validate Twitter API responses', async () => {
      const response = await mockTwitterClient.getTweetsByUserId('123456789');

      // Verify response structure matches our schemas
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('meta');
      expect(response.meta).toHaveProperty('result_count');

      if (response.data && response.data.length > 0) {
        const tweet = response.data[0];
        expect(tweet).toHaveProperty('id');
        expect(tweet).toHaveProperty('text');
        expect(tweet).toHaveProperty('author_id');
        expect(tweet).toHaveProperty('created_at');
        expect(tweet).toHaveProperty('public_metrics');
      }
    });

    it('should handle malformed responses gracefully', async () => {
      // Mock malformed response
      const originalGetTweets = mockTwitterClient.getTweetsByUserId;
      mockTwitterClient.getTweetsByUserId = async () => ({}) as any;

      const response = await mockTwitterClient.getTweetsByUserId('123456789');

      // In a real implementation, this would be validated against Zod schemas
      expect(response).toBeDefined();
      expect(response.data).toBeUndefined();
      expect(response.meta).toBeUndefined();
    });
  });

  describe('Test Utilities Integration', () => {
    it('should use factory functions for test data', () => {
      const user = testUtils.factories.itkUser('tier1');

      expect(user.verified).toBe(true);
      expect(user.public_metrics?.followers_count).toBeGreaterThan(1000000);
      expect(['FabrizioRomano', 'DavidOrnstein', 'SkySportsNews']).toContain(
        user.username
      );
    });

    it('should create multiple test entities efficiently', () => {
      const users = testUtils.createMultiple.twitterUsers(5);
      const tweets = testUtils.createMultiple.tweets(20);

      expect(users).toHaveLength(5);
      expect(tweets).toHaveLength(20);

      users.forEach((user) => {
        expect(user.id).toBeDefined();
        expect(user.username).toBeDefined();
      });

      tweets.forEach((tweet) => {
        expect(tweet.id).toBeDefined();
        expect(tweet.text).toBeDefined();
        expect(tweet.text.length).toBeLessThanOrEqual(280);
      });
    });

    it('should simulate heavy load scenarios', () => {
      const scenario = testUtils.scenarios.heavyTwitterLoad();

      expect(scenario.users).toHaveLength(10);
      expect(scenario.tweets).toHaveLength(100);

      // Verify realistic data distribution
      const verifiedUsers = scenario.users.filter((user) => user.verified);
      expect(verifiedUsers.length).toBeGreaterThan(0);
      expect(verifiedUsers.length).toBeLessThan(scenario.users.length);
    });
  });

  describe('Service Configuration', () => {
    it('should respect API configuration settings', async () => {
      // Test with different max_results values
      const smallResponse = await mockTwitterClient.getTweetsByUserId(
        '123456789',
        {
          max_results: 5,
        }
      );

      const largeResponse = await mockTwitterClient.getTweetsByUserId(
        '123456789',
        {
          max_results: 100,
        }
      );

      expect(smallResponse.data?.length).toBeLessThanOrEqual(5);
      expect(largeResponse.data?.length).toBeGreaterThan(
        smallResponse.data?.length || 0
      );
    });

    it('should handle pagination tokens correctly', async () => {
      const response = await mockTwitterClient.getTweetsByUserId('123456789', {
        max_results: 10,
      });

      expect(response.meta).toBeDefined();

      if (response.data && response.data.length > 0) {
        expect(response.meta.newest_id).toBeDefined();
        expect(response.meta.oldest_id).toBeDefined();
        expect(response.meta.result_count).toBe(response.data.length);
      }
    });
  });
});
