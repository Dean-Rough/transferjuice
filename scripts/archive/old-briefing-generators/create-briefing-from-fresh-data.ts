#!/usr/bin/env tsx
/**
 * Create briefing from the fresh transfer data we just scraped
 */

import { PrismaClient } from '@prisma/client';
import { generateBriefing } from '../src/lib/briefings/generator';

const prisma = new PrismaClient();

async function createBriefingFromFreshData() {
  console.log('🎯 CREATING BRIEFING FROM FRESH TRANSFER DATA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Started: ${new Date().toLocaleString()}\n`);

  try {
    // Get all unpublished feed items (our fresh data)
    const unpublishedItems = await prisma.feedItem.findMany({
      where: { 
        isPublished: false,
        publishedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        source: true
      },
      orderBy: { publishedAt: 'desc' },
      take: 20
    });

    console.log(`📰 Found ${unpublishedItems.length} unpublished transfer items`);
    
    if (unpublishedItems.length === 0) {
      console.log('❌ No fresh data to create briefing from');
      return;
    }

    // Show preview of items
    console.log('\n🔥 Fresh Transfer News:');
    unpublishedItems.forEach((item, i) => {
      console.log(`${i + 1}. ${item.source?.name || item.sourceId}: "${item.content.substring(0, 80)}..."`);
    });

    // Generate Terry briefing
    console.log('\n🚀 Generating Terry briefing...');
    const briefingTimestamp = new Date();
    
    const briefing = await generateBriefing({
      timestamp: briefingTimestamp,
      testMode: false,
      forceRegenerate: true
    });
    
    if (!briefing) {
      console.log('❌ Failed to generate briefing');
      return;
    }

    console.log('\n✅ BRIEFING SUCCESSFULLY CREATED!');
    console.log(`📝 Briefing ID: ${briefing.id}`);
    console.log(`📅 Timestamp: ${briefing.timestamp.toLocaleString()}`);
    console.log(`📊 Feed items included: ${briefing.feedItems?.length || 0}`);
    
    // Show briefing preview
    if (briefing.content) {
      console.log('\n📰 BRIEFING PREVIEW:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(briefing.content.substring(0, 500) + '...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // Mark feed items as published
    const feedItemIds = briefing.feedItems?.map(fi => fi.feedItemId) || [];
    if (feedItemIds.length > 0) {
      await prisma.feedItem.updateMany({
        where: { id: { in: feedItemIds } },
        data: { isPublished: true }
      });
      console.log(`\n✅ Marked ${feedItemIds.length} feed items as published`);
    }

    // Show final database state
    const totalBriefings = await prisma.briefing.count();
    const publishedItems = await prisma.feedItem.count({ where: { isPublished: true } });
    const unpublishedItemsCount = await prisma.feedItem.count({ where: { isPublished: false } });

    console.log(`\n📊 Final Database State:`);
    console.log(`   Total briefings: ${totalBriefings}`);
    console.log(`   Published feed items: ${publishedItems}`);
    console.log(`   Unpublished feed items: ${unpublishedItemsCount}`);

    // Provide viewing URL
    const slug = briefing.slug || briefing.id;
    console.log(`\n🌐 View the briefing at:`);
    console.log(`   http://localhost:4433/briefings/${slug}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBriefingFromFreshData().catch(console.error);