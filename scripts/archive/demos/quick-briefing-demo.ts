#!/usr/bin/env tsx
/**
 * Quick briefing demo using existing feed items
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function quickBriefingDemo() {
  console.log('🎯 QUICK BRIEFING DEMO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Get our fresh unpublished feed items
    const feedItems = await prisma.feedItem.findMany({
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
      take: 10
    });

    console.log(`📰 Found ${feedItems.length} fresh unpublished items`);

    if (feedItems.length === 0) {
      console.log('❌ No fresh data available');
      return;
    }

    // Create a simple briefing
    const briefing = await prisma.briefing.create({
      data: {
        title: {
          main: `Transfer Roundup - ${new Date().toLocaleDateString()}`,
          subtitle: "The Terry surveys today's chaos"
        },
        slug: `transfer-roundup-${Date.now()}`,
        timestamp: new Date(),
        content: [{
          id: 'main',
          type: 'content',
          content: generateSimpleBriefingContent(feedItems)
        }],
        wordCount: 500,
        isPublished: true,
        readTime: 3,
        terryScore: 85,
        visualTimeline: [],
        sidebarSections: []
      }
    });

    // Link feed items to briefing
    const briefingFeedItems = await Promise.all(
      feedItems.map(async (item, index) => {
        return prisma.briefingFeedItem.create({
          data: {
            briefingId: briefing.id,
            feedItemId: item.id,
            position: index + 1,
            section: 'main'
          }
        });
      })
    );

    // Mark feed items as published
    await prisma.feedItem.updateMany({
      where: { id: { in: feedItems.map(item => item.id) } },
      data: { isPublished: true }
    });

    console.log('\n✅ DEMO BRIEFING CREATED!');
    console.log(`📝 Briefing ID: ${briefing.id}`);
    console.log(`📅 Title: ${briefing.title}`);
    console.log(`📊 Feed items: ${feedItems.length}`);
    console.log(`🔗 Items linked: ${briefingFeedItems.length}`);
    
    console.log(`\n🌐 View the briefing at:`);
    console.log(`   http://localhost:4433/briefings/${briefing.slug}`);

    // Show content preview
    console.log('\n📰 BRIEFING PREVIEW:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(briefing.content.substring(0, 600) + '...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function generateSimpleBriefingContent(feedItems: any[]): string {
  const timestamp = new Date().toLocaleString();
  
  let content = `# Transfer Roundup - ${new Date().toLocaleDateString()}\n\n`;
  content += `*Generated: ${timestamp}*\n\n`;
  content += `## Latest Transfer News\n\n`;
  content += `We've been monitoring the transfer circus, and here's what the ITK brigade has been shouting about:\n\n`;

  feedItems.forEach((item, index) => {
    const sourceName = item.source?.name || item.sourceId;
    const timeAgo = getTimeAgo(item.publishedAt);
    
    content += `### ${index + 1}. ${sourceName} Update\n\n`;
    content += `**${timeAgo}** - ${item.content}\n\n`;
    
    // Add some Terry-style commentary
    if (item.content.toLowerCase().includes('here we go')) {
      content += `*Terry's take: Another "HERE WE GO" from the Romano empire. At this point, he could tweet about his lunch and add "HERE WE GO" and everyone would believe his sandwich was signing for Bayern Munich.*\n\n`;
    } else if (item.content.toLowerCase().includes('exclusive')) {
      content += `*Terry's take: "EXCLUSIVE" - the transfer journalism equivalent of shouting "FIRST!" in a YouTube comments section. But hey, at least someone's pretending to have sources.*\n\n`;
    } else if (item.content.toLowerCase().includes('deal')) {
      content += `*Terry's take: Another "deal" in the works. In football terms, this could mean anything from "they've agreed on the color of the contract pen" to "someone's cousin saw them in the same coffee shop."*\n\n`;
    }
  });

  content += `---\n\n`;
  content += `*This briefing included ${feedItems.length} updates from ${[...new Set(feedItems.map(item => item.source?.name || item.sourceId))].length} sources.*\n\n`;
  content += `**Next update:** Check back in an hour for more transfer chaos.\n\n`;

  return content;
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMins}m ago`;
  } else {
    return `${diffMins}m ago`;
  }
}

quickBriefingDemo().catch(console.error);