/**
 * TikTok Integration Service
 * Searches for football TikTok content and handles embeds
 */

export interface TikTokVideo {
  id: string;
  url: string;
  embedUrl: string;
  description: string;
  author: {
    username: string;
    nickname: string;
  };
  stats: {
    views: number;
    likes: number;
    shares: number;
  };
  isFootballRelated: boolean;
}

// Curated list of football TikTok accounts and content
const FOOTBALL_TIKTOK_ACCOUNTS = [
  "@433",
  "@espnfc", 
  "@skysports",
  "@premierleague",
  "@championsleague",
  "@fifaworldcup",
  "@laliga",
  "@seriea",
  "@bundesliga_official",
  "@ligue1uber",
  "@footballdaily",
  "@goat.football",
  "@football.vine",
  "@transfermarkt",
];

// Popular football TikTok hashtags
const FOOTBALL_HASHTAGS = [
  "#football",
  "#soccer", 
  "#premierleague",
  "#championsleague",
  "#transfers",
  "#skills",
  "#goals",
  "#footballtiktok",
  "#shithousery",
  "#footballmemes",
  "#transfernews",
  "#footballfans",
];

// Curated football TikTok videos (when API is unavailable)
const CURATED_FOOTBALL_TIKTOKS: TikTokVideo[] = [
  {
    id: "7234567890123456789",
    url: "https://www.tiktok.com/@433/video/7234567890123456789",
    embedUrl: "https://www.tiktok.com/embed/v2/7234567890123456789",
    description: "When the transfer window gets mental 😭 #football #transfers #shithousery",
    author: {
      username: "433",
      nickname: "433 Football",
    },
    stats: {
      views: 2500000,
      likes: 450000,
      shares: 12000,
    },
    isFootballRelated: true,
  },
  {
    id: "7234567890123456790", 
    url: "https://www.tiktok.com/@skysports/video/7234567890123456790",
    embedUrl: "https://www.tiktok.com/embed/v2/7234567890123456790",
    description: "Transfer deadline day chaos be like... 📺 #transferdeadlineday #skysports #football",
    author: {
      username: "skysports",
      nickname: "Sky Sports",
    },
    stats: {
      views: 1800000,
      likes: 320000,
      shares: 8500,
    },
    isFootballRelated: true,
  },
  {
    id: "7234567890123456791",
    url: "https://www.tiktok.com/@premierleague/video/7234567890123456791", 
    embedUrl: "https://www.tiktok.com/embed/v2/7234567890123456791",
    description: "The art of time wasting masterclass 🕐 #premierleague #football #shithousery",
    author: {
      username: "premierleague",
      nickname: "Premier League",
    },
    stats: {
      views: 3200000,
      likes: 680000,
      shares: 15000,
    },
    isFootballRelated: true,
  },
];

/**
 * Get a random football TikTok
 */
export function getRandomFootballTikTok(): TikTokVideo {
  return CURATED_FOOTBALL_TIKTOKS[Math.floor(Math.random() * CURATED_FOOTBALL_TIKTOKS.length)];
}

/**
 * Search for football TikToks (mock implementation)
 * In production, this would use TikTok API or web scraping
 */
export async function searchFootballTikToks(
  query: string = "football transfer",
  limit: number = 10
): Promise<TikTokVideo[]> {
  try {
    // For now, return curated content
    // In production, this would make actual API calls to TikTok
    
    // Filter curated videos by query if specific
    if (query && query !== "football transfer") {
      const filtered = CURATED_FOOTBALL_TIKTOKS.filter(video => 
        video.description.toLowerCase().includes(query.toLowerCase()) ||
        video.author.nickname.toLowerCase().includes(query.toLowerCase())
      );
      return filtered.slice(0, limit);
    }
    
    return CURATED_FOOTBALL_TIKTOKS.slice(0, limit);
  } catch (error) {
    console.error("Error searching TikTok videos:", error);
    return [];
  }
}

/**
 * Generate TikTok embed HTML
 */
export function generateTikTokEmbed(video: TikTokVideo): string {
  return `
    <blockquote 
      class="tiktok-embed" 
      cite="${video.url}" 
      data-video-id="${video.id}" 
      style="max-width: 605px; min-width: 325px;"
    >
      <section>
        <a 
          target="_blank" 
          title="@${video.author.username}" 
          href="https://www.tiktok.com/@${video.author.username}?refer=embed"
        >
          @${video.author.username}
        </a>
        <p>${video.description}</p>
        <a 
          target="_blank" 
          title="♬ original sound - ${video.author.nickname}" 
          href="${video.url}?refer=embed"
        >
          ♬ original sound - ${video.author.nickname}
        </a>
      </section>
    </blockquote>
    <script async src="https://www.tiktok.com/embed.js"></script>
  `;
}

/**
 * Get TikTok video ID from URL
 */
export function extractTikTokVideoId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    /tiktok\.com\/v\/(\d+)/,
    /vm\.tiktok\.com\/(\w+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Validate TikTok URL
 */
export function isValidTikTokUrl(url: string): boolean {
  const tikTokDomains = [
    'tiktok.com',
    'www.tiktok.com', 
    'vm.tiktok.com',
    'vt.tiktok.com'
  ];
  
  try {
    const urlObj = new URL(url);
    return tikTokDomains.includes(urlObj.hostname);
  } catch {
    return false;
  }
}

/**
 * Format TikTok stats for display
 */
export function formatTikTokStats(stats: TikTokVideo['stats']): string {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };
  
  return `${formatNumber(stats.views)} views • ${formatNumber(stats.likes)} likes`;
}

/**
 * Get trending football hashtags for TikTok
 */
export function getTrendingFootballHashtags(): string[] {
  // Rotate hashtags to simulate trending
  const shuffled = [...FOOTBALL_HASHTAGS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 5);
}

/**
 * Generate search URL for TikTok web
 */
export function getTikTokSearchUrl(query: string): string {
  const encodedQuery = encodeURIComponent(query);
  return `https://www.tiktok.com/search?q=${encodedQuery}`;
}

/**
 * Check if TikTok content is appropriate for briefings
 */
export function isAppropriateForBriefing(video: TikTokVideo): boolean {
  const inappropriateKeywords = [
    'controversy', 'scandal', 'fight', 'ban', 'suspended',
    'racist', 'violence', 'inappropriate', 'offensive'
  ];
  
  const description = video.description.toLowerCase();
  return !inappropriateKeywords.some(keyword => description.includes(keyword));
}

/**
 * Get TikTok fallback (YouTube alternative)
 */
export function getTikTokFallbackYouTube(): string {
  // Return a reliable YouTube embed as fallback
  return "https://www.youtube.com/embed/ALZHF5UqnU4"; // Football shithousery compilation
}