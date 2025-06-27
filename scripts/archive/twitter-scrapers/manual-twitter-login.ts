#!/usr/bin/env tsx
/**
 * Manual Twitter Login Helper
 * Helps you login manually and saves the session
 */

import { chromium } from 'playwright';
import { config } from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

config({ path: '.env.local' });

async function manualLogin() {
  console.log('🔐 Twitter Manual Login Helper\n');
  
  const username = process.env.TWITTER_AUTH_USERNAME || process.env.TWITTER_SCRAPER_USERNAME;
  
  if (!username) {
    console.error('❌ No Twitter username found in environment');
    return;
  }
  
  console.log(`This will help you login to Twitter as @${username} and save the session.\n`);
  
  // Create directory for session storage
  const sessionDir = path.join(process.cwd(), '.twitter-session');
  await fs.mkdir(sessionDir, { recursive: true });
  
  const browser = await chromium.launch({
    headless: false, // Always show browser for manual login
  });
  
  // Use persistent context to save cookies
  const context = await browser.newContext({
    userDataDir: sessionDir,
    viewport: { width: 1280, height: 800 },
  });
  
  const page = await context.newPage();
  
  console.log('📝 Instructions:');
  console.log('1. Browser will open to Twitter login page');
  console.log('2. Login manually with your credentials');
  console.log('3. Complete any verification steps Twitter requires');
  console.log('4. Once you see your timeline, press Enter here\n');
  
  // Navigate to Twitter
  await page.goto('https://twitter.com/login');
  
  // Wait for user to complete login
  console.log('⏳ Waiting for you to complete login...');
  console.log('Press Enter when you see your Twitter timeline...');
  
  await new Promise<void>((resolve) => {
    process.stdin.once('data', () => {
      resolve();
    });
  });
  
  // Check if login was successful
  try {
    await page.waitForSelector('[data-testid="tweet"]', { timeout: 5000 });
    console.log('\n✅ Login successful! Session saved.');
    
    // Test by navigating to an ITK account
    console.log('\n🔍 Testing saved session...');
    await page.goto('https://twitter.com/FabrizioRomano');
    await page.waitForSelector('[data-testid="tweet"]', { timeout: 5000 });
    
    const tweetCount = await page.$$eval('[data-testid="tweet"]', els => els.length);
    console.log(`✅ Can see ${tweetCount} tweets from @FabrizioRomano`);
    
    console.log('\n✨ Session saved successfully!');
    console.log(`📁 Session stored in: ${sessionDir}`);
    console.log('\nYou can now use the automated scraper with this saved session.');
    
  } catch (error) {
    console.error('\n❌ Login verification failed');
    console.error('Make sure you completed the login process');
  }
  
  await browser.close();
}

// Create scraper that uses saved session
console.log(`
Next steps:
1. Run this script to login manually
2. Update your scraper to use the saved session:

const context = await browser.newContext({
  userDataDir: '.twitter-session'
});
`);

manualLogin().catch(console.error);