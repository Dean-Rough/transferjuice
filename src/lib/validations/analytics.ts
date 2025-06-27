import { z } from "zod";

/**
 * Analytics and Metrics Schemas
 * Validates performance tracking and business intelligence data
 */

// Time period schema for analytics queries
export const TimePeriodSchema = z.enum([
  "hour",
  "day",
  "week",
  "month",
  "quarter",
  "year",
]);

// Metric categories
export const MetricCategorySchema = z.enum([
  "content",
  "audience",
  "engagement",
  "technical",
  "business",
]);

// Website analytics event schema
export const WebAnalyticsEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    "page_view",
    "article_view",
    "newsletter_signup",
    "email_click",
    "search",
    "share",
    "download",
    "error",
  ]),

  // Event data
  timestamp: z.date(),
  sessionId: z.string(),
  userId: z.string().optional(), // If identified user

  // Page/content data
  url: z.string().url(),
  title: z.string().optional(),
  referrer: z.string().url().optional(),
  articleId: z.string().optional(),
  briefingType: z.enum(["morning", "afternoon", "evening"]).optional(),

  // User context
  userAgent: z.string().optional(),
  ipAddress: z.string().ip().optional(),
  location: z
    .object({
      country: z.string().length(2).optional(),
      region: z.string().optional(),
      city: z.string().optional(),
      timezone: z.string().optional(),
    })
    .optional(),

  // Device info
  device: z
    .object({
      type: z.enum(["mobile", "tablet", "desktop", "unknown"]),
      os: z.string().optional(),
      browser: z.string().optional(),
      screenSize: z
        .object({
          width: z.number().min(1),
          height: z.number().min(1),
        })
        .optional(),
    })
    .optional(),

  // Performance data
  performance: z
    .object({
      loadTime: z.number().min(0).optional(), // milliseconds
      domContentLoaded: z.number().min(0).optional(),
      firstContentfulPaint: z.number().min(0).optional(),
      largestContentfulPaint: z.number().min(0).optional(),
      cumulativeLayoutShift: z.number().min(0).optional(),
      timeToInteractive: z.number().min(0).optional(),
    })
    .optional(),

  // Custom event data
  customProperties: z.record(z.string(), z.any()).optional(),
});

// Content performance metrics
export const ContentMetricsSchema = z.object({
  articleId: z.string(),
  date: z.date(),

  // Engagement metrics
  views: z.number().min(0).default(0),
  uniqueViews: z.number().min(0).default(0),
  averageTimeOnPage: z.number().min(0).default(0), // seconds
  bounceRate: z.number().min(0).max(1).default(0),
  scrollDepth: z.number().min(0).max(1).default(0),

  // Social sharing
  shares: z.object({
    twitter: z.number().min(0).default(0),
    facebook: z.number().min(0).default(0),
    linkedin: z.number().min(0).default(0),
    reddit: z.number().min(0).default(0),
    whatsapp: z.number().min(0).default(0),
    total: z.number().min(0).default(0),
  }),

  // Email performance (if article was sent via email)
  emailMetrics: z
    .object({
      campaignId: z.string().optional(),
      recipients: z.number().min(0).default(0),
      opens: z.number().min(0).default(0),
      clicks: z.number().min(0).default(0),
      openRate: z.number().min(0).max(1).default(0),
      clickRate: z.number().min(0).max(1).default(0),
    })
    .optional(),

  // SEO metrics
  seoMetrics: z
    .object({
      organicViews: z.number().min(0).default(0),
      searchImpressions: z.number().min(0).default(0),
      searchClicks: z.number().min(0).default(0),
      averagePosition: z.number().min(0).optional(),
      topKeywords: z.array(z.string()).max(10).default([]),
    })
    .optional(),

  // Quality indicators
  qualityMetrics: z
    .object({
      readabilityScore: z.number().min(0).max(100).optional(),
      engagementScore: z.number().min(0).max(100).optional(),
      shareabilityScore: z.number().min(0).max(100).optional(),
      userRating: z.number().min(1).max(5).optional(),
      commentsCount: z.number().min(0).default(0),
    })
    .optional(),
});

