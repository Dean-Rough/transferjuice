#!/usr/bin/env tsx

/**
 * Check Twitter API rate limit status
 */

import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function checkRateLimit() {
  console.log("🔍 Checking Twitter API rate limit...");

  // Decode the bearer token if it's URL encoded
  const bearerToken = decodeURIComponent(process.env.TWITTER_BEARER_TOKEN!);

  try {
    // Make a request to the rate limit endpoint
    const response = await fetch(
      "https://api.twitter.com/1.1/application/rate_limit_status.json?resources=users",
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      },
    );

    if (!response.ok) {
      console.error(
        "Failed to get rate limit:",
        response.status,
        response.statusText,
      );
      const text = await response.text();
      console.error("Response:", text);
      return;
    }

    const data = await response.json();
    console.log("\n📊 Rate Limit Status:");
    console.log(JSON.stringify(data, null, 2));

    // Check user lookup limits specifically
    if (data.resources?.users) {
      const userLookup = data.resources.users["/users/by/username/:username"];
      if (userLookup) {
        console.log("\n🔍 User Lookup Rate Limit:");
        console.log(
          `   Remaining: ${userLookup.remaining}/${userLookup.limit}`,
        );
        const resetTime = new Date(userLookup.reset * 1000);
        console.log(`   Resets at: ${resetTime.toLocaleString()}`);

        const now = Date.now();
        const waitTime = Math.max(0, resetTime.getTime() - now);
        if (waitTime > 0) {
          console.log(`   Wait time: ${Math.ceil(waitTime / 1000)} seconds`);
        } else {
          console.log(`   ✅ Ready to use!`);
        }
      }
    }
  } catch (error: any) {
    console.error("Error checking rate limit:", error.message);
  }
}

checkRateLimit();
