#!/usr/bin/env tsx

import { processNewStories, updateOldStories, generateDailySummary } from "../src/lib/simplifiedStoryProcessor";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "process";

  console.log("🎯 Transfer Juice Simplified Story Processor");
  console.log("==========================================");

  try {
    switch (command) {
      case "process":
        console.log("Running story processing (every 2 hours)...");
        // Set test mode for wider time range if --test flag is passed
        if (args.includes("--test")) {
          process.env.TEST_MODE = "true";
          console.log("TEST MODE: Processing tweets from last 24 hours");
        }
        const stories = await processNewStories();
        console.log(`✅ Processed ${stories.length} stories`);
        break;

      case "update":
        console.log("Updating existing stories...");
        const updated = await updateOldStories();
        console.log(`✅ Updated ${updated} stories`);
        break;

      case "daily":
        console.log("Generating daily summary...");
        await generateDailySummary();
        console.log("✅ Daily summary generated");
        break;

      case "all":
        console.log("Running complete pipeline...");
        const allStories = await processNewStories();
        const allUpdated = await updateOldStories();
        await generateDailySummary();
        console.log(`✅ Complete: ${allStories.length} new, ${allUpdated} updated`);
        break;

      default:
        console.log("Usage: run-simplified-stories.ts [process|update|daily|all]");
        console.log("  process - Process new tweets into stories");
        console.log("  update  - Update existing stories with new info");
        console.log("  daily   - Generate daily summary");
        console.log("  all     - Run all operations");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();