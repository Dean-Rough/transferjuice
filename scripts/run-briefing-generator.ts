#!/usr/bin/env tsx
/**
 * Run the new modular briefing generator
 */

import { config } from "dotenv";
import { generateBriefing } from "../src/briefing-generator/orchestrator";

// Load environment variables
config({ path: ".env.local" });

async function run() {
  const args = process.argv.slice(2);
  const testMode = args.includes("--test");
  const timestamp = args.find(arg => arg.startsWith("--timestamp="))?.split("=")[1];

  console.log("🚀 Running Briefing Generator");
  console.log("============================");
  console.log(`Mode: ${testMode ? "TEST" : "PRODUCTION"}`);
  console.log(`Timestamp: ${timestamp || "Current time"}`);
  console.log("");

  try {
    const result = await generateBriefing({
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      testMode,
      debugMode: true,
    });

    console.log("\n✅ Briefing Generation Complete!");
    console.log("================================");
    console.log(`Briefing ID: ${result.briefing.id}`);
    console.log(`Slug: ${result.briefing.slug}`);
    console.log(`URL: http://localhost:4433/briefings/${result.briefing.slug}`);
    console.log("\nStats:");
    console.log(`- Duration: ${result.stats.duration}ms`);
    console.log(`- Steps completed: ${result.stats.stepsCompleted}`);
    console.log(`- Tweets processed: ${result.stats.tweetsProcessed}`);
    console.log(`- Sources used: ${result.stats.sourcesUsed}`);
    console.log(`- Terry score: ${Math.round(result.stats.terryScore * 100)}%`);

    if (result.debug) {
      console.log("\nStep Timings:");
      Object.entries(result.debug.stepTimings).forEach(([step, time]) => {
        console.log(`- ${step}: ${time}ms`);
      });
    }

  } catch (error) {
    console.error("\n❌ Briefing generation failed:");
    console.error(error);
    process.exit(1);
  }
}

run().catch(console.error);