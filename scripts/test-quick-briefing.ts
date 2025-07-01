/**
 * Quick Briefing Test
 * Tests briefing generation with just a few sources to verify everything works
 */

import { generateBriefing } from "../src/lib/briefings/generator";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const prisma = new PrismaClient();

async function testQuickBriefing() {
  console.log("🚀 Quick Briefing Test\n");

  try {
    // Temporarily disable most sources to speed up test
    console.log("1️⃣ Temporarily disabling most sources...");
    await prisma.iTKSource.updateMany({
      where: {
        username: {
          notIn: ["FabrizioRomano", "David_Ornstein", "Fechejes"] // Keep 2 good + 1 comedy
        }
      },
      data: { isActive: false }
    });

    const activeSources = await prisma.iTKSource.count({ where: { isActive: true } });
    console.log(`   Active sources: ${activeSources}`);

    // Generate test briefing
    console.log("\n2️⃣ Generating test briefing...");
    const briefing = await generateBriefing({
      timestamp: new Date(),
      testMode: true,
      forceRegenerate: true,
    });

    console.log("\n✅ Briefing generated successfully!");
    console.log(`   Title: ${briefing.title}`);
    console.log(`   Word count: ${briefing.wordCount}`);
    console.log(`   Terry score: ${briefing.terryScore}`);
    console.log(`   Sections: ${briefing.content.length}`);

    // Show a sample of the content
    if (briefing.content.length > 0) {
      console.log(`\n📝 First section preview:`);
      console.log(`   Type: ${briefing.content[0].type}`);
      console.log(`   Content: ${briefing.content[0].content.substring(0, 200)}...`);
    }

    // Re-enable all sources
    console.log("\n3️⃣ Re-enabling all sources...");
    await prisma.iTKSource.updateMany({
      data: { isActive: true }
    });

    console.log("\n🎉 Test complete! The system is working properly.");
    console.log("\n💡 The full briefing generation will:");
    console.log("   - Fetch tweets from all 23 sources");
    console.log("   - Take 5-10 minutes to complete");
    console.log("   - Generate Terry's witty commentary");
    console.log("   - Create a complete transfer briefing");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testQuickBriefing().catch(console.error);