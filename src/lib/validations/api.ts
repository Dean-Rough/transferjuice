import { z } from "zod";

/**
 * API Contract Schemas
 * Validates request/response patterns for all API endpoints
 */

// Common API patterns
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).optional(),
  total: z.number().min(0).optional(),
  hasMore: z.boolean().optional(),
});

export const SortSchema = z.object({
  field: z.string(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const DateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

// Standard API response wrapper
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    message: z.string().optional(),
    errors: z
      .array(
        z.object({
          field: z.string().optional(),
          message: z.string(),
          code: z.string().optional(),
        }),
      )
      .optional(),
    meta: z.object({
      timestamp: z.string().datetime(),
      requestId: z.string(),
      version: z.string(),
      pagination: PaginationSchema.optional(),
    }),
  });

// Error response schema
export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
    field: z.string().optional(),
  }),
  meta: z.object({
    timestamp: z.string().datetime(),
    requestId: z.string(),
    version: z.string(),
  }),
});

// Health check schema
export const HealthCheckSchema = z.object({
  status: z.enum(["healthy", "degraded", "unhealthy"]),
  timestamp: z.string().datetime(),
  version: z.string(),
  uptime: z.number().min(0), // seconds
  services: z.object({
    database: z.object({
      status: z.enum(["up", "down", "degraded"]),
      responseTime: z.number().min(0).optional(),
      lastCheck: z.string().datetime(),
    }),
    twitter: z.object({
      status: z.enum(["up", "down", "degraded"]),
      responseTime: z.number().min(0).optional(),
      rateLimitRemaining: z.number().min(0).optional(),
      lastCheck: z.string().datetime(),
    }),
    ai: z.object({
      status: z.enum(["up", "down", "degraded"]),
      responseTime: z.number().min(0).optional(),
      lastCheck: z.string().datetime(),
    }),
    email: z.object({
      status: z.enum(["up", "down", "degraded"]),
      responseTime: z.number().min(0).optional(),
      lastCheck: z.string().datetime(),
    }),
  }),
});

// Twitter API endpoints
export const TwitterUserLookupQuerySchema = z.object({
  usernames: z.string().transform((val) => val.split(",").map((u) => u.trim())),
  user_fields: z.string().optional(),
  expansions: z.string().optional(),
});

export const TwitterTweetsQuerySchema = z.object({
  ids: z.string().transform((val) => val.split(",").map((id) => id.trim())),
  tweet_fields: z.string().optional(),
  user_fields: z.string().optional(),
  media_fields: z.string().optional(),
  expansions: z.string().optional(),
});

export const TwitterUserTimelineQuerySchema = z.object({
  user_id: z.string(),
  max_results: z.number().min(5).max(100).default(10),
  since_id: z.string().optional(),
  until_id: z.string().optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  tweet_fields: z.string().optional(),
  user_fields: z.string().optional(),
  media_fields: z.string().optional(),
  expansions: z.string().optional(),
  pagination_token: z.string().optional(),
});

// Article API endpoints
export const CreateArticleRequestSchema = z.object({
  title: z.string().min(10).max(255),
  subtitle: z.string().min(10).max(500).optional(),
  briefingType: z.enum(["morning", "afternoon", "evening"]),
  sourceTweetIds: z.array(z.string()).min(1).max(50),
  autoPublish: z.boolean().default(false),
  scheduledFor: z.string().datetime().optional(),
  customInstructions: z.string().max(1000).optional(),
});

export const UpdateArticleRequestSchema = z.object({
  title: z.string().min(10).max(255).optional(),
  subtitle: z.string().min(10).max(500).optional(),
  status: z
    .enum(["draft", "under_review", "approved", "published", "archived"])
    .optional(),
  scheduledFor: z.string().datetime().optional(),
  reviewNotes: z.string().max(1000).optional(),
});

