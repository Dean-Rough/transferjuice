/**
 * Feed Item Data Access Layer
 * Database operations for ITK tweets and feed content
 */

import { prisma } from "@/lib/prisma";
import type {
  FeedItem,
  ITKSource,
  TransferType,
  Priority,
  League,
  Prisma,
} from "@prisma/client";

/**
 * Create feed items from tweets
 */
export async function createFeedItemsFromTweets(
  tweets: {
    content: string;
    originalText: string;
    sourceId: string;
    twitterId: string;
    originalUrl: string;
    publishedAt: Date;
    transferType?: TransferType;
    priority?: Priority;
    league?: League;
    relevanceScore: number;
    originalShares?: number;
    originalLikes?: number;
    originalReplies?: number;
    tagIds?: string[];
    terryCommentary?: string;
  }[],
) {
  return await prisma.$transaction(
    tweets.map((tweet) =>
      prisma.feedItem.create({
        data: {
          type: "ITK",
          content: tweet.content,
          originalText: tweet.originalText,
          sourceId: tweet.sourceId,
          twitterId: tweet.twitterId,
          originalUrl: tweet.originalUrl,
          publishedAt: tweet.publishedAt,
          transferType: tweet.transferType,
          priority: tweet.priority || "MEDIUM",
          league: tweet.league,
          relevanceScore: tweet.relevanceScore,
          originalShares: tweet.originalShares || 0,
          originalLikes: tweet.originalLikes || 0,
          originalReplies: tweet.originalReplies || 0,
          terryCommentary: tweet.terryCommentary,
          isProcessed: true,
          tags: tweet.tagIds
            ? {
                createMany: {
                  data: tweet.tagIds.map((tagId) => ({ tagId })),
                },
              }
            : undefined,
        },
      }),
    ),
  );
}

/**
 * Get unprocessed feed items for briefing generation
 */
export async function getUnprocessedFeedItems(
  since: Date,
  until: Date,
  limit = 100,
) {
  return await prisma.feedItem.findMany({
    where: {
      publishedAt: {
        gte: since,
        lte: until,
      },
      isProcessed: true,
      isArchived: false,
      type: {
        in: ["ITK", "BREAKING"],
      },
    },
    include: {
      source: true,
      tags: {
        include: {
          tag: true,
        },
      },
      media: true,
    },
    orderBy: [
      { priority: "desc" },
      { relevanceScore: "desc" },
      { publishedAt: "desc" },
    ],
    take: limit,
  });
}

/**
 * Get feed items by source
 */
