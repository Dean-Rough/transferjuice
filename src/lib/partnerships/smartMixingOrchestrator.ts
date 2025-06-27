/**
 * Smart Mixing Orchestrator
 * Coordinates partner content integration with feed and Terry commentary
 */

// TODO: Fix circular dependency with feedStore
// import { type FeedItem, useFeedStore } from '@/lib/stores/feedStore';

// Temporary type to avoid circular dependency
interface FeedItem {
  id: string;
  type: string;
  content: string;
  timestamp: Date;
  terryCommentary?: string;
  metadata?: any;
  source?: any;
  tags?: any;
}
import {
  ContentMixer,
  type PartnerContent,
  type ContentMixingResult,
  DEFAULT_MIXING_CONFIG,
} from "./contentMixer";
// TODO: Fix circular dependency with terryCommentarySystem
// import { terryCommentarySystem } from '@/lib/ai/terryCommentarySystem';

export interface SmartMixingConfig {
  enableSmartMixing: boolean;
  mixingSchedule: "continuous" | "scheduled" | "manual";
  scheduledIntervals: number[]; // Minutes past hour [15, 30, 45] for scheduled mixing
  quietPeriodDetection: boolean;
  terryCommentaryOnPartnerContent: boolean;
  maxPartnerContentRatio: number; // 0-1, max percentage of feed that can be partner content
}

export interface MixingOrchestrationResult {
  action: "none" | "mixed" | "scheduled" | "rejected";
  reason: string;
  partnerContent?: FeedItem;
  nextScheduledCheck?: Date;
  stats: {
    totalChecks: number;
    successfulMixes: number;
    rejectedMixes: number;
    lastMixTime?: Date;
  };
}

export const DEFAULT_ORCHESTRATION_CONFIG: SmartMixingConfig = {
  enableSmartMixing: true,
  mixingSchedule: "continuous", // Check continuously for quiet periods
  scheduledIntervals: [20, 40], // Check at 20 and 40 minutes past hour if scheduled
  quietPeriodDetection: true,
  terryCommentaryOnPartnerContent: true,
  maxPartnerContentRatio: 0.25, // Max 25% of feed content can be partner content
};

/**
 * Smart Mixing Orchestrator
 * Intelligently coordinates when and how to mix partner content
 */
