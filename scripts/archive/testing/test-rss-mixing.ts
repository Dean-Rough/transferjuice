/**
 * Test RSS content mixing with minimal ITK content
 * Simulates a quiet period with just one Ronaldo-to-Arsenal tweet
 */

import { generateBriefing } from "../src/briefing-generator/orchestrator";
import { prisma } from "../src/lib/prisma";
import { logger } from "../src/lib/logger";

async function testRSSMixing() {
  console.log("🧪 Testing RSS content mixing with Ronaldo-to-Arsenal story...\n");

  try {
    // First, let's create a minimal tweet in the database
    const mockTweet = {
      id: `test-ronaldo-${Date.now()}`,
      text: "🚨 BREAKING: Cristiano Ronaldo has been offered to Arsenal! The Portuguese superstar could leave Al-Nassr in January. Mikel Arteta considering the shock move. More to follow... #AFC #Ronaldo",
      authorId: "test-itk",
      authorName: "Test ITK",
      authorUsername: "testitk", 
      authorHandle: "@testitk",
      createdAt: new Date(),
      metrics: {
        replyCount: 100,
        retweetCount: 500,
        likeCount: 2000,
        viewCount: 50000
      },
      region: "UK",
      league: "PREMIER_LEAGUE",
      clubs: ["Arsenal"],
      players: ["Cristiano Ronaldo"],
      transferType: "RUMOUR",
      tier: 3,
      isReliable: false
    };

    // Save to database
    await prisma.tweet.create({
      data: mockTweet as any
    });

    console.log("✅ Created test tweet about Ronaldo to Arsenal\n");

    // Now generate a briefing - with only one story, it should trigger partner content
    console.log("🚀 Generating briefing (this should trigger RSS content mixing)...\n");
    
    const result = await generateBriefing({
      testMode: true,
      debugMode: true,
      timestamp: new Date()
    });

    console.log("\n📊 Briefing Generation Results:");
    console.log("================================");
    console.log(`✅ Briefing created: ${result.briefing.slug}`);
    console.log(`📰 Tweets processed: ${result.stats.tweetsProcessed}`);
    console.log(`🎭 Terry score: ${result.stats.terryScore}`);
    console.log(`⏱️ Duration: ${result.stats.duration}ms`);

    // Check if partner content was mixed
    const briefingContent = result.briefing.content as any;
    const hasPartnerContent = briefingContent.some((section: any) => 
      section.type === 'partner' || section.content?.includes('partner-content')
    );

    console.log(`\n🤝 Partner content mixed: ${hasPartnerContent ? 'YES ✅' : 'NO ❌'}`);

    if (hasPartnerContent) {
      console.log("\n📋 Partner Content Details:");
      briefingContent.forEach((section: any, index: number) => {
        if (section.type === 'partner' || section.content?.includes('partner-content')) {
          console.log(`  Section ${index + 1}: ${section.title || 'Partner Content'}`);
          if (section.metadata?.partnerAttribution) {
            console.log(`  Attribution: ${section.metadata.partnerAttribution}`);
          }
        }
      });
    }

    // Clean up test data
    await prisma.tweet.delete({
      where: { id: mockTweet.id }
    });

    console.log("\n✅ Test completed successfully!");
    console.log(`\n🔗 View briefing at: http://localhost:4433/briefings/${result.briefing.slug}`);

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRSSMixing().catch(console.error);