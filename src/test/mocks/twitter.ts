/**
 * Twitter API Mock Implementation
 * Provides realistic mock responses for Twitter API v2 endpoints
 */

import {
  TwitterUser,
  TwitterTweet,
  TwitterUsersResponse,
  TwitterTweetsResponse,
} from '@/lib/validations/twitter';

// Mock Twitter users (ITK sources)
export const mockTwitterUsers: TwitterUser[] = [
  {
    id: '123456789',
    username: 'FabrizioRomano',
    name: 'Fabrizio Romano',
    profile_image_url:
      'https://pbs.twimg.com/profile_images/1234567890/avatar.jpg',
    verified: true,
    public_metrics: {
      followers_count: 15000000,
      following_count: 1200,
      tweet_count: 45000,
      listed_count: 8500,
    },
  },
  {
    id: '987654321',
    username: 'TransferChecker',
    name: 'Transfer Checker',
    profile_image_url:
      'https://pbs.twimg.com/profile_images/0987654321/avatar.jpg',
    verified: false,
    public_metrics: {
      followers_count: 250000,
      following_count: 800,
      tweet_count: 12000,
      listed_count: 1200,
    },
  },
  {
    id: '456789123',
    username: 'SkySportsNews',
    name: 'Sky Sports News',
    profile_image_url:
      'https://pbs.twimg.com/profile_images/4567891234/avatar.jpg',
    verified: true,
    public_metrics: {
      followers_count: 8000000,
      following_count: 2500,
      tweet_count: 125000,
      listed_count: 15000,
    },
  },
];

// Mock transfer-related tweets
export const mockTransferTweets: TwitterTweet[] = [
  {
    id: 'tweet_001',
    text: '🚨 EXCLUSIVE: Arsenal are in advanced talks with Brighton for Declan Rice. Fee could reach £105m with add-ons. Here we go! ⚪🔴 #Arsenal #TransferNews',
    author_id: '123456789',
    created_at: '2024-01-15T14:30:00.000Z',
    conversation_id: 'tweet_001',
    public_metrics: {
      retweet_count: 2500,
      reply_count: 850,
      like_count: 15000,
      quote_count: 500,
      bookmark_count: 1200,
    },
    entities: {
      hashtags: [
        { start: 125, end: 133, tag: 'Arsenal' },
        { start: 134, end: 147, tag: 'TransferNews' },
      ],
      urls: [],
      mentions: [],
    },
    context_annotations: [
      {
        domain: { id: '11', name: 'Sport Event' },
        entity: { id: '1142253618269949952', name: 'Premier League' },
      },
    ],
  },
  {
    id: 'tweet_002',
    text: 'Manchester United have submitted an official bid for Jude Bellingham. €150m package offered to Borussia Dortmund. Player is keen on the move.',
    author_id: '987654321',
    created_at: '2024-01-15T12:45:00.000Z',
    conversation_id: 'tweet_002',
    public_metrics: {
      retweet_count: 1800,
      reply_count: 650,
      like_count: 12000,
      quote_count: 400,
      bookmark_count: 900,
    },
    entities: {
      hashtags: [],
      urls: [],
      mentions: [],
    },
  },
  {
    id: 'tweet_003',
    text: 'BREAKING: Chelsea complete signing of Christopher Nkunku from RB Leipzig for £52m. 5-year deal agreed. Medical completed in London. 🔵⚪',
    author_id: '456789123',
    created_at: '2024-01-15T16:20:00.000Z',
    conversation_id: 'tweet_003',
    public_metrics: {
      retweet_count: 3200,
      reply_count: 1200,
      like_count: 18500,
      quote_count: 750,
      bookmark_count: 1500,
    },
    entities: {
      hashtags: [],
      urls: [],
      mentions: [],
    },
  },
];

// Mock non-transfer tweets (should be filtered out)
export const mockNonTransferTweets: TwitterTweet[] = [
  {
    id: 'tweet_004',
    text: 'Beautiful sunset from my holiday in Italy! Amazing pasta tonight 🍝',
    author_id: '123456789',
    created_at: '2024-01-15T18:00:00.000Z',
    conversation_id: 'tweet_004',
    public_metrics: {
      retweet_count: 45,
      reply_count: 120,
      like_count: 8500,
      quote_count: 15,
      bookmark_count: 200,
    },
    entities: {
      hashtags: [],
      urls: [],
      mentions: [],
    },
  },
];

