#!/usr/bin/env tsx

/**
 * Test Twitter API v2 directly
 */

import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function testV2API() {
  console.log("🔐 Testing Twitter API v2...");

  // Decode the bearer token if it's URL encoded
  const bearerToken = decodeURIComponent(process.env.TWITTER_BEARER_TOKEN!);

  try {
    // Test v2 user lookup
    console.log("\n📡 Testing v2 user lookup for @FabrizioRomano...");
    const response = await fetch(
      "https://api.twitter.com/2/users/by/username/FabrizioRomano?user.fields=public_metrics,verified",
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      },
    );

    console.log("Response status:", response.status, response.statusText);

    // Log rate limit headers
    console.log("\n📊 Rate Limit Headers:");
    console.log("Limit:", response.headers.get("x-rate-limit-limit"));
    console.log("Remaining:", response.headers.get("x-rate-limit-remaining"));
    const resetTime = response.headers.get("x-rate-limit-reset");
    if (resetTime) {
      console.log(
        "Resets at:",
        new Date(parseInt(resetTime) * 1000).toLocaleString(),
      );
    }

    if (!response.ok) {
      const text = await response.text();
      console.error("\n❌ Error response:", text);
      return;
    }

    const data = await response.json();
    console.log("\n✅ Success! Found user:");
    console.log(JSON.stringify(data, null, 2));
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
  }
}

testV2API();
