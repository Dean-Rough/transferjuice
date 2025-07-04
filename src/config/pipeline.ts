/**
 * Transfer Juice Pipeline Configuration
 * Centralized configuration for all data processing pipeline components
 */

import { z } from "zod";

// Environment variable validation schema
const EnvironmentConfigSchema = z.object({
  // Core Services
  DATABASE_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
  TWITTER_BEARER_TOKEN: z.string().min(1),

  // Playwright Scraping
  USE_PLAYWRIGHT_SCRAPER: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  USE_SCRAPER_MANAGER: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  PLAYWRIGHT_HEADLESS: z
    .string()
    .transform((val) => val === "true")
    .default("true"),
  SCRAPER_MANAGER_INSTANCES: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(10))
    .default("3"),
  DEBUG_SCREENSHOTS: z
    .string()
    .transform((val) => val === "true")
    .default("false"),

  // Proxy Configuration
  PROXY_SERVER: z.string().optional(),
  PROXY_USERNAME: z.string().optional(),
  PROXY_PASSWORD: z.string().optional(),
  PROXY_LIST: z.string().optional(),

  // Quality Thresholds
  TERRY_VOICE_THRESHOLD: z
    .string()
    .transform(Number)
    .pipe(z.number().min(0).max(1))
    .default("0.90"),
  QUALITY_VALIDATION_THRESHOLD: z
    .string()
    .transform(Number)
    .pipe(z.number().min(0).max(1))
    .default("0.85"),
  HUMAN_REVIEW_THRESHOLD: z
    .string()
    .transform(Number)
    .pipe(z.number().min(0).max(1))
    .default("0.75"),

  // Performance Settings
  PROCESSING_TIMEOUT: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1000))
    .default("10000"),
  CACHE_TTL: z
    .string()
    .transform(Number)
    .pipe(z.number().min(60))
    .default("3600"),
  WEBSOCKET_HEARTBEAT: z
    .string()
    .transform(Number)
    .pipe(z.number().min(5000))
    .default("30000"),

  // Content Mixing
  QUIET_PERIOD_THRESHOLD: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1))
    .default("3"),
  PARTNER_CONTENT_RATIO: z
    .string()
    .transform(Number)
    .pipe(z.number().min(0).max(1))
    .default("0.25"),
  ATTRIBUTION_BACKLINK_REQUIRED: z
    .string()
    .transform((val) => val === "true")
    .default("true"),

  // Optional Development Settings
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;

// Validate environment variables at startup
export const ENV = EnvironmentConfigSchema.parse(process.env);

// Global ITK Sources Configuration
export const GLOBAL_ITK_SOURCES = {
  tier1: [
    {
      handle: "FabrizioRomano",
      name: "Fabrizio Romano",
      region: "GLOBAL",
      reliability: 0.95,
    },
    {
      handle: "David_Ornstein",
      name: "David Ornstein",
      region: "UK",
      reliability: 0.92,
    },
    {
      handle: "Gianluca_DiMarzio",
      name: "Gianluca Di Marzio",
      region: "IT",
      reliability: 0.88,
    },
  ],
  tier2: [
    { handle: "Marca", name: "Marca", region: "ES", reliability: 0.82 },
    {
      handle: "AS_English",
      name: "AS English",
      region: "ES",
      reliability: 0.8,
    },
    { handle: "lequipe", name: "L'Équipe", region: "FR", reliability: 0.85 },
    {
      handle: "SkySportsNews",
      name: "Sky Sports News",
      region: "UK",
      reliability: 0.83,
    },
  ],
  regional: [
    {
      handle: "ESPNBrasil",
      name: "ESPN Brasil",
      region: "BR",
      reliability: 0.78,
    },
    {
      handle: "SkySportDE",
      name: "Sky Sport DE",
      region: "DE",
      reliability: 0.75,
    },
    {
      handle: "CalcioMercato",
      name: "Calciomercato",
      region: "IT",
      reliability: 0.72,
    },
    {
      handle: "FootMercato",
      name: "Foot Mercato",
      region: "FR",
      reliability: 0.7,
    },
  ],
} as const;

// Transfer Keywords by Language
export const TRANSFER_KEYWORDS = {
  english: [
    "signing",
    "deal",
    "medical",
    "personal terms",
    "contract",
    "bid",
    "fee",
    "agreement",
    "move",
    "join",
  ],
  spanish: [
    "fichaje",
    "traspaso",
    "acuerdo",
    "cesión",
    "contrato",
    "oferta",
    "clausula",
  ],
  italian: [
    "trasferimento",
    "cessione",
    "prestito",
    "riscatto",
    "contratto",
    "offerta",
  ],
  french: ["transfert", "prêt", "rachat", "signature", "contrat", "offre"],
  german: [
    "Wechsel",
    "Transfer",
    "Leihe",
    "Verpflichtung",
    "Vertrag",
    "Angebot",
  ],
} as const;

