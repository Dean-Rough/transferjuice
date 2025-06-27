/**
 * AI Content Analyzer Tests
 * Comprehensive test suite for tweet analysis and content classification
 */

import OpenAI from "openai";
import type { TweetInput } from "../content-analyzer";
import { AIContentAnalyzer } from "../content-analyzer";

// Mock OpenAI
jest.mock("openai");
const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

// Mock terry-style module
jest.mock("@/lib/terry-style", () => ({
  applyTerryStyle: {
    enhanceError: jest.fn((msg: string) => `Terry-enhanced: ${msg}`),
  },
}));

describe("AIContentAnalyzer", () => {
  let analyzer: AIContentAnalyzer;
  let mockOpenAI: jest.Mocked<OpenAI>;

  const mockTweetInput: TweetInput = {
    id: "tweet_123",
    text: "Manchester United are close to signing Declan Rice for £100m after successful medical tests. Agent confirms deal should be completed by Friday.",
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
  };

  const mockClassificationResponse = {
    isTransferRelated: true,
    transferType: "ADVANCED",
    priority: "HIGH",
    confidence: 0.95,
    categories: ["signing", "medical", "fee_discussion"],
    keyPoints: [
      "Manchester United",
      "Declan Rice",
      "£100m fee",
      "Medical completed",
    ],
    duplicateOf: undefined,
  };

  const mockEntityResponse = {
    players: [
      {
        name: "Declan Rice",
        confidence: 0.98,
        position: "Defensive Midfielder",
        currentClub: "West Ham United",
        nationality: "England",
      },
    ],
    clubs: [
      {
        name: "Manchester United",
        confidence: 0.99,
        league: "Premier League",
        country: "England",
      },
    ],
    transferDetails: [
      {
        type: "fee",
        value: "£100m",
        confidence: 0.9,
      },
      {
        type: "medical_date",
        value: "completed",
        confidence: 0.85,
      },
    ],
    agents: [
      {
        name: undefined,
        company: undefined,
        confidence: 0.6,
      },
    ],
  };

  const mockSentimentResponse = {
    sentiment: "positive",
    confidence: 0.85,
    emotions: ["excitement", "optimism"],
    reliability: 0.95,
    urgency: 0.8,
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

    analyzer = new AIContentAnalyzer({
      openaiApiKey: "test-key",
      model: "gpt-4.1",
      enableCaching: true,
    });
  });

  describe("constructor", () => {
    it("should initialize with default configuration", () => {
      const defaultAnalyzer = new AIContentAnalyzer({
        openaiApiKey: "test-key",
      });
      expect(defaultAnalyzer).toBeInstanceOf(AIContentAnalyzer);
    });

    it("should initialize with custom configuration", () => {
      const customAnalyzer = new AIContentAnalyzer({
        openaiApiKey: "test-key",
        model: "gpt-4o",
        maxTokens: 2000,
        temperature: 0.5,
        enableCaching: false,
      });
      expect(customAnalyzer).toBeInstanceOf(AIContentAnalyzer);
    });
  });

  describe("analyzeTweet", () => {
    beforeEach(() => {
      // Mock successful API responses
      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: { content: JSON.stringify(mockClassificationResponse) },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(mockEntityResponse) } },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(mockSentimentResponse) } },
          ],
        } as any);
    });

    it("should analyze tweet successfully with all components", async () => {
      const result = await analyzer.analyzeTweet(mockTweetInput);

      expect(result).toMatchObject({
        classification: mockClassificationResponse,
        entities: mockEntityResponse,
        sentiment: mockSentimentResponse,
        qualityScore: expect.any(Number),
        terryCompatibility: expect.any(Number),
        processingTime: expect.any(Number),
        aiModel: "gpt-4.1",
      });

      // Verify API was called three times (classification, entities, sentiment)
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(3);
    });

    it("should return cached result on subsequent calls", async () => {
      // First call
      await analyzer.analyzeTweet(mockTweetInput);

      // Second call should use cache
      const result = await analyzer.analyzeTweet(mockTweetInput);

      expect(result).toBeDefined();
      // Should still be called 3 times from first call only
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(3);
    });

    it("should calculate quality score correctly for tier1 author", async () => {
      const result = await analyzer.analyzeTweet(mockTweetInput);

      // Tier1 + verified + high confidence should give high quality score
      expect(result.qualityScore).toBeGreaterThan(80);
    });

    it("should calculate Terry compatibility score for chaotic content", async () => {
      const chaoticInput = {
        ...mockTweetInput,
        text: "This mental transfer saga involves £200m and proper chaos at the club!",
      };

      const result = await analyzer.analyzeTweet(chaoticInput);

      // Should get bonus points for "mental" and "chaos"
      expect(result.terryCompatibility).toBeGreaterThan(20);
    });

    it("should handle API errors gracefully", async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error("API Error"),
      );

      await expect(analyzer.analyzeTweet(mockTweetInput)).rejects.toThrow(
        "AI analysis failed",
      );
    });

    it("should handle invalid JSON responses", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: "invalid json" } }],
      } as any);

      await expect(analyzer.analyzeTweet(mockTweetInput)).rejects.toThrow();
    });

    it("should handle empty API responses", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }],
      } as any);

      await expect(analyzer.analyzeTweet(mockTweetInput)).rejects.toThrow(
        "No response from AI",
      );
    });
  });

  describe("classifyContent", () => {
    it("should classify transfer-related content correctly", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(mockClassificationResponse) } },
        ],
      } as any);

      const result = await (analyzer as any).classifyContent(mockTweetInput);

      expect(result).toMatchObject(mockClassificationResponse);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gpt-4.1",
          response_format: { type: "json_object" },
        }),
      );
    });

    it("should handle non-transfer content", async () => {
      const nonTransferResponse = {
        ...mockClassificationResponse,
        isTransferRelated: false,
        transferType: undefined,
        priority: "LOW",
      };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(nonTransferResponse) } },
        ],
      } as any);

      const result = await (analyzer as any).classifyContent({
        ...mockTweetInput,
        text: "Great goal by Messi in today's match!",
      });

      expect(result.isTransferRelated).toBe(false);
      expect(result.priority).toBe("LOW");
    });
  });

  describe("extractEntities", () => {
    it("should extract players, clubs, and transfer details", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockEntityResponse) } }],
      } as any);

      const result = await (analyzer as any).extractEntities(mockTweetInput);

      expect(result.players).toHaveLength(1);
      expect(result.players[0].name).toBe("Declan Rice");
      expect(result.clubs).toHaveLength(1);
      expect(result.clubs[0].name).toBe("Manchester United");
      expect(result.transferDetails).toHaveLength(2);
    });

    it("should handle empty entity responses", async () => {
      const emptyResponse = {
        players: [],
        clubs: [],
        transferDetails: [],
        agents: [],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(emptyResponse) } }],
      } as any);

      const result = await (analyzer as any).extractEntities(mockTweetInput);

      expect(result.players).toHaveLength(0);
      expect(result.clubs).toHaveLength(0);
      expect(result.transferDetails).toHaveLength(0);
    });
  });

  describe("analyzeSentiment", () => {
    it("should analyze sentiment and reliability correctly", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(mockSentimentResponse) } },
        ],
      } as any);

      const result = await (analyzer as any).analyzeSentiment(mockTweetInput);

      expect(result.sentiment).toBe("positive");
      expect(result.confidence).toBe(0.85);
      expect(result.emotions).toContain("excitement");
      expect(result.reliability).toBe(0.95);
      expect(result.urgency).toBe(0.8);
    });

    it("should handle negative sentiment correctly", async () => {
      const negativeSentimentResponse = {
        sentiment: "negative",
        confidence: 0.9,
        emotions: ["disappointment", "anxiety"],
        reliability: 0.8,
        urgency: 0.3,
      };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(negativeSentimentResponse) } },
        ],
      } as any);

      const result = await (analyzer as any).analyzeSentiment({
        ...mockTweetInput,
        text: "Deal collapsed! Manchester United failed to sign the player.",
      });

      expect(result.sentiment).toBe("negative");
      expect(result.emotions).toContain("disappointment");
    });
  });

  describe("quality scoring", () => {
    it("should score tier1 verified authors highly", () => {
      const score = (analyzer as any).calculateQualityScore(
        mockClassificationResponse,
        mockEntityResponse,
        mockSentimentResponse,
        mockTweetInput,
      );

      expect(score).toBeGreaterThan(70);
    });

    it("should score tier3 unverified authors lower", () => {
      const tier3Input = {
        ...mockTweetInput,
        authorTier: "tier3" as const,
        authorVerified: false,
      };

      const score = (analyzer as any).calculateQualityScore(
        mockClassificationResponse,
        mockEntityResponse,
        mockSentimentResponse,
        tier3Input,
      );

      expect(score).toBeLessThan(60);
    });

    it("should boost score for specific entities", () => {
      const richEntityResponse = {
        ...mockEntityResponse,
        players: [
          { name: "Player 1", confidence: 0.9 },
          { name: "Player 2", confidence: 0.8 },
        ],
        clubs: [
          { name: "Club 1", confidence: 0.95 },
          { name: "Club 2", confidence: 0.85 },
        ],
      };

      const score = (analyzer as any).calculateQualityScore(
        mockClassificationResponse,
        richEntityResponse,
        mockSentimentResponse,
        mockTweetInput,
      );

      expect(score).toBeGreaterThan(75);
    });
  });

  describe("Terry compatibility scoring", () => {
    it("should score chaotic content higher", () => {
      const chaoticSentiment = {
        ...mockSentimentResponse,
        emotions: ["excitement", "skepticism", "anxiety"],
      };

      const chaoticEntities = {
        ...mockEntityResponse,
        transferDetails: [
          { type: "fee", value: "£200m", confidence: 0.9 },
          { type: "wage", value: "£500k per week", confidence: 0.8 },
        ],
      };

      const chaoticInput = {
        ...mockTweetInput,
        text: "This mental transfer chaos involves £200m and proper mayhem!",
      };

      const score = (analyzer as any).calculateTerryCompatibility(
        chaoticInput,
        chaoticSentiment,
        chaoticEntities,
      );

      expect(score).toBeGreaterThan(50);
    });

    it("should score big fees higher", () => {
      const bigFeeEntities = {
        ...mockEntityResponse,
        transferDetails: [{ type: "fee", value: "£150m", confidence: 0.9 }],
      };

      const score = (analyzer as any).calculateTerryCompatibility(
        mockTweetInput,
        mockSentimentResponse,
        bigFeeEntities,
      );

      expect(score).toBeGreaterThan(30);
    });
  });

  describe("cache management", () => {
    it("should generate consistent cache keys", () => {
      const key1 = (analyzer as any).generateCacheKey(mockTweetInput);
      const key2 = (analyzer as any).generateCacheKey(mockTweetInput);

      expect(key1).toBe(key2);
      expect(key1).toContain(mockTweetInput.id);
      expect(key1).toContain(mockTweetInput.authorHandle);
    });

    it("should clear cache successfully", () => {
      analyzer.clearCache();

      const stats = analyzer.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it("should return cache statistics", () => {
      const stats = analyzer.getCacheStats();

      expect(stats).toHaveProperty("size");
      expect(stats).toHaveProperty("hitRate");
      expect(typeof stats.size).toBe("number");
      expect(typeof stats.hitRate).toBe("number");
    });
  });

  describe("configuration validation", () => {
    it("should validate API configuration successfully", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: "Test response" } }],
      } as any);

      const result = await analyzer.validateConfiguration();

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should handle API configuration errors", async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error("Invalid API key"),
      );

      const result = await analyzer.validateConfiguration();

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Terry-enhanced");
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle tweets with minimal content", async () => {
      const minimalTweet = {
        ...mockTweetInput,
        text: "Yes.",
        metrics: {
          retweets: 0,
          likes: 1,
          replies: 0,
          quotes: 0,
        },
      };

      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  ...mockClassificationResponse,
                  isTransferRelated: false,
                  confidence: 0.1,
                }),
              },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  players: [],
                  clubs: [],
                  transferDetails: [],
                  agents: [],
                }),
              },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  sentiment: "neutral",
                  confidence: 0.5,
                  emotions: [],
                  reliability: 0.2,
                  urgency: 0.1,
                }),
              },
            },
          ],
        } as any);

      const result = await analyzer.analyzeTweet(minimalTweet);

      expect(result.qualityScore).toBeLessThan(50);
      expect(result.terryCompatibility).toBeLessThan(20);
    });

    it("should handle tweets with special characters and emojis", async () => {
      const emojiTweet = {
        ...mockTweetInput,
        text: "🚨 BREAKING: Manchester United 🔴 are close to signing Declan Rice! 💰£100m deal 📝✅",
      };

      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: { content: JSON.stringify(mockClassificationResponse) },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(mockEntityResponse) } },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(mockSentimentResponse) } },
          ],
        } as any);

      const result = await analyzer.analyzeTweet(emojiTweet);

      expect(result).toBeDefined();
      expect(result.classification.isTransferRelated).toBe(true);
    });

    it("should handle very long tweets", async () => {
      const longTweet = {
        ...mockTweetInput,
        text:
          "Manchester United ".repeat(50) +
          "are signing Declan Rice for £100m.",
      };

      mockOpenAI.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: { content: JSON.stringify(mockClassificationResponse) },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(mockEntityResponse) } },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            { message: { content: JSON.stringify(mockSentimentResponse) } },
          ],
        } as any);

      const result = await analyzer.analyzeTweet(longTweet);

      expect(result).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    });
  });

  describe("prompt building", () => {
    it("should build classification prompt with all context", () => {
      const prompt = (analyzer as any).buildClassificationPrompt(
        mockTweetInput,
      );

      expect(prompt).toContain(mockTweetInput.text);
      expect(prompt).toContain(mockTweetInput.authorHandle);
      expect(prompt).toContain(mockTweetInput.authorName);
      expect(prompt).toContain(mockTweetInput.authorTier);
      expect(prompt).toContain("Verified: true");
      expect(prompt).toContain("Transfer news");
    });

    it("should build entity extraction prompt correctly", () => {
      const prompt = (analyzer as any).buildEntityExtractionPrompt(
        mockTweetInput,
      );

      expect(prompt).toContain("Extract Football Entities");
      expect(prompt).toContain(mockTweetInput.text);
      expect(prompt).toContain(mockTweetInput.authorHandle);
      expect(prompt).toContain(mockTweetInput.authorTier);
    });

    it("should build sentiment analysis prompt correctly", () => {
      const prompt = (analyzer as any).buildSentimentPrompt(mockTweetInput);

      expect(prompt).toContain("Sentiment Analysis Request");
      expect(prompt).toContain(mockTweetInput.text);
      expect(prompt).toContain(`Verified: ${mockTweetInput.authorVerified}`);
      expect(prompt).toContain(`Tier: ${mockTweetInput.authorTier}`);
    });
  });
});
