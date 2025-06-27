/**
 * Playwright Twitter Scraper with Authentication
 * Handles Twitter's login requirements
 */

import { chromium, Browser, Page, BrowserContext } from "playwright";
import { SimplifiedTweet } from "./hybrid-client";

export interface AuthenticatedScraperConfig {
  username: string;
  password: string;
  headless?: boolean;
  userAgent?: string;
  viewport?: { width: number; height: number };
  timeout?: number;
}

export class AuthenticatedPlaywrightScraper {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: AuthenticatedScraperConfig;
  private isLoggedIn = false;

  constructor(config: AuthenticatedScraperConfig) {
    this.config = {
      ...config,
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

    console.log("🎭 Initializing authenticated Playwright browser...");

    this.browser = await chromium.launch({
      headless: this.config.headless,
      args: ["--disable-blink-features=AutomationControlled"],
    });

    // Use persistent context to maintain login
    this.context = await this.browser.newContext({
      userAgent: this.config.userAgent,
      viewport: this.config.viewport,
      locale: "en-US",
    });

    // Anti-detection measures
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });
  }

  async login(): Promise<void> {
    if (this.isLoggedIn) return;
    if (!this.context) await this.initialize();

    const page = await this.context!.newPage();

    try {
      console.log("🔐 Logging into Twitter...");

      // Go to login page
      await page.goto("https://twitter.com/login", {
        waitUntil: "networkidle",
        timeout: this.config.timeout,
      });

      // Enter username
      await page.waitForSelector('input[autocomplete="username"]', {
        timeout: 10000,
      });
      await page.fill('input[autocomplete="username"]', this.config.username);
      await page.keyboard.press("Enter");

      // Wait for password field or challenge
      await page.waitForTimeout(2000);

      // Check if we need to enter email/phone (Twitter sometimes asks for this)
      const challengeInput = await page.$(
        'input[data-testid="ocfEnterTextTextInput"]',
      );
      if (challengeInput) {
        console.log("📧 Twitter is asking for email/phone verification...");
        // This would need to be handled based on your setup
        throw new Error(
          "Twitter requires additional verification - manual intervention needed",
        );
      }

      // Enter password
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      await page.fill('input[type="password"]', this.config.password);
      await page.keyboard.press("Enter");

      // Wait for home timeline to load
      await page.waitForSelector('[data-testid="tweet"]', { timeout: 15000 });

      console.log("✅ Successfully logged into Twitter");
      this.isLoggedIn = true;
    } catch (error) {
      console.error("❌ Login failed:", error);
      throw error;
    } finally {
      await page.close();
    }
  }

  async scrapeUserTweets(
    username: string,
    limit = 20,
  ): Promise<SimplifiedTweet[]> {
    if (!this.isLoggedIn) {
      await this.login();
    }

    const page = await this.context!.newPage();
    const tweets: SimplifiedTweet[] = [];

    try {
      console.log(`🔍 Scraping tweets from @${username}...`);

      // Navigate to user profile
      await page.goto(`https://twitter.com/${username}`, {
        waitUntil: "networkidle",
        timeout: this.config.timeout,
      });

      // Wait for tweets
      await page.waitForSelector('[data-testid="tweet"]', { timeout: 10000 });

      // Scroll and collect tweets
      let previousHeight = 0;
      while (tweets.length < limit) {
        const tweetElements = await page.$$('[data-testid="tweet"]');

        for (const element of tweetElements) {
          if (tweets.length >= limit) break;

          try {
            const tweetData = await this.extractAuthenticatedTweetData(
              element,
              username,
            );
            if (tweetData && !tweets.find((t) => t.id === tweetData.id)) {
              tweets.push(tweetData);
            }
          } catch (error) {
            // Skip problematic tweets
          }
        }

        // Scroll for more
        const currentHeight = await page.evaluate(
          () => document.body.scrollHeight,
        );
        if (currentHeight === previousHeight) break;

        previousHeight = currentHeight;
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight),
        );
        await page.waitForTimeout(2000);
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

  private async extractAuthenticatedTweetData(
    element: any,
    username: string,
  ): Promise<SimplifiedTweet | null> {
    try {
      // Get tweet text
      const textElement = await element.$('[data-testid="tweetText"]');
      const text = textElement ? await textElement.innerText() : "";

      // Get tweet link for ID
      const timeElement = await element.$("time");
      const tweetLink = timeElement
        ? await timeElement.$("xpath=ancestor::a")
        : null;
      const href = tweetLink ? await tweetLink.getAttribute("href") : "";
      const idMatch = href.match(/\/status\/(\d+)/);
      const id = idMatch ? idMatch[1] : "";

      if (!id) return null;

      // Get timestamp
      const datetime = timeElement
        ? await timeElement.getAttribute("datetime")
        : "";
      const createdAt = datetime ? new Date(datetime) : new Date();

      // Extract media
      const media: SimplifiedTweet["media"] = [];

      // Images
      const images = await element.$$('img[alt="Image"]');
      for (const img of images) {
        const src = await img.getAttribute("src");
        if (src && !src.includes("profile_images")) {
          media.push({
            type: "photo",
            url: src.replace(/&name=\w+$/, "&name=large"),
          });
        }
      }

      // Videos
      const hasVideo = await element.$("video").then((v: any) => !!v);
      if (hasVideo) {
        media.push({ type: "video", url: "video_present" });
      }

      // Get engagement metrics
      const replyButton = await element.$('[data-testid="reply"]');
      const replyAria = replyButton
        ? await replyButton.getAttribute("aria-label")
        : "";
      const replyMatch = replyAria.match(/(\d+) repl/i);
      const replies = replyMatch ? parseInt(replyMatch[1]) : 0;

      // Check verification
      const verified = await element
        .$('[data-testid="icon-verified"]')
        .then((v: any) => !!v);

      return {
        id,
        text,
        media,
        replies,
        createdAt,
        author: {
          username,
          name: username, // Would need additional lookup
          verified,
        },
      };
    } catch (error) {
      return null;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.isLoggedIn = false;
      console.log("🎭 Authenticated browser closed");
    }
  }
}

// Factory function
export function createAuthenticatedScraper(
  username: string,
  password: string,
  options?: Partial<AuthenticatedScraperConfig>,
): AuthenticatedPlaywrightScraper {
  return new AuthenticatedPlaywrightScraper({
    username,
    password,
    ...options,
  });
}
