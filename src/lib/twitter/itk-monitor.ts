/**
 * ITK Account Monitor
 * Manages monitoring of trusted football transfer accounts with Terry-style commentary
 */

import {
  TwitterClient,
  TwitterUser,
  TwitterTweet,
  TwitterTimelineResponse,
} from "./client";
import { applyTerryStyle } from "@/lib/terry-style";
import { prisma } from "@/lib/prisma";
import { transferKeywordClassifier } from "./transfer-classifier";
import type { TransferType, Priority } from "@prisma/client";

// ITK Account Configuration
export interface ITKAccount {
  username: string;
  displayName: string;
  tier: "tier1" | "tier2" | "tier3"; // Reliability tier
  specialties: string[]; // Areas of expertise (e.g., ['Arsenal', 'Premier League'])
  averageDelay: number; // Minutes between breaking news and tweet
  reliabilityScore: number; // 0-1 reliability rating
}

// The holy grail of transfer accounts
export const ITK_ACCOUNTS: ITKAccount[] = [
  {
    username: "FabrizioRomano",
    displayName: "Fabrizio Romano",
    tier: "tier1",
    specialties: ["Global", "Serie A", "Premier League"],
    averageDelay: 15,
    reliabilityScore: 0.95,
  },
  {
    username: "David_Ornstein",
    displayName: "David Ornstein",
    tier: "tier1",
    specialties: ["Arsenal", "Premier League", "England"],
    averageDelay: 30,
    reliabilityScore: 0.98,
  },
  {
    username: "JamesOlley",
    displayName: "James Olley",
    tier: "tier1",
    specialties: ["Arsenal", "Chelsea", "London clubs"],
    averageDelay: 45,
    reliabilityScore: 0.92,
  },
  {
    username: "SkySports_Keith",
    displayName: "Keith Downie",
    tier: "tier2",
    specialties: ["Newcastle", "North East", "Premier League"],
    averageDelay: 20,
    reliabilityScore: 0.88,
  },
  {
    username: "JPercyTelegraph",
    displayName: "John Percy",
    tier: "tier2",
    specialties: ["Leicester", "Championship", "Midlands"],
    averageDelay: 35,
    reliabilityScore: 0.89,
  },
  {
    username: "City_Xtra",
    displayName: "City Xtra",
    tier: "tier2",
    specialties: ["Manchester City", "Premier League"],
    averageDelay: 10,
    reliabilityScore: 0.83,
  },
  {
    username: "lequipe",
    displayName: "L'Équipe",
    tier: "tier2",
    specialties: ["Ligue 1", "French football", "PSG"],
    averageDelay: 25,
    reliabilityScore: 0.85,
  },
  {
    username: "DiMarzio",
    displayName: "Gianluca Di Marzio",
    tier: "tier2",
    specialties: ["Serie A", "Italian football", "Juventus"],
    averageDelay: 20,
    reliabilityScore: 0.87,
  },
  {
    username: "marca",
    displayName: "MARCA",
    tier: "tier3",
    specialties: ["La Liga", "Real Madrid", "Spanish football"],
    averageDelay: 15,
    reliabilityScore: 0.75,
  },
  {
    username: "mundodeportivo",
    displayName: "Mundo Deportivo",
    tier: "tier3",
    specialties: ["La Liga", "Barcelona", "Spanish football"],
    averageDelay: 20,
    reliabilityScore: 0.72,
  },
];

interface MonitoringStats {
  totalTweets: number;
  transferRelevant: number;
  highPriority: number;
  lastFetch: Date;
  errorCount: number;
  successRate: number;
}

interface TweetProcessingResult {
  tweet: TwitterTweet;
  user: TwitterUser;
  isTransferRelated: boolean;
  confidence: number;
  transferType?: TransferType;
  priority: Priority;
  keywords: string[];
  playersExtracted: string[];
  clubsExtracted: string[];
  relevanceScore: number;
}

