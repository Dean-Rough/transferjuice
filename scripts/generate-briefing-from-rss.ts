import { PrismaClient } from "@prisma/client";
import { generateTerryComment } from "../src/lib/terry";
import { generateOptimizedHeadline, analyzeBriefingContent } from "../src/lib/seoOptimizer";
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

interface PlayerStats {
  age?: number;
  currentClub?: string;
  position?: string;
  goals?: number;
  assists?: number;
  appearances?: number;
  trophies?: string[];
  marketValue?: string;
  contractUntil?: string;
}

interface EnhancedStory {
  headline: string;
  contextParagraph: string;
  careerContext: string;
  transferDynamics: string;
  widerImplications: string;
  terrysTake: string;
  playerStats?: PlayerStats;
  sources: string[];
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

// Group related transfer stories by player/topic
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

// Generate enhanced story using OpenAI or fallback
async function generateEnhancedStory(items: RSSItem[], openai: OpenAI | null): Promise<EnhancedStory | null> {
  // Sort by date to get chronological order
  items.sort((a, b) => new Date(a.date_published).getTime() - new Date(b.date_published).getTime());
  
  const combinedContent = items.map(item => 
    `${item.authors[0]?.name || "Source"} (${new Date(item.date_published).toLocaleTimeString()}): ${item.title}\n${item.content_text}`
  ).join("\n\n");
  
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are a professional football transfer journalist creating cohesive transfer briefings. 
            Analyze the provided transfer updates and create a single cohesive story following this EXACT structure:
            
            {
              "headline": "One compelling sentence summarizing the main development",
              "contextParagraph": "2-3 sentences explaining the current situation and why it matters now",
              "careerContext": "2-3 sentences with key achievements, stats, and playing style",
              "transferDynamics": "3-4 sentences covering historical connections, current interest, deal progress, and perspectives",
              "widerImplications": "2-3 sentences on what this means for all parties and next steps",
              "playerStats": {
                "age": number or null,
                "currentClub": "string or null",
                "position": "string or null",
                "goals": number or null,
                "assists": number or null,
                "appearances": number or null,
                "trophies": ["array of major trophies"] or null,
                "marketValue": "string or null",
                "contractUntil": "string or null"
              }
            }
            
            Extract any player statistics mentioned. Ensure each section flows naturally into the next.
            If multiple updates exist, synthesize them into one coherent narrative.`
          },
          {
            role: "user",
            content: `Create a cohesive briefing from these transfer updates:\n\n${combinedContent}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || "{}");
      
      // Generate Terry's take separately
      const terrysTake = await generateTerryComment(result.headline || items[0].title);
      
      return {
        ...result,
        terrysTake,
        sources: [...new Set(items.map(item => item.authors[0]?.name || "Unknown"))]
      };
    } catch (error) {
      console.error("Error with OpenAI:", error);
      // Fall through to fallback
    }
  }
  
  // Fallback: Create structured content without AI
  return generateFallbackStory(items);
}

// Fallback story generation without AI
function generateFallbackStory(items: RSSItem[]): EnhancedStory {
  const latestItem = items[items.length - 1];
  const sources = [...new Set(items.map(item => item.authors[0]?.name || "Unknown"))];
  
  // Extract key information
  const headline = latestItem.title.replace(/^[🚨🔴⚪️💣❤️🤍]+\s*/, "");
  
  // Combine all updates chronologically
  const contextParagraph = items.length > 1 
    ? `${latestItem.content_text.split('\n')[0]} This follows earlier reports from ${sources.join(", ")} regarding the developing situation.`
    : latestItem.content_text.split('\n')[0];
  
  // Extract player and club info
  const allText = items.map(i => i.content_text).join(" ");
  const playerMatch = headline.match(/([A-Z][a-z]+ [A-Z][a-zöäüßéè]+)/);
  const playerName = playerMatch ? playerMatch[0] : "The player";
  
  // Extract stats from text
  const stats = extractStatsFromText(allText);
  
  const careerContext = `${playerName} is ${stats.age ? `a ${stats.age}-year-old` : "an experienced"} ${stats.position || "player"} ${stats.currentClub ? `currently at ${stats.currentClub}` : ""}. ${stats.goals ? `The player has scored ${stats.goals} goals` : "Known for consistent performances"} and ${stats.trophies && stats.trophies.length > 0 ? `has won major honours including ${stats.trophies.join(", ")}` : "brings valuable experience"}.`;
  
  const transferDynamics = generateTransferDynamicsFromText(allText, items);
  
  const widerImplications = `This transfer would represent a significant move in the current window. ${items.length > 1 ? "With multiple sources reporting on the situation, " : ""}The coming days will be crucial in determining whether this deal reaches completion.`;
  
  return {
    headline,
    contextParagraph,
    careerContext,
    transferDynamics,
    widerImplications,
    terrysTake: "Terry's sardonic take on this transfer saga - another day, another millionaire moving between millionaire clubs. The beautiful game, eh?",
    playerStats: stats,
    sources
  };
}

