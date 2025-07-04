#!/usr/bin/env tsx

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Set DATABASE_URL for Prisma
process.env.DATABASE_URL = process.env.DATABASE_URL || "";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function viewBriefings() {
  try {
    const briefings = await prisma.briefing.findMany({
      include: {
        stories: {
          include: {
            story: {
              include: {
                tweet: {
                  include: {
                    source: true,
                  },
                },
              },
            },
          },
          orderBy: { position: "asc" },
        },
      },
      orderBy: { publishedAt: "desc" },
      take: 5,
    });

    console.log(`\n📚 Found ${briefings.length} briefings\n`);

    for (const briefing of briefings) {
      console.log("=".repeat(80));
      console.log(`📰 ${briefing.title}`);
      console.log(`📅 ${briefing.publishedAt.toLocaleString()}`);
      console.log(`📊 ${briefing.stories.length} stories`);
      console.log("-".repeat(80));

      briefing.stories.slice(0, 3).forEach(({ story }, idx) => {
        console.log(
          `\n${idx + 1}. ${story.tweet.source.name} (${story.tweet.source.handle})`,
        );
        console.log(`   Tweet: ${story.tweet.content.substring(0, 100)}...`);
        console.log(`   Terry: "${story.terryComment}"`);
      });

      if (briefing.stories.length > 3) {
        console.log(`\n   ... and ${briefing.stories.length - 3} more stories`);
      }
      console.log("\n");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

viewBriefings();
