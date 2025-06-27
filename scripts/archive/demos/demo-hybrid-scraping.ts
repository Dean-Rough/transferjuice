#!/usr/bin/env tsx
/**
 * Demo: Hybrid Twitter Scraping for Transfer News
 * Shows real transfer tweets from ITK sources
 */

import { config } from 'dotenv';
import { TwitterClient } from '@/lib/twitter/client';
import { GLOBAL_ITK_SOURCES } from '@/lib/twitter/globalSources';
// Simple transfer classification for demo
function classifyTransferTweet(text: string) {
  const lowerText = text.toLowerCase();
  const transferKeywords = [
    'transfer', 'signing', 'signed', 'medical', 'fee', 'contract', 'agreement',
    'here we go', 'done deal', 'official', 'confirmed', 'joins', 'loan',
    'negotiations', 'talks', 'interest', 'target', 'bid', 'offer'
  ];
  
  const matches = transferKeywords.filter(keyword => lowerText.includes(keyword));
  const isTransferRelated = matches.length > 0;
  const confidence = Math.min(matches.length * 0.3, 1);
  
  let transferType = 'RUMOUR';
  if (lowerText.includes('here we go') || lowerText.includes('done deal') || lowerText.includes('official')) {
    transferType = 'DONE';
  } else if (lowerText.includes('medical') || lowerText.includes('agreement')) {
    transferType = 'MEDICAL';
  } else if (lowerText.includes('negotiations') || lowerText.includes('talks')) {
    transferType = 'TALKS';
  }
  
  return {
    isTransferRelated,
    confidence,
    transferType,
    keywords: matches
  };
}

// Load environment variables
config({ path: '.env.local' });

// Ensure hybrid mode is enabled
process.env.USE_HYBRID_TWITTER = 'true';

async function demoHybridScraping() {
  console.log('🚀 TransferJuice Hybrid Twitter Demo\n');
  console.log('📡 Using scraper with API fallback for reliable ITK monitoring\n');
  
  const client = TwitterClient.getInstance();
  
  // Select a few top ITK sources
  const demoSources = [
    GLOBAL_ITK_SOURCES.find(s => s.handle === '@FabrizioRomano'),
    GLOBAL_ITK_SOURCES.find(s => s.handle === '@David_Ornstein'),
    GLOBAL_ITK_SOURCES.find(s => s.handle === '@DiMarzio'),
  ].filter(Boolean);
  
  console.log('👥 Monitoring Top ITK Sources:\n');
  
  for (const source of demoSources) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📰 ${source.handle} - ${source.name}`);
    console.log(`🌍 Region: ${source.region} | ⭐ Reliability: ${(source.reliability * 5).toFixed(1)}/5`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    try {
      // Fetch recent tweets (remove @ from handle)
      const username = source.handle.replace('@', '');
      const tweets = await client.getUserTweetsHybrid(username, 10);
      
      // Filter for transfer-related content
      let transferCount = 0;
      
      for (const tweet of tweets) {
        const classification = classifyTransferTweet(tweet.text);
        
        if (classification.isTransferRelated && classification.confidence > 0.7) {
          transferCount++;
          
          // Format timestamp
          const time = new Date(tweet.createdAt);
          const timeAgo = getTimeAgo(time);
          
          console.log(`\n🔥 TRANSFER NEWS (${timeAgo}):`);
          console.log(`📝 "${tweet.text.substring(0, 200)}${tweet.text.length > 200 ? '...' : ''}"`);
          
          if (classification.transferType) {
            console.log(`📊 Type: ${classification.transferType} | Confidence: ${Math.round(classification.confidence * 100)}%`);
          }
          
          if (tweet.media.length > 0) {
            console.log(`📷 Media: ${tweet.media.length} attachment(s)`);
          }
          
          console.log(`💬 Engagement: ${tweet.replies} replies`);
          
          // Show detected entities
          if (classification.keywords.length > 0) {
            console.log(`🏷️ Keywords: ${classification.keywords.join(', ')}`);
          }
        }
      }
      
      if (transferCount === 0) {
        console.log(`ℹ️ No recent transfer news from ${source.handle}`);
      } else {
        console.log(`\n✅ Found ${transferCount} transfer-related tweets`);
      }
      
    } catch (error) {
      console.error(`❌ Error fetching from ${source.handle}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Show system status
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 System Status');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const status = client.getHybridStatus();
  console.log(`🔧 Mode: ${status.mode}`);
  console.log(`✅ Scraper: ${status.scraperAvailable ? 'Available' : 'Disabled'}`);
  console.log(`📈 Scraper Failures: ${status.failureCount}/3`);
  
  const rateLimits = client.getRateLimitStatus();
  if (Object.keys(rateLimits).length > 0) {
    console.log('\n⏱️ API Rate Limits:');
    for (const [endpoint, info] of Object.entries(rateLimits)) {
      console.log(`  ${endpoint}: ${info.remaining}/${info.limit} (resets ${new Date(info.reset * 1000).toLocaleTimeString()})`);
    }
  }
  
  console.log('\n✨ Hybrid scraping demo complete!\n');
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Run the demo
demoHybridScraping().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});