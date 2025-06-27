/**
 * Smart Content Mixing System
 * Intelligently mix partner content during ITK quiet periods
 */

// TODO: Fix circular dependency with feedStore
// import { type FeedItem } from '@/lib/stores/feedStore';

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
  PARTNER_SOURCES,
  type PartnerSource,
  getPartnerSourcesByCategory,
  formatAttribution,
} from "./partnerSources";

export interface PartnerContent {
  id: string;
  title: string;
  content: string;
  url: string;
  publishedAt: Date;
  author?: string;
  category: string;
  tags: string[];
  source: PartnerSource;
  isSponsored?: boolean;
}

export interface ContentMixingConfig {
  maxPartnerContentPerHour: number;
  minTimeBetweenPartnerContent: number; // minutes
  priorityCategories: string[];
  enableDuringBreakingNews: boolean;
  quietPeriodThreshold: number; // minutes since last ITK content
}

export interface ContentMixingResult {
  shouldMixContent: boolean;
  suggestedContent?: PartnerContent;
  reason: string;
  nextCheckIn: number; // minutes
}

export const DEFAULT_MIXING_CONFIG: ContentMixingConfig = {
  maxPartnerContentPerHour: 4, // Max 4 partner articles per hour
  minTimeBetweenPartnerContent: 15, // Min 15 minutes between partner content
  priorityCategories: ["analysis", "news"], // Prefer analysis and news over entertainment
  enableDuringBreakingNews: false, // Don't mix during breaking transfer news
  quietPeriodThreshold: 30, // Mix content if no ITK updates for 30+ minutes
};

/**
 * Smart Content Mixing System
 */
export class ContentMixer {
  private config: ContentMixingConfig;
  private partnerContentHistory: PartnerContent[] = [];
  private lastPartnerContentTime: Date | null = null;
  private hourlyPartnerCount: number = 0;
  private lastHourlyReset: Date = new Date();

  constructor(config: ContentMixingConfig = DEFAULT_MIXING_CONFIG) {
    this.config = config;
  }

  /**
   * Determine if we should mix partner content based on current feed state
   */
  public shouldMixPartnerContent(
    recentFeedItems: FeedItem[],
    currentTime: Date = new Date(),
  ): ContentMixingResult {
    // Reset hourly counter if needed
    this.resetHourlyCounterIfNeeded(currentTime);

    // Check if we've reached hourly limit
    if (this.hourlyPartnerCount >= this.config.maxPartnerContentPerHour) {
      return {
        shouldMixContent: false,
        reason: "Hourly partner content limit reached",
        nextCheckIn: this.getMinutesToHourlyReset(),
      };
    }

    // Check minimum time between partner content
    if (this.lastPartnerContentTime) {
      const minutesSinceLastPartner =
        (currentTime.getTime() - this.lastPartnerContentTime.getTime()) /
        (1000 * 60);

      if (minutesSinceLastPartner < this.config.minTimeBetweenPartnerContent) {
        return {
          shouldMixContent: false,
          reason: `Too soon since last partner content (${Math.round(minutesSinceLastPartner)} min ago)`,
          nextCheckIn:
            this.config.minTimeBetweenPartnerContent -
            Math.round(minutesSinceLastPartner),
        };
      }
    }

    // Check for breaking news (disable mixing if configured)
    if (!this.config.enableDuringBreakingNews) {
      const hasRecentBreaking = recentFeedItems.some(
        (item) =>
          item.type === "breaking" &&
          currentTime.getTime() - new Date(item.timestamp).getTime() <
            30 * 60 * 1000, // 30 min
      );

      if (hasRecentBreaking) {
        return {
          shouldMixContent: false,
          reason: "Breaking transfer news in progress",
          nextCheckIn: 10, // Check again in 10 minutes
        };
      }
    }

    // Check for quiet period (main trigger for content mixing)
    const lastITKTime = this.getLastITKTime(recentFeedItems);
    if (lastITKTime) {
      const minutesSinceLastITK =
        (currentTime.getTime() - lastITKTime.getTime()) / (1000 * 60);

      if (minutesSinceLastITK < this.config.quietPeriodThreshold) {
        return {
          shouldMixContent: false,
          reason: `Recent ITK activity (${Math.round(minutesSinceLastITK)} min ago)`,
          nextCheckIn:
            this.config.quietPeriodThreshold - Math.round(minutesSinceLastITK),
        };
      }
    }

    // All checks passed - we should mix content
    return {
      shouldMixContent: true,
      reason: "ITK quiet period detected - mixing partner content",
      nextCheckIn: this.config.minTimeBetweenPartnerContent,
    };
  }

