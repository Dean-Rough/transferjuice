/**
 * ITK Monitor Tests
 * Testing the monitoring of In-The-Know transfer accounts
 */

import { ITKMonitor, ITK_ACCOUNTS } from '@/lib/twitter/itk-monitor';
import { TwitterClient } from '@/lib/twitter/client';

// Mock the dependencies
jest.mock('@/lib/twitter/client');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    tweet: {
      create: jest.fn(),
    },
  },
}));
jest.mock('@/lib/twitter/transfer-classifier', () => ({
  transferKeywordClassifier: {
    classifyTweet: jest.fn(),
    extractEntities: jest.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { transferKeywordClassifier } from '@/lib/twitter/transfer-classifier';

describe('ITKMonitor', () => {
  let itkMonitor: ITKMonitor;
  let mockTwitterClient: jest.Mocked<TwitterClient>;

  beforeEach(() => {
    mockTwitterClient = new TwitterClient({
      bearerToken: 'test',
    }) as jest.Mocked<TwitterClient>;
    itkMonitor = new ITKMonitor(mockTwitterClient);

    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully with all ITK accounts', async () => {
      // Mock successful user lookups for all accounts
      mockTwitterClient.getUserByUsername.mockImplementation((username) =>
        Promise.resolve({
          id: `user_${username}`,
          username,
          name: `Display Name for ${username}`,
          verified: true,
          public_metrics: {
            followers_count: 1000000,
            following_count: 1000,
            tweet_count: 50000,
          },
        })
      );

      await itkMonitor.initialize();

      expect(mockTwitterClient.getUserByUsername).toHaveBeenCalledTimes(
        ITK_ACCOUNTS.length
      );

      // Check that all accounts were cached
      for (const account of ITK_ACCOUNTS) {
        expect(mockTwitterClient.getUserByUsername).toHaveBeenCalledWith(
          account.username
        );
      }
    });

    it('should handle failures gracefully during initialization', async () => {
      // Mock some successful and some failed lookups
      mockTwitterClient.getUserByUsername.mockImplementation((username) => {
        if (username === 'FabrizioRomano') {
          return Promise.resolve({
            id: 'user_fabrizio',
            username: 'FabrizioRomano',
            name: 'Fabrizio Romano',
            verified: true,
            public_metrics: {
              followers_count: 15000000,
              following_count: 1000,
              tweet_count: 50000,
            },
          });
        }
        throw new Error('User not found');
      });

      await expect(itkMonitor.initialize()).rejects.toThrow();
      expect(mockTwitterClient.getUserByUsername).toHaveBeenCalledTimes(
        ITK_ACCOUNTS.length
      );
    });

    it('should cache user information correctly', async () => {
      const mockUser = {
        id: 'user_fabrizio',
        username: 'FabrizioRomano',
        name: 'Fabrizio Romano',
        verified: true,
        public_metrics: {
          followers_count: 15000000,
          following_count: 1000,
          tweet_count: 50000,
        },
      };

      mockTwitterClient.getUserByUsername.mockResolvedValue(mockUser);

      await itkMonitor.initialize();

      const stats = itkMonitor.getMonitoringStats();
      expect(Object.keys(stats)).toHaveLength(ITK_ACCOUNTS.length);
      expect(stats['FabrizioRomano']).toBeDefined();
    });
  });

  describe('Account Monitoring', () => {
    beforeEach(async () => {
      // Initialize with mock users
      mockTwitterClient.getUserByUsername.mockImplementation((username) =>
        Promise.resolve({
          id: `user_${username}`,
          username,
          name: `Display Name for ${username}`,
          verified: true,
          public_metrics: {
            followers_count: 1000000,
            following_count: 1000,
            tweet_count: 50000,
          },
        })
      );

      await itkMonitor.initialize();
      jest.clearAllMocks();
    });

    it('should monitor individual account successfully', async () => {
      const mockTweets = [
        {
          id: '1234567890',
          text: 'Arsenal have completed the signing of Declan Rice for £105m. Done deal! #AFC',
          author_id: 'user_FabrizioRomano',
          created_at: '2024-01-15T14:30:00Z',
          public_metrics: {
            retweet_count: 2500,
            like_count: 8900,
            reply_count: 445,
            quote_count: 180,
          },
          lang: 'en',
        },
      ];

      const mockTimelineResponse = {
        data: mockTweets,
        meta: {
          oldest_id: '1234567890',
          newest_id: '1234567890',
          result_count: 1,
        },
      };

      mockTwitterClient.getUserTimeline.mockResolvedValue(mockTimelineResponse);

      // Mock classification
      (transferKeywordClassifier.classifyTweet as jest.Mock).mockResolvedValue({
        isTransferRelated: true,
        confidence: 0.95,
        transferType: 'CONFIRMED',
        keywords: ['signed', 'done deal'],
        reasonCode: 'high_confidence',
        explanation: 'Strong transfer indicators detected',
      });

      // Mock entity extraction
      (
        transferKeywordClassifier.extractEntities as jest.Mock
      ).mockResolvedValue({
        players: ['Declan Rice'],
        clubs: ['Arsenal'],
        positions: [],
        agents: [],
        fees: ['£105m'],
      });

      // Mock database create
      (prisma.tweet.create as jest.Mock).mockResolvedValue({});

      const account = ITK_ACCOUNTS.find(
        (acc) => acc.username === 'FabrizioRomano'
      )!;
      const results = await itkMonitor.monitorAccount(account);

      expect(results).toHaveLength(1);
      expect(results[0].isTransferRelated).toBe(true);
      expect(results[0].transferType).toBe('CONFIRMED');
      expect(results[0].playersExtracted).toContain('Declan Rice');
      expect(results[0].clubsExtracted).toContain('Arsenal');
      expect(prisma.tweet.create).toHaveBeenCalledTimes(1);
    });

    it('should handle empty timeline response', async () => {
      const mockTimelineResponse = {
        meta: {
          result_count: 0,
        },
      };

      mockTwitterClient.getUserTimeline.mockResolvedValue(mockTimelineResponse);

      const account = ITK_ACCOUNTS.find(
        (acc) => acc.username === 'FabrizioRomano'
      )!;
      const results = await itkMonitor.monitorAccount(account);

      expect(results).toHaveLength(0);
      expect(mockTwitterClient.getUserTimeline).toHaveBeenCalledWith(
        'user_FabrizioRomano',
        expect.objectContaining({
          maxResults: 50,
        })
      );
    });

    it('should use sinceId for incremental fetching', async () => {
      // First fetch
      const firstResponse = {
        data: [
          {
            id: '1111111111',
            text: 'First tweet',
            author_id: 'user_FabrizioRomano',
            created_at: '2024-01-15T14:30:00Z',
            public_metrics: {
              retweet_count: 0,
              like_count: 0,
              reply_count: 0,
              quote_count: 0,
            },
          },
        ],
        meta: {
          oldest_id: '1111111111',
          newest_id: '1111111111',
          result_count: 1,
        },
      };

      mockTwitterClient.getUserTimeline.mockResolvedValueOnce(firstResponse);

      (transferKeywordClassifier.classifyTweet as jest.Mock).mockResolvedValue({
        isTransferRelated: false,
        confidence: 0.1,
        keywords: [],
        reasonCode: 'low_confidence',
        explanation: 'No transfer indicators',
      });

      (
        transferKeywordClassifier.extractEntities as jest.Mock
      ).mockResolvedValue({
        players: [],
        clubs: [],
        positions: [],
        agents: [],
        fees: [],
      });

      const account = ITK_ACCOUNTS.find(
        (acc) => acc.username === 'FabrizioRomano'
      )!;
      await itkMonitor.monitorAccount(account);

      // Second fetch should use sinceId
      const secondResponse = {
        data: [
          {
            id: '2222222222',
            text: 'Second tweet',
            author_id: 'user_FabrizioRomano',
            created_at: '2024-01-15T15:30:00Z',
            public_metrics: {
              retweet_count: 0,
              like_count: 0,
              reply_count: 0,
              quote_count: 0,
            },
          },
        ],
        meta: {
          oldest_id: '2222222222',
          newest_id: '2222222222',
          result_count: 1,
        },
      };

      mockTwitterClient.getUserTimeline.mockResolvedValueOnce(secondResponse);
      await itkMonitor.monitorAccount(account);

      expect(mockTwitterClient.getUserTimeline).toHaveBeenLastCalledWith(
        'user_FabrizioRomano',
        expect.objectContaining({
          sinceId: '1111111111',
        })
      );
    });
  });

  describe('Priority Calculation', () => {
    beforeEach(async () => {
      mockTwitterClient.getUserByUsername.mockImplementation((username) =>
        Promise.resolve({
          id: `user_${username}`,
          username,
          name: `Display Name for ${username}`,
          verified: true,
          public_metrics: {
            followers_count: 1000000,
            following_count: 1000,
            tweet_count: 50000,
          },
        })
      );

      await itkMonitor.initialize();
      jest.clearAllMocks();
    });

    it('should assign higher priority to tier 1 sources', async () => {
      const mockTweet = {
        id: '1234567890',
        text: 'Arsenal interested in new midfielder',
        author_id: 'user_FabrizioRomano',
        created_at: '2024-01-15T14:30:00Z',
        public_metrics: {
          retweet_count: 100,
          like_count: 300,
          reply_count: 50,
          quote_count: 20,
        },
        lang: 'en',
      };

      mockTwitterClient.getUserTimeline.mockResolvedValue({
        data: [mockTweet],
        meta: {
          result_count: 1,
          newest_id: '1234567890',
          oldest_id: '1234567890',
        },
      });

      (transferKeywordClassifier.classifyTweet as jest.Mock).mockResolvedValue({
        isTransferRelated: true,
        confidence: 0.6,
        transferType: 'TALKS',
        keywords: ['interested in'],
        reasonCode: 'medium_confidence',
        explanation: 'Moderate transfer signals',
      });

      (
        transferKeywordClassifier.extractEntities as jest.Mock
      ).mockResolvedValue({
        players: [],
        clubs: ['Arsenal'],
        positions: ['midfielder'],
        agents: [],
        fees: [],
      });

      (prisma.tweet.create as jest.Mock).mockResolvedValue({});

      const tier1Account = ITK_ACCOUNTS.find((acc) => acc.tier === 'tier1')!;
      const results = await itkMonitor.monitorAccount(tier1Account);

      expect(results[0].priority).toBeOneOf(['HIGH', 'MEDIUM', 'URGENT']);
    });

    it('should prioritize official announcements', async () => {
      const mockTweet = {
        id: '1234567890',
        text: 'OFFICIAL: Arsenal announce the signing of Kai Havertz',
        author_id: 'user_Arsenal',
        created_at: '2024-01-15T14:30:00Z',
        public_metrics: {
          retweet_count: 5000,
          like_count: 15000,
          reply_count: 2000,
          quote_count: 500,
        },
        lang: 'en',
      };

      mockTwitterClient.getUserTimeline.mockResolvedValue({
        data: [mockTweet],
        meta: {
          result_count: 1,
          newest_id: '1234567890',
          oldest_id: '1234567890',
        },
      });

      (transferKeywordClassifier.classifyTweet as jest.Mock).mockResolvedValue({
        isTransferRelated: true,
        confidence: 0.98,
        transferType: 'OFFICIAL',
        keywords: ['official', 'announce', 'signing'],
        reasonCode: 'high_confidence',
        explanation: 'Official announcement detected',
      });

      (
        transferKeywordClassifier.extractEntities as jest.Mock
      ).mockResolvedValue({
        players: ['Kai Havertz'],
        clubs: ['Arsenal'],
        positions: [],
        agents: [],
        fees: [],
      });

      (prisma.tweet.create as jest.Mock).mockResolvedValue({});

      const account = ITK_ACCOUNTS[0]; // Use first account
      const results = await itkMonitor.monitorAccount(account);

      expect(results[0].priority).toBe('URGENT');
    });
  });

  describe('Monitoring All Accounts', () => {
    beforeEach(async () => {
      mockTwitterClient.getUserByUsername.mockImplementation((username) =>
        Promise.resolve({
          id: `user_${username}`,
          username,
          name: `Display Name for ${username}`,
          verified: true,
          public_metrics: {
            followers_count: 1000000,
            following_count: 1000,
            tweet_count: 50000,
          },
        })
      );

      await itkMonitor.initialize();
      jest.clearAllMocks();
    });

    it('should monitor all accounts and aggregate results', async () => {
      // Mock timeline responses for all accounts
      mockTwitterClient.getUserTimeline.mockResolvedValue({
        data: [
          {
            id: '1234567890',
            text: 'Transfer update',
            author_id: 'user_test',
            created_at: '2024-01-15T14:30:00Z',
            public_metrics: {
              retweet_count: 100,
              like_count: 300,
              reply_count: 50,
              quote_count: 20,
            },
            lang: 'en',
          },
        ],
        meta: {
          result_count: 1,
          newest_id: '1234567890',
          oldest_id: '1234567890',
        },
      });

      (transferKeywordClassifier.classifyTweet as jest.Mock).mockResolvedValue({
        isTransferRelated: true,
        confidence: 0.7,
        transferType: 'RUMOUR',
        keywords: ['update'],
        reasonCode: 'medium_confidence',
        explanation: 'Transfer indicators detected',
      });

      (
        transferKeywordClassifier.extractEntities as jest.Mock
      ).mockResolvedValue({
        players: [],
        clubs: [],
        positions: [],
        agents: [],
        fees: [],
      });

      (prisma.tweet.create as jest.Mock).mockResolvedValue({});

      const results = await itkMonitor.monitorAllAccounts();

      expect(results.length).toBe(ITK_ACCOUNTS.length);
      expect(mockTwitterClient.getUserTimeline).toHaveBeenCalledTimes(
        ITK_ACCOUNTS.length
      );

      // Check that stats were updated
      const stats = itkMonitor.getMonitoringStats();
      Object.values(stats).forEach((accountStats) => {
        expect(accountStats.totalTweets).toBe(1);
        expect(accountStats.transferRelevant).toBe(1);
      });
    });

    it('should handle errors gracefully during monitoring', async () => {
      // Mock some successful and some failed timeline fetches
      mockTwitterClient.getUserTimeline.mockImplementation((userId) => {
        if (userId === 'user_FabrizioRomano') {
          return Promise.resolve({
            data: [
              {
                id: '1234567890',
                text: 'Arsenal sign new player',
                author_id: userId,
                created_at: '2024-01-15T14:30:00Z',
                public_metrics: {
                  retweet_count: 100,
                  like_count: 300,
                  reply_count: 50,
                  quote_count: 20,
                },
                lang: 'en',
              },
            ],
            meta: {
              result_count: 1,
              newest_id: '1234567890',
              oldest_id: '1234567890',
            },
          });
        }
        throw new Error('API Error');
      });

      (transferKeywordClassifier.classifyTweet as jest.Mock).mockResolvedValue({
        isTransferRelated: true,
        confidence: 0.7,
        transferType: 'CONFIRMED',
        keywords: ['sign'],
        reasonCode: 'high_confidence',
        explanation: 'Transfer confirmed',
      });

      (
        transferKeywordClassifier.extractEntities as jest.Mock
      ).mockResolvedValue({
        players: [],
        clubs: ['Arsenal'],
        positions: [],
        agents: [],
        fees: [],
      });

      (prisma.tweet.create as jest.Mock).mockResolvedValue({});

      const results = await itkMonitor.monitorAllAccounts();

      // Should have results from successful fetches
      expect(results.length).toBeGreaterThan(0);

      // Check error stats
      const stats = itkMonitor.getMonitoringStats();
      const errorAccounts = Object.values(stats).filter(
        (s) => s.errorCount > 0
      );
      expect(errorAccounts.length).toBeGreaterThan(0);
    });
  });

  describe('Database Storage', () => {
    beforeEach(async () => {
      mockTwitterClient.getUserByUsername.mockImplementation((username) =>
        Promise.resolve({
          id: `user_${username}`,
          username,
          name: `Display Name for ${username}`,
          verified: true,
          public_metrics: {
            followers_count: 1000000,
            following_count: 1000,
            tweet_count: 50000,
          },
        })
      );

      await itkMonitor.initialize();
      jest.clearAllMocks();
    });

    it('should store transfer-relevant tweets in database', async () => {
      const mockTweet = {
        id: '1234567890',
        text: 'Arsenal have signed Declan Rice for £105m #AFC',
        author_id: 'user_FabrizioRomano',
        created_at: '2024-01-15T14:30:00Z',
        public_metrics: {
          retweet_count: 2500,
          like_count: 8900,
          reply_count: 445,
          quote_count: 180,
        },
        lang: 'en',
      };

      mockTwitterClient.getUserTimeline.mockResolvedValue({
        data: [mockTweet],
        meta: {
          result_count: 1,
          newest_id: '1234567890',
          oldest_id: '1234567890',
        },
      });

      (transferKeywordClassifier.classifyTweet as jest.Mock).mockResolvedValue({
        isTransferRelated: true,
        confidence: 0.95,
        transferType: 'CONFIRMED',
        keywords: ['signed'],
        reasonCode: 'high_confidence',
        explanation: 'Transfer confirmed',
      });

      (
        transferKeywordClassifier.extractEntities as jest.Mock
      ).mockResolvedValue({
        players: ['Declan Rice'],
        clubs: ['Arsenal'],
        positions: [],
        agents: [],
        fees: ['£105m'],
      });

      (prisma.tweet.create as jest.Mock).mockResolvedValue({});

      const account = ITK_ACCOUNTS.find(
        (acc) => acc.username === 'FabrizioRomano'
      )!;
      await itkMonitor.monitorAccount(account);

      expect(prisma.tweet.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: '1234567890',
          text: 'Arsenal have signed Declan Rice for £105m #AFC',
          authorHandle: 'FabrizioRomano',
          isTransferRelated: true,
          confidence: 0.95,
          transferType: 'CONFIRMED',
          keywords: ['signed'],
          playersExtracted: ['Declan Rice'],
          clubsExtracted: ['Arsenal'],
        }),
      });
    });

    it('should not store non-transfer tweets', async () => {
      const mockTweet = {
        id: '1234567890',
        text: 'Great weather today!',
        author_id: 'user_FabrizioRomano',
        created_at: '2024-01-15T14:30:00Z',
        public_metrics: {
          retweet_count: 10,
          like_count: 50,
          reply_count: 5,
          quote_count: 2,
        },
        lang: 'en',
      };

      mockTwitterClient.getUserTimeline.mockResolvedValue({
        data: [mockTweet],
        meta: {
          result_count: 1,
          newest_id: '1234567890',
          oldest_id: '1234567890',
        },
      });

      (transferKeywordClassifier.classifyTweet as jest.Mock).mockResolvedValue({
        isTransferRelated: false,
        confidence: 0.1,
        keywords: [],
        reasonCode: 'low_confidence',
        explanation: 'No transfer indicators',
      });

      (
        transferKeywordClassifier.extractEntities as jest.Mock
      ).mockResolvedValue({
        players: [],
        clubs: [],
        positions: [],
        agents: [],
        fees: [],
      });

      const account = ITK_ACCOUNTS.find(
        (acc) => acc.username === 'FabrizioRomano'
      )!;
      await itkMonitor.monitorAccount(account);

      expect(prisma.tweet.create).not.toHaveBeenCalled();
    });

    it('should handle duplicate tweet errors gracefully', async () => {
      const mockTweet = {
        id: '1234567890',
        text: 'Arsenal sign new player',
        author_id: 'user_FabrizioRomano',
        created_at: '2024-01-15T14:30:00Z',
        public_metrics: {
          retweet_count: 100,
          like_count: 300,
          reply_count: 50,
          quote_count: 20,
        },
        lang: 'en',
      };

      mockTwitterClient.getUserTimeline.mockResolvedValue({
        data: [mockTweet],
        meta: {
          result_count: 1,
          newest_id: '1234567890',
          oldest_id: '1234567890',
        },
      });

      (transferKeywordClassifier.classifyTweet as jest.Mock).mockResolvedValue({
        isTransferRelated: true,
        confidence: 0.8,
        transferType: 'CONFIRMED',
        keywords: ['sign'],
        reasonCode: 'high_confidence',
        explanation: 'Transfer confirmed',
      });

      (
        transferKeywordClassifier.extractEntities as jest.Mock
      ).mockResolvedValue({
        players: [],
        clubs: ['Arsenal'],
        positions: [],
        agents: [],
        fees: [],
      });

      // Mock unique constraint error
      (prisma.tweet.create as jest.Mock).mockRejectedValue(
        new Error('Unique constraint violated')
      );

      const account = ITK_ACCOUNTS.find(
        (acc) => acc.username === 'FabrizioRomano'
      )!;

      // Should not throw error
      await expect(itkMonitor.monitorAccount(account)).resolves.not.toThrow();
    });
  });
});
