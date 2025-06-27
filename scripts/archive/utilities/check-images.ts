import { prisma } from "../src/lib/prisma";

async function checkImages() {
  try {
    // Get the latest briefing with visual timeline
    const briefing = await prisma.briefing.findFirst({
      orderBy: { timestamp: "desc" },
      select: {
        slug: true,
        title: true,
        visualTimeline: true,
        content: true,
      },
    });

    if (!briefing) {
      console.log("No briefings found");
      return;
    }

    console.log(`\nChecking briefing: ${briefing.slug}`);
    console.log(`Title: ${(briefing.title as any).main}`);

    // Check visual timeline
    const timeline = briefing.visualTimeline as any;
    if (timeline?.items) {
      console.log(`\nVisual timeline items: ${timeline.items.length}`);
      timeline.items.forEach((item: any, idx: number) => {
        if (item.polaroid) {
          console.log(`\nPolaroid ${idx + 1}:`);
          console.log(`  Player: ${item.polaroid.playerName}`);
          console.log(`  Club: ${item.polaroid.clubName || "N/A"}`);
          console.log(`  Image URL: ${item.polaroid.imageUrl || "No URL"}`);
        }
      });
    } else {
      console.log("\nNo visual timeline found");
    }

    // Check players table
    const players = await prisma.player.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: {
        name: true,
        imageUrl: true,
        polaroidUrl: true,
        polaroidUpdatedAt: true,
      },
    });

    console.log("\n\nRecent players in database:");
    players.forEach((player) => {
      console.log(`\n${player.name}:`);
      console.log(`  Image: ${player.imageUrl || "None"}`);
      console.log(`  Polaroid: ${player.polaroidUrl || "None"}`);
      console.log(`  Updated: ${player.polaroidUpdatedAt || "Never"}`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImages();
