#!/usr/bin/env tsx
/**
 * Test Authenticated Playwright Scraper
 */

import { config } from 'dotenv';
import { createAuthenticatedScraper } from '@/lib/twitter/playwright-scraper-auth';

// Load environment variables
config({ path: '.env.local' });

async function testAuthenticatedScraper() {
  console.log('🔐 Testing Authenticated Twitter Scraper\n');
  
  // Check if credentials are set
  const username = process.env.TWITTER_AUTH_USERNAME || process.env.TWITTER_SCRAPER_USERNAME;
  const password = process.env.TWITTER_AUTH_PASSWORD || process.env.TWITTER_SCRAPER_PASSWORD;
  
  if (!username || !password) {
    console.error('❌ Twitter credentials not found in environment variables');
    console.error('Please set TWITTER_AUTH_USERNAME and TWITTER_AUTH_PASSWORD in .env.local');
    return;
  }
  
  console.log(`📧 Using account: @${username}\n`);
  
  const scraper = createAuthenticatedScraper(username, password, {
    headless: false, // Show browser so you can see what's happening
    timeout: 60000, // Longer timeout for login
  });
  
  try {
    // Test login
    console.log('🔐 Attempting to login...');
    await scraper.login();
    console.log('✅ Login successful!\n');
    
    // Test scraping a few ITK accounts
    const testAccounts = [
      { username: 'FabrizioRomano', name: 'Fabrizio Romano' },
      { username: 'David_Ornstein', name: 'David Ornstein' },
      { username: 'SkySportsNews', name: 'Sky Sports News' },
    ];
    
    for (const account of testAccounts) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📰 Scraping @${account.username} - ${account.name}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      
      try {
        const startTime = Date.now();
        const tweets = await scraper.scrapeUserTweets(account.username, 5);
        const elapsed = Date.now() - startTime;
        
        console.log(`⏱️ Scraped ${tweets.length} tweets in ${elapsed}ms\n`);
        
        // Show transfer-related tweets
        const transferKeywords = ['transfer', 'signing', 'medical', 'fee', 'deal', 'contract', 'agreed', 'talks'];
        let transferCount = 0;
        
        for (const tweet of tweets) {
          const isTransfer = transferKeywords.some(keyword => 
            tweet.text.toLowerCase().includes(keyword)
          );
          
          if (isTransfer) {
            transferCount++;
            console.log(`🔥 TRANSFER NEWS:`);
            console.log(`   "${tweet.text.substring(0, 150)}${tweet.text.length > 150 ? '...' : ''}"`);
            console.log(`   📅 ${tweet.createdAt.toLocaleString()}`);
            
            if (tweet.media.length > 0) {
              console.log(`   📷 ${tweet.media.length} media attachment(s)`);
            }
            console.log(`   💬 ${tweet.replies} replies`);
            console.log('');
          }
        }
        
        if (transferCount === 0) {
          console.log(`ℹ️ No transfer news in recent tweets`);
          // Show one regular tweet as example
          if (tweets.length > 0) {
            console.log(`\nLatest tweet:`);
            console.log(`"${tweets[0].text.substring(0, 150)}..."`);
          }
        }
        
      } catch (error) {
        console.error(`❌ Failed to scrape @${account.username}:`, error);
      }
      
      // Small delay between accounts
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('verification')) {
        console.error('\n⚠️ Twitter is asking for additional verification (email/phone)');
        console.error('This account may need manual verification first');
      } else if (error.message.includes('password')) {
        console.error('\n⚠️ Invalid username or password');
      }
    }
  } finally {
    console.log('\n\nClosing browser...');
    await scraper.close();
  }
  
  console.log('\n✨ Test complete!\n');
}

// Run the test
testAuthenticatedScraper().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});