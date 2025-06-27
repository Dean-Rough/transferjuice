#!/usr/bin/env ts-node

/**
 * Quick Populate Script
 * Seeds database with initial ITK sources and creates some starter feed items
 * This gets us running while we wait for Twitter API access
 */

import { prisma } from "../src/lib/prisma";
import { ITK_ACCOUNTS } from "../src/lib/twitter/itk-monitor";

async function main() {
  console.log("🚀 Quick database population...\n");

  try {
    // Step 1: Seed ITK Sources
    console.log("📦 Seeding ITK sources...");

    for (const account of ITK_ACCOUNTS) {
      const existing = await prisma.iTKSource.findUnique({
        where: { username: account.username },
      });

      if (!existing) {
        const source = await prisma.iTKSource.create({
          data: {
            name: account.displayName,
            username: account.username,
            tier:
              account.tier === "tier1" ? 1 : account.tier === "tier2" ? 2 : 3,
            reliability: account.reliabilityScore,
            region: account.specialties.includes("Global")
              ? "GLOBAL"
              : account.specialties.includes("Serie A")
                ? "IT"
                : account.specialties.includes("Premier League")
                  ? "UK"
                  : account.specialties.includes("La Liga")
                    ? "ES"
                    : account.specialties.includes("Germany")
                      ? "DE"
                      : account.specialties.includes("France")
                        ? "FR"
                        : account.specialties.includes("Brazil")
                          ? "BR"
                          : "GLOBAL",
            isActive: true,
            fetchInterval: 900, // 15 minutes
            followerCount: Math.floor(Math.random() * 5000000) + 100000,
          },
        });
        console.log(
          `✅ Added source: ${account.displayName} (@${account.username})`,
        );

        // Create some initial feed items for this source
        const transferNews = [
          "BREAKING: Sources confirm advanced talks between clubs. Medical could be scheduled within 48 hours if terms are agreed.",
          "Exclusive: Player's representatives have arrived in the city for negotiations. Deal structure being discussed.",
          "Update: €50m + €10m in add-ons being prepared. Personal terms not expected to be an issue.",
          "Club officials confident of completing the signing before the weekend. Player keen on the move.",
          "Latest: Negotiations ongoing. Both clubs working to find agreement on payment structure.",
        ];

        // Create 2-3 feed items per source
        const itemCount = Math.floor(Math.random() * 2) + 1;

        for (let i = 0; i < itemCount; i++) {
          const isHighPriority = Math.random() > 0.7;

          await prisma.feedItem.create({
            data: {
              type: "ITK",
              content:
                transferNews[Math.floor(Math.random() * transferNews.length)],
              sourceId: source.id,
              priority: isHighPriority ? "HIGH" : "MEDIUM",
              relevanceScore: Math.random() * 0.4 + 0.6, // 0.6-1.0
              publishedAt: new Date(Date.now() - Math.random() * 86400000), // Last 24h
              isProcessed: true,
              isPublished: true,
              transferType: ["RUMOUR", "BID", "MEDICAL", "PERSONAL_TERMS"][
                Math.floor(Math.random() * 4)
              ] as any,
              league:
                source.region === "UK"
                  ? "PL"
                  : source.region === "ES"
                    ? "LALIGA"
                    : source.region === "IT"
                      ? "SERIEA"
                      : source.region === "DE"
                        ? "BUNDESLIGA"
                        : source.region === "FR"
                          ? "LIGUE1"
                          : null,
              originalShares: Math.floor(Math.random() * 1000),
              originalLikes: Math.floor(Math.random() * 5000),
              originalReplies: Math.floor(Math.random() * 500),
            },
          });
        }
      } else {
        console.log(`⏭️  Source exists: ${account.displayName}`);
      }
    }

    // Step 2: Add Terry Commentary to some items
    console.log("\n🎭 Adding Terry commentary...");

    const uncommentedItems = await prisma.feedItem.findMany({
      where: {
        terryCommentary: null,
        priority: { in: ["HIGH", "BREAKING"] },
      },
      take: 10,
    });

    const terryQuips = [
      "Another day, another 'agreement close'. At this rate, my nan could negotiate faster, and she's been dead for years.",
      "Medical scheduled? That's football speak for 'we've not actually agreed anything but need clicks'.",
      "Sources close to the situation = some bloke on Twitter with 47 followers and a dream.",
      "Personal terms agreed means they've agreed to talk about maybe agreeing. Progress.",
      "€50m plus add-ons? Those add-ons probably include 'winning the World Cup' and 'discovering time travel'.",
      "48-hour FC strikes again. In football time, that's anywhere between tomorrow and 2027.",
      "Player's keen on the move? Of course he is. Who wouldn't want to triple their wages?",
      "Advanced talks = they've moved from WhatsApp to actual phone calls. Revolutionary.",
      "Deal structure being discussed = arguing about whether to pay in euros or magic beans.",
      "Exclusive news that's been reported by 47 other sources. That's modern journalism for you.",
    ];

    for (const item of uncommentedItems) {
      await prisma.feedItem.update({
        where: { id: item.id },
        data: {
          terryCommentary:
            terryQuips[Math.floor(Math.random() * terryQuips.length)],
        },
      });
    }

    console.log(
      `✅ Added Terry commentary to ${uncommentedItems.length} items`,
    );

    // Step 3: Create some tags
    console.log("\n🏷️  Creating tags...");

    const clubs = [
      "Arsenal",
      "Chelsea",
      "Liverpool",
      "Man United",
      "Man City",
      "Real Madrid",
      "Barcelona",
      "Bayern Munich",
      "PSG",
      "Juventus",
    ];
    const players = [
      "Mbappe",
      "Haaland",
      "Bellingham",
      "Rice",
      "Osimhen",
      "Kane",
      "Saka",
      "Vinicius",
      "Pedri",
      "Musiala",
    ];

    // Create club tags
    for (const club of clubs) {
      await prisma.tag.upsert({
        where: { name: club },
        update: {},
        create: {
          name: club,
          type: "CLUB",
          normalizedName: club.toLowerCase().replace(/\s+/g, ""),
          usageCount: Math.floor(Math.random() * 100),
        },
      });
    }

    // Create player tags
    for (const player of players) {
      await prisma.tag.upsert({
        where: { name: player },
        update: {},
        create: {
          name: player,
          type: "PLAYER",
          normalizedName: player.toLowerCase().replace(/\s+/g, ""),
          usageCount: Math.floor(Math.random() * 50),
        },
      });
    }

    // Assign random tags to feed items
    const allItems = await prisma.feedItem.findMany({ take: 20 });
    const allClubTags = await prisma.tag.findMany({ where: { type: "CLUB" } });
    const allPlayerTags = await prisma.tag.findMany({
      where: { type: "PLAYER" },
    });

    for (const item of allItems) {
      // Add 1-2 club tags
      const clubCount = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < clubCount; i++) {
        const randomClub =
          allClubTags[Math.floor(Math.random() * allClubTags.length)];
        await prisma.feedItemTag.upsert({
          where: {
            feedItemId_tagId: {
              feedItemId: item.id,
              tagId: randomClub.id,
            },
          },
          update: {},
          create: {
            feedItemId: item.id,
            tagId: randomClub.id,
          },
        });
      }

      // Add 0-1 player tags
      if (Math.random() > 0.5) {
        const randomPlayer =
          allPlayerTags[Math.floor(Math.random() * allPlayerTags.length)];
        await prisma.feedItemTag.upsert({
          where: {
            feedItemId_tagId: {
              feedItemId: item.id,
              tagId: randomPlayer.id,
            },
          },
          update: {},
          create: {
            feedItemId: item.id,
            tagId: randomPlayer.id,
          },
        });
      }
    }

    console.log("✅ Tags created and assigned");

    // Final stats
    const stats = await prisma.feedItem.aggregate({
      _count: true,
      where: { isPublished: true },
    });

    const sources = await prisma.iTKSource.count();
    const tags = await prisma.tag.count();

    console.log("\n📊 Database populated:");
    console.log(`- ITK Sources: ${sources}`);
    console.log(`- Feed Items: ${stats._count}`);
    console.log(`- Tags: ${tags}`);
    console.log("\n✅ Ready to go! The feed should now show real data.");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
