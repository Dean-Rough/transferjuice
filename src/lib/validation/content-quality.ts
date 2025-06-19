/**
 * Content Quality Validation System
 * Multi-layered content validation with automated checks and human review integration
 */

import { z } from 'zod';
import OpenAI from 'openai';
import type { GeneratedArticle } from '@/lib/ai/article-generator';
import type { ContentAnalysis } from '@/lib/ai/content-analyzer';

// Quality validation schemas
export const QualityCheckResultSchema = z.object({
  checkType: z.enum([
    'factual_accuracy',
    'tone_consistency',
    'grammar',
    'safety',
    'legal',
    'accessibility',
  ]),
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  issues: z.array(
    z.object({
      severity: z.enum(['critical', 'high', 'medium', 'low']),
      category: z.string(),
      message: z.string(),
      location: z
        .object({
          section: z.string().optional(),
          paragraph: z.number().optional(),
          sentence: z.number().optional(),
        })
        .optional(),
      suggestion: z.string().optional(),
    })
  ),
  metadata: z.object({
    checkedAt: z.date(),
    checkDuration: z.number(),
    aiModel: z.string().optional(),
    humanReviewRequired: z.boolean(),
  }),
});

export const ContentValidationResultSchema = z.object({
  articleId: z.string(),
  overallScore: z.number().min(0).max(100),
  passed: z.boolean(),
  qualityChecks: z.array(QualityCheckResultSchema),
  humanReviewStatus: z.enum([
    'not_required',
    'pending',
    'in_progress',
    'completed',
    'rejected',
  ]),
  complianceStatus: z.enum(['compliant', 'needs_review', 'non_compliant']),
  recommendations: z.array(
    z.object({
      priority: z.enum(['critical', 'high', 'medium', 'low']),
      category: z.string(),
      action: z.string(),
      impact: z.string(),
    })
  ),
  metadata: z.object({
    validatedAt: z.date(),
    totalValidationTime: z.number(),
    validatorVersion: z.string(),
    falsePositiveRisk: z.number().min(0).max(100),
  }),
});

export type QualityCheckResult = z.infer<typeof QualityCheckResultSchema>;
export type ContentValidationResult = z.infer<
  typeof ContentValidationResultSchema
>;

interface ValidationConfig {
  openaiApiKey: string;
  enableFactualChecking: boolean;
  enableToneValidation: boolean;
  enableGrammarChecking: boolean;
  enableSafetyChecking: boolean;
  enableLegalChecking: boolean;
  enableAccessibilityChecking: boolean;
  qualityThresholds: {
    factualAccuracy: number;
    toneConsistency: number;
    grammarCorrectness: number;
    safetyCompliance: number;
    legalCompliance: number;
    accessibilityCompliance: number;
    overall: number;
  };
  humanReviewThresholds: {
    lowQualityScore: number;
    highRiskContent: number;
    factualUncertainty: number;
  };
}

export class ContentQualityValidator {
  private openai: OpenAI;
  private config: ValidationConfig;

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = {
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      enableFactualChecking: true,
      enableToneValidation: true,
      enableGrammarChecking: true,
      enableSafetyChecking: true,
      enableLegalChecking: true,
      enableAccessibilityChecking: true,
      qualityThresholds: {
        factualAccuracy: 85,
        toneConsistency: 85,
        grammarCorrectness: 90,
        safetyCompliance: 95,
        legalCompliance: 90,
        accessibilityCompliance: 85,
        overall: 85,
      },
      humanReviewThresholds: {
        lowQualityScore: 75,
        highRiskContent: 80,
        factualUncertainty: 70,
      },
      ...config,
    };

