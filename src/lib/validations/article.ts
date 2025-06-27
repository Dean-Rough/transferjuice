import { z } from "zod";

/**
 * Article and Content Schemas
 * Validates AI-generated content and article structures
 */

// Briefing types
export const BriefingTypeSchema = z.enum(["morning", "afternoon", "evening"]);

// Article status
export const ArticleStatusSchema = z.enum([
  "draft",
  "ai_generated",
  "under_review",
  "approved",
  "published",
  "archived",
]);

// Content quality metrics (The Terry Standard)
export const ContentQualitySchema = z.object({
  grammarScore: z.number().min(0).max(100),
  readabilityScore: z.number().min(0).max(100),
  brandVoiceScore: z.number().min(0).max(100), // How Terry-esque is it?
  factualAccuracy: z.number().min(0).max(100),
  engagementPotential: z.number().min(0).max(100),
  snarkLevel: z.number().min(0).max(100), // Weaponised irritation coefficient
  specificityScore: z.number().min(0).max(100), // Absurd detail density
  emotionalIntelligence: z.number().min(0).max(100), // Smart chaos factor
  overallScore: z.number().min(0).max(100),
  flags: z.array(
    z.enum([
      "grammar_issues",
      "readability_low",
      "off_brand", // Not Terry enough
      "too_corporate", // Sounds like a press release
      "lacks_snark", // Insufficiently weaponised irritation
      "too_generic", // Needs more wet pasta and sad Babybels
      "fact_check_needed",
      "inappropriate_content",
      "copyright_concern",
    ]),
  ),
  humanReviewRequired: z.boolean(),
});

// Image schema for articles
export const ArticleImageSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  altText: z.string().min(1).max(255),
  caption: z.string().optional(),
  source: z.enum(["twitter", "wikipedia", "upload", "stock"]),
  sourceUrl: z.string().url().optional(),
  attribution: z.string().optional(),
  dimensions: z.object({
    width: z.number().min(1),
    height: z.number().min(1),
  }),
  fileSize: z.number().min(1), // bytes
  format: z.enum(["jpg", "jpeg", "png", "webp", "gif"]),
  optimizedUrls: z
    .object({
      thumbnail: z.string().url(),
      medium: z.string().url(),
      large: z.string().url(),
    })
    .optional(),
});

// AI Generation metadata
export const AIGenerationSchema = z.object({
  model: z.string(),
  prompt: z.string(),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1),
  generatedAt: z.date(),
  processingTime: z.number().min(0), // milliseconds
  tokenUsage: z.object({
    promptTokens: z.number().min(0),
    completionTokens: z.number().min(0),
    totalTokens: z.number().min(0),
  }),
  qualityChecks: z.object({
    passedAllChecks: z.boolean(),
    contentFilter: z.boolean(),
    brandVoiceCheck: z.boolean(),
    factualityCheck: z.boolean(),
    grammarCheck: z.boolean(),
  }),
});

// Source tweet reference
export const SourceTweetRefSchema = z.object({
  tweetId: z.string(),
  authorHandle: z.string(),
  relevanceScore: z.number().min(0).max(1),
  usedInSections: z.array(z.string()),
  quotedDirectly: z.boolean(),
});

// Article section schema
export const ArticleSectionSchema = z.object({
  id: z.string(),
  type: z.enum(["intro", "news_item", "analysis", "roundup", "conclusion"]),
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1),
  sourceTweets: z.array(SourceTweetRefSchema),
  images: z.array(ArticleImageSchema).optional(),
  order: z.number().min(0),
  wordCount: z.number().min(0),
});

