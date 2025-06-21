/**
 * API Route: ITK Sources Management
 * Handles CRUD operations for In The Know transfer sources
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const CreateITKSourceSchema = z.object({
  name: z.string().min(1).max(100),
  username: z.string().min(1).max(50), // Twitter handle without @
  tier: z.number().min(1).max(3).default(3),
  reliability: z.number().min(0).max(1).default(0.5),
  region: z.string().default('GLOBAL'),
  isActive: z.boolean().default(true),
  isVerified: z.boolean().default(false),
  description: z.string().optional(),
  fetchInterval: z.number().min(300).default(900), // Min 5 minutes
});

const UpdateITKSourceSchema = CreateITKSourceSchema.partial();

// GET - Retrieve all ITK sources or filtered list
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Parse query parameters
    const isActive = searchParams.get('active') === 'true';
    const tier = searchParams.get('tier');
    const region = searchParams.get('region');
    const includeStats = searchParams.get('includeStats') === 'true';

    // Build where clause
    const where: any = {};

    if (searchParams.has('active')) {
      where.isActive = isActive;
    }

    if (tier) {
      where.tier = parseInt(tier);
    }

    if (region) {
      where.region = region;
    }

    // Fetch sources
    const sources = await prisma.iTKSource.findMany({
      where,
      orderBy: [{ tier: 'asc' }, { reliability: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        username: true,
        twitterId: true,
        tier: true,
        reliability: true,
        region: true,
        isActive: true,
        isVerified: true,
        followerCount: true,
        description: true,
        profileImageUrl: true,
        lastFetchedAt: true,
        fetchInterval: true,
        createdAt: true,
        updatedAt: true,
        // Include stats if requested
        ...(includeStats && {
          totalTweets: true,
          relevantTweets: true,
          avgRelevance: true,
          _count: {
            select: {
              feedItems: true,
            },
          },
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: sources,
      meta: {
        count: sources.length,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to fetch ITK sources:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch ITK sources',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Create a new ITK source
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = CreateITKSourceSchema.parse(body);

    // Check if username already exists
    const existing = await prisma.iTKSource.findUnique({
      where: { username: validatedData.username },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'ITK source with this username already exists',
        },
        { status: 409 }
      );
    }

    // Create the source
    const source = await prisma.iTKSource.create({
      data: {
        ...validatedData,
        username: validatedData.username.replace('@', ''), // Remove @ if present
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: source,
        message: 'ITK source created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Failed to create ITK source:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create ITK source',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT - Update an ITK source
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Source ID is required',
        },
        { status: 400 }
      );
    }

    // Validate update data
    const validatedData = UpdateITKSourceSchema.parse(updateData);

    // Update the source
    const updatedSource = await prisma.iTKSource.update({
      where: { id },
      data: {
        ...validatedData,
        ...(validatedData.username && {
          username: validatedData.username.replace('@', ''),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSource,
      message: 'ITK source updated successfully',
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

    console.error('Failed to update ITK source:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update ITK source',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove an ITK source
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Source ID is required',
        },
        { status: 400 }
      );
    }

    // Delete the source (cascade will delete related feed items)
    await prisma.iTKSource.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'ITK source deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete ITK source:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete ITK source',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
