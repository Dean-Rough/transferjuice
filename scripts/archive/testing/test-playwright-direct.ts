#!/usr/bin/env tsx
/**
 * Direct Playwright test - see what Twitter returns
 */

import { chromium } from 'playwright';

async function testDirect() {
  console.log('🎭 Direct Playwright Test\n');
  
  const browser = await chromium.launch({
    headless: false, // Show browser
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  
  const page = await context.newPage();
  
  try {
    console.log('Navigating to Twitter...');
    await page.goto('https://twitter.com/FabrizioRomano', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    
    console.log('Page loaded. Taking screenshot...');
    await page.screenshot({ path: 'twitter-test.png' });
    
    // Check what we can find
    const selectors = {
      tweets: await page.$$('[data-testid="tweet"]').then(els => els.length),
      articles: await page.$$('article').then(els => els.length),
      mainContent: await page.$('main').then(el => !!el),
      primaryColumn: await page.$('[data-testid="primaryColumn"]').then(el => !!el),
    };
    
    console.log('\nPage structure:');
    console.log(`- Tweets found: ${selectors.tweets}`);
    console.log(`- Articles found: ${selectors.articles}`);
    console.log(`- Main content: ${selectors.mainContent}`);
    console.log(`- Primary column: ${selectors.primaryColumn}`);
    
    // Get page title
    const title = await page.title();
    console.log(`\nPage title: "${title}"`);
    
    // Check for login wall
    const loginPrompt = await page.$('text=/Log in|Sign up/i').then(el => !!el);
    if (loginPrompt) {
      console.log('\n⚠️ Twitter is showing a login wall');
    }
    
    console.log('\nWaiting 10 seconds for you to inspect the browser...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testDirect().catch(console.error);