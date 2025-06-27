/**
 * Test script for Wikimedia API
 */

import { fetchPlayerImage, fetchClubBadge } from "../src/lib/media/wikimediaApi";

async function testWikimediaAPI() {
  console.log("🔍 Testing Wikimedia API...\n");

  // Test player images
  const players = ["Cristiano Ronaldo", "Lionel Messi", "Erling Haaland", "Bukayo Saka"];
  
  console.log("📸 Testing player images:");
  for (const player of players) {
    try {
      const result = await fetchPlayerImage(player);
      console.log(`✅ ${player}:`, {
        source: result.source,
        url: result.url.substring(0, 60) + "...",
        dimensions: `${result.width}x${result.height}`
      });
    } catch (error) {
      console.error(`❌ Failed to fetch ${player}:`, error);
    }
  }

  console.log("\n🏆 Testing club badges:");
  const clubs = ["Arsenal", "Manchester United", "Real Madrid", "Barcelona"];
  
  for (const club of clubs) {
    try {
      const result = await fetchClubBadge(club);
      console.log(`✅ ${club}:`, {
        source: result.source,
        url: result.url.substring(0, 60) + "...",
        dimensions: `${result.width}x${result.height}`
      });
    } catch (error) {
      console.error(`❌ Failed to fetch ${club}:`, error);
    }
  }
}

// Run the test
testWikimediaAPI().catch(console.error);