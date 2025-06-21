/**
 * ITK Source Data Access Layer
 * Database operations for ITK source management
 */

import { prisma } from '@/lib/prisma';
import type { ITKSource, Prisma } from '@prisma/client';

/**
 * Create or update ITK source
 */
export async function upsertITKSource(data: {
  username: string;
  name: string;
  twitterId?: string;
  tier?: number;
  reliability?: number;
  region?: string;
  isVerified?: boolean;
  profileImageUrl?: string;
  description?: string;
  followerCount?: number;
  followingCount?: number;
  tweetCount?: number;
}): Promise<ITKSource> {
  return await prisma.iTKSource.upsert({
    where: { username: data.username },
    update: {
      name: data.name,
      ...(data.twitterId && { twitterId: data.twitterId }),
      ...(data.tier !== undefined && { tier: data.tier }),
      ...(data.reliability !== undefined && { reliability: data.reliability }),
      ...(data.region && { region: data.region }),
      ...(data.isVerified !== undefined && { isVerified: data.isVerified }),
      ...(data.profileImageUrl && { profileImageUrl: data.profileImageUrl }),
      ...(data.description && { description: data.description }),
      ...(data.followerCount !== undefined && { followerCount: data.followerCount }),
      ...(data.followingCount !== undefined && { followingCount: data.followingCount }),
      ...(data.tweetCount !== undefined && { tweetCount: data.tweetCount }),
    },
    create: {
      username: data.username,
      name: data.name,
      twitterId: data.twitterId,
      tier: data.tier || 3,
      reliability: data.reliability || 0.5,
      region: data.region || 'GLOBAL',
      isVerified: data.isVerified || false,
      profileImageUrl: data.profileImageUrl,
      description: data.description,
      followerCount: data.followerCount,
      followingCount: data.followingCount,
      tweetCount: data.tweetCount,
    },
  });
}

/**
 * Get active ITK sources
 */
export async function getActiveITKSources(
  options?: {
    tier?: number;
    region?: string;
    minReliability?: number;
  }
): Promise<ITKSource[]> {
  const { tier, region, minReliability = 0 } = options || {};
  
  return await prisma.iTKSource.findMany({
    where: {
      isActive: true,
      ...(tier && { tier }),
      ...(region && { region }),
      reliability: { gte: minReliability },
    },
    orderBy: [
      { tier: 'asc' },
      { reliability: 'desc' },
    ],
  });
}

/**
 * Get sources needing update
 */
export async function getSourcesNeedingUpdate(
  intervalSeconds = 900 // 15 minutes default
): Promise<ITKSource[]> {
  const cutoffTime = new Date(Date.now() - intervalSeconds * 1000);
  
  return await prisma.iTKSource.findMany({
    where: {
      isActive: true,
      OR: [
        { lastFetchedAt: null },
        { lastFetchedAt: { lt: cutoffTime } },
      ],
    },
    orderBy: [
      { lastFetchedAt: 'asc' }, // Null values come first
      { tier: 'asc' },
    ],
  });
}

/**
 * Update source fetch status
 */
export async function updateSourceFetchStatus(
  sourceId: string,
  data: {
    lastFetchedAt: Date;
    lastTweetId?: string;
    tweetsProcessed?: number;
    relevantTweets?: number;
  }
): Promise<void> {
  await prisma.iTKSource.update({
    where: { id: sourceId },
    data: {
      lastFetchedAt: data.lastFetchedAt,
      ...(data.lastTweetId && { lastTweetId: data.lastTweetId }),
      ...(data.tweetsProcessed !== undefined && {
        totalTweets: { increment: data.tweetsProcessed },
      }),
      ...(data.relevantTweets !== undefined && {
        relevantTweets: { increment: data.relevantTweets },
      }),
    },
  });
  
  // Update average relevance
  if (data.tweetsProcessed && data.relevantTweets !== undefined) {
    const source = await prisma.iTKSource.findUnique({
      where: { id: sourceId },
      select: { totalTweets: true, relevantTweets: true },
    });
    
    if (source && source.totalTweets > 0) {
      await prisma.iTKSource.update({
        where: { id: sourceId },
        data: {
          avgRelevance: source.relevantTweets / source.totalTweets,
        },
      });
    }
  }
}

