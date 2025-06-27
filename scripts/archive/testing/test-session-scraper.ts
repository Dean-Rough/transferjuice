#!/usr/bin/env tsx
/**
 * Test Session-based Twitter Scraper
 */

import { config } from 'dotenv';
import { getSessionScraper } from '@/lib/twitter/session-scraper';
import { GLOBAL_ITK_SOURCES } from '@/lib/twitter/globalSources';

config({ path: '.env.local' });

async function testSessionScraper() {
  console.log('🔐 Testing Session-based Twitter Scraper\n');
  
  const scraper = getSessionScraper();
  
  try {
    // Initialize and validate session
    console.log('📂 Loading saved session...');
    await scraper.initialize();
    
    console.log('🔍 Validating session...');
    const isValid = await scraper.validateSession();
    
    if (!isValid) {
      console.error('❌ Session is invalid or expired');
      console.error('Run: npm run setup:twitter-session');
      return;
    }
    
    console.log('✅ Session is valid!\n');
    
    // Test with some ITK sources
    const testSources = [
      { username: 'FabrizioRomano', name: 'Fabrizio Romano' },
      { username: 'David_Ornstein', name: 'David Ornstein' },
      { username: 'SkySportsNews', name: 'Sky Sports News' },
    ];
    
    for (const source of testSources) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📰 Scraping @${source.username}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      
      try {
        const startTime = Date.now();
        const tweets = await scraper.scrapeUserTweets(source.username, 5);
        const elapsed = Date.now() - startTime;
        
        console.log(`⏱️ Scraped ${tweets.length} tweets in ${elapsed}ms\n`);
        
        // Look for transfer news
        const transferKeywords = ['transfer', 'signing', 'medical', 'fee', 'deal', 'agreed', 'talks', 'bid', 'offer'];
        let foundTransfers = false;
        
        for (const tweet of tweets) {
          const isTransfer = transferKeywords.some(keyword => 
            tweet.text.toLowerCase().includes(keyword)
          );
          
          if (isTransfer) {
            foundTransfers = true;
            console.log(`🔥 TRANSFER NEWS:`);
            console.log(`   "${tweet.text.substring(0, 200)}${tweet.text.length > 200 ? '...' : ''}"`);
            console.log(`   📅 ${tweet.createdAt.toLocaleString()}`);
            
            if (tweet.media.length > 0) {
              console.log(`   📷 ${tweet.media.length} media attachment(s)`);
              for (const m of tweet.media) {
                console.log(`      - ${m.type}: ${m.url.substring(0, 50)}...`);
              }
            }
            console.log(`   💬 ${tweet.replies} replies`);
            console.log('');
          }
        }
        
        if (!foundTransfers && tweets.length > 0) {
          console.log(`Latest tweet:`);
          console.log(`"${tweets[0].text.substring(0, 200)}..."`);
          console.log(`Posted: ${tweets[0].createdAt.toLocaleString()}`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to scrape @${source.username}:`, error);
      }
    }
    
    // Show how to monitor all ITK sources
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 Full ITK Monitoring Example');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const ukSources = GLOBAL_ITK_SOURCES
      .filter(s => s.region === 'UK')
      .slice(0, 3);
    
    console.log(`Would monitor ${GLOBAL_ITK_SOURCES.length} sources total:`);
    console.log(`- UK: ${GLOBAL_ITK_SOURCES.filter(s => s.region === 'UK').length} sources`);
    console.log(`- Italy: ${GLOBAL_ITK_SOURCES.filter(s => s.region === 'IT').length} sources`);
    console.log(`- Spain: ${GLOBAL_ITK_SOURCES.filter(s => s.region === 'ES').length} sources`);
    console.log(`- Global: ${GLOBAL_ITK_SOURCES.filter(s => s.region === 'GLOBAL').length} sources\n`);
    
    console.log('Estimated time for full scrape: ~3-4 minutes');
    console.log('With 2-3 second delays between accounts');
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await scraper.close();
  }
  
  console.log('\n✨ Session scraper test complete!\n');
}

testSessionScraper().catch(console.error);