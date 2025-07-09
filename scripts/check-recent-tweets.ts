#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sixHoursAgo = new Date();
  sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);

  const recentTweets = await prisma.tweet.findMany({
    where: {
      scrapedAt: { gte: sixHoursAgo },
    },
    include: {
      source: true,
    },
    orderBy: {
      scrapedAt: "desc",
    },
    take: 20,
  });

  console.log(`Found ${recentTweets.length} tweets from last 6 hours:\n`);

  recentTweets.forEach((tweet, idx) => {
    console.log(`Tweet ${idx + 1}:`);
    console.log(`  ID: ${tweet.id}`);
    console.log(`  Source: ${tweet.source.name} (@${tweet.source.handle})`);
    console.log(`  Content: ${tweet.content.substring(0, 200)}...`);
    console.log(`  Scraped: ${tweet.scrapedAt}`);
    console.log("");
  });

  await prisma.$disconnect();
}

main();