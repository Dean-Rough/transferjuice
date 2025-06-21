/**
 * Terry Commentary Integration
 * Connects Terry's system with global monitoring and feed store
 */

// TODO: Fix circular dependency with feedStore
// import { useFeedStore, type FeedItem } from '@/lib/stores/feedStore';

// Temporary type to avoid circular dependency
interface FeedItem {
  id: string;
  type: 'itk' | 'terry' | 'partner' | 'breaking';
  content: string;
  timestamp: Date;
  terryCommentary?: string;
  source: {
    name: string;
    handle?: string;
    tier: 1 | 2 | 3;
    reliability: number;
    region?: 'UK' | 'ES' | 'IT' | 'FR' | 'DE' | 'BR' | 'GLOBAL';
  };
  tags: {
    clubs: string[];
    players: string[];
    sources: string[];
  };
  metadata: {
    transferType?: 'signing' | 'rumour' | 'medical' | 'confirmed' | 'bid' | 'personal_terms';
    priority: 'low' | 'medium' | 'high' | 'breaking';
    relevanceScore: number;
    league?: 'PL' | 'LaLiga' | 'SerieA' | 'Bundesliga' | 'Ligue1' | 'Other';
    originalUrl?: string;
    attribution?: string;
  };
}
import {
  TerryCommentarySystem,
  type TerryCommentaryResult,
  type TerryCommentaryConfig,
  DEFAULT_TERRY_CONFIG,
} from './terryCommentarySystem';
import {
  type TweetData,
  type ClassificationResult,
} from '@/lib/twitter/transferClassifier';
import { type ITKSource } from '@/lib/twitter/globalSources';

export interface TerryIntegrationConfig extends TerryCommentaryConfig {
  enableRealTimeCommentary: boolean;
  enableBatchCommentary: boolean;
  commentaryDelay: number; // Delay in minutes before adding commentary
  retryFailedCommentary: boolean;
  maxRetries: number;
}

export interface TerryProcessingStats {
  totalItemsProcessed: number;
  commentariesGenerated: number;
  commentarySuccessRate: number;
  averageGenerationTime: number;
  voiceConsistencyAverage: number;
  rejectionsLowQuality: number;
  rejectionsQuotaExceeded: number;
}

// Default integration configuration
export const DEFAULT_INTEGRATION_CONFIG: TerryIntegrationConfig = {
  ...DEFAULT_TERRY_CONFIG,
  enableRealTimeCommentary: true,
  enableBatchCommentary: true,
  commentaryDelay: 2, // 2-minute delay for natural feel
  retryFailedCommentary: true,
  maxRetries: 2,
};

/**
 * Terry Commentary Integration Class
 */
