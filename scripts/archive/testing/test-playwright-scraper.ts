#!/usr/bin/env tsx
/**
 * Test Playwright Twitter Scraper
 * Reliable scraping with media support
 */

import { config } from 'dotenv';
import { getPlaywrightScraper } from '@/lib/twitter/playwright-scraper';
import { GLOBAL_ITK_SOURCES } from '@/lib/twitter/globalSources';

// Load environment variables
config({ path: '.env.local' });

async function testPlaywrightScraper() {
  console.log('🎭 Testing Playwright Twitter Scraper\n');
  
  const scraper = getPlaywrightScraper({
    headless: false, // Show browser for testing
    timeout: 30000,
  });
  
  try {
    // Test connection first
    console.log('🔗 Testing Twitter connection...');
    const isConnected = await scraper.testConnection();
    
    if (!isConnected) {
      console.error('❌ Cannot connect to Twitter. Check your internet connection.');
      return;
    }
    
    console.log('✅ Twitter is accessible\n');
    
    // Test with a few ITK sources
    const testSources = [
      { username: 'FabrizioRomano', name: 'Fabrizio Romano' },
      { username: 'David_Ornstein', name: 'David Ornstein' },
      { username: 'JBurtTelegraph', name: 'Jason Burt' }
    ];
    
    for (const source of testSources) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📰 Scraping @${source.username} - ${source.name}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      
      try {
        const startTime = Date.now();
        const tweets = await scraper.scrapeUserTweets(source.username, 5);
        const elapsed = Date.now() - startTime;
        
        console.log(`⏱️ Scraped ${tweets.length} tweets in ${elapsed}ms\n`);
        
        for (const tweet of tweets) {
          console.log(`📝 Tweet ID: ${tweet.id}`);
          console.log(`   Text: "${tweet.text.substring(0, 100)}${tweet.text.length > 100 ? '...' : ''}"`);
          console.log(`   Posted: ${tweet.createdAt.toLocaleString()}`);
          console.log(`   Author: @${tweet.author.username} ${tweet.author.verified ? '✓' : ''}`);
          
          if (tweet.media.length > 0) {
            console.log(`   📷 Media: ${tweet.media.length} attachment(s)`);
            for (const media of tweet.media) {
              console.log(`      - ${media.type}: ${media.url.substring(0, 50)}...`);
            }
          }
          
          console.log(`   💬 Replies: ${tweet.replies}\n`);
        }
        
        // Highlight transfer-related content
        const transferKeywords = ['transfer', 'signing', 'medical', 'fee', 'contract', 'deal'];
        const transferTweets = tweets.filter(t => 
          transferKeywords.some(keyword => t.text.toLowerCase().includes(keyword))
        );
        
        if (transferTweets.length > 0) {
          console.log(`🔥 Found ${transferTweets.length} potential transfer tweet(s)`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to scrape @${source.username}:`, error);
      }
      
      // Small delay between users
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Test batch scraping
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Testing Batch Scraping');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const batchUsernames = ['SkySportsNews', 'BBCSport', 'TheAthleticFC'];
    console.log(`Scraping ${batchUsernames.length} accounts: ${batchUsernames.join(', ')}\n`);
    
    const batchStart = Date.now();
    const results = await scraper.scrapeMultipleUsers(batchUsernames, 3);
    const batchElapsed = Date.now() - batchStart;
    
    console.log(`✅ Batch complete in ${Math.round(batchElapsed / 1000)}s\n`);
    
    for (const [username, tweets] of results) {
      console.log(`@${username}: ${tweets.length} tweets scraped`);
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    // Clean up
    await scraper.close();
  }
  
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 Playwright Scraper Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('Pros:');
  console.log('✅ Works reliably without rate limits');
  console.log('✅ Gets all media (images, videos)');
  console.log('✅ Handles dynamic content');
  console.log('✅ Can bypass most anti-scraping measures\n');
  
  console.log('Cons:');
  console.log('⚠️ Slower than API (3-5s per account)');
  console.log('⚠️ Requires more resources');
  console.log('⚠️ May need proxy rotation for scale\n');
  
  console.log('For production, consider:');
  console.log('• Running headless for better performance');
  console.log('• Implementing proxy rotation');
  console.log('• Adding retry logic for failed pages');
  console.log('• Caching results aggressively\n');
}

// Run the test
testPlaywrightScraper().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});