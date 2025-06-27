import { prisma } from "../src/lib/prisma";

async function debugTimeline() {
  try {
    // Get the latest briefing with all data
    const briefing = await prisma.briefing.findFirst({
      orderBy: { timestamp: "desc" },
      include: {
        feedItems: {
          include: {
            feedItem: {
              include: {
                source: true,
                tags: {
                  include: {
                    tag: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!briefing) {
      console.log("No briefings found");
      return;
    }

    console.log(`\nBriefing: ${briefing.slug}`);
    console.log(`Feed items: ${briefing.feedItems.length}`);

    // Check feed items for player names
    console.log("\nFeed items with potential players:");
    briefing.feedItems.forEach((item, idx) => {
      const feedItem = item.feedItem;
      console.log(`\n${idx + 1}. ${feedItem.content.substring(0, 100)}...`);

      // Look for player tags
      const playerTags = feedItem.tags.filter((t) => t.tag.type === "PLAYER");
      if (playerTags.length > 0) {
        console.log(
          `   Player tags: ${playerTags.map((t) => t.tag.name).join(", ")}`,
        );
      }

      // Simple player name extraction
      const matches = feedItem.content.match(/([A-Z][a-z]+ [A-Z][a-z]+)/g);
      if (matches) {
        console.log(`   Potential players: ${matches.slice(0, 3).join(", ")}`);
      }
    });

    // Check the actual visual timeline
    const timeline = briefing.visualTimeline as any;
    console.log("\n\nVisual Timeline:");
    console.log(JSON.stringify(timeline, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTimeline();
