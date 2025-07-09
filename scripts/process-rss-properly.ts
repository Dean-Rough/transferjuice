#!/usr/bin/env tsx
/**
 * Process RSS feed properly - handle both transfers and other news
 * Generate accurate headlines while keeping Golby humor
 */

import { PrismaClient } from "@prisma/client";
import { processNewStories } from "../src/lib/simplifiedStoryProcessor";

const prisma = new PrismaClient();

interface RSSItem {
  id: string;
  url: string;
  title: string;
  content_text: string;
  content_html: string;
  image?: string;
  date_published: string;
  authors: { name: string }[];
  attachments?: { url: string }[];
}

interface RSSFeed {
  version: string;
  title: string;
  items: RSSItem[];
}

async function fetchAndIngestRSS() {
  const feedUrl = "https://rss.app/feeds/v1.1/_zMqruZvtL6XIMNVY.json";
  
  try {
    console.log("📡 Fetching RSS feed...");
    const response = await fetch(feedUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }
    
    const feed: RSSFeed = await response.json();
    console.log(`Found ${feed.items.length} items in feed`);
    
    // Filter to recent items (last 2 hours for hourly processing)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const recentItems = feed.items.filter(item => {
      const itemDate = new Date(item.date_published);
      return itemDate > twoHoursAgo;
    });
    
    console.log(`\nProcessing ${recentItems.length} recent items:\n`);
    
    // Process each RSS item
    let newTweets = 0;
    for (const item of recentItems) {
      try {
        // Check if we already have this item
        const existing = await prisma.tweet.findUnique({
          where: { tweetId: item.id }
        });
        
        if (existing) {
          console.log(`  ⏭️  Skipping duplicate: ${item.title.substring(0, 60)}...`);
          continue;
        }
        
        // Extract source name
        const sourceName = item.authors[0]?.name || item.title.split(' - ')[0] || "RSS Feed";
        
        // Create or find the source
        const source = await prisma.source.upsert({
          where: { handle: sourceName.toLowerCase().replace(/\s+/g, '_') },
          update: {},
          create: {
            handle: sourceName.toLowerCase().replace(/\s+/g, '_'),
            name: sourceName,
          }
        });
        
        // Enhanced content that includes the title for better context
        const enhancedContent = `${item.title}\n\n${item.content_text}`;
        
        // Create the tweet record
        await prisma.tweet.create({
          data: {
            tweetId: item.id,
            content: enhancedContent,
            url: item.url,
            sourceId: source.id,
            scrapedAt: new Date(item.date_published),
          }
        });
        
        newTweets++;
        console.log(`  ✅ Ingested: ${item.title.substring(0, 60)}...`);
        
        // Show what type of content this is
        if (item.title.toLowerCase().includes('official') || item.content_text.toLowerCase().includes('official')) {
          console.log(`     📢 Type: Official announcement`);
        } else if (item.title.match(/€\d+m|£\d+m|\$\d+m/)) {
          console.log(`     💰 Type: Transfer news with fee`);
        } else {
          console.log(`     📰 Type: General news`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing item: ${error.message}`);
      }
    }
    
    console.log(`\n📥 Summary: Ingested ${newTweets} new items from RSS feed`);
    
    return newTweets;
    
  } catch (error) {
    console.error("❌ Error fetching RSS:", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 TransferJuice Smart RSS Processor");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Started: ${new Date().toLocaleString()}\n`);
  
  try {
    // Step 1: Ingest RSS feed items
    console.log("📡 Step 1: Processing RSS Feed");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    const newItems = await fetchAndIngestRSS();
    
    if (newItems === 0) {
      console.log("\n✨ No new RSS items found. All caught up!");
      return;
    }
    
    // Step 2: Process tweets into Golby-style stories
    console.log("\n📝 Step 2: Generating Golby-Style Stories");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Note: Non-transfer news may be skipped or handled differently\n");
    
    const stories = await processNewStories();
    console.log(`\n✅ Generated ${stories.length} new stories`);
    
    if (stories.length > 0) {
      console.log("\nNew stories created:");
      stories.forEach((story, idx) => {
        console.log(`\n  ${idx + 1}. ${story.headline}`);
        console.log(`     Status: ${story.isUpdate ? "Updated existing story" : "New story"}`);
        // Show first 150 chars of content to verify it's informative
        console.log(`     Preview: "${story.articleContent.substring(0, 150)}..."`);
      });
    }
    
    // Summary
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 FINAL SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`RSS items processed: ${newItems}`);
    console.log(`Stories generated: ${stories.length}`);
    console.log(`Success rate: ${newItems > 0 ? Math.round((stories.length / newItems) * 100) : 0}%`);
    console.log(`\nCompleted: ${new Date().toLocaleString()}`);
    
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();