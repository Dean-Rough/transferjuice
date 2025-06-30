import { z } from "zod";

/**
 * Environment Variable Validation
 * Validates all environment variables at startup with proper error messages
 */

// Database configuration
const DatabaseConfigSchema = z.object({
  DATABASE_URL: z
    .string()
    .url({ message: "DATABASE_URL must be a valid PostgreSQL connection URL" })
    .refine(
      (url) => url.startsWith("postgresql://") || url.startsWith("postgres://"),
      { message: "DATABASE_URL must be a PostgreSQL connection string" },
    ),
  DATABASE_POOL_SIZE: z.coerce
    .number()
    .min(1, { message: "DATABASE_POOL_SIZE must be at least 1" })
    .max(100, { message: "DATABASE_POOL_SIZE must not exceed 100" })
    .default(10),
  DATABASE_TIMEOUT: z.coerce
    .number()
    .min(1000, { message: "DATABASE_TIMEOUT must be at least 1000ms" })
    .max(60000, { message: "DATABASE_TIMEOUT must not exceed 60000ms" })
    .default(30000),
});

// Twitter API configuration
const TwitterConfigSchema = z.object({
  TWITTER_BEARER_TOKEN: z
    .string()
    .min(1, { message: "TWITTER_BEARER_TOKEN is required" })
    .refine((token) => token.startsWith("AA") || token.startsWith("Bearer "), {
      message: "TWITTER_BEARER_TOKEN appears to be invalid format",
    }),
  TWITTER_API_VERSION: z.enum(["2.0"]).default("2.0"),
  TWITTER_RATE_LIMIT_BUFFER: z.coerce
    .number()
    .min(0, { message: "TWITTER_RATE_LIMIT_BUFFER must be >= 0" })
    .max(0.5, { message: "TWITTER_RATE_LIMIT_BUFFER must be <= 0.5" })
    .default(0.1),
  TWITTER_FETCH_INTERVAL: z.coerce
    .number()
    .min(300, {
      message:
        "TWITTER_FETCH_INTERVAL must be at least 300 seconds (5 minutes)",
    })
    .max(3600, {
      message: "TWITTER_FETCH_INTERVAL must not exceed 3600 seconds (1 hour)",
    })
    .default(900), // 15 minutes
});

// AI service configuration
const AIConfigSchema = z.object({
  OPENAI_API_KEY: z
    .string()
    .min(1, { message: "OPENAI_API_KEY is required" })
    .refine((key) => key.startsWith("sk-"), {
      message: 'OPENAI_API_KEY must start with "sk-"',
    }),
  OPENAI_ORGANIZATION: z
    .string()
    .min(1, { message: "OPENAI_ORGANIZATION is required" })
    .optional(),
  OPENAI_MODEL: z
    .enum(["gpt-4", "gpt-4.5", "gpt-4.1", "gpt-4o"])
    .default("gpt-4.5"),
  OPENAI_TEMPERATURE: z.coerce
    .number()
    .min(0, { message: "OPENAI_TEMPERATURE must be >= 0" })
    .max(2, { message: "OPENAI_TEMPERATURE must be <= 2" })
    .default(0.7),
  OPENAI_MAX_TOKENS: z.coerce
    .number()
    .min(100, { message: "OPENAI_MAX_TOKENS must be at least 100" })
    .max(4000, { message: "OPENAI_MAX_TOKENS must not exceed 4000" })
    .default(2000),

  // Alternative AI providers (optional)
  ANTHROPIC_API_KEY: z
    .string()
    .min(1, { message: "ANTHROPIC_API_KEY must be provided if using Claude" })
    .optional(),
  ANTHROPIC_MODEL: z
    .enum(["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"])
    .default("claude-3-sonnet")
    .optional(),
});

