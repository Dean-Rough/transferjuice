/**
 * AI Pipeline Integration Tests
 * End-to-end testing of the complete AI content processing pipeline
 */

import { AIContentAnalyzer } from "../content-analyzer";
import { TerryArticleGenerator } from "../article-generator";
import { ContentQualityValidator } from "../quality-validator";
import type { TweetInput } from "../content-analyzer";
import type { BriefingType } from "@prisma/client";

// Mock OpenAI
jest.mock("openai");
import OpenAI from "openai";
const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

// Mock terry-style module
jest.mock("@/lib/terry-style", () => ({
  applyTerryStyle: {
    enhanceError: jest.fn((msg: string) => `Terry-enhanced: ${msg}`),
  },
  terryPrompts: {
    articleGeneration: "Mock Terry article generation prompt",
  },
}));

// Mock Prisma client types
jest.mock("@prisma/client", () => ({
  BriefingType: {
    MORNING: "MORNING",
    AFTERNOON: "AFTERNOON",
    EVENING: "EVENING",
    WEEKEND: "WEEKEND",
    SPECIAL: "SPECIAL",
  },
}));

describe("AI Pipeline Integration", () => {
  let analyzer: AIContentAnalyzer;
  let generator: TerryArticleGenerator;
  let validator: ContentQualityValidator;
  let mockOpenAI: jest.Mocked<OpenAI>;

  const mockTweets: TweetInput[] = [
    {
      id: "tweet_123",
      text: "BREAKING: Manchester United are close to signing Declan Rice for £100m after successful medical tests. Agent confirms deal should be completed by Friday.",
      authorHandle: "FabrizioRomano",
      authorName: "Fabrizio Romano",
      authorVerified: true,
      authorTier: "tier1",
      createdAt: new Date("2024-01-15T10:00:00Z"),
      metrics: {
        retweets: 5420,
        likes: 18760,
        replies: 892,
        quotes: 234,
      },
      context: {
        recentTweets: ["Previous transfer update about Rice"],
        authorSpecialties: ["Transfer news", "Premier League"],
      },
    },
    {
      id: "tweet_124",
      text: "Arsenal are monitoring the situation with Gabriel Jesus. Personal terms agreed but fee negotiations ongoing. Medical could happen next week.",
      authorHandle: "David_Ornstein",
      authorName: "David Ornstein",
      authorVerified: true,
      authorTier: "tier1",
      createdAt: new Date("2024-01-15T11:00:00Z"),
      metrics: {
        retweets: 3240,
        likes: 12450,
        replies: 567,
        quotes: 189,
      },
      context: {
        recentTweets: ["Arsenal transfer update"],
        authorSpecialties: ["Arsenal", "Premier League"],
      },
    },
    {
      id: "tweet_125",
      text: "Chelsea are still working on outgoings. Several players expected to leave on loan or permanent deals. Need to clear space for new arrivals.",
      authorHandle: "Matt_Law_DT",
      authorName: "Matt Law",
      authorVerified: true,
      authorTier: "tier2",
      createdAt: new Date("2024-01-15T12:00:00Z"),
      metrics: {
        retweets: 1850,
        likes: 7230,
        replies: 423,
        quotes: 95,
      },
      context: {
        recentTweets: ["Chelsea squad planning"],
        authorSpecialties: ["Chelsea", "Transfer news"],
      },
    },
  ];

  const mockAnalysisResponses = [
    {
      classification: {
        isTransferRelated: true,
        transferType: "CONFIRMED",
        priority: "HIGH",
        confidence: 0.95,
        categories: ["signing", "medical"],
        keyPoints: [
          "Manchester United",
          "Declan Rice",
          "£100m",
          "Medical completed",
        ],
      },
      entities: {
        players: [
          {
            name: "Declan Rice",
            confidence: 0.98,
            position: "Defensive Midfielder",
          },
        ],
        clubs: [
          {
            name: "Manchester United",
            confidence: 0.99,
            league: "Premier League",
          },
        ],
        transferDetails: [{ type: "fee", value: "£100m", confidence: 0.9 }],
        agents: [],
      },
      sentiment: {
        sentiment: "positive",
        confidence: 0.85,
        emotions: ["excitement", "optimism"],
        reliability: 0.95,
        urgency: 0.8,
      },
    },
    {
      classification: {
        isTransferRelated: true,
        transferType: "TALKS",
        priority: "MEDIUM",
        confidence: 0.88,
        categories: ["signing", "negotiation"],
        keyPoints: ["Arsenal", "Gabriel Jesus", "Personal terms agreed"],
      },
      entities: {
        players: [
          { name: "Gabriel Jesus", confidence: 0.95, position: "Forward" },
        ],
        clubs: [
          { name: "Arsenal", confidence: 0.97, league: "Premier League" },
        ],
        transferDetails: [
          { type: "medical_date", value: "next week", confidence: 0.8 },
        ],
        agents: [],
      },
      sentiment: {
        sentiment: "neutral",
        confidence: 0.75,
        emotions: ["optimism"],
        reliability: 0.92,
        urgency: 0.6,
      },
    },
    {
      classification: {
        isTransferRelated: true,
        transferType: "RUMOUR",
        priority: "LOW",
        confidence: 0.75,
        categories: ["departure", "rumour"],
        keyPoints: ["Chelsea", "Outgoings", "Squad planning"],
      },
      entities: {
        players: [],
        clubs: [
          { name: "Chelsea", confidence: 0.95, league: "Premier League" },
        ],
        transferDetails: [],
        agents: [],
      },
      sentiment: {
        sentiment: "neutral",
        confidence: 0.65,
        emotions: [],
        reliability: 0.85,
        urgency: 0.3,
      },
    },
  ];

  const mockSectionContent = `Right, this might be the most cursed transfer saga I've witnessed today, and I've been watching football for longer than I care to admit. Manchester United (currently in their "cautiously optimistic" phase) have finally managed to drag Declan Rice across the finish line for £100m (or roughly the GDP of a small Caribbean island).

The whole medical circus (basically checking he has two legs and a pulse) was completed yesterday, which means we're now in that delightful phase where everyone pretends this was always going to happen (it wasn't) and that £100m represents good value (it doesn't, but here we are).

What this actually means, beyond the obvious financial lunacy, is that United have finally addressed their midfield issues with the sort of decisive action that would make a sloth proud. Rice brings exactly the sort of defensive stability that United have been missing since, oh, approximately 2013.`;

  const mockMetadataResponse = {
    title: "Rice Finally Joins United After £100m Circus",
    slug: "rice-finally-joins-united-after-100m-circus",
    summary:
      "Manchester United complete the signing of Declan Rice for £100m after medical tests.",
    metaDescription:
      "Declan Rice joins Manchester United for £100m in latest transfer madness.",
    tags: ["Manchester United", "Declan Rice", "Transfer", "Premier League"],
  };

  const mockValidationResponses = [
    { score: 88, issues: [] }, // factual accuracy
    { score: 85, issues: [] }, // brand voice
    { score: 95, issues: [] }, // safety
    { score: 92, issues: [] }, // legal
  ];

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

    // Initialize all pipeline components
    analyzer = new AIContentAnalyzer({
      openaiApiKey: "test-key",
      enableCaching: false, // Disable caching for tests
    });

    generator = new TerryArticleGenerator({
      openaiApiKey: "test-key",
      terryIntensity: "medium",
    });

    validator = new ContentQualityValidator({
      openaiApiKey: "test-key",
      strictMode: false,
    });
  });

  describe("Complete Pipeline Flow", () => {
    it("should process tweets through entire pipeline successfully", async () => {
      // Setup mock responses for analysis phase (3 tweets × 3 API calls each)
      for (let i = 0; i < 3; i++) {
        mockOpenAI.chat.completions.create
          .mockResolvedValueOnce({
            choices: [
              {
                message: {
                  content: JSON.stringify(
                    mockAnalysisResponses[i].classification,
                  ),
                },
              },
            ],
          } as any)
          .mockResolvedValueOnce({
            choices: [
              {
                message: {
                  content: JSON.stringify(mockAnalysisResponses[i].entities),
                },
              },
            ],
          } as any)
          .mockResolvedValueOnce({
            choices: [
              {
                message: {
                  content: JSON.stringify(mockAnalysisResponses[i].sentiment),
                },
              },
            ],
          } as any);
      }

      // Setup mock responses for generation phase (2 sections + metadata)
      // With 3 analyses: intro (0-2), main (2-6) → only 2 sections after filtering
      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce({
          choices: [{ message: { content: mockSectionContent } }],
        } as any)
        .mockResolvedValueOnce({
          choices: [{ message: { content: mockSectionContent } }],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(mockMetadataResponse) } },
          ],
        } as any);

      // Setup mock responses for validation phase (4 validation checks)
      for (const response of mockValidationResponses) {
        mockOpenAI.chat.completions.create.mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(response) } }],
        } as any);
      }

      // Step 1: Analyze all tweets
      const analyses = await Promise.all(
        mockTweets.map((tweet) => analyzer.analyzeTweet(tweet)),
      );

      expect(analyses).toHaveLength(3);
      expect(analyses[0].classification.isTransferRelated).toBe(true);
      expect(analyses[0].qualityScore).toBeGreaterThan(0);

      // Step 2: Generate article from analyses
      const article = await generator.generateArticle({
        briefingType: "MORNING" as BriefingType,
        tweetAnalyses: analyses,
        briefingDate: new Date("2024-01-15T08:00:00Z"),
        targetWordCount: 800,
      });

      expect(article.title).toBe(
        "Rice Finally Joins United After £100m Circus",
      );
      expect(article.content.sections).toHaveLength(2); // With 3 analyses: intro + main sections only
      expect(article.content.wordCount).toBeGreaterThan(0);
      expect(article.qualityScore).toBeGreaterThan(0);

      // Step 3: Validate generated article
      const validation = await validator.validateContent(article);

      expect(validation.passed).toBe(true);
      expect(validation.overallScore).toBeGreaterThan(75);
      expect(validation.checks).toHaveLength(6);

      // Verify the complete flow
      expect(validation.blockers).toHaveLength(0);
      expect(validation.requiresHumanReview).toBe(false);
    });

    it("should handle pipeline errors gracefully", async () => {
      // Mock analysis to fail on second tweet
      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify(
                  mockAnalysisResponses[0].classification,
                ),
              },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify(mockAnalysisResponses[0].entities),
              },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify(mockAnalysisResponses[0].sentiment),
              },
            },
          ],
        } as any)
        .mockRejectedValueOnce(new Error("API Error"));

      // Analyze first tweet successfully
      const firstAnalysis = await analyzer.analyzeTweet(mockTweets[0]);
      expect(firstAnalysis).toBeDefined();

      // Second tweet should fail
      await expect(analyzer.analyzeTweet(mockTweets[1])).rejects.toThrow(
        "AI analysis failed",
      );
    });

    it("should filter low-quality content in pipeline", async () => {
      // Setup low-quality analysis responses
      const lowQualityResponses = mockAnalysisResponses.map((response) => ({
        ...response,
        classification: {
          ...response.classification,
          isTransferRelated: false,
          confidence: 0.3,
        },
      }));

      // Mock analysis responses
      for (let i = 0; i < 3; i++) {
        mockOpenAI.chat.completions.create
          .mockResolvedValueOnce({
            choices: [
              {
                message: {
                  content: JSON.stringify(
                    lowQualityResponses[i].classification,
                  ),
                },
              },
            ],
          } as any)
          .mockResolvedValueOnce({
            choices: [
              {
                message: {
                  content: JSON.stringify(lowQualityResponses[i].entities),
                },
              },
            ],
          } as any)
          .mockResolvedValueOnce({
            choices: [
              {
                message: {
                  content: JSON.stringify(lowQualityResponses[i].sentiment),
                },
              },
            ],
          } as any);
      }

      const analyses = await Promise.all(
        mockTweets.map((tweet) => analyzer.analyzeTweet(tweet)),
      );

      // All analyses should be marked as non-transfer related
      expect(analyses.every((a) => !a.classification.isTransferRelated)).toBe(
        true,
      );

      // Generation should fail or produce minimal content with no transfer-related analyses
      await expect(
        generator.generateArticle({
          briefingType: "MORNING" as BriefingType,
          tweetAnalyses: analyses,
          briefingDate: new Date("2024-01-15T08:00:00Z"),
          targetWordCount: 800,
        }),
      ).rejects.toThrow();
    });
  });

  describe("Pipeline Performance", () => {
    it("should complete analysis phase within reasonable time", async () => {
      // Mock fast responses (3 tweets × 3 calls each)
      for (let i = 0; i < 3; i++) {
        mockOpenAI.chat.completions.create
          .mockResolvedValueOnce({
            choices: [
              {
                message: {
                  content: JSON.stringify(
                    mockAnalysisResponses[i].classification,
                  ),
                },
              },
            ],
          } as any)
          .mockResolvedValueOnce({
            choices: [
              {
                message: {
                  content: JSON.stringify(mockAnalysisResponses[i].entities),
                },
              },
            ],
          } as any)
          .mockResolvedValueOnce({
            choices: [
              {
                message: {
                  content: JSON.stringify(mockAnalysisResponses[i].sentiment),
                },
              },
            ],
          } as any);
      }

      const startTime = Date.now();

      const analyses = await Promise.all(
        mockTweets.map((tweet) => analyzer.analyzeTweet(tweet)),
      );

      const processingTime = Date.now() - startTime;

      expect(analyses).toHaveLength(3);
      expect(processingTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it("should handle concurrent analysis requests", async () => {
      // Mock responses for concurrent requests (5 tweets × 3 calls each)
      for (let i = 0; i < 5; i++) {
        const responseIndex = i % 3; // Cycle through our 3 response templates
        mockOpenAI.chat.completions.create
          .mockResolvedValueOnce({
            choices: [
              {
                message: {
                  content: JSON.stringify(
                    mockAnalysisResponses[responseIndex].classification,
                  ),
                },
              },
            ],
          } as any)
          .mockResolvedValueOnce({
            choices: [
              {
                message: {
                  content: JSON.stringify(
                    mockAnalysisResponses[responseIndex].entities,
                  ),
                },
              },
            ],
          } as any)
          .mockResolvedValueOnce({
            choices: [
              {
                message: {
                  content: JSON.stringify(
                    mockAnalysisResponses[responseIndex].sentiment,
                  ),
                },
              },
            ],
          } as any);
      }

      // Create more tweets for concurrent testing
      const manyTweets = Array(5)
        .fill(mockTweets[0])
        .map((tweet, i) => ({
          ...tweet,
          id: `tweet_${i}`,
        }));

      const analyses = await Promise.all(
        manyTweets.map((tweet) => analyzer.analyzeTweet(tweet)),
      );

      expect(analyses).toHaveLength(5);
      expect(analyses.every((a) => a.processingTime >= 0)).toBe(true);
    });
  });

  describe("Pipeline Quality Assurance", () => {
    it("should maintain quality standards throughout pipeline", async () => {
      // Setup high-quality responses
      const highQualityResponses = mockAnalysisResponses.map((response) => ({
        ...response,
        classification: {
          ...response.classification,
          confidence: 0.95,
        },
        sentiment: {
          ...response.sentiment,
          reliability: 0.95,
        },
      }));

      // Mock analysis responses
      for (let i = 0; i < 9; i++) {
        const responseIndex = Math.floor(i / 3);
        const callType = i % 3;
        const responseData =
          callType === 0
            ? highQualityResponses[responseIndex].classification
            : callType === 1
              ? highQualityResponses[responseIndex].entities
              : highQualityResponses[responseIndex].sentiment;

        mockOpenAI.chat.completions.create.mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(responseData) } }],
        } as any);
      }

      // Mock generation responses (2 sections + metadata for 3 analyses)
      for (let i = 0; i < 3; i++) {
        const content =
          i < 2 ? mockSectionContent : JSON.stringify(mockMetadataResponse);
        mockOpenAI.chat.completions.create.mockResolvedValueOnce({
          choices: [{ message: { content } }],
        } as any);
      }

      // Mock validation responses (high scores)
      const highQualityValidation = mockValidationResponses.map((r) => ({
        ...r,
        score: r.score + 5,
      }));
      for (const response of highQualityValidation) {
        mockOpenAI.chat.completions.create.mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(response) } }],
        } as any);
      }

      const analyses = await Promise.all(
        mockTweets.map((tweet) => analyzer.analyzeTweet(tweet)),
      );

      const article = await generator.generateArticle({
        briefingType: "MORNING" as BriefingType,
        tweetAnalyses: analyses,
        briefingDate: new Date("2024-01-15T08:00:00Z"),
        targetWordCount: 800,
      });

      const validation = await validator.validateContent(article);

      // Verify reasonable quality throughout (with mock data)
      expect(analyses.every((a) => a.qualityScore > 60)).toBe(true);
      expect(article.qualityScore).toBeGreaterThan(70);
      expect(validation.overallScore).toBeGreaterThan(75);
      expect(validation.passed).toBe(true);
    });

    it("should catch quality issues at validation stage", async () => {
      // Setup analysis and generation with normal responses
      for (let i = 0; i < 9; i++) {
        const responseIndex = Math.floor(i / 3);
        const callType = i % 3;
        const responseData =
          callType === 0
            ? mockAnalysisResponses[responseIndex].classification
            : callType === 1
              ? mockAnalysisResponses[responseIndex].entities
              : mockAnalysisResponses[responseIndex].sentiment;

        mockOpenAI.chat.completions.create.mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(responseData) } }],
        } as any);
      }

      for (let i = 0; i < 3; i++) {
        const content =
          i < 2 ? mockSectionContent : JSON.stringify(mockMetadataResponse);
        mockOpenAI.chat.completions.create.mockResolvedValueOnce({
          choices: [{ message: { content } }],
        } as any);
      }

      // Mock validation with quality issues
      const lowQualityValidation = [
        {
          score: 60,
          issues: [
            {
              severity: "high",
              type: "accuracy",
              description: "Factual issues found",
            },
          ],
        },
        {
          score: 55,
          issues: [
            {
              severity: "medium",
              type: "voice",
              description: "Off-brand content",
            },
          ],
        },
        {
          score: 40,
          issues: [
            {
              severity: "critical",
              type: "safety",
              description: "Content safety violation",
            },
          ],
        },
        { score: 70, issues: [] },
      ];

      for (const response of lowQualityValidation) {
        mockOpenAI.chat.completions.create.mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(response) } }],
        } as any);
      }

      const analyses = await Promise.all(
        mockTweets.map((tweet) => analyzer.analyzeTweet(tweet)),
      );

      const article = await generator.generateArticle({
        briefingType: "MORNING" as BriefingType,
        tweetAnalyses: analyses,
        briefingDate: new Date("2024-01-15T08:00:00Z"),
        targetWordCount: 800,
      });

      const validation = await validator.validateContent(article);

      // Should catch quality issues
      expect(validation.passed).toBe(false);
      expect(validation.requiresHumanReview).toBe(true);
      expect(validation.blockers.length).toBeGreaterThan(0);
      expect(validation.overallScore).toBeLessThan(75);
    });
  });

  describe("Pipeline Edge Cases", () => {
    it("should handle mixed quality tweet analyses", async () => {
      // Mix of high and low quality responses
      const mixedResponses = [
        { ...mockAnalysisResponses[0] }, // High quality
        {
          ...mockAnalysisResponses[1],
          classification: {
            ...mockAnalysisResponses[1].classification,
            isTransferRelated: false,
          },
        }, // Low quality
        { ...mockAnalysisResponses[2] }, // Medium quality
      ];

      // Mock analysis responses
      for (let i = 0; i < 9; i++) {
        const responseIndex = Math.floor(i / 3);
        const callType = i % 3;
        const responseData =
          callType === 0
            ? mixedResponses[responseIndex].classification
            : callType === 1
              ? mixedResponses[responseIndex].entities
              : mixedResponses[responseIndex].sentiment;

        mockOpenAI.chat.completions.create.mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify(responseData) } }],
        } as any);
      }

      const analyses = await Promise.all(
        mockTweets.map((tweet) => analyzer.analyzeTweet(tweet)),
      );

      // Should filter out non-transfer content in generator
      const transferAnalyses = analyses.filter(
        (a) => a.classification.isTransferRelated,
      );
      expect(transferAnalyses.length).toBeLessThan(analyses.length);
    });

    it("should handle empty or minimal content gracefully", async () => {
      const minimalTweet = {
        ...mockTweets[0],
        text: "Yes.",
        metrics: { retweets: 0, likes: 1, replies: 0, quotes: 0 },
      };

      // Mock minimal response
      const minimalResponse = {
        classification: {
          isTransferRelated: false,
          priority: "LOW",
          confidence: 0.1,
          categories: [],
          keyPoints: [],
        },
        entities: { players: [], clubs: [], transferDetails: [], agents: [] },
        sentiment: {
          sentiment: "neutral",
          confidence: 0.3,
          emotions: [],
          reliability: 0.2,
          urgency: 0.1,
        },
      };

      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify(minimalResponse.classification),
              },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(minimalResponse.entities) } },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(minimalResponse.sentiment) } },
          ],
        } as any);

      const analysis = await analyzer.analyzeTweet(minimalTweet);

      expect(analysis.qualityScore).toBeLessThan(50);
      expect(analysis.classification.isTransferRelated).toBe(false);
    });
  });

  describe("Configuration and Error Recovery", () => {
    it("should validate all component configurations", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: "Test response" } }],
      } as any);

      const [analyzerValid, generatorValid, validatorValid] = await Promise.all(
        [
          analyzer.validateConfiguration(),
          generator.validateConfiguration(),
          validator.validateConfiguration(),
        ],
      );

      expect(analyzerValid.valid).toBe(true);
      expect(generatorValid.valid).toBe(true);
      expect(validatorValid.valid).toBe(true);
    });

    it("should handle component configuration failures", async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error("Invalid API key"),
      );

      const [analyzerValid, generatorValid, validatorValid] = await Promise.all(
        [
          analyzer.validateConfiguration(),
          generator.validateConfiguration(),
          validator.validateConfiguration(),
        ],
      );

      expect(analyzerValid.valid).toBe(false);
      expect(generatorValid.valid).toBe(false);
      expect(validatorValid.valid).toBe(false);
    });
  });
});
