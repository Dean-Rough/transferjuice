/**
 * Wikimedia API Service
 * Fetches player images from Wikipedia/Wikimedia Commons
 */

import { z } from "zod";

// API Configuration
const WIKIMEDIA_API_CONFIG = {
  // Use the public Wikipedia API endpoint which doesn't require authentication
  endpoint: "https://en.wikipedia.org/api/rest_v1/page/summary",
  searchEndpoint: "https://en.wikipedia.org/w/api.php",
  headers: {
    Accept: "application/json",
    "User-Agent":
      "TransferJuice/1.0 (https://transferjuice.com; contact@transferjuice.com)",
  },
};

// Response schemas
const WikiSearchResultSchema = z.object({
  id: z.number(),
  key: z.string(),
  title: z.string(),
  excerpt: z.string(),
  matched_title: z.string().nullable(),
  description: z.string().nullable(),
  thumbnail: z
    .object({
      url: z.string(),
      width: z.number(),
      height: z.number(),
    })
    .nullable()
    .optional(),
});

const WikiSearchResponseSchema = z.object({
  pages: z.array(WikiSearchResultSchema),
});

// Image detail endpoint response
const WikiImageDetailSchema = z.object({
  file: z.string(),
  size: z.number(),
  width: z.number(),
  height: z.number(),
  duration: z.number().nullable().optional(),
  url: z.string(),
  descriptionurl: z.string(),
  descriptionshorturl: z.string(),
});

export interface PlayerImageResult {
  url: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  source: "wikimedia" | "placeholder";
}

// Cache for player images (5 minutes TTL)
const imageCache = new Map<
  string,
  { result: PlayerImageResult; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Search for a player's Wikipedia page and extract their image
 */
export async function fetchPlayerImage(
  playerName: string,
): Promise<PlayerImageResult> {
  // Check cache first
  const cached = imageCache.get(playerName);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  try {
    // First, search for the player's Wikipedia page using the search API
    const searchParams = new URLSearchParams({
      action: "query",
      format: "json",
      list: "search",
      srsearch: `${playerName} footballer`,
      srlimit: "5",
      origin: "*",
    });

    const searchUrl = `${WIKIMEDIA_API_CONFIG.searchEndpoint}?${searchParams}`;
    const searchResponse = await fetch(searchUrl, {
      headers: WIKIMEDIA_API_CONFIG.headers,
    });

    if (!searchResponse.ok) {
      throw new Error(`Wikipedia search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const searchResults = searchData.query?.search || [];

    if (searchResults.length === 0) {
      return getPlaceholderImage(playerName);
    }

    // Try to get the page summary for the first result
    const pageTitle = searchResults[0].title;
    const summaryUrl = `${WIKIMEDIA_API_CONFIG.endpoint}/${encodeURIComponent(pageTitle)}`;

    const summaryResponse = await fetch(summaryUrl, {
      headers: WIKIMEDIA_API_CONFIG.headers,
    });

    if (!summaryResponse.ok) {
      return getPlaceholderImage(playerName);
    }

    const summaryData = await summaryResponse.json();

    if (!summaryData.thumbnail?.source) {
      return getPlaceholderImage(playerName);
    }

    // Get higher resolution version of the image
    const imageUrl = summaryData.thumbnail.source;
    // Wikipedia thumbnails can be resized by changing the URL pattern
    const highResUrl = imageUrl.replace(/\/\d+px-/, "/800px-");

    const result: PlayerImageResult = {
      url: highResUrl,
      alt: `${playerName} - ${summaryData.title}`,
      caption: `${playerName} (Source: Wikipedia)`,
      width: 800,
      height: Math.round(
        (800 / summaryData.thumbnail.width) * summaryData.thumbnail.height,
      ),
      source: "wikimedia",
    };

    // Cache the result
    imageCache.set(playerName, { result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error(`Failed to fetch Wikipedia image for ${playerName}:`, error);
    return getPlaceholderImage(playerName);
  }
}

/**
 * Get placeholder image for a player
 */
function getPlaceholderImage(playerName: string): PlayerImageResult {
  return {
    url: "/images/player-placeholder.svg",
    alt: `${playerName} - Player Image`,
    caption: playerName,
    width: 400,
    height: 400,
    source: "placeholder",
  };
}

/**
 * Batch fetch multiple player images
 */
export async function fetchPlayerImages(
  playerNames: string[],
): Promise<Map<string, PlayerImageResult>> {
  const results = new Map<string, PlayerImageResult>();

  // Process in parallel but limit concurrency
  const batchSize = 3;
  for (let i = 0; i < playerNames.length; i += batchSize) {
    const batch = playerNames.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((name) => fetchPlayerImage(name)),
    );

    batch.forEach((name, index) => {
      results.set(name, batchResults[index]);
    });
  }

  return results;
}

/**
 * Search for club badges/crests
 */
export async function fetchClubBadge(
  clubName: string,
): Promise<PlayerImageResult> {
  // Check cache first
  const cacheKey = `club_${clubName}`;
  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  try {
    // Search for the club's Wikipedia page
    const searchParams = new URLSearchParams({
      action: "query",
      format: "json",
      list: "search",
      srsearch: `${clubName} FC football club`,
      srlimit: "5",
      origin: "*",
    });

    const searchUrl = `${WIKIMEDIA_API_CONFIG.searchEndpoint}?${searchParams}`;
    const searchResponse = await fetch(searchUrl, {
      headers: WIKIMEDIA_API_CONFIG.headers,
    });

    if (!searchResponse.ok) {
      throw new Error(`Wikipedia search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const searchResults = searchData.query?.search || [];

    if (searchResults.length === 0) {
      return getClubPlaceholder(clubName);
    }

    // Try to get the page summary for the first result
    const pageTitle = searchResults[0].title;
    const summaryUrl = `${WIKIMEDIA_API_CONFIG.endpoint}/${encodeURIComponent(pageTitle)}`;

    const summaryResponse = await fetch(summaryUrl, {
      headers: WIKIMEDIA_API_CONFIG.headers,
    });

    if (!summaryResponse.ok) {
      return getClubPlaceholder(clubName);
    }

    const summaryData = await summaryResponse.json();

    if (!summaryData.thumbnail?.source) {
      return getClubPlaceholder(clubName);
    }

    // Get higher resolution version for badges (400px square)
    const imageUrl = summaryData.thumbnail.source;
    const highResUrl = imageUrl.replace(/\/\d+px-/, "/400px-");

    const result: PlayerImageResult = {
      url: highResUrl,
      alt: `${clubName} Badge`,
      caption: clubName,
      width: 400,
      height: 400,
      source: "wikimedia",
    };

    // Cache the result
    imageCache.set(cacheKey, { result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error(`Failed to fetch club badge for ${clubName}:`, error);
    return getClubPlaceholder(clubName);
  }
}

/**
 * Get placeholder for club badge
 */
function getClubPlaceholder(clubName: string): PlayerImageResult {
  return {
    url: "/images/club-badge-placeholder.svg",
    alt: `${clubName} Badge`,
    caption: clubName,
    width: 400,
    height: 400,
    source: "placeholder",
  };
}