export const ArticlesQuerySchema = z.object({
  briefingType: z.enum(["morning", "afternoon", "evening"]).optional(),
  status: z
    .enum([
      "draft",
      "ai_generated",
      "under_review",
      "approved",
      "published",
      "archived",
    ])
    .optional(),
  publishedAfter: z.string().datetime().optional(),
  publishedBefore: z.string().datetime().optional(),
  search: z.string().min(3).max(100).optional(),
  tags: z
    .string()
    .transform((val) => val.split(",").map((t) => t.trim()))
    .optional(),
  ...PaginationSchema.shape,
  sort: SortSchema.optional(),
});

// Subscriber API endpoints
export const SubscribeRequestSchema = z.object({
  email: z.string().email(),
  preferences: z
    .object({
      emailFrequency: z
        .enum(["all", "daily", "weekly", "major_only"])
        .default("all"),
      preferredTeams: z
        .array(
          z.enum([
            "arsenal",
            "aston_villa",
            "bournemouth",
            "brentford",
            "brighton",
            "burnley",
            "chelsea",
            "crystal_palace",
            "everton",
            "fulham",
            "liverpool",
            "luton",
            "manchester_city",
            "manchester_united",
            "newcastle",
            "nottingham_forest",
            "sheffield_united",
            "tottenham",
            "west_ham",
            "wolves",
          ]),
        )
        .max(5)
        .default([]),
      receiveBreakingNews: z.boolean().default(true),
    })
    .optional(),
  gdprConsent: z.boolean().refine((val) => val === true, {
    message: "GDPR consent is required",
  }),
  subscriptionSource: z
    .enum([
      "website",
      "social_media",
      "referral",
      "organic",
      "paid_ad",
      "other",
    ])
    .default("website"),
  utmParameters: z
    .object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
      term: z.string().optional(),
      content: z.string().optional(),
    })
    .optional(),
});

export const UpdateSubscriberRequestSchema = z.object({
  preferences: z
    .object({
      emailFrequency: z
        .enum(["all", "daily", "weekly", "major_only"])
        .optional(),
      preferredTeams: z
        .array(
          z.enum([
            "arsenal",
            "aston_villa",
            "bournemouth",
            "brentford",
            "brighton",
            "burnley",
            "chelsea",
            "crystal_palace",
            "everton",
            "fulham",
            "liverpool",
            "luton",
            "manchester_city",
            "manchester_united",
            "newcastle",
            "nottingham_forest",
            "sheffield_united",
            "tottenham",
            "west_ham",
            "wolves",
          ]),
        )
        .max(5)
        .optional(),
      receiveBreakingNews: z.boolean().optional(),
      emailFormat: z.enum(["html", "text"]).optional(),
      timezone: z.string().optional(),
    })
    .optional(),
});

export const UnsubscribeRequestSchema = z.object({
  token: z.string().min(32), // Unsubscribe token
  reason: z
    .enum([
      "too_frequent",
      "not_relevant",
      "poor_quality",
      "changed_email",
      "privacy_concerns",
      "other",
    ])
    .optional(),
  feedback: z.string().max(500).optional(),
});

export const SubscribersQuerySchema = z.object({
  status: z
    .enum([
      "pending",
      "active",
      "paused",
      "unsubscribed",
      "bounced",
      "complained",
    ])
    .optional(),
  subscribedAfter: z.string().datetime().optional(),
  subscribedBefore: z.string().datetime().optional(),
  lastEngagementAfter: z.string().datetime().optional(),
  lastEngagementBefore: z.string().datetime().optional(),
  source: z
    .enum([
      "website",
      "social_media",
      "referral",
      "organic",
      "paid_ad",
      "other",
    ])
    .optional(),
  preferredTeam: z
    .enum([
      "arsenal",
      "aston_villa",
      "bournemouth",
      "brentford",
      "brighton",
      "burnley",
      "chelsea",
      "crystal_palace",
      "everton",
      "fulham",
      "liverpool",
      "luton",
      "manchester_city",
      "manchester_united",
      "newcastle",
      "nottingham_forest",
      "sheffield_united",
      "tottenham",
      "west_ham",
      "wolves",
    ])
    .optional(),
  ...PaginationSchema.shape,
  sort: SortSchema.optional(),
});

