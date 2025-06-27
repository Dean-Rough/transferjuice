/**
 * AI Content Analyzer
 * Advanced NLP processing for tweet analysis and content classification
 */

// TODO: Fix circular dependency with terry-style
// import { applyTerryStyle } from '@/lib/terry-style';
import OpenAI from "openai";
import { z } from "zod";

// Analysis result schemas
export const EntityExtractionSchema = z.object({
  players: z.array(
    z.object({
      name: z.string(),
      confidence: z.number().min(0).max(1),
      position: z.string().optional(),
      currentClub: z.string().optional(),
      nationality: z.string().optional(),
    }),
  ),
  clubs: z.array(
    z.object({
      name: z.string(),
      confidence: z.number().min(0).max(1),
      league: z.string().optional(),
      country: z.string().optional(),
    }),
  ),
  transferDetails: z.array(
    z.object({
      type: z.enum(["fee", "contract_length", "wage", "agent", "medical_date"]),
      value: z.string(),
      confidence: z.number().min(0).max(1),
    }),
  ),
  agents: z.array(
    z.object({
      name: z.string().optional(),
      company: z.string().optional(),
      confidence: z.number().min(0).max(1),
    }),
  ),
});

export const SentimentAnalysisSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  confidence: z.number().min(0).max(1),
  emotions: z.array(
    z.enum([
      "excitement",
      "disappointment",
      "skepticism",
      "optimism",
      "anxiety",
    ]),
  ),
  reliability: z.number().min(0).max(1), // How reliable the source seems
  urgency: z.number().min(0).max(1), // How urgent/breaking the news is
});

export const ContentClassificationSchema = z.object({
  isTransferRelated: z.boolean(),
  transferType: z
    .enum(["RUMOUR", "TALKS", "ADVANCED", "MEDICAL", "CONFIRMED", "OFFICIAL"])
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  confidence: z.number().min(0).max(1),
  categories: z.array(
    z.enum([
      "signing",
      "departure",
      "contract_extension",
      "loan",
      "medical",
      "negotiation",
      "rumour",
      "denial",
      "agent_talk",
      "fee_discussion",
    ]),
  ),
  keyPoints: z.array(z.string()),
  duplicateOf: z.string().optional(), // ID of original tweet if this is duplicate
});

export const ContentAnalysisSchema = z.object({
  tweetId: z.string().optional(), // Add optional tweetId for image placement
  classification: ContentClassificationSchema,
  entities: EntityExtractionSchema,
  sentiment: SentimentAnalysisSchema,
  qualityScore: z.number().min(0).max(100),
  terryCompatibility: z.number().min(0).max(100), // How well it fits Terry's style
  processingTime: z.number(),
  aiModel: z.string(),
});

export type EntityExtraction = z.infer<typeof EntityExtractionSchema>;
export type SentimentAnalysis = z.infer<typeof SentimentAnalysisSchema>;
export type ContentClassification = z.infer<typeof ContentClassificationSchema>;
export type ContentAnalysis = z.infer<typeof ContentAnalysisSchema>;

interface AnalyzerConfig {
  openaiApiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  enableCaching?: boolean;
}

export interface TweetInput {
  id: string;
  text: string;
  authorHandle: string;
  authorName: string;
  authorVerified: boolean;
  authorTier: "tier1" | "tier2" | "tier3";
  createdAt: Date;
  metrics: {
    retweets: number;
    likes: number;
    replies: number;
    quotes: number;
  };
  context?: {
    recentTweets?: string[];
    authorSpecialties?: string[];
  };
}

export class AIContentAnalyzer {
  private openai: OpenAI;
  private config: Required<AnalyzerConfig>;
  private cache: Map<string, ContentAnalysis> = new Map();

  constructor(config: AnalyzerConfig) {
    this.config = {
      model: "gpt-4.1",
      maxTokens: 1500,
      temperature: 0.3,
      enableCaching: true,
      ...config,
    };

    this.openai = new OpenAI({
      apiKey: this.config.openaiApiKey,
    });
  }