// Email service configuration
const EmailConfigSchema = z.object({
  EMAIL_PROVIDER: z
    .enum(["convertkit", "mailerlite", "postmark", "mock"])
    .default("convertkit"),

  // ConvertKit configuration
  CONVERTKIT_API_KEY: z
    .string()
    .min(1, { message: "CONVERTKIT_API_KEY is required when using ConvertKit" })
    .optional(),
  CONVERTKIT_API_SECRET: z
    .string()
    .min(1, {
      message: "CONVERTKIT_API_SECRET is required when using ConvertKit",
    })
    .optional(),
  CONVERTKIT_FORM_ID: z
    .string()
    .min(1, { message: "CONVERTKIT_FORM_ID is required when using ConvertKit" })
    .optional(),

  // MailerLite configuration
  MAILERLITE_API_KEY: z
    .string()
    .min(1, { message: "MAILERLITE_API_KEY is required when using MailerLite" })
    .optional(),
  MAILERLITE_GROUP_ID: z
    .string()
    .min(1, {
      message: "MAILERLITE_GROUP_ID is required when using MailerLite",
    })
    .optional(),

  // Postmark configuration
  POSTMARK_API_KEY: z
    .string()
    .min(1, { message: "POSTMARK_API_KEY is required when using Postmark" })
    .optional(),
  POSTMARK_FROM_EMAIL: z
    .string()
    .email({ message: "POSTMARK_FROM_EMAIL must be a valid email address" })
    .optional(),

  // Common email settings
  EMAIL_FROM_NAME: z
    .string()
    .min(1, { message: "EMAIL_FROM_NAME is required" })
    .default("Transfer Juice"),
  EMAIL_FROM_EMAIL: z
    .string()
    .email({ message: "EMAIL_FROM_EMAIL must be a valid email address" })
    .default("dean@transferjuice.com"),
  EMAIL_REPLY_TO: z
    .string()
    .email({ message: "EMAIL_REPLY_TO must be a valid email address" })
    .optional(),
});

// Image processing configuration
const ImageConfigSchema = z.object({
  WIKIPEDIA_API_ENDPOINT: z
    .string()
    .url({ message: "WIKIPEDIA_API_ENDPOINT must be a valid URL" })
    .default("https://en.wikipedia.org/api/rest_v1"),
  IMAGE_CDN_URL: z
    .string()
    .url({ message: "IMAGE_CDN_URL must be a valid URL" })
    .optional(),
  IMAGE_OPTIMIZATION_SERVICE: z
    .enum(["vercel", "cloudflare", "custom"])
    .default("vercel"),
  MAX_IMAGE_SIZE: z.coerce
    .number()
    .min(100000, { message: "MAX_IMAGE_SIZE must be at least 100KB" })
    .max(10000000, { message: "MAX_IMAGE_SIZE must not exceed 10MB" })
    .default(2000000), // 2MB
});

// Application configuration
const AppConfigSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  APP_URL: z
    .string()
    .url({ message: "APP_URL must be a valid URL" })
    .default("http://localhost:3000"),
  APP_NAME: z
    .string()
    .min(1, { message: "APP_NAME is required" })
    .default("Transfer Juice"),
  APP_VERSION: z
    .string()
    .min(1, { message: "APP_VERSION is required" })
    .default("1.0.0"),

  // Security settings
  JWT_SECRET: z
    .string()
    .min(32, { message: "JWT_SECRET must be at least 32 characters long" })
    .optional(),
  ENCRYPTION_KEY: z
    .string()
    .min(32, { message: "ENCRYPTION_KEY must be at least 32 characters long" })
    .optional(),

  // Rate limiting
  RATE_LIMIT_WINDOW: z.coerce
    .number()
    .min(60, { message: "RATE_LIMIT_WINDOW must be at least 60 seconds" })
    .max(3600, { message: "RATE_LIMIT_WINDOW must not exceed 3600 seconds" })
    .default(900), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce
    .number()
    .min(10, { message: "RATE_LIMIT_MAX_REQUESTS must be at least 10" })
    .max(10000, { message: "RATE_LIMIT_MAX_REQUESTS must not exceed 10000" })
    .default(100),
});

