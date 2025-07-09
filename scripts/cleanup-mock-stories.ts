import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupMockStories() {
  console.log("🧹 Starting cleanup of mock/test stories...");

  try {
    // Common patterns that indicate mock/test data
    const mockPatterns = [
      "test",
      "demo",
      "example",
      "mock",
      "sample",
      "lorem ipsum",
      "Test Player",
      "Demo Club",
      "Example Transfer"
    ];

    // First, let's find all stories that might be mock data
    const allStories = await prisma.story.findMany({
      include: {
        tweet: {
          include: {
            source: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    console.log(`Found ${allStories.length} total stories`);

    // Identify mock stories
    const mockStories = allStories.filter(story => {
      // Check headline
      if (story.headline) {
        const headlineLower = story.headline.toLowerCase();
        if (mockPatterns.some(pattern => headlineLower.includes(pattern.toLowerCase()))) {
          return true;
        }
      }

      // Check article content
      if (story.articleContent) {
        const contentLower = story.articleContent.toLowerCase();
        if (mockPatterns.some(pattern => contentLower.includes(pattern.toLowerCase()))) {
          return true;
        }
      }

      // Check tweet content
      if (story.tweet?.content) {
        const tweetLower = story.tweet.content.toLowerCase();
        if (mockPatterns.some(pattern => tweetLower.includes(pattern.toLowerCase()))) {
          return true;
        }
      }

      // Check for stories without proper headlines or content
      if (!story.headline && !story.articleContent) {
        return true;
      }

      // Check for duplicate/nonsensical headlines
      if (story.headline === "Transfer Update" || story.headline === "Breaking News") {
        return true;
      }

      return false;
    });

    console.log(`\nIdentified ${mockStories.length} potential mock stories:`);
    
    // Show what we're about to delete
    mockStories.forEach((story, index) => {
      console.log(`\n${index + 1}. Story ID: ${story.id}`);
      console.log(`   Headline: ${story.headline || "No headline"}`);
      console.log(`   Source: ${story.tweet?.source?.name || "Unknown"}`);
      console.log(`   Created: ${story.createdAt}`);
      if (story.articleContent) {
        console.log(`   Content preview: ${story.articleContent.substring(0, 100)}...`);
      }
    });

    if (mockStories.length === 0) {
      console.log("\n✅ No mock stories found! Database is clean.");
      return;
    }

    // Ask for confirmation
    console.log("\n⚠️  WARNING: This will permanently delete these stories.");
    console.log("Press Ctrl+C to cancel, or wait 10 seconds to proceed...");
    
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Delete the mock stories
    const storyIds = mockStories.map(s => s.id);
    
    console.log("\n🗑️  Deleting mock stories...");
    
    const deleteResult = await prisma.story.deleteMany({
      where: {
        id: {
          in: storyIds
        }
      }
    });

    console.log(`\n✅ Successfully deleted ${deleteResult.count} mock stories!`);

    // Also clean up any orphaned tweets
    console.log("\n🧹 Cleaning up orphaned tweets...");
    
    // Find tweets that don't have associated stories
    const orphanedTweets = await prisma.tweet.findMany({
      where: {
        story: null
      }
    });

    if (orphanedTweets.length > 0) {
      const deletedTweets = await prisma.tweet.deleteMany({
        where: {
          story: null
        }
      });
      console.log(`✅ Deleted ${deletedTweets.count} orphaned tweets`);
    } else {
      console.log("✅ No orphaned tweets found");
    }

    // Show remaining stats
    const remainingStories = await prisma.story.count();
    console.log(`\n📊 Database now contains ${remainingStories} stories`);

  } catch (error) {
    console.error("\n❌ Error during cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupMockStories();