import { PrismaClient } from "@prisma/client";
import { extractTransferInfo, generateStoryHash } from "../src/lib/storyDeduplication";

const prisma = new PrismaClient();

async function mergeDuplicateStories() {
  console.log("🔄 Merging duplicate stories with improved deduplication...");

  try {
    // Get all stories with their tweets
    const stories = await prisma.story.findMany({
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
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    console.log(`Found ${stories.length} total stories`);

    // Recalculate hashes with improved logic
    const storyGroups = new Map<string, typeof stories>();
    
    for (const story of stories) {
      // Extract transfer info from tweet
      const transferInfo = extractTransferInfo(story.tweet.content);
      if (!transferInfo) {
        console.log(`Could not extract transfer info from story ${story.id}`);
        continue;
      }

      // Generate new hash with improved logic
      const newHash = generateStoryHash(transferInfo);
      
      if (!storyGroups.has(newHash)) {
        storyGroups.set(newHash, []);
      }
      storyGroups.get(newHash)!.push(story);
    }

    // Find groups with duplicates
    const duplicateGroups = Array.from(storyGroups.entries()).filter(([_, stories]) => stories.length > 1);
    
    console.log(`\nFound ${duplicateGroups.length} groups of duplicate stories`);

    for (const [hash, duplicates] of duplicateGroups) {
      console.log(`\nDuplicate group (new hash: ${hash}):`);
      duplicates.forEach((story, idx) => {
        console.log(`  ${idx + 1}. ${story.headline || "No headline"}`);
        console.log(`     ID: ${story.id}`);
        console.log(`     Old hash: ${story.storyHash}`);
        console.log(`     Source: ${story.tweet.source.name}`);
        console.log(`     Tweet: ${story.tweet.content.substring(0, 80)}...`);
      });

      // Keep the best story (most updates, best content)
      const storyToKeep = duplicates.sort((a, b) => {
        // First priority: has headline
        if (a.headline && !b.headline) return -1;
        if (!a.headline && b.headline) return 1;
        
        // Second priority: number of related tweets
        const aRelated = (a.relatedTweets?.length || 0) + 1; // +1 for main tweet
        const bRelated = (b.relatedTweets?.length || 0) + 1;
        if (aRelated !== bRelated) return bRelated - aRelated;
        
        // Third priority: content quality (length)
        const aContentLength = (a.articleContent?.length || 0) + (a.headline?.length || 0);
        const bContentLength = (b.articleContent?.length || 0) + (b.headline?.length || 0);
        if (aContentLength !== bContentLength) return bContentLength - aContentLength;
        
        // Finally: oldest first
        return a.createdAt.getTime() - b.createdAt.getTime();
      })[0];

      const storiesToMerge = duplicates.filter(s => s.id !== storyToKeep.id);
      
      if (storiesToMerge.length > 0) {
        console.log(`\n  ✅ Keeping: ${storyToKeep.headline} (ID: ${storyToKeep.id})`);
        console.log(`  🔄 Merging ${storiesToMerge.length} duplicates into it`);
        
        // Collect all unique tweets
        const allTweets = new Set<string>();
        allTweets.add(storyToKeep.tweet.id);
        
        // Add related tweets from keeper
        storyToKeep.relatedTweets?.forEach(rt => allTweets.add(rt.tweetId));
        
        // Add tweets from stories to merge
        for (const storyToMerge of storiesToMerge) {
          allTweets.add(storyToMerge.tweet.id);
          storyToMerge.relatedTweets?.forEach(rt => allTweets.add(rt.tweetId));
        }
        
        console.log(`  📎 Total unique tweets to link: ${allTweets.size}`);
        
        // Update the keeper story with new hash
        await prisma.story.update({
          where: { id: storyToKeep.id },
          data: { 
            storyHash: hash,
            updateCount: allTweets.size - 1 // -1 because main tweet doesn't count as update
          }
        });
        
        // Link all tweets to keeper (skip if already exists)
        for (const tweetId of allTweets) {
          if (tweetId === storyToKeep.tweet.id) continue; // Skip main tweet
          
          try {
            await prisma.storyTweet.create({
              data: {
                storyId: storyToKeep.id,
                tweetId: tweetId
              }
            });
            console.log(`    → Added tweet ${tweetId} to story`);
          } catch (error) {
            // Already exists, that's fine
          }
        }
        
        // Delete the duplicate stories
        const deleteResult = await prisma.story.deleteMany({
          where: {
            id: {
              in: storiesToMerge.map(s => s.id)
            }
          }
        });
        
        console.log(`  🗑️  Deleted ${deleteResult.count} duplicate stories`);
      }
    }

    // Final stats
    const finalCount = await prisma.story.count();
    console.log(`\n📊 Final database contains ${finalCount} stories`);

  } catch (error) {
    console.error("❌ Error during merge:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the merge
mergeDuplicateStories();