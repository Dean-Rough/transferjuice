#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get ALL stories
  const allStories = await prisma.story.findMany({
    include: {
      tweet: {
        include: {
          source: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log(`Found ${allStories.length} total stories:\n`);

  allStories.forEach((story, idx) => {
    console.log(`Story ${idx + 1}:`);
    console.log(`  ID: ${story.id}`);
    console.log(`  Has headline: ${story.headline ? "Yes" : "No"}`);
    console.log(`  Has article: ${story.articleContent ? "Yes" : "No"}`);
    console.log(`  Tweet: ${story.tweet.content.substring(0, 60)}...`);
    console.log(`  Source: ${story.tweet.source.name}`);
    if (story.headline) {
      console.log(`  Headline: ${story.headline}`);
    }
    console.log("");
  });

  await prisma.$disconnect();
}

main();