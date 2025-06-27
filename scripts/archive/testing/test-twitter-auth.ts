#!/usr/bin/env tsx

/**
 * Test Twitter API authentication
 */

import { TwitterClient } from "../src/lib/twitter/client";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function testAuth() {
  console.log("🔐 Testing Twitter API authentication...");

  // Decode the bearer token if it's URL encoded
  const bearerToken = decodeURIComponent(process.env.TWITTER_BEARER_TOKEN!);
  console.log(
    "Bearer token starts with:",
    bearerToken.substring(0, 20) + "...",
  );
  console.log("Bearer token length:", bearerToken.length);

  const client = new TwitterClient({
    bearerToken: bearerToken,
  });

  try {
    // Try a simple request - get Twitter's own account
    console.log("\n📡 Testing with @Twitter account...");
    const twitter = await client.getUserByUsername("Twitter");
    console.log("✅ Success! Found:", twitter.name);
    console.log(
      "   Followers:",
      twitter.public_metrics.followers_count.toLocaleString(),
    );

    // Check rate limit status
    const rateLimits = client.getRateLimitStatus();
    console.log("\n📊 Rate Limit Status:");
    Object.entries(rateLimits).forEach(([endpoint, info]) => {
      console.log(`   ${endpoint}:`);
      console.log(`   - Remaining: ${info.remaining}/${info.limit}`);
      console.log(
        `   - Resets at: ${new Date(info.reset * 1000).toLocaleString()}`,
      );
    });

    console.log("\n✅ Authentication working! You can now pull Twitter data.");
  } catch (error: any) {
    console.error("\n❌ Authentication failed:");
    console.error("Error:", error.message);
    if (error.details) {
      console.error("Details:", error.details);
    }
  }
}

testAuth();
