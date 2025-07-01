#!/usr/bin/env npx tsx
/**
 * Test Twitter API bypass when USE_PLAYWRIGHT_SCRAPER is enabled
 */

import { config } from "dotenv";
import { TwitterClient } from "@/lib/twitter/client";

// Load environment variables
config({ path: ".env.local" });

async function testTwitterBypass() {
  console.log("🧪 Testing Twitter API Bypass...\n");

  // Check environment
  console.log("Environment check:");
  console.log("- USE_PLAYWRIGHT_SCRAPER:", process.env.USE_PLAYWRIGHT_SCRAPER);
  console.log("- TWITTER_SCRAPER_USERNAME:", process.env.TWITTER_SCRAPER_USERNAME ? "✅ Set" : "❌ Not set");
  console.log("- TWITTER_SCRAPER_PASSWORD:", process.env.TWITTER_SCRAPER_PASSWORD ? "✅ Set" : "❌ Not set");
  console.log("- TWITTER_BEARER_TOKEN:", process.env.TWITTER_BEARER_TOKEN ? "✅ Set" : "❌ Not set");
  console.log("");

  const client = TwitterClient.getInstance();

  try {
    // Test getUserByUsername - should return mock data
    console.log("📋 Testing getUserByUsername (should return mock data)...");
    const user = await client.getUserByUsername("FabrizioRomano");
    console.log("User data:", {
      id: user.id,
      username: user.username,
      name: user.name,
      verified: user.verified,
    });

    // Test getUserTimeline - should use Playwright
    console.log("\n📋 Testing getUserTimeline (should use Playwright)...");
    const timeline = await client.getUserTimeline("FabrizioRomano", {
      username: "FabrizioRomano",
      maxResults: 5,
    });

    console.log(`\n✅ Retrieved ${timeline.data?.length || 0} tweets`);
    if (timeline.data && timeline.data.length > 0) {
      console.log("\nFirst tweet:");
      console.log("- ID:", timeline.data[0].id);
      console.log("- Text:", timeline.data[0].text.substring(0, 100) + "...");
      console.log("- Created:", timeline.data[0].created_at);
    }

    // Test batch fetch
    console.log("\n📋 Testing batchGetUserTimelines (should use Playwright for all)...");
    const users = [
      { id: "FabrizioRomano", username: "FabrizioRomano" },
      { id: "SkySportsPL", username: "SkySportsPL" },
    ];
    
    const batchResults = await client.batchGetUserTimelines(users, {
      maxResults: 3,
    });

    console.log(`\n✅ Batch results:`);
    for (const [username, timeline] of batchResults) {
      console.log(`- @${username}: ${timeline.data?.length || 0} tweets`);
    }

  } catch (error) {
    console.error("\n❌ Error during test:", error);
  }

  console.log("\n✅ Test complete");
}

// Run the test
testTwitterBypass().catch(console.error);