import { z } from "zod";

/**
 * Twitter API v2 Response Schemas
 * Validates incoming data from Twitter API to ensure type safety
 */

// Twitter User Schema
export const TwitterUserSchema = z.object({
  id: z.string(),
  username: z.string().min(1).max(15),
  name: z.string().min(1).max(50),
  profile_image_url: z.string().url().optional(),
  verified: z.boolean().optional(),
  public_metrics: z
    .object({
      followers_count: z.number().min(0),
      following_count: z.number().min(0),
      tweet_count: z.number().min(0),
      listed_count: z.number().min(0),
    })
    .optional(),
});

// Twitter Tweet Attachments Schema
export const TwitterAttachmentsSchema = z.object({
  media_keys: z.array(z.string()).optional(),
  poll_ids: z.array(z.string()).optional(),
});

// Twitter Tweet Entities Schema
export const TwitterEntitiesSchema = z.object({
  hashtags: z
    .array(
      z.object({
        start: z.number(),
        end: z.number(),
        tag: z.string(),
      }),
    )
    .optional(),
  mentions: z
    .array(
      z.object({
        start: z.number(),
        end: z.number(),
        username: z.string(),
        id: z.string(),
      }),
    )
    .optional(),
  urls: z
    .array(
      z.object({
        start: z.number(),
        end: z.number(),
        url: z.string().url(),
        expanded_url: z.string().url().optional(),
        display_url: z.string().optional(),
        status: z.number().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        unwound_url: z.string().url().optional(),
      }),
    )
    .optional(),
  annotations: z
    .array(
      z.object({
        start: z.number(),
        end: z.number(),
        probability: z.number().min(0).max(1),
        type: z.string(),
        normalized_text: z.string().optional(),
      }),
    )
    .optional(),
});

// Twitter Tweet Public Metrics Schema
export const TwitterPublicMetricsSchema = z.object({
  retweet_count: z.number().min(0),
  reply_count: z.number().min(0),
  like_count: z.number().min(0),
  quote_count: z.number().min(0),
  bookmark_count: z.number().min(0).optional(),
  impression_count: z.number().min(0).optional(),
});

// Twitter Tweet Schema
export const TwitterTweetSchema = z.object({
  id: z.string(),
  text: z.string().min(1).max(280),
  author_id: z.string(),
  created_at: z.string().datetime(),
  conversation_id: z.string().optional(),
  in_reply_to_user_id: z.string().optional(),
  referenced_tweets: z
    .array(
      z.object({
        type: z.enum(["retweeted", "quoted", "replied_to"]),
        id: z.string(),
      }),
    )
    .optional(),
  attachments: TwitterAttachmentsSchema.optional(),
  context_annotations: z
    .array(
      z.object({
        domain: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().optional(),
        }),
        entity: z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().optional(),
        }),
      }),
    )
    .optional(),
  entities: TwitterEntitiesSchema.optional(),
  geo: z
    .object({
      coordinates: z
        .object({
          type: z.literal("Point"),
          coordinates: z.array(z.number()).length(2),
        })
        .optional(),
      place_id: z.string().optional(),
    })
    .optional(),
  lang: z.string().optional(),
  possibly_sensitive: z.boolean().optional(),
  public_metrics: TwitterPublicMetricsSchema.optional(),
  reply_settings: z
    .enum(["everyone", "mentionedUsers", "following"])
    .optional(),
  source: z.string().optional(),
  withheld: z
    .object({
      copyright: z.boolean().optional(),
      country_codes: z.array(z.string().length(2)).optional(),
      scope: z.enum(["tweet", "user"]).optional(),
    })
    .optional(),
});

// Twitter Media Schema
export const TwitterMediaSchema = z.object({
  media_key: z.string(),
  type: z.enum(["photo", "video", "animated_gif"]),
  url: z.string().url().optional(),
  duration_ms: z.number().min(0).optional(),
  height: z.number().min(1).optional(),
  width: z.number().min(1).optional(),
  preview_image_url: z.string().url().optional(),
  public_metrics: z
    .object({
      view_count: z.number().min(0).optional(),
    })
    .optional(),
  alt_text: z.string().optional(),
  variants: z
    .array(
      z.object({
        bit_rate: z.number().min(0).optional(),
        content_type: z.string(),
        url: z.string().url(),
      }),
    )
    .optional(),
});

