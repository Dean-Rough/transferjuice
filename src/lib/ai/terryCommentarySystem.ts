/**
 * Terry's Continuous Commentary System
 * Generates hourly micro-updates with consistent Joel Golby-style voice
 */

import { type FeedItem } from '@/lib/stores/feedStore';
import {
  type TweetData,
  type ClassificationResult,
} from '@/lib/twitter/transferClassifier';
import { type ITKSource } from '@/lib/twitter/globalSources';

export interface TerryCommentaryConfig {
  enabledTypes: ('itk' | 'terry' | 'breaking' | 'partner')[];
  minConfidenceForCommentary: number;
  maxCommentariesPerHour: number;
  voiceConsistencyThreshold: number; // 0-1, minimum voice consistency score
  breakingNewsCommentaryRate: number; // 0-1, how often to comment on breaking news
  humorIntensity: 'mild' | 'medium' | 'sharp'; // How ascerbic Terry should be
}

export interface TerryCommentaryResult {
  commentary: string;
  voiceConsistencyScore: number;
  humorLevel: 'dry' | 'sarcastic' | 'cutting' | 'withering';
  topics: string[];
  generationTimeMs: number;
  isBreakingNewsComment: boolean;
}

export interface TerryVoiceMetrics {
  ascerbicScore: number; // 0-1, how sharp/cutting the commentary is
  britishHumourScore: number; // 0-1, how authentically British the humour is
  footballKnowledgeScore: number; // 0-1, depth of football insight
  joelGolbyLikenessScore: number; // 0-1, overall similarity to Joel Golby's style
  overallConsistency: number; // 0-1, weighted average of above scores
}

// Default configuration
export const DEFAULT_TERRY_CONFIG: TerryCommentaryConfig = {
  enabledTypes: ['itk', 'breaking'],
  minConfidenceForCommentary: 0.6,
  maxCommentariesPerHour: 8, // Max 8 Terry comments per hour
  voiceConsistencyThreshold: 0.75, // 75% minimum voice consistency
  breakingNewsCommentaryRate: 0.8, // 80% chance to comment on breaking news
  humorIntensity: 'sharp',
};

/**
 * Terry Commentary System Class
 */
export class TerryCommentarySystem {
  private config: TerryCommentaryConfig;
  private hourlyCommentaryCount: number = 0;
  private lastResetTime: Date = new Date();
  private recentCommentaries: string[] = []; // For voice consistency checking

  constructor(config: TerryCommentaryConfig = DEFAULT_TERRY_CONFIG) {
    this.config = config;
  }

  /**
   * Generate Terry commentary for a transfer update
   */
  public async generateCommentary(
    feedItem: FeedItem,
    originalTweet?: TweetData,
    classification?: ClassificationResult
  ): Promise<TerryCommentaryResult | null> {
    // Check if we should generate commentary
    if (!this.shouldGenerateCommentary(feedItem, classification)) {
      return null;
    }

    const startTime = performance.now();

    try {
      // Reset hourly counter if needed
      this.resetHourlyCounterIfNeeded();

      // Generate the commentary
      const commentary = await this.generateTerryComment(
        feedItem,
        originalTweet,
        classification
      );

      // Validate voice consistency
      const voiceMetrics = this.validateVoiceConsistency(commentary);

      // Check if commentary meets quality threshold
      if (
        voiceMetrics.overallConsistency < this.config.voiceConsistencyThreshold
      ) {
        console.log(
          `Terry commentary rejected for low voice consistency: ${voiceMetrics.overallConsistency}`
        );
        return null;
      }

      // Increment hourly counter
      this.hourlyCommentaryCount++;

      // Add to recent commentaries for consistency tracking
      this.recentCommentaries.push(commentary);
      if (this.recentCommentaries.length > 20) {
        this.recentCommentaries.shift(); // Keep last 20 for consistency checking
      }

      const result: TerryCommentaryResult = {
        commentary,
        voiceConsistencyScore: voiceMetrics.overallConsistency,
        humorLevel: this.classifyHumorLevel(commentary),
        topics: this.extractTopics(feedItem, commentary),
        generationTimeMs: Math.round(performance.now() - startTime),
        isBreakingNewsComment: feedItem.type === 'breaking',
      };

      console.log(
        `✍️ Terry commentary generated (${result.humorLevel}): ${commentary.substring(0, 50)}...`
      );
      return result;
    } catch (error) {
      console.error('Failed to generate Terry commentary:', error);
      return null;
    }
  }

