/**
 * Demo RSS content mixing for Ronaldo-to-Arsenal story
 */

import { rssFetcher } from "../src/lib/partnerships/rssFetcher";
import { contentMixer } from "../src/lib/partnerships/contentMixer";

async function demoRSSBriefing() {
  console.log("🎭 TRANSFER JUICE - TERRY'S EVENING BRIEFING");
  console.log("==========================================\n");

  // Our single ITK tweet
  console.log("📱 BREAKING ITK NEWS:");
  console.log("--------------------");
  console.log("🚨 Cristiano Ronaldo has been offered to Arsenal!");
  console.log("The Portuguese superstar could leave Al-Nassr in January.");
  console.log("Mikel Arteta considering the shock move. More to follow... #AFC\n");

  console.log("💭 Terry's Commentary:");
  console.log("Right, so Ronaldo to Arsenal then. Because nothing says 'trust the process'");
  console.log("quite like signing a 39-year-old on wages that could fund a small nation's");
  console.log("healthcare system. Arteta's gone from wanting players who can press to");
  console.log("wanting one who needs a compress after 60 minutes.\n");

  // Fetch relevant partner content
  console.log("📰 MEANWHILE, IN FOOTBALL LAND...");
  console.log("--------------------------------");
  console.log("(Since that's literally all we've got on the transfer front...)\n");

  try {
    // Get quiet period content with Arsenal/Ronaldo context
    const partnerContent = await rssFetcher.getQuietPeriodContent({
      clubs: ["Arsenal", "Al-Nassr"],
      players: ["Cristiano Ronaldo"]
    }, 'mixed');

    if (partnerContent) {
      // Generate Terry's intro
      const terryIntro = rssFetcher.generateTerryIntro(partnerContent);
      console.log(`🎤 ${terryIntro}\n`);
      
      console.log(`📌 "${partnerContent.title}"`);
      console.log(`📝 ${partnerContent.content.substring(0, 300)}...`);
      console.log(`\n🔗 Read more at ${partnerContent.source.name}: ${partnerContent.url}`);
      
      // Additional context
      console.log("\n💭 Terry adds:");
      console.log("Perfect timing really - while we're all refreshing Twitter for");
      console.log("Fabrizio to drop a 'Here We Go', Planet Football reminds us that");
      console.log("Ronaldo's wages could literally fund entire football clubs.");
      console.log("Arsenal's wage structure in absolute shambles if this happens.\n");
    }

    // Try to get more content
    console.log("\n📻 FROM THE PODCAST CIRCUIT:");
    console.log("---------------------------");
    
    const podcasts = await rssFetcher.getPartnerContent(3, ["banter", "scandal"]);
    
    if (podcasts.length > 0) {
      podcasts.forEach((podcast, index) => {
        console.log(`\n${index + 1}. ${podcast.source.name}: "${podcast.title}"`);
        console.log(`   ${podcast.content.substring(0, 150)}...`);
      });
    } else {
      console.log("The podcasters are all too busy trying to work out how Arsenal");
      console.log("would fit Ronaldo into a team with Saka, Martinelli, and Jesus.");
      console.log("Spoiler: They can't.");
    }

    console.log("\n\n🏁 END OF BRIEFING");
    console.log("==================");
    console.log("That's all for now. Check back when someone actually signs something.");
    console.log("Until then, enjoy imagining Ronaldo doing the Arteta clap at the Emirates.\n");

  } catch (error) {
    console.error("❌ Failed to fetch partner content:", error);
  }
}

// Run the demo
demoRSSBriefing().catch(console.error);