// Twitter API Response Schemas
export const TwitterUsersResponseSchema = z.object({
  data: z.array(TwitterUserSchema).optional(),
  includes: z
    .object({
      users: z.array(TwitterUserSchema).optional(),
      tweets: z.array(TwitterTweetSchema).optional(),
      media: z.array(TwitterMediaSchema).optional(),
    })
    .optional(),
  errors: z
    .array(
      z.object({
        detail: z.string(),
        title: z.string(),
        resource_type: z.string().optional(),
        parameter: z.string().optional(),
        resource_id: z.string().optional(),
        type: z.string().url().optional(),
      }),
    )
    .optional(),
  meta: z
    .object({
      result_count: z.number().min(0),
      next_token: z.string().optional(),
      previous_token: z.string().optional(),
      newest_id: z.string().optional(),
      oldest_id: z.string().optional(),
    })
    .optional(),
});

export const TwitterTweetsResponseSchema = z.object({
  data: z.array(TwitterTweetSchema).optional(),
  includes: z
    .object({
      users: z.array(TwitterUserSchema).optional(),
      tweets: z.array(TwitterTweetSchema).optional(),
      media: z.array(TwitterMediaSchema).optional(),
    })
    .optional(),
  errors: z
    .array(
      z.object({
        detail: z.string(),
        title: z.string(),
        resource_type: z.string().optional(),
        parameter: z.string().optional(),
        resource_id: z.string().optional(),
        type: z.string().url().optional(),
      }),
    )
    .optional(),
  meta: z
    .object({
      result_count: z.number().min(0),
      next_token: z.string().optional(),
      previous_token: z.string().optional(),
      newest_id: z.string().optional(),
      oldest_id: z.string().optional(),
    })
    .optional(),
});

// Transfer Relevance Schema
export const TransferRelevanceSchema = z.object({
  isTransferRelated: z.boolean(),
  confidence: z.number().min(0).max(1),
  keywords: z.array(z.string()),
  entities: z.object({
    players: z.array(z.string()),
    clubs: z.array(z.string()),
    agents: z.array(z.string()),
    journalists: z.array(z.string()),
  }),
  transferType: z
    .enum([
      "rumour",
      "confirmed",
      "medical",
      "contract",
      "loan",
      "release",
      "denial",
    ])
    .optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

// Processed Tweet Schema (internal)
export const ProcessedTweetSchema = z.object({
  id: z.string(),
  originalTweet: TwitterTweetSchema,
  author: TwitterUserSchema,
  processedAt: z.date(),
  relevance: TransferRelevanceSchema,
  content: z.object({
    cleanText: z.string(),
    mentions: z.array(z.string()),
    hashtags: z.array(z.string()),
    urls: z.array(z.string().url()),
    mediaUrls: z.array(z.string().url()),
  }),
  metadata: z.object({
    wordCount: z.number().min(0),
    readabilityScore: z.number().min(0).max(100),
    sentimentScore: z.number().min(-1).max(1),
    spamScore: z.number().min(0).max(1),
  }),
});

// Export types inferred from schemas
export type TwitterUser = z.infer<typeof TwitterUserSchema>;
export type TwitterTweet = z.infer<typeof TwitterTweetSchema>;
export type TwitterMedia = z.infer<typeof TwitterMediaSchema>;
export type TwitterUsersResponse = z.infer<typeof TwitterUsersResponseSchema>;
export type TwitterTweetsResponse = z.infer<typeof TwitterTweetsResponseSchema>;
export type TransferRelevance = z.infer<typeof TransferRelevanceSchema>;
export type ProcessedTweet = z.infer<typeof ProcessedTweetSchema>;
