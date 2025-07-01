/**
 * Test Twitter Playwright Login
 * Verifies that the scraper can successfully log into Twitter
 */

import { getPlaywrightScraper } from "../src/lib/twitter/playwright-scraper";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function testTwitterLogin() {
  console.log("🧪 Testing Twitter Playwright Login...\n");

  // Check environment variables
  const username = process.env.TWITTER_SCRAPER_USERNAME;
  const password = process.env.TWITTER_SCRAPER_PASSWORD;

  console.log("📋 Environment Check:");
  console.log(`  Username: ${username ? `✅ Set (${username})` : "❌ Missing"}`);
  console.log(`  Password: ${password ? "✅ Set" : "❌ Missing"}`);
  console.log(`  Headless: ${process.env.PLAYWRIGHT_HEADLESS !== 'false' ? "Yes" : "No"}`);
  console.log("");

  if (!username || !password) {
    console.error("❌ Twitter credentials not found in environment variables!");
    console.log("Please ensure these are set in .env.local:");
    console.log("  TWITTER_SCRAPER_USERNAME=your_username");
    console.log("  TWITTER_SCRAPER_PASSWORD=your_password");
    process.exit(1);
  }

  const scraper = getPlaywrightScraper({
    headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
    timeout: 30000,
  });

  try {
    console.log("🚀 Initializing Playwright scraper...");
    await scraper.initialize();

    // Test connection first
    console.log("\n🔗 Testing Twitter connection...");
    const isConnected = await scraper.testConnection();
    console.log(`  Connection: ${isConnected ? "✅ Success" : "❌ Failed"}`);

    // Test scraping a known account
    console.log("\n🐦 Testing tweet scraping for @FabrizioRomano...");
    const tweets = await scraper.scrapeUserTweets("FabrizioRomano", 5);
    
    console.log(`\n📊 Results:`);
    console.log(`  Tweets found: ${tweets.length}`);
    
    if (tweets.length > 0) {
      console.log("\n  Sample tweets:");
      tweets.slice(0, 3).forEach((tweet, i) => {
        console.log(`\n  ${i + 1}. Tweet ID: ${tweet.id}`);
        console.log(`     Text: ${tweet.text.substring(0, 100)}...`);
        console.log(`     Created: ${tweet.createdAt.toISOString()}`);
        console.log(`     Media: ${tweet.media.length} items`);
        console.log(`     Author: @${tweet.author.username} (${tweet.author.name})`);
      });
    }

    // Test multiple users
    console.log("\n🐦 Testing batch scraping...");
    const usernames = ["FabrizioRomano", "SkySportsPL", "GuillemBalague"];
    const batchResults = await scraper.scrapeMultipleUsers(usernames, 3);
    
    console.log("\n📊 Batch Results:");
    for (const [user, userTweets] of batchResults.entries()) {
      console.log(`  @${user}: ${userTweets.length} tweets`);
    }

    console.log("\n✅ All tests completed successfully!");
    console.log("\n💡 Login appears to be working correctly.");

  } catch (error) {
    console.error("\n❌ Test failed:", error);
    console.log("\n🔍 Debugging tips:");
    console.log("  1. Run with PLAYWRIGHT_HEADLESS=false to see the browser");
    console.log("  2. Check if Twitter has changed their login flow");
    console.log("  3. Verify credentials are correct");
    console.log("  4. Check for any 2FA requirements on the account");
  } finally {
    console.log("\n🧹 Cleaning up...");
    await scraper.close();
  }
}

// Run the test
testTwitterLogin().catch(console.error);