// Analytics API endpoints
export const AnalyticsQuerySchema = z.object({
  metrics: z.array(
    z.enum(["content", "audience", "engagement", "technical", "business"]),
  ),
  dateRange: DateRangeSchema,
  granularity: z.enum(["hour", "day", "week", "month"]).default("day"),
  filters: z
    .object({
      articleIds: z.array(z.string()).optional(),
      briefingTypes: z
        .array(z.enum(["morning", "afternoon", "evening"]))
        .optional(),
      countries: z.array(z.string().length(2)).optional(),
      devices: z.array(z.enum(["mobile", "tablet", "desktop"])).optional(),
    })
    .optional(),
  compare: z.enum(["previous_period", "same_period_last_year"]).optional(),
});

export const TrackEventRequestSchema = z.object({
  event: z.enum([
    "page_view",
    "article_view",
    "newsletter_signup",
    "email_click",
    "search",
    "share",
    "download",
  ]),
  properties: z
    .object({
      url: z.string().url().optional(),
      articleId: z.string().optional(),
      briefingType: z.enum(["morning", "afternoon", "evening"]).optional(),
      source: z.string().optional(),
      campaign: z.string().optional(),
      customProperties: z.record(z.string(), z.any()).optional(),
    })
    .optional(),
  sessionId: z.string(),
  userId: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

// Email campaign API endpoints
export const CreateCampaignRequestSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum([
    "briefing",
    "breaking_news",
    "weekly_digest",
    "welcome",
    "reengagement",
  ]),
  subject: z.string().min(5).max(100),
  preheader: z.string().min(10).max(200).optional(),
  articleId: z.string().optional(), // For briefing campaigns
  customContent: z
    .object({
      html: z.string().min(100),
      text: z.string().min(100),
    })
    .optional(),
  targeting: z
    .object({
      includeStatuses: z
        .array(z.enum(["active", "pending"]))
        .default(["active"]),
      preferredTeams: z
        .array(
          z.enum([
            "arsenal",
            "aston_villa",
            "bournemouth",
            "brentford",
            "brighton",
            "burnley",
            "chelsea",
            "crystal_palace",
            "everton",
            "fulham",
            "liverpool",
            "luton",
            "manchester_city",
            "manchester_united",
            "newcastle",
            "nottingham_forest",
            "sheffield_united",
            "tottenham",
            "west_ham",
            "wolves",
          ]),
        )
        .optional(),
      emailFrequency: z
        .array(z.enum(["all", "daily", "weekly", "major_only"]))
        .optional(),
    })
    .optional(),
  scheduledFor: z.string().datetime().optional(),
});

export const CampaignsQuerySchema = z.object({
  type: z
    .enum([
      "briefing",
      "breaking_news",
      "weekly_digest",
      "welcome",
      "reengagement",
    ])
    .optional(),
  status: z
    .enum(["draft", "scheduled", "sending", "sent", "cancelled"])
    .optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  ...PaginationSchema.shape,
  sort: SortSchema.optional(),
});

// Content generation API endpoints
export const GenerateContentRequestSchema = z.object({
  briefingType: z.enum(["morning", "afternoon", "evening"]),
  sourceTweetIds: z.array(z.string()).min(1).max(50),
  targetWordCount: z.number().min(200).max(2000).default(800),
  tone: z
    .enum(["witty", "sarcastic", "informative", "humorous"])
    .default("witty"),
  includeImages: z.boolean().default(true),
  customInstructions: z.string().max(1000).optional(),
  draftMode: z.boolean().default(false), // If true, saves as draft instead of processing
});

export const ValidateContentRequestSchema = z.object({
  content: z.string().min(100),
  type: z.enum(["article", "email_subject", "social_post"]),
  checks: z
    .array(
      z.enum([
        "grammar",
        "brand_voice",
        "fact_check",
        "readability",
        "sentiment",
      ]),
    )
    .optional(),
});

