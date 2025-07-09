#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";
import { extractTransferInfo, generateStoryHash, findExistingStory } from "../src/lib/storyDeduplication";
import { gatherTransferContext, getWikipediaHeaderImage } from "../src/lib/dataSourceIntegration";
import { generateGolbyArticle, validateGolbyVoice } from "../src/lib/golbyArticleGenerator";

const prisma = new PrismaClient();

async function processTweet(tweet: any) {
  try {
    console.log(`\nProcessing: ${tweet.content.substring(0, 100)}...`);
    
    // Extract transfer information
    const transferInfo = extractTransferInfo(tweet.content);
    if (!transferInfo) {
      console.log(`  ❌ Could not extract transfer info`);
      return null;
    }
    
    console.log(`  ✓ Extracted: ${transferInfo.player} (${transferInfo.type})`);
    
    // Generate story hash for deduplication
    const storyHash = generateStoryHash(transferInfo);
    
    // Check if story already exists
    const existingStory = await findExistingStory(storyHash);
    if (existingStory) {
      console.log(`  ⚠️ Story already exists`);
      return null;
    }
    
    // Gather context
    console.log(`  📊 Gathering context...`);
    const context = await gatherTransferContext(
      transferInfo.player,
      transferInfo.fromClub,
      transferInfo.toClub,
    );
    
    // Get Wikipedia header image
    console.log(`  🖼️ Fetching header image...`);
    const headerImage = await getWikipediaHeaderImage(transferInfo.player, true);
    
    // Generate Golby-style article
    console.log(`  ✍️ Generating article...`);
    const article = await generateGolbyArticle(tweet.content, context);
    
    // Validate article quality
    const validation = await validateGolbyVoice(article.content);
    console.log(`  📈 Voice score: ${validation.score}/10`);
    
    // Save to database
    const story = await prisma.story.create({
      data: {
        tweetId: tweet.id,
        terryComment: article.content.substring(0, 500),
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
    
    console.log(`  ✅ Created story: ${story.headline}`);
    return story;
  } catch (error) {
    console.error(`  ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function main() {
  console.log("🚀 Processing existing tweets into stories...\n");
  
  // Get all transfer tweets (force reprocess if --force flag)
  const forceReprocess = process.argv.includes("--force");
  
  const tweetsWithoutStories = await prisma.tweet.findMany({
    where: {
      source: {
        handle: {
          not: "TransferJuice",
        },
      },
      ...(forceReprocess ? {} : {
        stories: {
          none: {},
        },
      }),
    },
    include: {
      source: true,
    },
    orderBy: {
      scrapedAt: "desc",
    },
  });
  
  console.log(`Found ${tweetsWithoutStories.length} tweets without stories`);
  
  const processedStories = [];
  
  for (const tweet of tweetsWithoutStories) {
    const story = await processTweet(tweet);
    if (story) {
      processedStories.push(story);
    }
  }
  
  console.log(`\n✅ Processed ${processedStories.length} stories`);
  
  // Create a briefing if we have stories
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
    
    console.log(`Created briefing ${briefing.id} with ${processedStories.length} stories`);
  }
  
  await prisma.$disconnect();
}

main();