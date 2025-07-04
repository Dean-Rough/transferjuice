#!/usr/bin/env tsx

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { TwitterScraper } from "../src/lib/scraper";
import { generateTerryComment } from "../src/lib/terry";

async function testScraperOnly() {
  const scraper = new TwitterScraper();

  try {
    console.log("🚀 Testing scraper without database...");

    // Initialize scraper
    await scraper.initialize();

    // Test scraping just one account
    console.log("\n📱 Scraping Fabrizio Romano...");
    const tweets = await scraper.scrapeAccount(
      "@FabrizioRomano",
      "Fabrizio Romano",
    );

    console.log(`\n✅ Found ${tweets.length} tweets\n`);

    // Show first 3 tweets with Terry commentary
    for (let i = 0; i < Math.min(3, tweets.length); i++) {
      const tweet = tweets[i];
      console.log(`\n--- Tweet ${i + 1} ---`);
      console.log(`Source: ${tweet.sourceName}`);
      console.log(`Content: ${tweet.content}`);
      console.log(`URL: ${tweet.url}`);

      // Generate Terry comment
      console.log("\n🎭 Generating Terry comment...");
      const terryComment = await generateTerryComment(tweet.content);
      console.log(`Terry says: ${terryComment}`);
      console.log("-".repeat(50));
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await scraper.close();
  }
}

testScraperOnly();
