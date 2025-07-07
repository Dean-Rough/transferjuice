import { PrismaClient } from "@prisma/client";
import { generateDailySummaryHTML } from "../src/lib/dailySummaryGenerator";
import { generateTerryQuip } from "../src/lib/golbyNarrativeGenerator";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function generateDailySummary() {
  try {
    console.log("📊 Generating Daily Transfer Summary...\n");
    
    // Generate the HTML briefing using the new generator
    const summaryBriefing = await generateDailySummaryHTML(24);
    
    // Get summary stats from metadata for console output
    const summaryData = summaryBriefing.metadata.summaryData;
    
    console.log("=== DAILY TRANSFER SUMMARY ===");
    console.log(`Date: ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
    console.log(`Total Stories: ${summaryData.totalStories}\n`);
    
    console.log("📈 STATISTICS:");
    console.log(`• Completed deals: ${summaryData.completed.length}`);
    console.log(`• Ongoing negotiations: ${summaryData.negotiating.length}`);
    console.log(`• Contract extensions: ${summaryData.contracts.length}`);
    console.log(`• Rejected moves: ${summaryData.rejected.length}`);
    console.log(`• Total fees: £${summaryData.totalFees}m`);
    
    // Create a special briefing for the daily summary
    const briefing = await prisma.briefing.create({
      data: {
        title: summaryBriefing.title,
        publishedAt: new Date()
      }
    });
    
    // Create summary story with editorial source
    const source = await prisma.source.upsert({
      where: { handle: "TransferJuice" },
      update: {},
      create: {
        name: "TransferJuice Editorial",
        handle: "TransferJuice"
      }
    });
    
    const tweet = await prisma.tweet.create({
      data: {
        tweetId: `daily-summary-${briefing.id}`,
        content: `Daily Transfer Summary: ${summaryData.completed.length} completed, ${summaryData.negotiating.length} ongoing, £${summaryData.totalFees}m total`,
        url: `https://transferjuice.com/briefing/${briefing.id}`,
        sourceId: source.id,
        scrapedAt: new Date()
      }
    });
    
    // Generate Terry comment about the day's activity
    const terryComment = summaryData.totalFees > 100 
      ? `£${summaryData.totalFees}m spent in 24 hours. At this rate, the entire GDP of Luxembourg will be in Jorge Mendes' bank account by February.`
      : summaryData.totalStories > 20
      ? `${summaryData.totalStories} transfer stories today. That's more speculation than a Bitcoin convention.`
      : `Quiet day with only ${summaryData.totalStories} stories. Someone check if Fabrizio Romano's still breathing.`;
    
    const story = await prisma.story.create({
      data: {
        tweetId: tweet.id,
        terryComment,
        metadata: {
          type: 'daily_summary',
          content: summaryBriefing.content,
          keyPlayers: summaryBriefing.metadata.keyPlayers,
          keyClubs: summaryBriefing.metadata.keyClubs,
          mainImage: summaryBriefing.metadata.mainImage,
          summaryData: summaryData
        }
      }
    });
    
    await prisma.briefingStory.create({
      data: {
        briefingId: briefing.id,
        storyId: story.id,
        position: 0
      }
    });
    
    console.log(`\n✅ Daily summary saved to database`);
    console.log(`Briefing ID: ${briefing.id}`);
    
  } catch (error) {
    console.error("❌ Error generating daily summary:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

generateDailySummary();