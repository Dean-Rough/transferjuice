import { PrismaClient } from "@prisma/client";
import { TwitterScraper } from "./scraper";
import { generateTerryComment } from "./terry";
import { ITK_SOURCES } from "./sources";

const prisma = new PrismaClient();

export async function generateBriefing() {
  console.log("Starting briefing generation...");

  const scraper = new TwitterScraper();

  try {
    // 1. Initialize scraper
    await scraper.initialize();

    // 2. Scrape all sources (returns empty for now due to Twitter auth requirements)
    const tweets = await scraper.scrapeAllSources();
    console.log(`Scraped ${tweets.length} tweets`);

    // 3. Save sources to database if they don't exist
    for (const source of ITK_SOURCES) {
      await prisma.source.upsert({
        where: { handle: source.handle },
        update: {},
        create: {
          name: source.name,
          handle: source.handle,
        },
      });
    }

    // 4. Create briefing
    const briefing = await prisma.briefing.create({
      data: {
        title: `Transfer News - ${new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
      },
    });

    // For now, since we can't scrape real tweets, we'll create a briefing
    // with a note about needing Twitter authentication
    console.log("Note: Twitter scraping requires authentication setup");
    console.log(`Briefing created with ID: ${briefing.id}`);

    // 5. Return empty briefing for now
    const completeBriefing = await prisma.briefing.findUnique({
      where: { id: briefing.id },
      include: {
        stories: {
          include: {
            story: {
              include: {
                tweet: {
                  include: {
                    source: true,
                  },
                },
              },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    });

    return completeBriefing;
  } catch (error) {
    console.error("Error generating briefing:", error);
    throw error;
  } finally {
    await scraper.close();
    await prisma.$disconnect();
  }
}
