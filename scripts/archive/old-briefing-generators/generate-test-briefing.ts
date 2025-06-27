#!/usr/bin/env tsx

/**
 * Generate a test briefing using real data
 */

import { generateBriefing } from "../src/lib/briefings/generator";
import { prisma } from "../src/lib/prisma";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function generateTestBriefing() {
  console.log("🎯 Generating test briefing...");

  try {
    // Check if we have feed items
    const feedItemCount = await prisma.feedItem.count();
    console.log(`📊 Found ${feedItemCount} feed items in database`);

    if (feedItemCount === 0) {
      console.log("❌ No feed items found. Run pull-fabrizio.ts first!");
      return;
    }

    // Get recent feed items
    const recentItems = await prisma.feedItem.findMany({
      where: {
        isPublished: true,
        publishedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        source: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 20,
    });

    console.log(`📰 Using ${recentItems.length} recent items for briefing`);

    // Generate briefing
    console.log("🚀 Generating briefing with Terry AI...");
    const briefing = await generateBriefing({
      timestamp: new Date(),
      feedItems: recentItems,
    });

    console.log("\n✅ BRIEFING GENERATED!");
    console.log("📌 Title:", briefing.title);
    console.log("🔗 Slug:", briefing.slug);
    console.log("📊 Stats:");
    console.log(
      "   - Total tweets analyzed:",
      briefing.metadata.totalTweetsAnalyzed,
    );
    console.log("   - Tweet sources:", briefing.metadata.tweetSources);
    console.log("   - Terry score:", briefing.metadata.terryScore);
    console.log("   - Quality score:", briefing.metadata.qualityScore);

    console.log("\n📝 Content Preview:");
    console.log(briefing.content.substring(0, 500) + "...");

    console.log("\n🏷️ Tags:");
    briefing.tags.forEach((tag) => {
      console.log(`   - ${tag.type}: ${tag.value} (count: ${tag.count})`);
    });

    // Save to database
    console.log("\n💾 Saving to database...");
    const saved = await prisma.briefing.create({
      data: {
        title: briefing.title,
        slug: briefing.slug,
        content: briefing.content,
        publishedAt: briefing.publishedAt,
        briefingType: "SPECIAL",
        sidebarSections: briefing.sidebarSections || {},
        visualTimeline: briefing.visualTimeline || [],
        metadata: briefing.metadata || {},
        isPublished: true,
        feedItems: {
          connect: recentItems.map((item) => ({ id: item.id })),
        },
      },
    });

    console.log("\n🎉 SUCCESS! Briefing saved with ID:", saved.id);
    console.log(`🌐 View at: http://localhost:3000/briefings/${saved.slug}`);
  } catch (error: any) {
    console.error("\n❌ Error generating briefing:");
    console.error(error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

generateTestBriefing();
