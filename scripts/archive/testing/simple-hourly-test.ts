#!/usr/bin/env tsx
/**
 * Simple hourly test - populate database with fresh transfer data
 */

import { HybridTwitterClient } from '../src/lib/twitter/hybrid-client';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

async function simpleHourlyTest() {
  console.log('🌍 SIMPLE HOURLY TEST - FRESH DATA POPULATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Started: ${new Date().toLocaleString()}\n`);

  // Check session exists
  const sessionPath = path.join(process.cwd(), '.twitter-sessions', 'juice_backer');
  try {
    await fs.access(sessionPath);
    console.log('✅ Session found\n');
  } catch {
    console.error('❌ No saved session found!');
    console.log('Run: npx tsx scripts/setup-twitter-session.ts');
    return;
  }

  // Initialize hybrid client with session scraper
  const client = new HybridTwitterClient({
    bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
    useApify: false,
    usePlaywright: true, // Use session-based scraping
    authUsername: 'juice_backer'
  });

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
    { username: 'DeadlineDayLive', name: 'Deadline Day Live', region: 'UK' },
    { username: 'JPercyTelegraph', name: 'John Percy', region: 'UK' }
  ];

  console.log(`Testing ${testSources.length} key ITK sources:\n`);

  for (const source of testSources) {
    results.totalSources++;
    
    try {
      console.log(`📰 @${source.username} - ${source.name}`);
      
      // Fetch tweets
      const tweets = await client.getUserTweets(source.username, 5);
      
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
        const existing = await prisma.feedItem.findUnique({
          where: { tweetId: tweet.id }
        });

        if (existing) {
          console.log(`   ↻ Already exists: "${tweet.text.substring(0, 60)}..."`);
          continue;
        }

        // Save to database
        const feedItem = await prisma.feedItem.create({
          data: {
            tweetId: tweet.id,
            sourceId: source.username,
            sourceName: source.name,
            sourceRegion: source.region,
            content: tweet.text,
            timestamp: new Date(tweet.created_at),
            mediaUrls: tweet.mediaUrls || [],
            classification: {
              isTransferRelated: true,
              confidence: 0.9,
              keywords: transferKeywords.filter(k => tweet.text.toLowerCase().includes(k))
            },
            isPublished: false, // Will be published after Terry commentary
            metadata: {
              replies: tweet.replies || 0,
              verified: tweet.author?.verified || false,
              region: source.region,
              language: 'en'
            }
          }
        });

        newCount++;
        results.newItems++;

        // Show preview
        console.log(`   🔥 NEW: "${tweet.text.substring(0, 80)}..."`);
        console.log(`       ID: ${feedItem.id} | Tweet: ${tweet.id}`);
      }

      if (newCount > 0) {
        console.log(`   ✅ ${newCount} new transfer items saved`);
      } else {
        console.log(`   ✅ ${tweets.length} tweets checked, no new transfers`);
      }

      // Delay between sources
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.errors.push(`${source.username}: ${error.message}`);
    }
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 FRESH DATA POPULATION SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`Sources tested: ${results.successfulSources}/${results.totalSources}`);
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
  await prisma.$disconnect();
  await client.close();
}

const startTime = Date.now();

// Run test
simpleHourlyTest().catch(async (error) => {
  console.error('Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});