export class ITKMonitor {
  private twitterClient: TwitterClient;
  private userCache: Map<string, TwitterUser> = new Map();
  private lastFetchTimes: Map<string, string> = new Map(); // username -> tweet ID
  private stats: Map<string, MonitoringStats> = new Map();

  constructor(twitterClient: TwitterClient) {
    this.twitterClient = twitterClient;
  }

  /**
   * Initialize monitoring by caching user information
   */
  async initialize(): Promise<void> {
    console.log(
      applyTerryStyle.enhanceMessage(
        "Initializing ITK monitoring - preparing for the chaos",
      ),
    );

    const errors: string[] = [];

    for (const account of ITK_ACCOUNTS) {
      try {
        const user = await this.twitterClient.getUserByUsername(
          account.username,
        );
        this.userCache.set(account.username, user);

        // Initialize stats
        this.stats.set(account.username, {
          totalTweets: 0,
          transferRelevant: 0,
          highPriority: 0,
          lastFetch: new Date(),
          errorCount: 0,
          successRate: 1.0,
        });

        console.log(
          applyTerryStyle.enhanceMessage(
            `Cached user info for @${account.username} (${user.public_metrics.followers_count.toLocaleString()} followers)`,
          ),
        );
      } catch (error) {
        const errorMsg = `Failed to cache @${account.username}: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMsg);
        console.error(applyTerryStyle.enhanceError(errorMsg));
      }
    }

    if (errors.length > 0) {
      throw new Error(
        applyTerryStyle.enhanceError(
          `Failed to initialize ${errors.length} ITK accounts: ${errors.join(", ")}`,
        ),
      );
    }

    console.log(
      applyTerryStyle.enhanceMessage(
        `Successfully initialized monitoring for ${ITK_ACCOUNTS.length} ITK accounts`,
      ),
    );
  }

  /**
   * Monitor all ITK accounts for new tweets
   */
  async monitorAllAccounts(): Promise<TweetProcessingResult[]> {
    console.log(
      applyTerryStyle.enhanceMessage("Starting ITK monitoring sweep"),
    );

    const allResults: TweetProcessingResult[] = [];
    const errors: string[] = [];

    for (const account of ITK_ACCOUNTS) {
      try {
        const results = await this.monitorAccount(account);
        allResults.push(...results);

        this.updateStats(
          account.username,
          results.length,
          results.filter((r) => r.isTransferRelated).length,
        );
      } catch (error) {
        const errorMsg = `Failed to monitor @${account.username}: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMsg);
        console.error(applyTerryStyle.enhanceError(errorMsg));

        this.incrementErrorCount(account.username);
      }

      // Be nice to Twitter's API
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (errors.length > 0) {
      console.warn(
        applyTerryStyle.enhanceMessage(
          `Completed monitoring with ${errors.length} errors: ${errors.join(", ")}`,
        ),
      );
    }

    console.log(
      applyTerryStyle.enhanceMessage(
        `Monitoring complete: ${allResults.length} tweets processed, ${allResults.filter((r) => r.isTransferRelated).length} transfer-relevant`,
      ),
    );

    return allResults;
  }

