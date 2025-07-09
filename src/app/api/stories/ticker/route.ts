import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get the latest stories from the past 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentStories = await prisma.story.findMany({
      where: {
        createdAt: { gte: yesterday },
        headline: { not: null },
      },
      select: {
        id: true,
        headline: true,
        metadata: true,
        updateCount: true,
        createdAt: true,
      },
      orderBy: [{ updateCount: "desc" }, { createdAt: "desc" }],
      take: 10,
    });

    // Format for ticker
    const tickerItems = recentStories.map((story) => {
      const meta = story.metadata as any;

      return {
        id: story.id,
        headline: story.headline,
        isHereWeGo: meta?.isHereWeGo || false,
        fee: meta?.transferInfo?.fee || meta?.fee || null,
        updateCount: story.updateCount,
      };
    });

    // If no stories, provide some comedy fallbacks
    if (tickerItems.length === 0) {
      const fallbackItems = [
        {
          id: "fb1",
          headline: "Transfer Window: Still Somehow A Thing That Exists",
          isHereWeGo: false,
        },
        {
          id: "fb2",
          headline:
            "Sky Sports Reporter Standing Outside Stadium for No Reason",
          isHereWeGo: false,
        },
        {
          id: "fb3",
          headline: "Agent Spotted Having Lunch - Football World in Meltdown",
          isHereWeGo: false,
        },
      ];

      return NextResponse.json({ items: fallbackItems });
    }

    return NextResponse.json({ items: tickerItems });
  } catch (error) {
    console.error("Failed to fetch ticker items:", error);
    return NextResponse.json({ items: [] });
  } finally {
    await prisma.$disconnect();
  }
}
