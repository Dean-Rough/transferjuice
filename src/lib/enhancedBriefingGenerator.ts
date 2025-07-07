import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { generateTerryComment } from "./terry";

const prisma = new PrismaClient();

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

async function getOpenAI(): Promise<OpenAI> {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

async function generateEnhancedStory(tweets: any[]): Promise<EnhancedStory | null> {
  if (tweets.length === 0) return null;

  const openai = await getOpenAI();
  
  // Combine tweet content for analysis
  const combinedContent = tweets.map(t => `${t.source.name}: ${t.content}`).join("\n\n");
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional football transfer journalist creating cohesive transfer briefings. 
          Follow this structure EXACTLY:
          
          1. HEADLINE: One compelling sentence summarizing the main development
          2. CONTEXT_PARAGRAPH: 2-3 sentences explaining the current situation and why it matters now
          3. CAREER_CONTEXT: 2-3 sentences with key achievements, stats, and playing style
          4. TRANSFER_DYNAMICS: 3-4 sentences covering historical connections, current interest, and perspectives
          5. WIDER_IMPLICATIONS: 2-3 sentences on what this means for all parties and next steps
          
          Also extract any player statistics mentioned (age, goals, assists, trophies, etc.).
          
          Write in an authoritative but accessible style. Include specific numbers and facts.
          Each section should flow naturally into the next, creating a cohesive narrative.`
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
    
    // Generate Terry's take separately for better quality
    const terrysTake = await generateTerryComment(result.headline || combinedContent);
    
    return {
      headline: result.headline || "Transfer Update",
      contextParagraph: result.context_paragraph || "",
      careerContext: result.career_context || "",
      transferDynamics: result.transfer_dynamics || "",
      widerImplications: result.wider_implications || "",
      terrysTake,
      playerStats: result.player_stats || {},
      sources: tweets.map(t => t.source.name)
    };
  } catch (error) {
    console.error("Error generating enhanced story:", error);
    return null;
  }
}

export async function generateEnhancedBriefing() {
  console.log("Starting enhanced briefing generation...");

  try {
    // Get recent tweets that haven't been included in a briefing
    const recentTweets = await prisma.tweet.findMany({
      where: {
        stories: {
          none: {}
        },
        scrapedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        source: true
      },
      orderBy: {
        scrapedAt: 'desc'
      }
    });

    console.log(`Found ${recentTweets.length} unprocessed tweets`);

    // Group tweets by related topics (simple grouping by player names mentioned)
    const tweetGroups = groupTweetsByTopic(recentTweets);
    
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

    // Generate enhanced stories for each group
    let position = 0;
    for (const [topic, tweets] of Object.entries(tweetGroups)) {
      const enhancedStory = await generateEnhancedStory(tweets);
      
      if (enhancedStory) {
        // Create stories for each tweet in the group
        for (const tweet of tweets) {
          const story = await prisma.story.create({
            data: {
              tweetId: tweet.id,
              terryComment: enhancedStory.terrysTake,
              // Store enhanced content in metadata
              metadata: {
                headline: enhancedStory.headline,
                contextParagraph: enhancedStory.contextParagraph,
                careerContext: enhancedStory.careerContext,
                transferDynamics: enhancedStory.transferDynamics,
                widerImplications: enhancedStory.widerImplications,
                playerStats: enhancedStory.playerStats,
                groupTopic: topic
              }
            },
          });

          // Link story to briefing
          await prisma.briefingStory.create({
            data: {
              briefingId: briefing.id,
              storyId: story.id,
              position: position++,
            },
          });
        }
      }
    }

    // Return complete briefing
    const completeBriefing = await prisma.briefing.findUnique({
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

    console.log(`Enhanced briefing created with ${completeBriefing?.stories.length} stories`);
    return completeBriefing;
    
  } catch (error) {
    console.error("Error generating enhanced briefing:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Simple topic grouping - can be enhanced with NLP
function groupTweetsByTopic(tweets: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  
  // Common player name patterns
  const playerPatterns = [
    /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g, // First Last
    /\b([A-Z][a-z]+)\b(?=\s+to\s+)/g, // Name before "to"
  ];
  
  for (const tweet of tweets) {
    let assigned = false;
    const content = tweet.content.toLowerCase();
    
    // Check if tweet mentions any existing topics
    for (const [topic, group] of Object.entries(groups)) {
      if (content.includes(topic.toLowerCase())) {
        group.push(tweet);
        assigned = true;
        break;
      }
    }
    
    // If not assigned, try to extract a topic
    if (!assigned) {
      for (const pattern of playerPatterns) {
        const matches = tweet.content.match(pattern);
        if (matches && matches[0]) {
          const topic = matches[0];
          if (!groups[topic]) {
            groups[topic] = [];
          }
          groups[topic].push(tweet);
          assigned = true;
          break;
        }
      }
    }
    
    // If still not assigned, create a generic topic
    if (!assigned) {
      const genericTopic = `Update ${Object.keys(groups).length + 1}`;
      groups[genericTopic] = [tweet];
    }
  }
  
  return groups;
}