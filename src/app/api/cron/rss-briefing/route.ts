import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generateTerryComment } from "@/lib/terry";
import { analyzeBriefingContent, generateOptimizedHeadline } from "@/lib/seoOptimizer";
import OpenAI from "openai";

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

// Copy the essential functions from generate-briefing-from-rss.ts
async function getOpenAI(): Promise<OpenAI | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.log("⚠️ No OpenAI API key found, using fallback mode");
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function groupRelatedStories(items: RSSItem[]): Map<string, RSSItem[]> {
  const groups = new Map<string, RSSItem[]>();
  
  items.forEach(item => {
    const text = item.title + " " + item.content_text;
    
    // Extract player names using more sophisticated patterns
    const namePatterns = [
      /Viktor Gyökeres/gi,
      /Marcus Rashford/gi,
      /Mohammed Kudus/gi,
      /Jamal Musiala/gi,
      /Francesco Camarda/gi,
      /Martin Vitik/gi,
      /Declan Rice/gi,
      /Harry Kane/gi,
      /Jude Bellingham/gi,
      // Generic pattern for "FirstName LastName"
      /\b([A-Z][a-z]+ [A-Z][a-zöäüßéè]+)\b/g
    ];
    
    let assigned = false;
    for (const pattern of namePatterns) {
      const matches = text.match(pattern);
      if (matches && matches[0]) {
        const key = matches[0].toLowerCase();
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(item);
        assigned = true;
        break;
      }
    }
    
    if (!assigned) {
      // Try to extract club-based grouping
      const clubMatch = text.match(/(Arsenal|Manchester United|Liverpool|Chelsea|Tottenham|Bayern|Real Madrid|Barcelona|PSG)/i);
      if (clubMatch) {
        const key = `${clubMatch[0].toLowerCase()}-news`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(item);
      } else {
        // Other news
        if (!groups.has("other-news")) {
          groups.set("other-news", []);
        }
        groups.get("other-news")!.push(item);
      }
    }
  });
  
  return groups;
}

async function generateEnhancedStory(items: RSSItem[], openai: OpenAI | null): Promise<any> {
  // Simplified version - just use fallback for now
  const latestItem = items[items.length - 1];
  const sources = [...new Set(items.map(item => item.authors[0]?.name || "Unknown"))];
  
  const headline = latestItem.title.replace(/^[🚨🔴⚪️💣❤️🤍]+\s*/, "");
  
  const contextParagraph = items.length > 1 
    ? `${latestItem.content_text.split('\n')[0]} This follows earlier reports from ${sources.join(", ")} regarding the developing situation.`
    : latestItem.content_text.split('\n')[0];
  
  const allText = items.map(i => i.content_text).join(" ");
  const playerMatch = headline.match(/([A-Z][a-z]+ [A-Z][a-zöäüßéè]+)/);
  const playerName = playerMatch ? playerMatch[0] : "The player";
  
  const careerContext = `${playerName} continues to be at the center of transfer speculation.`;
  const transferDynamics = "The transfer negotiations continue to develop with various parties working to reach an agreement.";
  const widerImplications = "This transfer would represent a significant move in the current window.";
  
  return {
    headline,
    contextParagraph,
    careerContext,
    transferDynamics,
    widerImplications,
    terrysTake: await generateTerryComment(headline),
    sources
  };
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`🚀 RSS Briefing cron job triggered at ${new Date().toISOString()}`);

    // Fetch RSS feed
    const feedUrl = process.env.RSS_FEED_URL || "https://rss.app/feeds/v1.1/_zMqruZvtL6XIMNVY.json";
    const response = await fetch(feedUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }
    
    const feed: RSSFeed = await response.json();
    
    // Filter to recent items (last 2 hours for hourly updates)
    const recentItems = feed.items.filter(item => {
      const itemDate = new Date(item.date_published);
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      return itemDate > twoHoursAgo;
    });
    
    if (recentItems.length === 0) {
      console.log("No new items in RSS feed");
      return NextResponse.json({
        success: true,
        message: "No new items to process",
      });
    }
    
    // Group related stories
    const groupedStories = groupRelatedStories(recentItems);
    
    // Initialize OpenAI (may be null if no API key)
    const openai = await getOpenAI();
    
    // Create briefing
    const briefing = await prisma.briefing.create({
      data: {
        title: `Transfer Briefing - ${new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
      },
    });
    
    let position = 0;
    let successfulStories = 0;
    
    // Process each group (limit to top 5 for performance)
    const topGroups = Array.from(groupedStories.entries()).slice(0, 5);
    
    for (const [topic, items] of topGroups) {
      // Skip single ungrouped items unless they're significant
      if (topic === "other-news" && items.length < 2) continue;
      
      const enhancedStory = await generateEnhancedStory(items, openai);
      
      if (enhancedStory) {
        // Create source and tweet records for the main item
        const mainItem = items[items.length - 1]; // Most recent
        const authorName = mainItem.authors[0]?.name || "Unknown";
        
        const source = await prisma.source.upsert({
          where: { handle: authorName },
          update: {},
          create: {
            name: authorName.replace("@", ""),
            handle: authorName,
          },
        });
        
        const tweet = await prisma.tweet.create({
          data: {
            tweetId: mainItem.id,
            content: mainItem.content_text,
            url: mainItem.url,
            sourceId: source.id,
            scrapedAt: new Date(mainItem.date_published),
          },
        });
        
        // Create story with enhanced metadata
        const story = await prisma.story.create({
          data: {
            tweetId: tweet.id,
            terryComment: enhancedStory.terrysTake || "The beautiful game continues its relentless march of millionaire musical chairs.",
            metadata: enhancedStory,
          },
        });
        
        // Link to briefing
        await prisma.briefingStory.create({
          data: {
            briefingId: briefing.id,
            storyId: story.id,
            position: position++,
          },
        });
        
        successfulStories++;
      }
    }
    
    // Update briefing with SEO-optimized title
    if (successfulStories > 0) {
      const briefingWithStories = await prisma.briefing.findUnique({
        where: { id: briefing.id },
        include: {
          stories: {
            include: {
              story: {
                include: {
                  tweet: {
                    include: {
                      source: true,
                    },
                  },
                },
              },
            },
            orderBy: { position: "asc" },
          },
        },
      });
      
      if (briefingWithStories) {
        const analysis = analyzeBriefingContent(briefingWithStories.stories);
        const optimizedTitle = generateOptimizedHeadline(analysis, new Date());
        
        await prisma.briefing.update({
          where: { id: briefing.id },
          data: { title: optimizedTitle },
        });
      }
    }
    
    await prisma.$disconnect();
    
    return NextResponse.json({
      success: true,
      message: "RSS Briefing generation completed",
      briefing: {
        id: briefing.id,
        title: briefing.title,
        storiesCount: successfulStories,
        publishedAt: briefing.publishedAt,
      },
    });
  } catch (error) {
    console.error("RSS Briefing cron job failed:", error);
    await prisma.$disconnect();
    
    return NextResponse.json(
      {
        error: "Failed to generate RSS briefing",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}