/**
 * Get source performance stats
 */
export async function getSourcePerformanceStats(
  sourceId: string,
  since?: Date
): Promise<{
  totalTweets: number;
  relevantTweets: number;
  avgRelevance: number;
  recentActivity: {
    tweets: number;
    engagement: number;
  };
}> {
  const source = await prisma.iTKSource.findUnique({
    where: { id: sourceId },
    select: {
      totalTweets: true,
      relevantTweets: true,
      avgRelevance: true,
    },
  });
  
  if (!source) {
    throw new Error('Source not found');
  }
  
  // Get recent activity if date provided
  let recentActivity = { tweets: 0, engagement: 0 };
  
  if (since) {
    const recentItems = await prisma.feedItem.aggregate({
      where: {
        sourceId,
        publishedAt: { gte: since },
      },
      _count: true,
      _sum: {
        originalLikes: true,
        originalShares: true,
        originalReplies: true,
      },
    });
    
    recentActivity = {
      tweets: recentItems._count,
      engagement: 
        (recentItems._sum.originalLikes || 0) +
        (recentItems._sum.originalShares || 0) +
        (recentItems._sum.originalReplies || 0),
    };
  }
  
  return {
    totalTweets: source.totalTweets,
    relevantTweets: source.relevantTweets,
    avgRelevance: source.avgRelevance,
    recentActivity,
  };
}

/**
 * Update source tier based on performance
 */
export async function updateSourceTiers(): Promise<{
  promoted: number;
  demoted: number;
}> {
  const stats = { promoted: 0, demoted: 0 };
  
  // Get all active sources with recent performance
  const sources = await prisma.iTKSource.findMany({
    where: { isActive: true },
    include: {
      feedItems: {
        where: {
          publishedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
        select: {
          relevanceScore: true,
          priority: true,
        },
      },
    },
  });
  
  for (const source of sources) {
    if (source.feedItems.length < 10) continue; // Need minimum activity
    
    // Calculate recent performance
    const avgRelevance = 
      source.feedItems.reduce((sum, item) => sum + item.relevanceScore, 0) / 
      source.feedItems.length;
    
    const highPriorityRate = 
      source.feedItems.filter(item => item.priority === 'HIGH' || item.priority === 'BREAKING').length / 
      source.feedItems.length;
    
    // Promotion criteria
    if (source.tier > 1 && avgRelevance > 0.8 && highPriorityRate > 0.3) {
      await prisma.iTKSource.update({
        where: { id: source.id },
        data: { 
          tier: source.tier - 1,
          reliability: Math.min(source.reliability + 0.05, 0.95),
        },
      });
      stats.promoted++;
    }
    // Demotion criteria
    else if (source.tier < 3 && avgRelevance < 0.5 && highPriorityRate < 0.1) {
      await prisma.iTKSource.update({
        where: { id: source.id },
        data: { 
          tier: source.tier + 1,
          reliability: Math.max(source.reliability - 0.05, 0.3),
        },
      });
      stats.demoted++;
    }
  }
  
  return stats;
}

/**
 * Deactivate inactive sources
 */
export async function deactivateInactiveSources(
  inactiveDays = 7
): Promise<number> {
  const cutoffDate = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);
  
  const result = await prisma.iTKSource.updateMany({
    where: {
      isActive: true,
      OR: [
        { lastFetchedAt: { lt: cutoffDate } },
        { lastFetchedAt: null },
      ],
    },
    data: {
      isActive: false,
    },
  });
  
  return result.count;
}

/**
 * Get source by username
 */
export async function getSourceByUsername(
  username: string
): Promise<ITKSource | null> {
  return await prisma.iTKSource.findUnique({
    where: { username },
  });
}

/**
 * Get sources by region
 */
export async function getSourcesByRegion(
  region: string
): Promise<ITKSource[]> {
  return await prisma.iTKSource.findMany({
    where: {
      region,
      isActive: true,
    },
    orderBy: [
      { tier: 'asc' },
      { reliability: 'desc' },
    ],
  });
}