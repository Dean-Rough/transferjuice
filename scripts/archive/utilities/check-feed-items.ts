#!/usr/bin/env tsx

import { prisma } from "../src/lib/prisma";

async function checkFeedItems() {
  try {
    const count = await prisma.feedItem.count();
    console.log(`Total feed items: ${count}`);

    if (count > 0) {
      const recent = await prisma.feedItem.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { source: true },
      });

      console.log("\nRecent feed items:");
      recent.forEach((item) => {
        console.log(`- ${item.content.substring(0, 100)}...`);
        console.log(`  Source: ${item.source?.name || "Unknown"}`);
        console.log(`  Created: ${item.createdAt.toLocaleString()}`);
        console.log("");
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFeedItems();
