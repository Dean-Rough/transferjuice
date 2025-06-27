/**
 * Breaking News API
 * Returns Terry's daily shitpost headlines
 */

import { NextResponse } from "next/server";
import {
  getCurrentBreakingNews,
  needsNewBreakingNews,
} from "@/lib/breakingNews/dailyTicker";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check if we have today's breaking news cached
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cachedNews = await prisma.systemConfig.findUnique({
      where: { key: "daily_breaking_news" },
    });

    // Check if we need new stories
    if (!cachedNews || needsNewBreakingNews(cachedNews.updatedAt)) {
      // Generate new stories
      const stories = await getCurrentBreakingNews();

      // Cache them
      await prisma.systemConfig.upsert({
        where: { key: "daily_breaking_news" },
        update: {
          value: JSON.stringify(stories),
          updatedAt: new Date(),
        },
        create: {
          key: "daily_breaking_news",
          value: JSON.stringify(stories),
          description: "Terry's daily breaking news shitposts",
        },
      });

      return NextResponse.json({
        success: true,
        data: stories,
        generated: new Date(),
        cached: false,
      });
    }

    // Return cached stories
    return NextResponse.json({
      success: true,
      data: JSON.parse(cachedNews.value),
      generated: cachedNews.updatedAt,
      cached: true,
    });
  } catch (error) {
    console.error("Breaking news generation failed:", error);

    // Return fallback stories on error
    const fallbackStories = [
      {
        id: "fallback-1",
        headline:
          "ARSENAL PREPARING £200M BID FOR PLAYER WHO DOESN'T EXIST YET",
        timestamp: new Date(),
        emoji: "",
      },
      {
        id: "fallback-2",
        headline:
          "CHELSEA SIGN 8TH MIDFIELDER THIS WINDOW, STILL CAN'T FIND ONE WHO CAN PASS",
        timestamp: new Date(),
        emoji: "",
      },
      {
        id: "fallback-3",
        headline: "MAN UNITED 'MONITORING' SITUATION OF LITERALLY EVERYONE",
        timestamp: new Date(),
        emoji: "",
      },
      {
        id: "fallback-4",
        headline:
          "EXCLUSIVE: PLAYER'S BARBER'S COUSIN SPOTTED NEAR TRAINING GROUND",
        timestamp: new Date(),
        emoji: "",
      },
      {
        id: "fallback-5",
        headline: "BREAKING: FOOTBALL CONTINUES TO EXIST DESPITE BEST EFFORTS",
        timestamp: new Date(),
        emoji: "",
      },
      {
        id: "fallback-6",
        headline: "SHOCK: TRANSFER ACTUALLY MAKES SENSE - SOURCES CONFUSED",
        timestamp: new Date(),
        emoji: "",
      },
    ];

    return NextResponse.json({
      success: true,
      data: fallbackStories,
      generated: new Date(),
      cached: false,
      fallback: true,
    });
  }
}
