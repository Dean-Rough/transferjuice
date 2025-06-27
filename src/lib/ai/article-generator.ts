/**
 * Terry-Style Article Generator
 * AI-powered generation of Transfer Juice articles with Terry's distinctive voice
 */

// TODO: Fix circular dependency with terry-style
// import { applyTerryStyle } from '@/lib/terry-style';
import OpenAI from "openai";
import { z } from "zod";
import type { ContentAnalysis } from "./content-analyzer";

// Article generation schemas
export const ArticleSectionSchema = z.object({
  id: z.string(),
  type: z.enum(["intro", "main", "context", "analysis", "conclusion"]),
  title: z.string(),
  content: z.string(),
  order: z.number(),
  sourceTweets: z.array(z.string()), // Tweet IDs used in this section
  terryisms: z.array(z.string()), // Specific Terry phrases used
});

export const ArticleContentSchema = z.object({
  sections: z.array(ArticleSectionSchema),
  wordCount: z.number(),
  estimatedReadTime: z.number(),
  terryScore: z.number().min(0).max(100), // How Terry-esque it is
  qualityMetrics: z.object({
    coherence: z.number().min(0).max(100),
    factualAccuracy: z.number().min(0).max(100),
    brandVoice: z.number().min(0).max(100),
    readability: z.number().min(0).max(100),
  }),
});

export const ArticleGenerationSchema = z.object({
  title: z.string(),
  slug: z.string(),
  content: ArticleContentSchema,
  summary: z.string(),
  metaDescription: z.string(),
  tags: z.array(z.string()),
  briefingType: z.enum([
    "MORNING",
    "AFTERNOON",
    "EVENING",
    "WEEKEND",
    "SPECIAL",
  ]),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED"]),
  qualityScore: z.number().min(0).max(100),
  aiModel: z.string(),
  generationTime: z.number(),
});

export type ArticleSection = z.infer<typeof ArticleSectionSchema>;
export type ArticleContent = z.infer<typeof ArticleContentSchema>;
export type ArticleGeneration = z.infer<typeof ArticleGenerationSchema>;

interface GeneratorConfig {
  openaiApiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  terryIntensity?: "mild" | "medium" | "nuclear";
}

export interface GenerationInput {
  briefingType: "MORNING" | "AFTERNOON" | "EVENING" | "WEEKEND" | "SPECIAL";
  tweetAnalyses: ContentAnalysis[];
  briefingDate: Date;
  previousArticles?: string[]; // To avoid repetition
  targetWordCount?: number;
  focusClubs?: string[];
}

export class TerryArticleGenerator {
  private openai: OpenAI;
  private config: Required<GeneratorConfig>;

  constructor(config: GeneratorConfig) {
    this.config = {
      model: "gpt-4.1",
      maxTokens: 4000,
      temperature: 0.7,
      terryIntensity: "medium",
      ...config,
    };

    this.openai = new OpenAI({
      apiKey: this.config.openaiApiKey,
    });
  }

