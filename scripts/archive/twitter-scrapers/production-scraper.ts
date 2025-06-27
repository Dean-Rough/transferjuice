#!/usr/bin/env tsx
/**
 * Production ITK scraper with optional headless mode
 * Usage: npx tsx scripts/production-scraper.ts [--headless]
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

interface ScrapeOptions {
  headless?: boolean;
  debug?: boolean;
}

class ProductionScraper {
  private sessionPath = path.join(process.cwd(), '.twitter-sessions', 'juice_backer');
  private options: ScrapeOptions;

  constructor(options: ScrapeOptions = {}) {
    this.options = options;
  }

  async scrapeAccount(account: string, limit = 5) {
    console.log(`📰 Scraping @${account}...`);
    
    const context = await chromium.launchPersistentContext(this.sessionPath, {
      headless: this.options.headless || false,
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      // Anti-detection only for headless
      ...(this.options.headless && {
        args: [
          '--no-sandbox',
          '--disable-blink-features=AutomationControlled',
        ],
        ignoreDefaultArgs: ['--enable-automation'],
      })
    });

    const page = await context.newPage();
    const result = { account, tweets: [], success: false, error: null };

    try {
      // Navigate directly to profile
      await page.goto(`https://twitter.com/${account}`, {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      });

      // Wait longer for content in headless mode
      const waitTime = this.options.headless ? 8000 : 5000;
      await page.waitForTimeout(waitTime);

      if (this.options.debug) {
        await page.screenshot({ path: `debug-${account}.png` });
        console.log(`   📸 Debug screenshot saved`);
      }

      // Check for browser not supported message
      const unsupported = await page.locator('text=This browser is no longer supported').count();
      if (unsupported > 0) {
        throw new Error('Browser not supported by Twitter');
      }

      // Try multiple selectors
      const selectors = ['article', '[data-testid="tweet"]', '[data-testid="cellInnerDiv"]'];
      let articles = [];
      
      for (const selector of selectors) {
        articles = await page.$$(selector);
        if (articles.length > 0) {
          console.log(`   Found ${articles.length} elements with ${selector}`);
          break;
        }
      }

      if (articles.length === 0) {
        throw new Error('No tweets found with any selector');
      }

      // Extract tweets
      const tweets = [];
      const transferKeywords = ['transfer', 'signing', 'medical', 'fee', 'deal', 'agreed', 'bid', 'here we go'];
      
      for (let i = 0; i < Math.min(limit, articles.length); i++) {
        try {
          const text = await articles[i].innerText();
          const lines = text.split('\n').filter(line => line.trim());
          const tweetText = lines.find(line => line.length > 50) || lines.join(' ');
          
          if (tweetText && tweetText.length > 20) {
            const isTransfer = transferKeywords.some(keyword => 
              tweetText.toLowerCase().includes(keyword)
            );
            
            tweets.push({
              text: tweetText.substring(0, 200),
              isTransfer,
              keywords: transferKeywords.filter(k => tweetText.toLowerCase().includes(k))
            });
          }
        } catch (err) {
          if (this.options.debug) console.log(`   Skip tweet ${i}: ${err.message}`);
        }
      }

      result.tweets = tweets;
      result.success = true;
      
      const transferCount = tweets.filter(t => t.isTransfer).length;
      console.log(`   ✅ ${tweets.length} tweets, ${transferCount} transfers`);

      if (transferCount > 0) {
        const latest = tweets.find(t => t.isTransfer);
        console.log(`   🔥 Latest: "${latest.text.substring(0, 80)}..."`);
      }

    } catch (error) {
      result.error = error.message;
      console.log(`   ❌ Error: ${error.message}`);
    } finally {
      await page.close();
      await context.close();
    }

    return result;
  }

  async scrapeMultiple(accounts: string[]) {
    console.log(`🌍 Production scraper (${this.options.headless ? 'headless' : 'visible'} mode)\n`);
    
    // Check session
    try {
      await fs.access(this.sessionPath);
      console.log('✅ Session found\n');
    } catch {
      throw new Error('No saved session. Run: npx tsx scripts/setup-twitter-session.ts');
    }

    const results = [];
    
    for (const account of accounts) {
      const result = await this.scrapeAccount(account);
      results.push(result);
      
      // Delay between accounts
      if (accounts.indexOf(account) < accounts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    return results;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const headless = args.includes('--headless');
const debug = args.includes('--debug');

async function main() {
  const scraper = new ProductionScraper({ headless, debug });
  
  const testAccounts = [
    'FabrizioRomano',
    'David_Ornstein',
    'SkySportsNews'
  ];

  try {
    const results = await scraper.scrapeMultiple(testAccounts);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 PRODUCTION SCRAPING RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const successful = results.filter(r => r.success);
    const totalTweets = successful.reduce((sum, r) => sum + r.tweets.length, 0);
    const totalTransfers = successful.reduce((sum, r) => sum + r.tweets.filter(t => t.isTransfer).length, 0);
    
    console.log(`\nMode: ${headless ? 'Headless' : 'Visible'}`);
    console.log(`Successful: ${successful.length}/${results.length}`);
    console.log(`Total tweets: ${totalTweets}`);
    console.log(`Transfer news: ${totalTransfers}`);
    
    if (totalTweets > 0) {
      console.log(`Success rate: ${((totalTransfers / totalTweets) * 100).toFixed(1)}%`);
    }
    
    // Show failed
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      console.log('\nFailed accounts:');
      failed.forEach(r => console.log(`  ❌ ${r.account}: ${r.error}`));
    }
    
    console.log(`\n${headless ? '🔕 Silent operation completed!' : '👁️ Visible operation completed!'}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

main().catch(console.error);