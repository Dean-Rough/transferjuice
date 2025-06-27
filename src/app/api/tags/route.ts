/**
 * API Route: Tags Management
 * Handles tag operations and popular tag retrieval
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { TagType, League } from "@prisma/client";

// Validation schemas
const CreateTagSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.nativeEnum(TagType),
  league: z.nativeEnum(League).optional(),
  country: z.string().optional(),
  position: z.string().optional(), // For players
  transferValue: z.number().optional(), // In cents
});

const UpdateTagSchema = CreateTagSchema.partial();

// GET - Retrieve tags with filtering and popularity
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Parse query parameters
    const type = searchParams.get("type") as TagType | null;
    const league = searchParams.get("league") as League | null;
    const popular = searchParams.get("popular") === "true";
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (league) {
      where.league = league;
    }

    if (popular) {
      where.isPopular = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { normalizedName: { contains: search.toLowerCase() } },
      ];
    }

    // Fetch tags with usage counts
    const tags = await prisma.tag.findMany({
      where,
      include: {
        _count: {
          select: {
            feedItems: true,
          },
        },
      },
      orderBy: popular
        ? [{ usageCount: "desc" }, { lastUsedAt: "desc" }]
        : [{ name: "asc" }],
      take: limit,
      skip: offset,
    });

    // Get popular tags by type if no specific filter
    const popularByType: Record<string, any> = {};
    if (!type && !search) {
      const tagTypes: TagType[] = ["CLUB", "PLAYER", "SOURCE"];

      for (const tagType of tagTypes) {
        const popularTags = await prisma.tag.findMany({
          where: {
            type: tagType,
            isPopular: true,
          },
          orderBy: {
            usageCount: "desc",
          },
          take: 10,
          select: {
            id: true,
            name: true,
            type: true,
            usageCount: true,
          },
        });

        popularByType[tagType.toLowerCase()] = popularTags;
      }
    }

    // Transform data
    const transformedTags = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      type: tag.type,
      normalizedName: tag.normalizedName,
      isPopular: tag.isPopular,
      usageCount: tag.usageCount,
      lastUsedAt: tag.lastUsedAt,
      league: tag.league,
      country: tag.country,
      position: tag.position,
      transferValue: tag.transferValue ? Number(tag.transferValue) : null,
      feedItemCount: tag._count.feedItems,
    }));

    // Get total count for pagination
    const totalCount = await prisma.tag.count({ where });

    return NextResponse.json({
      success: true,
      data: transformedTags,
      popularByType,
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
    console.error("Failed to fetch tags:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tags",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = CreateTagSchema.parse(body);

    // Normalize name for matching
    const normalizedName = validatedData.name.toLowerCase().replace(/\s+/g, "");

    // Check if tag already exists
    const existing = await prisma.tag.findFirst({
      where: {
        normalizedName,
        type: validatedData.type,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Tag already exists",
          data: existing,
        },
        { status: 409 },
      );
    }

    // Create the tag
    const tag = await prisma.tag.create({
      data: {
        ...validatedData,
        normalizedName,
        transferValue: validatedData.transferValue
          ? BigInt(validatedData.transferValue)
          : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...tag,
          transferValue: tag.transferValue ? Number(tag.transferValue) : null,
        },
        message: "Tag created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input data",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    console.error("Failed to create tag:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create tag",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// PUT - Update tag metadata or increment usage
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, incrementUsage, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Tag ID is required",
        },
        { status: 400 },
      );
    }

    let updatedTag;

    if (incrementUsage) {
      // Increment usage count and update last used
      updatedTag = await prisma.tag.update({
        where: { id },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
          // Mark as popular if usage exceeds threshold
          isPopular: {
            set: await prisma.tag
              .findUnique({
                where: { id },
                select: { usageCount: true },
              })
              .then((tag) => (tag?.usageCount || 0) >= 50),
          },
        },
      });
    } else {
      // Validate and apply other updates
      const validatedData = UpdateTagSchema.parse(updateData);

      updatedTag = await prisma.tag.update({
        where: { id },
        data: {
          ...validatedData,
          ...(validatedData.name && {
            normalizedName: validatedData.name
              .toLowerCase()
              .replace(/\s+/g, ""),
          }),
          ...(validatedData.transferValue !== undefined && {
            transferValue: validatedData.transferValue
              ? BigInt(validatedData.transferValue)
              : null,
          }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedTag,
        transferValue: updatedTag.transferValue
          ? Number(updatedTag.transferValue)
          : null,
      },
      message: "Tag updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid update data",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    console.error("Failed to update tag:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update tag",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// DELETE - Remove a tag
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Tag ID is required",
        },
        { status: 400 },
      );
    }

    // Check if tag is in use
    const usageCount = await prisma.feedItemTag.count({
      where: { tagId: id },
    });

    if (usageCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete tag that is in use",
          details: `Tag is used by ${usageCount} feed items`,
        },
        { status: 409 },
      );
    }

    // Delete the tag
    await prisma.tag.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Tag deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete tag:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete tag",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
