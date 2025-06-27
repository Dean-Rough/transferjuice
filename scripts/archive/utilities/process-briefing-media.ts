#!/usr/bin/env tsx

/**
 * Process media placeholders for existing briefings
 */

import { config } from "dotenv";
import { prisma } from "@/lib/prisma";
import { processMediaPlaceholders } from "@/briefing-generator/steps/07-process-media-placeholders";

config();

async function processBriefingMedia() {
  console.log("🎬 Processing media placeholders for latest briefing...\n");
  
  try {
    // Get the latest briefing
    const briefing = await prisma.briefing.findFirst({
      orderBy: { timestamp: 'desc' },
    });
    
    if (!briefing) {
      console.log("❌ No briefings found");
      return;
    }
    
    console.log(`📰 Processing briefing: ${briefing.slug}`);
    
    const content = (briefing.content as any).raw;
    if (!content) {
      console.log("❌ No raw content found");
      return;
    }
    
    // Process media placeholders
    const { content: processedContent, media, tweets } = await processMediaPlaceholders(
      content,
      briefing.id
    );
    
    // Update the briefing with processed content
    await prisma.briefing.update({
      where: { id: briefing.id },
      data: {
        content: {
          ...(briefing.content as any),
          raw: processedContent,
          hasMedia: media.length > 0,
          hasTweets: tweets.length > 0,
        },
      },
    });
    
    console.log("✅ Media processing complete!");
    console.log(`📷 Images processed: ${media.length}`);
    console.log(`🐦 Tweets processed: ${tweets.length}`);
    
    media.forEach((item, i) => {
      console.log(`   Image ${i + 1}: ${item.alt}`);
    });
    
    tweets.forEach((item, i) => {
      console.log(`   Tweet ${i + 1}: @${item.author}`);
    });
    
  } catch (error) {
    console.error("❌ Error processing media:", error);
  } finally {
    await prisma.$disconnect();
  }
}

processBriefingMedia().catch(console.error);