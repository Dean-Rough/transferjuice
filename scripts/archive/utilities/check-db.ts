import { prisma } from "../src/lib/prisma";

async function checkData() {
  try {
    // Count feed items
    const feedItemCount = await prisma.feedItem.count();
    console.log("Total feed items:", feedItemCount);

    // Count recent feed items (last 24 hours)
    const recentCount = await prisma.feedItem.count({
      where: {
        publishedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });
    console.log("Feed items (last 24h):", recentCount);

    // Count feed items from last hour
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const lastHourCount = await prisma.feedItem.count({
      where: {
        publishedAt: {
          gte: lastHour,
        },
        isProcessed: true,
        isArchived: false,
        type: {
          in: ["ITK", "BREAKING"],
        },
      },
    });
    console.log("Feed items (last hour, processed):", lastHourCount);

    // Check recent feed items
    const recentItems = await prisma.feedItem.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        source: true,
      },
    });

    console.log("\nMost recent feed items (by creation time):");
    recentItems.forEach((item) => {
      console.log(
        `- [${item.source?.name || item.sourceId}] ${item.content.substring(0, 80)}...`,
      );
      console.log(
        `  Created: ${item.createdAt}, Published: ${item.publishedAt}`,
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