  /**
   * Monitor a specific ITK account
   */
  async monitorAccount(account: ITKAccount): Promise<TweetProcessingResult[]> {
    const user = this.userCache.get(account.username);
    if (!user) {
      throw new Error(
        `User @${account.username} not cached. Call initialize() first.`,
      );
    }

    const sinceId = this.lastFetchTimes.get(account.username);

    const response = await this.twitterClient.getUserTimeline(user.id, {
      maxResults: 50, // Reasonable batch size
      sinceId,
      username: account.username, // For hybrid client fallback
    });

    if (!response.data || response.data.length === 0) {
      return [];
    }

    // Update last fetch time
    this.lastFetchTimes.set(account.username, response.meta.newest_id!);

    const results: TweetProcessingResult[] = [];

    for (const tweet of response.data) {
      try {
        const result = await this.processTweet(tweet, user, account);
        results.push(result);

        // Store in database if transfer-relevant
        if (result.isTransferRelated) {
          await this.storeTweet(result);
        }
      } catch (error) {
        console.error(
          applyTerryStyle.enhanceError(
            `Failed to process tweet ${tweet.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
          ),
        );
      }
    }

    return results;
  }

  /**
   * Process individual tweet for transfer relevance
   */
  private async processTweet(
    tweet: TwitterTweet,
    user: TwitterUser,
    account: ITKAccount,
  ): Promise<TweetProcessingResult> {
    // Classify tweet for transfer relevance
    const classification = await transferKeywordClassifier.classifyTweet({
      text: tweet.text,
      contextAnnotations: tweet.context_annotations || [],
      authorTier: account.tier,
      authorSpecialties: account.specialties,
    });

    // Calculate priority based on multiple factors
    const priority = this.calculatePriority(
      tweet,
      user,
      account,
      classification,
    );

    // Extract entities (players, clubs, etc.)
    const entities = await transferKeywordClassifier.extractEntities(
      tweet.text,
    );

    // Calculate overall relevance score
    const relevanceScore = this.calculateRelevanceScore(
      classification,
      account,
      tweet.public_metrics,
      entities,
    );

    return {
      tweet,
      user,
      isTransferRelated: classification.isTransferRelated,
      confidence: classification.confidence,
      transferType: classification.transferType,
      priority,
      keywords: classification.keywords,
      playersExtracted: entities.players,
      clubsExtracted: entities.clubs,
      relevanceScore,
    };
  }

  /**
   * Calculate tweet priority based on multiple factors
   */
  private calculatePriority(
    tweet: TwitterTweet,
    user: TwitterUser,
    account: ITKAccount,
    classification: any,
  ): Priority {
    let score = 0;

    // Account tier influence
    switch (account.tier) {
      case "tier1":
        score += 40;
        break;
      case "tier2":
        score += 25;
        break;
      case "tier3":
        score += 10;
        break;
    }

    // Transfer type influence
    switch (classification.transferType) {
      case "OFFICIAL":
        score += 30;
        break;
      case "CONFIRMED":
        score += 25;
        break;
      case "MEDICAL":
        score += 20;
        break;
      case "ADVANCED":
        score += 15;
        break;
      case "TALKS":
        score += 10;
        break;
      case "RUMOUR":
        score += 5;
        break;
    }

    // Engagement influence
    const totalEngagement =
      tweet.public_metrics.retweet_count +
      tweet.public_metrics.like_count +
      tweet.public_metrics.reply_count;

    if (totalEngagement > 1000) score += 15;
    else if (totalEngagement > 500) score += 10;
    else if (totalEngagement > 100) score += 5;

    // Account reliability
    score += account.reliabilityScore * 10;

    // Convert score to priority
    if (score >= 80) return "BREAKING";
    if (score >= 60) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  }

  /**
   * Calculate overall relevance score
   */
  private calculateRelevanceScore(
    classification: any,
    account: ITKAccount,
    metrics: TwitterTweet["public_metrics"],
    entities: { players: string[]; clubs: string[] },
  ): number {
    if (!classification.isTransferRelated) return 0;

    let score = classification.confidence * 0.4; // Base confidence
    score += account.reliabilityScore * 0.3; // Account reliability
    score += Math.min(entities.players.length * 0.05, 0.15); // Player mentions
    score += Math.min(entities.clubs.length * 0.05, 0.15); // Club mentions

    // Engagement boost
    const engagementScore = Math.min(
      (metrics.retweet_count + metrics.like_count) / 1000,
      0.1,
    );
    score += engagementScore;

    return Math.min(score, 1.0);
  }

  /**
   * Store transfer-relevant tweet in database
   * TODO: Implement database storage with FeedItem model
   */
  private async storeTweet(result: TweetProcessingResult): Promise<void> {
    // TODO: Implement database storage with FeedItem model
    // Temporarily disabled until FeedItem integration is complete
    return;

    /* const {
      tweet,
      user,
      isTransferRelated,
      confidence,
      transferType,
      priority,
      keywords,
      playersExtracted,
      clubsExtracted,
    } = result;

    try {
      await prisma.tweet.create({
        data: {
          id: tweet.id,
          text: tweet.text,
          authorId: user.id,
          authorHandle: user.username,
          authorName: user.name,
          authorVerified: user.verified,
          authorFollowers: user.public_metrics.followers_count,
          createdAt: new Date(tweet.created_at),
          retweetCount: tweet.public_metrics.retweet_count,
          likeCount: tweet.public_metrics.like_count,
          replyCount: tweet.public_metrics.reply_count,
          quoteCount: tweet.public_metrics.quote_count,
          language: tweet.lang || 'en',
          hashtags: this.extractHashtags(tweet.text),
          urls: this.extractUrls(tweet.text),
          mediaUrls: this.extractMediaUrls(tweet),
          isTransferRelated,
          confidence,
          transferType,
          priority,
          keywords,
          playersExtracted,
          clubsExtracted,
          processed: true,
          processedAt: new Date(),
        },
      });

      console.log(
        applyTerryStyle.enhanceMessage(
          `Stored ${transferType} tweet from @${user.username}: "${tweet.text.substring(0, 100)}..."`
        )
      );
    } catch (error) {
      // Handle duplicate key errors gracefully
      if (
        error instanceof Error &&
        error.message.includes('Unique constraint')
      ) {
        console.log(`Tweet ${tweet.id} already exists, skipping`);
      } else {
        throw error;
      }
    } */
  }

  /**
   * Extract hashtags from tweet text
   */
  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#\w+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map((tag) => tag.substring(1)) : [];
  }

  /**
   * Extract URLs from tweet text
   */
  private extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/\S+/g;
    const matches = text.match(urlRegex);
    return matches || [];
  }

  /**
   * Extract media URLs from tweet attachments
   */
  private extractMediaUrls(tweet: TwitterTweet): string[] {
    // This would be populated by the includes.media data in a real implementation
    return [];
  }

  /**
   * Update monitoring statistics
   */
  private updateStats(
    username: string,
    totalTweets: number,
    transferRelevant: number,
  ): void {
    const stats = this.stats.get(username);
    if (stats) {
      stats.totalTweets += totalTweets;
      stats.transferRelevant += transferRelevant;
      stats.lastFetch = new Date();

      if (transferRelevant > 0) {
        stats.highPriority += transferRelevant;
      }

      // Update success rate (simple implementation)
      const totalAttempts = stats.totalTweets + stats.errorCount;
      stats.successRate =
        totalAttempts > 0 ? stats.totalTweets / totalAttempts : 1.0;
    }
  }

  /**
   * Increment error count for account
   */
  private incrementErrorCount(username: string): void {
    const stats = this.stats.get(username);
    if (stats) {
      stats.errorCount++;

      // Update success rate
      const totalAttempts = stats.totalTweets + stats.errorCount;
      stats.successRate =
        totalAttempts > 0 ? stats.totalTweets / totalAttempts : 0;
    }
  }

  /**
   * Get monitoring statistics for all accounts
   */
  getMonitoringStats(): Record<string, MonitoringStats> {
    const result: Record<string, MonitoringStats> = {};
    this.stats.forEach((stats, username) => {
      result[username] = { ...stats };
    });
    return result;
  }

  /**
   * Get rate limit status for the Twitter client
   */
  getRateLimitStatus() {
    return this.twitterClient.getRateLimitStatus();
  }
}

// Export singleton instance
// Note: This requires TWITTER_BEARER_TOKEN to be set in environment variables
const twitterClient = new TwitterClient({
  bearerToken: process.env.TWITTER_BEARER_TOKEN || "",
});
export const itkMonitor = new ITKMonitor(twitterClient);
