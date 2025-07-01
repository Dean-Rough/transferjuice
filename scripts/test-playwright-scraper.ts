#!/usr/bin/env npx tsx
/**
 * Test Playwright scraper functionality
 */

import { config } from "dotenv";
import { getPlaywrightScraper } from "@/lib/twitter/playwright-scraper";

// Load environment variables
config({ path: ".env.local" });

async function testPlaywrightScraper() {
  console.log("🧪 Testing Playwright Twitter Scraper...\n");

  // Check environment variables
  console.log("Environment check:");
  console.log("- USE_PLAYWRIGHT_SCRAPER:", process.env.USE_PLAYWRIGHT_SCRAPER);
  console.log("- TWITTER_SCRAPER_USERNAME:", process.env.TWITTER_SCRAPER_USERNAME ? "✅ Set" : "❌ Not set");
  console.log("- TWITTER_SCRAPER_PASSWORD:", process.env.TWITTER_SCRAPER_PASSWORD ? "✅ Set" : "❌ Not set");
  console.log("");

  const scraper = getPlaywrightScraper({
    headless: false, // Set to false to see the browser
    timeout: 60000, // Increase timeout for login
  });

  try {
    // Test connection
    console.log("📡 Testing Twitter connection...");
    const isConnected = await scraper.testConnection();
    console.log(`Connection test: ${isConnected ? "✅ Success" : "❌ Failed"}`);

    if (!isConnected) {
      console.error("Cannot connect to Twitter. Please check your internet connection.");
      return;
    }

    // Initialize and login
    console.log("\n🔐 Initializing browser and attempting login...");
    await scraper.initialize();

    // Test scraping a popular account
    const testUsername = "FabrizioRomano";
    console.log(`\n🔍 Testing scrape of @${testUsername}...`);
    
    const tweets = await scraper.scrapeUserTweets(testUsername, 5);
    
    console.log(`\n✅ Successfully scraped ${tweets.length} tweets:`);
    
    tweets.forEach((tweet, index) => {
      console.log(`\n📝 Tweet ${index + 1}:`);
      console.log(`   ID: ${tweet.id}`);
      console.log(`   Author: @${tweet.author.username} (${tweet.author.name})`);
      console.log(`   Verified: ${tweet.author.verified ? "✓" : "✗"}`);
      console.log(`   Time: ${tweet.createdAt.toISOString()}`);
      console.log(`   Text: ${tweet.text.substring(0, 100)}${tweet.text.length > 100 ? "..." : ""}`);
      console.log(`   Media: ${tweet.media.length} items`);
      console.log(`   Replies: ${tweet.replies}`);
    });

    // Test another account
    const testUsername2 = "SkySportsPL";
    console.log(`\n\n🔍 Testing scrape of @${testUsername2}...`);
    
    const tweets2 = await scraper.scrapeUserTweets(testUsername2, 3);
    console.log(`✅ Successfully scraped ${tweets2.length} tweets from @${testUsername2}`);

  } catch (error) {
    console.error("\n❌ Error during test:", error);
  } finally {
    // Clean up
    console.log("\n🧹 Closing browser...");
    await scraper.close();
    console.log("✅ Test complete");
  }
}

// Run the test
testPlaywrightScraper().catch(console.error);