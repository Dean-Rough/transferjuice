import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function listRecentStories() {
  console.log("📋 Listing recent stories...\n");

  try {
    const stories = await prisma.story.findMany({
      include: {
        tweet: {
          include: {
            source: true
          }
        },
        relatedTweets: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    });

    console.log(`Found ${stories.length} recent stories:\n`);

    stories.forEach((story, index) => {
      console.log(`${index + 1}. ${story.headline || "No headline"}`);
      console.log(`   ID: ${story.id}`);
      console.log(`   Source: ${story.tweet?.source?.name || "Unknown"}`);
      console.log(`   Created: ${story.createdAt.toLocaleString()}`);
      console.log(`   Updated: ${story.updatedAt.toLocaleString()}`);
      console.log(`   Updates: ${story.updateCount}`);
      console.log(`   Related tweets: ${story.relatedTweets?.length || 0}`);
      
      if (story.storyHash) {
        console.log(`   Story hash: ${story.storyHash}`);
      }
      
      if (story.tweet?.content) {
        console.log(`   Tweet: ${story.tweet.content.substring(0, 100)}...`);
      }
      
      console.log("");
    });

    // Show statistics
    const totalStories = await prisma.story.count();
    const storiesWithHeadlines = await prisma.story.count({
      where: { headline: { not: null } }
    });
    const storiesWithContent = await prisma.story.count({
      where: { articleContent: { not: null } }
    });
    const storiesWithImages = await prisma.story.count({
      where: { headerImage: { not: null } }
    });

    console.log("\n📊 Statistics:");
    console.log(`   Total stories: ${totalStories}`);
    console.log(`   Stories with headlines: ${storiesWithHeadlines}`);
    console.log(`   Stories with content: ${storiesWithContent}`);
    console.log(`   Stories with images: ${storiesWithImages}`);

  } catch (error) {
    console.error("❌ Error listing stories:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
listRecentStories();