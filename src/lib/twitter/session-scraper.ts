/**
 * Session-based Twitter Scraper
 * Uses saved browser session to avoid login issues
 */

import { chromium, Browser, Page, BrowserContext } from "playwright";
import { SimplifiedTweet } from "./hybrid-client";
import fs from "fs/promises";
import path from "path";

export class SessionBasedScraper {
  private context: BrowserContext | null = null;
  private sessionPath: string;
  private metadata: any = null;

  constructor(username?: string) {
    const user =
      username ||
      process.env.TWITTER_AUTH_USERNAME ||
      process.env.TWITTER_SCRAPER_USERNAME ||
      "juice_backer";
    this.sessionPath = path.join(process.cwd(), ".twitter-sessions", user);
  }

  async initialize(): Promise<void> {
    if (this.context) return;

    // Check if session exists
    try {
      await fs.access(this.sessionPath);
      const metadataPath = path.join(this.sessionPath, "session-metadata.json");
      this.metadata = JSON.parse(await fs.readFile(metadataPath, "utf-8"));

      console.log(`📂 Using saved session for @${this.metadata.username}`);
      console.log(
        `   Created: ${new Date(this.metadata.createdAt).toLocaleDateString()}`,
      );
    } catch {
      throw new Error(
        `No saved session found. Run 'npm run setup:twitter-session' first.`,
      );
    }

    // Launch browser with saved session
    const headless = process.env.HEADLESS_SCRAPING === "true";
    this.context = await chromium.launchPersistentContext(this.sessionPath, {
      headless, // Controlled by environment variable
      viewport: { width: 1280, height: 800 },
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      // Anti-detection for headless mode
      ...(headless && {
        args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"],
        ignoreDefaultArgs: ["--enable-automation"],
      }),
    });

    // Update last used time
    this.metadata.lastUsed = new Date().toISOString();
    await fs.writeFile(
      path.join(this.sessionPath, "session-metadata.json"),
      JSON.stringify(this.metadata, null, 2),
    );
  }

  async validateSession(): Promise<boolean> {
    if (!this.context) await this.initialize();

    const page = await this.context!.newPage();
    try {
      await page.goto("https://twitter.com/home", { waitUntil: "networkidle" });
      const isLoggedIn = await page
        .$('[data-testid="tweet"]')
        .then((el) => !!el);
      await page.close();
      return isLoggedIn;
    } catch {
      await page.close();
      return false;
    }
  }

