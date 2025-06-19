/**
 * Jest test setup file
 * Configures global test environment and utilities
 */

import '@testing-library/jest-dom';

// Import types for proper typing
import type { z } from 'zod';
import type { TwitterUser, TwitterTweet } from '../lib/validations/twitter';
import type { Subscriber } from '../lib/validations/subscriber';
import type { Article } from '../lib/validations/article';

// Mock Next.js components
jest.mock('next/link', () => {
  const MockedLink = ({ children, href, ...props }: any) => {
    const React = require('react');
    return React.createElement('a', { href, ...props }, children);
  };
  MockedLink.displayName = 'MockedLink';
  return MockedLink;
});

jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'mocked-inter',
    variable: '--font-inter',
  }),
}));

jest.mock('geist/font/sans', () => ({
  GeistSans: {
    className: 'mocked-geist-sans',
    variable: '--font-geist-sans',
  },
}));

jest.mock('geist/font/mono', () => ({
  GeistMono: {
    className: 'mocked-geist-mono',
    variable: '--font-geist-mono',
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Import test utilities
import { factories } from './factories';
import { mockTwitterClient } from './mocks/twitter';
import { mockAIService } from './mocks/ai';
import { mockEmailService } from './mocks/email';
import { mockDatabase } from './mocks/database';

// Extend Jest matchers
expect.extend({
  toBeValidZodSchema(received, schema) {
    const result = schema.safeParse(received);

    if (result.success) {
      return {
        message: () =>
          `Expected ${JSON.stringify(received)} not to be valid for schema`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `Expected ${JSON.stringify(received)} to be valid for schema. Errors: ${JSON.stringify(result.error.issues)}`,
        pass: false,
      };
    }
  },

  toHaveZodError(received, schema, expectedErrorMessage?: string) {
    const result = schema.safeParse(received);

    if (!result.success) {
      if (expectedErrorMessage) {
        const hasExpectedError = result.error.issues.some((issue: any) =>
          issue.message.includes(expectedErrorMessage)
        );

        if (hasExpectedError) {
          return {
            message: () =>
              `Expected ${JSON.stringify(received)} not to have Zod error containing "${expectedErrorMessage}"`,
            pass: true,
          };
        } else {
          return {
            message: () =>
              `Expected ${JSON.stringify(received)} to have Zod error containing "${expectedErrorMessage}". Actual errors: ${JSON.stringify(result.error.issues)}`,
            pass: false,
          };
        }
      }

      return {
        message: () =>
          `Expected ${JSON.stringify(received)} not to have Zod errors`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `Expected ${JSON.stringify(received)} to have Zod errors but validation passed`,
        pass: false,
      };
    }
  },
});

// Global test utilities
global.testUtils = {
  createMockTwitterUser: (overrides = {}) => ({
    id: '12345',
    username: 'testuser',
    name: 'Test User',
    profile_image_url: 'https://example.com/avatar.jpg',
    verified: false,
    public_metrics: {
      followers_count: 1000,
      following_count: 500,
      tweet_count: 2000,
      listed_count: 10,
    },
    ...overrides,
  }),

  createMockTwitterTweet: (overrides = {}) => ({
    id: '1234567890',
    text: 'This is a test tweet about transfers',
    author_id: '12345',
    created_at: '2023-12-01T10:00:00.000Z',
    public_metrics: {
      retweet_count: 5,
      reply_count: 2,
      like_count: 15,
      quote_count: 1,
      bookmark_count: 3,
    },
    ...overrides,
  }),

  createMockSubscriber: (overrides = {}) => ({
    id: 'sub_123',
    email: 'test@example.com',
    status: 'active',
    preferences: {
      emailFrequency: 'all',
      preferredTeams: ['arsenal'],
      receiveBreakingNews: true,
      emailFormat: 'html',
      timezone: 'Europe/London',
      language: 'en',
      includeRumours: true,
      includeConfirmed: true,
      includeLoanDeals: true,
      includeYouthPlayers: false,
      marketingEmails: false,
      surveyParticipation: false,
      feedbackRequests: true,
    },
    subscribedAt: new Date('2023-12-01T10:00:00.000Z'),
    subscriptionSource: 'website',
    emailsReceived: 10,
    emailsOpened: 8,
    linksClicked: 5,
    gdprConsent: true,
    dataProcessingConsent: true,
    createdAt: new Date('2023-12-01T10:00:00.000Z'),
    updatedAt: new Date('2023-12-01T10:00:00.000Z'),
    isTestAccount: false,
    ...overrides,
  }),

  createMockArticle: (overrides = {}) => ({
    id: 'article_123',
    title: 'Test Transfer Update',
    briefingType: 'morning',
    status: 'published',
    sections: [
      {
        id: 'section_1',
        type: 'intro',
        content: 'This is a test article section',
        sourceTweets: [],
        order: 0,
        wordCount: 50,
      },
    ],
    summary: 'A test article for validation testing purposes.',
    publishedAt: new Date('2023-12-01T10:00:00.000Z'),
    lastModified: new Date('2023-12-01T10:00:00.000Z'),
    quality: {
      grammarScore: 95,
      readabilityScore: 85,
      brandVoiceScore: 90,
      factualAccuracy: 95,
      engagementPotential: 80,
      overallScore: 89,
      flags: [],
      humanReviewRequired: false,
    },
    sourceTweets: ['1234567890'],
    totalSourceTweets: 1,
    slug: 'test-transfer-update',
    metaDescription:
      'A comprehensive test article about transfer updates for validation.',
    tags: ['test', 'transfers'],
    estimatedReadTime: 2,
    wordCount: 150,
    sentToSubscribers: false,
    ...overrides,
  }),
};

// Console utilities for tests
global.console = {
  ...console,
  // Suppress console.warn in tests unless explicitly testing for it
  warn: jest.fn(),
  // Keep error and log for debugging
  error: console.error, // eslint-disable-line no-console
  log: console.log, // eslint-disable-line no-console
  info: console.info, // eslint-disable-line no-console
};

// Mock environment variables for tests
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
  TWITTER_BEARER_TOKEN: 'AAAAAAAAAAAAAAAAAAAAAA_test_token',
  OPENAI_API_KEY: 'sk-test_key_123456789',
  EMAIL_PROVIDER: 'mock',
  APP_URL: 'http://localhost:3000',
  JWT_SECRET: 'test_jwt_secret_32_characters_long',
  ENCRYPTION_KEY: 'test_encryption_key_32_chars_long',
  HEALTH_CHECK_TOKEN: 'test_health_check_token_32_chars_long',
};

// Declare global types for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidZodSchema(schema: z.ZodSchema): R;
      toHaveZodError(schema: z.ZodSchema, expectedErrorMessage?: string): R;
    }
  }

  var testUtils: {
    // Factory functions for creating test data
    factories: typeof factories;

    // Mock service instances
    mockServices: {
      twitter: typeof mockTwitterClient;
      ai: typeof mockAIService;
      email: typeof mockEmailService;
      database: typeof mockDatabase;
    };

    // Utility functions
    resetAllMocks: () => void;
    simulateServiceErrors: (enabled?: boolean) => void;
    simulateRateLimit: (service?: 'twitter' | 'ai' | 'all') => void;
    setResponseDelays: (delays: {
      twitter?: number;
      ai?: number;
      email?: number;
      database?: number;
    }) => void;

    // Legacy factory methods for backward compatibility
    createMockTwitterUser: (overrides?: Partial<TwitterUser>) => TwitterUser;
    createMockTwitterTweet: (overrides?: Partial<TwitterTweet>) => TwitterTweet;
    createMockSubscriber: (overrides?: Partial<Subscriber>) => Subscriber;
    createMockArticle: (overrides?: Partial<Article>) => Article;

    // Batch creation utilities
    createMultiple: {
      twitterUsers: (
        count: number,
        overrides?: Partial<TwitterUser>
      ) => TwitterUser[];
      tweets: (
        count: number,
        overrides?: Partial<TwitterTweet>
      ) => TwitterTweet[];
      articles: (count: number, overrides?: Partial<Article>) => Article[];
      subscribers: (
        count: number,
        overrides?: Partial<Subscriber>
      ) => Subscriber[];
    };

    // Test scenarios
    scenarios: {
      heavyTwitterLoad: () => { users: TwitterUser[]; tweets: TwitterTweet[] };
      mixedTransferRelevance: () => any[];
      emailCampaignPerformance: () => {
        highPerforming: any;
        lowPerforming: any;
      };
      contentQualityVariations: () => {
        highQuality: Article;
        mediumQuality: Article;
        lowQuality: Article;
      };
    };
  };
}