  /**
   * Perform comprehensive analysis of tweet content
   */
  async analyzeTweet(input: TweetInput): Promise<ContentAnalysis> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.generateCacheKey(input);
    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return { ...cached, processingTime: Date.now() - startTime };
    }

    try {
      // Run all analyses in parallel for efficiency
      const [classification, entities, sentiment] = await Promise.all([
        this.classifyContent(input),
        this.extractEntities(input),
        this.analyzeSentiment(input),
      ]);

      // Calculate quality scores
      const qualityScore = this.calculateQualityScore(
        classification,
        entities,
        sentiment,
        input,
      );
      const terryCompatibility = this.calculateTerryCompatibility(
        input,
        sentiment,
        entities,
      );

      const analysis: ContentAnalysis = {
        classification,
        entities,
        sentiment,
        qualityScore,
        terryCompatibility,
        processingTime: Date.now() - startTime,
        aiModel: this.config.model,
      };

      // Cache the result
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, analysis);
      }

      return analysis;
    } catch (error) {
      throw new Error(
        `AI analysis failed for tweet ${input.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Classify tweet content using AI
   */
  private async classifyContent(
    input: TweetInput,
  ): Promise<ContentClassification> {
    const prompt = this.buildClassificationPrompt(input);

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: `You are an expert football transfer journalist and content classifier. Analyze tweets for transfer relevance with high accuracy.

Your task is to classify the following tweet and return a JSON response with these exact fields:
- isTransferRelated: boolean
- transferType: "RUMOUR" | "TALKS" | "ADVANCED" | "MEDICAL" | "CONFIRMED" | "OFFICIAL" (only if transfer related)
- priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"  
- confidence: number between 0 and 1
- categories: array of relevant categories from ["signing", "departure", "contract_extension", "loan", "medical", "negotiation", "rumour", "denial", "agent_talk", "fee_discussion"]
- keyPoints: array of key information points (max 5)
- duplicateOf: optional tweet ID if this appears to be duplicate content

Focus on transfer-related content only. Non-transfer football content should be classified as not transfer related.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI classification");
    }

    try {
      const parsed = JSON.parse(content);
      return ContentClassificationSchema.parse(parsed);
    } catch (error) {
      throw new Error(
        `Invalid AI classification response: ${error instanceof Error ? error.message : "Parse error"}`,
      );
    }
  }

  /**
   * Extract entities using AI
   */
  private async extractEntities(input: TweetInput): Promise<EntityExtraction> {
    const prompt = this.buildEntityExtractionPrompt(input);

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: `You are an expert in football knowledge and named entity recognition. Extract all football-related entities from tweets.

Return a JSON response with these exact fields:
- players: array of {name, confidence, position?, currentClub?, nationality?}
- clubs: array of {name, confidence, league?, country?}
- transferDetails: array of {type, value, confidence} where type is one of: "fee", "contract_length", "wage", "agent", "medical_date"
- agents: array of {name?, company?, confidence}

Be precise with confidence scores (0-1). Only include entities you're confident about.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI entity extraction");
    }

    try {
      const parsed = JSON.parse(content);
      return EntityExtractionSchema.parse(parsed);
    } catch (error) {
      throw new Error(
        `Invalid AI entity extraction response: ${error instanceof Error ? error.message : "Parse error"}`,
      );
    }
  }

  /**
   * Analyze sentiment and reliability
   */
  private async analyzeSentiment(
    input: TweetInput,
  ): Promise<SentimentAnalysis> {
    const prompt = this.buildSentimentPrompt(input);

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: `You are a sentiment analysis expert specializing in football transfer news. Analyze the sentiment, reliability, and urgency of transfer-related content.

Return a JSON response with these exact fields:
- sentiment: "positive" | "negative" | "neutral"
- confidence: number between 0 and 1
- emotions: array of emotions from ["excitement", "disappointment", "skepticism", "optimism", "anxiety"]
- reliability: number between 0 and 1 (how reliable/credible the source seems)
- urgency: number between 0 and 1 (how urgent/breaking the news appears)

Consider the author's tier, verification status, and language used when assessing reliability.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI sentiment analysis");
    }

    try {
      const parsed = JSON.parse(content);
      return SentimentAnalysisSchema.parse(parsed);
    } catch (error) {
      throw new Error(
        `Invalid AI sentiment analysis response: ${error instanceof Error ? error.message : "Parse error"}`,
      );
    }
  }

  /**
   * Build classification prompt
   */
  private buildClassificationPrompt(input: TweetInput): string {
    return `
Tweet Analysis Request:

Content: "${input.text}"
Author: @${input.authorHandle} (${input.authorName})
Verified: ${input.authorVerified}
Source Tier: ${input.authorTier}
Engagement: ${input.metrics.retweets} RTs, ${input.metrics.likes} likes, ${input.metrics.replies} replies
Posted: ${input.createdAt.toISOString()}

Context:
${input.context?.authorSpecialties ? `Author specializes in: ${input.context.authorSpecialties.join(", ")}` : ""}
${input.context?.recentTweets ? `Recent tweets: ${input.context.recentTweets.join(" | ")}` : ""}

Please classify this tweet for transfer relevance and provide detailed analysis.
    `.trim();
  }

  /**
   * Build entity extraction prompt
   */
  private buildEntityExtractionPrompt(input: TweetInput): string {
    return `
Extract Football Entities:

Tweet: "${input.text}"
Author: @${input.authorHandle} (${input.authorTier} source)

Please extract all football-related entities including players, clubs, transfer details, and agents.
Be specific about confidence levels and include relevant metadata where available.
    `.trim();
  }

  /**
   * Build sentiment analysis prompt
   */
  private buildSentimentPrompt(input: TweetInput): string {
    return `
Sentiment Analysis Request:

Tweet: "${input.text}"
Author: @${input.authorHandle} (${input.authorName})
Verified: ${input.authorVerified}, Tier: ${input.authorTier}
Engagement: ${input.metrics.likes} likes, ${input.metrics.retweets} retweets

Analyze the sentiment, perceived reliability, and urgency of this transfer-related content.
Consider the author's credibility and the language used.
    `.trim();
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(
    classification: ContentClassification,
    entities: EntityExtraction,
    sentiment: SentimentAnalysis,
    input: TweetInput,
  ): number {
    let score = 0;

    // Base score from classification confidence
    score += classification.confidence * 30;

    // Entity quality (specific players/clubs mentioned)
    const entityCount = entities.players.length + entities.clubs.length;
    score += Math.min(entityCount * 5, 20);

    // Source reliability
    switch (input.authorTier) {
      case "tier1":
        score += 25;
        break;
      case "tier2":
        score += 15;
        break;
      case "tier3":
        score += 5;
        break;
    }

    // Verification bonus
    if (input.authorVerified) score += 10;

    // Sentiment reliability
    score += sentiment.reliability * 15;

    return Math.min(Math.round(score), 100);
  }

  /**
   * Calculate Terry compatibility score
   */
  private calculateTerryCompatibility(
    input: TweetInput,
    sentiment: SentimentAnalysis,
    entities: EntityExtraction,
  ): number {
    let score = 0;

    // Emotional content (Terry loves drama)
    if (sentiment.emotions.includes("excitement")) score += 20;
    if (sentiment.emotions.includes("skepticism")) score += 25;
    if (sentiment.emotions.includes("anxiety")) score += 15;

    // Specific details (Terry loves specificity)
    score += entities.transferDetails.length * 10;

    // Big fees (Terry loves financial absurdity)
    const hasBigFee = entities.transferDetails.some(
      (detail) => detail.type === "fee" && /\d{3}/.test(detail.value),
    );
    if (hasBigFee) score += 20;

    // Chaos potential
    if (input.text.toLowerCase().includes("chaos")) score += 10;
    if (input.text.toLowerCase().includes("mental")) score += 15;

    return Math.min(Math.round(score), 100);
  }

  /**
   * Generate cache key for analysis
   */
  private generateCacheKey(input: TweetInput): string {
    return `${input.id}_${input.text.length}_${input.authorHandle}`;
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would track this with proper metrics
    };
  }

  /**
   * Validate API configuration
   */
  async validateConfiguration(): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [{ role: "user", content: "Test connection" }],
        max_tokens: 10,
      });

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `OpenAI API validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }
}
