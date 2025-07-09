import { z } from "zod";

// Types for external data
export interface PlayerStats {
  goals: number;
  assists: number;
  matches: number;
  minutesPlayed: number;
  bigChancesMissed?: number;
  xG?: number;
  yellowCards: number;
  redCards: number;
  currentClub?: string;
  contractUntil?: string;
}

export interface MarketValue {
  current: number;
  currency: string;
  lastUpdate: Date;
  peak?: number;
  peakDate?: Date;
}

export interface TeamInfo {
  position: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface NewsArticle {
  headline: string;
  url: string;
  publishedDate: Date;
  excerpt?: string;
  source: string;
}

export interface WikipediaData {
  summary: string;
  imageUrl?: string;
  fullName?: string;
  birthDate?: string;
  nationality?: string;
}

// Cache implementation with TTL
class DataCache<T> {
  private cache = new Map<string, { data: T; expires: number }>();

  constructor(private defaultTTL: number = 3600000) {} // 1 hour default

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttl || this.defaultTTL),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Cache instances
const playerStatsCache = new DataCache<PlayerStats>(86400000); // 24 hours
const marketValueCache = new DataCache<MarketValue>(21600000); // 6 hours
const teamInfoCache = new DataCache<TeamInfo>(3600000); // 1 hour
const newsCache = new DataCache<NewsArticle[]>(1800000); // 30 minutes
const wikipediaCache = new DataCache<WikipediaData>(604800000); // 7 days

// Wikipedia integration
export async function getWikipediaData(
  playerName: string,
): Promise<WikipediaData | null> {
  const cacheKey = `wiki:${playerName}`;
  const cached = wikipediaCache.get(cacheKey);
  if (cached) return cached;

  try {
    const wikiName = playerName.replace(" ", "_");
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiName)}`,
    );

    if (!response.ok) return null;

    const data = await response.json();

    const result: WikipediaData = {
      summary: data.extract || "",
      // Prefer original image over thumbnail for quality
      imageUrl: data.originalimage?.source || (data.thumbnail?.source ? data.thumbnail.source.replace(/\/\d+px-/, "/1200px-") : null),
      fullName: data.title,
      // Extract birth date from description if available
      birthDate: data.description?.match(/born (\d{1,2} \w+ \d{4})/)?.[1],
      nationality: data.description?.match(/(\w+) footballer/)?.[1],
    };

    wikipediaCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Failed to fetch Wikipedia data for ${playerName}:`, error);
    return null;
  }
}

// Get Wikipedia image optimized for headers
// High-quality fallback images for different scenarios
const FALLBACK_IMAGES = {
  // Club-specific high-quality images
  clubs: {
    "Manchester United": "https://upload.wikimedia.org/wikipedia/commons/7/7a/Manchester_United_FC_crest.svg",
    "Arsenal": "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
    "Chelsea": "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg",
    "Liverpool": "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
    "Manchester City": "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
    "Tottenham": "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg",
    "Barcelona": "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
    "Real Madrid": "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
    "Bayern Munich": "https://upload.wikimedia.org/wikipedia/commons/1/1f/Logo_FC_Bayern_M%C3%BCnchen_%282002%E2%80%932017%29.svg",
  } as Record<string, string>,
  // Generic high-quality football images
  generic: [
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&q=80", // Stadium
    "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1920&q=80", // Football pitch
    "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=1920&q=80", // Football action
    "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1920&q=80", // Stadium crowd
    "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=1920&q=80", // Football close-up
  ]
};