// Content Partner Configuration
export const CONTENT_PARTNERS = {
  theUpshot: {
    name: "The Upshot",
    rssUrl: "https://theupshot.com/rss",
    categories: ["player-antics", "off-pitch-drama", "social-media-chaos"],
    attribution: "The brilliant minds at The Upshot spotted this gem...",
    trustScore: 0.85,
    backlinksRequired: true,
  },
  fourFourTwo: {
    name: "FourFourTwo",
    rssUrl: "https://www.fourfourtwo.com/rss",
    categories: [
      "historical-chaos",
      "tactical-deep-dives",
      "transfer-retrospectives",
    ],
    attribution: "FourFourTwo's archive diving uncovered...",
    trustScore: 0.9,
    backlinksRequired: true,
  },
  footballRamble: {
    name: "Football Ramble",
    rssUrl: "https://www.footballramble.com/rss",
    categories: ["weekly-mishaps", "manager-meltdowns", "comedy-gold"],
    attribution: "The Football Ramble lads captured this perfectly...",
    trustScore: 0.8,
    backlinksRequired: true,
  },
  theAthletic: {
    name: "The Athletic",
    rssUrl: "https://theathletic.com/rss",
    categories: ["deep-analysis", "insider-reports", "tactical-breakdowns"],
    attribution: "The Athletic provided excellent context...",
    trustScore: 0.95,
    backlinksRequired: true,
  },
} as const;

// Pipeline Processing Configuration
export const PIPELINE_CONFIG = {
  monitoring: {
    frequency: "0 * * * *", // Every hour (cron format)
    sources: GLOBAL_ITK_SOURCES,
    timeout: 300000, // 5 minutes max per monitoring cycle
    retryAttempts: 3,
    retryDelay: 5000, // 5 seconds
  },

  scraping: {
    enabled: ENV.USE_PLAYWRIGHT_SCRAPER || ENV.USE_SCRAPER_MANAGER,
    manager: {
      enabled: ENV.USE_SCRAPER_MANAGER,
      instances: ENV.SCRAPER_MANAGER_INSTANCES,
      rotationInterval: 3600000, // 1 hour
      requestTimeout: 30000, // 30 seconds
      maxRequestsPerInstance: 100,
    },
    playwright: {
      headless: ENV.PLAYWRIGHT_HEADLESS,
      antiDetection: true,
      sessionRotation: true,
      userAgentRotation: true,
      debugScreenshots: ENV.DEBUG_SCREENSHOTS,
    },
    proxy: {
      enabled: !!ENV.PROXY_SERVER,
      server: ENV.PROXY_SERVER,
      username: ENV.PROXY_USERNAME,
      password: ENV.PROXY_PASSWORD,
      rotationStrategy: "performance" as const,
    },
    cache: {
      enabled: true,
      ttl: 300000, // 5 minutes
      maxSize: 1000,
      warmupSources: ["FabrizioRomano", "David_Ornstein"],
    },
    rateLimit: {
      requestsPerMinute: 30,
      requestsPerHour: 500,
      delayBetweenRequests: 2000, // 2 seconds
    },
  },

  processing: {
    aiModel: "gpt-4.1",
    maxTokens: 4000,
    temperature: 0.7,
    parallelProcessing: true,
    batchSize: 10, // Process tweets in batches
    maxConcurrency: 5, // Max parallel AI requests
  },

  quality: {
    thresholds: {
      terryVoice: ENV.TERRY_VOICE_THRESHOLD,
      factualAccuracy: 0.85,
      contentSafety: 0.95,
      legalCompliance: 0.9,
      editorialQuality: 0.8,
      accessibility: 0.85,
    },
    humanReviewTrigger: ENV.HUMAN_REVIEW_THRESHOLD,
    autoPublishThreshold: ENV.QUALITY_VALIDATION_THRESHOLD,
    maxReviewTime: 1800000, // 30 minutes
  },

  performance: {
    maxProcessingTime: ENV.PROCESSING_TIMEOUT,
    cacheEnabled: true,
    cacheTTL: ENV.CACHE_TTL,
    websocketHeartbeat: ENV.WEBSOCKET_HEARTBEAT,
    memoryLimit: 104857600, // 100MB
    optimisticUIUpdates: true,
  },

  contentMixing: {
    quietPeriodThreshold: ENV.QUIET_PERIOD_THRESHOLD,
    quietPeriodDuration: 7200000, // 2 hours in milliseconds
    maxPartnerContentRatio: ENV.PARTNER_CONTENT_RATIO,
    attributionRequired: ENV.ATTRIBUTION_BACKLINK_REQUIRED,
    partnerSources: CONTENT_PARTNERS,
    emergencyContentEnabled: true,
  },

  realtime: {
    websocketPort: 3001,
    maxConnections: 10000,
    heartbeatInterval: ENV.WEBSOCKET_HEARTBEAT,
    reconnectAttempts: 5,
    reconnectDelay: 2000,
  },
} as const;