// Audience analytics schema
export const AudienceMetricsSchema = z.object({
  date: z.date(),

  // Subscriber metrics
  totalSubscribers: z.number().min(0),
  newSubscribers: z.number().min(0),
  unsubscribes: z.number().min(0),
  netGrowth: z.number(),
  churnRate: z.number().min(0).max(1),

  // Engagement metrics
  activeSubscribers: z.number().min(0), // Opened email in last 30 days
  avgOpenRate: z.number().min(0).max(1),
  avgClickRate: z.number().min(0).max(1),
  engagementScore: z.number().min(0).max(100),

  // Demographics
  demographics: z.object({
    countries: z.record(z.string(), z.number().min(0)),
    devices: z.object({
      mobile: z.number().min(0),
      tablet: z.number().min(0),
      desktop: z.number().min(0),
    }),
    emailClients: z.record(z.string(), z.number().min(0)),
    subscriptionSources: z.record(z.string(), z.number().min(0)),
  }),

  // Preferences breakdown
  preferences: z.object({
    frequency: z.record(z.string(), z.number().min(0)),
    teams: z.record(z.string(), z.number().min(0)),
    contentTypes: z.record(z.string(), z.number().min(0)),
  }),

  // Lifecycle metrics
  lifecycle: z.object({
    avgLifetimeValue: z.number().min(0), // Estimated value per subscriber
    avgSubscriptionLength: z.number().min(0), // Days
    retentionRates: z.object({
      day7: z.number().min(0).max(1),
      day30: z.number().min(0).max(1),
      day90: z.number().min(0).max(1),
      day365: z.number().min(0).max(1),
    }),
  }),
});

// Technical performance metrics
export const TechnicalMetricsSchema = z.object({
  date: z.date(),

  // Website performance
  webPerformance: z.object({
    avgPageLoadTime: z.number().min(0), // milliseconds
    avgTimeToInteractive: z.number().min(0),
    coreWebVitals: z.object({
      lcp: z.number().min(0), // Largest Contentful Paint
      fid: z.number().min(0), // First Input Delay
      cls: z.number().min(0), // Cumulative Layout Shift
    }),
    lighthouseScores: z.object({
      performance: z.number().min(0).max(100),
      accessibility: z.number().min(0).max(100),
      bestPractices: z.number().min(0).max(100),
      seo: z.number().min(0).max(100),
    }),
  }),

  // API performance
  apiPerformance: z.object({
    averageResponseTime: z.number().min(0),
    errorRate: z.number().min(0).max(1),
    throughput: z.number().min(0), // Requests per minute
    rateLimitHits: z.number().min(0),

    // Endpoint specific metrics
    endpoints: z.record(
      z.string(),
      z.object({
        avgResponseTime: z.number().min(0),
        errorRate: z.number().min(0).max(1),
        requestCount: z.number().min(0),
      }),
    ),
  }),

  // Infrastructure metrics
  infrastructure: z.object({
    uptime: z.number().min(0).max(1),
    cpuUsage: z.number().min(0).max(100),
    memoryUsage: z.number().min(0).max(100),
    diskUsage: z.number().min(0).max(100),
    networkLatency: z.number().min(0),

    // Database metrics
    database: z.object({
      connectionCount: z.number().min(0),
      queryTime: z.number().min(0),
      slowQueries: z.number().min(0),
      cacheHitRate: z.number().min(0).max(1),
    }),
  }),

  // Error tracking
  errors: z.object({
    totalErrors: z.number().min(0),
    uniqueErrors: z.number().min(0),
    criticalErrors: z.number().min(0),
    warningCount: z.number().min(0),

    // Top errors
    topErrors: z
      .array(
        z.object({
          message: z.string(),
          count: z.number().min(0),
          lastSeen: z.date(),
        }),
      )
      .max(10),
  }),
});

// Business metrics schema
export const BusinessMetricsSchema = z.object({
  date: z.date(),

  // Growth metrics
  growth: z.object({
    subscriberGrowthRate: z.number(),
    monthlyRecurringValue: z.number().min(0), // If monetized
    customerAcquisitionCost: z.number().min(0),
    lifetimeValue: z.number().min(0),
    churnRate: z.number().min(0).max(1),
  }),

  // Content metrics
  content: z.object({
    articlesPublished: z.number().min(0),
    averageWordsPerArticle: z.number().min(0),
    contentQualityScore: z.number().min(0).max(100),
    aiGenerationSuccessRate: z.number().min(0).max(1),
    editorialReviewTime: z.number().min(0), // Minutes
  }),

  // Operational metrics
  operations: z.object({
    automationSuccessRate: z.number().min(0).max(1),
    manualInterventions: z.number().min(0),
    systemDowntime: z.number().min(0), // Minutes
    supportTickets: z.number().min(0),
    processingCosts: z.number().min(0), // AI + infrastructure costs
  }),

  // Competitive analysis
  competitive: z
    .object({
      marketShare: z.number().min(0).max(1).optional(),
      competitorMentions: z.number().min(0),
      brandSentiment: z.number().min(-1).max(1),
      socialMediaFollowing: z.number().min(0),
    })
    .optional(),
});

