import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBriefings() {
  const briefings = await prisma.briefing.findMany({
    where: { isPublished: true },
    orderBy: { timestamp: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      slug: true,
      isPublished: true,
      timestamp: true,
    }
  });
  
  console.log('Published briefings:', briefings.length);
  briefings.forEach(b => {
    console.log(`- ${b.title} (${b.slug}) - Published: ${b.isPublished}`);
  });
  
  const unpublished = await prisma.briefing.count({
    where: { isPublished: false }
  });
  console.log('\nUnpublished briefings:', unpublished);
  
  // Check latest briefing
  const latest = await prisma.briefing.findFirst({
    orderBy: { timestamp: 'desc' },
    include: {
      feedItems: true,
      media: true,
    }
  });
  
  if (latest) {
    console.log('\nLatest briefing:');
    console.log(`- Title: ${latest.title}`);
    console.log(`- Published: ${latest.isPublished}`);
    console.log(`- Feed items: ${latest.feedItems.length}`);
    console.log(`- Media: ${latest.media.length}`);
    
    // Publish it if not published
    if (!latest.isPublished) {
      console.log('\nPublishing latest briefing...');
      await prisma.briefing.update({
        where: { id: latest.id },
        data: { isPublished: true }
      });
      console.log('✅ Briefing published!');
    }
  }
  
  // Also check feed items
  const feedItems = await prisma.feedItem.count({
    where: { isPublished: true }
  });
  console.log('\nPublished feed items:', feedItems);
}

checkBriefings()
  .catch(console.error)
  .finally(() => prisma.$disconnect());