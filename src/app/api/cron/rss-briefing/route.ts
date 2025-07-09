import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generateCohesiveBriefing } from "@/lib/cohesiveBriefingGenerator";
import OpenAI from "openai";

const prisma = new PrismaClient();

interface RSSItem {
  id: string;
  url: string;
  title: string;
  content_text: string;
  content_html: string;
  image?: string;
  date_published: string;
  authors: { name: string }[];
  attachments?: { url: string }[];
}

interface RSSFeed {
  version: string;
  title: string;
  items: RSSItem[];
}

// Helper function to get OpenAI instance
async function getOpenAI(): Promise<OpenAI | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.log("⚠️ No OpenAI API key found, using fallback mode");
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      `🚀 RSS Briefing cron job triggered at ${new Date().toISOString()}`,
    );

    // Fetch RSS feed
    const feedUrl =
      process.env.RSS_FEED_URL ||
      "https://rss.app/feeds/v1.1/_zMqruZvtL6XIMNVY.json";
    const response = await fetch(feedUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }

    const feed: RSSFeed = await response.json();

    // Filter to recent items (last 2 hours for hourly updates)
    const recentItems = feed.items.filter((item) => {
      const itemDate = new Date(item.date_published);
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      return itemDate > twoHoursAgo;
    });

    if (recentItems.length === 0) {
      console.log("No new items in RSS feed");
      return NextResponse.json({
        success: true,
        message: "No new items to process",
      });
    }

    // Initialize OpenAI (may be null if no API key)
    const openai = await getOpenAI();

    // Generate cohesive briefing
    console.log("📝 Generating cohesive briefing...");
    const cohesiveBriefing = await generateCohesiveBriefing(
      recentItems,
      openai,
    );

    // Create briefing record
    const briefing = await prisma.briefing.create({
      data: {
        title: cohesiveBriefing.title,
        publishedAt: new Date(),
      },
    });

    // Create a single consolidated story
    // First, create a source for the briefing
    const source = await prisma.source.upsert({
      where: { handle: "TransferJuice" },
      update: {},
      create: {
        name: "TransferJuice Editorial",
        handle: "TransferJuice",
      },
    });

    // Create a consolidated tweet record
    const tweet = await prisma.tweet.create({
      data: {
        tweetId: `briefing-${briefing.id}`,
        content: `Transfer Briefing: ${cohesiveBriefing.metadata.keyPlayers.join(", ")}`,
        url: `https://transferjuice.com/briefing/${briefing.id}`,
        sourceId: source.id,
        scrapedAt: new Date(),
      },
    });

    // Clean the content to avoid encoding issues
    const cleanContent = cohesiveBriefing.content
      .replace(/[\uD800-\uDFFF]/g, "") // Remove lone surrogates
      .replace(/[\x00-\x1F\x7F-\x9F]/g, ""); // Remove control characters

    // Create the story with the cohesive content
    const story = await prisma.story.create({
      data: {
        tweetId: tweet.id,
        terryComment: "Another day in the transfer circus. Roll up, roll up.",
        metadata: {
          type: "cohesive",
          content: cleanContent,
          keyPlayers: cohesiveBriefing.metadata.keyPlayers,
          keyClubs: cohesiveBriefing.metadata.keyClubs,
          mainImage: cohesiveBriefing.metadata.mainImage,
          playerImages: cohesiveBriefing.metadata.playerImages,
          sources: [
            ...new Set(
              recentItems.map((item) => item.authors[0]?.name || "Unknown"),
            ),
          ],
        },
      },
    });

    // Link to briefing
    await prisma.briefingStory.create({
      data: {
        briefingId: briefing.id,
        storyId: story.id,
        position: 0,
      },
    });

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: "RSS Briefing generation completed",
      briefing: {
        id: briefing.id,
        title: briefing.title,
        storiesCount: 1,
        publishedAt: briefing.publishedAt,
      },
    });
  } catch (error) {
    console.error("RSS Briefing cron job failed:", error);
    await prisma.$disconnect();

    return NextResponse.json(
      {
        error: "Failed to generate RSS briefing",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
