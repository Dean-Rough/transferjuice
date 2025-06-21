/**
 * API Route: Partner Stories/Content Integration
 * Manages partner content from The Upshot, FourFourTwo, Football Ramble, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { FeedType, Priority, League } from '@prisma/client';

// Partner sources configuration
const PARTNER_SOURCES = {
  'the-upshot': { name: 'The Upshot', tier: 2, reliability: 0.85 },
  fourfourtwo: { name: 'FourFourTwo', tier: 2, reliability: 0.82 },
  'football-ramble': {
    name: 'The Football Ramble',
    tier: 3,
    reliability: 0.75,
  },
  'espn-fc': { name: 'ESPN FC', tier: 2, reliability: 0.8 },
  'the-athletic': { name: 'The Athletic', tier: 1, reliability: 0.9 },
  'sky-sports': { name: 'Sky Sports', tier: 1, reliability: 0.88 },
  'bbc-sport': { name: 'BBC Sport', tier: 1, reliability: 0.92 },
};

// Validation schemas
const CreateStorySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  sourceKey: z.string().refine((key) => key in PARTNER_SOURCES, {
    message: 'Invalid partner source',
  }),
  originalUrl: z.string().url(),
  author: z.string().optional(),
  publishedAt: z.string().datetime().optional(),
  imageUrl: z.string().url().optional(),
  league: z.nativeEnum(League).optional(),
  tags: z.array(z.string()).optional(),
  priority: z.nativeEnum(Priority).default('MEDIUM'),
});

const UpdateStorySchema = CreateStorySchema.partial().extend({
  id: z.string(),
});

// GET - Retrieve partner stories
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Parse query parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const sourceKey = searchParams.get('source');
    const league = searchParams.get('league') as League | null;
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Build where clause
    const where: any = {
      type: FeedType.PARTNER,
      isPublished: true,
      isArchived: false,
    };

    // Filter by partner source
    if (
      sourceKey &&
      PARTNER_SOURCES[sourceKey as keyof typeof PARTNER_SOURCES]
    ) {
      const sourceName =
        PARTNER_SOURCES[sourceKey as keyof typeof PARTNER_SOURCES].name;
      where.source = {
        name: sourceName,
      };
    }

    if (league) {
      where.league = league;
    }

    // Date range filter
    if (fromDate || toDate) {
      where.publishedAt = {};
      if (fromDate) {
        where.publishedAt.gte = new Date(fromDate);
      }
      if (toDate) {
        where.publishedAt.lte = new Date(toDate);
      }
    }

    // Fetch stories
    const stories = await prisma.feedItem.findMany({
      where,
      include: {
        source: {
          select: {
            id: true,
            name: true,
            username: true,
            tier: true,
            reliability: true,
            isVerified: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        media: {
          select: {
            id: true,
            type: true,
            url: true,
            thumbnailUrl: true,
            altText: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }],
      take: limit,
      skip: offset,
    });

    // Transform to story format
    const transformedStories = stories.map((story) => ({
      id: story.id,
      title: story.content.split('\n')[0] || story.content, // First line as title
      content: story.content,
      excerpt: story.terryCommentary,
      source: {
        name: story.source.name,
        tier: story.source.tier,
        reliability: story.source.reliability,
        isVerified: story.source.isVerified,
      },
      originalUrl: story.originalUrl,
      publishedAt: story.publishedAt,
      imageUrl: story.media.find((m) => m.type === 'IMAGE')?.url,
      league: story.league,
      tags: story.tags.map((t) => t.tag.name),
      engagement: {
        shares: story.originalShares + story.ourShares,
        reactions: story.originalLikes + story.ourReactions,
        clicks: story.ourClicks,
      },
      metadata: {
        priority: story.priority.toLowerCase(),
        relevanceScore: story.relevanceScore,
      },
    }));

    // Get total count
    const totalCount = await prisma.feedItem.count({ where });

    // Get partner stats
    const partnerStats = await prisma.iTKSource.findMany({
      where: {
        name: {
          in: Object.values(PARTNER_SOURCES).map((p) => p.name),
        },
      },
      select: {
        name: true,
        _count: {
          select: {
            feedItems: {
              where: {
                type: FeedType.PARTNER,
                isPublished: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: transformedStories,
      partnerStats: partnerStats.map((p) => ({
        name: p.name,
        storyCount: p._count.feedItems,
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      meta: {
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to fetch partner stories:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch partner stories',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Add partner story
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = CreateStorySchema.parse(body);

    // Get or create partner source
    const partnerConfig =
      PARTNER_SOURCES[validatedData.sourceKey as keyof typeof PARTNER_SOURCES];
    let source = await prisma.iTKSource.findUnique({
      where: { name: partnerConfig.name },
    });

    if (!source) {
      // Create partner source if it doesn't exist
      source = await prisma.iTKSource.create({
        data: {
          name: partnerConfig.name,
          username: validatedData.sourceKey,
          tier: partnerConfig.tier,
          reliability: partnerConfig.reliability,
          region: 'GLOBAL',
          isActive: true,
          isVerified: true,
          description: `Official ${partnerConfig.name} partnership`,
        },
      });
    }

    // Create feed item as partner content
    const story = await prisma.feedItem.create({
      data: {
        type: FeedType.PARTNER,
        content: validatedData.content,
        terryCommentary: validatedData.excerpt,
        originalText: validatedData.title,
        sourceId: source.id,
        originalUrl: validatedData.originalUrl,
        transferType: null, // Partner content doesn't have transfer type
        priority: validatedData.priority,
        relevanceScore: partnerConfig.reliability,
        league: validatedData.league,
        publishedAt: validatedData.publishedAt
          ? new Date(validatedData.publishedAt)
          : new Date(),
        isProcessed: true,
        isPublished: true,
        // Create media if image provided
        ...(validatedData.imageUrl && {
          media: {
            create: {
              type: 'IMAGE',
              url: validatedData.imageUrl,
              altText: validatedData.title,
            },
          },
        }),
      },
      include: {
        source: true,
        media: true,
      },
    });

    // Add tags if provided
    if (validatedData.tags && validatedData.tags.length > 0) {
      for (const tagName of validatedData.tags) {
        // Find or create tag
        let tag = await prisma.tag.findFirst({
          where: {
            normalizedName: tagName.toLowerCase().replace(/\s+/g, ''),
          },
        });

        if (!tag) {
          tag = await prisma.tag.create({
            data: {
              name: tagName,
              type: 'GENERAL',
              normalizedName: tagName.toLowerCase().replace(/\s+/g, ''),
            },
          });
        }

        // Create tag relationship
        await prisma.feedItemTag.create({
          data: {
            feedItemId: story.id,
            tagId: tag.id,
          },
        });

        // Update tag usage
        await prisma.tag.update({
          where: { id: tag.id },
          data: {
            usageCount: { increment: 1 },
            lastUsedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: story,
        message: 'Partner story created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid story data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Failed to create partner story:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create partner story',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT - Update partner story
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = UpdateStorySchema.parse(body);
    const { id, ...updateData } = validatedData;

    // Update feed item
    const updatedStory = await prisma.feedItem.update({
      where: { id },
      data: {
        ...(updateData.content && { content: updateData.content }),
        ...(updateData.excerpt && { terryCommentary: updateData.excerpt }),
        ...(updateData.title && { originalText: updateData.title }),
        ...(updateData.originalUrl && { originalUrl: updateData.originalUrl }),
        ...(updateData.priority && { priority: updateData.priority }),
        ...(updateData.league && { league: updateData.league }),
        ...(updateData.publishedAt && {
          publishedAt: new Date(updateData.publishedAt),
        }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedStory,
      message: 'Partner story updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid update data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Failed to update partner story:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update partner story',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE - Archive partner story
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Story ID is required',
        },
        { status: 400 }
      );
    }

    // Archive the story (soft delete)
    await prisma.feedItem.update({
      where: { id },
      data: {
        isArchived: true,
        isPublished: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Partner story archived successfully',
    });
  } catch (error) {
    console.error('Failed to archive partner story:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to archive partner story',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
