#!/usr/bin/env tsx
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkStories() {
  console.log("🔍 Checking stories in database...\n");

  // Get all stories with their source tweets
  const stories = await prisma.story.findMany({
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
    take: 10, // Just show latest 10
  });

  console.log(`Total stories in database: ${await prisma.story.count()}\n`);

  if (stories.length === 0) {
    console.log("No stories found in the database.");
  } else {
    stories.forEach((story, index) => {
      console.log(`📰 Story ${index + 1}:`);
      console.log(`   ID: ${story.id}`);
      console.log(`   Headline: ${story.headline}`);
      console.log(`   Source: ${story.tweet?.source?.name || 'Unknown'} (@${story.tweet?.source?.username || 'unknown'})`);
      console.log(`   Tweet: "${story.tweet?.text?.substring(0, 100) || 'No tweet text'}..."`);
      console.log(`   Created: ${story.createdAt.toLocaleString()}`);
      console.log(`   Updates: ${story.updateCount}`);
      console.log("");
    });
  }

  // Check for tweets without stories
  const tweetsWithoutStories = await prisma.tweet.count({
    where: {
      stories: {
        none: {},
      },
    },
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Total tweets: ${await prisma.tweet.count()}`);
  console.log(`   Tweets without stories: ${tweetsWithoutStories}`);
  console.log(`   Total stories: ${await prisma.story.count()}`);

  await prisma.$disconnect();
}

checkStories().catch(console.error);