  /**
   * Generate Terry's Breaking News commentary (max 2-3 per month)
   */
  public async generateBreakingNewsCommentary(
    feedItem: FeedItem,
    isGenuineDrama: boolean = false
  ): Promise<TerryCommentaryResult | null> {
    if (!isGenuineDrama || feedItem.type !== 'breaking') {
      return null;
    }

    // Check monthly breaking news commentary quota
    if (!this.canGenerateBreakingNewsCommentary()) {
      console.log(
        'Terry breaking news commentary quota reached for this month'
      );
      return null;
    }

    const commentary = await this.generateBreakingNewsComment(feedItem);
    const voiceMetrics = this.validateVoiceConsistency(commentary);

    return {
      commentary,
      voiceConsistencyScore: voiceMetrics.overallConsistency,
      humorLevel: 'cutting',
      topics: this.extractTopics(feedItem, commentary),
      generationTimeMs: 0,
      isBreakingNewsComment: true,
    };
  }

  /**
   * Check if we should generate commentary for this feed item
   */
  private shouldGenerateCommentary(
    feedItem: FeedItem,
    classification?: ClassificationResult
  ): boolean {
    // Check hourly limit
    if (this.hourlyCommentaryCount >= this.config.maxCommentariesPerHour) {
      return false;
    }

    // Check if type is enabled
    if (!this.config.enabledTypes.includes(feedItem.type)) {
      return false;
    }

    // Check confidence threshold
    if (
      classification &&
      classification.confidence < this.config.minConfidenceForCommentary
    ) {
      return false;
    }

    // Breaking news gets higher chance
    if (feedItem.type === 'breaking') {
      return Math.random() < this.config.breakingNewsCommentaryRate;
    }

    // ITK posts get random chance based on priority
    const commentaryChance = {
      breaking: 0.8,
      high: 0.4,
      medium: 0.2,
      low: 0.1,
    };

    return Math.random() < commentaryChance[feedItem.metadata.priority];
  }

  /**
   * Generate the actual Terry commentary using AI
   */
  private async generateTerryComment(
    feedItem: FeedItem,
    originalTweet?: TweetData,
    classification?: ClassificationResult
  ): Promise<string> {
    // In production, this would call OpenAI/Anthropic API
    // For now, return contextual template-based commentary

    const templates = this.getTerryTemplates(feedItem, classification);
    const template = templates[Math.floor(Math.random() * templates.length)];

    // Extract entities for template replacement
    const clubs = feedItem.tags.clubs;
    const players = feedItem.tags.players;
    const source = feedItem.source.name;
    const fee = this.extractFeeFromContent(feedItem.content);
    const transferType = feedItem.metadata.transferType || 'rumour';

    return template
      .replace('{club}', clubs[0] || 'the club')
      .replace('{player}', players[0] || 'the player')
      .replace('{source}', source)
      .replace('{fee}', fee || '£50m')
      .replace('{transferType}', transferType)
      .replace(
        '{reliability}',
        Math.round(feedItem.source.reliability * 100).toString()
      );
  }

