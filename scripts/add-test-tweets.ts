#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Adding more test tweets for variety testing...");

  // Get Fabrizio source
  const source = await prisma.source.findUnique({
    where: { handle: "@FabrizioRomano" },
  });

  if (!source) {
    console.error("Source not found");
    return;
  }

  // Add some test tweets with different transfer scenarios
  const testTweets = [
    {
      content: "🚨🔴 EXCLUSIVE: Manchester United are preparing a £75m bid for Jude Bellingham's younger brother Jobe from Sunderland. Initial contact made with player's representatives.",
      tweetId: `test_${Date.now()}_1`,
    },
    {
      content: "✅🏴󠁧󠁢󠁥󠁮󠁧󠁿 Newcastle United have completed the signing of 16-year-old wonderkid Miguel Almirón Jr from Paraguayan club Olimpia for £2.5m. Five year contract signed.",
      tweetId: `test_${Date.now()}_2`,
    },
    {
      content: "🚨💰 PSG ready to trigger €180m release clause for Erling Haaland. Negotiations ongoing with Manchester City over payment structure. Mbappé replacement identified.",
      tweetId: `test_${Date.now()}_3`,
    },
  ];

  for (const tweet of testTweets) {
    await prisma.tweet.create({
      data: {
        ...tweet,
        sourceId: source.id,
        url: `https://twitter.com/${source.handle}/status/${tweet.tweetId}`,
        scrapedAt: new Date(),
      },
    });
    console.log(`Added tweet: ${tweet.content.substring(0, 50)}...`);
  }

  console.log("✅ Added test tweets");
  await prisma.$disconnect();
}

main();