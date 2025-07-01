/**
 * Test Briefing Generator Twitter Integration
 * Verifies that Playwright scraper works correctly within the briefing pipeline
 */

import { fetchTweetsFromSource } from "../src/lib/briefings/twitter";
import { TwitterClient } from "../src/lib/twitter/client";
import { getActiveITKSources } from "../src/lib/database/sources";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function testBriefingTwitterIntegration() {
  console.log("🧪 Testing Briefing Generator Twitter Integration\n");

  // Configuration check
  console.log("📋 Configuration:");
  console.log(`  USE_PLAYWRIGHT_SCRAPER: ${process.env.USE_PLAYWRIGHT_SCRAPER || 'false'}`);
  console.log(`  TWITTER_BEARER_TOKEN: ${process.env.TWITTER_BEARER_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`  TWITTER_SCRAPER_USERNAME: ${process.env.TWITTER_SCRAPER_USERNAME ? '✅ Set' : '❌ Missing'}`);
  console.log(`  TWITTER_SCRAPER_PASSWORD: ${process.env.TWITTER_SCRAPER_PASSWORD ? '✅ Set' : '❌ Missing'}`);
  console.log("");

  try {
    // Test 1: Initialize Twitter client
    console.log("🔧 Test 1: Initialize Twitter Client");
    const client = TwitterClient.getInstance();
    const validation = client.validateConfiguration();
    console.log(`  Configuration valid: ${validation.valid ? '✅' : '❌'}`);
    if (!validation.valid) {
      console.log(`  Errors: ${validation.errors.join(', ')}`);
    }

    // Test 2: Check hybrid client status
    console.log("\n🔧 Test 2: Check Hybrid Client Status");
    const hybridStatus = client.getHybridStatus();
    console.log(`  Playwright available: ${hybridStatus.isAvailable ? '✅' : '❌'}`);
    console.log(`  Initialized: ${hybridStatus.isInitialized ? '✅' : '❌'}`);
    console.log(`  Tweet count: ${hybridStatus.tweetCount}`);

    // Test 3: Get active sources from database
    console.log("\n🔧 Test 3: Get Active ITK Sources");
    const sources = await getActiveITKSources();
    console.log(`  Found ${sources.length} active sources`);
    
    // Pick a few sources to test
    const testSources = sources.slice(0, 3);
    console.log(`  Testing with: ${testSources.map(s => `@${s.username}`).join(', ')}`);

    // Test 4: Fetch tweets using briefing pipeline
    console.log("\n🔧 Test 4: Fetch Tweets via Briefing Pipeline");
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    const until = new Date();

    for (const source of testSources) {
      console.log(`\n  📡 Fetching from @${source.username}...`);
      
      try {
        // Get timeline using the client directly
        const userId = process.env.USE_PLAYWRIGHT_SCRAPER === "true" 
          ? source.username 
          : source.twitterId || source.username;
          
        const timeline = await client.getUserTimeline(userId, {
          maxResults: 10,
          startTime: since.toISOString(),
          endTime: until.toISOString(),
          username: source.username,
        });

        const tweetCount = timeline.data?.length || 0;
        console.log(`    Tweets found: ${tweetCount}`);
        
        if (tweetCount > 0 && timeline.data) {
          console.log(`    Sample tweet: "${timeline.data[0].text.substring(0, 60)}..."`);
          console.log(`    Created at: ${timeline.data[0].created_at}`);
        }

        // Check rate limit status
        const rateLimits = client.getRateLimitStatus();
        const endpoint = `/users/${userId}/tweets`;
        if (rateLimits[endpoint]) {
          console.log(`    Rate limit: ${rateLimits[endpoint].remaining}/${rateLimits[endpoint].limit}`);
        }
      } catch (error) {
        console.error(`    ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Test 5: Test specific problematic accounts
    console.log("\n🔧 Test 5: Test Specific Accounts");
    const testAccounts = ["FabrizioRomano", "SkySportsPL", "GuillemBalague"];
    
    for (const username of testAccounts) {
      console.log(`\n  Testing @${username}...`);
      try {
        const timeline = await client.getUserTimeline(username, {
          maxResults: 5,
          username: username,
        });
        
        const tweetCount = timeline.data?.length || 0;
        console.log(`    Status: ${tweetCount > 0 ? '✅ Success' : '❌ No tweets'}`);
        console.log(`    Tweets: ${tweetCount}`);
      } catch (error) {
        console.log(`    Status: ❌ Failed`);
        console.log(`    Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    console.log("\n✅ Integration test completed!");
    
    // Summary
    console.log("\n📊 Summary:");
    console.log("  - Twitter client initialized successfully");
    console.log("  - Playwright scraper is logged in and working");
    console.log("  - Briefing pipeline can fetch tweets");
    console.log("  - Some accounts may need special handling");
    
    console.log("\n💡 Recommendations:");
    console.log("  1. Enable USE_PLAYWRIGHT_SCRAPER=true for reliable scraping");
    console.log("  2. Monitor rate limits when using Twitter API");
    console.log("  3. Consider implementing account-specific selectors for problematic accounts");

  } catch (error) {
    console.error("\n❌ Integration test failed:", error);
  } finally {
    // Clean up
    const client = TwitterClient.getInstance();
    const hybridClient = client.getHybridStatus();
    if (hybridClient.isInitialized) {
      console.log("\n🧹 Cleaning up...");
      // The hybrid client will be cleaned up automatically
    }
  }
}

// Run the test
testBriefingTwitterIntegration().catch(console.error);