// Enhanced test utilities with comprehensive mock services
global.testUtils = {
  // Factory functions for creating test data
  factories,

  // Mock service instances
  mockServices: {
    twitter: mockTwitterClient,
    ai: mockAIService,
    email: mockEmailService,
    database: mockDatabase,
  },

  // Reset all mocks to clean state
  resetAllMocks: () => {
    mockTwitterClient.reset();
    mockAIService.reset();
    mockEmailService.reset();
    mockDatabase.reset();
  },

  // Simulate service errors for testing error handling
  simulateServiceErrors: (enabled: boolean = true) => {
    mockTwitterClient.setError(enabled);
    mockAIService.setError(enabled);
    mockEmailService.setError(enabled);
    mockDatabase.setError(enabled);
  },

  // Simulate rate limiting scenarios
  simulateRateLimit: (service: 'twitter' | 'ai' | 'all' = 'all') => {
    if (service === 'twitter' || service === 'all') {
      mockTwitterClient.setRateLimitError(true);
    }
    if (service === 'ai' || service === 'all') {
      mockAIService.setResponseDelay(5000); // Simulate slow response
    }
  },

  // Set response delays for performance testing
  setResponseDelays: (delays: {
    twitter?: number;
    ai?: number;
    email?: number;
    database?: number;
  }) => {
    if (delays.ai) mockAIService.setResponseDelay(delays.ai);
    if (delays.email) mockEmailService.setResponseDelay(delays.email);
    if (delays.database) mockDatabase.setResponseDelay(delays.database);
  },

  // Legacy factory methods for backward compatibility
  createMockTwitterUser: (overrides?: Partial<TwitterUser>) =>
    factories.twitterUser(overrides),
  createMockTwitterTweet: (overrides?: Partial<TwitterTweet>) =>
    factories.twitterTweet(overrides),
  createMockSubscriber: (overrides?: Partial<Subscriber>) =>
    factories.subscriber(overrides),
  createMockArticle: (overrides?: Partial<Article>) =>
    factories.article(overrides),

  // Batch creation utilities
  createMultiple: {
    twitterUsers: (count: number, overrides?: Partial<TwitterUser>) =>
      factories.multiple.twitterUsers(count, overrides),
    tweets: (count: number, overrides?: Partial<TwitterTweet>) =>
      factories.multiple.twitterTweets(count, overrides),
    articles: (count: number, overrides?: Partial<Article>) =>
      factories.multiple.articles(count, overrides),
    subscribers: (count: number, overrides?: Partial<Subscriber>) =>
      factories.multiple.subscribers(count, overrides),
  },

  // Test scenario builders
  scenarios: {
    // High-volume Twitter data scenario
    heavyTwitterLoad: () => {
      const users = factories.multiple.twitterUsers(10);
      const tweets = factories.multiple.twitterTweets(100);
      return { users, tweets };
    },

    // Mixed transfer relevance scenario
    mixedTransferRelevance: () => {
      return [
        factories.processedTweet({
          relevance: factories.transferRelevance('high'),
        }),
        factories.processedTweet({
          relevance: factories.transferRelevance('medium'),
        }),
        factories.processedTweet({
          relevance: factories.transferRelevance('low'),
        }),
        factories.processedTweet({
          relevance: factories.transferRelevance('none'),
        }),
      ];
    },

    // Email campaign performance scenario
    emailCampaignPerformance: () => {
      return {
        highPerforming: factories.emailCampaign({
          name: 'High Performance Campaign',
          metrics: {
            recipientCount: 10000,
            deliveredCount: 9850,
            openedCount: 3500,
            clickedCount: 850,
            openRate: 0.355,
            clickRate: 0.243,
            deliveryRate: 0.985,
            unsubscribeRate: 0.0025,
            complaintRate: 0.0005,
            bouncedCount: 150,
            unsubscribedCount: 25,
            complainedCount: 5,
          },
        }),
        lowPerforming: factories.emailCampaign({
          name: 'Low Performance Campaign',
          metrics: {
            recipientCount: 1000,
            deliveredCount: 950,
            openedCount: 150,
            clickedCount: 20,
            openRate: 0.158,
            clickRate: 0.133,
            deliveryRate: 0.95,
            unsubscribeRate: 0.008,
            complaintRate: 0.003,
            bouncedCount: 50,
            unsubscribedCount: 8,
            complainedCount: 3,
          },
        }),
      };
    },

    // Content quality variations
    contentQualityVariations: () => {
      return {
        highQuality: factories.article({
          quality: factories.contentQuality('high'),
        }),
        mediumQuality: factories.article({
          quality: factories.contentQuality('medium'),
        }),
        lowQuality: factories.article({
          quality: factories.contentQuality('low'),
        }),
      };
    },
  },
};
