#!/usr/bin/env tsx

/**
 * Pull Twitter data using Search API (better rate limits)
 */

import dotenv from "dotenv";
import path from "path";
import { prisma } from "../src/lib/prisma";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function pullViaSearch() {
  console.log("🔍 Using Twitter Search API (better rate limits)...");

  const bearerToken = decodeURIComponent(process.env.TWITTER_BEARER_TOKEN!);

  try {
    // Search for tweets from Fabrizio Romano
    console.log("🔎 Searching for Fabrizio Romano tweets...");

    const searchQuery = encodeURIComponent(
      'from:FabrizioRomano (transfer OR signing OR medical OR "here we go" OR deal OR agreement) -is:retweet',
    );

    const searchResponse = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?query=${searchQuery}&max_results=10&tweet.fields=created_at,public_metrics,author_id&expansions=author_id&user.fields=name,username`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      },
    );

    console.log("Search API status:", searchResponse.status);
    console.log(
      "Rate limit remaining:",
      searchResponse.headers.get("x-rate-limit-remaining"),
    );
    console.log(
      "Rate limit:",
      searchResponse.headers.get("x-rate-limit-limit"),
    );

    if (!searchResponse.ok) {
      console.error("Search failed:", await searchResponse.text());
      return;
    }

    const searchData = await searchResponse.json();
    console.log(`\n✅ Found ${searchData.data?.length || 0} tweets`);

    // Get or create Fabrizio source
    let source = await prisma.iTKSource.findUnique({
      where: { username: "FabrizioRomano" },
    });

    if (!source) {
      console.log("Creating Fabrizio source...");
      source = await prisma.iTKSource.create({
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
    }

    // Process tweets
    let saved = 0;
    for (const tweet of searchData.data || []) {
      console.log(`\n📝 Tweet: ${tweet.text.substring(0, 150)}...`);
      console.log(`   📅 ${new Date(tweet.created_at).toLocaleString()}`);
      console.log(`   ❤️ ${tweet.public_metrics?.like_count || 0} likes`);

      const existing = await prisma.feedItem.findFirst({
        where: { twitterId: tweet.id },
      });

      if (!existing) {
        const isHereWeGo = /here we go/i.test(tweet.text);
        const isConfirmed = /confirmed|done deal|completed/i.test(tweet.text);

        await prisma.feedItem.create({
          data: {
            type: "ITK",
            content: tweet.text,
            sourceId: source.id,
            priority: isHereWeGo || isConfirmed ? "BREAKING" : "HIGH",
            relevanceScore: 0.95,
            publishedAt: new Date(tweet.created_at),
            isProcessed: true,
            isPublished: true,
            originalShares: tweet.public_metrics?.retweet_count || 0,
            originalLikes: tweet.public_metrics?.like_count || 0,
            originalReplies: tweet.public_metrics?.reply_count || 0,
            twitterId: tweet.id,
            originalUrl: `https://x.com/FabrizioRomano/status/${tweet.id}`,
            transferType: isHereWeGo
              ? "CONFIRMED"
              : isConfirmed
                ? "CONFIRMED"
                : tweet.text.includes("medical")
                  ? "MEDICAL"
                  : tweet.text.includes("agreement")
                    ? "PERSONAL_TERMS"
                    : "RUMOUR",
          },
        });
        saved++;
        console.log("   ✅ Saved!");
      } else {
        console.log("   ⏭️  Already exists");
      }
    }

    console.log(`\n🎉 SUCCESS: Saved ${saved} new tweets`);

    const total = await prisma.feedItem.count();
    console.log(`📊 Total feed items in database: ${total}`);

    // Check other sources too
    console.log("\n🔍 Searching other ITK sources...");
    const otherSources = ["David_Ornstein", "DiMarzio", "MatteMoretto"];

    for (const username of otherSources) {
      console.log(`\nChecking @${username}...`);
      // Would search for each source if we had rate limit available
    }
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

pullViaSearch();
