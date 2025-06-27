/**
 * Twitter Filtered Stream API Client
 * Real-time streaming connection for ITK sources
 */

import { broadcastUpdate } from "@/lib/realtime/broadcaster";
import { transferKeywordClassifier } from "./transfer-classifier";
import { applyTerryStyle } from "@/lib/terry-style";
import { ITK_ACCOUNTS } from "./itk-monitor";
import { streamToBriefingProcessor } from "./stream-to-briefing";

interface StreamRule {
  value: string;
  tag?: string;
  id?: string;
}

interface StreamTweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
  context_annotations?: Array<{
    domain: { id: string; name: string };
    entity: { id: string; name: string };
  }>;
  includes?: {
    users?: Array<{
      id: string;
      username: string;
      name: string;
      verified: boolean;
    }>;
  };
}

interface StreamResponse {
  data: StreamTweet;
  includes?: {
    users?: Array<{
      id: string;
      username: string;
      name: string;
      verified: boolean;
    }>;
  };
  matching_rules?: Array<{
    id: string;
    tag: string;
  }>;
}

export class TwitterFilteredStream {
  private bearerToken: string;
  private isConnected: boolean = false;
  private controller?: AbortController;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000; // Start with 5 seconds

  constructor(bearerToken: string) {
    this.bearerToken = bearerToken;
  }

