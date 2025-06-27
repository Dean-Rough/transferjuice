/**
 * Content Quality Validator
 * Multi-layered validation system for AI-generated content with human review triggers
 */

// TODO: Fix circular dependency with terry-style
// import { applyTerryStyle } from '@/lib/terry-style';
import OpenAI from "openai";
import { z } from "zod";
import type { ArticleGeneration } from "./article-generator";

// Quality validation schemas
export const QualityCheckSchema = z.object({
  category: z.enum([
    "factual_accuracy",
    "brand_voice",
    "content_safety",
    "legal_compliance",
    "editorial_quality",
    "accessibility",
  ]),
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  issues: z.array(
    z.object({
      severity: z.enum(["low", "medium", "high", "critical"]),
      type: z.string(),
      description: z.string(),
      line: z.number().optional(),
      suggestion: z.string().optional(),
    }),
  ),
  checkedAt: z.date(),
  checker: z.enum(["ai", "human", "automated"]),
});

export const ValidationResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  passed: z.boolean(),
  requiresHumanReview: z.boolean(),
  blockers: z.array(z.string()), // Critical issues preventing publication
  warnings: z.array(z.string()), // Non-blocking issues
  checks: z.array(QualityCheckSchema),
  recommendations: z.array(
    z.object({
      type: z.enum(["improvement", "fix_required", "suggestion"]),
      description: z.string(),
      priority: z.enum(["low", "medium", "high"]),
    }),
  ),
  validatedAt: z.date(),
  validationTime: z.number(),
});

export type QualityCheck = z.infer<typeof QualityCheckSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

interface ValidatorConfig {
  openaiApiKey: string;
  model?: string;
  strictMode?: boolean; // Higher quality thresholds
  autoReviewThreshold?: number; // Score below which human review is required
  terryMinimumScore?: number; // Minimum Terry voice score required
}

export class ContentQualityValidator {
  private openai: OpenAI;
  private config: Required<ValidatorConfig>;

  // Quality thresholds
  private readonly QUALITY_THRESHOLDS = {
    factualAccuracy: { min: 85, human: 75 },
    brandVoice: { min: 80, human: 70 },
    contentSafety: { min: 95, human: 90 },
    legalCompliance: { min: 90, human: 85 },
    editorialQuality: { min: 80, human: 70 },
    accessibility: { min: 85, human: 80 },
  };

  // Content safety patterns to check
  private readonly SAFETY_PATTERNS = [
    {
      pattern: /\b(libel|defamation|slander)\b/i,
      severity: "critical" as const,
      description: "Potential legal issues",
    },
    {
      pattern: /\b(racist|sexist|homophobic)\b/i,
      severity: "critical" as const,
      description: "Discriminatory language",
    },
    {
      pattern: /\b(fuck|shit|cunt)\b/i,
      severity: "medium" as const,
      description: "Profanity detected",
    },
    {
      pattern: /\$\d+/g,
      severity: "low" as const,
      description: "Consider using £ for UK audience",
    },
  ];

  constructor(config: ValidatorConfig) {
    this.config = {
      model: "gpt-4.1",
      strictMode: false,
      autoReviewThreshold: 85,
      terryMinimumScore: 75,
      ...config,
    };

    this.openai = new OpenAI({
      apiKey: this.config.openaiApiKey,
    });
  }

  /**
   * Perform comprehensive content validation
   */
  async validateContent(article: ArticleGeneration): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      // Run all validation checks in parallel
      const [
        factualCheck,
        brandVoiceCheck,
        safetyCheck,
        legalCheck,
        editorialCheck,
        accessibilityCheck,
      ] = await Promise.all([
        this.checkFactualAccuracy(article),
        this.checkBrandVoice(article),
        this.checkContentSafety(article),
        this.checkLegalCompliance(article),
        this.checkEditorialQuality(article),
        this.checkAccessibility(article),
      ]);

      const checks = [
        factualCheck,
        brandVoiceCheck,
        safetyCheck,
        legalCheck,
        editorialCheck,
        accessibilityCheck,
      ];

      // Calculate overall score
      const overallScore = this.calculateOverallScore(checks);

      // Determine if content passes validation
      const passed = this.determinePassStatus(checks, overallScore);

      // Check if human review is required
      const requiresHumanReview = this.requiresHumanReview(
        checks,
        overallScore,
      );

      // Extract blockers and warnings
      const { blockers, warnings } = this.categorizeIssues(checks);

      // Generate recommendations
      const recommendations = this.generateRecommendations(checks, article);

      const result: ValidationResult = {
        overallScore,
        passed,
        requiresHumanReview,
        blockers,
        warnings,
        checks,
        recommendations,
        validatedAt: new Date(),
        validationTime: Date.now() - startTime,
      };

