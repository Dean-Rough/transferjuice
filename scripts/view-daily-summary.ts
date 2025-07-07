import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function viewDailySummary() {
  try {
    // Find the latest daily summary
    const latestSummary = await prisma.briefing.findFirst({
      where: {
        title: {
          contains: "Daily Transfer Summary"
        }
      },
      include: {
        stories: {
          include: {
            story: {
              include: {
                tweet: {
                  include: {
                    source: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    if (!latestSummary) {
      console.log("No daily summary found");
      return;
    }

    console.log("\n📊 Latest Daily Summary");
    console.log("=====================================");
    console.log(`ID: ${latestSummary.id}`);
    console.log(`Title: ${latestSummary.title}`);
    console.log(`Published: ${latestSummary.publishedAt}`);
    console.log(`Stories: ${latestSummary.stories.length}`);

    if (latestSummary.stories.length > 0) {
      const story = latestSummary.stories[0].story;
      const metadata = story.metadata as any;
      
      console.log("\n📈 Summary Stats:");
      if (metadata.summaryData) {
        console.log(`Total Stories: ${metadata.summaryData.totalStories}`);
        console.log(`Completed: ${metadata.summaryData.completed?.length || 0}`);
        console.log(`Negotiating: ${metadata.summaryData.negotiating?.length || 0}`);
        console.log(`Total Fees: £${metadata.summaryData.totalFees}m`);
      }
      
      console.log("\n💬 Terry's Comment:");
      console.log(story.terryComment);
      
      console.log("\n🔗 View at:");
      console.log(`http://localhost:4433/briefing/${latestSummary.id}`);
    }

  } catch (error) {
    console.error("Error viewing daily summary:", error);
  } finally {
    await prisma.$disconnect();
  }
}

viewDailySummary();