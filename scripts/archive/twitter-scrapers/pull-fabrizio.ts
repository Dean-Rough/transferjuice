#!/usr/bin/env tsx

/**
 * Pull REAL transfer data from Fabrizio Romano
 * NO MOCK DATA - LIVE TWITTER API CALLS ONLY
 */

import { TwitterClient } from "../src/lib/twitter/client";
import { prisma } from "../src/lib/prisma";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function pullRealFabrizioData() {
  console.log("🚀 PULLING REAL DATA FROM FABRIZIO ROMANO...");

  // Decode the bearer token if it's URL encoded
  const bearerToken = decodeURIComponent(process.env.TWITTER_BEARER_TOKEN!);
  console.log(
    "🔐 Bearer token decoded, starts with:",
    bearerToken.substring(0, 10) + "...",
  );

  const client = new TwitterClient({
    bearerToken: bearerToken,
  });

  // Check rate limit status
  console.log("📊 Checking rate limit status...");

  try {
    // Get Fabrizio's user info first
    console.log("📡 Getting Fabrizio Romano user info...");
    const userInfo = await client.getUserByUsername("FabrizioRomano");
    console.log(
      "✅ Found:",
      userInfo.name,
      "(" + userInfo.public_metrics.followers_count.toLocaleString(),
      "followers)",
    );

    // Get his latest tweets
    console.log("📱 Fetching latest tweets...");
    const tweets = await client.getUserTimeline(userInfo.id, {
      maxResults: 10,
    });

    console.log("✅ Retrieved", tweets.data.length, "real tweets");

    // Find the Fabrizio source in our database
    const fabrizioSource = await prisma.iTKSource.findUnique({
      where: { username: "FabrizioRomano" },
    });

    if (!fabrizioSource) {
      console.log("❌ Fabrizio source not found in database");
      return;
    }

    // Process transfer-related tweets
    let transferCount = 0;
    for (const tweet of tweets.data) {
      const text = tweet.text.toLowerCase();
      const isTransfer =
        text.includes("transfer") ||
        text.includes("signing") ||
        text.includes("agreement") ||
        text.includes("medical") ||
        text.includes("here we go") ||
        text.includes("deal") ||
        text.includes("confirmed") ||
        text.includes("breaking");

      if (isTransfer) {
        console.log("🔥 REAL TRANSFER TWEET:");
        console.log("   📅", new Date(tweet.created_at).toLocaleString());
        console.log("   📝", tweet.text.substring(0, 150) + "...");
        console.log("   💬", tweet.public_metrics.reply_count, "replies");
        console.log("   🔄", tweet.public_metrics.retweet_count, "retweets");
        console.log("   ❤️", tweet.public_metrics.like_count, "likes");

        // Check if we already have this tweet
        const existing = await prisma.feedItem.findFirst({
          where: { externalId: tweet.id },
        });

        if (!existing) {
          // Create REAL feed item
          await prisma.feedItem.create({
            data: {
              type: "ITK",
              content: tweet.text,
              sourceId: fabrizioSource.id,
              priority:
                text.includes("here we go") || text.includes("confirmed")
                  ? "BREAKING"
                  : "HIGH",
              relevanceScore: 0.95,
              publishedAt: new Date(tweet.created_at),
              isProcessed: true,
              isPublished: true,
              originalShares: tweet.public_metrics.retweet_count,
              originalLikes: tweet.public_metrics.like_count,
              originalReplies: tweet.public_metrics.reply_count,
              externalId: tweet.id,
              externalUrl: `https://x.com/FabrizioRomano/status/${tweet.id}`,
              transferType: text.includes("here we go")
                ? "CONFIRMED"
                : text.includes("medical")
                  ? "MEDICAL"
                  : text.includes("agreement")
                    ? "PERSONAL_TERMS"
                    : "RUMOUR",
            },
          });
          transferCount++;
          console.log("   ✅ Saved to database");
        } else {
          console.log("   ⏭️  Already exists in database");
        }
        console.log("");
      }
    }

    console.log(
      `🎉 SUCCESS: Processed ${transferCount} NEW real transfer tweets from Fabrizio Romano`,
    );

    // Show total feed items
    const totalItems = await prisma.feedItem.count();
    console.log(`📊 Total feed items in database: ${totalItems}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

pullRealFabrizioData();
