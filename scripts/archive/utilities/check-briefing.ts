import { prisma } from "../src/lib/prisma";

async function checkBriefing() {
  const briefing = await prisma.briefing.findFirst({
    where: {
      slug: "2025-06-22-18-quansah-s-leverkusen-leap-35m-dance-around-the-may",
    },
    include: {
      feedItems: {
        include: {
          feedItem: true,
        },
      },
    },
  });

  if (briefing) {
    console.log("Briefing:", briefing.title);
    console.log("\nSections:");
    const content = briefing.content as any[];
    content.forEach((section, idx) => {
      console.log(`\n=== Section ${idx + 1}: ${section.title} ===`);
      console.log("Type:", section.type);
      console.log(
        "Content preview:",
        section.content.substring(0, 300) + "...",
      );
    });

    console.log("\n\nFeed items used:", briefing.feedItems.length);
    const uniqueStories = new Set();
    briefing.feedItems.forEach((item) => {
      const preview = item.feedItem.content.substring(0, 100);
      uniqueStories.add(preview);
      console.log(`- ${preview}...`);
    });

    console.log("\nUnique stories:", uniqueStories.size);

    // Check for images
    console.log(
      "\nVisual Timeline:",
      briefing.visualTimeline ? "Present" : "Missing",
    );
    if (briefing.visualTimeline) {
      const timeline = briefing.visualTimeline as any;
      console.log("Timeline items:", timeline.items?.length || 0);
    }
  } else {
    console.log("Briefing not found");
  }

  await prisma.$disconnect();
}

checkBriefing();
