/**
 * Playwright Twitter Scraper
 * Reliable scraping with full media support
 */

import { chromium, Browser, Page, BrowserContext } from "playwright";
import { SimplifiedTweet } from "./hybrid-client";

export interface PlaywrightScraperConfig {
  headless?: boolean;
  userAgent?: string;
  viewport?: { width: number; height: number };
  timeout?: number;
}

export class PlaywrightTwitterScraper {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: Required<PlaywrightScraperConfig>;

  constructor(config: PlaywrightScraperConfig = {}) {
    this.config = {
      headless: config.headless ?? true,
      userAgent:
        config.userAgent ??
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: config.viewport ?? { width: 1280, height: 800 },
      timeout: config.timeout ?? 30000,
    };
  }

  async initialize(): Promise<void> {
    if (this.browser) return;

    console.log("🎭 Initializing Playwright browser...");

    this.browser = await chromium.launch({
      headless: this.config.headless,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    });

    this.context = await this.browser.newContext({
      userAgent: this.config.userAgent,
      viewport: this.config.viewport,
      locale: "en-US",
      extraHTTPHeaders: {
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    // Add stealth scripts to avoid detection
    await this.context.addInitScript(() => {
      // Override navigator.webdriver
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });

      // Override plugins to look more realistic
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });

      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) =>
        parameters.name === "notifications"
          ? Promise.resolve({ state: "denied" } as PermissionStatus)
          : originalQuery(parameters);
    });

    console.log("✅ Playwright browser initialized");
  }

  async scrapeUserTweets(
    username: string,
    limit = 20,
  ): Promise<SimplifiedTweet[]> {
    if (!this.context) {
      await this.initialize();
    }

    const page = await this.context!.newPage();
    const tweets: SimplifiedTweet[] = [];

    try {
      console.log(`🔍 Scraping tweets from @${username}...`);

      // Navigate to user profile
      const url = `https://twitter.com/${username}`;
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: this.config.timeout,
      });

      // Wait for content to load - Twitter might require different selectors
      const contentSelectors = [
        '[data-testid="tweet"]',
        'article[data-testid="tweet"]',
        'article[role="article"]',
        'div[data-testid="cellInnerDiv"]',
      ];

      let tweetsSelector = null;
      for (const selector of contentSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          tweetsSelector = selector;
          break;
        } catch {
          // Try next selector
        }
      }

      if (!tweetsSelector) {
        console.log("Could not find tweets with any known selector");
        // Try to continue anyway
        tweetsSelector = "article";
      }

      // Scroll to load more tweets if needed
      let previousHeight = 0;
      let scrollAttempts = 0;
      const maxScrolls = Math.ceil(limit / 5); // Approximate tweets per scroll

      while (tweets.length < limit && scrollAttempts < maxScrolls) {
        // Get current tweets using the selector that worked
        const tweetElements = await page.$$(tweetsSelector);

        for (const element of tweetElements) {
          if (tweets.length >= limit) break;

          try {
            const tweet = await this.extractTweetData(element, page, username);
            if (tweet && !tweets.find((t) => t.id === tweet.id)) {
              tweets.push(tweet);
            }
          } catch (error) {
            console.error("Error extracting tweet:", error);
          }
        }

        // Scroll down
        const currentHeight = await page.evaluate(
          () => document.body.scrollHeight,
        );
        if (currentHeight === previousHeight) break;

        previousHeight = currentHeight;
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight),
        );
        await page.waitForTimeout(2000); // Wait for new tweets to load
        scrollAttempts++;
      }

      console.log(`✅ Scraped ${tweets.length} tweets from @${username}`);
      return tweets.slice(0, limit);
    } catch (error) {
      console.error(`❌ Error scraping @${username}:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  private async extractTweetData(
    element: any,
    page: Page,
    username: string,
  ): Promise<SimplifiedTweet | null> {
    try {
      // Extract tweet text
      const textElement = await element.$('[data-testid="tweetText"]');
      const text = textElement ? await textElement.innerText() : "";

      // Extract tweet ID from link
      const linkElement = await element.$('a[href*="/status/"]');
      const href = linkElement ? await linkElement.getAttribute("href") : "";
      const idMatch = href.match(/\/status\/(\d+)/);
      const id = idMatch ? idMatch[1] : "";

      if (!id) return null;

      // Extract time
      const timeElement = await element.$("time");
      const datetime = timeElement
        ? await timeElement.getAttribute("datetime")
        : "";
      const createdAt = datetime ? new Date(datetime) : new Date();

      // Extract media
      const media: SimplifiedTweet["media"] = [];

      // Images
      const imageElements = await element.$$('[data-testid="tweetPhoto"] img');
      for (const img of imageElements) {
        const src = await img.getAttribute("src");
        if (src && !src.includes("profile_images")) {
          media.push({
            type: "photo",
            url: src.replace(/&name=\w+$/, "&name=large"), // Get large version
          });
        }
      }

      // Videos (check for video player)
      const videoElement = await element.$('[data-testid="videoPlayer"]');
      if (videoElement) {
        // Video URLs are harder to extract, marking as present
        media.push({
          type: "video",
          url: "video_present", // Would need more complex extraction
        });
      }

      // Extract metrics
      const replyElement = await element.$('[data-testid="reply"]');
      const replyText = replyElement ? await replyElement.innerText() : "0";
      const replies = parseInt(replyText.replace(/[^0-9]/g, "") || "0");

      // Extract author info (from the current page context)
      const author = {
        username: username || "",
        name: await page
          .$eval('h2[role="heading"] span', (el) => el.textContent || "")
          .catch(() => username || ""),
        verified: await element
          .$('[data-testid="icon-verified"]')
          .then((e: any) => !!e)
          .catch(() => false),
      };

      return {
        id,
        text,
        media,
        replies,
        createdAt,
        author,
      };
    } catch (error) {
      console.error("Error extracting tweet data:", error);
      return null;
    }
  }

  async scrapeMultipleUsers(
    usernames: string[],
    tweetsPerUser = 10,
  ): Promise<Map<string, SimplifiedTweet[]>> {
    const results = new Map<string, SimplifiedTweet[]>();

    for (const username of usernames) {
      try {
        const tweets = await this.scrapeUserTweets(username, tweetsPerUser);
        results.set(username, tweets);

        // Random delay between users to avoid detection
        const delay = 3000 + Math.random() * 2000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        console.error(`Failed to scrape @${username}:`, error);
        results.set(username, []);
      }
    }

    return results;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      console.log("🎭 Playwright browser closed");
    }
  }

  // Test if Twitter is accessible
  async testConnection(): Promise<boolean> {
    if (!this.context) {
      await this.initialize();
    }

    const page = await this.context!.newPage();

    try {
      await page.goto("https://twitter.com/FabrizioRomano", {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });

      // Twitter might show different things, check for any of these
      const selectors = [
        '[data-testid="tweet"]', // Logged in view
        "article", // Alternative tweet container
        '[data-testid="primaryColumn"]', // Main content column
        "main", // Main content area
      ];

      for (const selector of selectors) {
        const element = await page.$(selector);
        if (element) {
          await page.close();
          return true;
        }
      }

      await page.close();
      return false;
    } catch (error) {
      console.error("Connection test error:", error);
      await page.close();
      return false;
    }
  }
}

// Singleton instance
let scraperInstance: PlaywrightTwitterScraper | null = null;

export function getPlaywrightScraper(
  config?: PlaywrightScraperConfig,
): PlaywrightTwitterScraper {
  if (!scraperInstance) {
    scraperInstance = new PlaywrightTwitterScraper(config);
  }
  return scraperInstance;
}
