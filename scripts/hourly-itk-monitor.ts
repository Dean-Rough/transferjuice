#!/usr/bin/env tsx
/**
 * Hourly ITK Monitoring Script
 * Monitors all 44 global ITK sources using session-based scraping
 */

import { HybridTwitterClient } from "../src/lib/twitter/hybrid-client";
import { ITK_SOURCES_CONFIG } from "../src/lib/twitter/globalSources";
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

async function hourlyMonitoring() {
  console.log("🌍 TRANSFERJUICE HOURLY ITK MONITORING");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Started: ${new Date().toLocaleString()}`);
  console.log(
    `Sources: ${ITK_SOURCES_CONFIG.sources.length} accounts across ${ITK_SOURCES_CONFIG.regions.length} regions\n`,
  );

  // Check session exists
  const sessionPath = path.join(
    process.cwd(),
    ".twitter-sessions",
    "juice_backer",
  );
  try {
    await fs.access(sessionPath);
    console.log("✅ Session found\n");
  } catch {
    console.error("❌ No saved session found!");
    console.log("Run: npx tsx scripts/setup-twitter-session.ts");
    return;
  }

  // Initialize hybrid client with Playwright scraper
  const client = new HybridTwitterClient();

  const results = {
    totalSources: 0,
    successfulSources: 0,
    totalTweets: 0,
    transferTweets: 0,
    newItems: 0,
    errors: [] as string[],
  };

  // Process sources by region
  for (const region of ITK_SOURCES_CONFIG.regions) {
    console.log(`\n🌍 ${region.name} (${region.sources.length} sources)`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    for (const source of region.sources) {
      results.totalSources++;

      try {
        console.log(`📰 @${source.username} - ${source.name}`);

        // Fetch tweets
        const tweets = await client.getUserTweets(source.username, 10);

        if (tweets.length === 0) {
          console.log("   ❌ No tweets found");
          continue;
        }

        results.successfulSources++;
        results.totalTweets += tweets.length;

        // Process each tweet
        let newCount = 0;
        for (const tweet of tweets) {
          // Check if transfer-related
          const transferKeywords = [
            "transfer",
            "signing",
            "medical",
            "fee",
            "deal",
            "agreed",
            "bid",
            "contract",
            "loan",
            "here we go",
          ];
          const isTransfer = transferKeywords.some((keyword) =>
            tweet.text.toLowerCase().includes(keyword),
          );

          if (!isTransfer) continue;

          results.transferTweets++;

          // Check if already in database
          const existing = await prisma.feedItem.findUnique({
            where: { tweetId: tweet.id },
          });

          if (existing) continue;

          // Save to database
          await prisma.feedItem.create({
            data: {
              tweetId: tweet.id,
              sourceId: source.username,
              sourceName: source.name,
              sourceRegion: region.id,
              content: tweet.text,
              timestamp: new Date(tweet.created_at),
              mediaUrls: tweet.mediaUrls || [],
              classification: {
                isTransferRelated: true,
                confidence: 0.9,
                keywords: transferKeywords.filter((k) =>
                  tweet.text.toLowerCase().includes(k),
                ),
              },
              isPublished: false, // Will be published after Terry commentary
              metadata: {
                replies: tweet.replies || 0,
                verified: tweet.author?.verified || false,
                region: region.name,
                language: region.languages[0],
              },
            },
          });

          newCount++;
          results.newItems++;

          // Show preview
          console.log(`   🔥 NEW: "${tweet.text.substring(0, 80)}..."`);
        }

        if (newCount > 0) {
          console.log(`   ✅ ${newCount} new transfer items saved`);
        } else {
          console.log(
            `   ✅ ${tweets.length} tweets checked, no new transfers`,
          );
        }

        // Delay between sources
        await new Promise((resolve) =>
          setTimeout(resolve, 2000 + Math.random() * 1000),
        );
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.errors.push(`${source.username}: ${error.message}`);
      }
    }
  }

  // Summary
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 MONITORING SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log(
    `Sources monitored: ${results.successfulSources}/${results.totalSources}`,
  );
  console.log(`Total tweets checked: ${results.totalTweets}`);
  console.log(
    `Transfer-related: ${results.transferTweets} (${((results.transferTweets / results.totalTweets) * 100).toFixed(1)}%)`,
  );
  console.log(`New items saved: ${results.newItems}`);

  if (results.errors.length > 0) {
    console.log(`\nErrors (${results.errors.length}):`);
    results.errors.forEach((err) => console.log(`  - ${err}`));
  }

  console.log(`\nCompleted: ${new Date().toLocaleString()}`);
  console.log(`Duration: ${Math.round((Date.now() - startTime) / 1000)}s`);

  // Save monitoring log
  const logPath = path.join(
    process.cwd(),
    "logs",
    `monitoring-${new Date().toISOString().split("T")[0]}.json`,
  );
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  await fs.writeFile(
    logPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        results,
        sources: ITK_SOURCES_CONFIG.sources.map((s) => s.username),
      },
      null,
      2,
    ),
  );

  console.log(`\n📁 Log saved to: ${logPath}`);

  // Close database
  await prisma.$disconnect();
}

const startTime = Date.now();

// Run monitoring
hourlyMonitoring().catch(async (error) => {
  console.error("Fatal error:", error);
  await prisma.$disconnect();
  process.exit(1);
});
