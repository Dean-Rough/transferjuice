#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Set test mode
  process.env.TEST_MODE = "true";
  
  const hoursBack = process.env.TEST_MODE === 'true' ? 24 : 2;
  const sinceTime = new Date();
  sinceTime.setHours(sinceTime.getHours() - hoursBack);

  console.log(`Looking for tweets since: ${sinceTime}`);
  console.log(`Current time: ${new Date()}`);
  console.log(`Hours back: ${hoursBack}`);

  const recentTweets = await prisma.tweet.findMany({
    where: {
      scrapedAt: { gte: sinceTime },
      source: {
        handle: {
          not: "TransferJuice",
        },
      },
    },
    include: {
      source: true,
    },
    orderBy: {
      scrapedAt: "desc",
    },
  });

  console.log(`\nFound ${recentTweets.length} tweets`);

  // Also check all tweets without time filter
  const allTweets = await prisma.tweet.findMany({
    where: {
      source: {
        handle: {
          not: "TransferJuice",
        },
      },
    },
    include: {
      source: true,
    },
    orderBy: {
      scrapedAt: "desc",
    },
    take: 5,
  });

  console.log(`\nFound ${allTweets.length} tweets total (showing latest 5):`);
  allTweets.forEach((tweet) => {
    console.log(`- ${tweet.source.name}: ${tweet.content.substring(0, 80)}...`);
    console.log(`  Scraped: ${tweet.scrapedAt}`);
  });

  await prisma.$disconnect();
}

main();