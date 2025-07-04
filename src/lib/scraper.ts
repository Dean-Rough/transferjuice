import { chromium, Browser, Page } from "playwright";
import { ITK_SOURCES } from "./sources";

export interface ScrapedTweet {
  id: string;
  content: string;
  url: string;
  sourceName: string;
  sourceHandle: string;
  timestamp: Date;
}

export class TwitterScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: process.env.PLAYWRIGHT_HEADLESS !== "false",
    });
    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    });
    this.page = await context.newPage();
  }

  async scrapeAccount(handle: string, name: string): Promise<ScrapedTweet[]> {
    if (!this.page) throw new Error("Scraper not initialized");

    const tweets: ScrapedTweet[] = [];
    const cleanHandle = handle.replace("@", "");

    try {
      console.log(`Attempting to scrape ${handle}...`);

      // For now, return empty array as Twitter scraping is complex
      // In production, you'd implement proper authentication here
      console.log(
        `Twitter scraping requires authentication - skipping ${handle}`,
      );

      return tweets;
    } catch (error) {
      console.error(`Error scraping ${handle}:`, error);
      return tweets;
    }
  }

  async scrapeAllSources(): Promise<ScrapedTweet[]> {
    if (!this.browser) await this.initialize();

    const allTweets: ScrapedTweet[] = [];

    for (const source of ITK_SOURCES) {
      console.log(`Scraping ${source.name}...`);
      const tweets = await this.scrapeAccount(source.handle, source.name);
      allTweets.push(...tweets);

      // Small delay between accounts
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return allTweets;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
