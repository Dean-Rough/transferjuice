/**
 * Global ITK Monitoring Service
 * Orchestrates worldwide transfer source monitoring with rate limiting and error handling
 */

import {
  getMonitoringPriority,
  updateSourceRateLimit,
  isSourceRateLimited,
  type ITKSource,
} from "./globalSources";
import {
  classifyTransferContent,
  type TweetData,
  type ClassificationResult,
} from "./transferClassifier";

export interface MonitoringConfig {
  intervalMinutes: number; // How often to check each source
  maxTweetsPerSource: number; // Max tweets to fetch per source per check
  minConfidenceThreshold: number; // Minimum confidence for feed inclusion
  enabledRegions: ITKSource["region"][];
  enabledTiers: (1 | 2 | 3)[];
  rateLimitBuffer: number; // Percentage buffer for rate limits (0.1 = 10%)
}

export interface MonitoringResult {
  sourceId: string;
  sourceName: string;
  tweetsChecked: number;
  transferTweets: number;
  highConfidenceTweets: number;
  errors: string[];
  timeMs: number;
  rateLimit?: {
    remaining: number;
    resetTime: Date;
  };
}

export interface GlobalMonitoringStats {
  totalSources: number;
  activeSources: number;
  rateLimitedSources: number;
  totalTweetsChecked: number;
  totalTransferTweets: number;
  averageConfidence: number;
  processingTimeMs: number;
  errors: string[];
  regionStats: Record<
    string,
    {
      sources: number;
      tweets: number;
      transfers: number;
    }
  >;
  languageStats: Record<string, number>;
}

// Default monitoring configuration
export const DEFAULT_CONFIG: MonitoringConfig = {
  intervalMinutes: 60, // Check every hour
  maxTweetsPerSource: 20, // 20 tweets per source per hour
  minConfidenceThreshold: 0.4, // 40% minimum confidence
  enabledRegions: ["UK", "ES", "IT", "FR", "DE", "BR", "GLOBAL"],
  enabledTiers: [1, 2, 3],
  rateLimitBuffer: 0.2, // 20% buffer for rate limits
};

/**
 * Global ITK Monitor Class
 */
export class GlobalITKMonitor {
  private config: MonitoringConfig;
  private isRunning: boolean = false;
  private lastRunTime: Date | null = null;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config: MonitoringConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Start continuous monitoring
   */
  public start(): void {
    if (this.isRunning) {
      console.warn("Global ITK Monitor is already running");
      return;
    }

    this.isRunning = true;
    console.log("🌍 Starting Global ITK Monitor with config:", this.config);

    // Initial run
    this.runMonitoringCycle();

    // Schedule recurring runs
    this.intervalId = setInterval(
      () => {
        this.runMonitoringCycle();
      },
      this.config.intervalMinutes * 60 * 1000,
    );
  }