      return ValidationResultSchema.parse(result);
    } catch (error) {
      throw new Error(
        `Content validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Check factual accuracy using AI
   */
  private async checkFactualAccuracy(
    article: ArticleGeneration,
  ): Promise<QualityCheck> {
    const content = article.content.sections.map((s) => s.content).join("\n\n");

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: `You are a fact-checking expert for football transfer news. Check content for factual accuracy.

Return JSON with:
- score: 0-100 (factual accuracy)
- issues: array of {severity, type, description, suggestion}

Focus on:
- Transfer fee accuracy
- Player/club name accuracy  
- Timeline consistency
- Contradictory statements
- Unverifiable claims`,
        },
        {
          role: "user",
          content: `Check this transfer article for factual accuracy:\n\n${content}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");

    return {
      category: "factual_accuracy",
      score: result.score || 0,
      passed:
        (result.score || 0) >= this.QUALITY_THRESHOLDS.factualAccuracy.min,
      issues: result.issues || [],
      checkedAt: new Date(),
      checker: "ai",
    };
  }

  /**
   * Check brand voice consistency
   */
  private async checkBrandVoice(
    article: ArticleGeneration,
  ): Promise<QualityCheck> {
    const content = article.content.sections.map((s) => s.content).join("\n\n");

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: `You are evaluating content for Terry/Joel Golby brand voice consistency.

Terry's voice characteristics:
- Acerbic, witty, emotionally intelligent
- Parenthetical asides
- Specific, absurd details
- Weaponised irritation with empathy
- Balance of chaos and competence

Return JSON with:
- score: 0-100 (brand voice consistency)
- issues: array of issues where voice is off-brand`,
        },
        {
          role: "user",
          content: `Evaluate this content for Terry brand voice:\n\n${content}`,
        },
      ],
      max_tokens: 600,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");

    return {
      category: "brand_voice",
      score: Math.max(result.score || 0, article.content.terryScore),
      passed: (result.score || 0) >= this.QUALITY_THRESHOLDS.brandVoice.min,
      issues: result.issues || [],
      checkedAt: new Date(),
      checker: "ai",
    };
  }

  /**
   * Check content safety
   */
  private async checkContentSafety(
    article: ArticleGeneration,
  ): Promise<QualityCheck> {
    const content = article.content.sections.map((s) => s.content).join("\n\n");
    const issues: QualityCheck["issues"] = [];

    // Run pattern-based safety checks
    for (const safety of this.SAFETY_PATTERNS) {
      const matches = content.match(safety.pattern);
      if (matches) {
        issues.push({
          severity: safety.severity,
          type: "safety_pattern",
          description: safety.description,
          suggestion: "Review and modify flagged content",
        });
      }
    }

    // AI-based safety check
    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: `Check content for safety issues. Return JSON with:
- score: 0-100 (safety rating)
- issues: array of safety concerns

Check for:
- Discriminatory language
- Potential legal issues  
- Inappropriate content
- Harmful misinformation`,
        },
        {
          role: "user",
          content: `Safety check this content:\n\n${content}`,
        },
      ],
      max_tokens: 400,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const aiResult = JSON.parse(response.choices[0]?.message?.content || "{}");
    issues.push(...(aiResult.issues || []));

    const score = Math.min(
      aiResult.score || 100,
      issues.length === 0 ? 100 : 90,
    );

    return {
      category: "content_safety",
      score,
      passed: score >= this.QUALITY_THRESHOLDS.contentSafety.min,
      issues,
      checkedAt: new Date(),
      checker: "ai",
    };
  }

  /**
   * Check legal compliance
   */
  private async checkLegalCompliance(
    article: ArticleGeneration,
  ): Promise<QualityCheck> {
    const content = article.content.sections.map((s) => s.content).join("\n\n");

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: `Check content for legal compliance issues. Return JSON with:
- score: 0-100 (legal safety)
- issues: array of potential legal issues

Focus on:
- Potential libel/defamation
- Unsubstantiated claims about individuals
- Copyright concerns
- Privacy violations
- Misleading statements`,
        },
        {
          role: "user",
          content: `Legal compliance check:\n\n${content}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");

    return {
      category: "legal_compliance",
      score: result.score || 0,
      passed:
        (result.score || 0) >= this.QUALITY_THRESHOLDS.legalCompliance.min,
      issues: result.issues || [],
      checkedAt: new Date(),
      checker: "ai",
    };
  }

  /**
   * Check editorial quality
   */
  private async checkEditorialQuality(
    article: ArticleGeneration,
  ): Promise<QualityCheck> {
    const issues: QualityCheck["issues"] = [];
    let score = 100;

    // Basic quality checks
    if (article.content.wordCount < 300) {
      issues.push({
        severity: "medium",
        type: "length",
        description: "Article may be too short for substantive coverage",
        suggestion: "Consider adding more detail or context",
      });
      score -= 15;
    }

    if (article.content.wordCount > 1500) {
      issues.push({
        severity: "low",
        type: "length",
        description: "Article may be too long for target audience",
        suggestion: "Consider breaking into multiple pieces",
      });
      score -= 5;
    }

    // Check section balance
    const sectionLengths = article.content.sections.map(
      (s) => s.content.length,
    );
    const imbalanced =
      Math.max(...sectionLengths) > Math.min(...sectionLengths) * 3;
    if (imbalanced) {
      issues.push({
        severity: "low",
        type: "structure",
        description: "Sections appear unbalanced in length",
        suggestion: "Redistribute content more evenly",
      });
      score -= 10;
    }

    return {
      category: "editorial_quality",
      score: Math.max(score, 0),
      passed: score >= this.QUALITY_THRESHOLDS.editorialQuality.min,
      issues,
      checkedAt: new Date(),
      checker: "automated",
    };
  }

  /**
   * Check accessibility
   */
  private async checkAccessibility(
    article: ArticleGeneration,
  ): Promise<QualityCheck> {
    const issues: QualityCheck["issues"] = [];
    let score = 100;

    // Check readability
    const avgWordsPerSentence = this.calculateAverageWordsPerSentence(article);
    if (avgWordsPerSentence > 25) {
      issues.push({
        severity: "medium",
        type: "readability",
        description: "Sentences may be too long for accessibility",
        suggestion: "Break up longer sentences",
      });
      score -= 15;
    }

    // Check for clear section structure
    if (article.content.sections.length < 3) {
      issues.push({
        severity: "low",
        type: "structure",
        description: "Article could benefit from clearer section structure",
        suggestion: "Consider adding subheadings",
      });
      score -= 10;
    }

    return {
      category: "accessibility",
      score: Math.max(score, 0),
      passed: score >= this.QUALITY_THRESHOLDS.accessibility.min,
      issues,
      checkedAt: new Date(),
      checker: "automated",
    };
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(checks: QualityCheck[]): number {
    const weights = {
      factual_accuracy: 0.25,
      brand_voice: 0.2,
      content_safety: 0.25,
      legal_compliance: 0.15,
      editorial_quality: 0.1,
      accessibility: 0.05,
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const check of checks) {
      const weight = weights[check.category];
      totalScore += check.score * weight;
      totalWeight += weight;
    }

    return Math.round(totalScore / totalWeight);
  }

  /**
   * Determine if content passes validation
   */
  private determinePassStatus(
    checks: QualityCheck[],
    overallScore: number,
  ): boolean {
    // Must pass all critical checks
    const hasCriticalFailures = checks.some(
      (check) =>
        !check.passed &&
        check.issues.some((issue) => issue.severity === "critical"),
    );

    if (hasCriticalFailures) return false;

    // Must meet overall score threshold
    const threshold = this.config.strictMode ? 85 : 75;
    return overallScore >= threshold;
  }

  /**
   * Check if human review is required
   */
  private requiresHumanReview(
    checks: QualityCheck[],
    overallScore: number,
  ): boolean {
    // Always require human review for critical issues
    const hasCriticalIssues = checks.some((check) =>
      check.issues.some((issue) => issue.severity === "critical"),
    );

    if (hasCriticalIssues) return true;

    // Require review if below auto-review threshold
    return overallScore < this.config.autoReviewThreshold;
  }

  /**
   * Categorize issues into blockers and warnings
   */
  private categorizeIssues(checks: QualityCheck[]): {
    blockers: string[];
    warnings: string[];
  } {
    const blockers: string[] = [];
    const warnings: string[] = [];

    for (const check of checks) {
      for (const issue of check.issues) {
        const message = `${check.category}: ${issue.description}`;

        if (issue.severity === "critical" || issue.severity === "high") {
          blockers.push(message);
        } else {
          warnings.push(message);
        }
      }
    }

    return { blockers, warnings };
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(
    checks: QualityCheck[],
    article: ArticleGeneration,
  ): ValidationResult["recommendations"] {
    const recommendations: ValidationResult["recommendations"] = [];

    // Add recommendations based on check results
    for (const check of checks) {
      if (!check.passed) {
        recommendations.push({
          type: "fix_required",
          description: `Improve ${check.category.replace("_", " ")} score (currently ${check.score}/100)`,
          priority: "high",
        });
      }
    }

    // Terry-specific recommendations
    if (article.content.terryScore < this.config.terryMinimumScore) {
      recommendations.push({
        type: "improvement",
        description:
          "Enhance Terry voice with more parenthetical asides and specific observations",
        priority: "medium",
      });
    }

    // Quality improvements
    if (article.qualityScore < 90) {
      recommendations.push({
        type: "suggestion",
        description:
          "Consider adding more specific details and context to improve overall quality",
        priority: "low",
      });
    }

    return recommendations;
  }

  /**
   * Calculate average words per sentence
   */
  private calculateAverageWordsPerSentence(article: ArticleGeneration): number {
    const allText = article.content.sections.map((s) => s.content).join(" ");
    const sentences = allText
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    const words = allText.split(/\s+/).filter((w) => w.length > 0);

    return sentences.length > 0 ? words.length / sentences.length : 0;
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
        error: `Quality validator validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }
}
