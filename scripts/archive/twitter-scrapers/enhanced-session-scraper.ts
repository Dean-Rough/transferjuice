#!/usr/bin/env tsx
/**
 * Enhanced session-based Twitter scraper with better error handling and data extraction
 */

import { chromium, Page } from 'playwright';
import path from 'path';
import fs from 'fs/promises';

interface Tweet {
  id: string;
  text: string;
  author: string;
  timestamp: Date;
  images: string[];
  isTransferRelated: boolean;
  transferKeywords: string[];
  url: string;
}

class EnhancedTwitterScraper {
  private sessionPath: string;
  private transferKeywords = [
    'transfer', 'signing', 'medical', 'fee', 'deal', 'agreed', 'bid',
    'contract', 'loan', 'permanent', 'option', 'clause', 'negotiating',
    'talks', 'interest', 'target', 'move', 'join', 'sign', 'official',
    'confirmed', 'here we go', 'done deal', 'exclusive'
  ];

  constructor(username = 'juice_backer') {
    this.sessionPath = path.join(process.cwd(), '.twitter-sessions', username);
  }

  async checkSessionValid(): Promise<boolean> {
    try {
      await fs.access(this.sessionPath);
      return true;
    } catch {
      return false;
    }
  }

  async scrapeTweets(username: string, limit = 10): Promise<Tweet[]> {
    console.log(`\n🔍 Scraping @${username}...`);
    
    const context = await chromium.launchPersistentContext(this.sessionPath, {
      headless: true, // Run headless (no visible browser)
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();
    const tweets: Tweet[] = [];

    try {
      // First check if we're logged in
      await page.goto('https://twitter.com/home', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // Check for login prompt
      const loginPrompt = await page.$('[href="/login"]');
      if (loginPrompt) {
        console.error('❌ Session expired - need to re-authenticate');
        console.log('Run: npx tsx scripts/setup-twitter-session.ts');
        return tweets;
      }

      // Navigate to user profile
      await page.goto(`https://twitter.com/${username}`, { 
        waitUntil: 'domcontentloaded' 
      });

      // Wait for tweets to load
      console.log('Waiting for tweets to load...');
      await page.waitForSelector('article', { timeout: 15000 });
      await page.waitForTimeout(3000); // Extra time for dynamic content

      // Scroll to load more tweets
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, 500));
        await page.waitForTimeout(1000);
      }

      // Extract tweets with better selectors
      const articles = await page.$$('article');
      console.log(`Found ${articles.length} tweet articles`);

      for (let i = 0; i < Math.min(limit, articles.length); i++) {
        try {
          const tweet = await this.extractTweetData(articles[i], page, username);
          if (tweet) {
            tweets.push(tweet);
            
            if (tweet.isTransferRelated) {
              console.log(`\n🔥 TRANSFER NEWS FOUND:`);
              console.log(`   "${tweet.text.substring(0, 150)}..."`);
              console.log(`   Keywords: ${tweet.transferKeywords.join(', ')}`);
              console.log(`   Time: ${tweet.timestamp.toLocaleString()}`);
              if (tweet.images.length > 0) {
                console.log(`   📷 ${tweet.images.length} image(s)`);
              }
            }
          }
        } catch (err) {
          console.log(`Could not extract tweet ${i + 1}: ${err.message}`);
        }
      }

      console.log(`\n✅ Extracted ${tweets.length} tweets from @${username}`);

    } catch (error) {
      console.error(`Error scraping ${username}:`, error);
      
      // Take screenshot on error
      await page.screenshot({ 
        path: `error-${username}-${Date.now()}.png`,
        fullPage: true 
      });
      console.log('Screenshot saved for debugging');
    } finally {
      await context.close();
    }

    return tweets;
  }

