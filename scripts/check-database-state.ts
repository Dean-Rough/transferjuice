import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const briefingCount = await prisma.briefing.count();
    const feedItemCount = await prisma.feedItem.count();
    const itkSourceCount = await prisma.itkSource.count();
    
    console.log('Database Content Summary:');
    console.log('- Briefings:', briefingCount);
    console.log('- Feed Items:', feedItemCount);
    console.log('- ITK Sources:', itkSourceCount);
    
    // Get latest briefings
    const latestBriefings = await prisma.briefing.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log('\nLatest Briefings:');
    if (latestBriefings.length === 0) {
      console.log('No briefings found in database');
    } else {
      latestBriefings.forEach(b => {
        console.log(`- [${b.status}] ${b.title} (${b.createdAt.toISOString()})`);
      });
    }
    
    // Get latest feed items
    const latestFeedItems = await prisma.feedItem.findMany({
      take: 5,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        publishedAt: true,
        source: true
      }
    });
    
    console.log('\nLatest Feed Items:');
    if (latestFeedItems.length === 0) {
      console.log('No feed items found in database');
    } else {
      latestFeedItems.forEach(f => {
        console.log(`- ${f.title} from ${f.source} (${f.publishedAt.toISOString()})`);
      });
    }
    
  } catch (error) {
    console.error('Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();