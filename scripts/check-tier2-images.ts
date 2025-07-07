import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkTier2Images() {
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

    if (!latestBriefing?.stories[0]) {
      console.log("No briefing found");
      return;
    }

    const story = latestBriefing.stories[0].story;
    const metadata = story.metadata as any;
    
    if (metadata?.type === 'cohesive' && metadata.content) {
      // Look for tier 2 image divs - need to search for the full structure
      const imageBlockPattern = /<div class="flex gap-4 items-start[^"]*">([\s\S]*?)<\/div>/g;
      const matches = [...metadata.content.matchAll(imageBlockPattern)];
      
      console.log("📸 Inline Images Found:");
      console.log(`Total inline image blocks: ${matches.length}`);
      
      if (matches.length > 0) {
        matches.forEach((match: RegExpMatchArray, index: number) => {
          const fullBlock = match[0];
          const playerMatch = fullBlock.match(/alt="([^"]+)"/);
          const widthMatch = fullBlock.match(/width:\s*(\d+)px/);
          const hasImage = fullBlock.includes('<img');
          
          console.log(`\n${index + 1}. Player: ${playerMatch?.[1] || 'Unknown'}`);
          console.log(`   Width: ${widthMatch?.[1] || 'Unknown'}px`);
          console.log(`   Has image tag: ${hasImage}`);
        });
      }
      
      // Also count total images
      const totalImages = (metadata.content.match(/<img/g) || []).length;
      console.log(`\nTotal <img> tags in content: ${totalImages}`);
      
      // Show player images metadata
      console.log("\n📋 Player Images in Metadata:");
      const playerImages = metadata.playerImages || {};
      Object.entries(playerImages).forEach(([player, url]) => {
        console.log(`- ${player}: ${url ? 'Yes' : 'No'}`);
      });
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTier2Images();