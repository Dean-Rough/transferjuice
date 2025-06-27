/**
 * Hybrid Twitter Client
 * Uses @the-convocation/twitter-scraper as primary with Twitter API v2 as fallback
 */

import {
  Scraper,
  Tweet as ScraperTweet,
} from "@the-convocation/twitter-scraper";
import { TwitterApi } from "twitter-api-v2";
import {
  getPlaywrightScraper,
  PlaywrightTwitterScraper,
} from "./playwright-scraper";

export interface SimplifiedTweet {
  id: string;
  text: string;
  media: Array<{
    type: "photo" | "video";
    url: string;
  }>;
  replies: number;
  createdAt: Date;
  author: {
    username: string;
    name: string;
    verified: boolean;
  };
}

export class HybridTwitterClient {
  private scraper: Scraper;
  private api: TwitterApi;
  private playwrightScraper: PlaywrightTwitterScraper;
  private scraperFailures = 0;
  private readonly MAX_FAILURES = 3;
  private initialized = false;
  private usePlaywright = false;

  constructor() {
    this.scraper = new Scraper();
    this.api = new TwitterApi(process.env.TWITTER_BEARER_TOKEN!);
    this.playwrightScraper = getPlaywrightScraper();
    this.usePlaywright = process.env.USE_PLAYWRIGHT_SCRAPER === "true";
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Only initialize scraper if credentials are provided
      if (
        process.env.TWITTER_SCRAPER_USERNAME &&
        process.env.TWITTER_SCRAPER_PASSWORD
      ) {
        console.log("🔐 Initializing Twitter scraper...");
        await this.scraper.login(
          process.env.TWITTER_SCRAPER_USERNAME,
          process.env.TWITTER_SCRAPER_PASSWORD,
        );
        console.log("✅ Twitter scraper initialized successfully");
      } else {
        console.log("⚠️ Twitter scraper credentials not found, using API only");
        this.scraperFailures = this.MAX_FAILURES + 1; // Force API-only mode
      }
    } catch (error) {
      console.error("❌ Failed to initialize Twitter scraper:", error);
      this.scraperFailures = this.MAX_FAILURES + 1;
    }

