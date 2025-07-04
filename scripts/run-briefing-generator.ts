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
import { generateBriefing } from "../src/lib/briefings/generator";

// Load environment variables
config({ path: ".env.local" });

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
    const result = await generateBriefing({
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      testMode,
      debugMode: true,
    });

    console.log("\n✅ Briefing Generation Complete!");
    console.log("================================");
    console.log(`Briefing ID: ${result.id}`);
    console.log(`Slug: ${result.slug}`);
    console.log(`URL: http://localhost:4433/briefings/${result.slug}`);
    console.log("\nDetails:");
    console.log(`- Word count: ${result.wordCount}`);
    console.log(`- Read time: ${result.readTime} minutes`);
    console.log(`- Terry score: ${result.terryScore}`);
    console.log(`- Published: ${result.isPublished ? "Yes" : "No"}`);

    // Log scraping health metrics if available
    if ((result as any).stats) {
      const stats = (result as any).stats;
      console.log("\nScraping Metrics:");
      console.log(`- Sources monitored: ${stats.sourcesMonitored || "N/A"}`);
      console.log(`- Tweets processed: ${stats.tweetsProcessed || "N/A"}`);
      console.log(
        `- Processing time: ${stats.processingTime ? stats.processingTime + "ms" : "N/A"}`,
      );
    }
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
        error.message.includes("All stories have been recently briefed")
      ) {
        console.log("ℹ️  No new content to brief - skipping");
        process.exit(2); // Skipped
      }
    }

    process.exit(1); // Hard failure
  }
}

run().catch(console.error);
