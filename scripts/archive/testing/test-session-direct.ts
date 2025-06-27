#!/usr/bin/env tsx
/**
 * Direct test of saved session
 */

import { chromium } from 'playwright';
import path from 'path';

async function testSessionDirect() {
  console.log('🔍 Direct Session Test\n');
  
  const sessionPath = path.join(process.cwd(), '.twitter-sessions', 'juice_backer');
  console.log(`Session path: ${sessionPath}\n`);
  
  const context = await chromium.launchPersistentContext(sessionPath, {
    headless: false, // Show browser to see what happens
    viewport: { width: 1280, height: 800 },
  });
  
  const page = await context.newPage();
  
  try {
    console.log('Going to Twitter home...');
    await page.goto('https://twitter.com/home');
    
    // Wait a bit for page to load
    await page.waitForTimeout(5000);
    
    // Take screenshot
    await page.screenshot({ path: 'twitter-session-test.png' });
    console.log('Screenshot saved as twitter-session-test.png\n');
    
    // Check what we can see
    const elements = {
      tweets: await page.$$('[data-testid="tweet"]').then(els => els.length),
      primaryColumn: await page.$('[data-testid="primaryColumn"]').then(el => !!el),
      loginPrompt: await page.$('text=/Log in|Sign up/i').then(el => !!el),
      timeline: await page.$('[aria-label="Timeline: Your Home Timeline"]').then(el => !!el)
    };
    
    console.log('Page analysis:');
    console.log(`- Tweets visible: ${elements.tweets}`);
    console.log(`- Primary column: ${elements.primaryColumn}`);
    console.log(`- Login prompt: ${elements.loginPrompt}`);
    console.log(`- Home timeline: ${elements.timeline}`);
    
    if (elements.tweets > 0) {
      console.log('\n✅ Session appears to be working!');
      
      // Try to visit an ITK account
      console.log('\nTesting with @FabrizioRomano...');
      await page.goto('https://twitter.com/FabrizioRomano');
      await page.waitForTimeout(3000);
      
      const fabTweets = await page.$$('[data-testid="tweet"]').then(els => els.length);
      console.log(`Can see ${fabTweets} tweets from Fabrizio Romano`);
    } else if (elements.loginPrompt) {
      console.log('\n❌ Session not logged in - Twitter is showing login prompt');
    } else {
      console.log('\n⚠️ Cannot determine session status');
    }
    
    console.log('\nKeeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await context.close();
  }
}

testSessionDirect().catch(console.error);