  /**
   * Get Terry commentary templates based on context
   */
  private getTerryTemplates(
    feedItem: FeedItem,
    classification?: ClassificationResult
  ): string[] {
    const baseTemplates = {
      // Breaking news templates
      breaking: [
        'Right, {club} spending {fee} on {player} is either genius or the most expensive way to disappoint their fanbase.',
        "BREAKING: {player} to {club} is confirmed, which means we'll get 47 updates about them breathing correctly and walking in a straight line.",
        "{club} have signed {player}, and somewhere a scout is furiously deleting their PowerPoint about 'the one that got away'.",
        "The {player} to {club} deal is done. That's {fee} for someone who'll either be brilliant or end up in the Championship within two years.",
      ],

      // ITK commentary templates
      itk: [
        '"{source}" says {player} to {club} is happening. That\'s the same confidence I have about finding my car keys each morning.',
        "Personal terms agreed between {player} and {club}, which in football means they've successfully negotiated who pays for the fancy coffee machine.",
        '{club} are "confident" about signing {player}. In transfer speak, that\'s anywhere between now and the heat death of the universe.',
        "The {player} medical at {club}'s training ground will be more scrutinized than a space shuttle launch. Probably take longer too.",
        'Payment structure negotiations between clubs is just posh blokes arguing about who pays for what while {player} packs his bags optimistically.',
      ],

      // High reliability source templates
      tier1: [
        '{source} has spoken, so {player} to {club} is basically sorted. {reliability}% reliability means this is happening whether we like it or not.',
        'When {source} says something, football Twitter collectively holds its breath. {player} to {club} is as good as done.',
        "{source} doesn't mess about. If they say {player} is joining {club}, start printing the shirts.",
      ],

      // Low reliability/rumour templates
      rumour: [
        'According to {source}, {player} might join {club}. And according to my horoscope, I might win the lottery.',
        'The {player} to {club} rumour is doing the rounds again. Like a bad penny or a questionable tactical formation.',
        "{source} reckons {player} is {club}-bound. Take that with more salt than you'd put on chips from a questionable seaside chippy.",
      ],

      // Fee-related templates
      bigFee: [
        "{fee} for {player}? That's either shrewd business or the most expensive midlife crisis in football history.",
        "Paying {fee} for {player} is the kind of decision that either looks brilliant in hindsight or ends up on 'worst transfers' lists.",
        "{club} are reportedly willing to pay {fee} for {player}. Someone's definitely having a laugh, question is who.",
      ],

      // Medical templates
      medical: [
        "The medical's tomorrow which means we'll get 47 updates about {player} breathing correctly and walking in a straight line.",
        "{player}'s medical is scheduled, because apparently kicking a ball requires the same scrutiny as astronaut selection.",
        'Medical planned for {player}. In other news, local physiotherapist suddenly very wealthy.',
      ],

      // Personal terms templates
      terms: [
        'Personal terms agreed between {player} and {club}. Contract details being "finalized" is code for "lawyers are about to make this unnecessarily complicated."',
        "{player} has agreed personal terms with {club}. That's the easy bit. Now comes the fun part where clubs argue about add-ons for breathing.",
      ],
    };

    // Return appropriate templates based on context
    if (feedItem.type === 'breaking') {
      return baseTemplates.breaking;
    }

    if (feedItem.source.tier === 1) {
      return baseTemplates.tier1;
    }

    if (feedItem.metadata.transferType === 'medical') {
      return baseTemplates.medical;
    }

    if (feedItem.metadata.transferType === 'personal_terms') {
      return baseTemplates.terms;
    }

    if (
      this.extractFeeFromContent(feedItem.content) &&
      parseFloat(this.extractFeeFromContent(feedItem.content)!) > 50
    ) {
      return baseTemplates.bigFee;
    }

    if (classification && classification.confidence < 0.6) {
      return baseTemplates.rumour;
    }

    return baseTemplates.itk;
  }

  /**
   * Generate special breaking news commentary
   */
  private async generateBreakingNewsComment(
    feedItem: FeedItem
  ): Promise<string> {
    const breakingTemplates = [
      'BREAKING: Football Twitter is about to lose its collective mind over this one.',
      'Right, this is the kind of transfer that makes grown adults argue with strangers on the internet.',
      "Well, that's today's productivity gone. Everyone's about to become a transfer expert.",
      'This is either the deal of the century or the most expensive mistake since someone bought Twitter.',
      'And just like that, every other transfer story becomes irrelevant for the next 48 hours.',
    ];

    return breakingTemplates[
      Math.floor(Math.random() * breakingTemplates.length)
    ];
  }

  /**
   * Validate voice consistency using Terry-specific metrics
   */
  private validateVoiceConsistency(commentary: string): TerryVoiceMetrics {
    // In production, this would use ML models for voice analysis
    // For now, use heuristic-based scoring

    const text = commentary.toLowerCase();

    // Ascerbic/cutting humor indicators
    const ascerbicIndicators = [
      'either',
      'or',
      'question is',
      'probably',
      'apparently',
      'supposedly',
      'basically',
      'just',
      'somewhere',
      'meanwhile',
      'inevitably',
    ];
    const ascerbicScore = Math.min(
      ascerbicIndicators.filter((indicator) => text.includes(indicator))
        .length / 3,
      1.0
    );

    // British humour indicators
    const britishIndicators = [
      'right,',
      'proper',
      'bloody',
      'absolute',
      'quid',
      'brilliant',
      'mental',
      'mad',
      'daft',
      'chippy',
      'seaside',
    ];
    const britishHumourScore = Math.min(
      britishIndicators.filter((indicator) => text.includes(indicator)).length /
        2,
      1.0
    );

    // Football knowledge indicators
    const footballIndicators = [
      'medical',
      'personal terms',
      'add-ons',
      'fee structure',
      'scout',
      'championship',
      'formation',
      'training ground',
      'shirt',
    ];
    const footballKnowledgeScore = Math.min(
      footballIndicators.filter((indicator) => text.includes(indicator))
        .length / 2,
      1.0
    );

    // Joel Golby style indicators (dry, observational, specific cultural references)
    const golbyIndicators = [
      'coffee machine',
      'car keys',
      'horoscope',
      'lottery',
      'astronaut',
      'powerpoint',
      'midlife crisis',
      'space shuttle',
      'productivity',
    ];
    const joelGolbyLikenessScore = Math.min(
      golbyIndicators.filter((indicator) => text.includes(indicator)).length /
        1,
      1.0
    );

    // Calculate weighted overall consistency
    const overallConsistency =
      ascerbicScore * 0.3 +
      britishHumourScore * 0.25 +
      footballKnowledgeScore * 0.25 +
      joelGolbyLikenessScore * 0.2;

    return {
      ascerbicScore,
      britishHumourScore,
      footballKnowledgeScore,
      joelGolbyLikenessScore,
      overallConsistency,
    };
  }