// Main article schema
export const ArticleSchema = z.object({
  id: z.string(),
  title: z.string().min(10).max(255),
  subtitle: z.string().min(10).max(500).optional(),
  briefingType: BriefingTypeSchema,
  status: ArticleStatusSchema,

  // Content structure
  sections: z.array(ArticleSectionSchema).min(1),
  summary: z.string().min(50).max(1000),

  // Metadata
  publishedAt: z.date().optional(),
  scheduledFor: z.date().optional(),
  lastModified: z.date(),

  // AI generation details
  aiGeneration: AIGenerationSchema.optional(),

  // Quality assessment
  quality: ContentQualitySchema,

  // Source attribution
  sourceTweets: z.array(z.string()), // Tweet IDs
  totalSourceTweets: z.number().min(0),

  // Images
  featuredImage: ArticleImageSchema.optional(),

  // SEO and sharing
  slug: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9-]+$/),
  metaDescription: z.string().min(50).max(160),
  tags: z.array(z.string()).max(10),

  // Analytics
  estimatedReadTime: z.number().min(1), // minutes
  wordCount: z.number().min(100),

  // Editorial workflow
  reviewer: z.string().optional(),
  reviewNotes: z.string().optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.date().optional(),

  // Email campaign integration
  emailSubject: z.string().min(10).max(100).optional(),
  emailPreview: z.string().min(20).max(200).optional(),
  sentToSubscribers: z.boolean().default(false),
  sentAt: z.date().optional(),
});

// Article creation input schema
export const CreateArticleSchema = ArticleSchema.omit({
  id: true,
  lastModified: true,
  wordCount: true,
  estimatedReadTime: true,
}).extend({
  autoGenerateSlug: z.boolean().default(true),
});

// Article update schema
export const UpdateArticleSchema = ArticleSchema.partial()
  .omit({
    id: true,
  })
  .extend({
    lastModified: z.date(),
  });

// Article query filters
export const ArticleQueryFiltersSchema = z.object({
  briefingType: BriefingTypeSchema.optional(),
  status: ArticleStatusSchema.optional(),
  publishedAfter: z.date().optional(),
  publishedBefore: z.date().optional(),
  tags: z.array(z.string()).optional(),
  searchQuery: z.string().optional(),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
  orderBy: z
    .enum(["publishedAt", "lastModified", "title", "quality"])
    .default("publishedAt"),
  orderDirection: z.enum(["asc", "desc"]).default("desc"),
});

// Content generation request schema
export const ContentGenerationRequestSchema = z.object({
  briefingType: BriefingTypeSchema,
  sourceTweetIds: z.array(z.string()).min(1).max(50),
  targetWordCount: z.number().min(200).max(2000).default(800),
  tone: z
    .enum(["witty", "sarcastic", "informative", "humorous"])
    .default("witty"),
  includeImages: z.boolean().default(true),
  priorityTopics: z.array(z.string()).optional(),
  excludeTopics: z.array(z.string()).optional(),
  customInstructions: z.string().optional(),
});

// Content validation result schema
export const ContentValidationResultSchema = z.object({
  isValid: z.boolean(),
  quality: ContentQualitySchema,
  recommendations: z.array(
    z.object({
      type: z.enum([
        "grammar",
        "style",
        "fact_check",
        "brand_voice",
        "readability",
      ]),
      severity: z.enum(["low", "medium", "high", "critical"]),
      message: z.string(),
      suggestion: z.string().optional(),
      affectedText: z.string().optional(),
    }),
  ),
  requiresHumanReview: z.boolean(),
  autoApprovalEligible: z.boolean(),
});

// Export types
export type BriefingType = z.infer<typeof BriefingTypeSchema>;
export type ArticleStatus = z.infer<typeof ArticleStatusSchema>;
export type ContentQuality = z.infer<typeof ContentQualitySchema>;
export type ArticleImage = z.infer<typeof ArticleImageSchema>;
export type AIGeneration = z.infer<typeof AIGenerationSchema>;
export type SourceTweetRef = z.infer<typeof SourceTweetRefSchema>;
export type ArticleSection = z.infer<typeof ArticleSectionSchema>;
export type Article = z.infer<typeof ArticleSchema>;
export type CreateArticle = z.infer<typeof CreateArticleSchema>;
export type UpdateArticle = z.infer<typeof UpdateArticleSchema>;
export type ArticleQueryFilters = z.infer<typeof ArticleQueryFiltersSchema>;
export type ContentGenerationRequest = z.infer<
  typeof ContentGenerationRequestSchema
>;
export type ContentValidationResult = z.infer<
  typeof ContentValidationResultSchema
>;
