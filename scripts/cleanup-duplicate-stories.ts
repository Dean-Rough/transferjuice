import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupDuplicateStories() {
  console.log("🧹 Cleaning up duplicate and incomplete stories...");

  try {
    // Find stories without headlines
    const storiesWithoutHeadlines = await prisma.story.findMany({
      where: {
        headline: null
      },
      include: {
        tweet: {
          include: {
            source: true
          }
        }
      }
    });

    console.log(`Found ${storiesWithoutHeadlines.length} stories without headlines`);
    
    for (const story of storiesWithoutHeadlines) {
      console.log(`\nStory ID: ${story.id}`);
      console.log(`Source: ${story.tweet?.source?.name}`);
      console.log(`Tweet: ${story.tweet?.content?.substring(0, 100)}...`);
    }

    if (storiesWithoutHeadlines.length > 0) {
      // Delete stories without headlines
      const deleteResult = await prisma.story.deleteMany({
        where: {
          headline: null
        }
      });
      
      console.log(`\n✅ Deleted ${deleteResult.count} stories without headlines`);
    }

    // Find duplicate stories with same storyHash
    const storiesWithHash = await prisma.story.findMany({
      where: {
        storyHash: { not: null }
      },
      orderBy: {
        createdAt: "asc"
      },
      include: {
        tweet: {
          include: {
            source: true
          }
        },
        relatedTweets: {
          include: {
            tweet: {
              include: {
                source: true
              }
            }
          }
        }
      }
    });

    // Group by storyHash
    const storyGroups = new Map<string, typeof storiesWithHash>();
    
    for (const story of storiesWithHash) {
      if (story.storyHash) {
        if (!storyGroups.has(story.storyHash)) {
          storyGroups.set(story.storyHash, []);
        }
        storyGroups.get(story.storyHash)!.push(story);
      }
    }

    // Find groups with duplicates
    const duplicateGroups = Array.from(storyGroups.entries()).filter(([_, stories]) => stories.length > 1);
    
    console.log(`\nFound ${duplicateGroups.length} groups of duplicate stories`);

    for (const [hash, stories] of duplicateGroups) {
      console.log(`\nDuplicate group (hash: ${hash}):`);
      stories.forEach((story, idx) => {
        console.log(`  ${idx + 1}. ${story.headline || "No headline"}`);
        console.log(`     ID: ${story.id}`);
        console.log(`     Created: ${story.createdAt}`);
        console.log(`     Updates: ${story.updateCount}`);
        console.log(`     Related tweets: ${story.relatedTweets?.length || 0}`);
      });

      // Keep the oldest story with the most updates and related tweets
      const storyToKeep = stories.sort((a, b) => {
        // First priority: has headline
        if (a.headline && !b.headline) return -1;
        if (!a.headline && b.headline) return 1;
        
        // Second priority: number of related tweets
        const aRelated = a.relatedTweets?.length || 0;
        const bRelated = b.relatedTweets?.length || 0;
        if (aRelated !== bRelated) return bRelated - aRelated;
        
        // Third priority: update count
        if (a.updateCount !== b.updateCount) return b.updateCount - a.updateCount;
        
        // Finally: oldest first
        return a.createdAt.getTime() - b.createdAt.getTime();
      })[0];

      const storiesToDelete = stories.filter(s => s.id !== storyToKeep.id);
      
      if (storiesToDelete.length > 0) {
        console.log(`  Keeping: ${storyToKeep.headline} (ID: ${storyToKeep.id})`);
        console.log(`  Deleting ${storiesToDelete.length} duplicates`);
        
        // Move all tweets from duplicates to the keeper
        for (const storyToDelete of storiesToDelete) {
          if (storyToDelete.tweet) {
            try {
              await prisma.storyTweet.create({
                data: {
                  storyId: storyToKeep.id,
                  tweetId: storyToDelete.tweet.id
                }
              });
              console.log(`    Moved tweet from story ${storyToDelete.id} to ${storyToKeep.id}`);
            } catch (error) {
              // Might already exist
              console.log(`    Tweet already linked to keeper story`);
            }
          }
        }
        
        // Delete the duplicates
        await prisma.story.deleteMany({
          where: {
            id: {
              in: storiesToDelete.map(s => s.id)
            }
          }
        });
      }
    }

    // Final stats
    const finalCount = await prisma.story.count();
    console.log(`\n📊 Final database contains ${finalCount} stories`);

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDuplicateStories();