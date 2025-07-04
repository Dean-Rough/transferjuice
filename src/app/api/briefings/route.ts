import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const briefings = await prisma.briefing.findMany({
      include: {
        stories: {
          include: {
            story: {
              include: {
                tweet: {
                  include: {
                    source: true,
                  },
                },
              },
            },
          },
          orderBy: { position: "asc" },
        },
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });

    await prisma.$disconnect();

    return NextResponse.json({
      briefings,
      total: briefings.length,
    });
  } catch (error) {
    console.error("Failed to fetch briefings:", error);
    return NextResponse.json(
      { error: "Failed to fetch briefings" },
      { status: 500 },
    );
  }
}