export async function getWikipediaHeaderImage(
  subject: string,
  preferLandscape: boolean = true,
  clubName?: string
): Promise<string | null> {
  try {
    const wikiData = await getWikipediaData(subject);
    
    if (wikiData?.imageUrl) {
      let imageUrl = wikiData.imageUrl;

      // Always try to get the highest quality version
      if (imageUrl.includes("/thumb/")) {
        // Get the original image URL by removing thumb path
        const originalMatch = imageUrl.match(/(.+?)\/thumb\/(.+?)\/\d+px-.+$/);
        if (originalMatch) {
          // Use the original full-size image
          imageUrl = `${originalMatch[1]}/${originalMatch[2]}`;
        } else {
          // Fallback: request a high-res version (1920px for HD quality)
          imageUrl = imageUrl.replace(/\/\d+px-/, "/1920px-");
        }
      }

      // Validate image quality by checking the URL
      // Skip if it's a low-quality thumbnail
      if (!imageUrl.includes("/50px-") && !imageUrl.includes("/75px-") && !imageUrl.includes("/100px-")) {
        return imageUrl;
      }
    }

    // Fallback logic
    console.warn(`Low quality or no image for ${subject}, using fallback...`);
    
    // Try club badge if we have a club name
    if (clubName && FALLBACK_IMAGES.clubs[clubName]) {
      return FALLBACK_IMAGES.clubs[clubName];
    }
    
    // Use a random high-quality generic football image
    const randomIndex = Math.floor(Math.random() * FALLBACK_IMAGES.generic.length);
    return FALLBACK_IMAGES.generic[randomIndex];
    
  } catch (error) {
    console.error(`Failed to fetch header image for ${subject}:`, error);
    // Return a fallback image even on error
    const randomIndex = Math.floor(Math.random() * FALLBACK_IMAGES.generic.length);
    return FALLBACK_IMAGES.generic[randomIndex];
  }
}

// Football-Data.org integration (free tier)
export async function getTeamStats(teamName: string): Promise<TeamInfo | null> {
  const cacheKey = `team:${teamName}`;
  const cached = teamInfoCache.get(cacheKey);
  if (cached) return cached;

  if (!process.env.FOOTBALL_DATA_TOKEN) {
    console.warn("FOOTBALL_DATA_TOKEN not set");
    return null;
  }

  try {
    // Map common team names to Football-Data IDs
    const teamMappings: Record<string, number> = {
      Arsenal: 57,
      Chelsea: 61,
      Liverpool: 64,
      "Manchester United": 66,
      "Manchester City": 65,
      Tottenham: 73,
      Barcelona: 81,
      "Real Madrid": 86,
      "Bayern Munich": 5,
      PSG: 524,
      Juventus: 109,
      "AC Milan": 98,
      "Inter Milan": 108,
    };

    const teamId = teamMappings[teamName];
    if (!teamId) return null;

    // Get current season standings
    const response = await fetch(
      `https://api.football-data.org/v4/teams/${teamId}`,
      {
        headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_TOKEN },
      },
    );

    if (!response.ok) return null;

    const data = await response.json();

    // Parse the most recent domestic league data
    const leagueData = data.runningCompetitions?.find(
      (comp: any) => comp.type === "LEAGUE",
    );

    if (!leagueData) return null;

    const result: TeamInfo = {
      position: leagueData.position || 0,
      points: leagueData.points || 0,
      wins: leagueData.won || 0,
      draws: leagueData.draw || 0,
      losses: leagueData.lost || 0,
      goalsFor: leagueData.goalsFor || 0,
      goalsAgainst: leagueData.goalsAgainst || 0,
    };

    teamInfoCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Failed to fetch team stats for ${teamName}:`, error);
    return null;
  }
}

// Guardian API integration
export async function getRecentNews(
  query: string,
  limit: number = 5,
): Promise<NewsArticle[]> {
  const cacheKey = `news:${query}`;
  const cached = newsCache.get(cacheKey);
  if (cached) return cached;

  if (!process.env.GUARDIAN_API_KEY) {
    console.warn("GUARDIAN_API_KEY not set");
    return [];
  }

  try {
    const response = await fetch(
      `https://content.guardianapis.com/search?` +
        `q=${encodeURIComponent(query)}&` +
        `section=football&` +
        `page-size=${limit}&` +
        `order-by=newest&` +
        `api-key=${process.env.GUARDIAN_API_KEY}`,
    );

    if (!response.ok) return [];

    const data = await response.json();

    const articles: NewsArticle[] = data.response.results.map((item: any) => ({
      headline: item.webTitle,
      url: item.webUrl,
      publishedDate: new Date(item.webPublicationDate),
      excerpt: item.fields?.trailText,
      source: "The Guardian",
    }));

    newsCache.set(cacheKey, articles);
    return articles;
  } catch (error) {
    console.error(`Failed to fetch news for ${query}:`, error);
    return [];
  }
}

