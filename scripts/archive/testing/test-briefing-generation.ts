import { generateBriefing } from "@/lib/briefings/generator";
import { prisma } from "@/lib/prisma";

async function testBriefingGeneration() {
  try {
    console.log("🚀 Testing briefing generation with timeline fixes...");
    
    // Generate a test briefing for the current hour
    const timestamp = new Date();
    timestamp.setMinutes(0, 0, 0);
    
    console.log(`\n📅 Generating briefing for: ${timestamp.toISOString()}`);
    
    const briefing = await generateBriefing({
      timestamp,
      testMode: true, // Don't publish
      force: true, // Force generation even if one exists
    });
    
    console.log("\n✅ Briefing generated successfully!");
    console.log(`ID: ${briefing.id}`);
    console.log(`Slug: ${briefing.slug}`);
    console.log(`Timeline items: ${(briefing.visualTimeline as any[]).length}`);
    
    // Check if media was saved
    const media = await prisma.briefingMedia.findMany({
      where: { briefingId: briefing.id }
    });
    
    console.log(`Media items saved: ${media.length}`);
    
    if ((briefing.visualTimeline as any[]).length > 0) {
      console.log("\n📸 First timeline item:");
      console.log(JSON.stringify((briefing.visualTimeline as any[])[0], null, 2));
    }
    
    if (media.length > 0) {
      console.log("\n💾 First media item:");
      console.log(JSON.stringify(media[0], null, 2));
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testBriefingGeneration();