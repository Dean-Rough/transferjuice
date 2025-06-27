import { TwitterClient } from "../src/lib/twitter/client";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function testTwitterAPI() {
  console.log("🐦 Testing Twitter API connection...");

  try {
    const client = TwitterClient.getInstance();

    // Test fetching a known account
    console.log("\n1. Testing getUserByUsername...");
    const user = await client.getUserByUsername("FabrizioRomano");
    console.log(`✅ Found user: ${user.name} (@${user.username})`);
    console.log(
      `   Followers: ${user.public_metrics.followers_count.toLocaleString()}`,
    );

    // Test fetching recent tweets
    console.log("\n2. Testing getUserTimeline...");
    const timeline = await client.getUserTimeline(user.id, {
      maxResults: 5,
      startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // Last hour
    });

    console.log(`✅ Found ${timeline.meta.result_count} tweets:`);
    (timeline.data || []).forEach((tweet, idx) => {
      console.log(`\n   ${idx + 1}. ${tweet.text.substring(0, 100)}...`);
      console.log(
        `      🔄 ${tweet.public_metrics.retweet_count} | ❤️ ${tweet.public_metrics.like_count}`,
      );
    });

    // Check rate limits
    console.log("\n3. Rate limit status:");
    const rateLimits = client.getRateLimitStatus();
    Object.entries(rateLimits).forEach(([endpoint, info]) => {
      console.log(
        `   ${endpoint}: ${info.remaining}/${info.limit} (resets ${new Date(info.reset * 1000).toLocaleTimeString()})`,
      );
    });
  } catch (error) {
    console.error("❌ Twitter API test failed:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
    }
  }
}

testTwitterAPI();
