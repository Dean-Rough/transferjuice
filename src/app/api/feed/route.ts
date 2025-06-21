/**
 * API Route: Live Transfer Feed
 * Serves real-time transfer feed data from database
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FeedType, Priority, League } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Parse query parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type') as FeedType | null;
    const priority = searchParams.get('priority') as Priority | null;
    const league = searchParams.get('league') as League | null;
    const sourceId = searchParams.get('sourceId');
    const tags = searchParams.getAll('tag'); // Multiple tags support

    // Build where clause
    const where: any = {
      isPublished: true,
      isArchived: false,
    };

    if (type) {
      where.type = type;
    }

    if (priority) {
      where.priority = priority;
    }

    if (league) {
      where.league = league;
    }

    if (sourceId) {
      where.sourceId = sourceId;
    }

    // Tag filtering
    if (tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: {
              in: tags,
            },
          },
        },
      };
    }

    // Fetch feed items with relations
    const feedItems = await prisma.feedItem.findMany({
      where,
      include: {
        source: {
          select: {
            id: true,
            name: true,
            username: true,
            tier: true,
            reliability: true,
            region: true,
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

    // Transform data to match frontend interface
    const transformedItems = feedItems.map((item) => ({
      id: item.id,
      type: item.type.toLowerCase(),
      timestamp: item.publishedAt,
      content: item.content,
      terryCommentary: item.terryCommentary,
      source: {
        name: item.source.name,
        handle: `@${item.source.username}`,
        tier: item.source.tier,
        reliability: item.source.reliability,
        region: item.source.region,
        isVerified: item.source.isVerified,
      },
      tags: {
        clubs: item.tags
          .filter((t) => t.tag.type === 'CLUB')
          .map((t) => t.tag.name),
        players: item.tags
          .filter((t) => t.tag.type === 'PLAYER')
          .map((t) => t.tag.name),
        sources: [item.source.name],
      },
      media:
        item.media.length > 0
          ? {
              type: item.media[0].type.toLowerCase(),
              url: item.media[0].url,
              altText: item.media[0].altText,
              thumbnailUrl: item.media[0].thumbnailUrl,
            }
          : undefined,
      engagement: {
        shares: item.originalShares + item.ourShares,
        reactions: item.originalLikes + item.ourReactions,
        clicks: item.ourClicks,
      },
      metadata: {
        transferType: item.transferType?.toLowerCase(),
        priority: item.priority.toLowerCase(),
        relevanceScore: item.relevanceScore,
        league: item.league,
        originalUrl: item.originalUrl,
      },
      isRead: false, // Default for API responses
      isNew: false, // Default for API responses
    }));

    // Get total count for pagination
    const totalCount = await prisma.feedItem.count({
      where,
    });

    return NextResponse.json({
      success: true,
      data: transformedItems,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      meta: {
        fetchedAt: new Date().toISOString(),
        count: transformedItems.length,
      },
    });
  } catch (error) {
    console.error('Failed to fetch feed data:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch feed data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST endpoint for manually adding feed items (admin use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { content, sourceId, type = 'ITK', priority = 'MEDIUM' } = body;

    if (!content || !sourceId) {
      return NextResponse.json(
        { error: 'Content and sourceId are required' },
        { status: 400 }
      );
    }

    // Create feed item
    const feedItem = await prisma.feedItem.create({
      data: {
        type: type as FeedType,
        content,
        sourceId,
        priority: priority as Priority,
        publishedAt: new Date(),
        isProcessed: true,
        isPublished: true,
        relevanceScore: 0.8, // Default for manual entries
      },
      include: {
        source: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: feedItem,
      message: 'Feed item created successfully',
    });
  } catch (error) {
    console.error('Failed to create feed item:', error);

    return NextResponse.json(
      {
        error: 'Failed to create feed item',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
