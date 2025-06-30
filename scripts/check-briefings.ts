import { prisma } from '../src/lib/database/client.js';

async function checkBriefings() {
  const briefings = await prisma.briefing.findMany({ 
    orderBy: { timestamp: 'desc' },
    take: 5,
    select: { id: true, slug: true, timestamp: true, status: true }
  });
  console.log('Recent briefings:', briefings);
  
  const count = await prisma.briefing.count();
  console.log('Total briefings:', count);
  
  // Check feed items
  const feedItems = await prisma.feedItem.count();
  console.log('Total feed items:', feedItems);
  
  process.exit(0);
}

checkBriefings().catch(console.error);