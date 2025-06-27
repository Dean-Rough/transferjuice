#!/usr/bin/env tsx

/**
 * Generate Production Briefing
 * Creates and publishes a real briefing for the current hour
 */

import { generateBriefing } from "../src/lib/briefings/generator";
import { validateEnvironment } from "../src/lib/validations/environment";

async function generateProductionBriefing() {
  console.log("🚀 Generating Production Briefing");
  console.log("================================\n");

  try {
    // Validate environment
    console.log("🔧 Validating environment...");
    validateEnvironment();

    // Generate a briefing for current time
    const now = new Date();
    console.log(`⏰ Generating briefing for ${now.toISOString()}`);

    const briefing = await generateBriefing({
      timestamp: now,
      testMode: false, // This ensures it gets published
      forceRegenerate: false, // Don't regenerate if one exists for this hour
    });

    console.log("\n✅ Briefing generated and published successfully!");
    console.log(`📝 Briefing ID: ${briefing.id}`);
    console.log(`📖 Title: ${(briefing.title as any).main}`);
    console.log(`🔤 Word Count: ${briefing.wordCount}`);
    console.log(`⏱️ Read Time: ${briefing.readTime} minutes`);
    console.log(`🎭 Terry Score: ${briefing.terryScore}/100`);
    console.log(`📅 Published: ${briefing.publishedAt || 'Publishing...'}`);

    console.log(`\n🌐 View briefing at: http://localhost:4433/`);
    console.log(`📧 Direct link: http://localhost:4433/briefings/${briefing.slug}`);

  } catch (error) {
    console.error("❌ Briefing generation failed:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    process.exit(1);
  }
}

// Run the generation
generateProductionBriefing();