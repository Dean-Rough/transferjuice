/**
 * YouTube Search Service
 * Searches for football shithousery videos and shorts
 */

export interface YouTubeVideo {
  id: string;
  title: string;
  channelName: string;
  isShort: boolean;
  embedUrl: string;
  watchUrl: string;
}

// Popular football shithousery search terms
const SHITHOUSERY_SEARCH_TERMS = [
  "football shithousery top moments",
  "football shithousery best compilation",
  "football shithousery ultimate",
  "football shithousery biggest moments",
  "football shithousery funniest",
  "premier league shithousery compilation",
  "football dark arts compilation",
  "football time wasting compilation",
  "football wind up merchants",
  "football mind games compilation",
];

// Curated list of known good shithousery videos
const CURATED_SHITHOUSERY_VIDEOS: YouTubeVideo[] = [
  {
    id: "ALZHF5UqnU4",
    title: "Football's Greatest Shithousery Moments",
    channelName: "Score 90",
    isShort: false,
    embedUrl: "https://www.youtube.com/embed/ALZHF5UqnU4",
    watchUrl: "https://www.youtube.com/watch?v=ALZHF5UqnU4",
  },
  {
    id: "p6gN_zMSYjA",
    title: "Ultimate Football Shithousery Compilation",
    channelName: "Football Daily",
    isShort: false,
    embedUrl: "https://www.youtube.com/embed/p6gN_zMSYjA",
    watchUrl: "https://www.youtube.com/watch?v=p6gN_zMSYjA",
  },
  {
    id: "X_e5gxuX5gI",
    title: "Premier League's Biggest Wind-Up Merchants",
    channelName: "Sky Sports Football",
    isShort: false,
    embedUrl: "https://www.youtube.com/embed/X_e5gxuX5gI",
    watchUrl: "https://www.youtube.com/watch?v=X_e5gxuX5gI",
  },
  {
    id: "5QfPTk9kL3Q",
    title: "Football Dark Arts & Time Wasting Masterclass",
    channelName: "HITC Sport",
    isShort: false,
    embedUrl: "https://www.youtube.com/embed/5QfPTk9kL3Q",
    watchUrl: "https://www.youtube.com/watch?v=5QfPTk9kL3Q",
  },
  {
    id: "BhJpem42hF0",
    title: "Sergio Ramos: The King of Shithousery",
    channelName: "Football Heritage",
    isShort: false,
    embedUrl: "https://www.youtube.com/embed/BhJpem42hF0",
    watchUrl: "https://www.youtube.com/watch?v=BhJpem42hF0",
  },
  // YouTube Shorts
  {
    id: "xYtq0xPHNQU",
    title: "When Shithousery Goes Wrong 😂",
    channelName: "433",
    isShort: true,
    embedUrl: "https://www.youtube.com/embed/xYtq0xPHNQU",
    watchUrl: "https://www.youtube.com/shorts/xYtq0xPHNQU",
  },
  {
    id: "kZw8TvQKQtw",
    title: "Prime Shithousery in Football",
    channelName: "Goal",
    isShort: true,
    embedUrl: "https://www.youtube.com/embed/kZw8TvQKQtw",
    watchUrl: "https://www.youtube.com/shorts/kZw8TvQKQtw",
  },
  {
    id: "9HSj6spE5Ck",
    title: "Diego Costa Master of Dark Arts",
    channelName: "BR Football",
    isShort: true,
    embedUrl: "https://www.youtube.com/embed/9HSj6spE5Ck",
    watchUrl: "https://www.youtube.com/shorts/9HSj6spE5Ck",
  },
];

/**
 * Get a random shithousery video
 */
export function getRandomShithouseryVideo(): YouTubeVideo {
  const allVideos = CURATED_SHITHOUSERY_VIDEOS;
  return allVideos[Math.floor(Math.random() * allVideos.length)];
}

/**
 * Get a random shithousery short
 */
export function getRandomShithouseryShort(): YouTubeVideo {
  const shorts = CURATED_SHITHOUSERY_VIDEOS.filter((v) => v.isShort);
  return shorts[Math.floor(Math.random() * shorts.length)];
}

/**
 * Get a random full-length shithousery video
 */
export function getRandomShithouseryFullVideo(): YouTubeVideo {
  const fullVideos = CURATED_SHITHOUSERY_VIDEOS.filter((v) => !v.isShort);
  return fullVideos[Math.floor(Math.random() * fullVideos.length)];
}

/**
 * Get multiple different videos (no duplicates)
 */
export function getMultipleShithouseryVideos(
  count: number = 3,
): YouTubeVideo[] {
  const shuffled = [...CURATED_SHITHOUSERY_VIDEOS].sort(
    () => 0.5 - Math.random(),
  );
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Search YouTube for shithousery videos (mock implementation)
 * In production, this would use YouTube Data API
 */
export async function searchYouTubeShithousery(
  includeShorts: boolean = false,
): Promise<YouTubeVideo[]> {
  // For now, return curated videos
  // In production, this would make actual API calls
  if (includeShorts) {
    return CURATED_SHITHOUSERY_VIDEOS;
  }
  return CURATED_SHITHOUSERY_VIDEOS.filter((v) => !v.isShort);
}

/**
 * Generate search URL for manual searching
 */
export function getYouTubeSearchUrl(includeShorts: boolean = false): string {
  const baseSearch = "football shithousery";
  const modifiers = [
    "top",
    "best",
    "ultimate",
    "biggest",
    "moments",
    "compilation",
  ];
  const randomModifier =
    modifiers[Math.floor(Math.random() * modifiers.length)];

  const searchQuery = `${baseSearch} ${randomModifier}`;
  const encodedQuery = encodeURIComponent(searchQuery);

  if (includeShorts) {
    // Search specifically for shorts
    return `https://www.youtube.com/results?search_query=${encodedQuery}+%23shorts`;
  }

  return `https://www.youtube.com/results?search_query=${encodedQuery}`;
}

/**
 * Format video for embedding
 */
export function formatVideoForEmbed(video: YouTubeVideo) {
  return {
    ...video,
    embedHtml: `<iframe 
      src="${video.embedUrl}" 
      title="${video.title}"
      frameborder="0" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
      allowfullscreen
      class="w-full aspect-video rounded-lg"
    ></iframe>`,
  };
}
