#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get tweets that have stories
  const tweetsWithStories = await prisma.tweet.findMany({
    where: {
      source: {
        handle: {
          not: "TransferJuice",
        },
      },
      stories: {
        some: {},
      },
    },
    include: {
      source: true,
      stories: true,
    },
  });

  console.log(`Tweets WITH stories (${tweetsWithStories.length}):`);
  tweetsWithStories.forEach((tweet) => {
    console.log(`- ${tweet.source.name}: ${tweet.content.substring(0, 60)}...`);
  });

  // Get tweets without stories
  const tweetsWithoutStories = await prisma.tweet.findMany({
    where: {
      source: {
        handle: {
          not: "TransferJuice",
        },
      },
      stories: {
        none: {},
      },
    },
    include: {
      source: true,
    },
    orderBy: {
      scrapedAt: "desc",
    },
  });

  console.log(`\nTweets WITHOUT stories (${tweetsWithoutStories.length}):`);
  tweetsWithoutStories.forEach((tweet, idx) => {
    console.log(`\nTweet ${idx + 1}:`);
    console.log(`  Source: ${tweet.source.name}`);
    console.log(`  Content: ${tweet.content}`);
    console.log(`  Scraped: ${tweet.scrapedAt}`);
  });

  await prisma.$disconnect();
}

main();