export class TerryIntegration {
  private terrySystem: TerryCommentarySystem;
  private config: TerryIntegrationConfig;
  private processingStats: TerryProcessingStats;
  private pendingCommentary: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: TerryIntegrationConfig = DEFAULT_INTEGRATION_CONFIG) {
    this.config = config;
    this.terrySystem = new TerryCommentarySystem(config);
    this.processingStats = this.initializeStats();
  }

  /**
   * Process a new feed item for potential Terry commentary
   */
  public async processFeedItem(
    feedItem: FeedItem,
    originalTweet?: TweetData,
    classification?: ClassificationResult,
    source?: ITKSource
  ): Promise<boolean> {
    if (!this.config.enableRealTimeCommentary) {
      return false;
    }

    this.processingStats.totalItemsProcessed++;

    try {
      // Add delay for natural commentary timing
      if (this.config.commentaryDelay > 0) {
        const timeoutId = setTimeout(
          async () => {
            await this.generateAndAddCommentary(
              feedItem,
              originalTweet,
              classification
            );
            this.pendingCommentary.delete(feedItem.id);
          },
          this.config.commentaryDelay * 60 * 1000
        );

        this.pendingCommentary.set(feedItem.id, timeoutId);
        return true;
      } else {
        // Immediate commentary
        return await this.generateAndAddCommentary(
          feedItem,
          originalTweet,
          classification
        );
      }
    } catch (error) {
      console.error(
        `Failed to process feed item ${feedItem.id} for Terry commentary:`,
        error
      );
      return false;
    }
  }

  /**
   * Generate and add Terry commentary to a feed item
   */
  private async generateAndAddCommentary(
    feedItem: FeedItem,
    originalTweet?: TweetData,
    classification?: ClassificationResult,
    retryCount: number = 0
  ): Promise<boolean> {
    try {
      const commentaryResult = await this.terrySystem.generateCommentary(
        feedItem,
        originalTweet,
        classification
      );

      if (!commentaryResult) {
        // Commentary generation was skipped (quota, quality, etc.)
        if (commentaryResult === null && retryCount === 0) {
          this.processingStats.rejectionsQuotaExceeded++;
        }
        return false;
      }

      // Check voice quality
      if (
        commentaryResult.voiceConsistencyScore <
        this.config.voiceConsistencyThreshold
      ) {
        this.processingStats.rejectionsLowQuality++;

        // Retry if enabled and under retry limit
        if (
          this.config.retryFailedCommentary &&
          retryCount < this.config.maxRetries
        ) {
          console.log(
            `Retrying Terry commentary for ${feedItem.id} (attempt ${retryCount + 1})`
          );
          return await this.generateAndAddCommentary(
            feedItem,
            originalTweet,
            classification,
            retryCount + 1
          );
        }

        return false;
      }

      // Add commentary to feed item
      await this.addCommentaryToFeedItem(feedItem.id, commentaryResult);

      // Update stats
      this.processingStats.commentariesGenerated++;
      this.processingStats.averageGenerationTime =
        (this.processingStats.averageGenerationTime *
          (this.processingStats.commentariesGenerated - 1) +
          commentaryResult.generationTimeMs) /
        this.processingStats.commentariesGenerated;
      this.processingStats.voiceConsistencyAverage =
        (this.processingStats.voiceConsistencyAverage *
          (this.processingStats.commentariesGenerated - 1) +
          commentaryResult.voiceConsistencyScore) /
        this.processingStats.commentariesGenerated;

      console.log(
        `✅ Terry commentary added to ${feedItem.id}: ${commentaryResult.commentary.substring(0, 50)}...`
      );
      return true;
    } catch (error) {
      console.error(
        `Failed to generate Terry commentary for ${feedItem.id}:`,
        error
      );

      // Retry if enabled
      if (
        this.config.retryFailedCommentary &&
        retryCount < this.config.maxRetries
      ) {
        console.log(
          `Retrying Terry commentary for ${feedItem.id} (attempt ${retryCount + 1})`
        );
        return await this.generateAndAddCommentary(
          feedItem,
          originalTweet,
          classification,
          retryCount + 1
        );
      }

      return false;
    }
  }

  /**
   * Add commentary to a feed item in the store
   */
  private async addCommentaryToFeedItem(
    feedItemId: string,
    commentaryResult: TerryCommentaryResult
  ): Promise<void> {
    // TODO: Re-enable feed store updates once circular dependency is fixed
    console.log(
      `Terry commentary would be added to ${feedItemId}: ${commentaryResult.commentary}`
    );
    // // Get the current feed store state
    // const feedStore = useFeedStore.getState();
    // const items = feedStore.items;
    //
    // // Find the item to update
    // const itemIndex = items.findIndex((item) => item.id === feedItemId);
    // if (itemIndex === -1) {
    //   console.warn(
    //     `Feed item ${feedItemId} not found for Terry commentary update`
    //   );
    //   return;
    // }
    //
    // // Create updated item with Terry commentary
    // const updatedItem: FeedItem = {
    //   ...items[itemIndex],
    //   terryCommentary: commentaryResult.commentary,
    // };
    //
    // // Create new items array with updated item
    // const updatedItems = [...items];
    // updatedItems[itemIndex] = updatedItem;
    //
    // // Update the store
    // feedStore.items = updatedItems;
    // feedStore.applyFilters(); // Call the function to update filtered items

    console.log(`📝 Terry commentary added to feed item ${feedItemId}`);
  }

  /**
   * Process multiple feed items in batch
   */
  public async processBatchFeedItems(
    feedItems: Array<{
      feedItem: FeedItem;
      originalTweet?: TweetData;
      classification?: ClassificationResult;
      source?: ITKSource;
    }>
  ): Promise<number> {
    if (!this.config.enableBatchCommentary) {
      return 0;
    }

    let successCount = 0;

    for (const item of feedItems) {
      const success = await this.processFeedItem(
        item.feedItem,
        item.originalTweet,
        item.classification,
        item.source
      );

      if (success) {
        successCount++;
      }

      // Small delay between batch items to avoid overwhelming the system
      await this.sleep(100);
    }

    console.log(
      `📊 Terry batch processing complete: ${successCount}/${feedItems.length} commentaries generated`
    );
    return successCount;
  }

  /**
   * Generate Terry's Breaking News commentary for major transfers
   */
  public async processBreakingNews(
    feedItem: FeedItem,
    isGenuineDrama: boolean = true
  ): Promise<boolean> {
    if (feedItem.type !== 'breaking') {
      return false;
    }

    try {
      const breakingCommentary =
        await this.terrySystem.generateBreakingNewsCommentary(
          feedItem,
          isGenuineDrama
        );

      if (!breakingCommentary) {
        return false;
      }

      // Add breaking news commentary immediately (no delay)
      await this.addCommentaryToFeedItem(feedItem.id, breakingCommentary);

      console.log(
        `🚨 Terry breaking news commentary added: ${breakingCommentary.commentary}`
      );
      return true;
    } catch (error) {
      console.error(
        `Failed to process breaking news commentary for ${feedItem.id}:`,
        error
      );
      return false;
    }
  }

  /**
   * Clean up pending commentary for cancelled/removed feed items
   */
  public cancelPendingCommentary(feedItemId: string): void {
    const timeoutId = this.pendingCommentary.get(feedItemId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.pendingCommentary.delete(feedItemId);
      console.log(`⏰ Cancelled pending Terry commentary for ${feedItemId}`);
    }
  }

  /**
   * Get Terry integration statistics
   */
  public getStats(): TerryProcessingStats & { successRate: number } {
    const successRate =
      this.processingStats.totalItemsProcessed > 0
        ? (this.processingStats.commentariesGenerated /
            this.processingStats.totalItemsProcessed) *
          100
        : 0;

    return {
      ...this.processingStats,
      commentarySuccessRate: Math.round(successRate * 100) / 100,
      successRate: Math.round(successRate),
    };
  }

  /**
   * Get detailed Terry system analytics
   */
  public getDetailedAnalytics() {
    const integrationStats = this.getStats();
    const terryVoiceAnalytics = this.terrySystem.getVoiceAnalytics();
    const terryStatus = this.terrySystem.getStatus();

    return {
      integration: integrationStats,
      voiceAnalytics: terryVoiceAnalytics,
      systemStatus: terryStatus,
      pendingCommentaries: this.pendingCommentary.size,
    };
  }

  /**
   * Update Terry integration configuration
   */
  public updateConfig(newConfig: Partial<TerryIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.terrySystem.updateConfig(newConfig);
    console.log('🔧 Updated Terry integration config:', this.config);
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.processingStats = this.initializeStats();
    console.log('📊 Terry integration stats reset');
  }

  /**
   * Initialize processing statistics
   */
  private initializeStats(): TerryProcessingStats {
    return {
      totalItemsProcessed: 0,
      commentariesGenerated: 0,
      commentarySuccessRate: 0,
      averageGenerationTime: 0,
      voiceConsistencyAverage: 0,
      rejectionsLowQuality: 0,
      rejectionsQuotaExceeded: 0,
    };
  }

  /**
   * Utility function for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    // Cancel all pending commentary timeouts
    for (const [feedItemId, timeoutId] of this.pendingCommentary) {
      clearTimeout(timeoutId);
      console.log(`🧹 Cleaned up pending commentary for ${feedItemId}`);
    }
    this.pendingCommentary.clear();
  }
}

// Export singleton instance
export const terryIntegration = new TerryIntegration();

/**
 * Convenience functions for direct use
 */

/**
 * Process a single feed item for Terry commentary
 */
export const addTerryCommentary = async (
  feedItem: FeedItem,
  originalTweet?: TweetData,
  classification?: ClassificationResult
): Promise<boolean> => {
  return await terryIntegration.processFeedItem(
    feedItem,
    originalTweet,
    classification
  );
};

/**
 * Process breaking news with Terry commentary
 */
export const addTerryBreakingNews = async (
  feedItem: FeedItem,
  isGenuineDrama: boolean = true
): Promise<boolean> => {
  return await terryIntegration.processBreakingNews(feedItem, isGenuineDrama);
};

/**
 * Get Terry commentary statistics
 */
export const getTerryStats = () => {
  return terryIntegration.getStats();
};

/**
 * Get detailed Terry analytics
 */
export const getTerryAnalytics = () => {
  return terryIntegration.getDetailedAnalytics();
};

/**
 * Update Terry configuration
 */
export const updateTerryConfig = (config: Partial<TerryIntegrationConfig>) => {
  terryIntegration.updateConfig(config);
};