function extractStatsFromText(text: string): PlayerStats {
  const stats: PlayerStats = {};
  
  // Age
  const ageMatch = text.match(/(\d{2})[\s-]?y(?:ea)?r[\s-]?old|aged?\s+(\d{2})/i);
  if (ageMatch) {
    stats.age = parseInt(ageMatch[1] || ageMatch[2]);
  }
  
  // Current club
  const clubMatch = text.match(/(?:currently at|from|of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
  if (clubMatch) {
    stats.currentClub = clubMatch[1];
  }
  
  // Position
  const positionMatch = text.match(/\b(striker|midfielder|defender|goalkeeper|winger|forward|centre-back|left-back|right-back)\b/i);
  if (positionMatch) {
    stats.position = positionMatch[1];
  }
  
  // Goals
  const goalsMatch = text.match(/(\d+)\s+goals?/);
  if (goalsMatch) {
    stats.goals = parseInt(goalsMatch[1]);
  }
  
  // Contract
  const contractMatch = text.match(/until\s+(\d{4})|(\d{4})\s+contract/);
  if (contractMatch) {
    stats.contractUntil = contractMatch[1] || contractMatch[2];
  }
  
  // Market value
  const feeMatch = text.match(/[€£](\d+)m(?:illion)?/);
  if (feeMatch) {
    stats.marketValue = feeMatch[0];
  }
  
  return stats;
}

function generateTransferDynamicsFromText(text: string, items: RSSItem[]): string {
  const hasAgreement = /agreement|agreed|deal reached|here we go/i.test(text);
  const hasPersonalTerms = /personal terms|contract agreed/i.test(text);
  const hasFee = /[€£]\d+m/i.test(text);
  const isAdvanced = /advanced talks|close to|finalizing/i.test(text);
  
  let dynamics = "";
  
  if (hasAgreement) {
    dynamics += "An agreement has been reached between the clubs. ";
  } else if (isAdvanced) {
    dynamics += "Negotiations are at an advanced stage. ";
  } else {
    dynamics += "Talks are ongoing between the parties involved. ";
  }
  
  if (hasPersonalTerms) {
    dynamics += "Personal terms have been agreed with the player. ";
  }
  
  if (hasFee) {
    const feeMatch = text.match(/[€£](\d+)m/);
    if (feeMatch) {
      dynamics += `The transfer fee is reported to be around ${feeMatch[0]}. `;
    }
  }
  
  if (items.length > 1) {
    dynamics += `Multiple sources have reported on this developing situation over the past ${items.length} updates. `;
  }
  
  return dynamics || "The transfer negotiations continue to develop with various parties working to reach an agreement.";
}

async function generateEnhancedBriefingFromRSS(feedUrl: string) {
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
    
    // Group related stories
    const groupedStories = groupRelatedStories(recentItems);
    console.log(`Grouped into ${groupedStories.size} story groups`);
    
    // Initialize OpenAI (may be null if no API key)
    const openai = await getOpenAI();
    
    // Create briefing with placeholder title
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
    
    // Process each group
    for (const [topic, items] of groupedStories) {
      // Skip single ungrouped items unless they're significant
      if (topic === "other-news" && items.length < 2) continue;
      
      console.log(`\nProcessing ${topic} with ${items.length} items`);
      
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
            terryComment: enhancedStory.terrysTake,
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
        console.log(`✅ Created story: ${enhancedStory.headline}`);
      }
    }
    
    // Update briefing with SEO-optimized title after analyzing content
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
    
    if (briefingWithStories && briefingWithStories.stories.length > 0) {
      const analysis = analyzeBriefingContent(briefingWithStories.stories);
      const optimizedTitle = generateOptimizedHeadline(analysis, new Date());
      
      await prisma.briefing.update({
        where: { id: briefing.id },
        data: { title: optimizedTitle },
      });
      
      console.log(`\n✅ Created briefing with ${successfulStories} stories`);
      console.log(`Briefing ID: ${briefing.id}`);
      console.log(`Optimized Title: ${optimizedTitle}`);
    }
    
    return briefing;
    
  } catch (error) {
    console.error("❌ Error generating enhanced briefing:", error);
    throw error;
  }
}

// Main execution
async function main() {
  const feedUrl = process.argv[2] || "https://rss.app/feeds/v1.1/_zMqruZvtL6XIMNVY.json";
  
  console.log("🚀 Starting enhanced briefing generation from RSS...");
  console.log(`Feed URL: ${feedUrl}`);
  
  try {
    const briefing = await generateEnhancedBriefingFromRSS(feedUrl);
    
    console.log("\n✅ Enhanced briefing generated successfully!");
    console.log("Title:", briefing.title);
    console.log("Stories:", briefing.stories.length);
    console.log("\n🌐 Check your homepage at http://localhost:4433");
    
  } catch (error) {
    console.error("❌ Failed to generate enhanced briefing:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();