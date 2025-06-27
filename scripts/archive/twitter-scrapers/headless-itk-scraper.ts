#!/usr/bin/env tsx
/**
 * Headless ITK scraper - runs silently in background
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

interface ScrapeResult {
  account: string;
  success: boolean;
  tweets: number;
  transfers: number;
  error?: string;
}

class HeadlessITKScraper {
  private sessionPath = path.join(process.cwd(), '.twitter-sessions', 'juice_backer');

  async scrapeAccounts(accounts: string[], limit = 5): Promise<ScrapeResult[]> {
    console.log('🔕 Running headless ITK scraper...\n');
    
    // Check session exists
    try {
      await fs.access(this.sessionPath);
    } catch {
      throw new Error('No saved session found. Run: npx tsx scripts/setup-twitter-session.ts');
    }

    const context = await chromium.launchPersistentContext(this.sessionPath, {
      headless: true, // Completely invisible
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      // Anti-detection measures
      args: [
        '--no-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor'
      ],
      ignoreDefaultArgs: ['--enable-automation'],
    });

    const results: ScrapeResult[] = [];

    try {
      for (const account of accounts) {
        console.log(`📰 ${account}...`);
        
        try {
          const page = await context.newPage();
          
          // Navigate to user profile
          await page.goto(`https://twitter.com/${account}`, { 
            waitUntil: 'domcontentloaded',
            timeout: 15000 
          });

          // Wait for content
          await page.waitForTimeout(3000);

          // Find tweets
          const articles = await page.$$('article');
          
          if (articles.length === 0) {
            results.push({
              account,
              success: false,
              tweets: 0,
              transfers: 0,
              error: 'No tweets found'
            });
            await page.close();
            continue;
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
                  isTransfer
                });
              }
            } catch {
              // Skip problematic tweets
            }
          }

          const transferCount = tweets.filter(t => t.isTransfer).length;
          
          results.push({
            account,
            success: true,
            tweets: tweets.length,
            transfers: transferCount
          });

          console.log(`   ✅ ${tweets.length} tweets, ${transferCount} transfers`);
          
          await page.close();
          
          // Delay between accounts
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          results.push({
            account,
            success: false,
            tweets: 0,
            transfers: 0,
            error: error.message
          });
          console.log(`   ❌ Error: ${error.message}`);
        }
      }
    } finally {
      await context.close();
    }

    return results;
  }
}

// Test with key ITK sources
async function main() {
  const scraper = new HeadlessITKScraper();
  
  const testAccounts = [
    'FabrizioRomano',
    'David_Ornstein', 
    'SkySportsNews',
    'DeadlineDayLive',
    'JPercyTelegraph'
  ];

  try {
    const results = await scraper.scrapeAccounts(testAccounts);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 HEADLESS SCRAPING RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const successful = results.filter(r => r.success);
    const totalTweets = successful.reduce((sum, r) => sum + r.tweets, 0);
    const totalTransfers = successful.reduce((sum, r) => sum + r.transfers, 0);
    
    console.log(`\nSuccessful accounts: ${successful.length}/${results.length}`);
    console.log(`Total tweets: ${totalTweets}`);
    console.log(`Transfer news: ${totalTransfers}`);
    console.log(`Success rate: ${((totalTransfers / totalTweets) * 100).toFixed(1)}%`);
    
    // Show failed accounts
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      console.log('\nFailed accounts:');
      failed.forEach(r => console.log(`  ❌ ${r.account}: ${r.error}`));
    }
    
    console.log('\n✅ Scraping completed silently - no browser windows shown!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

main().catch(console.error);