  async scrapeUserTweets(
    username: string,
    limit = 20,
  ): Promise<SimplifiedTweet[]> {
    if (!this.context) await this.initialize();

    const page = await this.context!.newPage();
    const tweets: SimplifiedTweet[] = [];

    try {
      console.log(`🔍 Scraping @${username} using saved session...`);

      // First navigate to home to ensure we're logged in
      await page.goto("https://twitter.com/home", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // Check if logged in
      const loginPrompt = await page.$('[href="/login"]');
      if (loginPrompt) {
        throw new Error("Session expired - need to re-authenticate");
      }

      // Navigate to user profile
      await page.goto(`https://twitter.com/${username}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // Wait for initial content to load
      console.log("Waiting for tweets to load...");
      await page.waitForTimeout(5000); // Give React time to render

      // Try multiple selectors for tweets
      let tweetSelector = "";
      const selectors = [
        "article",
        '[data-testid="tweet"]',
        '[data-testid="cellInnerDiv"]',
      ];

      for (const selector of selectors) {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          tweetSelector = selector;
          console.log(
            `Found ${elements.length} elements with selector: ${selector}`,
          );
          break;
        }
      }

      if (!tweetSelector) {
        throw new Error("Could not find any tweets on page");
      }

      // Scroll and collect tweets
      let previousHeight = 0;
      let scrollAttempts = 0;
      const maxScrolls = Math.ceil(limit / 5);

      while (tweets.length < limit && scrollAttempts < maxScrolls) {
        const tweetElements = await page.$$(tweetSelector);

        for (const element of tweetElements) {
          if (tweets.length >= limit) break;

          try {
            const tweetData = await this.extractTweetData(element, username);
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
        scrollAttempts++;
      }

      console.log(`✅ Got ${tweets.length} tweets from @${username}`);
      return tweets.slice(0, limit);
    } catch (error) {
      console.error(`❌ Error scraping @${username}:`, error);

      // Take screenshot on error
      await page.screenshot({
        path: `error-${username}-${Date.now()}.png`,
        fullPage: true,
      });
      console.log("Screenshot saved for debugging");

      throw error;
    } finally {
      await page.close();
    }
  }

  private async extractTweetData(
    element: any,
    username: string,
  ): Promise<SimplifiedTweet | null> {
    try {
      // Get tweet text - try multiple methods
      let text = "";

      // Method 1: Try specific tweet text selector
      const textElement = await element.$('[data-testid="tweetText"]');
      if (textElement) {
        text = await textElement.innerText();
      }

      // Method 2: If no text yet, try other selectors
      if (!text) {
        const textSelectors = ["[lang]", 'div[dir="auto"]'];
        for (const selector of textSelectors) {
          const el = await element.$(selector);
          if (el) {
            const content = await el.innerText();
            if (content && content.length > 10) {
              text = content;
              break;
            }
          }
        }
      }

      // Method 3: Fallback to all text in article
      if (!text) {
        const allText = await element.innerText();
        const lines = allText.split("\n").filter((line: string) => line.trim());
        // Find the main tweet text (usually one of the longer lines)
        text =
          lines.find((line: string) => line.length > 50) || lines.join(" ");
      }

      // Get tweet ID and timestamp
      let id = "";
      let createdAt = new Date();

      const timeElement = await element.$("time");
      if (timeElement) {
        const datetime = await timeElement.getAttribute("datetime");
        if (datetime) {
          createdAt = new Date(datetime);
          id = `${username}_${createdAt.getTime()}`;
        }

        // Try to get ID from parent link
        const timeParent = await timeElement.$("xpath=..");
        if (timeParent) {
          const href = await timeParent.getAttribute("href");
          const idMatch = href?.match(/\/status\/(\d+)/);
          if (idMatch) {
            id = idMatch[1];
          }
        }
      }

      // Generate ID if we don't have one
      if (!id) {
        id = `${username}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Extract media
      const media: SimplifiedTweet["media"] = [];

      // Images
      const images = await element.$$('img[src*="pbs.twimg.com/media"]');
      for (const img of images) {
        const src = await img.getAttribute("src");
        if (src) {
          media.push({
            type: "photo",
            url: src.replace(/&name=\w+$/, "&name=large"),
          });
        }
      }

      // Also try alt="Image" selector
      if (media.length === 0) {
        const altImages = await element.$$('img[alt="Image"]');
        for (const img of altImages) {
          const src = await img.getAttribute("src");
          if (src && !src.includes("profile_images")) {
            media.push({
              type: "photo",
              url: src.replace(/&name=\w+$/, "&name=large"),
            });
          }
        }
      }

      // Check for video
      const hasVideo = await element.$("video").then((v: any) => !!v);
      if (hasVideo) {
        media.push({ type: "video", url: "video_present" });
      }

      // Get reply count
      const replyButton = await element.$('[data-testid="reply"]');
      const replyAria = replyButton
        ? await replyButton.getAttribute("aria-label")
        : "";
      const replyMatch = replyAria.match(/(\d+)/);
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
          name: username,
          verified,
        },
      };
    } catch (error) {
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

        // Random delay between users
        const delay = 2000 + Math.random() * 3000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        console.error(`Failed to scrape @${username}:`, error);
        results.set(username, []);
      }
    }

    return results;
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
      console.log("🔒 Session scraper closed");
    }
  }
}

// Singleton instance
let scraperInstance: SessionBasedScraper | null = null;

export function getSessionScraper(username?: string): SessionBasedScraper {
  if (!scraperInstance) {
    scraperInstance = new SessionBasedScraper(username);
  }
  return scraperInstance;
}
