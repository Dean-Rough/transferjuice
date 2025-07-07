import dotenv from "dotenv";

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

async function fetchRecentRSS() {
  const feedUrl = "https://rss.app/feeds/v1.1/_zMqruZvtL6XIMNVY.json";
  
  try {
    console.log("📡 Fetching RSS feed...\n");
    const response = await fetch(feedUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }
    
    const feed: RSSFeed = await response.json();
    console.log(`Total items in feed: ${feed.items.length}\n`);
    
    // Filter to last 3 hours
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const recentItems = feed.items.filter(item => {
      const itemDate = new Date(item.date_published);
      return itemDate > threeHoursAgo;
    });
    
    console.log(`Items from last 3 hours: ${recentItems.length}`);
    console.log("=" .repeat(80));
    
    // Sort by date, newest first
    recentItems.sort((a, b) => new Date(b.date_published).getTime() - new Date(a.date_published).getTime());
    
    // Display each item
    recentItems.forEach((item, index) => {
      const date = new Date(item.date_published);
      const timeAgo = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
      
      console.log(`\n${index + 1}. ${item.title}`);
      console.log(`   Author: ${item.authors?.[0]?.name || 'Unknown'}`);
      console.log(`   Time: ${date.toLocaleTimeString('en-GB')} (${timeAgo} minutes ago)`);
      console.log(`   URL: ${item.url}`);
      console.log(`\n   Content:`);
      console.log(`   ${item.content_text}`);
      
      if (item.image) {
        console.log(`\n   Image: ${item.image}`);
      }
      
      console.log("\n" + "-".repeat(80));
    });
    
    // Summary of sources
    console.log("\n📊 SUMMARY BY SOURCE:");
    const sources = new Map<string, number>();
    recentItems.forEach(item => {
      const author = item.authors?.[0]?.name || 'Unknown';
      sources.set(author, (sources.get(author) || 0) + 1);
    });
    
    Array.from(sources.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([source, count]) => {
        console.log(`   ${source}: ${count} items`);
      });
    
  } catch (error) {
    console.error("❌ Error fetching RSS:", error);
  }
}

// Run the script
fetchRecentRSS();