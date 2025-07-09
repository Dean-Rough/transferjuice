import { PrismaClient } from "@prisma/client";
import { TwitterScraper } from "./scraper";
import { ITK_SOURCES } from "./sources";
import {
  extractTransferInfo,
  generateStoryHash,
  findExistingStory,
  updateExistingStory,
  shouldUpdateStory,
} from "./storyDeduplication";
import {
  gatherTransferContext,
  getWikipediaHeaderImage,
} from "./dataSourceIntegration";
import {
  generateGolbyArticle,
  generateGolbyUpdate,
  validateGolbyVoice,
} from "./golbyArticleGenerator";

const prisma = new PrismaClient();

export interface ProcessedStory {
  id: string;
  headline: string;
  articleContent: string;
  headerImage: string | null;
  tweet: any;
  source: any;
  isUpdate: boolean;
  updateCount: number;
}

// Process a single tweet into a story
async function processTweet(tweet: any): Promise<ProcessedStory | null> {
  try {
    // Extract transfer information
    const transferInfo = extractTransferInfo(tweet.content);
    if (!transferInfo) {
      console.log(`Could not extract transfer info from tweet: ${tweet.id}`);
      return null;
    }

    // Generate story hash for deduplication
    const storyHash = generateStoryHash(transferInfo);

    // Check if story already exists
    const existingStory = await findExistingStory(storyHash);

    if (existingStory) {
      // Check if we should update the story
      if (!shouldUpdateStory(existingStory, tweet.content)) {
        console.log(
          `Story already exists and doesn't need update: ${transferInfo.player}`,
        );
        return null;
      }

      // Generate update content
      console.log(`Updating existing story: ${transferInfo.player}`);
      const context = await gatherTransferContext(
        transferInfo.player,
        transferInfo.fromClub,
        transferInfo.toClub,
      );

      const updateText = await generateGolbyUpdate(
        tweet.content,
        existingStory.articleContent || "",
      );

      // Append update to existing article
      const updatedContent = existingStory.articleContent + "\n\n" + updateText;

      await updateExistingStory(existingStory.id, tweet.id, {
        articleContent: updatedContent,
        contextData: context,
      });

      return {
        id: existingStory.id,
        headline: existingStory.headline || "",
        articleContent: updatedContent,
        headerImage: existingStory.headerImage,
        tweet,
        source: tweet.source,
        isUpdate: true,
        updateCount: existingStory.updateCount + 1,
      };
    }

    // Create new story
    console.log(`Creating new story for: ${transferInfo.player}`);

    // Gather context from external sources
    const context = await gatherTransferContext(
      transferInfo.player,
      transferInfo.fromClub,
      transferInfo.toClub,
    );

    // Get Wikipedia header image with club fallback
    const headerImage = await getWikipediaHeaderImage(
      transferInfo.player,
      true,
      transferInfo.toClub || transferInfo.fromClub, // Pass club name for fallback
    );

    // Generate Golby-style article
    const article = await generateGolbyArticle(tweet.content, context);

    // Validate article quality
    const validation = await validateGolbyVoice(article.content);
    if (!validation.isValid) {
      console.warn(`Article failed voice validation: ${validation.feedback}`);
      // Could retry or use fallback here
    }

    // Save to database
    const story = await prisma.story.create({
      data: {
        tweetId: tweet.id,
        terryComment: article.content.substring(0, 500), // Keep for backward compatibility
        headline: article.headline,
        articleContent: article.content,
        headerImage,
        storyHash,
        metadata: {
          transferInfo: transferInfo as any,
          voiceScore: validation.score,
        },
        contextData: context as any,
      },
    });

    return {
      id: story.id,
      headline: article.headline,
      articleContent: article.content,
      headerImage,
      tweet,
      source: tweet.source,
      isUpdate: false,
      updateCount: 0,
    };
  } catch (error) {
    console.error(`Error processing tweet ${tweet.id}:`, error);
    return null;
  }
}

