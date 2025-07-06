import { PrismaClient } from "@prisma/client";
import { generateCohesiveBriefing } from "../src/lib/cohesiveBriefingGenerator";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

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

async function getOpenAI(): Promise<OpenAI | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.log("⚠️ No OpenAI API key found, using fallback mode");
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

async function generateBriefingFromRSS(feedUrl: string) {
  try {
    console.log("📡 Fetching RSS feed...");
    const response = await fetch(feedUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }
    
    const feed: RSSFeed = await response.json();
    console.log(`Found ${feed.items.length} items in feed`);
    
    // Filter to recent items (last 24 hours)
    const recentItems = feed.items.filter(item => {
      const itemDate = new Date(item.date_published);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return itemDate > dayAgo;
    });
    
    console.log(`Filtered to ${recentItems.length} recent items`);
    
    if (recentItems.length === 0) {
      console.log("No recent items to process");
      return null;
    }
    
    // Initialize OpenAI (may be null if no API key)
    const openai = await getOpenAI();
    
    // Generate cohesive briefing
    console.log("📝 Generating cohesive briefing...");
    const cohesiveBriefing = await generateCohesiveBriefing(recentItems, openai);
    
    // Create briefing record
    const briefing = await prisma.briefing.create({
      data: {
        title: cohesiveBriefing.title,
        publishedAt: new Date(),
      },
    });
    
    // Create a single consolidated story
    // First, create a source for the briefing
    const source = await prisma.source.upsert({
      where: { handle: "TransferJuice" },
      update: {},
      create: {
        name: "TransferJuice Editorial",
        handle: "TransferJuice",
      },
    });
    
    // Create a consolidated tweet record
    const tweet = await prisma.tweet.create({
      data: {
        tweetId: `briefing-${briefing.id}`,
        content: `Transfer Briefing: ${cohesiveBriefing.metadata.keyPlayers.join(', ')}`,
        url: `https://transferjuice.com/briefing/${briefing.id}`,
        sourceId: source.id,
        scrapedAt: new Date(),
      },
    });
    
    // Create the story with the cohesive content
    // Clean the content to avoid encoding issues
    const cleanContent = cohesiveBriefing.content
      .replace(/[\u{D800}-\u{DFFF}]/gu, '') // Remove lone surrogates
      .replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control characters
    
    const story = await prisma.story.create({
      data: {
        tweetId: tweet.id,
        terryComment: "Another day in the transfer circus. Roll up, roll up.",
        metadata: {
          type: 'cohesive',
          content: cleanContent,
          keyPlayers: cohesiveBriefing.metadata.keyPlayers,
          keyClubs: cohesiveBriefing.metadata.keyClubs,
          mainImage: cohesiveBriefing.metadata.mainImage,
          sources: [...new Set(recentItems.map(item => item.authors[0]?.name || "Unknown"))],
        },
      },
    });
    
    // Link to briefing
    await prisma.briefingStory.create({
      data: {
        briefingId: briefing.id,
        storyId: story.id,
        position: 0,
      },
    });
    
    console.log(`\n✅ Created cohesive briefing: ${cohesiveBriefing.title}`);
    console.log(`Briefing ID: ${briefing.id}`);
    console.log(`Key Players: ${cohesiveBriefing.metadata.keyPlayers.join(', ')}`);
    console.log(`Key Clubs: ${cohesiveBriefing.metadata.keyClubs.join(', ')}`);
    if (cohesiveBriefing.metadata.mainImage) {
      console.log(`Main Image: ${cohesiveBriefing.metadata.mainImage}`);
    }
    
    return briefing;
    
  } catch (error) {
    console.error("❌ Error generating cohesive briefing:", error);
    throw error;
  }
}

// Main execution
async function main() {
  const feedUrl = process.argv[2] || "https://rss.app/feeds/v1.1/_zMqruZvtL6XIMNVY.json";
  
  console.log("🚀 Starting cohesive briefing generation from RSS...");
  console.log(`Feed URL: ${feedUrl}`);
  
  try {
    const briefing = await generateBriefingFromRSS(feedUrl);
    
    if (briefing) {
      console.log("\n✅ Cohesive briefing generated successfully!");
      console.log("\n🌐 Check your homepage at http://localhost:4433");
    } else {
      console.log("\n⚠️ No recent items to process");
    }
    
  } catch (error) {
    console.error("❌ Failed to generate cohesive briefing:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();