// Analytics query schema
export const AnalyticsQuerySchema = z.object({
  metrics: z.array(MetricCategorySchema),
  dateFrom: z.date(),
  dateTo: z.date(),
  granularity: TimePeriodSchema.default("day"),

  // Filters
  filters: z
    .object({
      articleIds: z.array(z.string()).optional(),
      briefingTypes: z
        .array(z.enum(["morning", "afternoon", "evening"]))
        .optional(),
      countries: z.array(z.string().length(2)).optional(),
      devices: z.array(z.enum(["mobile", "tablet", "desktop"])).optional(),
      sources: z.array(z.string()).optional(),
    })
    .optional(),

  // Comparison options
  compareWith: z
    .object({
      period: z.enum(["previous_period", "same_period_last_year"]).optional(),
      baseline: z.date().optional(),
    })
    .optional(),

  // Output options
  format: z.enum(["json", "csv", "chart"]).default("json"),
  aggregation: z
    .enum(["sum", "average", "median", "min", "max"])
    .default("sum"),
});

// Dashboard widget schema
export const DashboardWidgetSchema = z.object({
  id: z.string(),
  type: z.enum([
    "metric_card",
    "line_chart",
    "bar_chart",
    "pie_chart",
    "table",
    "map",
    "funnel",
  ]),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),

  // Data configuration
  dataSource: z.object({
    metric: MetricCategorySchema,
    field: z.string(),
    aggregation: z.enum(["sum", "average", "count", "unique"]),
    timeRange: z.object({
      start: z.date(),
      end: z.date(),
      granularity: TimePeriodSchema,
    }),
    filters: z.record(z.string(), z.any()).optional(),
  }),

  // Display configuration
  display: z.object({
    position: z.object({
      x: z.number().min(0),
      y: z.number().min(0),
      width: z.number().min(1),
      height: z.number().min(1),
    }),
    colors: z.array(z.string()).optional(),
    showLegend: z.boolean().default(true),
    showGrid: z.boolean().default(true),
    targetValue: z.number().optional(), // For goal tracking
  }),

  // Alert configuration
  alerts: z
    .array(
      z.object({
        condition: z.enum(["above", "below", "equals"]),
        threshold: z.number(),
        enabled: z.boolean(),
        recipients: z.array(z.string().email()),
      }),
    )
    .optional(),

  // Access control
  visibility: z.enum(["public", "internal", "restricted"]).default("internal"),
  allowedUsers: z.array(z.string()).optional(),

  // System fields
  createdAt: z.date(),
  updatedAt: z.date(),
  lastDataUpdate: z.date().optional(),
  refreshInterval: z.number().min(60).default(300), // Seconds
});

// Report schema
export const ReportSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  type: z.enum(["automated", "manual", "scheduled"]),

  // Report configuration
  config: z.object({
    metrics: z.array(MetricCategorySchema),
    timeRange: z.object({
      start: z.date(),
      end: z.date(),
      granularity: TimePeriodSchema,
    }),
    comparisons: z
      .array(z.enum(["previous_period", "same_period_last_year"]))
      .optional(),
    segments: z.array(z.string()).optional(),
  }),

  // Scheduling (for automated reports)
  schedule: z
    .object({
      frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
      dayOfWeek: z.number().min(0).max(6).optional(), // For weekly
      dayOfMonth: z.number().min(1).max(31).optional(), // For monthly
      time: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .optional(), // HH:MM
      timezone: z.string().default("Europe/London"),
    })
    .optional(),

  // Distribution
  recipients: z.array(z.string().email()),
  format: z.enum(["pdf", "html", "csv", "json"]).default("pdf"),

  // System fields
  createdAt: z.date(),
  lastGenerated: z.date().optional(),
  nextRun: z.date().optional(),
  status: z.enum(["active", "paused", "error"]).default("active"),
});

// Export types
export type TimePeriod = z.infer<typeof TimePeriodSchema>;
export type MetricCategory = z.infer<typeof MetricCategorySchema>;
export type WebAnalyticsEvent = z.infer<typeof WebAnalyticsEventSchema>;
export type ContentMetrics = z.infer<typeof ContentMetricsSchema>;
export type AudienceMetrics = z.infer<typeof AudienceMetricsSchema>;
export type TechnicalMetrics = z.infer<typeof TechnicalMetricsSchema>;
export type BusinessMetrics = z.infer<typeof BusinessMetricsSchema>;
export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
export type DashboardWidget = z.infer<typeof DashboardWidgetSchema>;
export type Report = z.infer<typeof ReportSchema>;
