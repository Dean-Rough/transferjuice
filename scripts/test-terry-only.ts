#!/usr/bin/env tsx

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { generateTerryComment } from "../src/lib/terry";

const TEST_TWEETS = [
  "BREAKING: Manchester United in advanced talks to sign midfielder from Real Madrid for £80m. Personal terms already agreed. Medical scheduled for next week. Here we go soon! 🔴⚪",
  "Arsenal have submitted a new bid for West Ham's Declan Rice. £105m package - £100m + £5m add-ons. Personal terms agreed on 5-year contract. Decision expected in next 48 hours. ⏳",
  "Chelsea are closing in on Brighton's Moises Caicedo. Fee around £100m agreed between clubs. Player keen on the move. Liverpool also interested but Chelsea leading the race. 🔵",
  "Newcastle United preparing £60m bid for AC Milan striker. Eddie Howe wants new attacking options. Italian club open to negotiations at the right price. ⚫⚪",
  "Update: Medical completed successfully! Player will sign 5-year contract tomorrow morning. Official announcement expected by lunch time. Stay tuned! ✅",
];

async function testTerry() {
  console.log("🎭 Testing Terry's Commentary Engine\n");
  console.log("=".repeat(60));

  for (const tweet of TEST_TWEETS) {
    console.log("\n📱 TWEET:");
    console.log(tweet);

    console.log("\n💭 Generating Terry's comment...");
    try {
      const comment = await generateTerryComment(tweet);
      console.log("\n🎯 TERRY SAYS:");
      console.log(`"${comment}"`);
    } catch (error) {
      console.error("Error:", error);
    }

    console.log("\n" + "-".repeat(60));

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  console.log("\n✅ Test complete!");
}

testTerry();
