#!/usr/bin/env tsx
/**
 * Process RSS feed and create Golby-style stories
 * This combines RSS ingestion with the simplified story processor
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
    
    console.log(`Processing ${recentItems.length} recent items...`);
    
    // Process each RSS item into the database as a "tweet"
    let newTweets = 0;
    for (const item of recentItems) {
      try {
        // Check if we already have this item
        const existing = await prisma.tweet.findUnique({
          where: { tweetId: item.id }
        });
        
        if (existing) {
          continue;
        }
        
        // Extract source name from author or title
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
        
        // Create the tweet record
        await prisma.tweet.create({
          data: {
            tweetId: item.id,
            content: item.content_text || item.title,
            url: item.url,
            sourceId: source.id,
            scrapedAt: new Date(item.date_published),
          }
        });
        
        newTweets++;
        console.log(`  ✅ Ingested: ${item.title.substring(0, 60)}...`);
        
      } catch (error) {
        console.error(`  ❌ Error processing item: ${error.message}`);
      }
    }
    
    console.log(`\n📥 Ingested ${newTweets} new RSS items as tweets`);
    
    return newTweets;
    
  } catch (error) {
    console.error("❌ Error fetching RSS:", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 TransferJuice RSS to Stories Pipeline");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Started: ${new Date().toLocaleString()}\n`);
  
  try {
    // Step 1: Ingest RSS feed items as tweets
    console.log("📡 Step 1: Ingesting RSS Feed");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    const newItems = await fetchAndIngestRSS();
    
    if (newItems === 0) {
      console.log("\nNo new RSS items found. Checking if we should process existing tweets...");
    }
    
    // Step 2: Process tweets into Golby-style stories
    console.log("\n📝 Step 2: Generating Golby-Style Stories");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    const stories = await processNewStories();
    console.log(`✅ Generated ${stories.length} new stories`);
    
    if (stories.length > 0) {
      console.log("\nNew stories created:");
      stories.forEach((story, idx) => {
        console.log(`  ${idx + 1}. ${story.headline}`);
        console.log(`     ${story.isUpdate ? "Updated existing story" : "New story"}`);
      });
    }
    
    // Summary
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`RSS items processed: ${newItems}`);
    console.log(`Stories generated: ${stories.length}`);
    console.log(`Completed: ${new Date().toLocaleString()}`);
    
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();