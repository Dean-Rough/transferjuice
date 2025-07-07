import { PrismaClient } from "@prisma/client";
import { generateBriefingFromStories } from "../src/lib/briefingFromStories";
import { processRSSIntoStories } from "../src/lib/storyProcessor";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function getOpenAI(): Promise<OpenAI | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.log("⚠️ No OpenAI API key found, using fallback mode");
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

async function main() {
  try {
    console.log("🚀 Starting story-based briefing generation...");
    
    // First, process any new RSS items
    console.log("📡 Checking for new RSS items...");
    const feedUrl = "https://rss.app/feeds/v1.1/_zMqruZvtL6XIMNVY.json";
    const response = await fetch(feedUrl);
    const feed = await response.json();
    
    // Process last 3 hours of items
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const recentItems = feed.items.filter((item: any) => 
      new Date(item.date_published) > threeHoursAgo
    );
    
    if (recentItems.length > 0) {
      console.log(`Processing ${recentItems.length} new RSS items...`);
      await processRSSIntoStories(recentItems);
    }
    
    // Generate briefing from stored stories
    console.log("\n📝 Generating briefing from stored stories...");
    const openai = await getOpenAI();
    const briefingContent = await generateBriefingFromStories(3, openai);
    
    // Create briefing record
    const briefing = await prisma.briefing.create({
      data: {
        title: briefingContent.title,
        publishedAt: new Date(),
      },
    });
    
    // Create a consolidated story for the briefing
    const source = await prisma.source.upsert({
      where: { handle: "TransferJuice" },
      update: {},
      create: {
        name: "TransferJuice Editorial",
        handle: "TransferJuice",
      },
    });
    
    const tweet = await prisma.tweet.create({
      data: {
        tweetId: `briefing-${briefing.id}`,
        content: `Transfer Briefing: ${briefingContent.metadata.keyPlayers.join(', ')}`,
        url: `https://transferjuice.com/briefing/${briefing.id}`,
        sourceId: source.id,
        scrapedAt: new Date(),
      },
    });
    
    // Clean content
    const cleanContent = briefingContent.content
      .replace(/[\u{D800}-\u{DFFF}]/gu, '')
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    const story = await prisma.story.create({
      data: {
        tweetId: tweet.id,
        terryComment: "Another hour, another collection of millionaires moving offices.",
        metadata: {
          type: 'cohesive',
          content: cleanContent,
          keyPlayers: briefingContent.metadata.keyPlayers,
          keyClubs: briefingContent.metadata.keyClubs,
          mainImage: briefingContent.metadata.mainImage,
          playerImages: briefingContent.metadata.playerImages,
          generatedAt: new Date(),
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
    
    // Mark individual stories as included in briefing
    const stories = await prisma.story.findMany({
      where: {
        tweet: {
          scrapedAt: {
            gte: threeHoursAgo
          }
        }
      },
      orderBy: {
        tweet: {
          scrapedAt: 'desc'
        }
      },
      take: 50
    });
    
    // Filter out cohesive stories and sort by importance
    const individualStories = stories
      .filter(s => {
        const meta = s.metadata as any;
        return meta?.type !== 'cohesive';
      })
      .sort((a, b) => {
        const aImp = (a.metadata as any)?.importance || 0;
        const bImp = (b.metadata as any)?.importance || 0;
        return bImp - aImp;
      })
      .slice(0, 10);
    
    // Link top stories to briefing
    for (let i = 0; i < individualStories.length; i++) {
      await prisma.briefingStory.create({
        data: {
          briefingId: briefing.id,
          storyId: individualStories[i].id,
          position: i + 1,
        },
      });
    }
    
    console.log(`\n✅ Created briefing: ${briefingContent.title}`);
    console.log(`Briefing ID: ${briefing.id}`);
    console.log(`Key Players: ${briefingContent.metadata.keyPlayers.join(', ')}`);
    console.log(`Key Clubs: ${briefingContent.metadata.keyClubs.join(', ')}`);
    console.log(`Stories included: ${individualStories.length}`);
    
    console.log("\n🌐 Check your homepage at http://localhost:4433");
    
  } catch (error) {
    console.error("❌ Error generating briefing:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();