// Analytics and monitoring configuration
const MonitoringConfigSchema = z.object({
  // Analytics services
  GOOGLE_ANALYTICS_ID: z
    .string()
    .regex(/^G-[A-Z0-9]+$/, {
      message: "GOOGLE_ANALYTICS_ID must be in format G-XXXXXXXXXX",
    })
    .optional(),
  PLAUSIBLE_DOMAIN: z
    .string()
    .min(1, { message: "PLAUSIBLE_DOMAIN must be provided if using Plausible" })
    .optional(),

  // Error tracking
  SENTRY_DSN: z
    .string()
    .url({ message: "SENTRY_DSN must be a valid URL" })
    .optional(),
  SENTRY_ENVIRONMENT: z
    .string()
    .min(1, { message: "SENTRY_ENVIRONMENT is required when using Sentry" })
    .optional(),

  // Performance monitoring
  VERCEL_ANALYTICS: z.coerce.boolean().default(false),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  // Health checks
  HEALTH_CHECK_TOKEN: z
    .string()
    .min(32, {
      message: "HEALTH_CHECK_TOKEN must be at least 32 characters long",
    })
    .optional(),
});

// Development and testing configuration
const DevConfigSchema = z.object({
  // Development flags
  ENABLE_API_DOCS: z.coerce.boolean().default(false),
  ENABLE_DEBUG_ROUTES: z.coerce.boolean().default(false),
  MOCK_EXTERNAL_APIS: z.coerce.boolean().default(false),

  // Testing configuration
  TEST_DATABASE_URL: z
    .string()
    .url({
      message: "TEST_DATABASE_URL must be a valid PostgreSQL connection URL",
    })
    .optional(),
  TEST_EMAIL_PROVIDER: z.enum(["mock", "mailtrap", "test"]).default("mock"),
  SEED_DATA_ENABLED: z.coerce.boolean().default(false),
});

// Webhook configuration
const WebhookConfigSchema = z.object({
  WEBHOOK_SECRET: z
    .string()
    .min(32, { message: "WEBHOOK_SECRET must be at least 32 characters long" })
    .optional(),
  WEBHOOK_TIMEOUT: z.coerce
    .number()
    .min(1000, { message: "WEBHOOK_TIMEOUT must be at least 1000ms" })
    .max(30000, { message: "WEBHOOK_TIMEOUT must not exceed 30000ms" })
    .default(10000),
  WEBHOOK_RETRY_ATTEMPTS: z.coerce
    .number()
    .min(0, { message: "WEBHOOK_RETRY_ATTEMPTS must be >= 0" })
    .max(5, { message: "WEBHOOK_RETRY_ATTEMPTS must not exceed 5" })
    .default(3),
});

