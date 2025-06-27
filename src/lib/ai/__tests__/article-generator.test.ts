/**
 * Terry-Style Article Generator Tests
 * Comprehensive test suite for AI-powered article generation
 */

import type { BriefingType } from "@prisma/client";
import OpenAI from "openai";
import type { GenerationInput } from "../article-generator";
import { TerryArticleGenerator } from "../article-generator";
import type { ContentAnalysis } from "../content-analyzer";

// Mock OpenAI
jest.mock("openai");
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

describe("TerryArticleGenerator", () => {
  let generator: TerryArticleGenerator;
  let mockOpenAI: jest.Mocked<OpenAI>;

  const mockContentAnalysis: ContentAnalysis = {
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
      duplicateOf: undefined,
    },
    entities: {
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
      ],
      agents: [],
    },
    sentiment: {
      sentiment: "positive",
      confidence: 0.85,
      emotions: ["excitement", "optimism"],
      reliability: 0.95,
      urgency: 0.8,
    },
    qualityScore: 88,
    terryCompatibility: 75,
    processingTime: 1200,
    aiModel: "gpt-4.1",
  };

  const mockGenerationInput: GenerationInput = {
    briefingType: "MORNING" as BriefingType,
    tweetAnalyses: [mockContentAnalysis],
    briefingDate: new Date("2024-01-15T08:00:00Z"),
    targetWordCount: 800,
    focusClubs: ["Manchester United", "Arsenal"],
  };

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

  // Helper function to setup mocks for article generation
  const setupMocksForGeneration = (numberOfSections = 4) => {
    mockOpenAI.chat.completions.create.mockClear();

    // Mock section generation calls
    for (let i = 0; i < numberOfSections; i++) {
      mockOpenAI.chat.completions.create.mockResolvedValueOnce({
        choices: [{ message: { content: mockSectionContent } }],
      } as any);
    }

    // Mock metadata generation call
    mockOpenAI.chat.completions.create.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(mockMetadataResponse) } }],
    } as any);
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

    generator = new TerryArticleGenerator({
      openaiApiKey: "test-key",
      model: "gpt-4.1",
      terryIntensity: "medium",
    });
  });

  describe("constructor", () => {
    it("should initialize with default configuration", () => {
      const defaultGenerator = new TerryArticleGenerator({
        openaiApiKey: "test-key",
      });
      expect(defaultGenerator).toBeInstanceOf(TerryArticleGenerator);
    });

    it("should initialize with custom configuration", () => {
      const customGenerator = new TerryArticleGenerator({
        openaiApiKey: "test-key",
        model: "gpt-4o",
        maxTokens: 5000,
        temperature: 0.8,
        terryIntensity: "nuclear",
      });
      expect(customGenerator).toBeInstanceOf(TerryArticleGenerator);
    });
  });

  describe("generateArticle", () => {
    it("should generate complete article with all sections", async () => {
      setupMocksForGeneration(4);

      const result = await generator.generateArticle(mockGenerationInput);

      expect(result).toMatchObject({
        title: expect.any(String),
        slug: expect.any(String),
        content: {
          sections: expect.any(Array),
          wordCount: expect.any(Number),
          estimatedReadTime: expect.any(Number),
          terryScore: expect.any(Number),
          qualityMetrics: {
            coherence: expect.any(Number),
            factualAccuracy: expect.any(Number),
            brandVoice: expect.any(Number),
            readability: expect.any(Number),
          },
        },
        summary: expect.any(String),
        metaDescription: expect.any(String),
        tags: expect.any(Array),
        briefingType: "MORNING",
        status: expect.stringMatching(/^(DRAFT|REVIEW)$/),
        qualityScore: expect.any(Number),
        aiModel: "gpt-4.1",
        generationTime: expect.any(Number),
      });

      expect(result.content.sections).toHaveLength(4);
      expect(result.content.wordCount).toBeGreaterThan(0);
      expect(result.content.estimatedReadTime).toBeGreaterThan(0);
    });

    it("should handle multiple tweet analyses", async () => {
      setupMocksForGeneration(5); // More sections for more content

      const multipleAnalyses = [
        mockContentAnalysis,
        {
          ...mockContentAnalysis,
          classification: {
            ...mockContentAnalysis.classification,
            keyPoints: [
              "Arsenal",
              "Gabriel Jesus",
              "£45m",
              "Medical scheduled",
            ],
          },
          entities: {
            ...mockContentAnalysis.entities,
            players: [{ name: "Gabriel Jesus", confidence: 0.9 }],
            clubs: [{ name: "Arsenal", confidence: 0.95 }],
          },
        },
      ];

      const result = await generator.generateArticle({
        ...mockGenerationInput,
        tweetAnalyses: multipleAnalyses,
      });

      expect(result.content.sections.length).toBeGreaterThanOrEqual(4);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });

    it("should set status to REVIEW for high quality articles", async () => {
      setupMocksForGeneration(4);

      const result = await generator.generateArticle(mockGenerationInput);

      if (result.qualityScore >= 85) {
        expect(result.status).toBe("REVIEW");
      } else {
        expect(result.status).toBe("DRAFT");
      }
    });

    it("should handle generation errors gracefully", async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error("API Error"),
      );

      await expect(
        generator.generateArticle(mockGenerationInput),
      ).rejects.toThrow("Article generation failed");
    });

    it("should handle empty content responses", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }],
      } as any);

      await expect(
        generator.generateArticle(mockGenerationInput),
      ).rejects.toThrow("No content generated");
    });
  });

  describe("content prioritization", () => {
    it("should prioritize high-quality transfer content", () => {
      const analyses = [
        { ...mockContentAnalysis, qualityScore: 60, terryCompatibility: 40 },
        { ...mockContentAnalysis, qualityScore: 90, terryCompatibility: 80 },
        { ...mockContentAnalysis, qualityScore: 75, terryCompatibility: 60 },
      ];

      const prioritized = (generator as any).prioritizeContent(analyses);

      expect(prioritized[0].qualityScore).toBe(90);
      expect(prioritized[0].terryCompatibility).toBe(80);
    });

    it("should boost chaotic content in prioritization", () => {
      const chaoticAnalysis = {
        ...mockContentAnalysis,
        qualityScore: 70,
        sentiment: {
          ...mockContentAnalysis.sentiment,
          emotions: ["excitement", "skepticism"],
        },
        entities: {
          ...mockContentAnalysis.entities,
          transferDetails: [{ type: "fee", value: "£200m", confidence: 0.9 }],
        },
        terryCompatibility: 85,
      };

      const normalAnalysis = {
        ...mockContentAnalysis,
        qualityScore: 80,
        terryCompatibility: 50,
      };

      const prioritized = (generator as any).prioritizeContent([
        normalAnalysis,
        chaoticAnalysis,
      ]);

      expect(prioritized[0]).toBe(chaoticAnalysis);
    });

    it("should filter out non-transfer content", () => {
      const analyses = [
        mockContentAnalysis,
        {
          ...mockContentAnalysis,
          classification: {
            ...mockContentAnalysis.classification,
            isTransferRelated: false,
          },
        },
      ];

      const prioritized = (generator as any).prioritizeContent(analyses);

      expect(prioritized).toHaveLength(1);
      expect(prioritized[0].classification.isTransferRelated).toBe(true);
    });

    it("should limit to top 10 pieces of content", () => {
      const analyses = Array(15).fill(mockContentAnalysis);

      const prioritized = (generator as any).prioritizeContent(analyses);

      expect(prioritized).toHaveLength(10);
    });
  });

  describe("article structure planning", () => {
    it("should create proper article structure", () => {
      const analyses = Array(8).fill(mockContentAnalysis);

      const structure = (generator as any).planArticleStructure(
        analyses,
        mockGenerationInput,
      );

      const expectedTypes = [
        "intro",
        "main",
        "context",
        "analysis",
        "conclusion",
      ];
      const actualTypes = structure.map((s) => s.type);

      expectedTypes.forEach((type) => {
        expect(actualTypes).toContain(type);
      });
    });

    it("should omit conclusion for short content", () => {
      const analyses = Array(3).fill(mockContentAnalysis);

      const structure = (generator as any).planArticleStructure(
        analyses,
        mockGenerationInput,
      );

      expect(structure.find((s) => s.type === "conclusion")).toBeUndefined();
    });

    it("should distribute content across sections", () => {
      const analyses = Array(10).fill(mockContentAnalysis);

      const structure = (generator as any).planArticleStructure(
        analyses,
        mockGenerationInput,
      );

      const totalContent = structure.reduce(
        (sum, section) => sum + section.content.length,
        0,
      );
      expect(totalContent).toBe(10);
    });
  });

  describe("section generation", () => {
    it("should generate section with proper structure", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: mockSectionContent } }],
      } as any);

      const section = await (generator as any).generateSection(
        "intro",
        [mockContentAnalysis],
        1,
        mockGenerationInput,
      );

      expect(section).toMatchObject({
        id: "section_intro_1",
        type: "intro",
        title: "The Latest Chaos",
        content: mockSectionContent,
        order: 1,
        sourceTweets: expect.any(Array),
        terryisms: expect.any(Array),
      });
    });

    it("should extract Terry-isms from content", async () => {
      const terryContent =
        "This is properly mental (of course it is) and brilliant chaos.";

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: terryContent } }],
      } as any);

      const section = await (generator as any).generateSection(
        "analysis",
        [mockContentAnalysis],
        1,
        mockGenerationInput,
      );

      expect(section.terryisms).toContain("(of course it is)");
      expect(section.terryisms).toContain("properly");
    });

    it("should handle different section types", async () => {
      const sectionTypes = [
        "intro",
        "main",
        "context",
        "analysis",
        "conclusion",
      ];

      for (const type of sectionTypes) {
        mockOpenAI.chat.completions.create.mockResolvedValue({
          choices: [{ message: { content: mockSectionContent } }],
        } as any);

        const section = await (generator as any).generateSection(
          type,
          [mockContentAnalysis],
          1,
          mockGenerationInput,
        );

        expect(section.type).toBe(type);
        expect(section.title).toBeDefined();
      }
    });
  });

  describe("Terry system prompts", () => {
    it("should generate appropriate system prompts for different sections", () => {
      const introPrompt = (generator as any).getTerrySystemPrompt("intro");
      const analysisPrompt = (generator as any).getTerrySystemPrompt(
        "analysis",
      );

      expect(introPrompt).toContain("INTRO SECTION");
      expect(introPrompt).toContain("Hook readers immediately");
      expect(analysisPrompt).toContain("ANALYSIS SECTION");
      expect(analysisPrompt).toContain("pure Terry");
    });

    it("should include Terry voice characteristics in all prompts", () => {
      const prompt = (generator as any).getTerrySystemPrompt("main");

      expect(prompt).toContain("acerbic");
      expect(prompt).toContain("parenthetical asides");
      expect(prompt).toContain("weaponised irritation");
      expect(prompt).toContain("emotional intelligence");
    });
  });

  describe("section requirements", () => {
    it("should provide word count requirements for each section", () => {
      const introReq = (generator as any).getSectionRequirements("intro");
      const mainReq = (generator as any).getSectionRequirements("main");
      const conclusionReq = (generator as any).getSectionRequirements(
        "conclusion",
      );

      expect(introReq).toContain("150-200 words");
      expect(mainReq).toContain("300-400 words");
      expect(conclusionReq).toContain("100-150 words");
    });

    it("should provide different token limits for sections", () => {
      const introLimit = (generator as any).getSectionTokenLimit("intro");
      const mainLimit = (generator as any).getSectionTokenLimit("main");

      expect(introLimit).toBe(300);
      expect(mainLimit).toBe(500);
      expect(mainLimit).toBeGreaterThan(introLimit);
    });
  });

  describe("metadata generation", () => {
    it("should generate complete metadata", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          { message: { content: JSON.stringify(mockMetadataResponse) } },
        ],
      } as any);

      const sections = [
        {
          id: "section_intro_1",
          type: "intro" as const,
          title: "The Latest Chaos",
          content: mockSectionContent,
          order: 1,
          sourceTweets: ["tweet_1"],
          terryisms: ["(of course)", "properly mental"],
        },
      ];

      const metadata = await (generator as any).generateMetadata(
        sections,
        mockGenerationInput,
      );

      expect(metadata).toMatchObject({
        title: expect.any(String),
        slug: expect.any(String),
        summary: expect.any(String),
        metaDescription: expect.any(String),
        tags: expect.any(Array),
      });
    });

    it("should handle missing metadata fields gracefully", async () => {
      const incompleteMetadata = {
        title: "Test Title",
        summary: "Test summary",
      };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(incompleteMetadata) } }],
      } as any);

      const metadata = await (generator as any).generateMetadata(
        [],
        mockGenerationInput,
      );

      expect(metadata.title).toBe("Test Title");
      expect(metadata.slug).toBe("test-title");
      expect(metadata.tags).toEqual([]);
    });

    it("should handle metadata generation errors", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }],
      } as any);

      await expect(
        (generator as any).generateMetadata([], mockGenerationInput),
      ).rejects.toThrow("No metadata generated");
    });
  });

  describe("Terry-ism extraction", () => {
    it("should extract parenthetical asides", () => {
      const content =
        "This is mental (which it absolutely is) and chaotic (somehow).";

      const terryisms = (generator as any).extractTerryisms(content);

      expect(terryisms).toContain("(which it absolutely is)");
      expect(terryisms).toContain("(somehow)");
    });

    it("should extract Terry phrases", () => {
      const content =
        "Of course this happened, apparently it was brilliant, somehow.";

      const terryisms = (generator as any).extractTerryisms(content);

      expect(terryisms).toContain("of course");
      expect(terryisms).toContain("apparently");
      expect(terryisms).toContain("somehow");
      expect(terryisms).toContain("brilliant");
    });

    it("should deduplicate Terry-isms", () => {
      const content = "Of course this happened, of course it did.";

      const terryisms = (generator as any).extractTerryisms(content);

      expect(terryisms.filter((t) => t === "of course")).toHaveLength(1);
    });
  });

  describe("quality metrics calculation", () => {
    it("should calculate realistic quality metrics", () => {
      const sections = [
        {
          content: "Test content with good length and structure.",
          terryisms: ["(of course)", "brilliant"],
        },
      ];

      const metrics = (generator as any).calculateQualityMetrics(sections);

      expect(metrics.coherence).toBeGreaterThanOrEqual(0);
      expect(metrics.coherence).toBeLessThanOrEqual(100);
      expect(metrics.factualAccuracy).toBeGreaterThanOrEqual(0);
      expect(metrics.factualAccuracy).toBeLessThanOrEqual(100);
      expect(metrics.brandVoice).toBeGreaterThanOrEqual(0);
      expect(metrics.brandVoice).toBeLessThanOrEqual(100);
      expect(metrics.readability).toBeGreaterThanOrEqual(0);
      expect(metrics.readability).toBeLessThanOrEqual(100);
    });

    it("should calculate Terry score based on content", () => {
      const sections = [
        {
          content:
            "This is brilliant and of course it happened (properly mental).",
          terryisms: ["(properly mental)", "of course", "brilliant"],
        },
      ];

      const terryScore = (generator as any).calculateTerryScore(sections);

      expect(terryScore).toBeGreaterThan(0);
      expect(terryScore).toBeLessThanOrEqual(100);
    });

    it("should calculate overall quality from metrics", () => {
      const metrics = {
        coherence: 85,
        factualAccuracy: 90,
        brandVoice: 80,
        readability: 75,
      };

      const overallQuality = (generator as any).calculateOverallQuality(
        metrics,
        80,
      );

      expect(overallQuality).toBeGreaterThan(70);
      expect(overallQuality).toBeLessThanOrEqual(100);
    });
  });

  describe("configuration validation", () => {
    it("should validate API configuration successfully", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: "Test response" } }],
      } as any);

      const result = await generator.validateConfiguration();

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should handle API configuration errors", async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error("Invalid API key"),
      );

      const result = await generator.validateConfiguration();

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Terry-enhanced");
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle empty tweet analyses", async () => {
      await expect(
        generator.generateArticle({
          ...mockGenerationInput,
          tweetAnalyses: [],
        }),
      ).rejects.toThrow();
    });

    it("should handle very short content", async () => {
      setupMocksForGeneration(4);

      const shortContent = "Brief.";
      mockOpenAI.chat.completions.create.mockClear();

      // Mock short responses for all sections
      for (let i = 0; i < 5; i++) {
        const content =
          i < 4 ? shortContent : JSON.stringify(mockMetadataResponse);
        mockOpenAI.chat.completions.create.mockResolvedValueOnce({
          choices: [{ message: { content } }],
        } as any);
      }

      const result = await generator.generateArticle(mockGenerationInput);

      expect(result.content.wordCount).toBeGreaterThan(0);
      expect(result.content.sections).toHaveLength(4);
    });

    it("should handle different briefing types", async () => {
      const briefingTypes: BriefingType[] = [
        "MORNING",
        "AFTERNOON",
        "EVENING",
        "WEEKEND",
        "SPECIAL",
      ];

      for (const briefingType of briefingTypes) {
        setupMocksForGeneration(4);

        const result = await generator.generateArticle({
          ...mockGenerationInput,
          briefingType,
        });

        expect(result.briefingType).toBe(briefingType);
      }
    });
  });
});
