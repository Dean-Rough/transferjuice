/**
 * AI Service Mock Implementation
 * Provides realistic mock responses for OpenAI/Anthropic API calls
 */

import { ContentGenerationRequest } from '@/lib/validations/api';

// Mock AI-generated article content
export const mockArticleContent = {
  title: 'Arsenal Close to Securing Major Transfer Coup',
  subtitle:
    'Multiple sources confirm advanced negotiations for star midfielder',
  summary:
    'Arsenal are reportedly in the final stages of negotiations for a high-profile midfielder, with sources close to the club suggesting a deal could be announced within days. The move represents a significant statement of intent from the Gunners.',
  sections: [
    {
      id: 'intro',
      type: 'intro' as const,
      title: 'Transfer Latest',
      content:
        "The transfer rumour mill has been working overtime today, with Arsenal emerging as serious contenders for one of Europe's most sought-after midfielders. Multiple ITK sources are reporting that the Gunners have moved ahead of their rivals in the race for the signature.",
      sourceTweets: [
        {
          tweetId: 'tweet_001',
          authorHandle: 'FabrizioRomano',
          relevanceScore: 0.95,
          usedInSections: ['intro'],
          quotedDirectly: true,
        },
      ],
      order: 0,
      wordCount: 87,
    },
    {
      id: 'main_story',
      type: 'news_item' as const,
      title: 'Breaking: Deal Structure Revealed',
      content:
        "According to reliable sources, the proposed deal structure includes an initial fee of £105m with performance-related add-ons that could see the total package reach £120m. The player's representatives have reportedly given their approval to the move, with personal terms not expected to be an issue.",
      sourceTweets: [
        {
          tweetId: 'tweet_002',
          authorHandle: 'TransferChecker',
          relevanceScore: 0.88,
          usedInSections: ['main_story'],
          quotedDirectly: false,
        },
      ],
      order: 1,
      wordCount: 156,
    },
    {
      id: 'analysis',
      type: 'analysis' as const,
      title: 'What This Means for Arsenal',
      content:
        "This potential signing would represent a major coup for Arsenal, addressing a key weakness in their midfield while sending a clear message about their ambitions. The player's creativity and work rate would complement Arsenal's existing style perfectly, potentially unlocking new tactical possibilities for the upcoming season.",
      sourceTweets: [],
      order: 2,
      wordCount: 134,
    },
  ],
  tags: ['Arsenal', 'Transfer', 'Midfield', 'Premier League'],
  estimatedReadTime: 3,
  wordCount: 377,
};

// Quality assessment for AI content
export const mockContentQuality = {
  grammarScore: 95,
  readabilityScore: 88,
  brandVoiceScore: 92,
  factualAccuracy: 85,
  engagementPotential: 90,
  overallScore: 90,
  flags: [] as string[],
  humanReviewRequired: false,
};

// Mock AI generation metadata
export const mockAIGeneration = {
  model: 'gpt-4-turbo',
  prompt:
    'Generate a witty Transfer Juice article based on the provided tweets...',
  temperature: 0.7,
  maxTokens: 2000,
  generatedAt: new Date(),
  processingTime: 2500,
  tokenUsage: {
    promptTokens: 850,
    completionTokens: 650,
    totalTokens: 1500,
  },
  qualityChecks: {
    passedAllChecks: true,
    contentFilter: true,
    brandVoiceCheck: true,
    factualityCheck: true,
    grammarCheck: true,
  },
};

// Transfer relevance classification
export const mockTransferRelevance = {
  high: {
    isTransferRelated: true,
    confidence: 0.95,
    keywords: ['signing', 'transfer', 'deal', 'fee', 'medical'],
    entities: {
      players: ['Declan Rice'],
      clubs: ['Arsenal', 'Brighton'],
      agents: ['David Ornstein'],
      journalists: ['Fabrizio Romano'],
    },
    transferType: 'confirmed' as const,
    priority: 'high' as const,
  },
  medium: {
    isTransferRelated: true,
    confidence: 0.75,
    keywords: ['talks', 'interest', 'monitoring'],
    entities: {
      players: ['Jude Bellingham'],
      clubs: ['Manchester United', 'Borussia Dortmund'],
      agents: [],
      journalists: ['Transfer Checker'],
    },
    transferType: 'rumour' as const,
    priority: 'medium' as const,
  },
  low: {
    isTransferRelated: true,
    confidence: 0.45,
    keywords: ['linked', 'could', 'potential'],
    entities: {
      players: ['Unknown Player'],
      clubs: ['Generic FC'],
      agents: [],
      journalists: [],
    },
    transferType: 'rumour' as const,
    priority: 'low' as const,
  },
  notTransfer: {
    isTransferRelated: false,
    confidence: 0.05,
    keywords: ['holiday', 'pasta', 'sunset'],
    entities: {
      players: [],
      clubs: [],
      agents: [],
      journalists: [],
    },
    priority: 'low' as const,
  },
};