export class SmartMixingOrchestrator {
  private config: SmartMixingConfig;
  private contentMixer: ContentMixer;
  private mixingStats = {
    totalChecks: 0,
    successfulMixes: 0,
    rejectedMixes: 0,
    lastMixTime: undefined as Date | undefined,
  };
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    config: SmartMixingConfig = DEFAULT_ORCHESTRATION_CONFIG,
    mixerConfig = DEFAULT_MIXING_CONFIG,
  ) {
    this.config = config;
    this.contentMixer = new ContentMixer(mixerConfig);
  }

  /**
   * Start the smart mixing orchestrator
   */
  public start(): void {
    if (this.isRunning) {
      console.log("⚠️ Smart mixing orchestrator already running");
      return;
    }

    if (!this.config.enableSmartMixing) {
      console.log("⏸️ Smart mixing disabled in configuration");
      return;
    }

    this.isRunning = true;
    console.log("🎯 Starting Smart Mixing Orchestrator...");
    console.log(`   Schedule: ${this.config.mixingSchedule}`);
    console.log(
      `   Quiet period detection: ${this.config.quietPeriodDetection ? "enabled" : "disabled"}`,
    );
    console.log(
      `   Terry commentary on partners: ${this.config.terryCommentaryOnPartnerContent ? "enabled" : "disabled"}`,
    );

    if (this.config.mixingSchedule === "continuous") {
      // Check every 5 minutes for continuous mixing
      this.intervalId = setInterval(
        () => {
          this.checkAndMixContent();
        },
        5 * 60 * 1000,
      ); // 5 minutes
    } else if (this.config.mixingSchedule === "scheduled") {
      // Check at specific intervals
      this.scheduleIntervalChecks();
    }

    // Run initial check
    this.checkAndMixContent();
  }

  /**
   * Stop the smart mixing orchestrator
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log("🛑 Smart Mixing Orchestrator stopped");
  }

  /**
   * Manually trigger content mixing check
   */
  public async manualMixCheck(): Promise<MixingOrchestrationResult> {
    console.log("🔄 Manual content mixing check triggered...");
    return await this.performMixingCheck();
  }

  /**
   * Get current mixing statistics and status
   */
  public getStatus() {
    // TODO: Re-enable feed store access once circular dependency is fixed
    const partnerContentCount = 0;
    const totalContentCount = 0;
    const partnerContentRatio = 0;
    // const feedStore = useFeedStore.getState();
    // const partnerContentCount = feedStore.items.filter(
    //   (item) => item.type === 'partner'
    // ).length;
    // const totalContentCount = feedStore.items.length;
    // const partnerContentRatio =
    //   totalContentCount > 0 ? partnerContentCount / totalContentCount : 0;

    return {
      isRunning: this.isRunning,
      config: this.config,
      stats: this.mixingStats,
      currentFeed: {
        totalItems: totalContentCount,
        partnerItems: partnerContentCount,
        partnerRatio: Math.round(partnerContentRatio * 100),
        maxPartnerRatio: Math.round(this.config.maxPartnerContentRatio * 100),
      },
      contentMixerAnalytics: this.contentMixer.getAnalytics(),
    };
  }

  /**
   * Update orchestrator configuration
   */
  public updateConfig(newConfig: Partial<SmartMixingConfig>): void {
    const oldSchedule = this.config.mixingSchedule;
    this.config = { ...this.config, ...newConfig };

    // Restart if schedule changed
    if (oldSchedule !== this.config.mixingSchedule && this.isRunning) {
      this.stop();
      this.start();
    }

    console.log("⚙️ Updated smart mixing orchestrator config:", this.config);
  }

  /**
   * Get recent feed activity for analysis
   */
  public getRecentFeedActivity(hours: number = 2): FeedItem[] {
    // TODO: Re-enable feed store access once circular dependency is fixed
    console.log(
      "Recent feed activity disabled temporarily due to circular dependency",
    );
    return [];
    // const feedStore = useFeedStore.getState();
    // const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    //
    // return feedStore.items.filter(
    //   (item) => new Date(item.timestamp) >= cutoffTime
    // );
  }

  // Private methods

  private async checkAndMixContent(): Promise<void> {
    if (!this.isRunning || !this.config.enableSmartMixing) {
      return;
    }

    try {
      await this.performMixingCheck();
    } catch (error) {
      console.error("Error in smart mixing check:", error);
    }
  }

  private async performMixingCheck(): Promise<MixingOrchestrationResult> {
    this.mixingStats.totalChecks++;

    // Get recent feed activity
    const recentFeedItems = this.getRecentFeedActivity();

    // Check current partner content ratio
    if (!this.isWithinPartnerContentLimits(recentFeedItems)) {
      this.mixingStats.rejectedMixes++;
      return {
        action: "rejected",
        reason: "Partner content ratio limit exceeded",
        stats: { ...this.mixingStats },
      };
    }

    // Check if we should mix content
    const mixingResult: ContentMixingResult =
      this.contentMixer.shouldMixPartnerContent(recentFeedItems);

    if (!mixingResult.shouldMixContent) {
      return {
        action: "none",
        reason: mixingResult.reason,
        nextScheduledCheck: mixingResult.nextCheckIn
          ? new Date(Date.now() + mixingResult.nextCheckIn * 60 * 1000)
          : undefined,
        stats: { ...this.mixingStats },
      };
    }

    // Get suggested partner content
    const partnerContent =
      await this.contentMixer.getSuggestedContent(recentFeedItems);

    if (!partnerContent) {
      this.mixingStats.rejectedMixes++;
      return {
        action: "rejected",
        reason: "No suitable partner content available",
        stats: { ...this.mixingStats },
      };
    }

    // Convert to feed item
    const feedItem = this.contentMixer.convertPartnerContentToFeedItem(
      partnerContent,
      this.config.terryCommentaryOnPartnerContent,
    );

    // Add Terry commentary if enabled and not already added
    if (
      this.config.terryCommentaryOnPartnerContent &&
      !feedItem.terryCommentary
    ) {
      // TODO: Re-enable Terry commentary once circular dependency is fixed
      console.log(
        "Terry commentary disabled temporarily due to circular dependency",
      );
      // try {
      //   const terryResult =
      //     await terryCommentarySystem.generateCommentary(feedItem);
      //   if (terryResult) {
      //     feedItem.terryCommentary = terryResult.commentary;
      //     feedItem.metadata = {
      //       ...feedItem.metadata,
      //       terryVoiceMetrics: {
      //         consistency: terryResult.voiceConsistencyScore,
      //         humorLevel: terryResult.humorLevel,
      //         generationTime: terryResult.generationTimeMs,
      //       },
      //     };
      //   }
      // } catch (error) {
      //   console.log(
      //     'Failed to generate Terry commentary for partner content:',
      //     error
      //   );
      // }
    }

    // TODO: Re-enable feed store updates once circular dependency is fixed
    console.log(
      "Feed store update disabled temporarily due to circular dependency",
    );
    // // Add to feed store
    // const feedStore = useFeedStore.getState();
    // feedStore.addItem(feedItem);

    // Track the addition
    this.contentMixer.trackPartnerContentAdded(partnerContent);
    this.mixingStats.successfulMixes++;
    this.mixingStats.lastMixTime = new Date();

    console.log(
      `🎨 Smart mixing: Added partner content from ${partnerContent.source.name}`,
    );
    if (feedItem.terryCommentary) {
      console.log(`   🎭 With Terry commentary: "${feedItem.terryCommentary}"`);
    }

    return {
      action: "mixed",
      reason: "Successfully mixed partner content during quiet period",
      partnerContent: feedItem,
      stats: { ...this.mixingStats },
    };
  }

  private isWithinPartnerContentLimits(recentFeedItems: FeedItem[]): boolean {
    if (recentFeedItems.length === 0) {
      return true;
    }

    const partnerContentCount = recentFeedItems.filter(
      (item) => item.type === "partner",
    ).length;
    const currentRatio = partnerContentCount / recentFeedItems.length;

    return currentRatio <= this.config.maxPartnerContentRatio;
  }

  private scheduleIntervalChecks(): void {
    // Schedule checks at specific minutes past the hour
    const now = new Date();
    const currentMinute = now.getMinutes();

    for (const interval of this.config.scheduledIntervals) {
      const nextCheck = new Date(now);
      nextCheck.setMinutes(interval, 0, 0); // Set to exact minute

      // If the time has already passed this hour, schedule for next hour
      if (currentMinute >= interval) {
        nextCheck.setHours(nextCheck.getHours() + 1);
      }

      const timeToNext = nextCheck.getTime() - now.getTime();

      setTimeout(() => {
        this.checkAndMixContent();

        // Set up recurring check for this interval
        setInterval(
          () => {
            this.checkAndMixContent();
          },
          60 * 60 * 1000,
        ); // Every hour
      }, timeToNext);

      console.log(
        `⏰ Scheduled mixing check at :${interval.toString().padStart(2, "0")} (next: ${nextCheck.toLocaleTimeString()})`,
      );
    }
  }

  /**
   * Force mix specific partner content (admin/testing use)
   */
  public async forceMixContent(
    sourceId: string,
    contentOverride?: Partial<PartnerContent>,
  ): Promise<MixingOrchestrationResult> {
    console.log(`🔧 Force mixing content from source: ${sourceId}`);

    try {
      const recentFeedItems = this.getRecentFeedActivity();
      const partnerContent =
        await this.contentMixer.getSuggestedContent(recentFeedItems);

      if (!partnerContent) {
        return {
          action: "rejected",
          reason: "Could not generate partner content",
          stats: { ...this.mixingStats },
        };
      }

      // Apply overrides if provided
      if (contentOverride) {
        Object.assign(partnerContent, contentOverride);
      }

      const feedItem = this.contentMixer.convertPartnerContentToFeedItem(
        partnerContent,
        this.config.terryCommentaryOnPartnerContent,
      );

      // TODO: Re-enable feed store updates once circular dependency is fixed
      console.log(
        "Feed store update disabled temporarily due to circular dependency",
      );
      // const feedStore = useFeedStore.getState();
      // feedStore.addItem(feedItem);

      this.contentMixer.trackPartnerContentAdded(partnerContent);
      this.mixingStats.successfulMixes++;

      return {
        action: "mixed",
        reason: "Force mixed partner content",
        partnerContent: feedItem,
        stats: { ...this.mixingStats },
      };
    } catch (error) {
      console.error("Failed to force mix content:", error);
      this.mixingStats.rejectedMixes++;
      return {
        action: "rejected",
        reason: `Force mix failed: ${error}`,
        stats: { ...this.mixingStats },
      };
    }
  }
}

// Export singleton instance
export const smartMixingOrchestrator = new SmartMixingOrchestrator();
