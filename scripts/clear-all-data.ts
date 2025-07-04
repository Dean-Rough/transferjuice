#!/usr/bin/env tsx

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearAllData() {
  try {
    console.log("🗑️  Clearing all data...");

    // Delete in correct order to respect foreign keys
    await prisma.briefingStory.deleteMany({});
    console.log("✓ Cleared briefing stories");

    await prisma.story.deleteMany({});
    console.log("✓ Cleared stories");

    await prisma.tweet.deleteMany({});
    console.log("✓ Cleared tweets");

    await prisma.briefing.deleteMany({});
    console.log("✓ Cleared briefings");

    await prisma.source.deleteMany({});
    console.log("✓ Cleared sources");

    await prisma.user.deleteMany({});
    console.log("✓ Cleared users");

    console.log("✅ All data cleared successfully!");
  } catch (error) {
    console.error("❌ Error clearing data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearAllData();
