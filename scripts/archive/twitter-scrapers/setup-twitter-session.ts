#!/usr/bin/env tsx
/**
 * Setup Twitter Session for Automated Scraping
 * Step 1: Manual login and session save
 */

import { chromium } from 'playwright';
import { config } from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

config({ path: '.env.local' });

async function setupTwitterSession() {
  console.log('🔐 Twitter Session Setup\n');
  
  const username = process.env.TWITTER_AUTH_USERNAME || process.env.TWITTER_SCRAPER_USERNAME || 'juice_backer';
  const sessionPath = path.join(process.cwd(), '.twitter-sessions', username);
  
  console.log(`Account: @${username}`);
  console.log(`Session will be saved to: ${sessionPath}\n`);
  
  // Create session directory
  await fs.mkdir(sessionPath, { recursive: true });
  
  console.log('📝 Instructions:');
  console.log('1. A browser will open to Twitter');
  console.log('2. Login with your credentials');
  console.log('3. Complete any verification (email/phone)');
  console.log('4. Once you see your timeline, come back here');
  console.log('5. Press Enter to save the session\n');
  
  console.log('Starting browser...\n');
  
  const browser = await chromium.launchPersistentContext(sessionPath, {
    headless: false,
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  
  const page = await browser.newPage();
  
  // Go to Twitter
  await page.goto('https://twitter.com/home');
  
  console.log('⏳ Browser opened. Please login to Twitter.');
  console.log('   Press Enter here when you see your timeline...\n');
  
  // Wait for user input
  await new Promise((resolve) => {
    process.stdin.once('data', resolve);
  });
  
  console.log('🔍 Checking login status...\n');
  
  try {
    // Check if we can see tweets
    await page.goto('https://twitter.com/home');
    await page.waitForSelector('[data-testid="tweet"]', { timeout: 5000 });
    
    console.log('✅ Login successful! Testing access...\n');
    
    // Test by visiting an ITK account
    await page.goto('https://twitter.com/FabrizioRomano');
    await page.waitForSelector('[data-testid="tweet"]', { timeout: 5000 });
    
    const tweets = await page.$$('[data-testid="tweet"]');
    console.log(`✅ Can see ${tweets.length} tweets from @FabrizioRomano`);
    
    // Save some metadata
    const metadata = {
      username,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      status: 'active'
    };
    
    await fs.writeFile(
      path.join(sessionPath, 'session-metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    console.log('\n✅ Session saved successfully!');
    console.log(`📁 Location: ${sessionPath}`);
    
  } catch (error) {
    console.error('❌ Login verification failed');
    console.error('Make sure you completed the login process');
  }
  
  await browser.close();
  
  console.log('\n✨ Setup complete! Now run the scraper test:');
  console.log('   npm run test:session-scraper\n');
}

setupTwitterSession().catch(console.error);