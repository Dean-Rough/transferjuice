import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const latestBriefing = await prisma.briefing.findFirst({
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
          take: 3, // Just show first 3 stories
        },
      },
    });

    if (!latestBriefing) {
      console.log("No briefings found");
      return;
    }

    console.log("\n📰 Latest Briefing:");
    console.log("ID:", latestBriefing.id);
    console.log("Title:", latestBriefing.title);
    console.log("Published:", latestBriefing.publishedAt);
    console.log("Total Stories:", latestBriefing.stories.length);

    console.log("\n📝 First 3 Stories:");
    latestBriefing.stories.forEach((item, index) => {
      const story = item.story;
      console.log(`\n${index + 1}. Story ID: ${story.id}`);
      
      if (story.metadata) {
        const metadata = story.metadata as any;
        console.log("   Headline:", metadata.headline || "No headline");
        console.log("   Has enhanced content:", !!metadata.contextParagraph);
      } else {
        console.log("   No enhanced metadata");
      }
      
      console.log("   Source:", story.tweet.source.name);
      console.log("   Terry comment:", story.terryComment.substring(0, 100) + "...");
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();