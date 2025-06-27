#!/usr/bin/env tsx
/**
 * Test Hybrid Twitter Client
 * Tests scraper with API fallback for ITK sources
 */

import { config } from 'dotenv';
import { TwitterClient } from '@/lib/twitter/client';
import { GLOBAL_ITK_SOURCES } from '@/lib/twitter/globalSources';

// Load environment variables
config({ path: '.env.local' });

// Ensure hybrid mode is enabled
process.env.USE_HYBRID_TWITTER = 'true';

async function testHybridTwitter() {
  console.log('🧪 Testing Hybrid Twitter Client\n');
  
  const client = TwitterClient.getInstance();
  
  // Test 1: Check hybrid status
  console.log('📊 Hybrid Client Status:');
  const status = client.getHybridStatus();
  console.log(`  Mode: ${status.mode}`);
  console.log(`  Scraper Available: ${status.scraperAvailable}`);
  console.log(`  Failure Count: ${status.failureCount}\n`);
  
  // Test 2: Test with a few ITK sources
  const testSources = [
    { username: 'FabrizioRomano', name: 'Fabrizio Romano' },
    { username: 'David_Ornstein', name: 'David Ornstein' },
    { username: 'JPercyTelegraph', name: 'John Percy' }
  ];
  
  console.log('🔍 Testing with ITK Sources:\n');
  
  for (const source of testSources) {
    console.log(`\n📰 Testing @${source.username} (${source.name}):`);
    
    try {
      const startTime = Date.now();
      const tweets = await client.getUserTweetsHybrid(source.username, 5);
      const elapsed = Date.now() - startTime;
      
      console.log(`  ✅ Success! Retrieved ${tweets.length} tweets in ${elapsed}ms`);
      
      if (tweets.length > 0) {
        console.log(`  📝 Latest tweet (${new Date(tweets[0].createdAt).toLocaleString()}):`);
        console.log(`     "${tweets[0].text.substring(0, 100)}..."`);
        
        if (tweets[0].media.length > 0) {
          console.log(`     📷 Has ${tweets[0].media.length} media attachments`);
        }
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Test 3: Force scraper failure to test fallback
  console.log('\n\n🔄 Testing Fallback Behavior:');
  console.log('  (Simulating scraper failures by testing with invalid credentials)\n');
  
  // Save original credentials
  const originalUsername = process.env.TWITTER_SCRAPER_USERNAME;
  const originalPassword = process.env.TWITTER_SCRAPER_PASSWORD;
  
  // Temporarily set invalid credentials
  process.env.TWITTER_SCRAPER_USERNAME = 'invalid_user_12345';
  process.env.TWITTER_SCRAPER_PASSWORD = 'invalid_pass_12345';
  
  // Create new client instance to trigger re-initialization
  const testClient = new TwitterClient({
    bearerToken: process.env.TWITTER_BEARER_TOKEN!,
  });
  
  try {
    console.log('  🧪 Attempting with invalid scraper credentials...');
    const tweets = await testClient.getUserTweetsHybrid('FabrizioRomano', 3);
    console.log(`  ✅ Fallback worked! Retrieved ${tweets.length} tweets via API`);
  } catch (error) {
    console.error(`  ❌ Both methods failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Restore credentials
  process.env.TWITTER_SCRAPER_USERNAME = originalUsername;
  process.env.TWITTER_SCRAPER_PASSWORD = originalPassword;
  
  // Test 4: Check rate limit status
  console.log('\n\n📊 Rate Limit Status:');
  const rateLimits = client.getRateLimitStatus();
  
  if (Object.keys(rateLimits).length === 0) {
    console.log('  No rate limit data available yet');
  } else {
    for (const [endpoint, info] of Object.entries(rateLimits)) {
      console.log(`  ${endpoint}:`);
      console.log(`    Remaining: ${info.remaining}/${info.limit}`);
      console.log(`    Reset: ${new Date(info.reset * 1000).toLocaleTimeString()}`);
    }
  }
  
  // Test 5: Test batch functionality
  console.log('\n\n📦 Testing Batch Fetch:');
  const globalSources = GLOBAL_ITK_SOURCES;
  const batchTestSources = globalSources
    .filter(s => s.region === 'UK')
    .slice(0, 3)
    .map(s => ({ id: s.username, username: s.username }));
  
  try {
    console.log(`  Testing batch fetch for ${batchTestSources.length} UK sources...`);
    const batchResults = await client.batchGetUserTimelines(batchTestSources, {
      maxResults: 3
    });
    
    console.log(`  ✅ Successfully fetched ${batchResults.size} user timelines`);
    
    for (const [username, timeline] of batchResults) {
      const tweetCount = timeline.data?.length || 0;
      console.log(`    @${username}: ${tweetCount} tweets`);
    }
  } catch (error) {
    console.error(`  ❌ Batch fetch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  console.log('\n\n✨ Hybrid Twitter Client Test Complete!\n');
  
  // Final recommendations
  console.log('📋 Recommendations:');
  console.log('  1. Add Twitter scraper credentials to .env.local:');
  console.log('     TWITTER_SCRAPER_USERNAME=your_burner_account');
  console.log('     TWITTER_SCRAPER_PASSWORD=your_password');
  console.log('     USE_HYBRID_TWITTER=true');
  console.log('  2. Monitor scraper performance and adjust MAX_FAILURES if needed');
  console.log('  3. Consider implementing reply fetching for full conversation context');
  console.log('  4. Add metrics tracking for scraper vs API usage patterns\n');
}

// Run the test
testHybridTwitter().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});