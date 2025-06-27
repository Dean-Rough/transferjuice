import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBriefings() {
  try {
    const briefings = await prisma.briefing.findMany({
      take: 1,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        slug: true,
        visualTimeline: true,
        media: true
      }
    });
    
    console.log('=== Latest Briefing ===');
    if (briefings[0]) {
      console.log('ID:', briefings[0].id);
      console.log('Slug:', briefings[0].slug);
      console.log('Media count:', briefings[0].media.length);
      console.log('\nVisual Timeline items:', Array.isArray(briefings[0].visualTimeline) ? briefings[0].visualTimeline.length : 0);
      
      if (Array.isArray(briefings[0].visualTimeline)) {
        console.log('\nFirst timeline item:');
        console.log(JSON.stringify(briefings[0].visualTimeline[0], null, 2));
      }
      
      if (briefings[0].media.length > 0) {
        console.log('\nMedia items:');
        briefings[0].media.forEach(media => {
          console.log(`- ${media.type}: ${media.url}`);
          if (media.playerName) console.log(`  Player: ${media.playerName}`);
        });
      }
    } else {
      console.log('No briefings found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBriefings();