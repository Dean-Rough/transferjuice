/**
 * Create a minimal briefing to test RSS content mixing
 */

import { prisma } from "../src/lib/prisma";
import { generateBriefing } from "../src/briefing-generator/orchestrator";
import { ITKSource, Tweet } from "@prisma/client";

async function createMinimalBriefing() {
  console.log("🧪 Creating minimal briefing to test RSS mixing...\n");

  try {
    // First, ensure we have a test ITK source
    let testSource: ITKSource;
    const existingSource = await prisma.iTKSource.findFirst({
      where: { username: "TestRSSDemo" }
    });

    if (existingSource) {
      testSource = existingSource;
    } else {
      testSource = await prisma.iTKSource.create({
        data: {
          name: "Test RSS Demo",
          username: "TestRSSDemo",
          handle: "@testrss",
          tier: 3,
          region: "UK",
          league: "PREMIER_LEAGUE",
          isActive: true,
          reliability: 0.6,
          averageAccuracy: 0.6,
          totalReports: 1,
          successfulReports: 0
        }
      });
    }

    // Create a minimal tweet about Ronaldo
    const tweet = await prisma.tweet.create({
      data: {
        id: `test-ronaldo-${Date.now()}`,
        text: "🚨 BREAKING: Cristiano Ronaldo offered to Arsenal! Sources confirm initial contact made. Al-Nassr willing to negotiate. Arteta interested but wage demands are astronomical. More to follow... #AFC #TransferNews",
        authorId: testSource.username,
        authorName: testSource.name,
        authorUsername: testSource.username,
        authorHandle: testSource.handle,
        createdAt: new Date(),
        metrics: {
          replyCount: 234,
          retweetCount: 567,
          likeCount: 2345,
          viewCount: 45678
        },
        url: `https://twitter.com/${testSource.username}/status/${Date.now()}`,
        region: "UK",
        league: "PREMIER_LEAGUE",
        clubs: ["Arsenal", "Al-Nassr"],
        players: ["Cristiano Ronaldo"],
        transferType: "RUMOUR",
        tier: 3,
        isReliable: false,
        sourceId: testSource.id
      }
    });

    console.log("✅ Created test tweet:", tweet.id);
    console.log("📝 Content:", tweet.text.substring(0, 100) + "...\n");

    // Now generate a briefing - with only one tweet, it should trigger RSS mixing
    console.log("🚀 Generating briefing (should trigger RSS content)...\n");
    
    const result = await generateBriefing({
      testMode: false, // Generate real briefing
      timestamp: new Date()
    });

    console.log("✅ Briefing generated successfully!");
    console.log(`📰 Slug: ${result.briefing.slug}`);
    console.log(`⏱️ Duration: ${result.stats.duration}ms`);
    console.log(`📊 Tweets processed: ${result.stats.tweetsProcessed}`);
    
    // Check if partner content was included
    const content = result.briefing.content as any;
    const hasPartnerContent = content.some((section: any) => 
      section.type === 'partner' || 
      section.content?.includes('partner-content') ||
      section.content?.includes('Planet Football') ||
      section.content?.includes('SportBible')
    );

    console.log(`\n🤝 Partner content included: ${hasPartnerContent ? 'YES ✅' : 'NO ❌'}`);

    console.log(`\n🔗 View briefing at: http://localhost:4433/briefings/${result.briefing.slug}`);

    // Clean up test tweet
    await prisma.tweet.delete({
      where: { id: tweet.id }
    });

  } catch (error) {
    console.error("❌ Failed to create briefing:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run it
createMinimalBriefing().catch(console.error);