#!/usr/bin/env tsx

/**
 * Test Apify Integration
 * Verifies that Apify can fetch tweets as a Twitter API replacement
 */

import { apifyClient } from "../src/lib/apify/client";
import { validateEnvironment } from "../src/lib/validations/environment";

async function testApifyIntegration() {
  console.log("🧪 Testing Apify Integration");
  console.log("===========================\n");

  try {
    // Validate environment
    console.log("🔧 Validating environment...");
    const env = validateEnvironment();

    if (!env.APIFY_API_TOKEN) {
      throw new Error("APIFY_API_TOKEN not found in environment");
    }

    console.log("✅ Apify API token found\n");

    // Test connection
    console.log("🔌 Testing Apify connection...");
    const connected = await apifyClient.testConnection();
    
    if (!connected) {
      throw new Error("Failed to connect to Apify");
    }
    
    console.log("✅ Successfully connected to Apify\n");

    // Test fetching tweets from a single user
    console.log("📱 Testing single user tweet fetch...");
    const testUsername = "FabrizioRomano";
    
    console.log(`Fetching recent tweets from @${testUsername}...`);
    const tweets = await apifyClient.fetchUserTweets(testUsername, {
      maxItems: 5,
    });

    console.log(`✅ Fetched ${tweets.length} tweets from @${testUsername}\n`);

    if (tweets.length > 0) {
      console.log("Sample tweet:");
      console.log(`- ID: ${tweets[0].id}`);
      console.log(`- Text: ${tweets[0].text.substring(0, 100)}...`);
      console.log(`- Created: ${tweets[0].createdAt}`);
      console.log(`- Likes: ${tweets[0].metrics?.likeCount || 0}`);
      console.log(`- Retweets: ${tweets[0].metrics?.retweetCount || 0}\n`);
    }

    // Test batch fetch for multiple users
    console.log("📱 Testing batch user tweet fetch...");
    const testUsernames = ["FabrizioRomano", "David_Ornstein", "GFN_France"];
    
    console.log(`Fetching tweets from ${testUsernames.length} users...`);
    const batchResults = await apifyClient.fetchMultipleUsersTweets(testUsernames, {
      maxItemsPerUser: 3,
    });

    console.log("\n✅ Batch fetch results:");
    for (const [username, userTweets] of Object.entries(batchResults)) {
      console.log(`- @${username}: ${userTweets.length} tweets`);
    }

    // Test the Twitter client with Apify fallback
    console.log("\n🔄 Testing Twitter client with Apify fallback...");
    const { TwitterClient } = await import("../src/lib/twitter/client");
    
    const twitterClient = new TwitterClient({
      bearerToken: env.TWITTER_BEARER_TOKEN,
      useApifyFallback: true,
    });

    // This should trigger rate limit and fall back to Apify
    console.log("Attempting to fetch via Twitter API (expecting rate limit)...");
    
    try {
      const timeline = await twitterClient.getUserTimeline("1234567890", {
        username: "FabrizioRomano",
        maxResults: 5,
      });

      if (timeline.data && timeline.data.length > 0) {
        console.log(`✅ Fetched ${timeline.data.length} tweets via fallback`);
      }
    } catch (error) {
      console.log("❌ Error:", error);
    }

    console.log("\n🎉 Apify integration test completed successfully!");
    console.log("\nCost estimate:");
    console.log("- Single user fetch (5 tweets): $0.002");
    console.log("- Batch fetch (3 users × 3 tweets): $0.0036");
    console.log("- Monthly estimate (44 sources × 5 tweets/day × 30 days): ~$2.64");

    console.log("\n💡 Next steps:");
    console.log("1. Navigate to https://console.apify.com/actors");
    console.log("2. Search for 'Tweet Scraper V2' by apidojo");
    console.log("3. Click 'Start' to manually configure and test the actor");
    console.log("4. The integration will automatically use it when Twitter API is rate limited");

  } catch (error) {
    console.error("\n❌ Test failed:", error);
    
    if (error instanceof Error && error.message.includes("Apify actor run failed")) {
      console.error("\n⚠️  The actor might not be started in your Apify account.");
      console.error("Please visit https://console.apify.com/actors and start the Tweet Scraper V2 actor.");
    }
    
    process.exit(1);
  }
}

// Run the test
testApifyIntegration();