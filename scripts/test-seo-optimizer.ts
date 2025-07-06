import { PrismaClient } from "@prisma/client";
import { analyzeBriefingContent, generateOptimizedHeadline } from "../src/lib/seoOptimizer";

const prisma = new PrismaClient();

async function main() {
  try {
    // Get the latest briefing
    const briefing = await prisma.briefing.findFirst({
      orderBy: { publishedAt: "desc" },
      include: {
        stories: {
          include: {
            story: {
              include: {
                tweet: {
                  include: {
                    source: true,
                  },
                },
              },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!briefing) {
      console.log("No briefings found");
      return;
    }

    console.log("\n📰 Current Briefing:");
    console.log("Title:", briefing.title);
    console.log("Stories:", briefing.stories.length);

    // Analyze the content
    const analysis = analyzeBriefingContent(briefing.stories);
    
    console.log("\n📊 Content Analysis:");
    console.log("Main Story:", analysis.mainStory);
    console.log("Key Players:", analysis.keyPlayers);
    console.log("Key Clubs:", analysis.keyClubs);
    console.log("Transfer Types:", analysis.transferTypes);

    // Generate optimized headline
    const optimizedHeadline = generateOptimizedHeadline(analysis, new Date(briefing.publishedAt!));
    
    console.log("\n✨ Optimized Headline:");
    console.log(optimizedHeadline);

    // Update the briefing with the optimized title
    console.log("\n🔄 Updating briefing title...");
    await prisma.briefing.update({
      where: { id: briefing.id },
      data: { title: optimizedHeadline },
    });

    console.log("✅ Briefing updated successfully!");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();