// Complete environment schema
export const EnvironmentSchema = z
  .object({
    ...DatabaseConfigSchema.shape,
    ...TwitterConfigSchema.shape,
    ...AIConfigSchema.shape,
    ...EmailConfigSchema.shape,
    ...ImageConfigSchema.shape,
    ...AppConfigSchema.shape,
    ...MonitoringConfigSchema.shape,
    ...DevConfigSchema.shape,
    ...WebhookConfigSchema.shape,
  })
  .superRefine((data, ctx) => {
    // Cross-field validation

    // Email provider validation (skip validation for mock)
    if (data.EMAIL_PROVIDER === "convertkit") {
      if (!data.CONVERTKIT_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'CONVERTKIT_API_KEY is required when EMAIL_PROVIDER is "convertkit"',
          path: ["CONVERTKIT_API_KEY"],
        });
      }
      if (!data.CONVERTKIT_API_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'CONVERTKIT_API_SECRET is required when EMAIL_PROVIDER is "convertkit"',
          path: ["CONVERTKIT_API_SECRET"],
        });
      }
    }

    if (data.EMAIL_PROVIDER === "mailerlite" && !data.MAILERLITE_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'MAILERLITE_API_KEY is required when EMAIL_PROVIDER is "mailerlite"',
        path: ["MAILERLITE_API_KEY"],
      });
    }

    if (data.EMAIL_PROVIDER === "postmark") {
      if (!data.POSTMARK_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'POSTMARK_API_KEY is required when EMAIL_PROVIDER is "postmark"',
          path: ["POSTMARK_API_KEY"],
        });
      }
      if (!data.POSTMARK_FROM_EMAIL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'POSTMARK_FROM_EMAIL is required when EMAIL_PROVIDER is "postmark"',
          path: ["POSTMARK_FROM_EMAIL"],
        });
      }
    }

    // Production environment validation
    if (data.NODE_ENV === "production") {
      const requiredInProduction = [
        "JWT_SECRET",
        "ENCRYPTION_KEY",
        "HEALTH_CHECK_TOKEN",
      ];

      requiredInProduction.forEach((field) => {
        if (!data[field as keyof typeof data]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${field} is required in production environment`,
            path: [field],
          });
        }
      });

      // Security checks for production
      if (data.ENABLE_DEBUG_ROUTES) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ENABLE_DEBUG_ROUTES must be false in production",
          path: ["ENABLE_DEBUG_ROUTES"],
        });
      }

      if (data.MOCK_EXTERNAL_APIS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "MOCK_EXTERNAL_APIS must be false in production",
          path: ["MOCK_EXTERNAL_APIS"],
        });
      }
    }

    // Development environment checks
    if (data.NODE_ENV === "development") {
      // Warn about missing optional services in development
      if (!data.SENTRY_DSN) {
        console.warn("SENTRY_DSN is not set - error tracking will be disabled");
      }
      if (!data.GOOGLE_ANALYTICS_ID && !data.PLAUSIBLE_DOMAIN) {
        console.warn(
          "No analytics service configured - analytics will be disabled",
        );
      }
    }
  });

// Environment validation utility
export function validateEnvironment(): z.infer<typeof EnvironmentSchema> {
  try {
    return EnvironmentSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment validation failed:");
      console.error("");

      error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        console.error(`  ${path}: ${issue.message}`);
      });

      console.error("");
      console.error("Please check your environment variables and try again.");
      console.error("See .env.example for required variables.");

      process.exit(1);
    }
    throw error;
  }
}

// Environment variable getter with validation
export function getEnv<K extends keyof z.infer<typeof EnvironmentSchema>>(
  key: K,
): z.infer<typeof EnvironmentSchema>[K] {
  const env = validateEnvironment();
  return env[key];
}

// Check if we're in a specific environment
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

export function isTest(): boolean {
  return process.env.NODE_ENV === "test";
}

// Service availability checks
export function hasEmailService(): boolean {
  const provider = process.env.EMAIL_PROVIDER;

  switch (provider) {
    case "convertkit":
      return !!(
        process.env.CONVERTKIT_API_KEY && process.env.CONVERTKIT_API_SECRET
      );
    case "mailerlite":
      return !!process.env.MAILERLITE_API_KEY;
    case "postmark":
      return !!(
        process.env.POSTMARK_API_KEY && process.env.POSTMARK_FROM_EMAIL
      );
    default:
      return false;
  }
}

export function hasAnalytics(): boolean {
  return !!(process.env.GOOGLE_ANALYTICS_ID || process.env.PLAUSIBLE_DOMAIN);
}

export function hasErrorTracking(): boolean {
  return !!process.env.SENTRY_DSN;
}

export function hasImageService(): boolean {
  return !!process.env.IMAGE_CDN_URL;
}

// Export types
export type Environment = z.infer<typeof EnvironmentSchema>;
export type EnvironmentKey = keyof Environment;