// Mock player stats (would normally come from a stats API)
export async function getPlayerStats(
  playerName: string,
): Promise<PlayerStats | null> {
  const cacheKey = `stats:${playerName}`;
  const cached = playerStatsCache.get(cacheKey);
  if (cached) return cached;

  // In a real implementation, this would call a stats API
  // For now, return mock data based on player name patterns
  const mockStats: PlayerStats = {
    goals: Math.floor(Math.random() * 20) + 5,
    assists: Math.floor(Math.random() * 15) + 2,
    matches: Math.floor(Math.random() * 30) + 15,
    minutesPlayed: Math.floor(Math.random() * 2000) + 1000,
    bigChancesMissed: Math.floor(Math.random() * 15) + 3,
    xG: Math.random() * 20 + 5,
    yellowCards: Math.floor(Math.random() * 8),
    redCards: Math.random() > 0.9 ? 1 : 0,
    currentClub: "Unknown",
    contractUntil: "2025",
  };

  playerStatsCache.set(cacheKey, mockStats);
  return mockStats;
}

// Mock market value (would normally come from TransferMarkt API)
export async function getMarketValue(
  playerName: string,
): Promise<MarketValue | null> {
  const cacheKey = `value:${playerName}`;
  const cached = marketValueCache.get(cacheKey);
  if (cached) return cached;

  // Mock data - in reality would scrape or use API
  const baseValue = Math.floor(Math.random() * 80) + 20; // 20-100m
  const mockValue: MarketValue = {
    current: baseValue * 1000000,
    currency: "EUR",
    lastUpdate: new Date(),
    peak: baseValue * 1.2 * 1000000,
    peakDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
  };

  marketValueCache.set(cacheKey, mockValue);
  return mockValue;
}

// Aggregate all context for a transfer story
export interface TransferContext {
  player: {
    name: string;
    stats: PlayerStats | null;
    marketValue: MarketValue | null;
    wikipedia: WikipediaData | null;
    recentNews: NewsArticle[];
  };
  fromClub: {
    name: string;
    stats: TeamInfo | null;
  } | null;
  toClub: {
    name: string;
    stats: TeamInfo | null;
  } | null;
}

export async function gatherTransferContext(
  playerName: string,
  fromClub?: string,
  toClub?: string,
): Promise<TransferContext> {
  // Fetch all data in parallel
  const [
    playerStats,
    marketValue,
    wikipedia,
    recentNews,
    fromClubStats,
    toClubStats,
  ] = await Promise.all([
    getPlayerStats(playerName),
    getMarketValue(playerName),
    getWikipediaData(playerName),
    getRecentNews(playerName),
    fromClub ? getTeamStats(fromClub) : Promise.resolve(null),
    toClub ? getTeamStats(toClub) : Promise.resolve(null),
  ]);

  return {
    player: {
      name: playerName,
      stats: playerStats,
      marketValue,
      wikipedia,
      recentNews,
    },
    fromClub: fromClub
      ? {
          name: fromClub,
          stats: fromClubStats,
        }
      : null,
    toClub: toClub
      ? {
          name: toClub,
          stats: toClubStats,
        }
      : null,
  };
}

// Helper to find ridiculous comparisons for Golby style
export function findRidiculousComparison(value: number): string {
  const comparisons = [
    { threshold: 100000000, text: "enough to buy a small island nation" },
    { threshold: 80000000, text: "the GDP of Tuvalu" },
    { threshold: 60000000, text: "1,200 London flats" },
    { threshold: 40000000, text: "800,000 Greggs sausage rolls" },
    { threshold: 20000000, text: "a mid-tier Premier League striker" },
    { threshold: 10000000, text: "Burnley's entire squad" },
    { threshold: 5000000, text: "a decent Championship midfielder" },
    { threshold: 1000000, text: "Harry Maguire's weekly wages" },
  ];

  const comparison = comparisons.find((c) => value >= c.threshold);
  return comparison ? comparison.text : "a lot of money";
}

// Helper to find embarrassing moments from news
export function findMostEmbarrassingMoment(news: NewsArticle[]): string | null {
  // Look for keywords that suggest embarrassing moments
  const embarrassingKeywords = [
    "mistake",
    "error",
    "miss",
    "penalty",
    "red card",
    "own goal",
    "injured",
    "substituted",
    "benched",
  ];

  for (const article of news) {
    const lowerHeadline = article.headline.toLowerCase();
    for (const keyword of embarrassingKeywords) {
      if (lowerHeadline.includes(keyword)) {
        return article.headline;
      }
    }
  }

  return null;
}
