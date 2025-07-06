import { PrismaClient } from "@prisma/client";
import { generateTerryComment } from "../src/lib/terry";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function createTestData() {
  console.log("Creating test data for enhanced briefing...");

  try {
    // Create test sources with unique names
    const source1 = await prisma.source.upsert({
      where: { handle: "@FabrizioRomanoTest" },
      update: {},
      create: {
        name: "Fabrizio Romano Test",
        handle: "@FabrizioRomanoTest",
      },
    });

    const source2 = await prisma.source.upsert({
      where: { handle: "@DavidOrnsteinTest" },
      update: {},
      create: {
        name: "David Ornstein Test",
        handle: "@DavidOrnsteinTest",
      },
    });

    // Create test tweets about a cohesive story (similar to the Müller article)
    const tweets = [
      {
        content: "BREAKING: Manchester United have made contact with Bayern Munich regarding Thomas Müller. The 35-year-old's contract expires this summer and United are exploring the possibility. Initial talks have taken place. 🔴🇩🇪 #MUFC",
        sourceId: source1.id,
      },
      {
        content: "Thomas Müller on Manchester United links: 'I thought about it years ago when Van Gaal was there. Now? I'm not the right guy for them and they're not the right club for me. They won't have fun and I won't have fun!' Müller will leave Bayern after 17 years, 250 goals, 33 trophies.",
        sourceId: source2.id,
      },
      {
        content: "More on Müller: MLS clubs showing strong interest, with Inter Miami and LA Galaxy leading the race. Fiorentina and Fenerbahçe also monitoring. Bayern legend wants one last adventure after decorated career. Decision expected by end of January.",
        sourceId: source1.id,
      },
    ];

    // Create tweets
    const createdTweets = [];
    for (const tweet of tweets) {
      const created = await prisma.tweet.create({
        data: {
          tweetId: `test-enhanced-${Date.now()}-${Math.random()}`,
          content: tweet.content,
          url: `https://twitter.com/test/status/${Date.now()}`,
          sourceId: tweet.sourceId,
        },
      });
      createdTweets.push(created);
      console.log(`Created test tweet: ${created.id}`);
    }

    return createdTweets;
  } catch (error) {
    console.error("Error creating test data:", error);
    throw error;
  }
}

async function testEnhancedBriefing() {
  try {
    // Create test data
    await createTestData();
    
    console.log("\n📝 Test data created. Now you can:");
    console.log("1. Call the enhanced briefing API: POST /api/briefings/generate-enhanced");
    console.log("2. Or run: npm run briefing:generate-enhanced (after adding the script)");
    console.log("\nThe enhanced briefing will create a cohesive story from these related tweets!");
    
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testEnhancedBriefing();