  /**
   * Create stream rules for ITK sources
   */
  async createStreamRules(): Promise<void> {
    console.log(
      applyTerryStyle.enhanceMessage(
        "Setting up Twitter Filtered Stream rules...",
      ),
    );

    // Build rules from ITK accounts
    const rules: StreamRule[] = ITK_ACCOUNTS.map((account) => ({
      value: `from:${account.username}`,
      tag: `itk_${account.tier}_${account.username}`,
    }));

    // Add some general transfer keywords as backup
    rules.push({
      value: '("here we go" OR "medical" OR "signing" OR "confirmed") lang:en',
      tag: "transfer_keywords_en",
    });

    try {
      // First, get existing rules
      const existingRules = await this.getStreamRules();

      // Delete existing rules if any
      if (existingRules.length > 0) {
        await this.deleteStreamRules(existingRules.map((rule) => rule.id));
      }

      // Add new rules
      const response = await fetch(
        "https://api.twitter.com/2/tweets/search/stream/rules",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.bearerToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ add: rules }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(
          `Failed to create stream rules: ${response.status} ${error}`,
        );
      }

      const result = await response.json();
      console.log(
        applyTerryStyle.enhanceMessage(
          `Created ${result.data?.length || 0} stream rules for ${ITK_ACCOUNTS.length} ITK sources`,
        ),
      );
    } catch (error) {
      console.error(
        applyTerryStyle.enhanceError(`Failed to create stream rules: ${error}`),
      );
      throw error;
    }
  }

  /**
   * Get existing stream rules
   */
  private async getStreamRules(): Promise<
    Array<{ id: string; value: string; tag?: string }>
  > {
    const response = await fetch(
      "https://api.twitter.com/2/tweets/search/stream/rules",
      {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get stream rules: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Delete stream rules
   */
  private async deleteStreamRules(ruleIds: string[]): Promise<void> {
    if (ruleIds.length === 0) return;

    const response = await fetch(
      "https://api.twitter.com/2/tweets/search/stream/rules",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ delete: { ids: ruleIds } }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to delete stream rules: ${response.status}`);
    }

    console.log(
      applyTerryStyle.enhanceMessage(
        `Deleted ${ruleIds.length} existing stream rules`,
      ),
    );
  }

  /**
   * Start the filtered stream connection
   */
  async startStream(): Promise<void> {
    if (this.isConnected) {
      console.log("Stream already connected");
      return;
    }

    try {
      // Create stream rules first
      await this.createStreamRules();

      // Start streaming
      await this.connectToStream();
    } catch (error) {
      console.error(
        applyTerryStyle.enhanceError(`Failed to start stream: ${error}`),
      );
      throw error;
    }
  }

  /**
   * Connect to the Twitter stream
   */
  private async connectToStream(): Promise<void> {
    this.controller = new AbortController();

    const streamUrl = new URL("https://api.twitter.com/2/tweets/search/stream");

    // Add expansions and fields for rich data
    const params = new URLSearchParams({
      expansions: "author_id,attachments.media_keys",
      "tweet.fields":
        "created_at,public_metrics,context_annotations,possibly_sensitive,lang",
      "user.fields": "username,name,verified,public_metrics",
    });

    streamUrl.search = params.toString();

    console.log(
      applyTerryStyle.enhanceMessage(
        "Connecting to Twitter Filtered Stream...",
      ),
    );

    try {
      const response = await fetch(streamUrl.toString(), {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
        },
        signal: this.controller.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(
          `Stream connection failed: ${response.status} ${error}`,
        );
      }

      if (!response.body) {
        throw new Error("No response body received from stream");
      }

      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log(
        applyTerryStyle.enhanceMessage(
          "🎉 Connected to Twitter Filtered Stream!",
        ),
      );

      // Process the stream
      await this.processStream(response.body);
    } catch (error) {
      this.isConnected = false;

      if (error instanceof Error && error.name === "AbortError") {
        console.log("Stream connection aborted");
        return;
      }

      console.error(
        applyTerryStyle.enhanceError(`Stream connection error: ${error}`),
      );

      // Attempt reconnection
      await this.handleReconnection();
    }
  }

  /**
   * Process the stream data
   */
  private async processStream(
    stream: ReadableStream<Uint8Array>,
  ): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (this.isConnected) {
        const { done, value } = await reader.read();

        if (done) {
          console.log("Stream ended");
          break;
        }

        // Decode and buffer the data
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split("\r\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            await this.processTweet(line);
          }
        }
      }
    } catch (error) {
      console.error(
        applyTerryStyle.enhanceError(`Error processing stream: ${error}`),
      );
      throw error;
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Process individual tweet from stream
   */
  private async processTweet(tweetData: string): Promise<void> {
    try {
      const streamResponse: StreamResponse = JSON.parse(tweetData);

      if (!streamResponse.data) {
        // Skip non-tweet messages (heartbeats, etc.)
        return;
      }

      const tweet = streamResponse.data;
      const user = streamResponse.includes?.users?.find(
        (u) => u.id === tweet.author_id,
      );

      if (!user) {
        console.warn(`No user data found for tweet ${tweet.id}`);
        return;
      }

      console.log(
        applyTerryStyle.enhanceMessage(
          `📥 Stream tweet from @${user.username}: "${tweet.text.substring(0, 100)}..."`,
        ),
      );

      // Find the ITK account for this user
      const itkAccount = ITK_ACCOUNTS.find(
        (account) =>
          account.username.toLowerCase() === user.username.toLowerCase(),
      );

      if (!itkAccount) {
        console.log(`Tweet from non-ITK source: @${user.username}`);
        return;
      }

      // Classify for transfer relevance
      const classification = await transferKeywordClassifier.classifyTweet({
        text: tweet.text,
        contextAnnotations: tweet.context_annotations || [],
        authorTier: itkAccount.tier,
        authorSpecialties: itkAccount.specialties,
      });

      if (!classification.isTransferRelated) {
        console.log(`Non-transfer tweet from @${user.username}, skipping`);
        return;
      }

      // Create feed item for SSE broadcast
      const feedItem = {
        id: tweet.id,
        type: "itk" as const,
        timestamp: new Date(tweet.created_at),
        content: tweet.text,
        source: {
          name: itkAccount.displayName,
          handle: `@${user.username}`,
          tier:
            itkAccount.tier === "tier1"
              ? 1
              : itkAccount.tier === "tier2"
                ? 2
                : 3,
          reliability: itkAccount.reliabilityScore,
        },
        tags: {
          clubs: [], // TODO: Extract from classification
          players: [], // TODO: Extract from classification
          sources: [user.username],
        },
        metadata: {
          transferType: classification.transferType,
          priority:
            classification.confidence > 0.8
              ? "high"
              : classification.confidence > 0.5
                ? "medium"
                : "low",
          relevanceScore: classification.confidence,
          originalUrl: `https://twitter.com/${user.username}/status/${tweet.id}`,
        },
        engagement: {
          shares: tweet.public_metrics.retweet_count,
          reactions: tweet.public_metrics.like_count,
          clicks: tweet.public_metrics.reply_count,
        },
      };

      console.log(
        applyTerryStyle.enhanceMessage(
          `🚀 Broadcasting transfer tweet: ${classification.transferType} (${Math.round(classification.confidence * 100)}% confidence)`,
        ),
      );

      // Broadcast to connected clients via SSE
      broadcastUpdate("feed-update", feedItem);

      // Process for briefing generation
      const streamTweetData = {
        id: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at,
        author_id: tweet.author_id,
        username: user.username,
        source: feedItem.source,
        public_metrics: tweet.public_metrics,
        metadata: feedItem.metadata,
      };

      await streamToBriefingProcessor.processTweet(streamTweetData);

      console.log(
        applyTerryStyle.enhanceMessage(`📝 Tweet sent to briefing processor`),
      );
    } catch (error) {
      console.error(
        applyTerryStyle.enhanceError(`Error processing tweet: ${error}`),
      );
      // Don't throw - continue processing other tweets
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private async handleReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        applyTerryStyle.enhanceError(
          `Max reconnection attempts (${this.maxReconnectAttempts}) reached. Giving up.`,
        ),
      );
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(
      applyTerryStyle.enhanceMessage(
        `Reconnecting to stream in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      ),
    );

    await new Promise((resolve) => setTimeout(resolve, delay));

    if (!this.isConnected) {
      await this.connectToStream();
    }
  }

  /**
   * Stop the stream
   */
  async stopStream(): Promise<void> {
    console.log(
      applyTerryStyle.enhanceMessage("Stopping Twitter Filtered Stream..."),
    );

    this.isConnected = false;

    if (this.controller) {
      this.controller.abort();
    }

    console.log(applyTerryStyle.enhanceMessage("Twitter stream stopped"));
  }

  /**
   * Get stream status
   */
  getStatus(): {
    isConnected: boolean;
    reconnectAttempts: number;
    rules: Promise<Array<{ id: string; value: string; tag?: string }>>;
  } {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      rules: this.getStreamRules(),
    };
  }
}

// Export singleton instance
let streamInstance: TwitterFilteredStream | null = null;

export function getTwitterStream(): TwitterFilteredStream {
  if (!streamInstance) {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken) {
      throw new Error("TWITTER_BEARER_TOKEN environment variable is required");
    }
    streamInstance = new TwitterFilteredStream(bearerToken);
  }
  return streamInstance;
}

export async function startTwitterStream(): Promise<void> {
  const stream = getTwitterStream();
  await stream.startStream();
}

export async function stopTwitterStream(): Promise<void> {
  if (streamInstance) {
    await streamInstance.stopStream();
  }
}

export function getTwitterStreamStatus() {
  return (
    streamInstance?.getStatus() || {
      isConnected: false,
      reconnectAttempts: 0,
      rules: Promise.resolve([]),
    }
  );
}
