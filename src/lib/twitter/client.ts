/**
 * Twitter/X API v2 Client
 * Handles authentication, rate limiting, and global ITK source monitoring
 */

import { validateEnvironment } from '@/lib/validations/environment';
import { TwitterTweetsResponseSchema } from '@/lib/validations/twitter';
import { z } from 'zod';
import { applyTerryStyle } from '@/lib/terry-style';

// Twitter API v2 Response Schemas
export const TwitterUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  verified: z.boolean().default(false),
  profile_image_url: z.string().optional(),
  description: z.string().optional(),
  public_metrics: z.object({
    followers_count: z.number(),
    following_count: z.number(),
    tweet_count: z.number(),
  }),
});

// Missing type exports that are referenced elsewhere
export const TweetMediaInfoSchema = z.object({
  media_key: z.string(),
  type: z.enum(['photo', 'video', 'gif']),
  url: z.string().optional(),
  preview_image_url: z.string().optional(),
  alt_text: z.string().optional(),
});

export type TweetMediaInfo = z.infer<typeof TweetMediaInfoSchema>;

export const TwitterTweetSchema = z.object({
  id: z.string(),
  text: z.string(),
  author_id: z.string(),
  created_at: z.string(),
  context_annotations: z
    .array(
      z.object({
        domain: z.object({
          id: z.string(),
          name: z.string(),
        }),
        entity: z.object({
          id: z.string(),
          name: z.string(),
        }),
      })
    )
    .optional(),
  public_metrics: z.object({
    retweet_count: z.number(),
    like_count: z.number(),
    reply_count: z.number(),
    quote_count: z.number(),
  }),
  attachments: z
    .object({
      media_keys: z.array(z.string()).optional(),
    })
    .optional(),
  lang: z.string().optional(),
  referenced_tweets: z
    .array(
      z.object({
        type: z.string(),
        id: z.string(),
      })
    )
    .optional(),
});

