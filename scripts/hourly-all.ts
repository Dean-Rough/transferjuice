#!/usr/bin/env tsx
/**
 * Hourly Combined Script
 * Processes RSS feed into Golby-style stories every hour
 */

async function runHourlyTasks() {
  console.log("🚀 TRANSFERJUICE HOURLY TASKS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Started: ${new Date().toLocaleString()}\n`);

  try {
    // Run the improved RSS processor
    await import("./process-rss-properly");
    
    console.log("\n✅ Hourly tasks completed successfully");
    
  } catch (error) {
    console.error("❌ Error in hourly tasks:", error);
    process.exit(1);
  }
}

// Run the hourly tasks
runHourlyTasks();