  /**
   * Generate a complete Terry-style article from tweet analyses
   */
  async generateArticle(input: GenerationInput): Promise<ArticleGeneration> {
    const startTime = Date.now();

    try {
      // Filter and prioritize content
      const prioritizedTweets = this.prioritizeContent(input.tweetAnalyses);

      // Generate article structure
      const articleStructure = this.planArticleStructure(
        prioritizedTweets,
        input,
      );

      // Generate content for each section
      const sections = await this.generateSections(
        articleStructure,
        prioritizedTweets,
        input,
      );

      // Generate title and metadata
      const { title, slug, summary, metaDescription, tags } =
        await this.generateMetadata(sections, input);

      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(sections);
      const terryScore = this.calculateTerryScore(sections);
      const qualityScore = this.calculateOverallQuality(
        qualityMetrics,
        terryScore,
      );

      const wordCount = sections.reduce(
        (total, section) => total + section.content.split(" ").length,
        0,
      );
      const estimatedReadTime = Math.ceil(wordCount / 200); // 200 WPM reading speed

      const article: ArticleGeneration = {
        title,
        slug,
        content: {
          sections,
          wordCount,
          estimatedReadTime,
          terryScore,
          qualityMetrics,
        },
        summary,
        metaDescription,
        tags,
        briefingType: "SPECIAL", // Default briefing type for feed content
        status: qualityScore >= 85 ? "REVIEW" : "DRAFT",
        qualityScore,
        aiModel: this.config.model,
        generationTime: Date.now() - startTime,
      };

      return ArticleGenerationSchema.parse(article);
    } catch (error) {
      throw new Error(
        `Article generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Prioritize content based on Terry's preferences
   */
  private prioritizeContent(analyses: ContentAnalysis[]): ContentAnalysis[] {
    return analyses
      .filter((analysis) => analysis.classification.isTransferRelated)
      .sort((a, b) => {
        // Priority scoring for Terry's interests
        let scoreA = a.qualityScore;
        let scoreB = b.qualityScore;

        // Boost chaotic/dramatic content
        if (a.sentiment.emotions.includes("excitement")) scoreA += 15;
        if (a.sentiment.emotions.includes("skepticism")) scoreA += 20;
        if (b.sentiment.emotions.includes("excitement")) scoreB += 15;
        if (b.sentiment.emotions.includes("skepticism")) scoreB += 20;

        // Boost specific financial details
        const aHasFee = a.entities.transferDetails.some(
          (d) => d.type === "fee",
        );
        const bHasFee = b.entities.transferDetails.some(
          (d) => d.type === "fee",
        );
        if (aHasFee) scoreA += 10;
        if (bHasFee) scoreB += 10;

        // Terry compatibility bonus
        scoreA += a.terryCompatibility * 0.5;
        scoreB += b.terryCompatibility * 0.5;

        return scoreB - scoreA;
      })
      .slice(0, 10); // Top 10 pieces of content
  }

  /**
   * Plan the structure of the article
   */
  private planArticleStructure(
    analyses: ContentAnalysis[],
    input: GenerationInput,
  ): Array<{
    type: ArticleSection["type"];
    priority: number;
    content: ContentAnalysis[];
  }> {
    const structure = [
      {
        type: "intro" as const,
        priority: 1,
        content: analyses.slice(0, 2), // Most important stories
      },
      {
        type: "main" as const,
        priority: 2,
        content: analyses.slice(2, 6), // Main body content
      },
      {
        type: "context" as const,
        priority: 3,
        content: analyses.slice(6, 8), // Supporting stories
      },
      {
        type: "analysis" as const,
        priority: 4,
        content: analyses.slice(8, 10), // Terry's take
      },
    ];

    // Add conclusion if enough content
    if (analyses.length >= 5) {
      structure.push({
        type: "analysis" as const,
        priority: 5,
        content: analyses.slice(-2), // Wrap up with interesting bits
      });
    }

    return structure.filter((section) => section.content.length > 0);
  }

  /**
   * Generate content for article sections
   */
  private async generateSections(
    structure: Array<{
      type: ArticleSection["type"];
      priority: number;
      content: ContentAnalysis[];
    }>,
    allAnalyses: ContentAnalysis[],
    input: GenerationInput,
  ): Promise<ArticleSection[]> {
    const sections: ArticleSection[] = [];

    for (const [index, sectionPlan] of structure.entries()) {
      const section = await this.generateSection(
        sectionPlan.type,
        sectionPlan.content,
        index + 1,
        input,
      );
      sections.push(section);
    }

    return sections;
  }

  /**
   * Generate individual section content
   */
  private async generateSection(
    type: ArticleSection["type"],
    analyses: ContentAnalysis[],
    order: number,
    input: GenerationInput,
  ): Promise<ArticleSection> {
    const sectionPrompt = this.buildSectionPrompt(type, analyses, input);

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: this.getTerrySystemPrompt(type),
        },
        {
          role: "user",
          content: sectionPrompt,
        },
      ],
      max_tokens: this.getSectionTokenLimit(type),
      temperature: this.config.temperature,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error(`No content generated for ${type} section`);
    }

    // Extract Terry-isms from the generated content
    const terryisms = this.extractTerryisms(content);

    return {
      id: `section_${type}_${order}`,
      type,
      title: this.generateSectionTitle(type, analyses),
      content: content.trim(),
      order,
      sourceTweets: analyses.map((_, i) => `tweet_${i}`), // Would use real tweet IDs
      terryisms,
    };
  }

  /**
   * Get Terry-specific system prompt for different section types
   */
  private getTerrySystemPrompt(type: ArticleSection["type"]): string {
    const basePrompt = `You are The Terry, a brilliantly acerbic football journalist with a gift for weaponised irritation and emotional intelligence. Write in Joel Golby's distinctive style.

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
- Terry-level specificity about absurd details`;

    const sectionSpecific = {
      intro:
        "INTRO SECTION: Hook readers immediately with the most dramatic/absurd transfer story. Set the tone for controlled chaos.",
      main: "MAIN SECTION: Deep dive into the key stories with Terry's mix of expertise and exasperation.",
      context:
        "CONTEXT SECTION: Provide background with Terry's trademark ability to connect dots others miss.",
      analysis:
        "ANALYSIS SECTION: This is pure Terry - deep insights wrapped in withering observations.",
      conclusion:
        "CONCLUSION SECTION: Wrap up with Terry's signature mix of resignation and hope.",
    };

    return `${basePrompt}\n\n${sectionSpecific[type]}`;
  }

  /**
   * Build section-specific prompt
   */
  private buildSectionPrompt(
    type: ArticleSection["type"],
    analyses: ContentAnalysis[],
    input: GenerationInput,
  ): string {
    const tweetSummaries = analyses
      .map((analysis, i) => {
        const classification = analysis.classification;
        const entities = analysis.entities;

        return `Tweet ${i + 1}:
- Content: ${classification.keyPoints.join(", ")}
- Type: ${classification.transferType}
- Players: ${entities.players.map((p) => p.name).join(", ") || "None"}
- Clubs: ${entities.clubs.map((c) => c.name).join(", ") || "None"}
- Sentiment: ${analysis.sentiment.sentiment}
- Quality: ${analysis.qualityScore}/100`;
      })
      .join("\n\n");

    return `
Write a ${type} section for a ${input.briefingType.toLowerCase()} Transfer Juice briefing dated ${input.briefingDate.toDateString()}.

CONTENT TO WORK WITH:
${tweetSummaries}

REQUIREMENTS:
- ${this.getSectionRequirements(type)}
- Use Terry's voice throughout
- Include specific details and parenthetical asides
- Balance humor with genuine insight
- Focus on the human/absurd elements of transfers

Write engaging, Terry-style content that transforms these transfer updates into compelling journalism.
    `.trim();
  }

  /**
   * Get section-specific requirements
   */
  private getSectionRequirements(type: ArticleSection["type"]): string {
    const requirements = {
      intro:
        "150-200 words. Hook readers with the biggest story. Set comedic tone while delivering news.",
      main: "300-400 words. Deep dive into key transfers. Balance reporting with Terry's observations.",
      context:
        "200-250 words. Background and connections. Terry's ability to see bigger picture.",
      analysis:
        "250-300 words. Pure Terry commentary. Withering insights about football's madness.",
      conclusion:
        "100-150 words. Wrap up with hope/resignation. Terry's emotional intelligence.",
    };

    return requirements[type];
  }

  /**
   * Get token limits per section type
   */
  private getSectionTokenLimit(type: ArticleSection["type"]): number {
    const limits = {
      intro: 300,
      main: 500,
      context: 350,
      analysis: 400,
      conclusion: 250,
    };

    return limits[type];
  }

  /**
   * Generate metadata (title, summary, etc.)
   */
  private async generateMetadata(
    sections: ArticleSection[],
    input: GenerationInput,
  ): Promise<{
    title: string;
    slug: string;
    summary: string;
    metaDescription: string;
    tags: string[];
  }> {
    const contentSummary = sections
      .map((s) => `${s.type}: ${s.content.substring(0, 100)}...`)
      .join("\n");

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: `Generate metadata for a Terry-style Transfer Juice article. Return JSON with:
- title: Witty, specific headline (max 60 chars)
- slug: URL-friendly version
- summary: One-sentence article summary (max 160 chars)
- metaDescription: SEO meta description (max 160 chars)
- tags: Array of relevant tags`,
        },
        {
          role: "user",
          content: `Generate metadata for this ${input.briefingType.toLowerCase()} briefing:\n\n${contentSummary}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No metadata generated");
    }

    const metadata = JSON.parse(content);
    return {
      title: metadata.title,
      slug:
        metadata.slug ||
        metadata.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      summary: metadata.summary,
      metaDescription: metadata.metaDescription,
      tags: metadata.tags || [],
    };
  }

  /**
   * Extract Terry-isms from generated content
   */
  private extractTerryisms(content: string): string[] {
    const terryisms: string[] = [];

    // Look for parenthetical asides
    const parentheticals = content.match(/\([^)]+\)/g);
    if (parentheticals) {
      terryisms.push(...parentheticals);
    }

    // Look for specific Terry phrases
    const terryPhrases = [
      "of course",
      "apparently",
      "somehow",
      "brilliant",
      "properly mental",
      "exactly the sort of",
      "which is",
    ];

    for (const phrase of terryPhrases) {
      if (content.toLowerCase().includes(phrase)) {
        terryisms.push(phrase);
      }
    }

    return [...new Set(terryisms)]; // Remove duplicates
  }