    this.openai = new OpenAI({
      apiKey: this.config.openaiApiKey,
    });
  }

  /**
   * Validate article content comprehensively
   */
  async validateContent(
    article: GeneratedArticle,
    sourceAnalyses: ContentAnalysis[]
  ): Promise<ContentValidationResult> {
    const startTime = Date.now();
    const qualityChecks: QualityCheckResult[] = [];

    // Run all enabled quality checks
    if (this.config.enableFactualChecking) {
      const factualCheck = await this.checkFactualAccuracy(
        article,
        sourceAnalyses
      );
      qualityChecks.push(factualCheck);
    }

    if (this.config.enableToneValidation) {
      const toneCheck = await this.checkToneConsistency(article);
      qualityChecks.push(toneCheck);
    }

    if (this.config.enableGrammarChecking) {
      const grammarCheck = await this.checkGrammarCorrectness(article);
      qualityChecks.push(grammarCheck);
    }

    if (this.config.enableSafetyChecking) {
      const safetyCheck = await this.checkContentSafety(article);
      qualityChecks.push(safetyCheck);
    }

    if (this.config.enableLegalChecking) {
      const legalCheck = await this.checkLegalCompliance(article);
      qualityChecks.push(legalCheck);
    }

    if (this.config.enableAccessibilityChecking) {
      const accessibilityCheck =
        await this.checkAccessibilityCompliance(article);
      qualityChecks.push(accessibilityCheck);
    }

    // Calculate overall score and determine validation result
    const overallScore = this.calculateOverallScore(qualityChecks);
    const passed = this.determineValidationResult(qualityChecks, overallScore);
    const humanReviewStatus = this.determineHumanReviewStatus(
      qualityChecks,
      overallScore
    );
    const complianceStatus = this.determineComplianceStatus(qualityChecks);
    const recommendations = this.generateRecommendations(qualityChecks);

    const totalValidationTime = Date.now() - startTime;
    const falsePositiveRisk = this.calculateFalsePositiveRisk(qualityChecks);

    return ContentValidationResultSchema.parse({
      articleId: article.id,
      overallScore,
      passed,
      qualityChecks,
      humanReviewStatus,
      complianceStatus,
      recommendations,
      metadata: {
        validatedAt: new Date(),
        totalValidationTime,
        validatorVersion: '1.0.0',
        falsePositiveRisk,
      },
    });
  }

  /**
   * Check factual accuracy against source tweets
   */
  private async checkFactualAccuracy(
    article: GeneratedArticle,
    sourceAnalyses: ContentAnalysis[]
  ): Promise<QualityCheckResult> {
    const startTime = Date.now();
    const issues: QualityCheckResult['issues'] = [];

    try {
      // Extract facts from source analyses
      const sourceFacts = this.extractSourceFacts(sourceAnalyses);

      // Validate each article section against source facts
      for (let i = 0; i < article.sections.length; i++) {
        const section = article.sections[i];
        const factCheckResult = await this.validateSectionFacts(
          section,
          sourceFacts
        );

        if (factCheckResult.issues.length > 0) {
          issues.push(
            ...factCheckResult.issues.map((issue) => ({
              ...issue,
              location: { section: section.id, paragraph: i },
            }))
          );
        }
      }

      // Calculate accuracy score
      const score = this.calculateFactualAccuracyScore(article, issues);
      const passed = score >= this.config.qualityThresholds.factualAccuracy;
      const humanReviewRequired =
        score < this.config.humanReviewThresholds.factualUncertainty;

      return QualityCheckResultSchema.parse({
        checkType: 'factual_accuracy',
        score,
        passed,
        issues,
        metadata: {
          checkedAt: new Date(),
          checkDuration: Date.now() - startTime,
          aiModel: 'gpt-4-turbo-preview',
          humanReviewRequired,
        },
      });
    } catch (error) {
      return this.createErrorResult(
        'factual_accuracy',
        Date.now() - startTime,
        error
      );
    }
  }

  /**
   * Check tone and voice consistency
   */
  private async checkToneConsistency(
    article: GeneratedArticle
  ): Promise<QualityCheckResult> {
    const startTime = Date.now();
    const issues: QualityCheckResult['issues'] = [];

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert in editorial voice consistency, specializing in Joel Golby's writing style for Transfer Juice. Analyze the article for:

1. Voice Consistency: British humor, wit, skepticism, conversational tone
2. Terry-style Elements: Proper use of "of course", "(obviously)", parenthetical asides
3. Tone Uniformity: Consistent cynical but entertaining voice throughout
4. Brand Voice: Matches Transfer Juice's irreverent but knowledgeable style

Return a JSON object with:
- score: 0-100 (voice consistency score)
- issues: Array of specific voice/tone issues found
- suggestions: Specific improvements for voice consistency`,
          },
          {
            role: 'user',
            content: `Analyze this Transfer Juice article for voice and tone consistency:

Title: ${article.title}

Content: ${article.sections.map((s) => s.content).join('\n\n')}

Terry Compatibility Score: ${article.terryCompatibilityScore}

Focus on identifying any sections that break from the established Terry voice pattern.`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.2,
      });

      const result = JSON.parse(
        response.choices[0]?.message?.content ||
          '{"score": 50, "issues": [], "suggestions": []}'
      );

      // Convert AI response to our issue format
      for (const issue of result.issues || []) {
        issues.push({
          severity: this.determineSeverity(result.score),
          category: 'tone_consistency',
          message: issue,
          suggestion:
            result.suggestions?.[0] || 'Review for Terry voice consistency',
        });
      }

      const score = Math.max(
        result.score || 50,
        article.terryCompatibilityScore
      );
      const passed = score >= this.config.qualityThresholds.toneConsistency;
      const humanReviewRequired =
        score < this.config.humanReviewThresholds.lowQualityScore;

      return QualityCheckResultSchema.parse({
        checkType: 'tone_consistency',
        score,
        passed,
        issues,
        metadata: {
          checkedAt: new Date(),
          checkDuration: Date.now() - startTime,
          aiModel: 'gpt-4-turbo-preview',
          humanReviewRequired,
        },
      });
    } catch (error) {
      return this.createErrorResult(
        'tone_consistency',
        Date.now() - startTime,
        error
      );
    }
  }

  /**
   * Check grammatical correctness and readability
   */
  private async checkGrammarCorrectness(
    article: GeneratedArticle
  ): Promise<QualityCheckResult> {
    const startTime = Date.now();
    const issues: QualityCheckResult['issues'] = [];

    try {
      const fullText = `${article.title}\n\n${article.sections.map((s) => s.content).join('\n\n')}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a professional copy editor specializing in British English. Check this text for:

1. Grammar: Subject-verb agreement, tense consistency, punctuation
2. Spelling: British spelling conventions, proper nouns
3. Readability: Sentence structure, flow, clarity
4. Style: Consistent use of contractions, informal tone appropriate for Transfer Juice

Return a JSON object with:
- score: 0-100 (grammar and readability score)
- errors: Array of specific grammar/spelling errors
- suggestions: Specific improvements for readability`,
          },
          {
            role: 'user',
            content: `Check this Transfer Juice article for grammar, spelling, and readability:

${fullText}

Identify any grammar errors, spelling mistakes, or readability issues that need correction.`,
          },
        ],
        max_tokens: 800,
        temperature: 0.1,
      });

      const result = JSON.parse(
        response.choices[0]?.message?.content ||
          '{"score": 85, "errors": [], "suggestions": []}'
      );

      // Convert AI response to our issue format
      for (const error of result.errors || []) {
        issues.push({
          severity: 'medium' as const,
          category: 'grammar',
          message: error,
          suggestion:
            result.suggestions?.[0] || 'Review and correct grammar/spelling',
        });
      }

      const score = result.score || 85;
      const passed = score >= this.config.qualityThresholds.grammarCorrectness;
      const humanReviewRequired = issues.length > 5 || score < 80;

      return QualityCheckResultSchema.parse({
        checkType: 'grammar',
        score,
        passed,
        issues,
        metadata: {
          checkedAt: new Date(),
          checkDuration: Date.now() - startTime,
          aiModel: 'gpt-4-turbo-preview',
          humanReviewRequired,
        },
      });
    } catch (error) {
      return this.createErrorResult('grammar', Date.now() - startTime, error);
    }
  }

  /**
   * Check content safety and appropriateness
   */
  private async checkContentSafety(
    article: GeneratedArticle
  ): Promise<QualityCheckResult> {
    const startTime = Date.now();
    const issues: QualityCheckResult['issues'] = [];

    try {
      // Pattern-based safety checks
      const patternIssues = this.performPatternBasedSafetyCheck(article);
      issues.push(...patternIssues);

      // AI-powered safety analysis
      const fullText = article.sections.map((s) => s.content).join(' ');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a content safety specialist. Analyze this football transfer article for:

1. Harmful Content: Hate speech, discrimination, harassment
2. Misinformation: False claims, conspiracy theories
3. Privacy Violations: Personal information disclosure
4. Legal Issues: Potentially defamatory statements
5. Inappropriate Content: Offensive language, adult content

Return a JSON object with:
- safe: boolean (overall safety assessment)
- riskLevel: "low" | "medium" | "high" | "critical"
- concerns: Array of specific safety concerns
- recommendations: Safety improvement suggestions`,
          },
          {
            role: 'user',
            content: `Analyze this transfer news article for content safety:

Title: ${article.title}
Content: ${fullText.substring(0, 2000)}...

Check for any content that could be harmful, inappropriate, or risky.`,
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      });

      const result = JSON.parse(
        response.choices[0]?.message?.content ||
          '{"safe": true, "riskLevel": "low", "concerns": []}'
      );

      // Convert AI response to our issue format
      for (const concern of result.concerns || []) {
        issues.push({
          severity: this.mapRiskLevelToSeverity(result.riskLevel),
          category: 'content_safety',
          message: concern,
          suggestion: 'Review and modify content to address safety concerns',
        });
      }

      const score = result.safe ? (result.riskLevel === 'low' ? 95 : 80) : 60;
      const passed = score >= this.config.qualityThresholds.safetyCompliance;
      const humanReviewRequired =
        result.riskLevel === 'high' || result.riskLevel === 'critical';

      return QualityCheckResultSchema.parse({
        checkType: 'safety',
        score,
        passed,
        issues,
        metadata: {
          checkedAt: new Date(),
          checkDuration: Date.now() - startTime,
          aiModel: 'gpt-4-turbo-preview',
          humanReviewRequired,
        },
      });
    } catch (error) {
      return this.createErrorResult('safety', Date.now() - startTime, error);
    }
  }

  /**
   * Check legal compliance
   */
  private async checkLegalCompliance(
    article: GeneratedArticle
  ): Promise<QualityCheckResult> {
    const startTime = Date.now();
    const issues: QualityCheckResult['issues'] = [];

    try {
      const fullText = article.sections.map((s) => s.content).join(' ');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a legal compliance expert specializing in media law. Analyze this article for:

1. Defamation Risk: Potentially libelous statements about individuals
2. Copyright Issues: Unauthorized use of copyrighted material
3. Privacy Concerns: Disclosure of private information
4. Reporting Standards: Adherence to journalistic standards
5. GDPR Compliance: Data protection considerations

Return a JSON object with:
- compliant: boolean (overall legal compliance)
- riskLevel: "low" | "medium" | "high" | "critical"
- legalIssues: Array of specific legal concerns
- recommendations: Legal compliance suggestions`,
          },
          {
            role: 'user',
            content: `Review this transfer news article for legal compliance:

Title: ${article.title}
Content: ${fullText.substring(0, 2000)}...

Identify any potential legal issues or compliance concerns.`,
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      });

      const result = JSON.parse(
        response.choices[0]?.message?.content ||
          '{"compliant": true, "riskLevel": "low", "legalIssues": []}'
      );

      // Convert AI response to our issue format
      for (const issue of result.legalIssues || []) {
        issues.push({
          severity: this.mapRiskLevelToSeverity(result.riskLevel),
          category: 'legal_compliance',
          message: issue,
          suggestion: 'Consult legal team for guidance on compliance',
        });
      }

      const score = result.compliant
        ? result.riskLevel === 'low'
          ? 95
          : 75
        : 50;
      const passed = score >= this.config.qualityThresholds.legalCompliance;
      const humanReviewRequired =
        result.riskLevel === 'high' || result.riskLevel === 'critical';

      return QualityCheckResultSchema.parse({
        checkType: 'legal',
        score,
        passed,
        issues,
        metadata: {
          checkedAt: new Date(),
          checkDuration: Date.now() - startTime,
          aiModel: 'gpt-4-turbo-preview',
          humanReviewRequired,
        },
      });
    } catch (error) {
      return this.createErrorResult('legal', Date.now() - startTime, error);
    }
  }

  /**
   * Check accessibility compliance
   */
  private async checkAccessibilityCompliance(
    article: GeneratedArticle
  ): Promise<QualityCheckResult> {
    const startTime = Date.now();
    const issues: QualityCheckResult['issues'] = [];

    try {
      // Automated accessibility checks
      this.checkReadabilityScore(article, issues);
      this.checkStructuralAccessibility(article, issues);
      this.checkContentLength(article, issues);

      const score = this.calculateAccessibilityScore(issues);
      const passed =
        score >= this.config.qualityThresholds.accessibilityCompliance;
      const humanReviewRequired = issues.some(
        (issue) => issue.severity === 'high' || issue.severity === 'critical'
      );

      return QualityCheckResultSchema.parse({
        checkType: 'accessibility',
        score,
        passed,
        issues,
        metadata: {
          checkedAt: new Date(),
          checkDuration: Date.now() - startTime,
          humanReviewRequired,
        },
      });
    } catch (error) {
      return this.createErrorResult(
        'accessibility',
        Date.now() - startTime,
        error
      );
    }
  }

  /**
   * Extract facts from source content analyses
   */
  private extractSourceFacts(sourceAnalyses: ContentAnalysis[]): Array<{
    fact: string;
    confidence: number;
    category: string;
  }> {
    const facts: Array<{ fact: string; confidence: number; category: string }> =
      [];

    for (const analysis of sourceAnalyses) {
      // Extract player facts
      for (const player of analysis.entities.players) {
        facts.push({
          fact: `Player: ${player.name}`,
          confidence: player.confidence,
          category: 'player',
        });
      }

      // Extract club facts
      for (const club of analysis.entities.clubs) {
        facts.push({
          fact: `Club: ${club.name}`,
          confidence: club.confidence,
          category: 'club',
        });
      }

      // Extract transfer details
      for (const detail of analysis.entities.transferDetails) {
        facts.push({
          fact: `${detail.type}: ${detail.value}`,
          confidence: detail.confidence,
          category: 'transfer_detail',
        });
      }

      // Extract key points
      for (const keyPoint of analysis.classification.keyPoints) {
        facts.push({
          fact: keyPoint,
          confidence: analysis.classification.confidence,
          category: 'key_point',
        });
      }
    }

    return facts;
  }

  /**
   * Validate section facts against source facts
   */
  private async validateSectionFacts(
    section: GeneratedArticle['sections'][0],
    sourceFacts: Array<{ fact: string; confidence: number; category: string }>
  ): Promise<{
    issues: Array<{
      severity: any;
      category: string;
      message: string;
      suggestion: string;
    }>;
  }> {
    const issues: Array<{
      severity: any;
      category: string;
      message: string;
      suggestion: string;
    }> = [];

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a fact-checking expert. Compare the article section against the provided source facts and identify any discrepancies, unsupported claims, or factual errors.

Return a JSON object with:
- factualErrors: Array of specific factual errors or unsupported claims
- supportedClaims: Array of claims that are well-supported by sources
- confidence: Overall confidence in factual accuracy (0-100)`,
          },
          {
            role: 'user',
            content: `Fact-check this article section against the source facts:

Section Content: ${section.content}

Source Facts: ${sourceFacts.map((f) => `${f.category}: ${f.fact} (confidence: ${f.confidence})`).join('\n')}

Identify any factual discrepancies or unsupported claims.`,
          },
        ],
        max_tokens: 800,
        temperature: 0.1,
      });

      const result = JSON.parse(
        response.choices[0]?.message?.content ||
          '{"factualErrors": [], "confidence": 85}'
      );

      for (const error of result.factualErrors || []) {
        issues.push({
          severity: 'high' as const,
          category: 'factual_accuracy',
          message: error,
          suggestion: 'Verify against source material and correct if necessary',
        });
      }

      return { issues };
    } catch (error) {
      issues.push({
        severity: 'medium' as const,
        category: 'factual_accuracy',
        message: 'Unable to complete fact verification due to technical error',
        suggestion: 'Manual fact-checking required',
      });
      return { issues };
    }
  }

  /**
   * Calculate factual accuracy score
   */
  private calculateFactualAccuracyScore(
    article: GeneratedArticle,
    issues: QualityCheckResult['issues']
  ): number {
    let baseScore = 90;

    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          baseScore -= 20;
          break;
        case 'high':
          baseScore -= 10;
          break;
        case 'medium':
          baseScore -= 5;
          break;
        case 'low':
          baseScore -= 2;
          break;
      }
    }

    return Math.max(0, baseScore);
  }

  /**
   * Perform pattern-based safety checks
   */
  private performPatternBasedSafetyCheck(
    article: GeneratedArticle
  ): QualityCheckResult['issues'] {
    const issues: QualityCheckResult['issues'] = [];
    const fullText =
      `${article.title} ${article.sections.map((s) => s.content).join(' ')}`.toLowerCase();

    // Check for discriminatory language patterns
    const discriminatoryPatterns = [
      /\b(racist?|sexist?|homophobic|xenophobic)\b/i,
      /\b(hate\s+speech|discrimination)\b/i,
    ];

    for (const pattern of discriminatoryPatterns) {
      if (pattern.test(fullText)) {
        issues.push({
          severity: 'critical',
          category: 'discriminatory_content',
          message: 'Potentially discriminatory language detected',
          suggestion: 'Review and remove any discriminatory content',
        });
      }
    }

    // Check for inappropriate content
    const inappropriatePatterns = [/\b(explicit|nsfw|adult content)\b/i];

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(fullText)) {
        issues.push({
          severity: 'high',
          category: 'inappropriate_content',
          message: 'Potentially inappropriate content detected',
          suggestion: 'Review content for appropriateness',
        });
      }
    }

    return issues;
  }

  /**
   * Check readability score
   */
  private checkReadabilityScore(
    article: GeneratedArticle,
    issues: QualityCheckResult['issues']
  ): void {
    const fullText = article.sections.map((s) => s.content).join(' ');
    const words = fullText.split(/\s+/).length;
    const sentences = fullText.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;

    if (avgWordsPerSentence > 25) {
      issues.push({
        severity: 'medium',
        category: 'readability',
        message: 'Average sentence length is too long for optimal readability',
        suggestion: 'Break up long sentences for better readability',
      });
    }

    if (words < 100) {
      issues.push({
        severity: 'low',
        category: 'content_length',
        message: 'Article content is very short',
        suggestion: 'Consider expanding content for better coverage',
      });
    }

    if (words > 2000) {
      issues.push({
        severity: 'low',
        category: 'content_length',
        message: 'Article content is very long',
        suggestion: 'Consider breaking into multiple sections or shortening',
      });
    }
  }

  /**
   * Check structural accessibility
   */
  private checkStructuralAccessibility(
    article: GeneratedArticle,
    issues: QualityCheckResult['issues']
  ): void {
    // Check for proper section structure
    if (article.sections.length < 2) {
      issues.push({
        severity: 'medium',
        category: 'structure',
        message: 'Article should have multiple sections for better structure',
        suggestion: 'Add introduction and conclusion sections',
      });
    }

    // Check for section balance
    const sectionLengths = article.sections.map((s) => s.content.length);
    const maxLength = Math.max(...sectionLengths);
    const minLength = Math.min(...sectionLengths);

    if (maxLength > minLength * 3) {
      issues.push({
        severity: 'low',
        category: 'section_balance',
        message: 'Section lengths are significantly unbalanced',
        suggestion: 'Balance section lengths for better reading flow',
      });
    }
  }

  /**
   * Check content length requirements
   */
  private checkContentLength(
    article: GeneratedArticle,
    issues: QualityCheckResult['issues']
  ): void {
    const totalWords = article.sections.reduce(
      (total, section) => total + section.content.split(/\s+/).length,
      0
    );

    if (totalWords < 200) {
      issues.push({
        severity: 'high',
        category: 'content_length',
        message: 'Article is too short for comprehensive coverage',
        suggestion: 'Expand content to provide more comprehensive coverage',
      });
    }

    if (totalWords > 1500) {
      issues.push({
        severity: 'medium',
        category: 'content_length',
        message: 'Article is very long and may affect readability',
        suggestion: 'Consider shortening or breaking into multiple articles',
      });
    }
  }

  /**
   * Calculate accessibility score
   */
  private calculateAccessibilityScore(
    issues: QualityCheckResult['issues']
  ): number {
    let baseScore = 95;

    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          baseScore -= 25;
          break;
        case 'high':
          baseScore -= 15;
          break;
        case 'medium':
          baseScore -= 8;
          break;
        case 'low':
          baseScore -= 3;
          break;
      }
    }

    return Math.max(0, baseScore);
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallScore(qualityChecks: QualityCheckResult[]): number {
    if (qualityChecks.length === 0) return 0;

    const weights = {
      factual_accuracy: 0.25,
      tone_consistency: 0.2,
      grammar: 0.15,
      safety: 0.2,
      legal: 0.15,
      accessibility: 0.05,
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const check of qualityChecks) {
      const weight = weights[check.checkType] || 0.1;
      weightedSum += check.score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  /**
   * Determine overall validation result
   */
  private determineValidationResult(
    qualityChecks: QualityCheckResult[],
    overallScore: number
  ): boolean {
    // Must pass overall score threshold
    if (overallScore < this.config.qualityThresholds.overall) return false;

    // Must not have any critical issues
    const hasCriticalIssues = qualityChecks.some((check) =>
      check.issues.some((issue) => issue.severity === 'critical')
    );
    if (hasCriticalIssues) return false;

    // All enabled checks must pass their individual thresholds
    const allChecksPassed = qualityChecks.every((check) => check.passed);
    return allChecksPassed;
  }

  /**
   * Determine human review status
   */
  private determineHumanReviewStatus(
    qualityChecks: QualityCheckResult[],
    overallScore: number
  ): ContentValidationResult['humanReviewStatus'] {
    // Check if any individual check requires human review
    const requiresHumanReview = qualityChecks.some(
      (check) => check.metadata.humanReviewRequired
    );

    if (requiresHumanReview) return 'pending';
    if (overallScore < this.config.humanReviewThresholds.lowQualityScore)
      return 'pending';

    return 'not_required';
  }

  /**
   * Determine compliance status
   */
  private determineComplianceStatus(
    qualityChecks: QualityCheckResult[]
  ): ContentValidationResult['complianceStatus'] {
    const safetyCheck = qualityChecks.find(
      (check) => check.checkType === 'safety'
    );
    const legalCheck = qualityChecks.find(
      (check) => check.checkType === 'legal'
    );

    const hasHighRiskIssues = qualityChecks.some((check) =>
      check.issues.some(
        (issue) => issue.severity === 'critical' || issue.severity === 'high'
      )
    );

    if (hasHighRiskIssues) return 'non_compliant';

    if (!safetyCheck?.passed || !legalCheck?.passed) return 'needs_review';

    return 'compliant';
  }

  /**
   * Generate recommendations based on quality checks
   */
  private generateRecommendations(
    qualityChecks: QualityCheckResult[]
  ): ContentValidationResult['recommendations'] {
    const recommendations: ContentValidationResult['recommendations'] = [];

    for (const check of qualityChecks) {
      for (const issue of check.issues) {
        recommendations.push({
          priority: issue.severity,
          category: issue.category,
          action: issue.suggestion || 'Review and address this issue',
          impact: this.getImpactDescription(issue.severity),
        });
      }
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    return recommendations.slice(0, 10); // Limit to top 10 recommendations
  }

  /**
   * Calculate false positive risk
   */
  private calculateFalsePositiveRisk(
    qualityChecks: QualityCheckResult[]
  ): number {
    // Higher AI reliance = higher false positive risk
    const aiChecks = qualityChecks.filter((check) => check.metadata.aiModel);
    const totalChecks = qualityChecks.length;

    if (totalChecks === 0) return 0;

    const aiRatio = aiChecks.length / totalChecks;
    return Math.round(aiRatio * 15); // 0-15% false positive risk
  }

  /**
   * Helper methods
   */
  private createErrorResult(
    checkType: QualityCheckResult['checkType'],
    duration: number,
    error: any
  ): QualityCheckResult {
    return QualityCheckResultSchema.parse({
      checkType,
      score: 50,
      passed: false,
      issues: [
        {
          severity: 'medium' as const,
          category: 'system_error',
          message: `Quality check failed due to system error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          suggestion: 'Manual review required due to system error',
        },
      ],
      metadata: {
        checkedAt: new Date(),
        checkDuration: duration,
        humanReviewRequired: true,
      },
    });
  }

  private determineSeverity(
    score: number
  ): QualityCheckResult['issues'][0]['severity'] {
    if (score < 50) return 'critical';
    if (score < 70) return 'high';
    if (score < 85) return 'medium';
    return 'low';
  }

  private mapRiskLevelToSeverity(
    riskLevel: string
  ): QualityCheckResult['issues'][0]['severity'] {
    switch (riskLevel) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      default:
        return 'low';
    }
  }

  private getImpactDescription(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'Critical impact - blocks publication';
      case 'high':
        return 'High impact - significant quality issue';
      case 'medium':
        return 'Medium impact - affects user experience';
      case 'low':
        return 'Low impact - minor improvement opportunity';
      default:
        return 'Unknown impact';
    }
  }

  /**
   * Get validator configuration
   */
  getConfig(): ValidationConfig {
    return { ...this.config };
  }

  /**
   * Update quality thresholds
   */
  updateThresholds(
    newThresholds: Partial<ValidationConfig['qualityThresholds']>
  ): void {
    this.config.qualityThresholds = {
      ...this.config.qualityThresholds,
      ...newThresholds,
    };
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    enabledChecks: string[];
    thresholds: ValidationConfig['qualityThresholds'];
    humanReviewThresholds: ValidationConfig['humanReviewThresholds'];
  } {
    const enabledChecks: string[] = [];

    if (this.config.enableFactualChecking)
      enabledChecks.push('factual_accuracy');
    if (this.config.enableToneValidation)
      enabledChecks.push('tone_consistency');
    if (this.config.enableGrammarChecking) enabledChecks.push('grammar');
    if (this.config.enableSafetyChecking) enabledChecks.push('safety');
    if (this.config.enableLegalChecking) enabledChecks.push('legal');
    if (this.config.enableAccessibilityChecking)
      enabledChecks.push('accessibility');

    return {
      enabledChecks,
      thresholds: this.config.qualityThresholds,
      humanReviewThresholds: this.config.humanReviewThresholds,
    };
  }
}