  /**
   * Classify humor level of commentary
   */
  private classifyHumorLevel(
    commentary: string
  ): TerryCommentaryResult['humorLevel'] {
    const text = commentary.toLowerCase();

    // Withering humor (most cutting)
    if (
      text.includes('most expensive') ||
      text.includes('questionable') ||
      text.includes('midlife crisis')
    ) {
      return 'withering';
    }

    // Cutting humor
    if (
      text.includes('either') ||
      text.includes('question is') ||
      text.includes('apparently')
    ) {
      return 'cutting';
    }

    // Sarcastic
    if (
      text.includes('brilliant') ||
      text.includes('confidence') ||
      text.includes('somewhere')
    ) {
      return 'sarcastic';
    }

    // Default to dry
    return 'dry';
  }

  /**
   * Extract topics from feed item and commentary
   */
  private extractTopics(feedItem: FeedItem, commentary: string): string[] {
    const topics: string[] = [];

    // Add transfer-related topics
    if (feedItem.metadata.transferType) {
      topics.push(feedItem.metadata.transferType);
    }

    // Add source reliability topic
    if (feedItem.source.tier === 1) {
      topics.push('tier-1-source');
    } else if (feedItem.source.reliability < 0.7) {
      topics.push('unreliable-source');
    }

    // Add fee-related topics
    const fee = this.extractFeeFromContent(feedItem.content);
    if (fee && parseFloat(fee) > 50) {
      topics.push('big-fee');
    }

    // Add humor topics based on commentary content
    if (commentary.includes('medical')) topics.push('medical-drama');
    if (commentary.includes('personal terms'))
      topics.push('contract-negotiations');
    if (commentary.includes('PowerPoint')) topics.push('scout-humor');

    return topics;
  }

  /**
   * Extract fee amount from content
   */
  private extractFeeFromContent(content: string): string | null {
    // Look for fee patterns like €50M, £30m, $40m, etc.
    const feePattern = /[€£$](\d+)([Mm]|million)/;
    const match = content.match(feePattern);
    return match ? match[1] : null;
  }

  /**
   * Reset hourly commentary counter if needed
   */
  private resetHourlyCounterIfNeeded(): void {
    const now = new Date();
    const hoursSinceReset =
      (now.getTime() - this.lastResetTime.getTime()) / (1000 * 60 * 60);

    if (hoursSinceReset >= 1) {
      this.hourlyCommentaryCount = 0;
      this.lastResetTime = now;
    }
  }

  /**
   * Check if we can generate breaking news commentary (monthly quota)
   */
  private canGenerateBreakingNewsCommentary(): boolean {
    // In production, this would check a persistent store for monthly quota
    // For now, allow up to 3 per month (simplified logic)
    const thisMonth = new Date().getMonth();
    const breakingNewsCountThisMonth = 0; // Would be tracked in persistent storage
    return breakingNewsCountThisMonth < 3;
  }

  /**
   * Get current Terry system status
   */
  public getStatus() {
    return {
      config: this.config,
      hourlyCommentaryCount: this.hourlyCommentaryCount,
      lastResetTime: this.lastResetTime,
      recentCommentariesCount: this.recentCommentaries.length,
      nextResetIn:
        60 -
        Math.floor((Date.now() - this.lastResetTime.getTime()) / (1000 * 60)),
    };
  }

  /**
   * Update Terry system configuration
   */
  public updateConfig(newConfig: Partial<TerryCommentaryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🎭 Updated Terry commentary config:', this.config);
  }

  /**
   * Get Terry's voice consistency analytics
   */
  public getVoiceAnalytics() {
    if (this.recentCommentaries.length === 0) {
      return null;
    }

    const analyses = this.recentCommentaries.map((commentary) =>
      this.validateVoiceConsistency(commentary)
    );

    return {
      averageConsistency:
        analyses.reduce((sum, a) => sum + a.overallConsistency, 0) /
        analyses.length,
      averageAscerbicScore:
        analyses.reduce((sum, a) => sum + a.ascerbicScore, 0) / analyses.length,
      averageBritishHumour:
        analyses.reduce((sum, a) => sum + a.britishHumourScore, 0) /
        analyses.length,
      averageFootballKnowledge:
        analyses.reduce((sum, a) => sum + a.footballKnowledgeScore, 0) /
        analyses.length,
      sampleSize: analyses.length,
    };
  }
}

// Export singleton instance
export const terryCommentarySystem = new TerryCommentarySystem();
