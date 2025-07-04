#!/usr/bin/env tsx

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Set DATABASE_URL for Prisma
process.env.DATABASE_URL = process.env.DATABASE_URL || "";

import { generateBriefing } from "../src/lib/briefingGenerator";

async function main() {
  try {
    console.log("🚀 Starting briefing generation...");

    const briefing = await generateBriefing();

    console.log("✅ Briefing generated successfully!");
    console.log(`📰 Title: ${briefing?.title}`);
    console.log(`📊 Stories: ${briefing?.stories.length || 0}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error generating briefing:", error);
    process.exit(1);
  }
}

main();
