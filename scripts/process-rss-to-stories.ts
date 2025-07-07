import dotenv from "dotenv";
import { processRSSIntoStories, getMegaStoriesForRecap } from "../src/lib/storyProcessor";

dotenv.config();

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

async function fetchAndProcessRSS() {
  const feedUrl = "https://rss.app/feeds/v1.1/_zMqruZvtL6XIMNVY.json";
  
  try {
    console.log("📡 Fetching RSS feed...");
    const response = await fetch(feedUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }
    
    const feed: RSSFeed = await response.json();
    console.log(`Found ${feed.items.length} items in feed`);
    
    // Filter to recent items (last 3 hours for regular processing)
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const recentItems = feed.items.filter(item => {
      const itemDate = new Date(item.date_published);
      return itemDate > threeHoursAgo;
    });
    
    console.log(`Processing ${recentItems.length} recent items...`);
    
    // Process into individual stories
    const stories = await processRSSIntoStories(recentItems);
    
    console.log(`\n✅ Processed ${stories.length} new/updated stories`);
    
    // Show mega stories from last 24h
    console.log("\n📊 Mega Stories (Importance 7+) from last 24h:");
    const megaStories = await getMegaStoriesForRecap(24, 7);
    
    for (const story of megaStories) {
      const meta = story.metadata as any;
      console.log(`\n⭐ ${meta.player} (Importance: ${meta.importance}/10)`);
      console.log(`   ${meta.fromClub || '?'} → ${meta.toClub || '?'} (${meta.status})`);
      if (meta.fee) console.log(`   Fee: ${meta.fee}`);
      if (meta.isMegaDeal) console.log(`   💰 MEGA DEAL`);
      if (meta.isHereWeGo) console.log(`   ✅ Here We Go!`);
      console.log(`   Sources: ${meta.sources.join(', ')}`);
    }
    
    return stories;
    
  } catch (error) {
    console.error("❌ Error processing RSS:", error);
    throw error;
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting RSS to Stories processor...");
  
  try {
    await fetchAndProcessRSS();
    console.log("\n✅ RSS processing complete!");
  } catch (error) {
    console.error("❌ Failed to process RSS:", error);
    process.exit(1);
  }
}

main();