// Mock AI service responses with different scenarios
export class MockAIService {
  private shouldThrowError = false;
  private responseDelay = 0;
  private qualityLevel: 'high' | 'medium' | 'low' = 'high';

  constructor() {
    this.reset();
  }

  reset() {
    this.shouldThrowError = false;
    this.responseDelay = 0;
    this.qualityLevel = 'high';
  }

  setError(enabled: boolean) {
    this.shouldThrowError = enabled;
  }

  setResponseDelay(ms: number) {
    this.responseDelay = ms;
  }

  setQualityLevel(level: 'high' | 'medium' | 'low') {
    this.qualityLevel = level;
  }

  async generateArticle(
    request: ContentGenerationRequest
  ): Promise<typeof mockArticleContent> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error('AI service temporarily unavailable');
    }

    // Adjust content quality based on level
    const content = { ...mockArticleContent };

    if (this.qualityLevel === 'medium') {
      content.sections = content.sections.slice(0, 2); // Shorter content
      content.wordCount = 243;
      content.estimatedReadTime = 2;
    } else if (this.qualityLevel === 'low') {
      content.sections = content.sections.slice(0, 1); // Minimal content
      content.wordCount = 87;
      content.estimatedReadTime = 1;
    }

    return content;
  }

  async assessTransferRelevance(
    tweetText: string
  ): Promise<typeof mockTransferRelevance.high> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error('AI service temporarily unavailable');
    }

    // Simple keyword matching for mock
    const transferKeywords = [
      'transfer',
      'signing',
      'deal',
      'fee',
      'medical',
      'here we go',
    ];
    const hasTransferKeywords = transferKeywords.some((keyword) =>
      tweetText.toLowerCase().includes(keyword)
    );

    if (!hasTransferKeywords) {
      return mockTransferRelevance.notTransfer;
    }

    // Determine relevance level based on confidence keywords
    if (
      tweetText.toLowerCase().includes('here we go') ||
      tweetText.toLowerCase().includes('medical')
    ) {
      return mockTransferRelevance.high;
    } else if (
      tweetText.toLowerCase().includes('talks') ||
      tweetText.toLowerCase().includes('advanced')
    ) {
      return mockTransferRelevance.medium;
    } else {
      return mockTransferRelevance.low;
    }
  }

  async validateContentQuality(
    content: string
  ): Promise<typeof mockContentQuality> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error('AI service temporarily unavailable');
    }

    const quality = { ...mockContentQuality };

    // Adjust scores based on quality level
    if (this.qualityLevel === 'medium') {
      quality.grammarScore = 80;
      quality.brandVoiceScore = 75;
      quality.overallScore = 78;
      quality.flags = ['grammar_issues'];
    } else if (this.qualityLevel === 'low') {
      quality.grammarScore = 65;
      quality.readabilityScore = 60;
      quality.brandVoiceScore = 55;
      quality.overallScore = 60;
      quality.flags = ['grammar_issues', 'off_brand'];
      quality.humanReviewRequired = true;
    }

    return quality;
  }

  async generateMetadata(): Promise<typeof mockAIGeneration> {
    return {
      ...mockAIGeneration,
      generatedAt: new Date(),
      processingTime: this.responseDelay || 2500,
    };
  }
}

// Rate limiting simulation
export class MockAIRateLimiter {
  private requestCount = 0;
  private windowStart = Date.now();
  private readonly maxRequests = 100;
  private readonly windowMs = 60000; // 1 minute

  reset() {
    this.requestCount = 0;
    this.windowStart = Date.now();
  }

  async checkLimit(): Promise<boolean> {
    const now = Date.now();

    // Reset window if expired
    if (now - this.windowStart > this.windowMs) {
      this.requestCount = 0;
      this.windowStart = now;
    }

    if (this.requestCount >= this.maxRequests) {
      throw new Error('Rate limit exceeded');
    }

    this.requestCount++;
    return true;
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  getRemainingRequests(): number {
    return Math.max(0, this.maxRequests - this.requestCount);
  }
}

export const mockAIService = new MockAIService();
export const mockAIRateLimiter = new MockAIRateLimiter();
