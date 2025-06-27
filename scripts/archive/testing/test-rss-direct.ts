/**
 * Direct test of RSS fetching and partner content mixing
 */

import { rssFetcher } from "../src/lib/partnerships/rssFetcher";
import { contentMixer } from "../src/lib/partnerships/contentMixer";

async function testRSSDirectly() {
  console.log("🧪 Testing RSS feeds directly...\n");

  try {
    // Test 1: Fetch content from RSS sources
    console.log("📡 Fetching partner content from RSS feeds...");
    const partnerContent = await rssFetcher.getPartnerContent(5);
    
    console.log(`\n✅ Fetched ${partnerContent.length} items from RSS feeds:\n`);
    partnerContent.forEach((content, index) => {
      console.log(`${index + 1}. ${content.source.name}: ${content.title}`);
      console.log(`   URL: ${content.url}`);
      console.log(`   Category: ${content.category}`);
      console.log(`   Published: ${content.publishedAt.toISOString()}\n`);
    });

    // Test 2: Get content for quiet period with Arsenal/Ronaldo context
    console.log("\n🔍 Testing quiet period content with Arsenal/Ronaldo context...");
    const quietPeriodContent = await rssFetcher.getQuietPeriodContent({
      clubs: ["Arsenal", "Manchester United", "Al-Nassr"],
      players: ["Cristiano Ronaldo", "Bukayo Saka", "Martin Odegaard"]
    }, 'mixed');

    if (quietPeriodContent) {
      console.log("\n✅ Found relevant quiet period content:");
      console.log(`Title: ${quietPeriodContent.title}`);
      console.log(`Source: ${quietPeriodContent.source.name}`);
      console.log(`Content: ${quietPeriodContent.content.substring(0, 200)}...`);
      
      // Generate Terry intro
      const terryIntro = rssFetcher.generateTerryIntro(quietPeriodContent);
      console.log(`\nTerry's intro: ${terryIntro}`);
    }

    // Test 3: Check content mixing decision
    console.log("\n🤔 Testing content mixing decision...");
    
    // Simulate minimal feed items (just one Ronaldo story)
    const minimalFeed = [{
      id: "ronaldo-1",
      type: "itk",
      content: "Ronaldo to Arsenal",
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      tags: {
        clubs: ["Arsenal"],
        players: ["Cristiano Ronaldo"],
        sources: ["Test ITK"]
      }
    }];

    const mixingDecision = contentMixer.shouldMixPartnerContent(minimalFeed as any);
    console.log(`\nShould mix partner content: ${mixingDecision.shouldMixContent ? 'YES ✅' : 'NO ❌'}`);
    console.log(`Reason: ${mixingDecision.reason}`);
    console.log(`Next check in: ${mixingDecision.nextCheckIn} minutes`);

    // Test 4: Get suggested content
    if (mixingDecision.shouldMixContent) {
      console.log("\n📰 Getting suggested partner content...");
      const suggested = await contentMixer.getSuggestedContent(minimalFeed as any, ["news", "analysis"]);
      
      if (suggested) {
        console.log(`\n✅ Suggested content:`);
        console.log(`Title: ${suggested.title}`);
        console.log(`Source: ${suggested.source.name}`);
        console.log(`Attribution: ${suggested.source.attributionTemplate}`);
      }
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testRSSDirectly().catch(console.error);