// Main processing pipeline
export async function processNewStories(): Promise<ProcessedStory[]> {
  console.log("🚀 Starting simplified story processing...");

  const scraper = new TwitterScraper();
  const processedStories: ProcessedStory[] = [];

  try {
    // Initialize scraper
    await scraper.initialize();

    // Ensure all sources exist in database
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

    // Get recent tweets (last 2 hours, or 24 hours if testing)
    const hoursBack = process.env.TEST_MODE === 'true' ? 24 : 2;
    const sinceTime = new Date();
    sinceTime.setHours(sinceTime.getHours() - hoursBack);

    const recentTweets = await prisma.tweet.findMany({
      where: {
        scrapedAt: { gte: sinceTime },
        source: {
          handle: {
            not: "TransferJuice", // Exclude editorial tweets
          },
        },
      },
      include: {
        source: true,
      },
      orderBy: {
        scrapedAt: "desc",
      },
    });

    console.log(`Found ${recentTweets.length} recent tweets to process`);

    // If no recent tweets, try scraping (though it won't work without auth)
    if (recentTweets.length === 0) {
      console.log("No recent tweets found, attempting to scrape...");
      const scrapedTweets = await scraper.scrapeAllSources();
      console.log(`Scraped ${scrapedTweets.length} new tweets`);
    }

    // Process each tweet
    for (const tweet of recentTweets) {
      const story = await processTweet(tweet);
      if (story) {
        processedStories.push(story);
      }
    }

    console.log(`✅ Processed ${processedStories.length} stories`);

    // Create a briefing if we have new stories
    if (processedStories.length > 0) {
      const briefing = await prisma.briefing.create({
        data: {
          title: `Transfer Stories - ${new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}`,
        },
      });

      // Add stories to briefing
      for (let i = 0; i < processedStories.length; i++) {
        await prisma.briefingStory.create({
          data: {
            briefingId: briefing.id,
            storyId: processedStories[i].id,
            position: i + 1,
          },
        });
      }

      console.log(
        `Created briefing ${briefing.id} with ${processedStories.length} stories`,
      );
    }

    return processedStories;
  } catch (error) {
    console.error("Error in story processing pipeline:", error);
    throw error;
  } finally {
    await scraper.close();
    await prisma.$disconnect();
  }
}

// Process stories that need updates
export async function updateOldStories(): Promise<number> {
  console.log("🔄 Checking for stories that need updates...");

  try {
    // Get stories that haven't been checked in 6 hours
    const storiesNeedingUpdate = await prisma.story.findMany({
      where: {
        lastChecked: {
          lt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        },
        createdAt: {
          gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        tweet: {
          include: { source: true },
        },
      },
      take: 10, // Process 10 at a time
    });

    console.log(
      `Found ${storiesNeedingUpdate.length} stories to check for updates`,
    );

    let updatedCount = 0;

    for (const story of storiesNeedingUpdate) {
      // Look for new tweets about the same player
      const transferInfo = story.metadata as any;
      if (!transferInfo?.transferInfo?.player) continue;

      const newTweets = await prisma.tweet.findMany({
        where: {
          content: {
            contains: transferInfo.transferInfo.player,
            mode: "insensitive",
          },
          scrapedAt: {
            gt: story.lastChecked,
          },
        },
        include: { source: true },
        orderBy: { scrapedAt: "desc" },
        take: 5,
      });

      for (const newTweet of newTweets) {
        if (shouldUpdateStory(story, newTweet.content)) {
          const updateText = await generateGolbyUpdate(
            newTweet.content,
            story.articleContent || "",
          );

          await updateExistingStory(story.id, newTweet.id, {
            articleContent: story.articleContent + "\n\n" + updateText,
          });

          updatedCount++;
          console.log(`Updated story: ${story.headline}`);
        }
      }

      // Update last checked even if no new content
      await prisma.story.update({
        where: { id: story.id },
        data: { lastChecked: new Date() },
      });
    }

    console.log(`✅ Updated ${updatedCount} stories`);
    return updatedCount;
  } catch (error) {
    console.error("Error updating stories:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Generate daily summary
export async function generateDailySummary() {
  console.log("📰 Generating daily summary...");

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Get all stories from the last 24 hours
    const dailyStories = await prisma.story.findMany({
      where: {
        createdAt: { gte: yesterday },
      },
      include: {
        tweet: {
          include: { source: true },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    console.log(`Found ${dailyStories.length} stories from the last 24 hours`);

    // Group by importance (based on update count and source reliability)
    const topStories = dailyStories
      .sort((a, b) => {
        const aScore =
          a.updateCount + (a.tweet.source.name === "Fabrizio Romano" ? 5 : 0);
        const bScore =
          b.updateCount + (b.tweet.source.name === "Fabrizio Romano" ? 5 : 0);
        return bScore - aScore;
      })
      .slice(0, 10);

    // Create summary briefing
    if (topStories.length > 0) {
      const summaryBriefing = await prisma.briefing.create({
        data: {
          title: `Daily Transfer Summary - ${new Date().toLocaleDateString(
            "en-GB",
            {
              weekday: "long",
              day: "numeric",
              month: "long",
            },
          )}`,
        },
      });

      // Add top stories to summary
      for (let i = 0; i < topStories.length; i++) {
        await prisma.briefingStory.create({
          data: {
            briefingId: summaryBriefing.id,
            storyId: topStories[i].id,
            position: i + 1,
          },
        });
      }

      console.log(`Created daily summary with ${topStories.length} stories`);
    }
  } catch (error) {
    console.error("Error generating daily summary:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
