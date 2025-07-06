import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

// Mock enhanced story data for demonstration
const mockEnhancedStory = {
  headline: "Thomas Müller Dismisses Manchester United Move as 'Not the Right Match'",
  contextParagraph: "Bayern Munich legend Thomas Müller has definitively ruled out a move to Manchester United, stating both parties would be unhappy with such a transfer. The 35-year-old's contract expires this summer after a decorated 17-year stay in Munich.",
  careerContext: "Müller's remarkable Bayern career has yielded 250 goals and 33 major trophies, establishing him as one of Germany's most successful players. The 2014 World Cup winner revolutionized the 'raumdeuter' role and became synonymous with Bayern's golden era under multiple managers.",
  transferDynamics: "While United previously showed interest during Louis van Gaal's tenure—when the Dutch manager worked with a young Müller at Bayern—the player has grown skeptical of the Premier League giants. His blunt assessment that 'they won't have fun and I won't have fun' reflects United's current struggles and his desire for a more suitable final chapter.",
  widerImplications: "Müller's rejection highlights United's continued challenges in attracting top-tier talent despite their efforts in the transfer market. With MLS clubs Inter Miami and LA Galaxy leading the race alongside interest from Fiorentina and Fenerbahçe, the German appears set for a more adventurous conclusion to his illustrious career.",
  playerStats: {
    age: 35,
    currentClub: "Bayern Munich",
    goals: 250,
    trophies: ["Bundesliga", "Champions League", "World Cup"],
    marketValue: "Free transfer",
    contractUntil: "Summer 2025"
  }
};

async function createMockEnhancedBriefing() {
  try {
    console.log("🚀 Creating mock enhanced briefing...");
    
    // Get the test tweets we created
    const testTweets = await prisma.tweet.findMany({
      where: {
        source: {
          name: {
            contains: "Test"
          }
        }
      },
      include: {
        source: true
      },
      orderBy: {
        scrapedAt: 'desc'
      },
      take: 3
    });

    if (testTweets.length === 0) {
      console.log("❌ No test tweets found. Run npm run briefing:enhanced first.");
      return;
    }

    console.log(`Found ${testTweets.length} test tweets`);

    // Create briefing
    const briefing = await prisma.briefing.create({
      data: {
        title: `Enhanced Transfer Briefing - ${new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
      },
    });

    // Create enhanced stories for each tweet
    let position = 0;
    for (const tweet of testTweets) {
      const story = await prisma.story.create({
        data: {
          tweetId: tweet.id,
          terryComment: "Müller basically telling United 'thanks but no thanks' in the most German way possible. Fair play to him for being honest about it being a car crash of a match.",
          metadata: mockEnhancedStory
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

    console.log("✅ Mock enhanced briefing created successfully!");
    console.log(`Briefing ID: ${briefing.id}`);
    console.log(`Title: ${briefing.title}`);
    console.log(`Stories: ${position}`);
    
    console.log("\n🌐 Now check your homepage at http://localhost:4433");
    console.log("You should see the enhanced briefing with:");
    console.log("- Clear headline");
    console.log("- Structured narrative");
    console.log("- Player statistics");
    console.log("- Career context");
    console.log("- Transfer dynamics");
    console.log("- Wider implications");
    console.log("- Terry's commentary");
    
  } catch (error) {
    console.error("❌ Failed to create mock enhanced briefing:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createMockEnhancedBriefing();