// Mock API responses
export const mockTwitterUsersResponse: TwitterUsersResponse = {
  data: mockTwitterUsers,
  meta: {
    result_count: mockTwitterUsers.length,
  },
};

export const mockTwitterTweetsResponse: TwitterTweetsResponse = {
  data: mockTransferTweets,
  includes: {
    users: mockTwitterUsers,
  },
  meta: {
    result_count: mockTransferTweets.length,
    newest_id: 'tweet_001',
    oldest_id: 'tweet_003',
  },
};

// Rate limiting scenarios
export const mockRateLimitedResponse = {
  errors: [
    {
      title: 'Too Many Requests',
      detail: 'Too many requests for this endpoint. Please wait.',
      type: 'https://api.twitter.com/2/problems/too-many-requests',
    },
  ],
};

// Error responses
export const mockErrorResponse = {
  errors: [
    {
      title: 'Invalid Request',
      detail: 'One or more parameters to your request was invalid.',
      type: 'https://api.twitter.com/2/problems/invalid-request',
    },
  ],
};

// Mock Twitter client class
export class MockTwitterClient {
  private shouldThrowRateLimit = false;
  private shouldThrowError = false;
  private requestCount = 0;

  constructor() {
    this.reset();
  }

  reset() {
    this.shouldThrowRateLimit = false;
    this.shouldThrowError = false;
    this.requestCount = 0;
  }

  setRateLimitError(enabled: boolean) {
    this.shouldThrowRateLimit = enabled;
  }

  setError(enabled: boolean) {
    this.shouldThrowError = enabled;
  }

  getRequestCount() {
    return this.requestCount;
  }

  async getUsersByUsernames(
    usernames: string[]
  ): Promise<TwitterUsersResponse> {
    this.requestCount++;

    if (this.shouldThrowRateLimit) {
      throw new Error('Rate limit exceeded');
    }

    if (this.shouldThrowError) {
      throw new Error('Twitter API error');
    }

    const filteredUsers = mockTwitterUsers.filter((user) =>
      usernames.includes(user.username)
    );

    return {
      data: filteredUsers,
      meta: {
        result_count: filteredUsers.length,
      },
    };
  }

  async getTweetsByUserId(
    userId: string,
    options?: {
      max_results?: number;
      since_id?: string;
      until_id?: string;
    }
  ): Promise<TwitterTweetsResponse> {
    this.requestCount++;

    if (this.shouldThrowRateLimit) {
      throw new Error('Rate limit exceeded');
    }

    if (this.shouldThrowError) {
      throw new Error('Twitter API error');
    }

    const userTweets = mockTransferTweets.filter(
      (tweet) => tweet.author_id === userId
    );
    const limitedTweets = options?.max_results
      ? userTweets.slice(0, options.max_results)
      : userTweets;

    return {
      data: limitedTweets,
      includes: {
        users: mockTwitterUsers.filter((user) => user.id === userId),
      },
      meta: {
        result_count: limitedTweets.length,
        newest_id: limitedTweets[0]?.id,
        oldest_id: limitedTweets[limitedTweets.length - 1]?.id,
      },
    };
  }

  async searchTweets(
    query: string,
    options?: {
      max_results?: number;
      since_id?: string;
    }
  ): Promise<TwitterTweetsResponse> {
    this.requestCount++;

    if (this.shouldThrowRateLimit) {
      throw new Error('Rate limit exceeded');
    }

    if (this.shouldThrowError) {
      throw new Error('Twitter API error');
    }

    // Simple text matching for mock
    const matchingTweets = mockTransferTweets.filter((tweet) =>
      tweet.text.toLowerCase().includes(query.toLowerCase())
    );

    const limitedTweets = options?.max_results
      ? matchingTweets.slice(0, options.max_results)
      : matchingTweets;

    return {
      data: limitedTweets,
      includes: {
        users: mockTwitterUsers,
      },
      meta: {
        result_count: limitedTweets.length,
        newest_id: limitedTweets[0]?.id,
        oldest_id: limitedTweets[limitedTweets.length - 1]?.id,
      },
    };
  }
}

export const mockTwitterClient = new MockTwitterClient();
