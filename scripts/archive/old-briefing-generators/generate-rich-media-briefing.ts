#!/usr/bin/env tsx

/**
 * Generate Rich Media Briefing
 * Creates a OneFootball-style enriched briefing with full content pipeline
 */

import { config } from "dotenv";
import { generateRichMediaBriefing } from "@/briefing-generator/RichMediaOrchestrator";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

config();

async function main() {
  console.log("🚀 Starting Rich Media Briefing Generation Pipeline");
  console.log("=" .repeat(60));
  
  try {
    // Determine time slot based on current hour
    const now = new Date();
    const hour = now.getHours();
    const timeSlot = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    
    console.log(`\n📅 Time: ${now.toLocaleString()}`);
    console.log(`⏰ Time Slot: ${timeSlot}`);
    
    // Check if briefing already exists for this time slot
    const existingBriefing = await prisma.briefing.findFirst({
      where: {
        timestamp: {
          gte: new Date(now.setHours(hour, 0, 0, 0)),
          lt: new Date(now.setHours(hour + 1, 0, 0, 0)),
        }
      }
    });
    
    if (existingBriefing && !process.argv.includes("--force")) {
      console.log("\n⚠️  Briefing already exists for this time slot!");
      console.log(`   ID: ${existingBriefing.id}`);
      console.log(`   Slug: ${existingBriefing.slug}`);
      console.log("\n   Use --force to regenerate");
      return;
    }
    
    // Generate the briefing
    console.log("\n🔄 Generating rich media briefing...\n");
    
    const briefing = await generateRichMediaBriefing({
      timeSlot: timeSlot as "morning" | "afternoon" | "evening",
      testMode: process.argv.includes("--test"),
      saveToDatabase: !process.argv.includes("--no-save"),
      targetWordCount: 1200,
    });
    
    console.log("\n✅ Rich Media Briefing Generated Successfully!");
    console.log("=" .repeat(60));
    
    // Display results
    console.log("\n📊 BRIEFING DETAILS:");
    console.log(`   Title: ${briefing.title}`);
    console.log(`   Slug: ${briefing.slug}`);
    console.log(`   Word Count: ${briefing.metadata.wordCount}`);
    console.log(`   Reading Time: ${briefing.metadata.readingTime} minutes`);
    
    console.log("\n📈 STATISTICS:");
    console.log(`   Tweets Analyzed: ${briefing.enrichedData.stats.tweetCount}`);
    console.log(`   Players Mentioned: ${briefing.enrichedData.stats.playerCount}`);
    console.log(`   Clubs Involved: ${briefing.enrichedData.stats.clubCount}`);
    console.log(`   Transfer Stories: ${briefing.enrichedData.stats.transferCount}`);
    
    console.log("\n🌟 TOP STORIES:");
    briefing.enrichedData.tweets.slice(0, 3).forEach((tweet, index) => {
      console.log(`\n   ${index + 1}. ${tweet.storyElements.headline}`);
      if (tweet.entities.players.length > 0) {
        console.log(`      Players: ${tweet.entities.players.map(p => p.name).join(", ")}`);
      }
      if (tweet.entities.clubs.length > 0) {
        console.log(`      Clubs: ${tweet.entities.clubs.map(c => c.name).join(", ")}`);
      }
      if (tweet.entities.fee) {
        console.log(`      Fee: €${tweet.entities.fee.amount}M`);
      }
      console.log(`      Stage: ${tweet.entities.stage}`);
    });
    
    console.log("\n🔗 URLS:");
    console.log(`   View Feed: http://localhost:4433/`);
    console.log(`   Direct Link: http://localhost:4433/briefings/${briefing.slug}`);
    console.log(`   Rich Media: http://localhost:4433/briefings/${briefing.slug}?style=rich`);
    
    // Save summary to file
    if (process.argv.includes("--save-summary")) {
      const fs = await import("fs/promises");
      const summaryPath = `./briefing-${briefing.slug}.json`;
      await fs.writeFile(summaryPath, JSON.stringify(briefing, null, 2));
      console.log(`\n💾 Summary saved to: ${summaryPath}`);
    }
    
  } catch (error) {
    console.error("\n❌ Error generating briefing:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run with proper error handling
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});