// Admin API endpoints (protected)
export const AdminStatsQuerySchema = z.object({
  dateRange: DateRangeSchema,
  metrics: z
    .array(
      z.enum([
        "system_health",
        "content_pipeline",
        "user_growth",
        "engagement",
        "revenue",
      ]),
    )
    .default(["system_health"]),
});

export const SystemConfigUpdateSchema = z.object({
  twitterApi: z
    .object({
      rateLimitBuffer: z.number().min(0).max(0.5).optional(),
      fetchInterval: z.number().min(300).max(3600).optional(), // 5min to 1hour
      targetAccounts: z.array(z.string()).max(20).optional(),
    })
    .optional(),
  aiGeneration: z
    .object({
      model: z.string().optional(),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().min(100).max(4000).optional(),
      qualityThreshold: z.number().min(0).max(100).optional(),
    })
    .optional(),
  emailService: z
    .object({
      provider: z.enum(["convertkit", "mailerlite", "postmark"]).optional(),
      sendTimeOptimization: z.boolean().optional(),
      frequencyCapping: z.boolean().optional(),
    })
    .optional(),
});

// Webhook schemas
export const WebhookEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    "article.published",
    "subscriber.confirmed",
    "subscriber.unsubscribed",
    "campaign.sent",
    "system.error",
  ]),
  data: z.any(),
  timestamp: z.string().datetime(),
  source: z.string(),
  version: z.string(),
});

export const WebhookDeliverySchema = z.object({
  url: z.string().url(),
  event: WebhookEventSchema,
  attempt: z.number().min(1),
  response: z
    .object({
      status: z.number(),
      headers: z.record(z.string(), z.string()),
      body: z.string().optional(),
      duration: z.number().min(0), // milliseconds
    })
    .optional(),
  success: z.boolean(),
  error: z.string().optional(),
  nextRetry: z.string().datetime().optional(),
});

// Export types
export type ApiResponse<T> = z.infer<
  ReturnType<typeof ApiResponseSchema<z.ZodType<T>>>
>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type HealthCheck = z.infer<typeof HealthCheckSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type Sort = z.infer<typeof SortSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;

// Twitter API types
export type TwitterUserLookupQuery = z.infer<
  typeof TwitterUserLookupQuerySchema
>;
export type TwitterTweetsQuery = z.infer<typeof TwitterTweetsQuerySchema>;
export type TwitterUserTimelineQuery = z.infer<
  typeof TwitterUserTimelineQuerySchema
>;

// Article API types
export type CreateArticleRequest = z.infer<typeof CreateArticleRequestSchema>;
export type UpdateArticleRequest = z.infer<typeof UpdateArticleRequestSchema>;
export type ArticlesQuery = z.infer<typeof ArticlesQuerySchema>;

// Subscriber API types
export type SubscribeRequest = z.infer<typeof SubscribeRequestSchema>;
export type UpdateSubscriberRequest = z.infer<
  typeof UpdateSubscriberRequestSchema
>;
export type UnsubscribeRequest = z.infer<typeof UnsubscribeRequestSchema>;
export type SubscribersQuery = z.infer<typeof SubscribersQuerySchema>;

// Analytics API types
export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
export type TrackEventRequest = z.infer<typeof TrackEventRequestSchema>;

// Campaign API types
export type CreateCampaignRequest = z.infer<typeof CreateCampaignRequestSchema>;
export type CampaignsQuery = z.infer<typeof CampaignsQuerySchema>;

// Content generation types
export type GenerateContentRequest = z.infer<
  typeof GenerateContentRequestSchema
>;
export type ValidateContentRequest = z.infer<
  typeof ValidateContentRequestSchema
>;

// Admin types
export type AdminStatsQuery = z.infer<typeof AdminStatsQuerySchema>;
export type SystemConfigUpdate = z.infer<typeof SystemConfigUpdateSchema>;

// Webhook types
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;
export type WebhookDelivery = z.infer<typeof WebhookDeliverySchema>;
