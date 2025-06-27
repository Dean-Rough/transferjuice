#!/usr/bin/env tsx

/**
 * Test briefing generation with mock data
 * This script runs in test mode with mock environment variables
 */

// Load environment variables from .env.local FIRST
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Override to test mode
process.env.NODE_ENV = "test";
process.env.EMAIL_PROVIDER = "mock";
process.env.MOCK_EXTERNAL_APIS = "true";

async function testBriefingGeneration() {
  // Dynamic imports AFTER env vars are loaded
  const { generateBriefing } = await import("../src/lib/briefings/generator");
  const { prisma } = await import("../src/lib/prisma");
  
  try {
    console.log("🚀 Testing briefing generation in test mode...");
    console.log("📌 Using mock data and skipping external API calls");
    
    // Generate a test briefing for the current hour
    const timestamp = new Date();
    timestamp.setMinutes(0, 0, 0);
    
    console.log(`\n📅 Generating briefing for: ${timestamp.toISOString()}`);
    
    const briefing = await generateBriefing({
      timestamp,
      testMode: true, // Use mock data
      forceRegenerate: true, // Force generation even if one exists
    });
    
    console.log("\n✅ Briefing generated successfully!");
    console.log(`ID: ${briefing.id}`);
    console.log(`Slug: ${briefing.slug}`);
    console.log(`Title: ${(briefing.title as any).main}`);
    console.log(`Timeline items: ${(briefing.visualTimeline as any[]).length}`);
    console.log(`Sections: ${(briefing.content as any[]).length}`);
    console.log(`Terry Score: ${briefing.terryScore}`);
    
    // Check if media was saved
    const media = await prisma.briefingMedia.findMany({
      where: { briefingId: briefing.id }
    });
    
    console.log(`\n📸 Media items saved: ${media.length}`);
    
    if ((briefing.visualTimeline as any[]).length > 0) {
      console.log("\n📸 First timeline item:");
      const firstItem = (briefing.visualTimeline as any[])[0];
      console.log(`- Time: ${firstItem.time}`);
      console.log(`- Title: ${firstItem.title}`);
      console.log(`- Has polaroid: ${!!firstItem.polaroid}`);
    }
    
    console.log("\n🌐 View briefing at: http://localhost:4433/briefings/" + briefing.slug);
    
  } catch (error) {
    console.error("\n❌ Error:", error);
    if (error instanceof Error) {
      console.error("Stack:", error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testBriefingGeneration();