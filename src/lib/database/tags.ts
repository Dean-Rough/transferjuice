/**
 * Tag Data Access Layer
 * Database operations for tag management
 */

import { prisma } from "@/lib/prisma";
import type { Tag, TagType, League } from "@prisma/client";

/**
 * Find or create tag
 */
export async function findOrCreateTag(data: {
  name: string;
  type: TagType;
  league?: League;
  country?: string;
  position?: string;
  transferValue?: bigint;
}): Promise<Tag> {
  const normalizedName = data.name.toLowerCase().replace(/\s+/g, "-");

  // Try to find existing tag
  const existing = await prisma.tag.findFirst({
    where: {
      normalizedName,
      type: data.type,
    },
  });

  if (existing) {
    // Update usage count
    await prisma.tag.update({
      where: { id: existing.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
    return existing;
  }

  // Create new tag with race condition handling
  try {
    return await prisma.tag.create({
      data: {
        name: data.name,
        type: data.type,
        normalizedName,
        league: data.league,
        country: data.country,
        position: data.position,
        transferValue: data.transferValue,
        usageCount: 1,
        lastUsedAt: new Date(),
      },
    });
  } catch (error: any) {
    // Handle race condition - if tag was created by another process
    if (error.code === 'P2002') {
      const existing = await prisma.tag.findUnique({
        where: { name: data.name },
      });
      if (existing) {
        await prisma.tag.update({
          where: { id: existing.id },
          data: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date(),
          },
        });
        return existing;
      }
    }
    throw error;
  }
}

/**
 * Find or create multiple tags
 */
export async function findOrCreateTags(
  tags: Array<{
    name: string;
    type: TagType;
    league?: League;
    country?: string;
    position?: string;
  }>,
): Promise<Tag[]> {
  return await Promise.all(tags.map((tag) => findOrCreateTag(tag)));
}

/**
 * Get popular tags
 */
export async function getPopularTags(options?: {
  type?: TagType;
  league?: League;
  limit?: number;
  since?: Date;
}): Promise<Tag[]> {
  const { type, league, limit = 20, since } = options || {};

  return await prisma.tag.findMany({
    where: {
      ...(type && { type }),
      ...(league && { league }),
      ...(since && { lastUsedAt: { gte: since } }),
      isPopular: true,
    },
    orderBy: { usageCount: "desc" },
    take: limit,
  });
}

/**
 * Get trending tags
 */
export async function getTrendingTags(
  since: Date,
  limit = 10,
): Promise<(Tag & { recentUsage: number })[]> {
  // Get recent tag usage
  const recentUsage = await prisma.feedItemTag.groupBy({
    by: ["tagId"],
    where: {
      createdAt: { gte: since },
    },
    _count: true,
    orderBy: {
      _count: {
        tagId: "desc",
      },
    },
    take: limit,
  });

  // Get tag details
  const tagIds = recentUsage.map((u) => u.tagId);
  const tags = await prisma.tag.findMany({
    where: { id: { in: tagIds } },
  });

  // Combine with usage counts
  const tagMap = Object.fromEntries(tags.map((t) => [t.id, t]));

  return recentUsage
    .map((usage) => ({
      ...tagMap[usage.tagId],
      recentUsage: usage._count,
    }))
    .filter((t) => t.id); // Filter out any missing tags
}

/**
 * Search tags by name
 */
export async function searchTags(
  query: string,
  options?: {
    type?: TagType;
    limit?: number;
  },
): Promise<Tag[]> {
  const { type, limit = 10 } = options || {};
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, "-");

  return await prisma.tag.findMany({
    where: {
      normalizedName: {
        contains: normalizedQuery,
      },
      ...(type && { type }),
    },
    orderBy: { usageCount: "desc" },
    take: limit,
  });
}

/**
 * Update tag popularity
 */
export async function updateTagPopularity(threshold = 100): Promise<number> {
  // Mark tags as popular if they exceed usage threshold
  const result = await prisma.tag.updateMany({
    where: {
      usageCount: { gte: threshold },
      isPopular: false,
    },
    data: {
      isPopular: true,
    },
  });

  // Unmark tags that fell below threshold
  await prisma.tag.updateMany({
    where: {
      usageCount: { lt: threshold },
      isPopular: true,
    },
    data: {
      isPopular: false,
    },
  });

  return result.count;
}

/**
 * Get related tags
 */
export async function getRelatedTags(tagId: string, limit = 5): Promise<Tag[]> {
  // Find feed items that have this tag
  const feedItemsWithTag = await prisma.feedItemTag.findMany({
    where: { tagId },
    select: { feedItemId: true },
    take: 100, // Sample recent items
  });

  const feedItemIds = feedItemsWithTag.map((fit) => fit.feedItemId);

  // Find other tags on these feed items
  const relatedTagUsage = await prisma.feedItemTag.groupBy({
    by: ["tagId"],
    where: {
      feedItemId: { in: feedItemIds },
      tagId: { not: tagId }, // Exclude the original tag
    },
    _count: true,
    orderBy: {
      _count: {
        tagId: "desc",
      },
    },
    take: limit,
  });

  // Get tag details
  const relatedTagIds = relatedTagUsage.map((u) => u.tagId);
  return await prisma.tag.findMany({
    where: { id: { in: relatedTagIds } },
  });
}

/**
 * Merge duplicate tags
 */
export async function mergeTags(
  sourceTagId: string,
  targetTagId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Get both tags
    const [sourceTag, targetTag] = await Promise.all([
      tx.tag.findUnique({ where: { id: sourceTagId } }),
      tx.tag.findUnique({ where: { id: targetTagId } }),
    ]);

    if (!sourceTag || !targetTag) {
      throw new Error("One or both tags not found");
    }

    // Update all feed item tags
    await tx.feedItemTag.updateMany({
      where: { tagId: sourceTagId },
      data: { tagId: targetTagId },
    });

    // Update all briefing tags
    await tx.briefingTag.updateMany({
      where: { tagId: sourceTagId },
      data: { tagId: targetTagId },
    });

    // Update target tag usage count
    await tx.tag.update({
      where: { id: targetTagId },
      data: {
        usageCount: { increment: sourceTag.usageCount },
      },
    });

    // Delete source tag
    await tx.tag.delete({
      where: { id: sourceTagId },
    });
  });
}

/**
 * Clean up unused tags
 */
export async function cleanupUnusedTags(): Promise<number> {
  // Find tags with no associated feed items or briefings
  const unusedTags = await prisma.tag.findMany({
    where: {
      AND: [
        { feedItems: { none: {} } },
        { briefings: { none: {} } },
        { usageCount: 0 },
      ],
    },
    select: { id: true },
  });

  if (unusedTags.length === 0) return 0;

  // Delete unused tags
  const result = await prisma.tag.deleteMany({
    where: {
      id: { in: unusedTags.map((t) => t.id) },
    },
  });

  return result.count;
}
