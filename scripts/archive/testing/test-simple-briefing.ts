#!/usr/bin/env tsx

/**
 * Simple test script to generate a basic briefing
 * Bypasses complex orchestration to test core functionality
 */

import { config } from "dotenv";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { generateSlug } from "@/lib/utils/slug";

// Load environment variables
config();

async function generateSimpleBriefing() {
  logger.info("Starting simple briefing generation test");
  
  try {
    // Create test content
    const now = new Date();
    const title = {
      main: "Transfer Window Heats Up",
      subtitle: "Latest updates from the world of football transfers"
    };
    
    const content = `EVENING BRIEFING - ${now.toLocaleDateString()}

Welcome to Transfer Juice, where we turn the endless stream of ITK nonsense into something approaching coherent thought. I'm The Terry, and I've spent another day doom-scrolling through transfer Twitter so you don't have to.

THE BIG STORY

Manchester United are apparently interested in signing [checks notes] every midfielder in Europe. According to various ITK accounts who definitely aren't just making things up for engagement, United have been "monitoring" approximately 47 different players today. The monitoring intensifies.

PLAYER PROFILE

Today's mystery target is a 23-year-old defensive midfielder from a mid-table European club. He's got decent passing stats, runs quite a bit, and once scored a goal. Revolutionary stuff. His agent is probably very excited about the 200% wage increase he's about to negotiate.

TACTICAL ANALYSIS

If this mythical signing happens, he'll slot into the United midfield to do... midfielder things. You know, passing sideways, pointing at space, occasionally tracking back. The sort of profound tactical impact that definitely justifies spending €60m in January.

WHAT HAPPENS NEXT

More monitoring, presumably. Maybe some "preparing a bid" tweets. Definitely at least three "HERE WE GO... to bed because nothing is happening" moments. The transfer window remains undefeated in its ability to generate infinite content from absolutely nothing.

---
Generated at ${now.toISOString()}
Terry Commentary Confidence: 87%
Transfer Likelihood: 12%
Entertainment Value: Priceless`;

    // Count words
    const wordCount = content.split(/\s+/).length;
    
    // Create briefing with required fields
    const briefing = await prisma.briefing.create({
      data: {
        id: `briefing-${now.getTime()}`,
        slug: generateSlug(title.main, now),
        timestamp: now,
        title,
        content: {
          raw: content,
          sections: [
            { type: "intro", content: content.split("\n\n")[1] },
            { type: "main", content: content.split("\n\n")[3] },
            { type: "analysis", content: content.split("\n\n")[7] },
            { type: "conclusion", content: content.split("\n\n")[9] }
          ]
        },
        readTime: 3,
        wordCount: wordCount,
        terryScore: 0.87,
        visualTimeline: {
          events: []
        },
        sidebarSections: {
          sections: [
            { type: "stats", title: "Quick Stats", content: { tweets: 42, sources: 12 } },
            { type: "confidence", title: "Terry's Take", content: { score: 87, likelihood: 12 } }
          ]
        },
        isPublished: true,
        publishedAt: now,
        viewCount: 0
      }
    });
    
    logger.info("Simple briefing created successfully!", {
      id: briefing.id,
      slug: briefing.slug,
      url: `http://localhost:4433/briefings/${briefing.slug}`
    });
    
    // Create some test tweets to associate
    const testTweets = [
      {
        content: "BREAKING: Manchester United interested in signing midfielder. More to follow.",
        author: "ITKSource1",
        tier: 3,
      },
      {
        content: "Hearing whispers about United and a defensive midfielder. Deal could happen in January 👀",
        author: "TransferGuru",
        tier: 4,
      }
    ];
    
    logger.info("\n=== BRIEFING DETAILS ===");
    console.log(`ID: ${briefing.id}`);
    console.log(`Title: ${title.main}`);
    console.log(`Slug: ${briefing.slug}`);
    console.log(`URL: http://localhost:4433/briefings/${briefing.slug}`);
    console.log(`Time Slot: evening`);
    console.log(`Published: ${briefing.isPublished}`);
    
    console.log("\n=== CONTENT PREVIEW ===");
    console.log((briefing.content as any).raw.substring(0, 500) + "...");
    
    console.log("\n=== TEST TWEETS ===");
    testTweets.forEach((tweet, i) => {
      console.log(`${i + 1}. @${tweet.author} (Tier ${tweet.tier}): "${tweet.content}"`);
    });
    
    console.log("\n✅ Simple briefing test complete!");
    console.log(`\nView your briefing at: http://localhost:4433/briefings/${briefing.slug}`);
    console.log(`Or with rich media style: http://localhost:4433/briefings/${briefing.slug}?style=rich`);
    
  } catch (error) {
    logger.error("Failed to generate simple briefing", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
generateSimpleBriefing().catch(console.error);