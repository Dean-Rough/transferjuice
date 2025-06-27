/**
 * RSS Feed Fetcher
 * Fetches and parses RSS feeds from partner sources
 */

import Parser from "rss-parser";
import { logger } from "@/lib/logger";
import {
  WEBSITE_SOURCES,
  type PartnerSource as WebsitePartnerSource,
  generateAttribution,
  TERRY_PARTNER_INTROS,
} from "./sources";
import type { PartnerContent } from "./contentMixer";
import type { PartnerSource } from "./partnerSources";

interface RSSItem {
  title?: string;
  link?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  isoDate?: string;
  pubDate?: string;
  creator?: string;
  categories?: string[];
}

interface RSSFeed {
  title?: string;
  description?: string;
  link?: string;
  items: RSSItem[];
}

export class RSSFetcher {
  private parser: Parser;
  private feedCache: Map<string, { feed: RSSFeed; fetchedAt: Date }> =
    new Map();
  private cacheTimeout = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        "User-Agent": "TransferJuice/1.0 (Football Transfer Aggregator)",
      },
    });
  }

  /**
   * Fetch RSS feed from a source
   */
  async fetchFeed(url: string): Promise<RSSFeed | null> {
    try {
      // Check cache first
      const cached = this.feedCache.get(url);
      if (
        cached &&
        Date.now() - cached.fetchedAt.getTime() < this.cacheTimeout
      ) {
        logger.info(`📋 Using cached RSS feed from ${url}`);
        return cached.feed;
      }

      logger.info(`📡 Fetching RSS feed from ${url}`);
      const feed = (await this.parser.parseURL(url)) as RSSFeed;

      // Cache the result
      this.feedCache.set(url, { feed, fetchedAt: new Date() });

      logger.info(`✅ Fetched ${feed.items.length} items from ${feed.title}`);
      return feed;
    } catch (error) {
      logger.error(`❌ Failed to fetch RSS feed from ${url}:`, error);
      return null;
    }
  }

  /**
   * Get partner content from configured sources
   */
  async getPartnerContent(
    maxItems: number = 10,
    categories?: string[],
  ): Promise<PartnerContent[]> {
    const content: PartnerContent[] = [];

    // For now, only fetch from website sources with RSS feeds
    const rssSources = WEBSITE_SOURCES.filter(
      (source) =>
        source.isActive &&
        source.url &&
        (!categories ||
          categories.some((cat) => source.categories.includes(cat))),
    );

    for (const source of rssSources) {
      try {
        const feedUrl = this.constructFeedUrl(source);
        if (!feedUrl) continue;

        const feed = await this.fetchFeed(feedUrl);
        if (!feed || !feed.items.length) continue;

        // Convert RSS items to partner content
        const sourceContent = feed.items
          .slice(0, Math.ceil(maxItems / rssSources.length))
          .map((item) => this.convertRSSToPartnerContent(item, source, feed))
          .filter((item): item is PartnerContent => item !== null);

        content.push(...sourceContent);
      } catch (error) {
        logger.error(`Failed to process RSS for ${source.name}:`, error);
      }
    }

    // Sort by date, newest first
    content.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

    return content.slice(0, maxItems);
  }

  /**
   * Get content for quiet periods based on context
   */
  async getQuietPeriodContent(
    recentTopics: { clubs: string[]; players: string[] },
    tone: "scandal" | "banter" | "mixed" = "mixed",
  ): Promise<PartnerContent | null> {
    try {
      // Get sources matching the desired tone
      const toneSources = WEBSITE_SOURCES.filter(
        (source) => source.isActive && source.tone === tone,
      );

      if (toneSources.length === 0) {
        return null;
      }

      // Try to fetch from multiple sources until we find relevant content
      for (const source of toneSources) {
        const feedUrl = this.constructFeedUrl(source);
        if (!feedUrl) continue;

        const feed = await this.fetchFeed(feedUrl);
        if (!feed || !feed.items.length) continue;

        // Find content relevant to recent topics
        const relevantItem = this.findRelevantContent(
          feed.items,
          recentTopics,
          source,
        );

        if (relevantItem) {
          return relevantItem;
        }
      }

      // If no relevant content found, return latest from a random source
      const randomSource =
        toneSources[Math.floor(Math.random() * toneSources.length)];
      const feedUrl = this.constructFeedUrl(randomSource);
      if (!feedUrl) return null;

      const feed = await this.fetchFeed(feedUrl);
      if (!feed || !feed.items.length) return null;

      return this.convertRSSToPartnerContent(feed.items[0], randomSource, feed);
    } catch (error) {
      logger.error("Failed to get quiet period content:", error);
      return null;
    }
  }

  /**
   * Generate Terry-style introduction for partner content
   */
  generateTerryIntro(content: PartnerContent): string {
    const intro =
      TERRY_PARTNER_INTROS[
        Math.floor(Math.random() * TERRY_PARTNER_INTROS.length)
      ];

    return `${intro} ${content.source.name} this absolute gem:`;
  }

  // Private methods

  private constructFeedUrl(source: WebsitePartnerSource): string | null {
    if (!source.url) return null;

    // Updated feed URLs from rss-sources.txt
    const knownFeeds: Record<string, string> = {
      sportbible: "https://www.sportbible.com/assets/feed/sportbible.xml",
      "daily-star-football": "https://www.dailystar.co.uk/sport/football.rss",
      "the-upshot":
        "https://feeds.acast.com/public/shows/65cdd33aeb45b100174d1a19",
      "football-culture-movement": "https://feeds.megaphone.fm/fcmpodcast",
      "undr-the-cosh": "https://feeds.megaphone.fm/COMG4202563768",
      "the-football-ramble":
        "https://feeds.acast.com/public/shows/footballramble",
    };

    if (knownFeeds[source.id]) {
      return knownFeeds[source.id];
    }

    // For sources with direct URLs, return them
    if (
      source.url.includes("feeds.") ||
      source.url.includes(".rss") ||
      source.url.includes("/feed")
    ) {
      return source.url;
    }

    // Try common patterns as fallback
    const baseUrl = source.url.replace(/\/$/, "");
    return `${baseUrl}/feed`;
  }

  private convertRSSToPartnerContent(
    item: RSSItem,
    source: WebsitePartnerSource,
    feed: RSSFeed,
  ): PartnerContent | null {
    if (!item.title || !item.link) return null;

    // Extract content
    const content = item.content || item.contentSnippet || "";
    if (!content) return null;

    // Check if football-related
    if (!this.isFootballRelated(item.title + " " + content)) {
      return null;
    }

    return {
      id: item.guid || item.link,
      title: item.title,
      content: this.cleanContent(content),
      url: item.link,
      publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
      author: item.creator || feed.title,
      category: this.categorizeContent(item, source),
      tags: this.extractTags(item),
      source: {
        id: source.id,
        name: source.name,
        website: source.url || "",
        description: source.description,
        category: "news" as const,
        credibility: 0.8,
        update_frequency: "daily" as const,
        tags: source.categories,
        attribution_format: source.attributionTemplate,
      },
      isSponsored: false,
    };
  }

  private findRelevantContent(
    items: RSSItem[],
    topics: { clubs: string[]; players: string[] },
    source: WebsitePartnerSource,
  ): PartnerContent | null {
    // Score items by relevance to recent topics
    const scoredItems = items.map((item) => {
      let score = 0;
      const text = (
        item.title +
        " " +
        (item.content || item.contentSnippet || "")
      ).toLowerCase();

      // Check for club mentions
      topics.clubs.forEach((club) => {
        if (text.includes(club.toLowerCase())) {
          score += 2;
        }
      });

      // Check for player mentions
      topics.players.forEach((player) => {
        if (text.includes(player.toLowerCase())) {
          score += 3; // Players are more specific
        }
      });

      return { item, score };
    });

    // Get highest scoring item
    const bestMatch = scoredItems
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)[0];

    if (bestMatch) {
      return this.convertRSSToPartnerContent(
        bestMatch.item,
        source,
        { items: [] }, // Feed object not needed here
      );
    }

    return null;
  }

  private isFootballRelated(text: string): boolean {
    const footballTerms = [
      "football",
      "soccer",
      "transfer",
      "signing",
      "player",
      "manager",
      "goal",
      "match",
      "league",
      "cup",
      "team",
      "striker",
      "midfielder",
      "defender",
      "goalkeeper",
      "premier league",
      "championship",
      "la liga",
      "serie a",
      "bundesliga",
      "ligue 1",
      "champions league",
      "europa league",
    ];

    const lowerText = text.toLowerCase();
    return footballTerms.some((term) => lowerText.includes(term));
  }

  private cleanContent(content: string): string {
    // Remove HTML tags
    let cleaned = content.replace(/<[^>]*>/g, "");

    // Decode HTML entities
    cleaned = cleaned
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");

    // Trim and limit length
    cleaned = cleaned.trim();
    if (cleaned.length > 500) {
      cleaned = cleaned.substring(0, 497) + "...";
    }

    return cleaned;
  }

  private categorizeContent(item: RSSItem, source: WebsitePartnerSource): string {
    // Use source categories as base
    if (source.categories.length > 0) {
      return source.categories[0];
    }

    // Try to detect from content
    const text = (item.title + " " + (item.content || "")).toLowerCase();

    if (text.includes("scandal") || text.includes("controversy")) {
      return "scandal";
    }
    if (text.includes("analysis") || text.includes("tactical")) {
      return "analysis";
    }
    if (text.includes("news") || text.includes("confirmed")) {
      return "news";
    }

    return "mixed";
  }

  private extractTags(item: RSSItem): string[] {
    const tags: string[] = [];

    // Use RSS categories if available
    if (item.categories) {
      tags.push(...item.categories);
    }

    // Extract common football entities from title
    const title = item.title || "";
    const commonClubs = [
      "Arsenal",
      "Chelsea",
      "Liverpool",
      "Man United",
      "Man City",
      "Tottenham",
      "Real Madrid",
      "Barcelona",
      "Bayern",
      "PSG",
    ];

    commonClubs.forEach((club) => {
      if (title.includes(club)) {
        tags.push(club);
      }
    });

    return [...new Set(tags)]; // Remove duplicates
  }
}

// Export singleton instance
export const rssFetcher = new RSSFetcher();