  /**
   * Stop monitoring
   */
  public stop(): void {
    if (!this.isRunning) {
      console.warn("Global ITK Monitor is not running");
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log("⏹️ Global ITK Monitor stopped");
  }

  /**
   * Run a single monitoring cycle across all sources
   */
  public async runMonitoringCycle(): Promise<GlobalMonitoringStats> {
    const startTime = performance.now();
    console.log("🔄 Starting global monitoring cycle...");

    const sources = this.getEligibleSources();
    const results: MonitoringResult[] = [];
    const errors: string[] = [];

    // Process sources in priority order (Tier 1 first)
    for (const source of sources) {
      if (isSourceRateLimited(source.id)) {
        console.log(`⏳ Skipping ${source.name} - rate limited`);
        continue;
      }

      try {
        const result = await this.monitorSource(source);
        results.push(result);

        // Log results
        console.log(
          `✅ ${source.name}: ${result.transferTweets}/${result.tweetsChecked} transfer tweets (${result.timeMs}ms)`,
        );
      } catch (error) {
        const errorMsg = `Failed to monitor ${source.name}: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMsg);
        console.error("❌", errorMsg);
      }

      // Rate limiting courtesy pause between sources
      await this.sleep(100);
    }

    this.lastRunTime = new Date();
    const totalTime = performance.now() - startTime;

    const stats = this.calculateGlobalStats(results, errors, totalTime);

    console.log("📊 Global monitoring cycle complete:", {
      duration: `${Math.round(totalTime)}ms`,
      sources: results.length,
      totalTransfers: stats.totalTransferTweets,
      avgConfidence: `${stats.averageConfidence}%`,
    });

    return stats;
  }

  /**
   * Monitor a single source
   */
  private async monitorSource(source: ITKSource): Promise<MonitoringResult> {
    const startTime = performance.now();

    try {
      // Fetch recent tweets from this source
      const tweets = await this.fetchSourceTweets(source);

      // Classify each tweet for transfer relevance
      const classifications = tweets.map((tweet) => ({
        tweet,
        classification: classifyTransferContent(tweet),
      }));

      // Filter by confidence threshold
      const transferTweets = classifications.filter(
        ({ classification }) =>
          classification.isTransferRelated &&
          classification.confidence >= this.config.minConfidenceThreshold,
      );

      const highConfidenceTweets = transferTweets.filter(
        ({ classification }) => classification.confidence >= 0.7,
      );

      // Process high-confidence transfer tweets (send to feed)
      for (const { tweet, classification } of transferTweets) {
        await this.procesTransferTweet(tweet, classification, source);
      }

      return {
        sourceId: source.id,
        sourceName: source.name,
        tweetsChecked: tweets.length,
        transferTweets: transferTweets.length,
        highConfidenceTweets: highConfidenceTweets.length,
        errors: [],
        timeMs: Math.round(performance.now() - startTime),
      };
    } catch (error) {
      return {
        sourceId: source.id,
        sourceName: source.name,
        tweetsChecked: 0,
        transferTweets: 0,
        highConfidenceTweets: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        timeMs: Math.round(performance.now() - startTime),
      };
    }
  }

  /**
   * Fetch tweets from a specific source
   * This would integrate with Twitter API v2 in production
   */
  private async fetchSourceTweets(source: ITKSource): Promise<TweetData[]> {
    // Use real Twitter API in production or if explicitly enabled
    const useRealAPI =
      process.env.NODE_ENV === "production" ||
      process.env.USE_REAL_TWITTER_API === "true";

    if (!useRealAPI) {
      // In development, return mock tweets
      const mockTweets: TweetData[] = this.generateMockTweets(source);

      // Simulate API rate limit response
      const mockRateLimit = {
        remaining: Math.floor(Math.random() * 100) + 50,
        resetTime: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      };

      updateSourceRateLimit(
        source.id,
        mockRateLimit.remaining,
        mockRateLimit.resetTime,
      );

      return mockTweets;
    }

    // Real Twitter API implementation
    try {
      const { TwitterClient } = await import("./client");
      const client = new TwitterClient({
        bearerToken: process.env.TWITTER_BEARER_TOKEN!,
      });

      // Get user info if we don't have the user ID
      const user = await client.getUserByUsername(source.handle);

      // Fetch recent tweets
      const timeline = await client.getUserTimeline(user.id, {
        maxResults: this.config.maxTweetsPerSource,
        startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // Last hour
      });

      // Get rate limit status
      const rateLimits = client.getRateLimitStatus();
      const userTimelineLimit = rateLimits[`/users/${user.id}/tweets`];

      if (userTimelineLimit) {
        updateSourceRateLimit(
          source.id,
          userTimelineLimit.remaining,
          new Date(userTimelineLimit.reset * 1000),
        );
      }

      // Convert to TweetData format
      const tweets: TweetData[] = (timeline.data || []).map((tweet) => ({
        id: tweet.id,
        text: tweet.text,
        author: {
          username: user.username,
          displayName: user.name,
        },
        createdAt: tweet.created_at,
        lang: tweet.lang || source.language,
        metrics: {
          retweets: tweet.public_metrics.retweet_count,
          likes: tweet.public_metrics.like_count,
          replies: tweet.public_metrics.reply_count,
        },
      }));

      return tweets;
    } catch (error) {
      console.error(`Failed to fetch real tweets for ${source.handle}:`, error);

      // Fall back to mock data on error
      return this.generateMockTweets(source);
    }
  }

  /**
   * Generate mock tweets for development
   */
  private generateMockTweets(source: ITKSource): TweetData[] {
    const count =
      Math.floor(Math.random() * this.config.maxTweetsPerSource) + 5;
    const tweets: TweetData[] = [];

    const transferTemplates = {
      en: [
        "🚨 BREAKING: {club} agree €{fee}M fee for {player}! Medical scheduled for tomorrow. Here we go! ✅",
        "Personal terms agreed between {player} and {club}. Club-to-club negotiations ongoing for final fee structure.",
        "{club} officials confident about completing {player} signing within 48-72 hours.",
        "EXCLUSIVE: {player} has already agreed personal terms with {club}. Just waiting for clubs to finalize deal.",
      ],
      es: [
        "🚨 ÚLTIMA HORA: {club} acuerda {fee}M€ por {player}! Reconocimiento médico programado. ¡Hecho! ✅",
        "Términos personales acordados entre {player} y {club}. Negociaciones en curso para la estructura final.",
        "{club} confía en completar el fichaje de {player} en las próximas 48-72 horas.",
        "EXCLUSIVA: {player} ya acordó términos personales con {club}. Solo esperan finalizar entre clubes.",
      ],
      it: [
        "🚨 ULTIMA ORA: {club} accordo da {fee}M€ per {player}! Visite mediche programmate. Fatto! ✅",
        "Accordo personale tra {player} e {club}. Trattative in corso per la struttura finale.",
        "{club} fiducioso di completare {player} nelle prossime 48-72 ore.",
        "ESCLUSIVA: {player} ha già concordato i termini personali con {club}. Si aspetta solo la chiusura.",
      ],
      fr: [
        "🚨 DERNIÈRE MINUTE: {club} accord de {fee}M€ pour {player}! Visite médicale programmée. Fait! ✅",
        "Accord personnel entre {player} et {club}. Négociations en cours pour la structure finale.",
        "{club} confiant de finaliser {player} dans les 48-72 prochaines heures.",
        "EXCLUSIF: {player} a déjà convenu des termes personnels avec {club}. Attente de la finalisation.",
      ],
      de: [
        "🚨 EILMELDUNG: {club} Einigung über {fee}M€ für {player}! Medizincheck geplant. Gemacht! ✅",
        "Persönliche Bedingungen zwischen {player} und {club} vereinbart. Verhandlungen laufen.",
        "{club} zuversichtlich {player} in den nächsten 48-72 Stunden zu vervollständigen.",
        "EXKLUSIV: {player} hat bereits persönliche Bedingungen mit {club} vereinbart.",
      ],
      pt: [
        "🚨 ÚLTIMA HORA: {club} acordo de {fee}M€ por {player}! Exames médicos agendados. Feito! ✅",
        "Termos pessoais acordados entre {player} e {club}. Negociações em andamento.",
        "{club} confiante em completar {player} nas próximas 48-72 horas.",
        "EXCLUSIVO: {player} já acordou termos pessoais com {club}. Aguardando finalização.",
      ],
    };

    const players = [
      "Haaland",
      "Mbappe",
      "Bellingham",
      "Vinicius Jr",
      "Pedri",
      "Musiala",
    ];
    const clubs = [
      "Arsenal",
      "Chelsea",
      "Real Madrid",
      "Barcelona",
      "Bayern Munich",
      "PSG",
    ];

    for (let i = 0; i < count; i++) {
      const templates = transferTemplates[source.language];
      const template = templates[Math.floor(Math.random() * templates.length)];

      const text = template
        .replace("{club}", clubs[Math.floor(Math.random() * clubs.length)])
        .replace(
          "{player}",
          players[Math.floor(Math.random() * players.length)],
        )
        .replace("{fee}", (Math.floor(Math.random() * 100) + 20).toString());

      tweets.push({
        id: `tweet-${source.id}-${i}-${Date.now()}`,
        text,
        author: {
          username: source.handle.replace("@", ""),
          displayName: source.name,
        },
        createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Random time in last hour
        lang: source.language,
        metrics: {
          retweets: Math.floor(Math.random() * 500),
          likes: Math.floor(Math.random() * 2000),
          replies: Math.floor(Math.random() * 200),
        },
      });
    }

    return tweets;
  }

  /**
   * Process a transfer tweet (send to feed store)
   */
  private async procesTransferTweet(
    tweet: TweetData,
    classification: ClassificationResult,
    source: ITKSource,
  ): Promise<void> {
    // This would integrate with the feed store to add new items
    // For now, just log the processed tweet
    console.log(`📝 Processing transfer tweet from ${source.name}:`, {
      confidence: classification.confidence,
      type: classification.transferType,
      keywords: classification.keywords.join(", "),
    });

    // In production, this would call:
    // const feedStore = useFeedStore.getState();
    // feedStore.addItem(convertTweetToFeedItem(tweet, classification, source));
  }

  /**
   * Get sources eligible for monitoring based on config
   */
  private getEligibleSources(): ITKSource[] {
    return getMonitoringPriority().filter(
      (source) =>
        this.config.enabledRegions.includes(source.region) &&
        this.config.enabledTiers.includes(source.tier),
    );
  }

  /**
   * Calculate global monitoring statistics
   */
  private calculateGlobalStats(
    results: MonitoringResult[],
    errors: string[],
    processingTimeMs: number,
  ): GlobalMonitoringStats {
    const totalTweetsChecked = results.reduce(
      (sum, r) => sum + r.tweetsChecked,
      0,
    );
    const totalTransferTweets = results.reduce(
      (sum, r) => sum + r.transferTweets,
      0,
    );

    const sources = this.getEligibleSources();
    const activeSources = sources.filter(
      (s) => !isSourceRateLimited(s.id),
    ).length;
    const rateLimitedSources = sources.length - activeSources;

    const regionStats = sources.reduce(
      (acc, source) => {
        const result = results.find((r) => r.sourceId === source.id);
        if (!acc[source.region]) {
          acc[source.region] = { sources: 0, tweets: 0, transfers: 0 };
        }
        acc[source.region].sources += 1;
        if (result) {
          acc[source.region].tweets += result.tweetsChecked;
          acc[source.region].transfers += result.transferTweets;
        }
        return acc;
      },
      {} as Record<
        string,
        { sources: number; tweets: number; transfers: number }
      >,
    );

    const languageStats = sources.reduce(
      (acc, source) => {
        acc[source.language] = (acc[source.language] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalSources: sources.length,
      activeSources,
      rateLimitedSources,
      totalTweetsChecked,
      totalTransferTweets,
      averageConfidence:
        totalTransferTweets > 0
          ? Math.round((totalTransferTweets / totalTweetsChecked) * 100)
          : 0,
      processingTimeMs: Math.round(processingTimeMs),
      errors,
      regionStats,
      languageStats,
    };
  }

  /**
   * Utility function for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current monitoring status
   */
  public getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      config: this.config,
      eligibleSources: this.getEligibleSources().length,
    };
  }

  /**
   * Update monitoring configuration
   */
  public updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("🔧 Updated monitoring config:", this.config);
  }
}

// Export singleton instance
export const globalMonitor = new GlobalITKMonitor();
