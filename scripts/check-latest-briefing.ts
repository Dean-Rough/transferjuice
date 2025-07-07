import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const latestBriefing = await prisma.briefing.findFirst({
      orderBy: { publishedAt: "desc" },
      include: {
        stories: {
          include: {
            story: true
          }
        }
      }
    });

    if (!latestBriefing) {
      console.log("No briefings found");
      return;
    }

    console.log("\n📰 Latest Briefing:");
    console.log("ID:", latestBriefing.id);
    console.log("Title:", latestBriefing.title);
    console.log("Published:", latestBriefing.publishedAt);
    
    // Get the cohesive story content
    if (latestBriefing.stories.length > 0) {
      const story = latestBriefing.stories[0].story;
      const metadata = story.metadata as any;
      
      if (metadata?.type === 'cohesive' && metadata.content) {
        console.log("\n📝 Content Preview (first 3000 chars):");
        console.log(metadata.content.substring(0, 3000));
        console.log("\n... [content truncated]");
        
        // Find section headers to see structure
        const headers = metadata.content.match(/<h3[^>]*>([^<]+)<\/h3>/g);
        console.log("\n📑 Section Headers:");
        headers?.forEach((h: string) => console.log("- " + h.replace(/<[^>]+>/g, '')));
        
        console.log("\n🔍 Metadata:");
        console.log("Key Players:", metadata.keyPlayers?.join(', ') || "None");
        console.log("Key Clubs:", metadata.keyClubs?.join(', ') || "None");
        console.log("Main Image:", metadata.mainImage ? "Yes" : "No");
        console.log("Player Images:", Object.keys(metadata.playerImages || {}).length);
        console.log("Sources:", metadata.sources?.join(', ') || "None");
      }
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();