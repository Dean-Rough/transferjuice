/**
 * Test Twitter Scraper with Various Accounts
 * Verifies scraping works with different account types
 */

import { getPlaywrightScraper } from "../src/lib/twitter/playwright-scraper";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function testTwitterScraperAccounts() {
  console.log("🧪 Testing Twitter Scraper with Various Accounts\n");

  const scraper = getPlaywrightScraper({
    headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
    timeout: 30000,
  });

  // Test accounts - mix of verified ITK sources and official accounts
  const testAccounts = [
    { username: "FabrizioRomano", description: "Tier 1 ITK - Verified" },
    { username: "David_Ornstein", description: "Tier 1 ITK - The Athletic" },
    { username: "SkySports", description: "Official Sky Sports (not PL specific)" },
    { username: "premierleague", description: "Official Premier League" },
    { username: "TransferJuice", description: "TransferJuice main account" },
    { username: "BBCSport", description: "BBC Sport" },
    { username: "GaryLineker", description: "BBC Presenter" },
    { username: "RoyalBlue_CFC", description: "Chelsea ITK" }, // May not exist
  ];

  try {
    console.log("🚀 Initializing Playwright scraper...");
    await scraper.initialize();

    console.log("\n📊 Testing accounts:\n");

    const results = [];
    
    for (const account of testAccounts) {
      console.log(`\n🐦 Testing @${account.username} (${account.description})...`);
      
      try {
        const startTime = Date.now();
        const tweets = await scraper.scrapeUserTweets(account.username, 5);
        const duration = Date.now() - startTime;
        
        const result = {
          username: account.username,
          description: account.description,
          success: tweets.length > 0,
          tweetCount: tweets.length,
          duration: duration,
          sampleTweet: tweets[0]?.text?.substring(0, 100) || "N/A",
        };
        
        results.push(result);
        
        console.log(`  Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
        console.log(`  Tweets found: ${result.tweetCount}`);
        console.log(`  Time taken: ${result.duration}ms`);
        if (result.success) {
          console.log(`  Sample: "${result.sampleTweet}..."`);
        }
      } catch (error) {
        console.log(`  Status: ❌ Error`);
        console.log(`  Error: ${error instanceof Error ? error.message : 'Unknown'}`);
        
        results.push({
          username: account.username,
          description: account.description,
          success: false,
          tweetCount: 0,
          duration: 0,
          sampleTweet: "Error",
        });
      }
      
      // Small delay between accounts
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Summary
    console.log("\n\n📊 Summary Report:");
    console.log("=================\n");
    
    const successCount = results.filter(r => r.success).length;
    console.log(`Total accounts tested: ${results.length}`);
    console.log(`Successful: ${successCount} (${Math.round(successCount / results.length * 100)}%)`);
    console.log(`Failed: ${results.length - successCount}`);
    
    console.log("\n✅ Working accounts:");
    results.filter(r => r.success).forEach(r => {
      console.log(`  - @${r.username}: ${r.tweetCount} tweets (${r.duration}ms)`);
    });
    
    console.log("\n❌ Failed accounts:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - @${r.username}: ${r.description}`);
    });

    console.log("\n💡 Recommendations:");
    console.log("  1. Verify account names are correct (no typos)");
    console.log("  2. Check if accounts are suspended or private");
    console.log("  3. Consider implementing retry logic for failed accounts");
    console.log("  4. Monitor which selectors work for different account types");

  } catch (error) {
    console.error("\n❌ Test failed:", error);
  } finally {
    console.log("\n🧹 Cleaning up...");
    await scraper.close();
  }
}

// Run the test
testTwitterScraperAccounts().catch(console.error);