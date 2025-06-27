#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

async function checkFeedStatus() {
  const prisma = new PrismaClient();
  
  try {
    const unpublished = await prisma.feedItem.findMany({
      where: { isPublished: false },
      select: { id: true, content: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 5
    });
    
    const published = await prisma.feedItem.count({
      where: { isPublished: true }
    });
    
    console.log(`📊 Feed Status:`);
    console.log(`   Published items: ${published}`);
    console.log(`   Unpublished items: ${unpublished.length}`);
    
    if (unpublished.length > 0) {
      console.log('\n📝 Recent unpublished items:');
      unpublished.forEach((item, i) => {
        console.log(`${i + 1}. ${item.content.substring(0, 80)}...`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFeedStatus().catch(console.error);