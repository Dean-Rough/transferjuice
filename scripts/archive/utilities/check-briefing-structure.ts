#!/usr/bin/env tsx

import { config } from "dotenv";
import { prisma } from "@/lib/prisma";

config();

async function checkBriefingStructure() {
  console.log("Checking briefing structure...\n");
  
  const briefings = await prisma.briefing.findMany({
    take: 2,
    orderBy: { createdAt: "desc" },
    include: {
      feedItems: true,
      tags: true,
      media: true,
    }
  });
  
  console.log(`Found ${briefings.length} briefings\n`);
  
  briefings.forEach((briefing, index) => {
    console.log(`\n=== Briefing ${index + 1} ===`);
    console.log("ID:", briefing.id);
    console.log("Slug:", briefing.slug);
    console.log("Title:", JSON.stringify(briefing.title, null, 2));
    console.log("Content type:", typeof briefing.content);
    console.log("Content structure:", JSON.stringify(briefing.content, null, 2).substring(0, 500) + "...");
    console.log("FeedItems count:", briefing.feedItems.length);
    console.log("Tags count:", briefing.tags.length);
    console.log("Media count:", briefing.media.length);
  });
  
  await prisma.$disconnect();
}

checkBriefingStructure().catch(console.error);