export async function getFeedItemsBySource(
  sourceId: string,
  options?: {
    since?: Date;
    until?: Date;
    limit?: number;
    includeArchived?: boolean;
  },
) {
  const { since, until, limit = 50, includeArchived = false } = options || {};

  return await prisma.feedItem.findMany({
    where: {
      sourceId,
      ...(since || until
        ? {
            publishedAt: {
              ...(since && { gte: since }),
              ...(until && { lte: until }),
            },
          }
        : {}),
      ...(!includeArchived && { isArchived: false }),
    },
    include: {
      source: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

/**
 * Get feed items by tags
 */
export async function getFeedItemsByTags(
  tagNames: string[],
  options?: {
    since?: Date;
    until?: Date;
    limit?: number;
    requireAllTags?: boolean;
  },
) {
  const { since, until, limit = 50, requireAllTags = false } = options || {};

  const whereClause: Prisma.FeedItemWhereInput = {
    ...(since || until
      ? {
          publishedAt: {
            ...(since && { gte: since }),
            ...(until && { lte: until }),
          },
        }
      : {}),
    isArchived: false,
  };

  if (requireAllTags) {
    // Must have ALL specified tags
    whereClause.AND = tagNames.map((tagName) => ({
      tags: {
        some: {
          tag: {
            name: tagName,
          },
        },
      },
    }));
  } else {
    // Must have ANY of the specified tags
    whereClause.tags = {
      some: {
        tag: {
          name: {
            in: tagNames,
          },
        },
      },
    };
  }

  return await prisma.feedItem.findMany({
    where: whereClause,
    include: {
      source: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

/**
 * Mark feed items as used in briefing
 */
export async function markFeedItemsAsUsed(
  feedItemIds: string[],
  briefingId: string,
) {
  // Create briefing-feed item relationships
  await prisma.briefingFeedItem.createMany({
    data: feedItemIds.map((feedItemId, index) => ({
      briefingId,
      feedItemId,
      position: index,
      section: "main",
    })),
    skipDuplicates: true,
  });

  // Mark items as published
  await prisma.feedItem.updateMany({
    where: {
      id: {
        in: feedItemIds,
      },
    },
    data: {
      isPublished: true,
    },
  });
}

/**
 * Archive old feed items
 */
export async function archiveOldFeedItems(olderThan: Date) {
  const result = await prisma.feedItem.updateMany({
    where: {
      publishedAt: {
        lt: olderThan,
      },
      isArchived: false,
    },
    data: {
      isArchived: true,
    },
  });

  return result.count;
}

/**
 * Get trending topics from recent feed items
 */
export async function getTrendingTopics(
  since: Date,
  limit = 10,
): Promise<{ name: string; count: number; type: string }[]> {
  const result = await prisma.$queryRaw<
    { name: string; count: bigint; type: string }[]
  >`
    SELECT t.name, t.type, COUNT(DISTINCT fit.feed_item_id) as count
    FROM tags t
    JOIN feed_item_tags fit ON t.id = fit.tag_id
    JOIN feed_items fi ON fit.feed_item_id = fi.id
    WHERE fi.published_at >= ${since}
      AND fi.is_archived = false
    GROUP BY t.name, t.type
    ORDER BY count DESC
    LIMIT ${limit}
  `;

  return result.map((row) => ({
    name: row.name,
    type: row.type,
    count: Number(row.count),
  }));
}

/**
 * Get feed item statistics for a time period
 */
export async function getFeedItemStats(since: Date, until: Date) {
  const [totalItems, bySource, byType, byPriority, avgRelevance] =
    await Promise.all([
      // Total count
      prisma.feedItem.count({
        where: {
          publishedAt: { gte: since, lte: until },
        },
      }),

      // By source
      prisma.feedItem.groupBy({
        by: ["sourceId"],
        where: {
          publishedAt: { gte: since, lte: until },
        },
        _count: true,
      }),

      // By transfer type
      prisma.feedItem.groupBy({
        by: ["transferType"],
        where: {
          publishedAt: { gte: since, lte: until },
          transferType: { not: null },
        },
        _count: true,
      }),

      // By priority
      prisma.feedItem.groupBy({
        by: ["priority"],
        where: {
          publishedAt: { gte: since, lte: until },
        },
        _count: true,
      }),

      // Average relevance
      prisma.feedItem.aggregate({
        where: {
          publishedAt: { gte: since, lte: until },
        },
        _avg: {
          relevanceScore: true,
        },
      }),
    ]);

  // Get source names
  const sourceIds = bySource.map((s) => s.sourceId);
  const sources = await prisma.iTKSource.findMany({
    where: { id: { in: sourceIds } },
    select: { id: true, name: true },
  });
  const sourceMap = Object.fromEntries(sources.map((s) => [s.id, s.name]));

  return {
    totalItems,
    bySource: bySource.map((s) => ({
      sourceId: s.sourceId,
      sourceName: sourceMap[s.sourceId] || "Unknown",
      count: s._count,
    })),
    byType: byType.map((t) => ({
      type: t.transferType,
      count: t._count,
    })),
    byPriority: byPriority.map((p) => ({
      priority: p.priority,
      count: p._count,
    })),
    avgRelevance: avgRelevance._avg.relevanceScore || 0,
  };
}

/**
 * Check for similar stories that have already been briefed
 */
export async function findSimilarBriefedStories(
  feedItems: any[],
  lookbackHours = 48,
): Promise<
  {
    item: any;
    similarBriefings: Array<{
      briefingId: string;
      similarity: number;
      timestamp: Date;
    }>;
  }[]
> {
  const cutoffDate = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

  const duplicateChecks = await Promise.all(
    feedItems.map(async (item) => {
      // Extract key entities from the content
      const entities = extractContentEntities(item.content);

      if (entities.players.length === 0 && entities.clubs.length === 0) {
        return { item, similarBriefings: [] };
      }

      // Find briefings that contain similar entities
      // For now, return empty array to avoid schema issues
      // TODO: Fix the schema to match actual database structure
      const similarBriefings: Array<{
        briefingId: string;
        content: string;
        timestamp: Date;
      }> = [];

      // Calculate similarity scores
      const scoredSimilarities = similarBriefings
        .map((briefing) => ({
          briefingId: briefing.briefingId,
          timestamp: briefing.timestamp,
          similarity: calculateContentSimilarity(
            item.content,
            briefing.content,
          ),
        }))
        .filter((s) => s.similarity > 0.6); // Only return high similarity matches

      return { item, similarBriefings: scoredSimilarities };
    }),
  );

  return duplicateChecks.filter((check) => check.similarBriefings.length > 0);
}

/**
 * Extract player and club entities from content
 */
function extractContentEntities(content: string): {
  players: string[];
  clubs: string[];
} {
  const players = new Set<string>();
  const clubs = new Set<string>();

  // Enhanced patterns for player detection
  const playerPatterns = [
    /([A-Z][a-z]+ [A-Z][a-z]+)(?= to | from | has | agrees | signs | joins | leaves | moves)/gi,
    /🚨[^:]*:\s*([A-Z][a-z]+ [A-Z][a-z]+)/gi,
    /EXCLUSIVE:\s*([A-Z][a-z]+ [A-Z][a-z]+)/gi,
    /([A-Z][a-z]+ [A-Z][a-z]+) is set to/gi,
    /([A-Z][a-z]+ [A-Z][a-z]+) will join/gi,
  ];

  // Enhanced patterns for club detection
  const clubPatterns = [
    /(?:to |from |joins |leaves )(Arsenal|Liverpool|Manchester United|Manchester City|Chelsea|Tottenham|Real Madrid|Barcelona|Bayern Munich|PSG|Juventus|AC Milan|Inter Milan|Atletico Madrid|Borussia Dortmund)/gi,
    /(?:to |from |joins |leaves )([A-Z][a-z]+ (?:FC|United|City|Town|Rovers|Albion|Athletic|Wanderers))/gi,
    /(?:to |from |joins |leaves )([A-Z][a-z]+(?:'s)? (?:Football Club|FC))/gi,
  ];

  // Extract players
  playerPatterns.forEach((pattern) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 3) {
        players.add(match[1].trim());
      }
    }
  });

  // Extract clubs
  clubPatterns.forEach((pattern) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 2) {
        clubs.add(match[1].trim());
      }
    }
  });

  return {
    players: Array.from(players),
    clubs: Array.from(clubs),
  };
}

/**
 * Calculate similarity between two pieces of content
 */
function calculateContentSimilarity(
  content1: string,
  content2: string,
): number {
  // Extract key words from both contents
  const words1 = extractKeyWords(content1);
  const words2 = extractKeyWords(content2);

  if (words1.length === 0 || words2.length === 0) return 0;

  // Calculate Jaccard similarity
  const intersection = words1.filter((word) => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];

  return intersection.length / union.length;
}

/**
 * Extract meaningful words from content for similarity comparison
 */
function extractKeyWords(content: string): string[] {
  // Remove HTML tags and normalize
  const cleanContent = content
    .replace(/<[^>]*>/g, " ")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Split into words and filter out common words
  const stopWords = new Set([
    "the",
    "is",
    "at",
    "which",
    "on",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "with",
    "to",
    "for",
    "of",
    "as",
    "by",
    "from",
    "up",
    "into",
    "over",
    "after",
    "has",
    "have",
    "had",
    "will",
    "be",
    "been",
    "are",
    "was",
    "were",
  ]);

  return cleanContent
    .split(" ")
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 50); // Limit to first 50 meaningful words
}

/**
 * Get recently briefed transfer stories for a player or club
 */
export async function getRecentBriefedTransfers(
  entityName: string,
  entityType: "player" | "club",
  lookbackHours = 72,
): Promise<Array<{ briefingId: string; timestamp: Date; title: string }>> {
  const cutoffDate = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

  // For now, return empty array to avoid schema issues
  // TODO: Fix the schema to match actual database structure
  const results: Array<{ briefingId: string; timestamp: Date; title: string }> =
    [];

  return results;
}
