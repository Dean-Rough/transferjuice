import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function mergeNoniStories() {
  console.log("🔄 Manually merging the Noni Madueke stories...");

  try {
    // Get the two Noni Madueke stories
    const story1 = await prisma.story.findUnique({
      where: { id: 'cmcw0lnmo000yommybi4yimkv' },
      include: {
        tweet: { include: { source: true } },
        relatedTweets: { include: { tweet: { include: { source: true } } } }
      }
    });

    const story2 = await prisma.story.findUnique({
      where: { id: 'cmcw0m3lv0010ommyok0i50rf' },
      include: {
        tweet: { include: { source: true } },
        relatedTweets: { include: { tweet: { include: { source: true } } } }
      }
    });

    if (!story1 || !story2) {
      console.log("One or both stories not found");
      return;
    }

    console.log("\nStory 1:");
    console.log(`  Headline: ${story1.headline}`);
    console.log(`  Source: ${story1.tweet.source.name}`);
    console.log(`  Created: ${story1.createdAt}`);
    console.log(`  Related tweets: ${story1.relatedTweets?.length || 0}`);

    console.log("\nStory 2:");
    console.log(`  Headline: ${story2.headline}`);
    console.log(`  Source: ${story2.tweet.source.name}`);
    console.log(`  Created: ${story2.createdAt}`);
    console.log(`  Related tweets: ${story2.relatedTweets?.length || 0}`);

    // Keep the Ornstein story (story2) as it was created first and has better headline
    const keepStory = story2;
    const mergeStory = story1;

    console.log(`\n✅ Keeping: ${keepStory.headline} (${keepStory.tweet.source.name})`);
    console.log(`🔄 Merging: ${mergeStory.headline} (${mergeStory.tweet.source.name})`);

    // Add Fabrizio's tweet as a related tweet to Ornstein's story
    await prisma.storyTweet.create({
      data: {
        storyId: keepStory.id,
        tweetId: mergeStory.tweet.id
      }
    });

    // Update the story with a unified hash and increment update count
    await prisma.story.update({
      where: { id: keepStory.id },
      data: {
        storyHash: 'noni-madueke-arsenal-chelsea', // Manual unified hash
        updateCount: keepStory.updateCount + 1,
        lastChecked: new Date()
      }
    });

    // Optionally update the article content to mention both sources
    const updatedContent = keepStory.articleContent + 
      "\n\n**Update**: Fabrizio Romano has confirmed the talks between Arsenal and Chelsea for Noni Madueke, " +
      "corroborating the earlier report. The transfer saga continues to develop with both London clubs " +
      "actively pursuing the 23-year-old winger.";

    await prisma.story.update({
      where: { id: keepStory.id },
      data: {
        articleContent: updatedContent
      }
    });

    // First, update any briefing references to point to the keeper story
    await prisma.briefingStory.updateMany({
      where: { storyId: mergeStory.id },
      data: { storyId: keepStory.id }
    });

    // Delete the duplicate story
    await prisma.story.delete({
      where: { id: mergeStory.id }
    });

    console.log("\n✅ Successfully merged stories!");
    console.log("   - Added Fabrizio's tweet as related source");
    console.log("   - Updated article with both sources");
    console.log("   - Deleted duplicate story");

    // Show the updated story
    const finalStory = await prisma.story.findUnique({
      where: { id: keepStory.id },
      include: {
        relatedTweets: {
          include: {
            tweet: {
              include: { source: true }
            }
          }
        }
      }
    });

    console.log("\n📊 Final merged story:");
    console.log(`   Sources: ${finalStory?.tweet.source.name} (main)`);
    finalStory?.relatedTweets.forEach(rt => {
      console.log(`           ${rt.tweet.source.name} (related)`);
    });

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

mergeNoniStories();