import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOldBriefings() {
  try {
    // Get the latest briefing
    const latestBriefing = await prisma.briefing.findFirst({
      orderBy: { publishedAt: 'desc' },
      select: { id: true, title: true, publishedAt: true }
    });

    if (!latestBriefing) {
      console.log('No briefings found');
      return;
    }

    console.log('Latest briefing to keep:');
    console.log(`- ID: ${latestBriefing.id}`);
    console.log(`- Title: ${latestBriefing.title}`);
    console.log(`- Published: ${latestBriefing.publishedAt}`);

    // Delete all briefings except the latest
    const deleteResult = await prisma.briefing.deleteMany({
      where: {
        id: {
          not: latestBriefing.id
        }
      }
    });

    console.log(`\n✅ Deleted ${deleteResult.count} old briefings`);

    // Also clean up orphaned stories (stories not linked to any briefing)
    const orphanedStories = await prisma.story.findMany({
      where: {
        briefings: {
          none: {}
        }
      },
      select: { id: true }
    });

    if (orphanedStories.length > 0) {
      const storyIds = orphanedStories.map(s => s.id);
      await prisma.story.deleteMany({
        where: {
          id: {
            in: storyIds
          }
        }
      });
      console.log(`✅ Deleted ${orphanedStories.length} orphaned stories`);
    }

    // Clean up orphaned tweets
    const orphanedTweets = await prisma.tweet.findMany({
      where: {
        stories: {
          none: {}
        }
      },
      select: { id: true }
    });

    if (orphanedTweets.length > 0) {
      const tweetIds = orphanedTweets.map(t => t.id);
      await prisma.tweet.deleteMany({
        where: {
          id: {
            in: tweetIds
          }
        }
      });
      console.log(`✅ Deleted ${orphanedTweets.length} orphaned tweets`);
    }

  } catch (error) {
    console.error('Error cleaning up briefings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOldBriefings();