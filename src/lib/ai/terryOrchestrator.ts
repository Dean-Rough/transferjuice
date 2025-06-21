/**
 * Terry Commentary Orchestrator
 * Main coordination service for Terry's continuous commentary system
 */

import {
  globalMonitor,
  type GlobalMonitoringStats,
} from '@/lib/twitter/globalMonitor';
import {
  terryIntegration,
  type TerryIntegrationConfig,
  DEFAULT_INTEGRATION_CONFIG,
} from './terryIntegration';
import { convertTweetToFeedItem } from '@/lib/twitter/feedIntegration';
// TODO: Fix circular dependency with feedStore
// import { useFeedStore } from '@/lib/stores/feedStore';
import {
  type TweetData,
  type ClassificationResult,
  classifyTransferContent,
} from '@/lib/twitter/transferClassifier';
import { type ITKSource, getSourceByHandle } from '@/lib/twitter/globalSources';

export interface TerryOrchestrationConfig {
  integration: TerryIntegrationConfig;
  monitoring: {
    enableAutoCommentary: boolean;
    processAllIncomingTweets: boolean;
    prioritizeBreakingNews: boolean;
    minConfidenceForTerry: number;
  };
  scheduling: {
    enableHourlyUpdates: boolean;
    enableBreakingNewsAlerts: boolean;
    peakHours: number[]; // Hours when Terry is most active (0-23)
    quietHours: number[]; // Hours when Terry is less active
  };
}

export interface TerryOrchestrationStats {
  totalTweetsProcessed: number;
  transferTweetsDetected: number;
  commentariesGenerated: number;
  breakingNewsCommentaries: number;
  averageResponseTime: number;
  voiceConsistencyRate: number;
  activeHoursToday: number;
  lastActivityTime: Date | null;
}

// Default orchestration configuration
export const DEFAULT_ORCHESTRATION_CONFIG: TerryOrchestrationConfig = {
  integration: DEFAULT_INTEGRATION_CONFIG,
  monitoring: {
    enableAutoCommentary: true,
    processAllIncomingTweets: true,
    prioritizeBreakingNews: true,
    minConfidenceForTerry: 0.6,
  },
  scheduling: {
    enableHourlyUpdates: true,
    enableBreakingNewsAlerts: true,
    peakHours: [9, 10, 11, 16, 17, 18, 19, 20], // Morning and evening peak
    quietHours: [0, 1, 2, 3, 4, 5, 6], // Late night/early morning
  },
};

/**
 * Terry Commentary Orchestrator Class
 */
export class TerryOrchestrator {
  private config: TerryOrchestrationConfig;
  private stats: TerryOrchestrationStats;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config: TerryOrchestrationConfig = DEFAULT_ORCHESTRATION_CONFIG) {
    this.config = config;
    this.stats = this.initializeStats();
  }

  /**
   * Start Terry's continuous commentary system
   */
  public start(): void {
    if (this.isRunning) {
      console.warn('Terry Orchestrator is already running');
      return;
    }

    this.isRunning = true;
    console.log('🎭 Starting Terry Commentary Orchestrator...');

    // Hook into global monitoring system
    this.setupGlobalMonitoringIntegration();

    // Start hourly update cycle if enabled
    if (this.config.scheduling.enableHourlyUpdates) {
      this.startHourlyUpdateCycle();
    }

    console.log('🎬 Terry Commentary Orchestrator started successfully');
  }

  /**
   * Stop Terry's commentary system
   */
  public stop(): void {
    if (!this.isRunning) {
      console.warn('Terry Orchestrator is not running');
      return;
    }

    this.isRunning = false;

    // Stop hourly updates
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Clean up Terry integration
    terryIntegration.cleanup();

    console.log('⏹️ Terry Commentary Orchestrator stopped');
  }

  /**
   * Setup integration with global monitoring system
   */
  private setupGlobalMonitoringIntegration(): void {
    // In production, this would hook into the global monitor's event system
    // For now, we'll simulate by checking for new tweets periodically

    console.log('🔗 Connecting Terry to global ITK monitoring system...');

    // Monitor the feed store for new items and add Terry commentary
    this.monitorFeedStoreChanges();
  }

  /**
   * Monitor feed store changes and add Terry commentary
   */
  private monitorFeedStoreChanges(): void {
    // In a real implementation, this would use store subscriptions
    // For now, we'll implement a polling approach

    const lastProcessedCount = 0;

    const checkForNewItems = () => {
      if (!this.isRunning) return;

      // TODO: Re-enable feed store monitoring once circular dependency is fixed
      console.log(
        'Feed store monitoring disabled temporarily due to circular dependency'
      );
      // const feedStore = useFeedStore.getState();
      // const currentItemCount = feedStore.items.length;
      //
      // if (currentItemCount > lastProcessedCount) {
      //   const newItems = feedStore.items.slice(lastProcessedCount);
      //   this.processNewFeedItems(newItems);
      //   lastProcessedCount = currentItemCount;
      // }
    };

    // Check every 30 seconds for new items
    setInterval(checkForNewItems, 30000);
  }

  /**
   * Process new feed items for Terry commentary
   */
  private async processNewFeedItems(newItems: Array<any>): Promise<void> {
    if (!this.config.monitoring.enableAutoCommentary) {
      return;
    }

    console.log(`🔄 Terry processing ${newItems.length} new feed items...`);

    for (const item of newItems) {
      try {
        await this.processSingleFeedItem(item);
        this.stats.totalTweetsProcessed++;

        // Update last activity time
        this.stats.lastActivityTime = new Date();

        // Small delay between items
        await this.sleep(500);
      } catch (error) {
        console.error(`Terry failed to process feed item ${item.id}:`, error);
      }
    }
  }

  /**
   * Process a single feed item for Terry commentary
   */
  private async processSingleFeedItem(feedItem: any): Promise<void> {
    // Check if this is within Terry's active hours
    if (!this.isWithinActiveHours()) {
      return;
    }

    // Check confidence threshold
    if (
      feedItem.metadata?.relevanceScore <
      this.config.monitoring.minConfidenceForTerry
    ) {
      return;
    }

    // Prioritize breaking news
    if (
      feedItem.type === 'breaking' &&
      this.config.monitoring.prioritizeBreakingNews
    ) {
      const success = await terryIntegration.processBreakingNews(
        feedItem,
        true
      );
      if (success) {
        this.stats.breakingNewsCommentaries++;
        console.log(`🚨 Terry processed breaking news: ${feedItem.id}`);
      }
      return;
    }

    // Process regular transfer content
    if (feedItem.type === 'itk' || feedItem.type === 'confirmed') {
      const success = await terryIntegration.processFeedItem(feedItem);
      if (success) {
        this.stats.commentariesGenerated++;
        console.log(`💬 Terry added commentary to: ${feedItem.id}`);
      }
    }
  }

  /**
   * Start hourly update cycle
   */
  private startHourlyUpdateCycle(): void {
    console.log('⏰ Starting Terry hourly update cycle...');

    // Run every hour
    this.intervalId = setInterval(
      () => {
        this.runHourlyUpdate();
      },
      60 * 60 * 1000
    );

    // Run initial update
    this.runHourlyUpdate();
  }

  /**
   * Run hourly Terry update cycle
   */
  private async runHourlyUpdate(): Promise<void> {
    if (!this.isRunning) return;

    console.log('🕐 Running Terry hourly update...');

    try {
      // Get global monitoring stats
      const monitoringStats = await globalMonitor.runMonitoringCycle();

      // Update Terry stats
      this.updateStatsFromMonitoring(monitoringStats);

      // Process any pending high-priority items
      await this.processHighPriorityItems();

      // Log hourly summary
      this.logHourlySummary(monitoringStats);

      this.stats.activeHoursToday++;
    } catch (error) {
      console.error('Terry hourly update failed:', error);
    }
  }

  /**
   * Process high-priority items that need immediate Terry attention
   */
  private async processHighPriorityItems(): Promise<void> {
    // TODO: Re-enable feed store access once circular dependency is fixed
    console.log(
      'High priority item processing disabled temporarily due to circular dependency'
    );
    const highPriorityItems: any[] = [];
    // const feedStore = useFeedStore.getState();
    //
    // // Find breaking news and high-priority items without Terry commentary
    // const highPriorityItems = feedStore.items.filter(
    //   (item) =>
    //     (item.type === 'breaking' || item.metadata.priority === 'high') &&
    //     !item.terryCommentary &&
    //     item.metadata.relevanceScore >=
    //       this.config.monitoring.minConfidenceForTerry
    // );

    if (highPriorityItems.length > 0) {
      console.log(
        `⚡ Terry processing ${highPriorityItems.length} high-priority items...`
      );

      for (const item of highPriorityItems.slice(0, 3)) {
        // Limit to 3 per hour
        await this.processSingleFeedItem(item);
      }
    }
  }

  /**
   * Update stats from global monitoring
   */
  private updateStatsFromMonitoring(
    monitoringStats: GlobalMonitoringStats
  ): void {
    this.stats.transferTweetsDetected += monitoringStats.totalTransferTweets;

    // Update average response time (simplified calculation)
    const currentResponseTime = monitoringStats.processingTimeMs;
    this.stats.averageResponseTime =
      (this.stats.averageResponseTime + currentResponseTime) / 2;
  }

  /**
   * Check if current time is within Terry's active hours
   */
  private isWithinActiveHours(): boolean {
    const currentHour = new Date().getHours();

    // Check if it's quiet hours (Terry less active)
    if (this.config.scheduling.quietHours.includes(currentHour)) {
      return Math.random() < 0.2; // 20% chance during quiet hours
    }

    // Check if it's peak hours (Terry more active)
    if (this.config.scheduling.peakHours.includes(currentHour)) {
      return Math.random() < 0.8; // 80% chance during peak hours
    }

    // Regular hours
    return Math.random() < 0.5; // 50% chance during regular hours
  }

  /**
   * Log hourly summary
   */
  private logHourlySummary(monitoringStats: GlobalMonitoringStats): void {
    const terryStats = terryIntegration.getStats();

    console.log('📊 Terry Hourly Summary:', {
      transferTweetsDetected: monitoringStats.totalTransferTweets,
      commentariesGenerated: terryStats.commentariesGenerated,
      successRate: `${terryStats.successRate}%`,
      voiceConsistency: `${Math.round(terryStats.voiceConsistencyAverage * 100)}%`,
      activeHours: this.stats.activeHoursToday,
    });
  }

  /**
   * Generate Terry's Breaking News alert
   */
  public async generateBreakingNewsAlert(
    feedItem: any,
    isGenuineDrama: boolean = true
  ): Promise<boolean> {
    if (!this.config.scheduling.enableBreakingNewsAlerts) {
      return false;
    }

    console.log(`🚨 Terry Breaking News Alert triggered for: ${feedItem.id}`);

    const success = await terryIntegration.processBreakingNews(
      feedItem,
      isGenuineDrama
    );

    if (success) {
      this.stats.breakingNewsCommentaries++;
      console.log('🎬 Terry Breaking News commentary published');
    }

    return success;
  }

  /**
   * Get comprehensive Terry orchestration status
   */
  public getStatus() {
    const terryIntegrationStats = terryIntegration.getStats();
    const terryAnalytics = terryIntegration.getDetailedAnalytics();

    return {
      isRunning: this.isRunning,
      config: this.config,
      stats: {
        ...this.stats,
        voiceConsistencyRate: terryIntegrationStats.voiceConsistencyAverage,
      },
      integration: terryIntegrationStats,
      analytics: terryAnalytics,
      currentHour: new Date().getHours(),
      isActiveHour: this.isWithinActiveHours(),
    };
  }

  /**
   * Update orchestration configuration
   */
  public updateConfig(newConfig: Partial<TerryOrchestrationConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update integration config if provided
    if (newConfig.integration) {
      terryIntegration.updateConfig(newConfig.integration);
    }

    console.log('🔧 Updated Terry orchestration config');
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = this.initializeStats();
    terryIntegration.resetStats();
    console.log('📊 Terry orchestration stats reset');
  }

  /**
   * Initialize stats
   */
  private initializeStats(): TerryOrchestrationStats {
    return {
      totalTweetsProcessed: 0,
      transferTweetsDetected: 0,
      commentariesGenerated: 0,
      breakingNewsCommentaries: 0,
      averageResponseTime: 0,
      voiceConsistencyRate: 0,
      activeHoursToday: 0,
      lastActivityTime: null,
    };
  }

  /**
   * Utility function for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const terryOrchestrator = new TerryOrchestrator();

/**
 * Convenience functions
 */

/**
 * Start Terry's continuous commentary system
 */
export const startTerrySystem = (
  config?: Partial<TerryOrchestrationConfig>
) => {
  if (config) {
    terryOrchestrator.updateConfig(config);
  }
  terryOrchestrator.start();
  return terryOrchestrator;
};

/**
 * Stop Terry's commentary system
 */
export const stopTerrySystem = () => {
  terryOrchestrator.stop();
};

/**
 * Get Terry system status
 */
export const getTerrySystemStatus = () => {
  return terryOrchestrator.getStatus();
};

/**
 * Generate Terry breaking news alert
 */
export const triggerTerryBreakingNews = (
  feedItem: any,
  isGenuineDrama: boolean = true
) => {
  return terryOrchestrator.generateBreakingNewsAlert(feedItem, isGenuineDrama);
};

/**
 * Update Terry system configuration
 */
export const updateTerrySystemConfig = (
  config: Partial<TerryOrchestrationConfig>
) => {
  terryOrchestrator.updateConfig(config);
};
