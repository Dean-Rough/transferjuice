#!/usr/bin/env tsx
/**
 * Debug headless scraper - find out why no tweets found
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

async function debugHeadless() {
  console.log('🔍 Debugging headless scraper...\n');
  
  const sessionPath = path.join(process.cwd(), '.twitter-sessions', 'juice_backer');
  
  const context = await chromium.launchPersistentContext(sessionPath, {
    headless: true,
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  try {
    // Check login status first
    console.log('1. Checking login status...');
    await page.goto('https://twitter.com/home', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    const loginButton = await page.$('[href="/login"]');
    if (loginButton) {
      console.log('❌ Session expired - need to re-login');
      console.log('Run: npx tsx scripts/setup-twitter-session.ts');
      return;
    }
    console.log('✅ Logged in successfully');

    // Test with one account
    console.log('\n2. Testing @FabrizioRomano...');
    await page.goto('https://twitter.com/FabrizioRomano', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });

    console.log('3. Waiting for content...');
    await page.waitForTimeout(5000);

    // Take screenshot for debugging (headless)
    await page.screenshot({ 
      path: 'headless-debug.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved: headless-debug.png');

    // Check page content
    const title = await page.title();
    console.log(`Page title: "${title}"`);

    // Try different selectors
    const selectors = [
      'article',
      '[data-testid="tweet"]',
      '[data-testid="cellInnerDiv"]',
      'div[data-testid="primaryColumn"]'
    ];

    for (const selector of selectors) {
      const count = await page.$$eval(selector, els => els.length);
      console.log(`${selector}: ${count} elements`);
    }

    // Get page HTML snippet
    const bodyText = await page.$eval('body', el => el.textContent?.substring(0, 200) || '');
    console.log(`\nPage content preview: "${bodyText}..."`);

    // Check for error messages
    const errorTexts = [
      'Something went wrong',
      'Try again',
      'Rate limit',
      'Temporarily restricted'
    ];

    for (const errorText of errorTexts) {
      const hasError = await page.locator(`text=${errorText}`).count();
      if (hasError > 0) {
        console.log(`⚠️ Found error: "${errorText}"`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await context.close();
  }
}

debugHeadless().catch(console.error);