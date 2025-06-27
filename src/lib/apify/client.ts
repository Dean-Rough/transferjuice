/**
 * Apify Client for Twitter Scraping
 * Replaces rate-limited Twitter API with Apify actors
 */

import { z } from "zod";

// Apify tweet schema
const ApifyTweetSchema = z.object({
  id: z.string(),
  text: z.string(),
  createdAt: z.string(),
  author: z.object({
    username: z.string(),
    displayName: z.string(),
    profileImageUrl: z.string().optional(),
  }),
  metrics: z
    .object({
      likeCount: z.number().default(0),
      retweetCount: z.number().default(0),
      replyCount: z.number().default(0),
    })
    .optional(),
  url: z.string(),
});

export type ApifyTweet = z.infer<typeof ApifyTweetSchema>;

// Apify run status schema
const ApifyRunStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["RUNNING", "SUCCEEDED", "FAILED", "TIMED-OUT", "ABORTED"]),
  defaultDatasetId: z.string().optional(),
});

export class ApifyClient {
  private apiToken: string;
  private baseUrl = "https://api.apify.com/v2";

  constructor(apiToken: string) {
    if (!apiToken) {
      throw new Error("Apify API token is required");
    }
    this.apiToken = apiToken;
  }

  /**
   * Fetch tweets from a specific user using Tweet Scraper V2
   */
  async fetchUserTweets(
    username: string,
    options: {
      maxItems?: number;
      sinceId?: string;
      includeReplies?: boolean;
    } = {},
  ): Promise<ApifyTweet[]> {
    const { maxItems = 20, sinceId, includeReplies = false } = options;

    console.log(`[Apify] Fetching tweets for @${username}`);

    // Start the actor run
    const runResponse = await fetch(
      `${this.baseUrl}/acts/apidojo~tweet-scraper/runs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchTerms: [`from:${username}`],
          searchMode: "live",
          maxItems,
          includeSearchTerms: false,
          excludeReplies: !includeReplies,
          sinceId: sinceId || undefined,
        }),
      },
    );

    if (!runResponse.ok) {
      const error = await runResponse.text();
      throw new Error(`Apify actor run failed: ${error}`);
    }

    const run = ApifyRunStatusSchema.parse(await runResponse.json());

    // Wait for the run to complete
    const dataset = await this.waitForRun(run.id);

    // Fetch the results
    const tweets = await this.fetchDataset(dataset.id);

    return tweets;
  }

  /**
   * Fetch tweets for multiple users in parallel
   */
  async fetchMultipleUsersTweets(
    usernames: string[],
    options: {
      maxItemsPerUser?: number;
      sinceIds?: Record<string, string>;
    } = {},
  ): Promise<Record<string, ApifyTweet[]>> {
    const { maxItemsPerUser = 20, sinceIds = {} } = options;

    console.log(`[Apify] Fetching tweets for ${usernames.length} users`);

    // Create search query for all users
    const searchQuery = usernames
      .map((username) => `from:${username}`)
      .join(" OR ");

    // Start the actor run
    const runResponse = await fetch(
      `${this.baseUrl}/acts/apidojo~tweet-scraper/runs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchTerms: [searchQuery],
          searchMode: "live",
          maxItems: maxItemsPerUser * usernames.length,
          includeSearchTerms: false,
          excludeReplies: true,
        }),
      },
    );

    if (!runResponse.ok) {
      const error = await runResponse.text();
      throw new Error(`Apify actor run failed: ${error}`);
    }

    const run = ApifyRunStatusSchema.parse(await runResponse.json());

    // Wait for the run to complete
    const dataset = await this.waitForRun(run.id);

    // Fetch the results
    const allTweets = await this.fetchDataset(dataset.id);

    // Group tweets by author
    const tweetsByUser: Record<string, ApifyTweet[]> = {};

    for (const tweet of allTweets) {
      const username = tweet.author.username.toLowerCase();
      if (!tweetsByUser[username]) {
        tweetsByUser[username] = [];
      }

      // Check if tweet is newer than sinceId
      const sinceId = sinceIds[username];
      if (!sinceId || tweet.id > sinceId) {
        tweetsByUser[username].push(tweet);
      }
    }

    // Ensure all requested users have an entry
    for (const username of usernames) {
      const lowerUsername = username.toLowerCase();
      if (!tweetsByUser[lowerUsername]) {
        tweetsByUser[lowerUsername] = [];
      }
    }

    return tweetsByUser;
  }

  /**
   * Wait for an Apify run to complete
   */
  private async waitForRun(
    runId: string,
    maxWaitMs = 60000,
  ): Promise<{ id: string }> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      const statusResponse = await fetch(
        `${this.baseUrl}/actor-runs/${runId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
          },
        },
      );

      if (!statusResponse.ok) {
        throw new Error(
          `Failed to check run status: ${statusResponse.statusText}`,
        );
      }

      const status = ApifyRunStatusSchema.parse(await statusResponse.json());

      if (status.status === "SUCCEEDED") {
        if (!status.defaultDatasetId) {
          throw new Error("Run succeeded but no dataset ID found");
        }
        return { id: status.defaultDatasetId };
      }

      if (
        status.status === "FAILED" ||
        status.status === "TIMED-OUT" ||
        status.status === "ABORTED"
      ) {
        throw new Error(`Run failed with status: ${status.status}`);
      }

      // Wait 2 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error("Run timed out waiting for completion");
  }

  /**
   * Fetch results from an Apify dataset
   */
  private async fetchDataset(datasetId: string): Promise<ApifyTweet[]> {
    const response = await fetch(
      `${this.baseUrl}/datasets/${datasetId}/items`,
      {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform Apify format to our format
    const tweets: ApifyTweet[] = data.map((item: any) => ({
      id: item.id || item.tweetId,
      text: item.text || item.full_text,
      createdAt: item.createdAt || item.created_at,
      author: {
        username: item.author?.username || item.user?.screen_name,
        displayName: item.author?.displayName || item.user?.name,
        profileImageUrl:
          item.author?.profileImageUrl || item.user?.profile_image_url_https,
      },
      metrics: {
        likeCount: item.likeCount || item.favorite_count || 0,
        retweetCount: item.retweetCount || item.retweet_count || 0,
        replyCount: item.replyCount || item.reply_count || 0,
      },
      url:
        item.url ||
        `https://twitter.com/${item.author?.username}/status/${item.id}`,
    }));

    return tweets.filter(
      (tweet) => tweet.id && tweet.text && tweet.author.username,
    );
  }

  /**
   * Test the Apify connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/acts/apidojo~tweet-scraper`,
        {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
          },
        },
      );

      return response.ok;
    } catch (error) {
      console.error("[Apify] Connection test failed:", error);
      return false;
    }
  }
}

// Export singleton instance (lazy initialization)
let _apifyClient: ApifyClient | null = null;

export const apifyClient = {
  get instance(): ApifyClient {
    if (!_apifyClient) {
      const token = process.env.APIFY_API_TOKEN;
      if (!token) {
        throw new Error(
          "Apify API token is required. Please set APIFY_API_TOKEN in your environment.",
        );
      }
      _apifyClient = new ApifyClient(token);
    }
    return _apifyClient;
  },

  // Proxy methods to maintain compatibility
  async fetchUserTweets(...args: Parameters<ApifyClient["fetchUserTweets"]>) {
    return this.instance.fetchUserTweets(...args);
  },

  async fetchMultipleUsersTweets(
    ...args: Parameters<ApifyClient["fetchMultipleUsersTweets"]>
  ) {
    return this.instance.fetchMultipleUsersTweets(...args);
  },

  async testConnection() {
    return this.instance.testConnection();
  },
};
