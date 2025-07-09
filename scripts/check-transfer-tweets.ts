#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get tweets from ITK sources (not editorial)
  const transferTweets = await prisma.tweet.findMany({
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
    take: 10,
  });

  console.log(`Found ${transferTweets.length} transfer tweets:\n`);

  transferTweets.forEach((tweet, idx) => {
    console.log(`Tweet ${idx + 1}:`);
    console.log(`  ID: ${tweet.id}`);
    console.log(`  Source: ${tweet.source.name} (@${tweet.source.handle})`);
    console.log(`  Content: ${tweet.content}`);
    console.log(`  Scraped: ${tweet.scrapedAt}`);
    console.log("");
  });

  await prisma.$disconnect();
}

main();