// AI Model Configuration
export const AI_CONFIG = {
  openai: {
    apiKey: ENV.OPENAI_API_KEY,
    model: "gpt-4.1",
    maxTokens: 4000,
    temperature: 0.7,
    timeout: 30000, // 30 seconds
  },

  prompts: {
    terry: {
      systemPrompt: `You are The Terry, a brilliantly acerbic football journalist with a gift for weaponised irritation and emotional intelligence. Write in Joel Golby's distinctive style.

VOICE CHARACTERISTICS:
- Acerbic, funny, witty, overstimulated but emotionally intelligent
- Weaponised irritation paired with genuine insight
- Parenthetical asides that add humor and context
- Specific, absurd details that illuminate larger truths
- Mix of chaos and competence

TRANSFER JUICE STYLE:
- Sharp, funny observations about football's financial madness
- Empathy for fans caught in the middle of corporate games
- Celebration of genuine football moments amid the chaos
- Terry-level specificity about absurd details`,

      maxLength: 300, // words
      voiceConsistencyThreshold: ENV.TERRY_VOICE_THRESHOLD,
    },

    classification: {
      transferTypes: [
        "RUMOUR",
        "TALKS",
        "ADVANCED",
        "MEDICAL",
        "CONFIRMED",
        "OFFICIAL",
      ],
      priorityLevels: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      confidenceThreshold: 0.7,
    },

    quality: {
      factualAccuracyPrompt:
        "Check this transfer article for factual accuracy, focusing on transfer fees, player/club names, timeline consistency, and contradictory statements.",
      brandVoicePrompt:
        "Evaluate this content for Terry/Joel Golby brand voice consistency, looking for acerbic wit, parenthetical asides, and emotional intelligence.",
      safetyPrompt:
        "Check content for safety issues including discriminatory language, potential legal issues, inappropriate content, and harmful misinformation.",
    },
  },
} as const;

// Database Configuration
export const DATABASE_CONFIG = {
  url: ENV.DATABASE_URL,
  pooling: {
    maxConnections: 20,
    minConnections: 2,
    connectionTimeout: 10000,
    idleTimeout: 30000,
  },
  monitoring: {
    slowQueryThreshold: 1000, // 1 second
    logQueries: ENV.NODE_ENV === "development",
    enableMetrics: true,
  },
} as const;

// Monitoring & Alerting Configuration
export const MONITORING_CONFIG = {
  healthChecks: {
    interval: 30000, // 30 seconds
    timeout: 5000, // 5 seconds
    endpoints: [
      "/api/health",
      "/api/health/database",
      "/api/health/ai",
      "/api/health/twitter",
      "/api/health/scraping",
    ],
  },

  scrapingMonitor: {
    enabled: ENV.USE_PLAYWRIGHT_SCRAPER || ENV.USE_SCRAPER_MANAGER,
    checkInterval: 60000, // 1 minute
    alertThresholds: {
      successRate: 0.8,
      responseTime: 10000, // 10 seconds
      memoryUsage: 500 * 1024 * 1024, // 500MB
      validationErrors: 10,
    },
    persistMetrics: true,
  },

  alerts: {
    pipelineFailureThreshold: 0.01, // 1% error rate
    sourceUnavailableThreshold: 0.2, // 20% sources down
    qualityDegradationThreshold: 0.8, // 80% content passing
    performanceThreshold: 10000, // 10 second processing
    websocketFailureThreshold: 0.05, // 5% disconnections
    scrapingFailureThreshold: 0.2, // 20% scraping failures
    proxyHealthThreshold: 0.5, // 50% proxies must be healthy
  },

  metrics: {
    retentionPeriod: 2592000000, // 30 days in milliseconds
    aggregationIntervals: ["1m", "5m", "1h", "1d"],
    exportEnabled: true,
  },
} as const;

