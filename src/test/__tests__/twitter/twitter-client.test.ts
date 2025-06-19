/**
 * Twitter Client Tests
 * Comprehensive testing for Twitter API v2 integration
 */

import {
  TwitterClient,
  TwitterAPIError,
  TwitterRateLimitError,
} from '@/lib/twitter/client';

// Mock fetch for testing
global.fetch = jest.fn();

describe('TwitterClient', () => {
  let client: TwitterClient;
  const mockBearerToken = 'AAAAAAAAAAAAAAAAAAAAAA';

  beforeEach(() => {
    client = new TwitterClient({
      bearerToken: mockBearerToken,
      baseUrl: 'https://api.twitter.com/2',
      defaultMaxResults: 50,
      retryAttempts: 2,
      retryDelay: 100,
    });

    jest.clearAllMocks();
  });

  describe('Configuration Validation', () => {
    it('should validate correct configuration', () => {
      const result = client.validateConfiguration();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing bearer token', () => {
      const invalidClient = new TwitterClient({ bearerToken: '' });
      const result = invalidClient.validateConfiguration();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('Bearer token is required')
      );
    });

    it('should detect invalid bearer token format', () => {
      const invalidClient = new TwitterClient({ bearerToken: 'invalid_token' });
      const result = invalidClient.validateConfiguration();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('Bearer token appears to be invalid')
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limit headers correctly', async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              id: '123',
              username: 'testuser',
              name: 'Test User',
              verified: false,
              public_metrics: {
                followers_count: 1000,
                following_count: 500,
                tweet_count: 2000,
              },
            },
          }),
        headers: new Headers({
          'x-rate-limit-limit': '75',
          'x-rate-limit-remaining': '74',
          'x-rate-limit-reset': String(Math.floor(Date.now() / 1000) + 900),
        }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await client.getUserByUsername('testuser');

      const rateLimits = client.getRateLimitStatus();
      expect(rateLimits['/users/by/username/testuser']).toBeDefined();
      expect(rateLimits['/users/by/username/testuser'].limit).toBe(75);
      expect(rateLimits['/users/by/username/testuser'].remaining).toBe(74);
    });

    it('should throw rate limit error when limit exceeded', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () =>
          Promise.resolve({
            title: 'Too Many Requests',
            detail: 'Rate limit exceeded',
            type: 'about:blank',
          }),
        headers: new Headers({
          'x-rate-limit-reset': String(Math.floor(Date.now() / 1000) + 900),
        }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(client.getUserByUsername('testuser')).rejects.toThrow(
        TwitterRateLimitError
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors appropriately', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () =>
          Promise.resolve({
            errors: [
              {
                detail: 'User not found',
                title: 'Not Found Error',
                type: 'https://api.twitter.com/2/problems/resource-not-found',
              },
            ],
          }),
        headers: new Headers(),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(client.getUserByUsername('nonexistentuser')).rejects.toThrow(
        TwitterAPIError
      );
    });

    it('should retry on 5xx errors', async () => {
      const mockResponse500 = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
        headers: new Headers(),
      };

      const mockResponse200 = {
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              id: '123',
              username: 'testuser',
              name: 'Test User',
              verified: false,
              public_metrics: {
                followers_count: 1000,
                following_count: 500,
                tweet_count: 2000,
              },
            },
          }),
        headers: new Headers(),
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce(mockResponse500)
        .mockResolvedValueOnce(mockResponse200);

      const result = await client.getUserByUsername('testuser');
      expect(result.username).toBe('testuser');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 4xx errors (except 429)', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () =>
          Promise.resolve({
            errors: [
              {
                detail: 'Invalid request',
                title: 'Bad Request',
                type: 'about:blank',
              },
            ],
          }),
        headers: new Headers(),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(client.getUserByUsername('testuser')).rejects.toThrow(
        TwitterAPIError
      );
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('User Timeline Retrieval', () => {
    it('should fetch user timeline successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              {
                id: '1234567890',
                text: 'Arsenal are signing a new midfielder for £50m #AFC',
                author_id: '123',
                created_at: '2024-01-15T14:30:00Z',
                public_metrics: {
                  retweet_count: 150,
                  like_count: 500,
                  reply_count: 45,
                  quote_count: 20,
                },
                lang: 'en',
              },
            ],
            includes: {
              users: [
                {
                  id: '123',
                  username: 'FabrizioRomano',
                  name: 'Fabrizio Romano',
                  verified: true,
                  public_metrics: {
                    followers_count: 15000000,
                    following_count: 1000,
                    tweet_count: 50000,
                  },
                },
              ],
            },
            meta: {
              oldest_id: '1234567890',
              newest_id: '1234567890',
              result_count: 1,
            },
          }),
        headers: new Headers(),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await client.getUserTimeline('123', { maxResults: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data![0].text).toContain('Arsenal');
      expect(result.includes?.users).toHaveLength(1);
      expect(result.includes?.users![0].username).toBe('FabrizioRomano');
      expect(result.meta.result_count).toBe(1);
    });

    it('should handle empty timeline response', async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            meta: {
              result_count: 0,
            },
          }),
        headers: new Headers(),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await client.getUserTimeline('123');

      expect(result.data).toBeUndefined();
      expect(result.meta.result_count).toBe(0);
    });

    it('should include pagination parameters', async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            data: [],
            meta: { result_count: 0 },
          }),
        headers: new Headers(),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await client.getUserTimeline('123', {
        maxResults: 25,
        sinceId: '1234567890',
        startTime: '2024-01-01T00:00:00Z',
        endTime: '2024-01-31T23:59:59Z',
      });

      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      const url = new URL(fetchCall[0]);

      expect(url.searchParams.get('max_results')).toBe('25');
      expect(url.searchParams.get('since_id')).toBe('1234567890');
      expect(url.searchParams.get('start_time')).toBe('2024-01-01T00:00:00Z');
      expect(url.searchParams.get('end_time')).toBe('2024-01-31T23:59:59Z');
    });
  });

  describe('User Lookup', () => {
    it('should fetch user by username successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              id: '123456789',
              username: 'FabrizioRomano',
              name: 'Fabrizio Romano',
              verified: true,
              public_metrics: {
                followers_count: 15000000,
                following_count: 1000,
                tweet_count: 50000,
              },
            },
          }),
        headers: new Headers(),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await client.getUserByUsername('FabrizioRomano');

      expect(result.id).toBe('123456789');
      expect(result.username).toBe('FabrizioRomano');
      expect(result.name).toBe('Fabrizio Romano');
      expect(result.verified).toBe(true);
      expect(result.public_metrics.followers_count).toBe(15000000);
    });

    it('should handle user not found', async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            errors: [
              {
                detail: 'Could not find user with username: nonexistentuser',
                title: 'Not Found Error',
                resource_type: 'user',
                parameter: 'username',
                resource_id: 'nonexistentuser',
                type: 'https://api.twitter.com/2/problems/resource-not-found',
              },
            ],
          }),
        headers: new Headers(),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(client.getUserByUsername('nonexistentuser')).rejects.toThrow(
        TwitterAPIError
      );
    });
  });

  describe('Request Headers and Authentication', () => {
    it('should include proper authentication headers', async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              id: '123',
              username: 'testuser',
              name: 'Test User',
              verified: false,
              public_metrics: {
                followers_count: 1000,
                following_count: 500,
                tweet_count: 2000,
              },
            },
          }),
        headers: new Headers(),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      await client.getUserByUsername('testuser');

      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      const headers = fetchCall[1].headers;

      expect(headers['Authorization']).toBe(`Bearer ${mockBearerToken}`);
      expect(headers['User-Agent']).toBe('TransferJuice/1.0');
    });
  });

  describe('Rate Limit Waiting', () => {
    it('should wait for rate limit reset when needed', async () => {
      const resetTime = Math.floor(Date.now() / 1000) + 2; // 2 seconds from now

      // Simulate rate limit exceeded
      client['rateLimits'].set('/test', {
        limit: 75,
        remaining: 0,
        reset: resetTime,
      });

      const startTime = Date.now();
      await client.waitForRateLimit('/test');
      const endTime = Date.now();

      // Should have waited approximately 2 seconds
      expect(endTime - startTime).toBeGreaterThanOrEqual(1900);
      expect(endTime - startTime).toBeLessThan(2500);
    });

    it('should not wait if rate limit is not exceeded', async () => {
      client['rateLimits'].set('/test', {
        limit: 75,
        remaining: 50,
        reset: Math.floor(Date.now() / 1000) + 900,
      });

      const startTime = Date.now();
      await client.waitForRateLimit('/test');
      const endTime = Date.now();

      // Should not have waited
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Data Validation', () => {
    it('should validate response schema correctly', async () => {
      const invalidResponse = {
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              // Missing required fields
              username: 'testuser',
            },
          }),
        headers: new Headers(),
      };

      (fetch as jest.Mock).mockResolvedValue(invalidResponse);

      await expect(client.getUserByUsername('testuser')).rejects.toThrow(
        TwitterAPIError
      );
    });
  });
});
