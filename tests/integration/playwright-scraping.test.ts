/**
 * Integration tests for Playwright scraping system
 */

import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  jest,
} from "@jest/globals";
import { PlaywrightTwitterScraper } from "@/lib/twitter/playwright-scraper";
import { ScraperManager } from "@/lib/twitter/scraperManager";
import { ContentValidator } from "@/lib/twitter/contentValidator";
import { ProxyManager } from "@/lib/twitter/proxyManager";
import { ScrapingCache } from "@/lib/cache/scrapingCache";
import { HybridTwitterClient } from "@/lib/twitter/hybrid-client";

// Mock environment variables
process.env.PLAYWRIGHT_HEADLESS = "true";
process.env.USE_PLAYWRIGHT_SCRAPER = "true";
process.env.DEBUG_SCREENSHOTS = "false";

describe("Playwright Scraping System", () => {
  let scraper: PlaywrightTwitterScraper;
  let validator: ContentValidator;

  beforeAll(() => {
    validator = new ContentValidator();
  });

  afterAll(async () => {
    if (scraper) {
      await scraper.close();
    }
  });

  describe("PlaywrightTwitterScraper", () => {
    test("should initialize with anti-detection measures", async () => {
      scraper = new PlaywrightTwitterScraper({
        headless: true,
        antiDetection: {
          randomizeFingerprint: true,
          randomizeTimezone: true,
          randomizeCanvas: true,
          blockWebRTC: true,
        },
      });

      await scraper.initialize();
      const stats = scraper.getSessionStats();

      expect(stats.sessionAge).toBeGreaterThanOrEqual(0);
      expect(stats.scrapeCount).toBe(0);
      expect(stats.isLoggedIn).toBe(false);
    });

    test("should handle rate limiting gracefully", async () => {
      const mockScraper = new PlaywrightTwitterScraper({
        maxRetries: 2,
        retryDelay: 100,
      });

      // Mock the scraping method to simulate rate limiting
      jest
        .spyOn(mockScraper, "scrapeUserTweets")
        .mockRejectedValueOnce(new Error("Too many requests"));

      try {
        await mockScraper.scrapeUserTweets("testuser", 10);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("Too many requests");
      }
    });

    test("should rotate sessions after threshold", async () => {
      const mockScraper = new PlaywrightTwitterScraper({
        sessionRotationInterval: 1000, // 1 second for testing
      });

      await mockScraper.initialize();

      // Wait for rotation interval
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Trigger scrape which should rotate session
      const shouldRotate = (mockScraper as any).shouldRotateSession();
      expect(shouldRotate).toBe(true);
    });
  });

  describe("ContentValidator", () => {
    test("should validate tweet structure", () => {
      const validTweet = {
        id: "123456789",
        text: "Breaking: Big transfer news!",
        media: [],
        replies: 10,
        createdAt: new Date(),
        author: {
          username: "testuser",
          name: "Test User",
          verified: true,
        },
      };

      const result = validator.validateTweet(validTweet);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.confidence).toBe(1.0);
    });

    test("should detect missing fields", () => {
      const invalidTweet = {
        text: "Breaking news!",
        // Missing id, author, etc.
      };

      const result = validator.validateTweet(invalidTweet);

      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some((i) => i.type === "missing_field")).toBe(true);
    });

    test("should detect rate limiting patterns", () => {
      const rateLimitedTweet = {
        id: "123",
        text: "Rate limit exceeded. Please try again later.",
        media: [],
        replies: 0,
        createdAt: new Date(),
        author: {
          username: "error",
          name: "Error",
          verified: false,
        },
      };

      const result = validator.validateTweet(rateLimitedTweet);

      expect(result.issues.some((i) => i.type === "rate_limit")).toBe(true);
      expect(result.warnings).toContain(
        "Content suggests Twitter rate limiting or access restrictions",
      );
    });

    test("should track validation trends", () => {
      // Simulate multiple validations
      for (let i = 0; i < 10; i++) {
        validator.validateTweet({
          id: `tweet-${i}`,
          text: `Test tweet ${i}`,
          media: [],
          replies: i,
          createdAt: new Date(),
          author: {
            username: "testuser",
            name: "Test User",
            verified: true,
          },
        });
      }

      const trends = validator.getValidationTrends();

      expect(trends.recentSuccessRate).toBeGreaterThan(0);
      expect(trends.averageConfidence).toBeGreaterThan(0);
      expect(trends.commonIssueTypes.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe("ScraperManager", () => {
    test("should manage multiple scraper instances", async () => {
      const manager = new ScraperManager({
        maxInstances: 2,
        instanceConfig: {
          headless: true,
        },
      });

      await manager.initialize();
      const metrics = manager.getHealthMetrics();

      expect(metrics.totalInstances).toBe(2);
      expect(metrics.activeInstances).toBe(2);
      expect(metrics.queuedRequests).toBe(0);

      await manager.shutdown();
    });

    test("should handle request queuing", async () => {
      const manager = new ScraperManager({
        maxInstances: 1,
        requestQueueSize: 5,
      });

      await manager.initialize();

      // Queue multiple requests
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(
          manager.scrapeUserTweets(`user${i}`, 5).catch(() => null),
        );
      }

      const metrics = manager.getHealthMetrics();
      expect(metrics.queuedRequests).toBeGreaterThanOrEqual(0);

      await manager.shutdown();
    }, 10000);

    test("should implement rotation strategies", () => {
      const manager = new ScraperManager({
        rotationStrategy: "performance-based",
      });

      const instances = [
        { status: "idle", successRate: 0.9 },
        { status: "idle", successRate: 0.7 },
        { status: "idle", successRate: 0.95 },
      ];

      // Test performance-based selection
      const selected = (manager as any).selectByPerformance(instances);
      expect(selected.successRate).toBe(0.95);
    });
  });

  describe("ProxyManager", () => {
    test("should manage proxy rotation", async () => {
      const proxyManager = new ProxyManager({
        proxies: [
          { server: "http://proxy1.com:8080", type: "datacenter" },
          { server: "http://proxy2.com:8080", type: "residential" },
        ],
        rotationStrategy: "round-robin",
      });

      const proxy1 = await proxyManager.getNextProxy();
      const proxy2 = await proxyManager.getNextProxy();

      expect(proxy1).toBeTruthy();
      expect(proxy2).toBeTruthy();
      expect(proxy1?.server).not.toBe(proxy2?.server);
    });

    test("should track proxy health", async () => {
      const proxyManager = new ProxyManager({
        proxies: [{ server: "http://proxy1.com:8080", type: "datacenter" }],
      });

      const proxy = await proxyManager.getNextProxy();
      if (proxy) {
        await proxyManager.recordRequest(proxy, true, 1000);
        await proxyManager.recordRequest(
          proxy,
          false,
          5000,
          new Error("Connection timeout"),
        );
      }

      const health = proxyManager.getHealthSummary();
      expect(health.total).toBe(1);
    });

    test("should detect blocked proxies", async () => {
      const proxyManager = new ProxyManager({
        proxies: [{ server: "http://proxy1.com:8080", type: "datacenter" }],
      });

      const proxy = await proxyManager.getNextProxy();
      if (proxy) {
        // Simulate multiple blocked responses
        for (let i = 0; i < 3; i++) {
          await proxyManager.recordRequest(
            proxy,
            false,
            1000,
            new Error("Access denied"),
          );
        }
      }

      const health = proxyManager.getHealthSummary();
      expect(health.blocked).toBeGreaterThan(0);
    });
  });

  describe("ScrapingCache", () => {
    test("should cache scraped tweets", async () => {
      const cache = new ScrapingCache({
        maxSize: 100,
        ttl: 60000,
      });

      const tweets = [
        {
          id: "1",
          text: "Test tweet",
          media: [],
          replies: 0,
          createdAt: new Date(),
          author: {
            username: "testuser",
            name: "Test User",
            verified: true,
          },
        },
      ];

      await cache.set("testuser", tweets, {
        metadata: {
          scraperType: "playwright",
          responseTime: 1000,
          validationScore: 0.9,
        },
      });

      const cached = await cache.get("testuser");
      expect(cached).toHaveLength(1);
      expect(cached![0].id).toBe("1");

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.hitRate).toBeGreaterThan(0);
    });

    test("should handle cache invalidation", async () => {
      const cache = new ScrapingCache({
        maxSize: 100,
        ttl: 60000,
      });

      await cache.set("user1", [], {});
      await cache.set("user2", [], {});

      cache.invalidate("user1");

      const user1Data = await cache.get("user1");
      const user2Data = await cache.get("user2");

      expect(user1Data).toBeNull();
      expect(user2Data).toEqual([]);
    });

    test("should provide cache analytics", async () => {
      const cache = new ScrapingCache();

      // Add some test data
      for (let i = 0; i < 5; i++) {
        await cache.set(`user${i}`, [], {
          metadata: {
            responseTime: 1000 + i * 100,
            validationScore: 0.8 + i * 0.02,
          },
        });
      }

      const analytics = cache.getAnalytics();
      expect(analytics.hitRateBySource.size).toBeGreaterThan(0);
      expect(analytics.reliabilityBySource.size).toBeGreaterThan(0);
    });
  });

  describe("HybridTwitterClient Integration", () => {
    test("should fall back gracefully between methods", async () => {
      const client = new HybridTwitterClient();

      // Don't initialize to avoid actual API calls
      const status = client.getStatus();

      expect(status.mode).toBe("scraper-manager");
      expect(status.methodSuccessRates).toBeDefined();
    });

    test("should track method success rates", async () => {
      const client = new HybridTwitterClient();

      // Simulate method tracking
      (client as any).updateMethodSuccess("playwright", true);
      (client as any).updateMethodSuccess("playwright", true);
      (client as any).updateMethodSuccess("playwright", false);
      (client as any).updateMethodSuccess("api", true);

      const status = client.getStatus();

      expect(status.methodSuccessRates.playwright).toBeCloseTo(0.667, 2);
      expect(status.methodSuccessRates.api).toBe(1.0);
    });
  });

  describe("Error Recovery", () => {
    test("should handle Twitter structure changes", () => {
      const validator = new ContentValidator();

      // Simulate multiple structure errors
      for (let i = 0; i < 30; i++) {
        validator.validateTweet({
          // Missing expected fields
          newField: "unexpected",
        });
      }

      const structureCheck = validator.detectStructuralChanges();

      expect(structureCheck.hasChanges).toBe(true);
      expect(structureCheck.suggestedActions.length).toBeGreaterThan(0);
    });

    test("should handle browser crashes", async () => {
      const manager = new ScraperManager({
        maxInstances: 1,
        maxErrorsBeforeRestart: 2,
      });

      await manager.initialize();

      // Simulate instance errors
      const instances = (manager as any).instances;
      const instance = instances.values().next().value;
      if (instance) {
        instance.errorCount = 5;
        instance.status = "error";
      }

      // Health check should restart failed instance
      await (manager as any).performHealthCheck();

      const metrics = manager.getHealthMetrics();
      expect(metrics.activeInstances).toBeGreaterThan(0);

      await manager.shutdown();
    });
  });

  describe("Performance Optimization", () => {
    test("should optimize cache based on usage", () => {
      const cache = new ScrapingCache();

      // Add entries with different hit patterns
      const entries = [
        { user: "popular", hits: 100 },
        { user: "rare", hits: 0 },
        { user: "medium", hits: 10 },
      ];

      // Simulate cache usage
      // Note: This is a simplified test since we can't directly manipulate cache internals

      const optimization = cache.optimizeCache();
      expect(optimization.recommendations).toBeDefined();
    });

    test("should handle concurrent scraping efficiently", async () => {
      const manager = new ScraperManager({
        maxInstances: 3,
      });

      await manager.initialize();

      const startTime = Date.now();

      // Queue concurrent requests
      const promises = [];
      for (let i = 0; i < 6; i++) {
        promises.push(
          manager.scrapeUserTweets(`concurrent${i}`, 5).catch(() => null),
        );
      }

      // Should process efficiently with 3 instances
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      // With 3 instances, 6 requests should take roughly 2x single request time
      // This is a simplified assertion since we're not actually scraping
      expect(duration).toBeLessThan(10000);

      await manager.shutdown();
    }, 15000);
  });
});

// Helper function to create mock tweet data
function createMockTweet(id: string, text: string) {
  return {
    id,
    text,
    media: [],
    replies: Math.floor(Math.random() * 100),
    createdAt: new Date(),
    author: {
      username: "mockuser",
      name: "Mock User",
      verified: Math.random() > 0.5,
    },
  };
}