    this.initialized = true;
  }

  async getUserTweets(
    username: string,
    limit = 20,
  ): Promise<SimplifiedTweet[]> {
    // Ensure initialization
    if (!this.initialized) {
      await this.initialize();
    }

    // Use Playwright if enabled
    if (this.usePlaywright) {
      try {
        console.log(`🎭 Fetching tweets for @${username} using Playwright...`);
        return await this.playwrightScraper.scrapeUserTweets(username, limit);
      } catch (error) {
        console.error("❌ Playwright scraping failed:", error);
        // Fall through to other methods
      }
    }

    // Try scraper first if it hasn't failed too many times
    if (this.scraperFailures <= this.MAX_FAILURES) {
      try {
        console.log(`🔍 Fetching tweets for @${username} using scraper...`);
        return await this.getUserTweetsViaScraper(username, limit);
      } catch (error) {
        this.scraperFailures++;
        console.error(
          `❌ Scraper failed (${this.scraperFailures}/${this.MAX_FAILURES}):`,
          error,
        );

        if (this.scraperFailures > this.MAX_FAILURES) {
          console.warn(
            "⚠️ Max scraper failures reached, switching to API-only mode",
          );
        }
      }
    }

    // Fallback to Twitter API
    console.log(`🔄 Using Twitter API fallback for @${username}`);
    return await this.getUserTweetsViaAPI(username, limit);
  }

  private async getUserTweetsViaScraper(
    username: string,
    limit: number,
  ): Promise<SimplifiedTweet[]> {
    const tweets: SimplifiedTweet[] = [];
    const iterator = this.scraper.getTweets(username, limit);

    for await (const tweet of iterator) {
      tweets.push(this.transformScraperTweet(tweet));
      if (tweets.length >= limit) break;
    }

    console.log(`✅ Retrieved ${tweets.length} tweets via scraper`);
    return tweets;
  }

  private async getUserTweetsViaAPI(
    username: string,
    limit: number,
  ): Promise<SimplifiedTweet[]> {
    try {
      // Get user ID first
      const user = await this.api.v2.userByUsername(username, {
        "user.fields": ["verified"],
      });

      if (!user.data) {
        throw new Error(`User @${username} not found`);
      }

      // Get timeline
      const timeline = await this.api.v2.userTimeline(user.data.id, {
        max_results: Math.min(limit, 100), // API max is 100
        "tweet.fields": ["created_at", "public_metrics", "author_id"],
        "media.fields": ["url", "preview_image_url", "type"],
        "user.fields": ["username", "name", "verified"],
        expansions: ["attachments.media_keys", "author_id"],
      });

      const tweets: SimplifiedTweet[] = [];
      const mediaMap = new Map();
      const userMap = new Map();

      // Map media
      timeline.includes?.media?.forEach((media) => {
        mediaMap.set(media.media_key, media);
      });

      // Map users
      timeline.includes?.users?.forEach((u) => {
        userMap.set(u.id, u);
      });

      // Transform tweets
      for (const tweet of timeline.data.data || []) {
        const author = userMap.get(tweet.author_id!) || user.data;
        const tweetMedia: SimplifiedTweet["media"] = [];

        // Add media if present
        tweet.attachments?.media_keys?.forEach((key) => {
          const media = mediaMap.get(key);
          if (media) {
            tweetMedia.push({
              type: media.type as "photo" | "video",
              url: media.url || media.preview_image_url || "",
            });
          }
        });

        tweets.push({
          id: tweet.id,
          text: tweet.text,
          media: tweetMedia,
          replies: tweet.public_metrics?.reply_count || 0,
          createdAt: new Date(tweet.created_at!),
          author: {
            username: author.username,
            name: author.name,
            verified: author.verified || false,
          },
        });
      }

      console.log(`✅ Retrieved ${tweets.length} tweets via API`);
      return tweets;
    } catch (error) {
      console.error("❌ Twitter API error:", error);
      throw error;
    }
  }

  private transformScraperTweet(tweet: ScraperTweet): SimplifiedTweet {
    return {
      id: tweet.id!,
      text: tweet.text || "",
      media: [
        ...(tweet.photos || []).map((photo) => ({
          type: "photo" as const,
          url: photo.url,
        })),
        ...(tweet.videos || []).map((video) => ({
          type: "video" as const,
          url: video.url || "",
        })),
      ],
      replies: 0, // ScraperTweet doesn't have replyCount
      createdAt: new Date(tweet.timestamp! * 1000),
      author: {
        username: tweet.username!,
        name: tweet.name || tweet.username!,
        verified: false, // ScraperTweet doesn't have isVerified
      },
    };
  }

  async getTweetWithReplies(tweetId: string): Promise<{
    tweet: SimplifiedTweet;
    replies: SimplifiedTweet[];
  }> {
    // For now, just get the tweet - replies would need additional implementation
    throw new Error("getTweetWithReplies not yet implemented");
  }

  // Reset scraper failures (useful for periodic retry)
  resetScraperFailures(): void {
    this.scraperFailures = 0;
    console.log("🔄 Reset scraper failure count");
  }

  // Get current status
  getStatus(): {
    scraperAvailable: boolean;
    failureCount: number;
    mode: "hybrid" | "api-only";
  } {
    return {
      scraperAvailable: this.scraperFailures <= this.MAX_FAILURES,
      failureCount: this.scraperFailures,
      mode: this.scraperFailures <= this.MAX_FAILURES ? "hybrid" : "api-only",
    };
  }
}

// Singleton instance
let clientInstance: HybridTwitterClient | null = null;

export function getHybridTwitterClient(): HybridTwitterClient {
  if (!clientInstance) {
    clientInstance = new HybridTwitterClient();
  }
  return clientInstance;
}
