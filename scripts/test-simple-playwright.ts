#!/usr/bin/env npx tsx
/**
 * Simple test to verify Playwright bypass is working
 */

import { config } from "dotenv";
import { TwitterClient } from "@/lib/twitter/client";

// Load environment variables
config({ path: ".env.local" });

async function test() {
  console.log("Environment:", {
    USE_PLAYWRIGHT_SCRAPER: process.env.USE_PLAYWRIGHT_SCRAPER,
    hasUsername: !!process.env.TWITTER_SCRAPER_USERNAME,
    hasPassword: !!process.env.TWITTER_SCRAPER_PASSWORD,
  });

  const client = TwitterClient.getInstance();
  
  try {
    // This should bypass API and use Playwright
    const timeline = await client.getUserTimeline("FabrizioRomano", {
      username: "FabrizioRomano",
      maxResults: 3,
    });
    
    console.log(`Got ${timeline.data?.length || 0} tweets`);
    timeline.data?.forEach((tweet, i) => {
      console.log(`${i + 1}. ${tweet.text.substring(0, 50)}...`);
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

test();