#!/usr/bin/env tsx
/**
 * PRIMARY PRODUCTION BRIEFING GENERATOR
 *
 * This is THE main production script for generating Transfer Juice briefings.
 * Runs every 2 hours via cron to aggregate ITK tweets and generate magazine-style briefings.
 *
 * Usage:
 *   npm run briefing:generate                  # Generate briefing for current time
 *   npm run briefing:generate -- --test        # Test mode with mock data
 *   npm run briefing:generate -- --timestamp="2025-01-15T14:00:00Z"  # Specific time
 *
 * Cron Schedule:
 *   0 [star]/2 [star] [star] [star] cd /path/to/transferjuice && npm run briefing:generate
 *
 * Exit Codes:
 *   0 = Success
 *   1 = Hard failure (critical error)
 *   2 = Skipped (no new content or already exists)
 */

import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { generateCohesiveBriefing } from "../src/lib/cohesiveBriefingGenerator";
import OpenAI from "openai";

// Load environment variables
config({ path: ".env.local" });
if (!process.env.DATABASE_URL) {
  config(); // Try default .env if .env.local doesn't have DATABASE_URL
}

const prisma = new PrismaClient();

async function run() {
  // Validate environment
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY not set - required for Terry commentary");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const testMode = args.includes("--test");
  const timestamp = args
    .find((arg) => arg.startsWith("--timestamp="))
    ?.split("=")[1];

  console.log("🚀 Transfer Juice Production Briefing Generator");
  console.log("===============================================");
  console.log(`Mode: ${testMode ? "TEST" : "PRODUCTION"}`);
  console.log(`Timestamp: ${timestamp || "Current time"}`);
  console.log(
    `Twitter: ${process.env.USE_REAL_TWITTER_API === "true" ? "API" : "Playwright Scraper"}`,
  );
  console.log("");

  try {
    // Fetch RSS feed
    const feedUrl = "https://rss.app/feeds/v1.1/_zMqruZvtL6XIMNVY.json";
    console.log("📡 Fetching RSS feed...");
    const response = await fetch(feedUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }
    
    const feed = await response.json();
    console.log(`Found ${feed.items.length} items in feed`);
    
    // Filter to recent items
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 3); // 3 hours for regular briefings
    
    const recentItems = feed.items.filter((item: any) => {
      const itemDate = new Date(item.date_published);
      return itemDate > cutoffTime;
    });
    
    console.log(`Filtered to ${recentItems.length} recent items`);
    
    if (recentItems.length === 0) {
      console.log("ℹ️  No new content to brief - skipping");
      process.exit(2);
    }
    
    // Check for existing briefing in last 2 hours
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
    
    const existingBriefing = await prisma.briefing.findFirst({
      where: {
        publishedAt: {
          gte: twoHoursAgo
        }
      }
    });
    
    if (existingBriefing && !testMode) {
      console.log("ℹ️  Recent briefing already exists - skipping");
      console.log(`   Last briefing: ${existingBriefing.title} at ${existingBriefing.publishedAt}`);
      process.exit(2);
    }
    
    // Generate cohesive briefing
    console.log("📝 Generating cohesive briefing...");
    const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
    const cohesiveBriefing = await generateCohesiveBriefing(recentItems, openai);
    
    // Create briefing in database
    const briefing = await prisma.briefing.create({
      data: {
        title: cohesiveBriefing.title,
        publishedAt: timestamp ? new Date(timestamp) : new Date()
      }
    });
    
    // Create source for the briefing
    const source = await prisma.source.upsert({
      where: { handle: "TransferJuice" },
      update: {},
      create: {
        name: "TransferJuice Editorial",
        handle: "TransferJuice"
      }
    });
    
    // Create tweet for the story
    const tweet = await prisma.tweet.create({
      data: {
        tweetId: `briefing-${briefing.id}`,
        content: `Transfer Briefing: ${cohesiveBriefing.metadata.keyPlayers.slice(0, 3).join(', ')} and more`,
        url: `https://transferjuice.com/briefing/${briefing.id}`,
        sourceId: source.id,
        scrapedAt: new Date()
      }
    });
    
    // Create story with cohesive content
    const story = await prisma.story.create({
      data: {
        tweetId: tweet.id,
        terryComment: "Another day, another briefing about millionaires kicking a ball around.",
        metadata: {
          type: 'cohesive',
          content: cohesiveBriefing.content,
          ...cohesiveBriefing.metadata
        }
      }
    });
    
    // Link story to briefing
    await prisma.briefingStory.create({
      data: {
        briefingId: briefing.id,
        storyId: story.id,
        position: 0
      }
    });

    console.log("\n✅ Briefing Generation Complete!");
    console.log("================================");
    console.log(`Briefing ID: ${briefing.id}`);
    console.log(`Title: ${briefing.title}`);
    console.log(`URL: http://localhost:4433/briefing/${briefing.id}`);
    console.log("\nDetails:");
    console.log(`- Key Players: ${cohesiveBriefing.metadata.keyPlayers.join(', ')}`);
    console.log(`- Key Clubs: ${cohesiveBriefing.metadata.keyClubs.join(', ')}`);
    console.log(`- Has main image: ${cohesiveBriefing.metadata.mainImage ? 'Yes' : 'No'}`);
    console.log(`- Published: ${briefing.publishedAt}`);

  } catch (error) {
    console.error("\n❌ Briefing generation failed:");
    console.error(error);

    // Different exit codes for monitoring
    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        console.log("ℹ️  Briefing already exists - skipping");
        process.exit(2); // Skipped
      }
      if (
        error.message.includes("No relevant tweets") ||
        error.message.includes("No new content")
      ) {
        console.log("ℹ️  No new content to brief - skipping");
        process.exit(2); // Skipped
      }
    }

    process.exit(1); // Hard failure
  } finally {
    await prisma.$disconnect();
  }
}

run().catch(console.error);
