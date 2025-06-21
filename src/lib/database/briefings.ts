/**
 * Briefing Data Access Layer
 * Database operations for magazine-style briefings
 */

import { prisma } from '@/lib/prisma';
import type { 
  Briefing, 
  FeedItem, 
  Tag,
  Prisma 
} from '@prisma/client';
import { 
  BriefingStatus,
  type BriefingContent,
  type BriefingFilter,
  type BriefingWithRelations 
} from '@/types/briefing';
import { generateSlug } from '@/lib/utils/slug';

/**
 * Create a new briefing
 */
export async function createBriefing(data: {
  timestamp: Date;
  title: BriefingContent['title'];
  content: BriefingContent['sections'];
  visualTimeline: BriefingContent['visualTimeline'];
  sidebarSections: BriefingContent['sidebar'];
  readTime: number;
  wordCount: number;
  terryScore: number;
  feedItemIds: string[];
  tagIds: string[];
}) {
  const slug = generateSlug(data.title.main, data.timestamp);
  
  return await prisma.briefing.create({
    data: {
      slug,
      timestamp: data.timestamp,
      title: data.title,
      content: data.content,
      visualTimeline: data.visualTimeline,
      sidebarSections: data.sidebarSections,
      readTime: data.readTime,
      wordCount: data.wordCount,
      terryScore: data.terryScore,
      feedItems: {
        createMany: {
          data: data.feedItemIds.map((feedItemId, index) => ({
            feedItemId,
            position: index,
            section: 'main', // TODO: Map to actual sections
          })),
        },
      },
      tags: {
        createMany: {
          data: data.tagIds.map(tagId => ({
            tagId,
            relevance: 1.0, // TODO: Calculate relevance
          })),
        },
      },
    },
    include: {
      feedItems: {
        include: {
          feedItem: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      media: true,
    },
  });
}

/**
 * Get briefing by timestamp
 */
export async function getBriefingByTimestamp(
  timestamp: Date
): Promise<BriefingWithRelations | null> {
  return await prisma.briefing.findUnique({
    where: { timestamp },
    include: {
      feedItems: {
        include: {
          feedItem: {
            include: {
              source: true,
              tags: {
                include: {
                  tag: true,
                },
              },
              media: true,
            },
          },
        },
        orderBy: { position: 'asc' },
      },
      tags: {
        include: {
          tag: true,
        },
        orderBy: { relevance: 'desc' },
      },
      media: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

/**
 * Get briefing by slug
 */
export async function getBriefingBySlug(
  slug: string
): Promise<BriefingWithRelations | null> {
  return await prisma.briefing.findUnique({
    where: { slug },
    include: {
      feedItems: {
        include: {
          feedItem: {
            include: {
              source: true,
              tags: {
                include: {
                  tag: true,
                },
              },
              media: true,
            },
          },
        },
        orderBy: { position: 'asc' },
      },
      tags: {
        include: {
          tag: true,
        },
        orderBy: { relevance: 'desc' },
      },
      media: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

/**
 * List briefings with pagination and filtering
 */
export async function listBriefings({
  page = 1,
  limit = 24,
  status,
  tags,
  leagues,
  startDate,
  endDate,
}: BriefingFilter) {
  const where: Prisma.BriefingWhereInput = {
    AND: [
      // Status filter
      status === BriefingStatus.Published
        ? { isPublished: true }
        : status === BriefingStatus.Draft
        ? { isPublished: false }
        : {},
      
      // Date range filter
      startDate || endDate
        ? {
            timestamp: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {},
      
      // Tag filter
      tags && tags.length > 0
        ? {
            tags: {
              some: {
                tag: {
                  name: {
                    in: tags,
                  },
                },
              },
            },
          }
        : {},
      
      // League filter (through feed items)
      leagues && leagues.length > 0
        ? {
            feedItems: {
              some: {
                feedItem: {
                  league: {
                    in: leagues,
                  },
                },
              },
            },
          }
        : {},
    ],
  };
  
  const [briefings, total] = await Promise.all([
    prisma.briefing.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        tags: {
          include: {
            tag: true,
          },
          take: 5,
          orderBy: { relevance: 'desc' },
        },
        _count: {
          select: {
            feedItems: true,
            media: true,
          },
        },
      },
    }),
    prisma.briefing.count({ where }),
  ]);
  
  return {
    briefings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get related briefings
 */
export async function getRelatedBriefings(
  briefingId: string,
  limit = 4
): Promise<Briefing[]> {
  // Get the current briefing's tags
  const currentBriefing = await prisma.briefing.findUnique({
    where: { id: briefingId },
    include: {
      tags: {
        select: {
          tagId: true,
        },
      },
    },
  });
  
  if (!currentBriefing) {
    return [];
  }
  
  const tagIds = currentBriefing.tags.map(t => t.tagId);
  
  // Find briefings with similar tags
  return await prisma.briefing.findMany({
    where: {
      id: { not: briefingId },
      isPublished: true,
      tags: {
        some: {
          tagId: {
            in: tagIds,
          },
        },
      },
    },
    orderBy: [
      { timestamp: 'desc' },
    ],
    take: limit,
  });
}

/**
 * Update briefing
 */
export async function updateBriefing(
  id: string,
  data: Partial<{
    title: BriefingContent['title'];
    content: BriefingContent['sections'];
    visualTimeline: BriefingContent['visualTimeline'];
    sidebarSections: BriefingContent['sidebar'];
    readTime: number;
    wordCount: number;
    terryScore: number;
    isPublished: boolean;
    publishedAt: Date;
  }>
) {
  return await prisma.briefing.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.content && { content: data.content }),
      ...(data.visualTimeline && { visualTimeline: data.visualTimeline }),
      ...(data.sidebarSections && { sidebarSections: data.sidebarSections }),
      ...(data.readTime !== undefined && { readTime: data.readTime }),
      ...(data.wordCount !== undefined && { wordCount: data.wordCount }),
      ...(data.terryScore !== undefined && { terryScore: data.terryScore }),
      ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
      ...(data.publishedAt && { publishedAt: data.publishedAt }),
      ...(data.isPublished && !data.publishedAt && { publishedAt: new Date() }),
      version: { increment: 1 },
    },
  });
}

/**
 * Publish briefing
 */
export async function publishBriefing(id: string) {
  return await updateBriefing(id, {
    isPublished: true,
    publishedAt: new Date(),
  });
}

/**
 * Delete briefing
 */
export async function deleteBriefing(id: string) {
  return await prisma.briefing.delete({
    where: { id },
  });
}

/**
 * Get briefing statistics
 */
export async function getBriefingStats(briefingId: string) {
  const briefing = await prisma.briefing.findUnique({
    where: { id: briefingId },
    include: {
      _count: {
        select: {
          feedItems: true,
          tags: true,
          media: true,
          emails: true,
        },
      },
      emails: {
        select: {
          openedAt: true,
          clickedAt: true,
          clickCount: true,
        },
      },
    },
  });
  
  if (!briefing) {
    return null;
  }
  
  const emailStats = briefing.emails.reduce(
    (acc, email) => ({
      sent: acc.sent + 1,
      opened: acc.opened + (email.openedAt ? 1 : 0),
      clicked: acc.clicked + (email.clickedAt ? 1 : 0),
      totalClicks: acc.totalClicks + email.clickCount,
    }),
    { sent: 0, opened: 0, clicked: 0, totalClicks: 0 }
  );
  
  return {
    ...briefing,
    emailStats: {
      ...emailStats,
      openRate: emailStats.sent > 0 ? emailStats.opened / emailStats.sent : 0,
      clickRate: emailStats.sent > 0 ? emailStats.clicked / emailStats.sent : 0,
      avgClicksPerEmail: emailStats.clicked > 0 ? emailStats.totalClicks / emailStats.clicked : 0,
    },
  };
}

/**
 * Check if briefing exists for timestamp
 */
export async function briefingExistsForTimestamp(timestamp: Date): Promise<boolean> {
  const briefing = await prisma.briefing.findUnique({
    where: { timestamp },
    select: { id: true },
  });
  
  return !!briefing;
}

/**
 * Increment briefing view count
 */
export async function incrementBriefingViews(id: string) {
  return await prisma.briefing.update({
    where: { id },
    data: {
      viewCount: { increment: 1 },
    },
  });
}

/**
 * Increment briefing share count
 */
export async function incrementBriefingShares(id: string) {
  return await prisma.briefing.update({
    where: { id },
    data: {
      shareCount: { increment: 1 },
    },
  });
}

/**
 * Update briefing read depth
 */
export async function updateBriefingReadDepth(id: string, depth: number) {
  const briefing = await prisma.briefing.findUnique({
    where: { id },
    select: { avgReadDepth: true, viewCount: true },
  });
  
  if (!briefing) return;
  
  // Calculate new average read depth
  const totalDepth = briefing.avgReadDepth * Math.max(briefing.viewCount - 1, 1);
  const newAvgDepth = (totalDepth + depth) / briefing.viewCount;
  
  return await prisma.briefing.update({
    where: { id },
    data: {
      avgReadDepth: Math.min(newAvgDepth, 1.0), // Cap at 100%
    },
  });
}