/**
 * Content Quality Validator Tests
 * Comprehensive test suite for multi-layered content validation
 */

import OpenAI from 'openai';
import type { ArticleGeneration } from '../article-generator';
import { ContentQualityValidator } from '../quality-validator';

// Mock OpenAI
jest.mock('openai');
const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

// Mock terry-style module
jest.mock('@/lib/terry-style', () => ({
  applyTerryStyle: {
    enhanceError: jest.fn((msg: string) => `Terry-enhanced: ${msg}`),
  },
}));

describe('ContentQualityValidator', () => {
  let validator: ContentQualityValidator;
  let mockOpenAI: jest.Mocked<OpenAI>;

  const mockArticle: ArticleGeneration = {
    title: 'Rice Finally Joins United After £100m Circus',
    slug: 'rice-finally-joins-united-after-100m-circus',
    content: {
      sections: [
        {
          id: 'section_intro_1',
          type: 'intro',
          title: 'The Latest Chaos',
          content:
            "Right, this might be the most cursed transfer saga I've witnessed today, and I've been watching football for longer than I care to admit. Manchester United (currently in their \"cautiously optimistic\" phase) have finally managed to drag Declan Rice across the finish line for £100m (or roughly the GDP of a small Caribbean island). The whole medical circus (basically checking he has two legs and a pulse) was completed yesterday, which means we're now in that delightful phase where everyone pretends this was always going to happen.",
          order: 1,
          sourceTweets: ['tweet_1'],
          terryisms: [
            '(currently in their "cautiously optimistic" phase)',
            '(or roughly the GDP of a small Caribbean island)',
            '(basically checking he has two legs and a pulse)',
          ],
        },
        {
          id: 'section_main_2',
          type: 'main',
          title: 'The Main Event',
          content:
            'What this actually means, beyond the obvious financial lunacy, is that United have finally addressed their midfield issues with the sort of decisive action that would make a sloth proud. Rice brings exactly the sort of defensive stability that United have been missing since, oh, approximately 2013. His ability to break up play and distribute the ball effectively should, in theory, allow Bruno Fernandes to focus on what he does best (creating chaos in the final third) rather than dropping deep to collect the ball.',
          order: 2,
          sourceTweets: ['tweet_1', 'tweet_2'],
          terryisms: [
            'beyond the obvious financial lunacy',
            'oh, approximately 2013',
          ],
        },
        {
          id: 'section_analysis_3',
          type: 'analysis',
          title: 'The Terry Take',
          content:
            "Let's unpack this absolute car crash of a situation, shall we? The implications of this are either brilliant or catastrophic, depending on your tolerance for chaos. United paying £100m for a defensive midfielder is either the smartest thing they've done in years or evidence that they've completely lost their minds. Given their recent track record, I'm inclined towards the latter, but Rice is genuinely excellent at what he does.",
          order: 3,
          sourceTweets: ['tweet_3'],
          terryisms: [
            "Let's unpack this absolute car crash of a situation, shall we?",
            'depending on your tolerance for chaos',
          ],
        },
      ],
      wordCount: 342,
      estimatedReadTime: 2,
      terryScore: 85,
      qualityMetrics: {
        coherence: 88,
        factualAccuracy: 92,
        brandVoice: 85,
        readability: 79,
      },
    },
    summary:
      'Manchester United complete the signing of Declan Rice for £100m after medical tests.',
    metaDescription:
      'Declan Rice joins Manchester United for £100m in latest transfer madness.',
    tags: ['Manchester United', 'Declan Rice', 'Transfer', 'Premier League'],
    briefingType: 'MORNING',
    status: 'REVIEW',
    qualityScore: 86,
    aiModel: 'gpt-4.1',
    generationTime: 4500,
  };

  const mockFactualAccuracyResponse = {
    score: 88,
    issues: [
      {
        severity: 'low',
        type: 'verification',
        description: 'Transfer fee should be verified against official sources',
        suggestion: 'Cross-reference with club announcements',
      },
    ],
  };

  const mockBrandVoiceResponse = {
    score: 85,
    issues: [
      {
        severity: 'low',
        type: 'voice_consistency',
        description: 'Could use more parenthetical asides',
        suggestion: 'Add more Terry-style commentary',
      },
    ],
  };

  const mockSafetyResponse = {
    score: 95,
    issues: [],
  };

  const mockLegalResponse = {
    score: 92,
    issues: [
      {
        severity: 'low',
        type: 'opinion',
        description:
          'Strong opinions about club decisions should be clearly marked as commentary',
        suggestion: 'Add disclaimer for editorial opinion',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock OpenAI instance
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    } as any;

    MockedOpenAI.mockImplementation(() => mockOpenAI);

    validator = new ContentQualityValidator({
      openaiApiKey: 'test-key',
      model: 'gpt-4.1',
      strictMode: false,
      autoReviewThreshold: 85,
      terryMinimumScore: 75,
    });
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const defaultValidator = new ContentQualityValidator({
        openaiApiKey: 'test-key',
      });
      expect(defaultValidator).toBeInstanceOf(ContentQualityValidator);
    });

    it('should initialize with custom configuration', () => {
      const customValidator = new ContentQualityValidator({
        openaiApiKey: 'test-key',
        model: 'gpt-4o',
        strictMode: true,
        autoReviewThreshold: 90,
        terryMinimumScore: 80,
      });
      expect(customValidator).toBeInstanceOf(ContentQualityValidator);
    });
  });

  describe('validateContent', () => {
    beforeEach(() => {
      // Mock all validation check responses
      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: { content: JSON.stringify(mockFactualAccuracyResponse) },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(mockBrandVoiceResponse) } },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(mockSafetyResponse) } },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(mockLegalResponse) } },
          ],
        } as any);
    });

    it('should perform comprehensive content validation', async () => {
      const result = await validator.validateContent(mockArticle);

      expect(result).toMatchObject({
        overallScore: expect.any(Number),
        passed: expect.any(Boolean),
        requiresHumanReview: expect.any(Boolean),
        blockers: expect.any(Array),
        warnings: expect.any(Array),
        checks: expect.arrayContaining([
          expect.objectContaining({ category: 'factual_accuracy' }),
          expect.objectContaining({ category: 'brand_voice' }),
          expect.objectContaining({ category: 'content_safety' }),
          expect.objectContaining({ category: 'legal_compliance' }),
          expect.objectContaining({ category: 'editorial_quality' }),
          expect.objectContaining({ category: 'accessibility' }),
        ]),
        recommendations: expect.any(Array),
        validatedAt: expect.any(Date),
        validationTime: expect.any(Number),
      });

      // Should call OpenAI for factual, brand voice, safety, and legal checks
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(4);
    });

    it('should pass validation for high-quality content', async () => {
      const result = await validator.validateContent(mockArticle);

      expect(result.passed).toBe(true);
      expect(result.overallScore).toBeGreaterThan(75);
    });

    it('should require human review for content below threshold', async () => {
      const lowQualityResponses = [
        { score: 70, issues: [] },
        { score: 65, issues: [] },
        { score: 80, issues: [] },
        { score: 75, issues: [] },
      ];

      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(lowQualityResponses[0]) } },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(lowQualityResponses[1]) } },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(lowQualityResponses[2]) } },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(lowQualityResponses[3]) } },
          ],
        } as any);

      const result = await validator.validateContent(mockArticle);

      expect(result.requiresHumanReview).toBe(true);
      expect(result.overallScore).toBeLessThan(85);
    });

    it('should handle critical issues as blockers', async () => {
      const criticalResponse = {
        score: 95,
        issues: [
          {
            severity: 'critical',
            type: 'legal',
            description: 'Potential defamation risk',
            suggestion: 'Remove or modify problematic content',
          },
        ],
      };

      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: { content: JSON.stringify(mockFactualAccuracyResponse) },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(mockBrandVoiceResponse) } },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(criticalResponse) } }],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(mockLegalResponse) } },
          ],
        } as any);

      const result = await validator.validateContent(mockArticle);

      expect(result.passed).toBe(false);
      expect(result.requiresHumanReview).toBe(true);
      expect(result.blockers).toContain(
        'content_safety: Potential defamation risk'
      );
    });

    it('should handle validation errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('API Error')
      );

      await expect(validator.validateContent(mockArticle)).rejects.toThrow(
        'Content validation failed'
      );
    });
  });

  describe('factual accuracy checking', () => {
    it('should check factual accuracy using AI', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(mockFactualAccuracyResponse) } },
        ],
      } as any);

      const result = await (validator as any).checkFactualAccuracy(mockArticle);

      expect(result).toMatchObject({
        category: 'factual_accuracy',
        score: 88,
        passed: true,
        issues: expect.any(Array),
        checkedAt: expect.any(Date),
        checker: 'ai',
      });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4.1',
          response_format: { type: 'json_object' },
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('fact-checking expert'),
            }),
          ]),
        })
      );
    });

    it('should fail factual accuracy for low scores', async () => {
      const lowAccuracyResponse = { ...mockFactualAccuracyResponse, score: 70 };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(lowAccuracyResponse) } },
        ],
      } as any);

      const result = await (validator as any).checkFactualAccuracy(mockArticle);

      expect(result.passed).toBe(false);
      expect(result.score).toBe(70);
    });
  });

  describe('brand voice checking', () => {
    it('should check brand voice consistency', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(mockBrandVoiceResponse) } },
        ],
      } as any);

      const result = await (validator as any).checkBrandVoice(mockArticle);

      expect(result).toMatchObject({
        category: 'brand_voice',
        score: 85,
        passed: true,
        issues: expect.any(Array),
        checkedAt: expect.any(Date),
        checker: 'ai',
      });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('Terry/Joel Golby brand voice'),
            }),
          ]),
        })
      );
    });

    it('should use higher of AI score and article Terry score', async () => {
      const lowBrandResponse = { ...mockBrandVoiceResponse, score: 60 };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(lowBrandResponse) } }],
      } as any);

      const result = await (validator as any).checkBrandVoice(mockArticle);

      // Should use article's terryScore (85) since it's higher than AI response (60)
      expect(result.score).toBe(85);
    });
  });

  describe('content safety checking', () => {
    it('should perform pattern-based and AI safety checks', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockSafetyResponse) } }],
      } as any);

      const result = await (validator as any).checkContentSafety(mockArticle);

      expect(result).toMatchObject({
        category: 'content_safety',
        score: expect.any(Number),
        passed: true,
        issues: expect.any(Array),
        checkedAt: expect.any(Date),
        checker: 'ai',
      });
    });

    it('should detect safety patterns in content', async () => {
      const unsafeArticle = {
        ...mockArticle,
        content: {
          ...mockArticle.content,
          sections: [
            {
              ...mockArticle.content.sections[0],
              content:
                'This is some content with profanity shit and inappropriate language.',
            },
          ],
        },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockSafetyResponse) } }],
      } as any);

      const result = await (validator as any).checkContentSafety(unsafeArticle);

      expect(
        result.issues.some(
          (issue) => issue.description === 'Profanity detected'
        )
      ).toBe(true);
    });

    it('should handle discriminatory language detection', async () => {
      const discriminatoryArticle = {
        ...mockArticle,
        content: {
          ...mockArticle.content,
          sections: [
            {
              ...mockArticle.content.sections[0],
              content:
                'This content contains racist language that should be flagged.',
            },
          ],
        },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockSafetyResponse) } }],
      } as any);

      const result = await (validator as any).checkContentSafety(
        discriminatoryArticle
      );

      expect(
        result.issues.some(
          (issue) => issue.description === 'Discriminatory language'
        )
      ).toBe(true);
      expect(result.issues.some((issue) => issue.severity === 'critical')).toBe(
        true
      );
    });
  });

  describe('legal compliance checking', () => {
    it('should check for legal compliance issues', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockLegalResponse) } }],
      } as any);

      const result = await (validator as any).checkLegalCompliance(mockArticle);

      expect(result).toMatchObject({
        category: 'legal_compliance',
        score: 92,
        passed: true,
        issues: expect.any(Array),
        checkedAt: expect.any(Date),
        checker: 'ai',
      });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('legal compliance'),
            }),
          ]),
        })
      );
    });

    it('should fail for low legal compliance scores', async () => {
      const lowLegalResponse = { ...mockLegalResponse, score: 75 };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(lowLegalResponse) } }],
      } as any);

      const result = await (validator as any).checkLegalCompliance(mockArticle);

      expect(result.passed).toBe(false);
      expect(result.score).toBe(75);
    });
  });

  describe('editorial quality checking', () => {
    it('should check editorial quality automatically', async () => {
      const result = await (validator as any).checkEditorialQuality(
        mockArticle
      );

      expect(result).toMatchObject({
        category: 'editorial_quality',
        score: expect.any(Number),
        passed: expect.any(Boolean),
        issues: expect.any(Array),
        checkedAt: expect.any(Date),
        checker: 'automated',
      });
    });

    it('should flag articles that are too short', async () => {
      const shortArticle = {
        ...mockArticle,
        content: {
          ...mockArticle.content,
          wordCount: 200,
          sections: [
            {
              ...mockArticle.content.sections[0],
              content: 'Very short content.',
            },
          ],
        },
      };

      const result = await (validator as any).checkEditorialQuality(
        shortArticle
      );

      expect(
        result.issues.some((issue) => issue.description.includes('too short'))
      ).toBe(true);
    });

    it('should flag articles that are too long', async () => {
      const longArticle = {
        ...mockArticle,
        content: {
          ...mockArticle.content,
          wordCount: 1600,
        },
      };

      const result = await (validator as any).checkEditorialQuality(
        longArticle
      );

      expect(
        result.issues.some((issue) => issue.description.includes('too long'))
      ).toBe(true);
    });

    it('should check section balance', async () => {
      const imbalancedArticle = {
        ...mockArticle,
        content: {
          ...mockArticle.content,
          sections: [
            { ...mockArticle.content.sections[0], content: 'Short.' },
            {
              ...mockArticle.content.sections[1],
              content:
                'This is a much longer section with significantly more content than the previous one, creating an imbalance in the article structure.',
            },
          ],
        },
      };

      const result = await (validator as any).checkEditorialQuality(
        imbalancedArticle
      );

      expect(
        result.issues.some((issue) => issue.description.includes('unbalanced'))
      ).toBe(true);
    });
  });

  describe('accessibility checking', () => {
    it('should check accessibility automatically', async () => {
      const result = await (validator as any).checkAccessibility(mockArticle);

      expect(result).toMatchObject({
        category: 'accessibility',
        score: expect.any(Number),
        passed: expect.any(Boolean),
        issues: expect.any(Array),
        checkedAt: expect.any(Date),
        checker: 'automated',
      });
    });

    it('should flag long sentences for readability', async () => {
      const longSentenceArticle = {
        ...mockArticle,
        content: {
          ...mockArticle.content,
          sections: [
            {
              ...mockArticle.content.sections[0],
              content:
                'This is an extremely long sentence that goes on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and on and continues to go on without any breaks or pauses which makes it very difficult to read and understand for users who may have accessibility needs.',
            },
          ],
        },
      };

      const result = await (validator as any).checkAccessibility(
        longSentenceArticle
      );

      expect(
        result.issues.some((issue) =>
          issue.description.includes('too long for accessibility')
        )
      ).toBe(true);
    });

    it('should suggest better section structure', async () => {
      const poorStructureArticle = {
        ...mockArticle,
        content: {
          ...mockArticle.content,
          sections: [
            mockArticle.content.sections[0],
            mockArticle.content.sections[1],
          ],
        },
      };

      const result = await (validator as any).checkAccessibility(
        poorStructureArticle
      );

      expect(
        result.issues.some((issue) =>
          issue.description.includes('section structure')
        )
      ).toBe(true);
    });
  });

  describe('quality scoring', () => {
    it('should calculate weighted overall score', () => {
      const checks = [
        { category: 'factual_accuracy' as const, score: 90 },
        { category: 'brand_voice' as const, score: 85 },
        { category: 'content_safety' as const, score: 95 },
        { category: 'legal_compliance' as const, score: 88 },
        { category: 'editorial_quality' as const, score: 80 },
        { category: 'accessibility' as const, score: 85 },
      ];

      const overallScore = (validator as any).calculateOverallScore(checks);

      expect(overallScore).toBeGreaterThan(80);
      expect(overallScore).toBeLessThanOrEqual(100);
    });

    it('should weight factual accuracy and safety most heavily', () => {
      const highFactualSafety = [
        { category: 'factual_accuracy' as const, score: 100 },
        { category: 'content_safety' as const, score: 100 },
        { category: 'brand_voice' as const, score: 50 },
        { category: 'legal_compliance' as const, score: 50 },
        { category: 'editorial_quality' as const, score: 50 },
        { category: 'accessibility' as const, score: 50 },
      ];

      const lowFactualSafety = [
        { category: 'factual_accuracy' as const, score: 50 },
        { category: 'content_safety' as const, score: 50 },
        { category: 'brand_voice' as const, score: 100 },
        { category: 'legal_compliance' as const, score: 100 },
        { category: 'editorial_quality' as const, score: 100 },
        { category: 'accessibility' as const, score: 100 },
      ];

      const highScore = (validator as any).calculateOverallScore(
        highFactualSafety
      );
      const lowScore = (validator as any).calculateOverallScore(
        lowFactualSafety
      );

      expect(highScore).toBeGreaterThan(lowScore);
    });
  });

  describe('pass/fail determination', () => {
    it('should fail content with critical issues', () => {
      const checks = [
        {
          category: 'content_safety' as const,
          passed: true,
          issues: [
            {
              severity: 'critical',
              type: 'safety',
              description: 'Critical issue',
            },
          ],
        },
      ];

      const passed = (validator as any).determinePassStatus(checks, 90);

      expect(passed).toBe(false);
    });

    it('should fail content below score threshold', () => {
      const checks = [
        { category: 'factual_accuracy' as const, passed: true, issues: [] },
      ];

      const passed = (validator as any).determinePassStatus(checks, 60);

      expect(passed).toBe(false);
    });

    it('should pass high-quality content without critical issues', () => {
      const checks = [
        {
          category: 'factual_accuracy' as const,
          passed: true,
          issues: [
            { severity: 'low', type: 'minor', description: 'Minor issue' },
          ],
        },
      ];

      const passed = (validator as any).determinePassStatus(checks, 85);

      expect(passed).toBe(true);
    });
  });

  describe('human review requirements', () => {
    it('should require review for critical issues', () => {
      const checks = [
        {
          category: 'legal_compliance' as const,
          issues: [
            { severity: 'critical', type: 'legal', description: 'Legal risk' },
          ],
        },
      ];

      const requiresReview = (validator as any).requiresHumanReview(checks, 90);

      expect(requiresReview).toBe(true);
    });

    it('should require review for scores below threshold', () => {
      const checks = [{ category: 'factual_accuracy' as const, issues: [] }];

      const requiresReview = (validator as any).requiresHumanReview(checks, 75);

      expect(requiresReview).toBe(true);
    });

    it('should not require review for high-quality content', () => {
      const checks = [{ category: 'factual_accuracy' as const, issues: [] }];

      const requiresReview = (validator as any).requiresHumanReview(checks, 90);

      expect(requiresReview).toBe(false);
    });
  });

  describe('issue categorization', () => {
    it('should categorize critical and high issues as blockers', () => {
      const checks = [
        {
          category: 'content_safety' as const,
          issues: [
            {
              severity: 'critical',
              type: 'safety',
              description: 'Critical safety issue',
            },
            {
              severity: 'high',
              type: 'quality',
              description: 'High priority issue',
            },
            { severity: 'medium', type: 'style', description: 'Medium issue' },
            {
              severity: 'low',
              type: 'minor',
              description: 'Low priority issue',
            },
          ],
        },
      ];

      const { blockers, warnings } = (validator as any).categorizeIssues(
        checks
      );

      expect(blockers).toHaveLength(2);
      expect(warnings).toHaveLength(2);
      expect(blockers[0]).toContain('Critical safety issue');
      expect(blockers[1]).toContain('High priority issue');
    });
  });

  describe('recommendations generation', () => {
    it('should generate recommendations for failed checks', () => {
      const checks = [
        {
          category: 'brand_voice' as const,
          passed: false,
          score: 60,
        },
      ];

      const recommendations = (validator as any).generateRecommendations(
        checks,
        mockArticle
      );

      expect(recommendations.some((r) => r.type === 'fix_required')).toBe(true);
      expect(
        recommendations.some((r) => r.description.includes('brand voice'))
      ).toBe(true);
    });

    it('should recommend Terry voice improvements', () => {
      const lowTerryArticle = {
        ...mockArticle,
        content: {
          ...mockArticle.content,
          terryScore: 60,
        },
      };

      const recommendations = (validator as any).generateRecommendations(
        [],
        lowTerryArticle
      );

      expect(
        recommendations.some((r) => r.description.includes('Terry voice'))
      ).toBe(true);
    });

    it('should suggest quality improvements for low-scoring articles', () => {
      const lowQualityArticle = {
        ...mockArticle,
        qualityScore: 70,
      };

      const recommendations = (validator as any).generateRecommendations(
        [],
        lowQualityArticle
      );

      expect(
        recommendations.some((r) => r.description.includes('quality'))
      ).toBe(true);
    });
  });

  describe('sentence analysis', () => {
    it('should calculate average words per sentence', () => {
      const avgWords = (validator as any).calculateAverageWordsPerSentence(
        mockArticle
      );

      expect(avgWords).toBeGreaterThan(0);
      expect(avgWords).toBeLessThan(50); // Reasonable upper bound
    });

    it('should handle content with no sentences', () => {
      const noSentenceArticle = {
        ...mockArticle,
        content: {
          ...mockArticle.content,
          sections: [
            {
              ...mockArticle.content.sections[0],
              content: '',
            },
          ],
        },
      };

      const avgWords = (validator as any).calculateAverageWordsPerSentence(
        noSentenceArticle
      );

      expect(avgWords).toBe(0);
    });
  });

  describe('configuration validation', () => {
    it('should validate API configuration successfully', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Test response' } }],
      } as any);

      const result = await validator.validateConfiguration();

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle API configuration errors', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('Invalid API key')
      );

      const result = await validator.validateConfiguration();

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Terry-enhanced');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty article content', async () => {
      const emptyArticle = {
        ...mockArticle,
        content: {
          ...mockArticle.content,
          sections: [],
          wordCount: 0,
        },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify({ score: 0, issues: [] }) } },
        ],
      } as any);

      const result = await validator.validateContent(emptyArticle);

      expect(result.overallScore).toBeLessThan(50);
      expect(result.passed).toBe(false);
    });

    it('should handle malformed AI responses', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'invalid json' } }],
      } as any);

      await expect(validator.validateContent(mockArticle)).rejects.toThrow();
    });

    it('should handle null AI responses', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }],
      } as any);

      await expect(validator.validateContent(mockArticle)).rejects.toThrow();
    });

    it('should handle strict mode configuration', async () => {
      const strictValidator = new ContentQualityValidator({
        openaiApiKey: 'test-key',
        strictMode: true,
      });

      // Mock responses
      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: { content: JSON.stringify(mockFactualAccuracyResponse) },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(mockBrandVoiceResponse) } },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(mockSafetyResponse) } },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(mockLegalResponse) } },
          ],
        } as any);

      const result = await strictValidator.validateContent(mockArticle);

      // Strict mode should require higher scores
      expect(result).toBeDefined();
    });
  });
});
