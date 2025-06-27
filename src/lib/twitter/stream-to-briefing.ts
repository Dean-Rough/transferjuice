/**
 * Stream-to-Briefing Integration
 * Connects real-time Twitter stream to briefing generation
 */

import { generateBriefing } from "@/briefing-generator/orchestrator";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { applyTerryStyle } from "@/lib/terry-style";
import type { TransferType, Priority } from "@prisma/client";

interface StreamTweetData {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  username: string;
  source: {
    name: string;
    handle: string;
    tier: number;
    reliability: number;
  };
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  metadata: {
    transferType?: string;
    priority: string;
    relevanceScore: number;
    originalUrl?: string;
  };
}

class StreamToBriefingProcessor {
  private tweetBuffer: StreamTweetData[] = [];
  private lastBriefingTime: Date = new Date();
  private isProcessingBriefing: boolean = false;

  // Configuration
  private readonly BRIEFING_INTERVAL_HOURS = 3; // Generate briefing every 3 hours
  private readonly MIN_TWEETS_FOR_BRIEFING = 5; // Minimum tweets needed
  private readonly MAX_TWEETS_FOR_BRIEFING = 50; // Maximum tweets to include

  /**
   * Process incoming tweet from stream
   */
  async processTweet(tweetData: StreamTweetData): Promise<void> {
    try {
      logger.info("Processing stream tweet for briefing", {
        tweetId: tweetData.id,
        username: tweetData.username,
        transferType: tweetData.metadata.transferType,
        priority: tweetData.metadata.priority,
      });

      // Store tweet in database for briefing generation
      await this.storeTweetForBriefing(tweetData);

      // Add to buffer for immediate briefing consideration
      this.tweetBuffer.push(tweetData);

      // Keep buffer size manageable
      if (this.tweetBuffer.length > this.MAX_TWEETS_FOR_BRIEFING) {
        this.tweetBuffer = this.tweetBuffer.slice(
          -this.MAX_TWEETS_FOR_BRIEFING,
        );
      }

      console.log(
        applyTerryStyle.enhanceMessage(
          `Tweet buffered: ${this.tweetBuffer.length} tweets ready for briefing`,
        ),
      );

      // Check if we should trigger a briefing
      await this.checkBriefingTrigger();
    } catch (error) {
      logger.error("Error processing tweet for briefing", {
        tweetId: tweetData.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Store tweet in database for briefing generation
   */
  private async storeTweetForBriefing(
    tweetData: StreamTweetData,
  ): Promise<void> {
    try {
      // Store as FeedItem for briefing consumption
      await prisma.feedItem.upsert({
        where: { id: tweetData.id },
        update: {
          content: tweetData.text,
          publishedAt: new Date(tweetData.created_at),
          transferType: tweetData.metadata.transferType as TransferType | null,
          priority: tweetData.metadata.priority as Priority,
          relevanceScore: tweetData.metadata.relevanceScore,
          originalUrl: tweetData.metadata.originalUrl,
          isPublished: true,
          originalLikes: tweetData.public_metrics.like_count,
          originalShares: tweetData.public_metrics.retweet_count,
          originalReplies: tweetData.public_metrics.reply_count,
        },
        create: {
          id: tweetData.id,
          content: tweetData.text,
          publishedAt: new Date(tweetData.created_at),
          sourceId: "default-source", // TODO: create or fetch actual source
          transferType: tweetData.metadata.transferType as TransferType | null,
          priority: tweetData.metadata.priority as Priority,
          relevanceScore: tweetData.metadata.relevanceScore,
          originalUrl: tweetData.metadata.originalUrl,
          isPublished: true,
          originalLikes: tweetData.public_metrics.like_count,
          originalShares: tweetData.public_metrics.retweet_count,
          originalReplies: tweetData.public_metrics.reply_count,
        },
      });

      console.log(
        applyTerryStyle.enhanceMessage(
          `Stored tweet ${tweetData.id} from @${tweetData.username} in database`,
        ),
      );
    } catch (error) {
      logger.error("Failed to store tweet in database", {
        tweetId: tweetData.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Check if we should trigger a briefing generation
   */
  private async checkBriefingTrigger(): Promise<void> {
    // Don't trigger if already processing
    if (this.isProcessingBriefing) {
      return;
    }

    const now = new Date();
    const hoursSinceLastBriefing =
      (now.getTime() - this.lastBriefingTime.getTime()) / (1000 * 60 * 60);

    // Trigger conditions
    const hasEnoughTweets =
      this.tweetBuffer.length >= this.MIN_TWEETS_FOR_BRIEFING;
    const hasBeenLongEnough =
      hoursSinceLastBriefing >= this.BRIEFING_INTERVAL_HOURS;
    const hasHighPriorityTweet = this.tweetBuffer.some(
      (tweet) =>
        tweet.metadata.priority === "high" &&
        tweet.metadata.relevanceScore > 0.8,
    );

    // Emergency briefing for breaking news
    const hasBreakingNews = this.tweetBuffer.some(
      (tweet) =>
        tweet.metadata.priority === "high" &&
        tweet.metadata.relevanceScore > 0.9 &&
        tweet.metadata.transferType === "OFFICIAL",
    );

    if (hasBreakingNews) {
      console.log(
        applyTerryStyle.enhanceMessage(
          "🚨 BREAKING NEWS detected - generating emergency briefing!",
        ),
      );
      await this.triggerBriefingGeneration("emergency");
    } else if (hasBeenLongEnough && hasEnoughTweets) {
      console.log(
        applyTerryStyle.enhanceMessage(
          "⏰ Regular briefing interval reached - generating briefing",
        ),
      );
      await this.triggerBriefingGeneration("scheduled");
    } else if (hasHighPriorityTweet && this.tweetBuffer.length >= 3) {
      console.log(
        applyTerryStyle.enhanceMessage(
          "⚡ High priority tweets accumulated - generating briefing",
        ),
      );
      await this.triggerBriefingGeneration("priority");
    } else {
      console.log(
        applyTerryStyle.enhanceMessage(
          `Briefing not triggered: ${this.tweetBuffer.length}/${this.MIN_TWEETS_FOR_BRIEFING} tweets, ` +
            `${hoursSinceLastBriefing.toFixed(1)}/${this.BRIEFING_INTERVAL_HOURS} hours`,
        ),
      );
    }
  }

  /**
   * Trigger briefing generation with current buffer
   */
  private async triggerBriefingGeneration(
    triggerType: "emergency" | "scheduled" | "priority",
  ): Promise<void> {
    if (this.isProcessingBriefing) {
      console.log("Briefing generation already in progress, skipping");
      return;
    }

    this.isProcessingBriefing = true;

    try {
      console.log(
        applyTerryStyle.enhanceMessage(
          `🎬 Generating ${triggerType} briefing with ${this.tweetBuffer.length} tweets...`,
        ),
      );

      // Generate briefing using our existing pipeline
      const result = await generateBriefing({
        timestamp: new Date(),
        testMode: false, // Use real data now!
        forceRegenerate: true,
        debugMode: true,
      });

      console.log(
        applyTerryStyle.enhanceMessage(
          `✅ Briefing generated successfully!`,
        ),
      );

      logger.info("Briefing generated from stream", {
        success: result.success,
        triggerType,
        message: result.message,
      });

      // Clear buffer and update last briefing time
      this.tweetBuffer = [];
      this.lastBriefingTime = new Date();

      // Broadcast briefing update if needed
      // broadcastUpdate('briefing-update', {
      //   id: result.briefing.id,
      //   title: result.briefing.title,
      //   triggerType,
      //   stats: result.stats
      // });
    } catch (error) {
      logger.error("Failed to generate briefing from stream", {
        triggerType,
        tweetsInBuffer: this.tweetBuffer.length,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      console.error(
        applyTerryStyle.enhanceError(
          `Failed to generate briefing: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      );
    } finally {
      this.isProcessingBriefing = false;
    }
  }

  /**
   * Force generation of briefing with current buffer
   */
  async forceBriefingGeneration(): Promise<void> {
    if (this.tweetBuffer.length === 0) {
      throw new Error("No tweets in buffer to generate briefing");
    }

    await this.triggerBriefingGeneration("priority");
  }

  /**
   * Get current buffer status
   */
  getBufferStatus(): {
    tweetsInBuffer: number;
    lastBriefingTime: Date;
    hoursSinceLastBriefing: number;
    isProcessing: boolean;
    nextBriefingIn: number;
    canTriggerEmergency: boolean;
  } {
    const now = new Date();
    const hoursSinceLastBriefing =
      (now.getTime() - this.lastBriefingTime.getTime()) / (1000 * 60 * 60);

    return {
      tweetsInBuffer: this.tweetBuffer.length,
      lastBriefingTime: this.lastBriefingTime,
      hoursSinceLastBriefing,
      isProcessing: this.isProcessingBriefing,
      nextBriefingIn: Math.max(
        0,
        this.BRIEFING_INTERVAL_HOURS - hoursSinceLastBriefing,
      ),
      canTriggerEmergency: this.tweetBuffer.some(
        (tweet) =>
          tweet.metadata.priority === "high" &&
          tweet.metadata.relevanceScore > 0.8,
      ),
    };
  }

  /**
   * Clear buffer (for testing/reset)
   */
  clearBuffer(): void {
    this.tweetBuffer = [];
    console.log(applyTerryStyle.enhanceMessage("Tweet buffer cleared"));
  }
}

// Export singleton instance
export const streamToBriefingProcessor = new StreamToBriefingProcessor();
