#!/usr/bin/env tsx
/**
 * Direct session scraper to populate fresh data (bypass hybrid client)
 */

import { SessionBasedScraper } from '../src/lib/twitter/session-scraper';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function directSessionPopulate() {
  console.log('🌍 DIRECT SESSION SCRAPER - FRESH DATA POPULATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Started: ${new Date().toLocaleString()}\n`);

  const scraper = new SessionBasedScraper('juice_backer');
  
  try {
    await scraper.initialize();
    console.log('✅ Session scraper initialized\n');
  } catch (error) {
    console.error('❌ Session error:', error.message);
    return;
  }

  const results = {
    totalSources: 0,
    successfulSources: 0,
    totalTweets: 0,
    transferTweets: 0,
    newItems: 0,
    errors: [] as string[]
  };

  // Test with key ITK sources
  const testSources = [
    { username: 'FabrizioRomano', name: 'Fabrizio Romano', region: 'Global' },
    { username: 'David_Ornstein', name: 'David Ornstein', region: 'UK' },
    { username: 'SkySportsNews', name: 'Sky Sports News', region: 'UK' },
    { username: 'DeadlineDayLive', name: 'Deadline Day Live', region: 'UK' }
  ];

  console.log(`Testing ${testSources.length} key ITK sources:\n`);

  for (const source of testSources) {
    results.totalSources++;
    
    try {
      console.log(`📰 @${source.username} - ${source.name}`);
      
      // Create or find the ITK source first
      const itkSource = await prisma.iTKSource.upsert({
        where: { username: source.username },
        update: { lastFetchedAt: new Date() },
        create: {
          name: source.name,
          username: source.username,
          tier: 1,
          reliability: 0.9,
          region: source.region,
          isActive: true,
        }
      });
      
      // Use direct session scraper
      const tweets = await scraper.scrapeUserTweets(source.username, 5);
      
      if (tweets.length === 0) {
        console.log('   ❌ No tweets found');
        continue;
      }

      results.successfulSources++;
      results.totalTweets += tweets.length;

      // Process each tweet
      let newCount = 0;
      for (const tweet of tweets) {
        // Check if transfer-related
        const transferKeywords = ['transfer', 'signing', 'medical', 'fee', 'deal', 'agreed', 'bid', 'contract', 'loan', 'here we go', 'done deal', 'exclusive'];
        const isTransfer = transferKeywords.some(keyword => 
          tweet.text.toLowerCase().includes(keyword)
        );

        if (!isTransfer) continue;

        results.transferTweets++;

        // Check if already in database
        const existing = await prisma.feedItem.findFirst({
          where: { twitterId: tweet.id }
        });

        if (existing) {
          console.log(`   ↻ Already exists: "${tweet.text.substring(0, 60)}..."`);
          continue;
        }

        // Save to database
        const feedItem = await prisma.feedItem.create({
          data: {
            type: 'ITK',
            twitterId: tweet.id,
            sourceId: itkSource.id,
            content: tweet.text,
            originalText: tweet.text,
            publishedAt: tweet.createdAt,
            originalShares: 0,
            originalLikes: 0,
            originalReplies: tweet.replies || 0,
            isPublished: false, // Will be published after Terry commentary
            relevanceScore: 0.9
          }
        });

        newCount++;
        results.newItems++;

        // Show preview
        console.log(`   🔥 NEW: "${tweet.text.substring(0, 80)}..."`);
        console.log(`       DB ID: ${feedItem.id} | Tweet: ${tweet.id}`);
        
        if (tweet.media && tweet.media.length > 0) {
          console.log(`       📷 ${tweet.media.length} media file(s)`);
        }
      }

      if (newCount > 0) {
        console.log(`   ✅ ${newCount} new transfer items saved`);
      } else {
        console.log(`   ✅ ${tweets.length} tweets checked, no new transfers`);
      }

      // Delay between sources
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.errors.push(`${source.username}: ${error.message}`);
    }
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 FRESH DATA POPULATION SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`Sources scraped: ${results.successfulSources}/${results.totalSources}`);
  console.log(`Total tweets checked: ${results.totalTweets}`);
  console.log(`Transfer-related: ${results.transferTweets} (${results.totalTweets > 0 ? ((results.transferTweets / results.totalTweets) * 100).toFixed(1) : 0}%)`);
  console.log(`NEW items saved: ${results.newItems}`);
  
  if (results.errors.length > 0) {
    console.log(`\nErrors (${results.errors.length}):`);
    results.errors.forEach(err => console.log(`  - ${err}`));
  }

  // Show current database state
  const totalFeedItems = await prisma.feedItem.count();
  const publishedItems = await prisma.feedItem.count({ where: { isPublished: true } });
  const unpublishedItems = await prisma.feedItem.count({ where: { isPublished: false } });

  console.log(`\n📊 Database State After Update:`);
  console.log(`   Total feed items: ${totalFeedItems}`);
  console.log(`   Published: ${publishedItems}`);
  console.log(`   Unpublished: ${unpublishedItems}`);

  console.log(`\nCompleted: ${new Date().toLocaleString()}`);

  // Close connections
  await scraper.close();
  await prisma.$disconnect();
}

// Run test
directSessionPopulate().catch(async (error) => {
  console.error('Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});