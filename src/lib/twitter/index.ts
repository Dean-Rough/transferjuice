/**
 * Twitter Global Monitoring System
 * Comprehensive ITK source monitoring with multi-language detection
 */

// Core types and interfaces
export type { ITKSource } from "./globalSources";

export type { TweetData, ClassificationResult } from "./transferClassifier";

export type {
  MonitoringConfig,
  MonitoringResult,
  GlobalMonitoringStats,
} from "./globalMonitor";

// Source management
export {
  TIER_1_SOURCES,
  TIER_2_SOURCES,
  TIER_3_SOURCES,
  ALL_ITK_SOURCES,
  TRANSFER_KEYWORDS,
  getSourcesByRegion,
  getSourcesByTier,
  getSourcesByLanguage,
  getTransferKeywords,
  getActiveSources,
  getSourceByHandle,
  updateSourceRateLimit,
  isSourceRateLimited,
  getAvailableSources,
  getMonitoringPriority,
} from "./globalSources";

// Classification and detection
export {
  detectLanguage,
  extractTransferKeywords,
  determineTransferType,
  calculateConfidence,
  classifyTransferContent,
  classifyBatchTransferContent,
  filterByConfidence,
  getClassificationStats,
} from "./transferClassifier";

// Global monitoring
export {
  GlobalITKMonitor,
  globalMonitor,
  DEFAULT_CONFIG,
} from "./globalMonitor";

// Feed integration
export {
  convertTweetToFeedItem,
  convertTweetsToFeedItems,
  integrateClassifiedTweets,
  filterDuplicateTweets,
  mergeSimilarTweets,
} from "./feedIntegration";

// Import types needed for convenience functions
import {
  type MonitoringConfig,
  type GlobalMonitoringStats,
} from "./globalMonitor";
import { globalMonitor } from "./globalMonitor";
import {
  type ITKSource,
  getSourcesByRegion,
  ALL_ITK_SOURCES,
  getActiveSources,
} from "./globalSources";
import { type TweetData, classifyTransferContent } from "./transferClassifier";

// Convenience functions for common use cases

/**
 * Quick start function for global monitoring
 */
export const startGlobalMonitoring = (config?: Partial<MonitoringConfig>) => {
  if (config) {
    globalMonitor.updateConfig(config);
  }
  globalMonitor.start();
  return globalMonitor;
};

/**
 * Stop global monitoring
 */
export const stopGlobalMonitoring = () => {
  globalMonitor.stop();
};

/**
 * Get current monitoring status
 */
export const getMonitoringStatus = () => {
  return globalMonitor.getStatus();
};

/**
 * Run a one-time monitoring cycle (for testing/manual runs)
 */
export const runSingleMonitoringCycle = () => {
  return globalMonitor.runMonitoringCycle();
};

/**
 * Get all available sources for a specific region
 */
export const getRegionalSources = (region: ITKSource["region"]) => {
  return getSourcesByRegion(region).filter((source) => source.isActive);
};

/**
 * Get high-reliability sources (Tier 1 + Tier 2 with >85% reliability)
 */
export const getHighReliabilitySources = () => {
  return ALL_ITK_SOURCES.filter(
    (source) =>
      source.isActive &&
      (source.tier === 1 || (source.tier === 2 && source.reliability >= 0.85)),
  );
};

/**
 * Quick classification of single tweet
 */
export const quickClassifyTweet = (tweetText: string, authorHandle: string) => {
  const mockTweet: TweetData = {
    id: "temp-id",
    text: tweetText,
    author: {
      username: authorHandle.replace("@", ""),
      displayName: authorHandle,
    },
    createdAt: new Date().toISOString(),
  };

  return classifyTransferContent(mockTweet);
};

/**
 * Development utilities
 */
export const developmentUtils = {
  /**
   * Generate mock monitoring data for testing
   */
  generateMockMonitoringStats: (): GlobalMonitoringStats => ({
    totalSources: ALL_ITK_SOURCES.length,
    activeSources: getActiveSources().length,
    rateLimitedSources: 2,
    totalTweetsChecked: 287,
    totalTransferTweets: 42,
    averageConfidence: 73,
    processingTimeMs: 2400,
    errors: [],
    regionStats: {
      UK: { sources: 3, tweets: 85, transfers: 12 },
      ES: { sources: 2, tweets: 67, transfers: 8 },
      IT: { sources: 3, tweets: 71, transfers: 11 },
      FR: { sources: 2, tweets: 34, transfers: 5 },
      DE: { sources: 1, tweets: 18, transfers: 3 },
      BR: { sources: 1, tweets: 12, transfers: 3 },
      GLOBAL: { sources: 1, tweets: 0, transfers: 0 },
    },
    languageStats: {
      en: 5,
      es: 2,
      it: 3,
      fr: 2,
      de: 1,
      pt: 1,
    },
  }),

  /**
   * Test classification with sample tweets
   */
  testClassification: () => {
    const sampleTweets = [
      {
        text: "🚨 BREAKING: Arsenal agree €50M fee for Declan Rice! Medical scheduled for tomorrow. Here we go! ✅",
        handle: "@FabrizioRomano",
      },
      {
        text: "Personal terms agreed between Mbappe and Real Madrid. Club-to-club negotiations ongoing.",
        handle: "@David_Ornstein",
      },
      {
        text: "Beautiful weather today in London! Perfect for a walk in the park.",
        handle: "@randomuser",
      },
    ];

    return sampleTweets.map((tweet) => ({
      tweet: tweet.text,
      handle: tweet.handle,
      result: quickClassifyTweet(tweet.text, tweet.handle),
    }));
  },

  /**
   * List all configured sources
   */
  listAllSources: () => {
    return ALL_ITK_SOURCES.map((source) => ({
      name: source.name,
      handle: source.handle,
      tier: source.tier,
      reliability: `${Math.round(source.reliability * 100)}%`,
      region: source.region,
      language: source.language,
      isActive: source.isActive,
    }));
  },
};