export const TwitterTimelineResponseSchema = z.object({
  data: z.array(TwitterTweetSchema).optional(),
  includes: z
    .object({
      users: z.array(TwitterUserSchema).optional(),
      media: z
        .array(
          z.object({
            media_key: z.string(),
            type: z.string(),
            url: z.string().optional(),
            preview_image_url: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
  meta: z.object({
    oldest_id: z.string().optional(),
    newest_id: z.string().optional(),
    result_count: z.number(),
    next_token: z.string().optional(),
  }),
  errors: z
    .array(
      z.object({
        title: z.string(),
        detail: z.string(),
        type: z.string(),
      })
    )
    .optional(),
});

export type TwitterUser = z.infer<typeof TwitterUserSchema>;
export type TwitterTweet = z.infer<typeof TwitterTweetSchema>;
export type TwitterTimelineResponse = z.infer<
  typeof TwitterTimelineResponseSchema
>;

// Rate limiting configuration
interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

interface TwitterClientConfig {
  bearerToken: string;
  baseUrl?: string;
  defaultMaxResults?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export class TwitterAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorType?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'TwitterAPIError';
  }
}

export class TwitterRateLimitError extends TwitterAPIError {
  constructor(
    message: string,
    public resetTime: number
  ) {
    super(message, 429, 'rate_limit_exceeded');
    this.name = 'TwitterRateLimitError';
  }
}

export class TwitterClient {
  private baseUrl: string;
  private bearerToken: string;
  private defaultMaxResults: number;
  private retryAttempts: number;
  private retryDelay: number;
  private rateLimits: Map<string, RateLimitInfo> = new Map();

  constructor(config: TwitterClientConfig) {
    this.baseUrl = config.baseUrl || 'https://api.twitter.com/2';
    this.bearerToken = config.bearerToken;
    this.defaultMaxResults = config.defaultMaxResults || 100;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  /**
   * Check rate limit status for an endpoint
   */
  private checkRateLimit(endpoint: string): void {
    const rateLimitInfo = this.rateLimits.get(endpoint);
    if (!rateLimitInfo) return;

    const now = Math.floor(Date.now() / 1000);
    if (rateLimitInfo.remaining <= 0 && now < rateLimitInfo.reset) {
      const waitTime = rateLimitInfo.reset - now;
      throw new TwitterRateLimitError(
        `Rate limit exceeded for ${endpoint}. Reset in ${waitTime} seconds.`,
        rateLimitInfo.reset
      );
    }
  }

  /**
   * Update rate limit information from response headers
   */
  private updateRateLimit(endpoint: string, headers: Headers): void {
    const limit = parseInt(headers.get('x-rate-limit-limit') || '0');
    const remaining = parseInt(headers.get('x-rate-limit-remaining') || '0');
    const reset = parseInt(headers.get('x-rate-limit-reset') || '0');

    if (limit > 0) {
      this.rateLimits.set(endpoint, { limit, remaining, reset });
    }
  }

  /**
   * Make authenticated request to Twitter API
   */
  private async makeRequest(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<Response> {
    this.checkRateLimit(endpoint);

    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
            'User-Agent': 'TransferJuice/1.0',
          },
        });

        // Update rate limit info
        this.updateRateLimit(endpoint, response.headers);

        if (!response.ok) {
          if (response.status === 429) {
            const resetTime = parseInt(
              response.headers.get('x-rate-limit-reset') || '0'
            );
            throw new TwitterRateLimitError(
              'Hit the Twitter rate limit like a proper muppet',
              resetTime
            );
          }

          const errorData = await response.json().catch(() => ({}));
          throw new TwitterAPIError(
            `Twitter API responded with ${response.status}: ${errorData.detail || response.statusText}`,
            response.status,
            errorData.type,
            errorData
          );
        }

        return response;
      } catch (error) {
        lastError = error as Error;

        // Don't retry rate limit errors
        if (error instanceof TwitterRateLimitError) {
          throw error;
        }

        // Don't retry 4xx errors (except 429)
        if (
          error instanceof TwitterAPIError &&
          error.statusCode &&
          error.statusCode < 500
        ) {
          throw error;
        }

        if (attempt < this.retryAttempts) {
          console.warn(
            `Attempt ${attempt} failed, retrying in ${this.retryDelay}ms: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryDelay * attempt)
          );
        }
      }
    }

    throw new TwitterAPIError(
      `Failed to make request after ${this.retryAttempts} attempts: ${lastError?.message}`
    );
  }

  /**
   * Get user timeline with all relevant tweet data
   */
  async getUserTimeline(
    userId: string,
    options: {
      maxResults?: number;
      sinceId?: string;
      untilId?: string;
      startTime?: string;
      endTime?: string;
    } = {}
  ): Promise<TwitterTimelineResponse> {
    const params: Record<string, string> = {
      max_results: (options.maxResults || this.defaultMaxResults).toString(),
      'tweet.fields': [
        'id',
        'text',
        'author_id',
        'created_at',
        'context_annotations',
        'public_metrics',
        'attachments',
        'lang',
        'referenced_tweets',
      ].join(','),
      'user.fields': [
        'id',
        'username',
        'name',
        'verified',
        'public_metrics',
      ].join(','),
      'media.fields': ['media_key', 'type', 'url', 'preview_image_url'].join(
        ','
      ),
      expansions: 'author_id,attachments.media_keys',
    };

    if (options.sinceId) params.since_id = options.sinceId;
    if (options.untilId) params.until_id = options.untilId;
    if (options.startTime) params.start_time = options.startTime;
    if (options.endTime) params.end_time = options.endTime;

    try {
      const response = await this.makeRequest(
        `/users/${userId}/tweets`,
        params
      );
      const data = await response.json();

      return TwitterTimelineResponseSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new TwitterAPIError(
          applyTerryStyle.enhanceError(
            `Twitter API returned unexpected data structure: ${error.errors.map((e) => e.message).join(', ')}`
          )
        );
      }
      throw error;
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<TwitterUser> {
    const params = {
      'user.fields': [
        'id',
        'username',
        'name',
        'verified',
        'public_metrics',
      ].join(','),
    };

    try {
      const response = await this.makeRequest(
        `/users/by/username/${username}`,
        params
      );
      const data = await response.json();

      if (!data.data) {
        throw new TwitterAPIError(
          applyTerryStyle.enhanceError(
            `User @${username} not found or account is private`
          )
        );
      }

      return TwitterUserSchema.parse(data.data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new TwitterAPIError(
          applyTerryStyle.enhanceError(
            `Invalid user data from Twitter API: ${error.message}`
          )
        );
      }
      throw error;
    }
  }

  /**
   * Get rate limit status for all endpoints
   */
  getRateLimitStatus(): Record<string, RateLimitInfo> {
    const status: Record<string, RateLimitInfo> = {};
    this.rateLimits.forEach((info, endpoint) => {
      status[endpoint] = { ...info };
    });
    return status;
  }

  /**
   * Wait for rate limit reset if needed
   */
  async waitForRateLimit(endpoint: string): Promise<void> {
    const rateLimitInfo = this.rateLimits.get(endpoint);
    if (!rateLimitInfo || rateLimitInfo.remaining > 0) return;

    const now = Math.floor(Date.now() / 1000);
    const waitTime = Math.max(0, rateLimitInfo.reset - now);

    if (waitTime > 0) {
      console.log(
        applyTerryStyle.enhanceMessage(
          `Waiting ${waitTime} seconds for rate limit reset on ${endpoint}`
        )
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
    }
  }

  /**
   * Check if the client is properly configured
   */
  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.bearerToken) {
      errors.push('Bearer token is required');
    }

    if (!this.bearerToken.startsWith('AAAAAAA')) {
      errors.push('Bearer token appears to be invalid format');
    }

    return {
      valid: errors.length === 0,
      errors: errors.map((error) => applyTerryStyle.enhanceError(error)),
    };
  }
}