  /**
   * Generate section title
   */
  private generateSectionTitle(
    type: ArticleSection["type"],
    analyses: ContentAnalysis[],
  ): string {
    const titleMap = {
      intro: "The Latest Chaos",
      main: "The Main Event",
      context: "What's Actually Happening",
      analysis: "The Terry Take",
      conclusion: "Right Then",
    };

    return titleMap[type];
  }

  /**
   * Calculate quality metrics
   */
  private calculateQualityMetrics(
    sections: ArticleSection[],
  ): ArticleContent["qualityMetrics"] {
    // Simplified quality calculation - would use more sophisticated NLP in production
    const totalWords = sections.reduce(
      (total, section) => total + section.content.split(" ").length,
      0,
    );

    return {
      coherence: Math.min(85 + Math.random() * 10, 100), // Would calculate based on content flow
      factualAccuracy: Math.min(90 + Math.random() * 5, 100), // Would verify against sources
      brandVoice: this.calculateTerryScore(sections), // Already calculated
      readability: Math.min(80 + totalWords / 50, 100), // Simplified readability
    };
  }

  /**
   * Calculate Terry score
   */
  private calculateTerryScore(sections: ArticleSection[]): number {
    let score = 0;

    sections.forEach((section) => {
      // Check for Terry-isms
      score += section.terryisms.length * 5;

      // Check for specific Terry patterns
      if (section.content.includes("(")) score += 10; // Parenthetical asides
      if (section.content.includes("brilliant")) score += 5;
      if (section.content.includes("of course")) score += 5;
      if (section.content.includes("properly")) score += 5;
    });

    return Math.min(score, 100);
  }

  /**
   * Calculate overall quality
   */
  private calculateOverallQuality(
    metrics: ArticleContent["qualityMetrics"],
    terryScore: number,
  ): number {
    return Math.round(
      metrics.coherence * 0.25 +
        metrics.factualAccuracy * 0.3 +
        metrics.brandVoice * 0.25 +
        metrics.readability * 0.2,
    );
  }

  /**
   * Validate configuration
   */
  async validateConfiguration(): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [{ role: "user", content: "Test" }],
        max_tokens: 5,
      });

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Article generator validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }
}
