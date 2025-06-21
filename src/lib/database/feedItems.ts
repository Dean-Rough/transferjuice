/**
 * Feed Item Data Access Layer
 * Database operations for ITK tweets and feed content
 */

import { prisma } from '@/lib/prisma';
import type { 
  FeedItem,
  ITKSource,
  TransferType,
  Priority,
  League,
  Prisma
} from '@prisma/client';

/**
 * Create feed items from tweets
 */
export async function createFeedItemsFromTweets(tweets: {
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
}[]) {
  return await prisma.$transaction(
    tweets.map(tweet => 
      prisma.feedItem.create({
        data: {
          type: 'ITK',
          content: tweet.content,
          originalText: tweet.originalText,
          sourceId: tweet.sourceId,
          twitterId: tweet.twitterId,
          originalUrl: tweet.originalUrl,
          publishedAt: tweet.publishedAt,
          transferType: tweet.transferType,
          priority: tweet.priority || 'MEDIUM',
          league: tweet.league,
          relevanceScore: tweet.relevanceScore,
          originalShares: tweet.originalShares || 0,
          originalLikes: tweet.originalLikes || 0,
          originalReplies: tweet.originalReplies || 0,
          terryCommentary: tweet.terryCommentary,
          isProcessed: true,
          tags: tweet.tagIds ? {
            createMany: {
              data: tweet.tagIds.map(tagId => ({ tagId })),
            },
          } : undefined,
        },
      })
    )
  );
}

/**
 * Get unprocessed feed items for briefing generation
 */
export async function getUnprocessedFeedItems(
  since: Date,
  until: Date,
  limit = 100
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
        in: ['ITK', 'BREAKING'],
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
      { priority: 'desc' },
      { relevanceScore: 'desc' },
      { publishedAt: 'desc' },
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
  }
) {
  const { 
    since, 
    until, 
    limit = 50, 
    includeArchived = false 
  } = options || {};
  
  return await prisma.feedItem.findMany({
    where: {
      sourceId,
      ...(since || until ? {
        publishedAt: {
          ...(since && { gte: since }),
          ...(until && { lte: until }),
        },
      } : {}),
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
    orderBy: { publishedAt: 'desc' },
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
  }
) {
  const { 
    since, 
    until, 
    limit = 50, 
    requireAllTags = false 
  } = options || {};
  
  const whereClause: Prisma.FeedItemWhereInput = {
    ...(since || until ? {
      publishedAt: {
        ...(since && { gte: since }),
        ...(until && { lte: until }),
      },
    } : {}),
    isArchived: false,
  };
  
  if (requireAllTags) {
    // Must have ALL specified tags
    whereClause.AND = tagNames.map(tagName => ({
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
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });
}

/**
 * Mark feed items as used in briefing
 */
export async function markFeedItemsAsUsed(
  feedItemIds: string[],
  briefingId: string
) {
  // Create briefing-feed item relationships
  await prisma.briefingFeedItem.createMany({
    data: feedItemIds.map((feedItemId, index) => ({
      briefingId,
      feedItemId,
      position: index,
      section: 'main',
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
  limit = 10
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
  
  return result.map(row => ({
    name: row.name,
    type: row.type,
    count: Number(row.count),
  }));
}

/**
 * Get feed item statistics for a time period
 */
export async function getFeedItemStats(since: Date, until: Date) {
  const [
    totalItems,
    bySource,
    byType,
    byPriority,
    avgRelevance,
  ] = await Promise.all([
    // Total count
    prisma.feedItem.count({
      where: {
        publishedAt: { gte: since, lte: until },
      },
    }),
    
    // By source
    prisma.feedItem.groupBy({
      by: ['sourceId'],
      where: {
        publishedAt: { gte: since, lte: until },
      },
      _count: true,
    }),
    
    // By transfer type
    prisma.feedItem.groupBy({
      by: ['transferType'],
      where: {
        publishedAt: { gte: since, lte: until },
        transferType: { not: null },
      },
      _count: true,
    }),
    
    // By priority
    prisma.feedItem.groupBy({
      by: ['priority'],
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
  const sourceIds = bySource.map(s => s.sourceId);
  const sources = await prisma.iTKSource.findMany({
    where: { id: { in: sourceIds } },
    select: { id: true, name: true },
  });
  const sourceMap = Object.fromEntries(
    sources.map(s => [s.id, s.name])
  );
  
  return {
    totalItems,
    bySource: bySource.map(s => ({
      sourceId: s.sourceId,
      sourceName: sourceMap[s.sourceId] || 'Unknown',
      count: s._count,
    })),
    byType: byType.map(t => ({
      type: t.transferType,
      count: t._count,
    })),
    byPriority: byPriority.map(p => ({
      priority: p.priority,
      count: p._count,
    })),
    avgRelevance: avgRelevance._avg.relevanceScore || 0,
  };
}