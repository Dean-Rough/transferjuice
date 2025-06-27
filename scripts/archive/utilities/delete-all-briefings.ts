#!/usr/bin/env tsx

/**
 * Delete all briefings from the database
 * Use with caution - this will remove all briefing data
 */

import { config } from "dotenv";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// Load environment variables
config();

async function deleteAllBriefings() {
  logger.info("Starting briefing deletion process...");
  
  try {
    // First, get a count of existing briefings
    const briefingCount = await prisma.briefing.count();
    logger.info(`Found ${briefingCount} briefings to delete`);
    
    if (briefingCount === 0) {
      logger.info("No briefings to delete");
      return;
    }
    
    // Delete all briefings (this will cascade to related records)
    const result = await prisma.briefing.deleteMany({});
    logger.info(`Deleted ${result.count} briefings`);
    
    // Also clean up any orphaned feed items that were part of briefings
    const feedItemsDeleted = await prisma.feedItem.deleteMany({
      where: {
        briefingId: {
          not: null
        }
      }
    });
    logger.info(`Cleaned up ${feedItemsDeleted.count} orphaned feed items`);
    
    // Reset any briefing-related sequences if needed
    logger.info("Briefing deletion complete!");
    
  } catch (error) {
    logger.error("Failed to delete briefings", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Add confirmation prompt
async function main() {
  console.log("\n⚠️  WARNING: This will delete ALL briefings from the database!");
  console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...\n");
  
  // Give user time to cancel
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  await deleteAllBriefings();
}

main().catch(console.error);