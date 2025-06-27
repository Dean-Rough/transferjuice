#!/usr/bin/env tsx
/**
 * Scrape Twitter using saved session - simplified version
 */

import { chromium } from 'playwright';
import path from 'path';

async function scrapeWithSession() {
  console.log('🔐 Scraping Twitter with Saved Session\n');
  
  const sessionPath = path.join(process.cwd(), '.twitter-sessions', 'juice_backer');
  
  const context = await chromium.launchPersistentContext(sessionPath, {
    headless: true, // Run headless for speed
    viewport: { width: 1280, height: 800 },
  });
  
  const page = await context.newPage();
  
  try {
    // Test accounts
    const accounts = [
      'FabrizioRomano',
      'David_Ornstein', 
      'JPercyTelegraph',
      'SkySportsNews'
    ];
    
    for (const username of accounts) {
      console.log(`\n📰 Scraping @${username}...`);
      
      await page.goto(`https://twitter.com/${username}`, {
        waitUntil: 'networkidle'
      });
      
      // Wait for tweets to load
      await page.waitForTimeout(3000);
      
      // Get tweets
      const tweets = await page.$$eval('[data-testid="tweet"]', elements => 
        elements.slice(0, 5).map(el => {
          const textEl = el.querySelector('[data-testid="tweetText"]');
          const timeEl = el.querySelector('time');
          const imageCount = el.querySelectorAll('img[alt="Image"]').length;
          
          return {
            text: textEl ? textEl.textContent?.substring(0, 200) : 'No text',
            time: timeEl ? timeEl.getAttribute('datetime') : 'Unknown time',
            hasImages: imageCount > 0,
            imageCount
          };
        })
      );
      
      console.log(`Found ${tweets.length} tweets\n`);
      
      // Look for transfer news
      const transferKeywords = ['transfer', 'signing', 'medical', 'fee', 'deal', 'agreed', 'bid'];
      
      tweets.forEach((tweet, i) => {
        const isTransfer = transferKeywords.some(keyword => 
          tweet.text.toLowerCase().includes(keyword)
        );
        
        if (isTransfer) {
          console.log(`🔥 TRANSFER NEWS:`);
          console.log(`   "${tweet.text}..."`);
          console.log(`   Time: ${new Date(tweet.time).toLocaleString()}`);
          if (tweet.hasImages) {
            console.log(`   📷 ${tweet.imageCount} image(s)`);
          }
          console.log('');
        } else if (i === 0) {
          // Show latest tweet even if not transfer
          console.log(`Latest tweet:`);
          console.log(`   "${tweet.text}..."`);
          console.log(`   Time: ${new Date(tweet.time).toLocaleString()}`);
        }
      });
      
      // Small delay between accounts
      await page.waitForTimeout(2000);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Scraping Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('Key Points:');
    console.log('• Session-based scraping works without login');
    console.log('• Can access all tweets (not just 3)');
    console.log('• No rate limits');
    console.log('• Session valid for 1-2 weeks typically\n');
    
    console.log('To monitor all 44 ITK sources:');
    console.log('• ~3-4 minutes total');
    console.log('• Add 2-3 second delays');
    console.log('• Run hourly for live updates');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await context.close();
  }
}

scrapeWithSession().catch(console.error);