// Logging Configuration
export const LOGGING_CONFIG = {
  level: ENV.LOG_LEVEL,
  format: ENV.NODE_ENV === "production" ? "json" : "pretty",
  enableConsole: true,
  enableFile: ENV.NODE_ENV === "production",
  enableRemote: ENV.NODE_ENV === "production",

  contexts: {
    pipeline: true,
    ai: true,
    database: true,
    api: true,
    websocket: true,
  },

  performance: {
    trackExecutionTime: true,
    trackMemoryUsage: true,
    trackCacheHitRates: true,
  },
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  rateLimit: {
    windowMs: 900000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
  },

  cors: {
    origin:
      ENV.NODE_ENV === "production" ? ["https://transferjuice.com"] : true,
    credentials: true,
  },

  contentSecurity: {
    enableModeration: true,
    flaggedContentAction: "review", // 'review' | 'reject' | 'warn'
    autoRejectThreshold: 0.95,
  },
} as const;

// Export typed configuration object
export const CONFIG = {
  env: ENV,
  pipeline: PIPELINE_CONFIG,
  ai: AI_CONFIG,
  database: DATABASE_CONFIG,
  monitoring: MONITORING_CONFIG,
  logging: LOGGING_CONFIG,
  security: SECURITY_CONFIG,
  sources: GLOBAL_ITK_SOURCES,
  partners: CONTENT_PARTNERS,
  keywords: TRANSFER_KEYWORDS,
} as const;

// Configuration validation function
export function validateConfiguration(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    // Validate environment variables
    EnvironmentConfigSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(
        ...error.issues.map(
          (issue) => `Environment: ${issue.path.join(".")} - ${issue.message}`,
        ),
      );
    }
  }

  // Validate AI configuration
  if (!CONFIG.ai.openai.apiKey.startsWith("sk-")) {
    errors.push("AI: Invalid OpenAI API key format");
  }

  // Validate database URL
  if (!CONFIG.database.url.startsWith("postgresql://")) {
    errors.push("Database: Invalid PostgreSQL connection string");
  }

  // Validate Twitter token (only if not using scrapers)
  if (!ENV.USE_PLAYWRIGHT_SCRAPER && !ENV.USE_SCRAPER_MANAGER) {
    if (!ENV.TWITTER_BEARER_TOKEN.startsWith("AAAA")) {
      errors.push("Twitter: Invalid Bearer Token format");
    }
  }

  // Validate scraping configuration
  if (ENV.USE_SCRAPER_MANAGER && ENV.SCRAPER_MANAGER_INSTANCES < 1) {
    errors.push("Scraping: Invalid number of scraper instances");
  }

  // Validate proxy configuration
  if (ENV.PROXY_SERVER && (!ENV.PROXY_USERNAME || !ENV.PROXY_PASSWORD)) {
    errors.push("Proxy: Server specified but credentials missing");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Development helper to print configuration
export function printConfiguration() {
  if (ENV.NODE_ENV === "development") {
    console.log("🔧 Transfer Juice Pipeline Configuration:");
    console.log(`   Environment: ${ENV.NODE_ENV}`);
    console.log(`   Log Level: ${CONFIG.logging.level}`);
    console.log(
      `   Terry Voice Threshold: ${CONFIG.pipeline.quality.thresholds.terryVoice}`,
    );
    console.log(
      `   Quality Threshold: ${CONFIG.pipeline.quality.autoPublishThreshold}`,
    );
    console.log(
      `   Processing Timeout: ${CONFIG.pipeline.performance.maxProcessingTime}ms`,
    );
    console.log(
      `   ITK Sources: ${Object.values(CONFIG.sources).flat().length} total`,
    );
    console.log(
      `   Partner Sources: ${Object.keys(CONFIG.partners).length} partners`,
    );
    console.log(`   Cache TTL: ${CONFIG.pipeline.performance.cacheTTL}s`);
    console.log(
      `   Scraping: ${CONFIG.pipeline.scraping.enabled ? "Enabled" : "Disabled"}`,
    );
    if (CONFIG.pipeline.scraping.enabled) {
      console.log(
        `   Scraper Manager: ${CONFIG.pipeline.scraping.manager.enabled ? `${CONFIG.pipeline.scraping.manager.instances} instances` : "Disabled"}`,
      );
      console.log(
        `   Proxy: ${CONFIG.pipeline.scraping.proxy.enabled ? "Configured" : "Direct connection"}`,
      );
    }
  }
}

// Configuration type exports for use in other modules
export type PipelineConfig = typeof PIPELINE_CONFIG;
export type AIConfig = typeof AI_CONFIG;
export type MonitoringConfig = typeof MONITORING_CONFIG;
export type SecurityConfig = typeof SECURITY_CONFIG;
