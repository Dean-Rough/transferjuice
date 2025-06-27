#!/usr/bin/env tsx

import { config } from "dotenv";
import { getBriefingBySlug } from "@/lib/database/briefings";

config();

async function testGetBriefing() {
  console.log("Testing getBriefingBySlug...");
  
  try {
    const briefing = await getBriefingBySlug('2025-06-25-21-haaland-to-madrid-the-180m-mega-deal');
    
    if (briefing) {
      console.log("✅ Found briefing:");
      console.log(`   ID: ${briefing.id}`);
      console.log(`   Slug: ${briefing.slug}`);
      console.log(`   Published: ${briefing.isPublished}`);
      console.log(`   Title: ${JSON.stringify(briefing.title)}`);
      console.log(`   Content has sections: ${briefing.content && (briefing.content as any).sections ? 'Yes' : 'No'}`);
      console.log(`   Media count: ${briefing.media ? briefing.media.length : 0}`);
    } else {
      console.log("❌ No briefing found for that slug");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testGetBriefing().catch(console.error);