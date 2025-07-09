#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning up old stories without article content...");
  
  // First get stories to delete
  const storiesToDelete = await prisma.story.findMany({
    where: {
      OR: [
        { headline: null },
        { articleContent: null },
      ],
    },
    select: { id: true },
  });
  
  const storyIds = storiesToDelete.map(s => s.id);
  
  // Delete briefing story relationships first
  await prisma.briefingStory.deleteMany({
    where: {
      storyId: { in: storyIds },
    },
  });
  
  // Now delete the stories
  const deleted = await prisma.story.deleteMany({
    where: {
      id: { in: storyIds },
    },
  });
  
  console.log(`Deleted ${deleted.count} old-style stories`);
  
  // Get remaining stories
  const remainingStories = await prisma.story.count();
  console.log(`${remainingStories} article-style stories remain`);
  
  await prisma.$disconnect();
}

main();