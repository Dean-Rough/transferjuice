#!/usr/bin/env tsx
/**
 * Daily RSS Processor - Runs once per day at 9am
 * Processes last 24 hours of RSS feed items
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
    
    // Filter to last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentItems = feed.items.filter(item => {
      const itemDate = new Date(item.date_published);
      return itemDate > oneDayAgo;
    });
    
    console.log(`\nProcessing ${recentItems.length} items from last 24 hours:\n`);
    
    // Sort by date to process oldest first
    recentItems.sort((a, b) => 
      new Date(a.date_published).getTime() - new Date(b.date_published).getTime()
    );
    
    // Process each RSS item
    let newTweets = 0;
    let skipped = 0;
    
    for (const item of recentItems) {
      try {
        // Check if we already have this item
        const existing = await prisma.tweet.findUnique({
          where: { tweetId: item.id }
        });
        
        if (existing) {
          skipped++;
          continue;
        }
        
        // Extract source name
        const sourceName = item.authors[0]?.name || item.title.split(' - ')[0] || "RSS Feed";
        
        // Create or find the source
        let source;
        try {
          source = await prisma.source.findFirst({
            where: { 
              OR: [
                { handle: sourceName.toLowerCase().replace(/\s+/g, '_') },
                { name: sourceName }
              ]
            }
          });
          
          if (!source) {
            source = await prisma.source.create({
              data: {
                handle: sourceName.toLowerCase().replace(/\s+/g, '_'),
                name: sourceName,
              }
            });
          }
        } catch (err) {
          console.error(`     ⚠️  Source error: ${err.message}`);
          continue;
        }
        
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
    
    console.log(`\n📥 Summary: Ingested ${newTweets} new items, skipped ${skipped} duplicates`);
    
    return { newTweets, totalProcessed: recentItems.length };
    
  } catch (error) {
    console.error("❌ Error fetching RSS:", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 TransferJuice Daily RSS Processor");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Started: ${new Date().toLocaleString()}`);
  console.log(`Processing last 24 hours of RSS feed\n`);
  
  try {
    // Step 1: Ingest RSS feed items
    console.log("📡 Step 1: Processing RSS Feed");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    const { newTweets, totalProcessed } = await fetchAndIngestRSS();
    
    if (newTweets === 0) {
      console.log("\n✨ No new RSS items found in the last 24 hours. All caught up!");
      return;
    }
    
    // Step 2: Process tweets into Golby-style stories
    console.log("\n📝 Step 2: Generating Golby-Style Stories");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Processing all ingested items into stories...\n");
    
    const stories = await processNewStories();
    console.log(`\n✅ Generated ${stories.length} stories`);
    
    if (stories.length > 0) {
      console.log("\nStories created:");
      
      // Group by new vs updated
      const newStories = stories.filter(s => !s.isUpdate);
      const updatedStories = stories.filter(s => s.isUpdate);
      
      if (newStories.length > 0) {
        console.log(`\n🆕 New Stories (${newStories.length}):`);
        newStories.forEach((story, idx) => {
          console.log(`\n  ${idx + 1}. ${story.headline}`);
          console.log(`     Preview: "${story.articleContent.substring(0, 120)}..."`);
        });
      }
      
      if (updatedStories.length > 0) {
        console.log(`\n🔄 Updated Stories (${updatedStories.length}):`);
        updatedStories.forEach((story, idx) => {
          console.log(`\n  ${idx + 1}. ${story.headline}`);
          console.log(`     Updates: ${story.updateCount}`);
        });
      }
    }
    
    // Summary
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 DAILY SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`RSS items in last 24h: ${totalProcessed}`);
    console.log(`New items ingested: ${newTweets}`);
    console.log(`Stories generated: ${stories.length}`);
    console.log(`  - New stories: ${stories.filter(s => !s.isUpdate).length}`);
    console.log(`  - Updated stories: ${stories.filter(s => s.isUpdate).length}`);
    console.log(`\nCompleted: ${new Date().toLocaleString()}`);
    
    // Clean up old stories (optional - keep last 100)
    console.log("\n🧹 Cleaning up old stories...");
    const storyCount = await prisma.story.count();
    if (storyCount > 100) {
      const toDelete = storyCount - 100;
      const oldestStories = await prisma.story.findMany({
        orderBy: { createdAt: 'asc' },
        take: toDelete,
        select: { id: true }
      });
      
      await prisma.story.deleteMany({
        where: {
          id: { in: oldestStories.map(s => s.id) }
        }
      });
      
      console.log(`Deleted ${toDelete} old stories, keeping last 100`);
    }
    
  } catch (error) {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();