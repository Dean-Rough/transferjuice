#!/usr/bin/env tsx
/**
 * Working session scraper with better wait strategies
 */

import { chromium } from 'playwright';
import path from 'path';

async function workingSessionScrape() {
  console.log('🔐 Twitter Session Scraper (Improved)\n');
  
  const sessionPath = path.join(process.cwd(), '.twitter-sessions', 'juice_backer');
  
  const context = await chromium.launchPersistentContext(sessionPath, {
    headless: false, // Show browser for now
    viewport: { width: 1280, height: 800 },
    // Add more browser-like settings
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    permissions: [],
    geolocation: undefined,
    locale: 'en-US',
  });
  
  const page = await context.newPage();
  
  try {
    // Start with home to ensure we're logged in
    console.log('Checking login status...');
    await page.goto('https://twitter.com/home', { 
      waitUntil: 'domcontentloaded' 
    });
    
    // Wait for initial load
    await page.waitForTimeout(5000);
    
    // Test with Fabrizio
    console.log('\nNavigating to @FabrizioRomano...');
    await page.goto('https://twitter.com/FabrizioRomano', {
      waitUntil: 'domcontentloaded'
    });
    
    // IMPORTANT: Wait for Twitter's React app to render
    console.log('Waiting for tweets to load (this takes 5-10 seconds)...');
    
    // Try multiple wait strategies
    try {
      // Wait for any tweet-like element
      await page.waitForSelector('article', { 
        timeout: 15000,
        state: 'attached' 
      });
      console.log('✅ Found article elements');
    } catch {
      console.log('⚠️ No articles found, trying other selectors...');
    }
    
    // Additional wait for content to fully render
    await page.waitForTimeout(5000);
    
    // Now try to find tweets with multiple strategies
    console.log('\nSearching for tweets...\n');
    
    // Strategy 1: Look for articles with specific attributes
    const articles = await page.$$('article');
    console.log(`Found ${articles.length} article elements`);
    
    if (articles.length > 0) {
      // Extract data from first few articles
      for (let i = 0; i < Math.min(3, articles.length); i++) {
        const article = articles[i];
        
        try {
          // Get all text within the article
          const allText = await article.innerText();
          const lines = allText.split('\n').filter(line => line.trim());
          
          // The tweet text is usually one of the longer lines
          const tweetText = lines.find(line => line.length > 50) || lines[0];
          
          // Look for time
          const timeElement = await article.$('time');
          const time = timeElement ? await timeElement.getAttribute('datetime') : null;
          
          // Look for images
          const images = await article.$$('img[src*="pbs.twimg.com/media"]');
          
          console.log(`📝 Tweet ${i + 1}:`);
          console.log(`   Text: "${tweetText?.substring(0, 150)}${tweetText?.length > 150 ? '...' : ''}"`);
          if (time) {
            console.log(`   Time: ${new Date(time).toLocaleString()}`);
          }
          if (images.length > 0) {
            console.log(`   📷 ${images.length} image(s)`);
          }
          
          // Check if it's transfer related
          const transferKeywords = ['transfer', 'signing', 'medical', 'fee', 'deal', 'agreed', 'bid', 'contract'];
          const isTransfer = transferKeywords.some(keyword => 
            tweetText?.toLowerCase().includes(keyword)
          );
          
          if (isTransfer) {
            console.log(`   🔥 TRANSFER RELATED!`);
          }
          
          console.log('');
        } catch (err) {
          console.log(`   Could not parse tweet ${i + 1}`);
        }
      }
    }
    
    // Try another account
    console.log('\nTrying @SkySportsNews...');
    await page.goto('https://twitter.com/SkySportsNews', {
      waitUntil: 'domcontentloaded'
    });
    
    await page.waitForTimeout(5000);
    
    const skyArticles = await page.$$('article');
    console.log(`Found ${skyArticles.length} tweets from Sky Sports News`);
    
    if (skyArticles.length > 0) {
      const firstTweet = await skyArticles[0].innerText();
      console.log(`\nLatest Sky Sports tweet preview:`);
      console.log(`"${firstTweet.substring(0, 200)}..."`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (articles.length > 0 || skyArticles.length > 0) {
      console.log('✅ Session scraping is WORKING!');
      console.log('• We can access tweets without login prompts');
      console.log('• Need to wait 5-10 seconds for content to load');
      console.log('• Twitter uses dynamic rendering (React)');
      console.log('• Article elements contain the tweet data\n');
      
      console.log('Next steps:');
      console.log('1. Run in headless mode for production');
      console.log('2. Add better text extraction logic');
      console.log('3. Parse media URLs properly');
      console.log('4. Handle rate limiting with delays');
    } else {
      console.log('❌ Could not find tweets');
      console.log('Possible issues:');
      console.log('• Session might be invalid');
      console.log('• Twitter might have changed layout');
      console.log('• Need different wait strategies');
    }
    
    console.log('\nClosing in 10 seconds...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Error:', error);
    
    // Take debug screenshot on error
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('Screenshot saved as error-screenshot.png');
  } finally {
    await context.close();
  }
}

workingSessionScrape().catch(console.error);