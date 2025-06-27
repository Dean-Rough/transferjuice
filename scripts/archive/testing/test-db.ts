#!/usr/bin/env ts-node

import { prisma } from "../src/lib/prisma";

async function test() {
  try {
    const count = await prisma.feedItem.count();
    console.log("Total feed items in database:", count);

    const items = await prisma.feedItem.findMany({
      take: 5,
      orderBy: { publishedAt: "desc" },
      include: { source: true },
    });

    console.log("\nSample items:");
    items.forEach((item) => {
      console.log(
        `- ${item.content.substring(0, 50)}... by ${item.source.name}`,
      );
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error("Database error:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

test();
