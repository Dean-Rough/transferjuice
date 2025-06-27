#!/usr/bin/env tsx
/**
 * Clear all briefings but keep tweets
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearBriefings() {
  console.log('🗑️ Clearing all briefings (keeping tweets)...\n');

  try {
    // Delete all briefings
    const deletedBriefings = await prisma.briefing.deleteMany({});
    console.log(`✅ Deleted ${deletedBriefings.count} briefings`);

    // Show remaining data
    const feedItemCount = await prisma.feedItem.count();
    const publishedFeedItems = await prisma.feedItem.count({
      where: { isPublished: true }
    });

    console.log(`📊 Remaining data:`);
    console.log(`   Feed items: ${feedItemCount}`);
    console.log(`   Published: ${publishedFeedItems}`);
    console.log(`   Unpublished: ${feedItemCount - publishedFeedItems}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearBriefings();