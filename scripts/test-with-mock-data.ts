#!/usr/bin/env tsx

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { generateTerryComment } from "../src/lib/terry";
import { ITK_SOURCES } from "../src/lib/sources";

const prisma = new PrismaClient();

// Mock tweets for testing
const MOCK_TWEETS = [
  "BREAKING: Manchester United in advanced talks to sign midfielder from Real Madrid for £80m. Personal terms already agreed. Medical scheduled for next week. Here we go soon! 🔴⚪",
  "Arsenal have submitted a new bid for West Ham's Declan Rice. £105m package - £100m + £5m add-ons. Personal terms agreed on 5-year contract. Decision expected in next 48 hours. ⏳",
  "Chelsea are closing in on Brighton's Moises Caicedo. Fee around £100m agreed between clubs. Player keen on the move. Liverpool also interested but Chelsea leading the race. 🔵",
  "EXCLUSIVE: Liverpool have made contact with Real Madrid for Jude Bellingham. Initial discussions ongoing. Player's preference still unclear. More to follow... 🔴",
  "Newcastle United preparing £60m bid for AC Milan striker. Eddie Howe wants new attacking options. Italian club open to negotiations at the right price. ⚫⚪",
  "Tottenham close to agreeing deal for James Maddison from Leicester. Fee around £45m plus add-ons. Medical could happen this week if all goes to plan. ⚪",
  "Barcelona working on swap deal involving two players with Manchester City. Complex negotiations but both clubs optimistic. Details to be revealed soon. 🔵🔴",
  "PSG have entered the race for Harry Kane. Preparing massive offer to convince Tottenham. Bayern Munich still favorites but PSG not giving up. 💰",
  "Roma interested in bringing Romelu Lukaku back to Serie A. Jose Mourinho wants reunion with Belgian striker. Chelsea open to loan with obligation to buy. 🟡🔴",
  "Update: Medical completed successfully! Player will sign 5-year contract tomorrow morning. Official announcement expected by lunch time. Stay tuned! ✅",
];

async function testWithMockData() {
  try {
    console.log("🚀 Testing with mock data...\n");

    // 1. Clear existing data
    console.log("🗑️  Clearing existing data...");
    await prisma.briefingStory.deleteMany({});
    await prisma.story.deleteMany({});
    await prisma.tweet.deleteMany({});
    await prisma.briefing.deleteMany({});
    await prisma.source.deleteMany({});
    console.log("✅ Data cleared\n");

    // 2. Create sources
    console.log("👥 Creating sources...");
    for (const source of ITK_SOURCES) {
      await prisma.source.create({
        data: {
          name: source.name,
          handle: source.handle,
        },
      });
    }
    console.log("✅ Sources created\n");

    // 3. Create a briefing
    console.log("📰 Creating briefing...");
    const briefing = await prisma.briefing.create({
      data: {
        title: `Transfer News - ${new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
      },
    });
    console.log(`✅ Briefing created: ${briefing.title}\n`);

    // 4. Create mock tweets and stories
    console.log("🐦 Creating tweets and stories...");
    const sources = await prisma.source.findMany();
    let position = 0;

    for (let i = 0; i < MOCK_TWEETS.length && i < sources.length; i++) {
      const source = sources[i];
      const tweetContent = MOCK_TWEETS[i];

      // Create tweet
      const tweet = await prisma.tweet.create({
        data: {
          tweetId: `mock-${Date.now()}-${i}`,
          content: tweetContent,
          url: `https://twitter.com/${source.handle.replace("@", "")}/status/${Date.now()}${i}`,
          sourceId: source.id,
        },
      });

      // Generate Terry comment
      console.log(`\n💭 Getting Terry's take on ${source.name}'s tweet...`);
      const terryComment = await generateTerryComment(tweetContent);
      console.log(`Terry says: "${terryComment}"`);

      // Create story
      const story = await prisma.story.create({
        data: {
          tweetId: tweet.id,
          terryComment,
        },
      });

      // Add to briefing
      await prisma.briefingStory.create({
        data: {
          briefingId: briefing.id,
          storyId: story.id,
          position: position++,
        },
      });

      // Small delay to avoid rate limiting OpenAI
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`\n✅ Created ${position} stories\n`);

    // 5. Fetch and display the complete briefing
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

    console.log("📋 BRIEFING SUMMARY:");
    console.log("=".repeat(50));
    console.log(`Title: ${completeBriefing?.title}`);
    console.log(`Stories: ${completeBriefing?.stories.length}`);
    console.log(`Published: ${completeBriefing?.publishedAt}`);
    console.log("=".repeat(50));

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testWithMockData();
