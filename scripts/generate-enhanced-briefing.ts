import { generateEnhancedBriefing } from "../src/lib/enhancedBriefingGenerator";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Starting enhanced briefing generation...");
  
  try {
    const briefing = await generateEnhancedBriefing();
    
    console.log("\n✅ Enhanced briefing generated successfully!");
    console.log(`Briefing ID: ${briefing?.id}`);
    console.log(`Title: ${briefing?.title}`);
    console.log(`Stories: ${briefing?.stories.length || 0}`);
    
    if (briefing?.stories && briefing.stories.length > 0) {
      console.log("\n📰 Story headlines:");
      briefing.stories.forEach((story, index) => {
        const metadata = story.story.metadata as any;
        console.log(`${index + 1}. ${metadata?.headline || "No headline"}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Failed to generate enhanced briefing:", error);
    process.exit(1);
  }
}

main();