  private async extractTweetData(
    article: any, 
    page: Page, 
    username: string
  ): Promise<Tweet | null> {
    try {
      // Extract text - try multiple selectors
      let text = '';
      const textSelectors = [
        '[data-testid="tweetText"]',
        '[lang]',
        'div[dir="auto"]'
      ];

      for (const selector of textSelectors) {
        const textEl = await article.$(selector);
        if (textEl) {
          text = await textEl.innerText();
          if (text && text.length > 10) break;
        }
      }

      if (!text) {
        // Fallback to all text
        text = await article.innerText();
        // Extract the main tweet text (usually after the author name)
        const lines = text.split('\n').filter(line => line.trim());
        text = lines.find(line => line.length > 30) || lines.join(' ');
      }

      // Extract timestamp
      const timeEl = await article.$('time');
      const timeStr = timeEl ? await timeEl.getAttribute('datetime') : null;
      const timestamp = timeStr ? new Date(timeStr) : new Date();

      // Extract images
      const images: string[] = [];
      const imageEls = await article.$$('img[src*="pbs.twimg.com/media"]');
      for (const imgEl of imageEls) {
        const src = await imgEl.getAttribute('src');
        if (src) images.push(src);
      }

      // Check if transfer related
      const foundKeywords = this.transferKeywords.filter(keyword => 
        text.toLowerCase().includes(keyword)
      );
      const isTransferRelated = foundKeywords.length > 0;

      // Generate tweet ID from timestamp and text
      const id = `${username}_${timestamp.getTime()}_${text.substring(0, 20).replace(/\s/g, '')}`;

      // Get tweet URL (approximate)
      const url = `https://twitter.com/${username}/status/${timestamp.getTime()}`;

      return {
        id,
        text: text.substring(0, 500), // Limit text length
        author: username,
        timestamp,
        images,
        isTransferRelated,
        transferKeywords: foundKeywords,
        url
      };
    } catch (error) {
      console.error('Error extracting tweet data:', error);
      return null;
    }
  }

  async scrapeMultipleAccounts(accounts: string[]): Promise<Map<string, Tweet[]>> {
    const results = new Map<string, Tweet[]>();
    
    console.log('🚀 Starting multi-account scraping...\n');
    console.log(`Accounts to scrape: ${accounts.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (const account of accounts) {
      const tweets = await this.scrapeTweets(account, 5);
      results.set(account, tweets);
      
      // Delay between accounts to avoid detection
      if (accounts.indexOf(account) < accounts.length - 1) {
        console.log('\nWaiting before next account...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    return results;
  }
}

// Main execution
async function main() {
  const scraper = new EnhancedTwitterScraper();

  // Check if session exists
  if (!await scraper.checkSessionValid()) {
    console.error('❌ No saved session found!');
    console.log('Please run: npx tsx scripts/setup-twitter-session.ts');
    return;
  }

  // Test with key ITK sources
  const itkSources = [
    'FabrizioRomano',
    'David_Ornstein',
    'JPercyTelegraph',
    'SkySportsNews',
    'DeadlineDayLive'
  ];

  const results = await scraper.scrapeMultipleAccounts(itkSources);

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SCRAPING SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let totalTweets = 0;
  let transferTweets = 0;

  results.forEach((tweets, account) => {
    const transfers = tweets.filter(t => t.isTransferRelated);
    totalTweets += tweets.length;
    transferTweets += transfers.length;
    
    console.log(`@${account}:`);
    console.log(`  Total tweets: ${tweets.length}`);
    console.log(`  Transfer news: ${transfers.length}`);
    if (transfers.length > 0) {
      console.log(`  Latest: "${transfers[0].text.substring(0, 80)}..."`);
    }
    console.log('');
  });

  console.log(`\n📈 TOTALS:`);
  console.log(`  Accounts scraped: ${results.size}`);
  console.log(`  Total tweets: ${totalTweets}`);
  console.log(`  Transfer-related: ${transferTweets}`);
  console.log(`  Success rate: ${((transferTweets / totalTweets) * 100).toFixed(1)}%`);

  // Save results
  const outputPath = path.join(process.cwd(), 'scraping-results.json');
  const output = {
    timestamp: new Date().toISOString(),
    accounts: Array.from(results.entries()).map(([account, tweets]) => ({
      account,
      tweets: tweets.map(t => ({
        text: t.text,
        timestamp: t.timestamp,
        isTransferRelated: t.isTransferRelated,
        keywords: t.transferKeywords,
        imageCount: t.images.length
      }))
    }))
  };

  await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n💾 Results saved to: ${outputPath}`);
}

// Run the scraper
main().catch(console.error);