import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBriefingStatus() {
  try {
    console.log('📊 TransferJuice Briefing System Status\n');
    
    // Check latest briefings
    const briefings = await prisma.briefing.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        publishedAt: true,
        _count: {
          select: { stories: true }
        }
      }
    });
    
    console.log('📰 Recent Briefings:');
    briefings.forEach((briefing, index) => {
      const timeDiff = Date.now() - briefing.publishedAt.getTime();
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutesAgo = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      console.log(`${index + 1}. ${briefing.title}`);
      console.log(`   Published: ${briefing.publishedAt.toLocaleString()}`);
      console.log(`   Time ago: ${hoursAgo}h ${minutesAgo}m`);
      console.log(`   Stories: ${briefing._count.stories}`);
      console.log('');
    });
    
    // Check if we're missing hourly updates
    const latestBriefing = briefings[0];
    if (latestBriefing) {
      const hoursSinceLastBriefing = (Date.now() - latestBriefing.publishedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastBriefing > 2) {
        console.log('⚠️  WARNING: Last briefing was over 2 hours ago!');
        console.log('   Cron might not be running properly.\n');
      } else {
        console.log('✅ System is running normally\n');
      }
    }
    
    // Show cron schedule
    console.log('⏰ Cron Schedule:');
    console.log('   Pattern: 0 * * * * (every hour at :00)');
    console.log('   Next run: ' + getNextCronRun());
    console.log('');
    
    // Show RSS feed info
    console.log('📡 RSS Feed:');
    console.log('   URL: https://rss.app/feeds/v1.1/_zMqruZvtL6XIMNVY.json');
    console.log('   Time window: Last 2 hours');
    
  } catch (error) {
    console.error('Error checking status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getNextCronRun(): string {
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setHours(nextRun.getHours() + 1);
  nextRun.setMinutes(0);
  nextRun.setSeconds(0);
  nextRun.setMilliseconds(0);
  return nextRun.toLocaleString();
}

checkBriefingStatus();