  /**
   * Get suggested partner content for mixing
   */
  public async getSuggestedContent(
    recentFeedItems: FeedItem[],
    userPreferences?: string[],
  ): Promise<PartnerContent | null> {
    try {
      // Import RSS fetcher dynamically to avoid circular dependencies
      const { rssFetcher } = await import("./rssFetcher");

      // Extract recent topics for relevance matching
      const recentTopics = {
        clubs: this.getTrendingClubs(recentFeedItems),
        players: this.getTrendingPlayers(recentFeedItems),
      };

      // Determine tone based on time and context
      const tone = this.determineToneForQuietPeriod(recentFeedItems);

      // Try to get relevant content from RSS feeds
      const partnerContent = await rssFetcher.getQuietPeriodContent(
        recentTopics,
        tone,
      );

      if (partnerContent) {
        // Add Terry's introduction
        const terryIntro = rssFetcher.generateTerryIntro(partnerContent);
        partnerContent.content = `${terryIntro}\n\n${partnerContent.content}`;

        return partnerContent;
      }

      // Fallback to mock content if RSS fails
      console.warn("RSS fetching failed, falling back to mock content");
      return this.generateMockContent(recentFeedItems);
    } catch (error) {
      console.error("Failed to get suggested partner content:", error);
      return null;
    }
  }

  /**
   * Convert partner content to feed item
   */
  public convertPartnerContentToFeedItem(
    partnerContent: PartnerContent,
    withTerryCommentary: boolean = false,
  ): FeedItem {
    const feedItem: FeedItem = {
      id: `partner-${partnerContent.id}`,
      type: "partner",
      content: partnerContent.content,
      timestamp: partnerContent.publishedAt,
      source: {
        name: partnerContent.source.name,
        handle: partnerContent.source.website,
        tier: Math.ceil((1 - partnerContent.source.credibility) * 3) as
          | 1
          | 2
          | 3, // Convert credibility to tier
        reliability: partnerContent.source.credibility,
        region: "UK", // Most partner sources are UK-based
      },
      tags: {
        clubs: this.extractClubsFromContent(partnerContent.content),
        players: this.extractPlayersFromContent(partnerContent.content),
        sources: [partnerContent.source.name],
      },
      metadata: {
        priority: partnerContent.source.credibility >= 0.9 ? "high" : "medium",
        transferType: this.detectTransferType(partnerContent.content),
        relevanceScore: partnerContent.source.credibility,
        originalUrl: partnerContent.url,
        attribution: formatAttribution(
          partnerContent.source,
          partnerContent.url,
        ),
      },
    };

    // Add Terry commentary if requested and appropriate
    if (
      withTerryCommentary &&
      this.shouldTerryCommentOnPartnerContent(partnerContent)
    ) {
      feedItem.terryCommentary =
        this.generatePartnerContentCommentary(partnerContent);
    }

    return feedItem;
  }

  /**
   * Track that partner content was added to feed
   */
  public trackPartnerContentAdded(content: PartnerContent): void {
    this.partnerContentHistory.push(content);
    this.lastPartnerContentTime = new Date();
    this.hourlyPartnerCount++;

    // Keep only last 50 items in history
    if (this.partnerContentHistory.length > 50) {
      this.partnerContentHistory = this.partnerContentHistory.slice(-50);
    }

    console.log(
      `📰 Partner content added: ${content.source.name} - "${content.title}"`,
    );
    console.log(
      `   Attribution: ${formatAttribution(content.source, content.url)}`,
    );
  }

  /**
   * Get content mixing analytics
   */
  public getAnalytics() {
    const now = new Date();
    const last24Hours = this.partnerContentHistory.filter(
      (content) =>
        now.getTime() - content.publishedAt.getTime() <= 24 * 60 * 60 * 1000,
    );

    const sourceStats = last24Hours.reduce(
      (acc, content) => {
        const sourceName = content.source.name;
        acc[sourceName] = (acc[sourceName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const categoryStats = last24Hours.reduce(
      (acc, content) => {
        acc[content.category] = (acc[content.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalPartnerContent24h: last24Hours.length,
      hourlyPartnerCount: this.hourlyPartnerCount,
      lastPartnerContentTime: this.lastPartnerContentTime,
      sourceBreakdown: sourceStats,
      categoryBreakdown: categoryStats,
      averageCredibility:
        last24Hours.length > 0
          ? last24Hours.reduce((sum, c) => sum + c.source.credibility, 0) /
            last24Hours.length
          : 0,
    };
  }

  /**
   * Update content mixing configuration
   */
  public updateConfig(newConfig: Partial<ContentMixingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("🔧 Updated content mixing config:", this.config);
  }

  // Private helper methods

  private resetHourlyCounterIfNeeded(currentTime: Date): void {
    const hoursSinceReset =
      (currentTime.getTime() - this.lastHourlyReset.getTime()) /
      (1000 * 60 * 60);

    if (hoursSinceReset >= 1) {
      this.hourlyPartnerCount = 0;
      this.lastHourlyReset = currentTime;
    }
  }

  private getMinutesToHourlyReset(): number {
    const now = new Date();
    const nextHour = new Date(this.lastHourlyReset);
    nextHour.setHours(nextHour.getHours() + 1);
    return Math.ceil((nextHour.getTime() - now.getTime()) / (1000 * 60));
  }

  private getLastITKTime(recentFeedItems: FeedItem[]): Date | null {
    const itkItems = recentFeedItems
      .filter((item) => item.type === "itk" || item.type === "breaking")
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

    return itkItems.length > 0 ? new Date(itkItems[0].timestamp) : null;
  }

  private generateContextualContent(
    source: PartnerSource,
    recentFeedItems: FeedItem[],
  ): PartnerContent {
    // Extract trending topics from recent feed
    const trendingClubs = this.getTrendingClubs(recentFeedItems);
    const trendingPlayers = this.getTrendingPlayers(recentFeedItems);

    // Generate content based on source category and trending topics
    const contentTemplates = this.getContentTemplates(source.category);
    const template =
      contentTemplates[Math.floor(Math.random() * contentTemplates.length)];

    const title = template.title
      .replace("{club}", trendingClubs[0] || "Premier League")
      .replace("{player}", trendingPlayers[0] || "star player");

    const content = template.content
      .replace("{club}", trendingClubs[0] || "the club")
      .replace("{player}", trendingPlayers[0] || "the player");

    return {
      id: `${source.id}-${Date.now()}`,
      title,
      content,
      url: `${source.website}/article/${Date.now()}`,
      publishedAt: new Date(),
      category: source.category,
      tags: [...trendingClubs, ...trendingPlayers, ...source.tags],
      source,
    };
  }

  private getTrendingClubs(recentFeedItems: FeedItem[]): string[] {
    const clubCounts: Record<string, number> = {};

    recentFeedItems.forEach((item) => {
      if (item.tags && item.tags.clubs) {
        item.tags.clubs.forEach((club: string) => {
          clubCounts[club] = (clubCounts[club] || 0) + 1;
        });
      }
    });

    return Object.entries(clubCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([club]) => club)
      .slice(0, 3);
  }

  private getTrendingPlayers(recentFeedItems: FeedItem[]): string[] {
    const playerCounts: Record<string, number> = {};

    recentFeedItems.forEach((item) => {
      if (item.tags && item.tags.players) {
        item.tags.players.forEach((player: string) => {
          playerCounts[player] = (playerCounts[player] || 0) + 1;
        });
      }
    });

    return Object.entries(playerCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([player]) => player)
      .slice(0, 3);
  }

  private getContentTemplates(category: string) {
    const templates = {
      analysis: [
        {
          title:
            "Tactical Analysis: How {club}'s transfer strategy is shaping their season",
          content:
            "Deep dive into {club}'s recent transfer decisions and their tactical implications for the upcoming matches. Analysis includes formation changes and player positioning strategies.",
        },
        {
          title: "Transfer Impact: {player}'s role in modern football tactics",
          content:
            "Examining how {player}'s potential move could reshape tactical approaches across European football. Data-driven analysis of positional trends and market valuations.",
        },
      ],
      news: [
        {
          title: "Transfer Roundup: Latest developments around {club}",
          content:
            "Comprehensive update on {club}'s transfer activities, including confirmed deals, ongoing negotiations, and potential future targets for the current window.",
        },
        {
          title: "Market Watch: {player} situation developments",
          content:
            "Latest updates on {player}'s transfer situation, including club interest, personal terms negotiations, and potential impact on squad dynamics.",
        },
      ],
      entertainment: [
        {
          title: "Football Culture: The {club} phenomenon explained",
          content:
            "Exploring the cultural impact of {club}'s recent transfer activities and what it means for fan culture and football entertainment worldwide.",
        },
      ],
      tactical: [
        {
          title: "Formation Focus: How {club} could line up with new signings",
          content:
            "Tactical breakdown of {club}'s potential formations and strategies with their new signings, including strengths, weaknesses, and matchup advantages.",
        },
      ],
    };

    return templates[category as keyof typeof templates] || templates.news;
  }

  private extractClubsFromContent(content: string): string[] {
    const commonClubs = [
      "Arsenal",
      "Chelsea",
      "Liverpool",
      "Manchester United",
      "Manchester City",
      "Tottenham",
      "Real Madrid",
      "Barcelona",
      "Bayern Munich",
      "PSG",
      "Juventus",
    ];

    return commonClubs.filter((club) =>
      content.toLowerCase().includes(club.toLowerCase()),
    );
  }

  private extractPlayersFromContent(content: string): string[] {
    // In production, this would use NLP to extract player names
    // For now, return empty array
    return [];
  }

  private detectTransferType(
    content: string,
  ):
    | "confirmed"
    | "medical"
    | "rumour"
    | "signing"
    | "bid"
    | "personal_terms"
    | undefined {
    const transferKeywords = {
      confirmed: ["confirmed", "official", "announced"],
      rumour: ["rumoured", "linked", "interested"],
      medical: ["medical", "medical tests"],
      personal_terms: ["personal terms", "contract negotiations"],
    };

    const contentLower = content.toLowerCase();

    for (const [type, keywords] of Object.entries(transferKeywords)) {
      if (keywords.some((keyword) => contentLower.includes(keyword))) {
        return type as
          | "confirmed"
          | "medical"
          | "rumour"
          | "signing"
          | "bid"
          | "personal_terms";
      }
    }

    return undefined;
  }

  private shouldTerryCommentOnPartnerContent(content: PartnerContent): boolean {
    // Terry comments less frequently on partner content (30% chance)
    // and prefers analysis/news over entertainment
    const categoryMultiplier = {
      analysis: 0.4,
      news: 0.3,
      tactical: 0.35,
      entertainment: 0.2,
    };

    const chance =
      categoryMultiplier[content.category as keyof typeof categoryMultiplier] ||
      0.2;
    return Math.random() < chance;
  }

  private generatePartnerContentCommentary(content: PartnerContent): string {
    const partnerTemplates = [
      `Right, {source} doing the heavy lifting while we wait for the next ITK update to set Twitter ablaze.`,
      `Quality content from {source} to fill the void between "Here we go!" announcements.`,
      `{source} proving that football journalism doesn't always have to involve someone's medical being "scheduled for tomorrow."`,
      `Proper analysis from {source} - the kind that doesn't require refreshing Twitter every 30 seconds.`,
      `{source} with the sensible take while we wait for the next transfer circus to begin.`,
    ];

    const template =
      partnerTemplates[Math.floor(Math.random() * partnerTemplates.length)];
    return template.replace("{source}", content.source.name);
  }

  private determineToneForQuietPeriod(
    recentFeedItems: FeedItem[],
  ): "scandal" | "banter" | "mixed" {
    const hour = new Date().getHours();

    // Evening - more entertainment/scandal content
    if (hour >= 18 || hour < 2) {
      return "scandal";
    }

    // Weekend afternoons - banter content
    const day = new Date().getDay();
    if ((day === 0 || day === 6) && hour >= 12 && hour < 18) {
      return "banter";
    }

    // Default to mixed content
    return "mixed";
  }

  private async generateMockContent(
    recentFeedItems: FeedItem[],
  ): Promise<PartnerContent | null> {
    // Fallback mock content generation (existing implementation)
    const preferredCategories = this.config.priorityCategories;

    // Get sources from preferred categories
    const candidateSources: PartnerSource[] = [];
    for (const category of preferredCategories) {
      const sources = getPartnerSourcesByCategory(category as any);
      candidateSources.push(...sources);
    }

    if (candidateSources.length === 0) {
      return null;
    }

    // Select a random high-credibility source
    const highCredibilitySources = candidateSources.filter(
      (s) => s.credibility >= 0.85,
    );
    const selectedSource =
      highCredibilitySources.length > 0
        ? highCredibilitySources[
            Math.floor(Math.random() * highCredibilitySources.length)
          ]
        : candidateSources[Math.floor(Math.random() * candidateSources.length)];

    // Generate contextual content based on recent feed activity
    const content = this.generateContextualContent(
      selectedSource,
      recentFeedItems,
    );

    return content;
  }
}

// Export singleton instance
export const contentMixer = new ContentMixer();
