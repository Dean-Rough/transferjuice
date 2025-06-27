#!/usr/bin/env tsx

/**
 * Simple Twitter pull without rate limit checks
 */

import dotenv from "dotenv";
import path from "path";
import { prisma } from "../src/lib/prisma";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function pullTwitterData() {
  console.log("🚀 Attempting to pull Twitter data...");

  const bearerToken = decodeURIComponent(process.env.TWITTER_BEARER_TOKEN!);

  try {
    // Direct API call to get Fabrizio's ID
    console.log("📡 Getting Fabrizio Romano info...");
    const userResponse = await fetch(
      "https://api.twitter.com/2/users/by/username/FabrizioRomano?user.fields=public_metrics",
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      },
    );

    console.log("User lookup status:", userResponse.status);

    if (userResponse.status === 429) {
      const remaining = userResponse.headers.get("x-rate-limit-remaining");
      const reset = userResponse.headers.get("x-rate-limit-reset");
      console.log(
        `Rate limited. Remaining: ${remaining}, Reset: ${new Date(parseInt(reset!) * 1000).toLocaleString()}`,
      );
      return;
    }

    if (!userResponse.ok) {
      console.error("User lookup failed:", await userResponse.text());
      return;
    }

    const userData = await userResponse.json();
    console.log("✅ Found user:", userData.data);

    // Now get tweets
    console.log("\n📱 Getting recent tweets...");
    const tweetsResponse = await fetch(
      `https://api.twitter.com/2/users/${userData.data.id}/tweets?max_results=10&tweet.fields=created_at,public_metrics,referenced_tweets&expansions=author_id`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      },
    );

    console.log("Tweets lookup status:", tweetsResponse.status);

    if (!tweetsResponse.ok) {
      console.error("Tweets lookup failed:", await tweetsResponse.text());
      return;
    }

    const tweetsData = await tweetsResponse.json();
    console.log(`\n✅ Retrieved ${tweetsData.data?.length || 0} tweets`);

    // Find Fabrizio source in database
    const source = await prisma.iTKSource.findUnique({
      where: { username: "FabrizioRomano" },
    });

    if (!source) {
      console.log("Creating Fabrizio source in database...");
      const newSource = await prisma.iTKSource.create({
        data: {
          username: "FabrizioRomano",
          name: "Fabrizio Romano",
          tier: 1,
          reliability: 0.95,
          region: "GLOBAL",
          description: "Here we go! specialist",
          isActive: true,
        },
      });
      console.log("✅ Created source:", newSource.name);
    }

    // Process tweets
    let saved = 0;
    for (const tweet of tweetsData.data || []) {
      const isTransfer =
        /transfer|signing|medical|agreement|here we go|deal|confirmed|breaking/i.test(
          tweet.text,
        );

      if (isTransfer) {
        console.log(`\n🔥 Transfer tweet: ${tweet.text.substring(0, 100)}...`);

        const existing = await prisma.feedItem.findFirst({
          where: { externalId: tweet.id },
        });

        if (!existing && source) {
          await prisma.feedItem.create({
            data: {
              type: "ITK",
              content: tweet.text,
              sourceId: source.id,
              priority: tweet.text.includes("Here we go") ? "BREAKING" : "HIGH",
              relevanceScore: 0.9,
              publishedAt: new Date(tweet.created_at),
              isProcessed: true,
              isPublished: true,
              originalShares: tweet.public_metrics?.retweet_count || 0,
              originalLikes: tweet.public_metrics?.like_count || 0,
              originalReplies: tweet.public_metrics?.reply_count || 0,
              externalId: tweet.id,
              externalUrl: `https://x.com/FabrizioRomano/status/${tweet.id}`,
              transferType: tweet.text.includes("Here we go")
                ? "CONFIRMED"
                : "RUMOUR",
            },
          });
          saved++;
          console.log("✅ Saved!");
        }
      }
    }

    console.log(`\n🎉 Saved ${saved} new transfer tweets`);

    const total = await prisma.feedItem.count();
    console.log(`📊 Total feed items: ${total}`);
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

pullTwitterData();
