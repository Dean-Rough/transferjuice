#!/usr/bin/env tsx
/**
 * Debug session scraping - see what's happening
 */

import { chromium } from 'playwright';
import path from 'path';

async function debugSessionScrape() {
  console.log('🔍 Debug Session Scraping\n');
  
  const sessionPath = path.join(process.cwd(), '.twitter-sessions', 'juice_backer');
  
  const context = await chromium.launchPersistentContext(sessionPath, {
    headless: false, // Show browser to see what's happening
    viewport: { width: 1280, height: 800 },
  });
  
  const page = await context.newPage();
  
  try {
    console.log('1. Going to Twitter home first...');
    await page.goto('https://twitter.com/home');
    await page.waitForTimeout(3000);
    
    // Check if we're logged in
    const homeTimeline = await page.$('[aria-label*="Timeline"]');
    const loginButton = await page.$('a[href="/login"]');
    
    if (loginButton && !homeTimeline) {
      console.log('❌ Not logged in - session expired');
      console.log('Run: npx tsx scripts/setup-twitter-session.ts');
      return;
    }
    
    console.log('✅ Logged in successfully\n');
    
    console.log('2. Navigating to @FabrizioRomano...');
    await page.goto('https://twitter.com/FabrizioRomano');
    
    console.log('3. Waiting for content to load...');
    
    // Try different selectors
    const selectors = [
      '[data-testid="tweet"]',
      'article',
      '[data-testid="cellInnerDiv"]',
      'div[data-testid="UserProfileSchema-test"]'
    ];
    
    let foundSelector = null;
    for (const selector of selectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`   Found ${elements.length} elements with selector: ${selector}`);
        foundSelector = selector;
        break;
      }
    }
    
    if (!foundSelector) {
      console.log('❌ No tweets found with any selector');
      console.log('Taking screenshot for debugging...');
      await page.screenshot({ path: 'debug-twitter.png' });
      console.log('Screenshot saved as debug-twitter.png');
    } else {
      // Try to extract tweet content
      console.log('\n4. Extracting tweet content...\n');
      
      const tweets = await page.$$eval(foundSelector, (elements, selector) => {
        return elements.slice(0, 3).map(el => {
          // Different extraction based on selector
          let text = '';
          let time = '';
          
          if (selector.includes('tweet')) {
            const textEl = el.querySelector('[data-testid="tweetText"]');
            const timeEl = el.querySelector('time');
            text = textEl?.textContent || '';
            time = timeEl?.getAttribute('datetime') || '';
          } else {
            // Try generic text extraction
            text = el.textContent?.substring(0, 200) || '';
          }
          
          return { text, time, html: el.innerHTML.substring(0, 200) };
        });
      }, foundSelector);
      
      tweets.forEach((tweet, i) => {
        console.log(`Tweet ${i + 1}:`);
        console.log(`Text: "${tweet.text?.substring(0, 150)}..."`);
        if (tweet.time) {
          console.log(`Time: ${new Date(tweet.time).toLocaleString()}`);
        }
        console.log('---');
      });
    }
    
    console.log('\nKeeping browser open for inspection...');
    console.log('Check if you can see tweets in the browser window');
    console.log('Press Ctrl+C to close\n');
    
    // Keep browser open
    await page.waitForTimeout(60000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await context.close();
  }
}

debugSessionScrape().catch(console.error);