/**
 * Enhanced Image Service
 * Fetches images from multiple sources with fallbacks
 */

import { logger } from "@/lib/logger";

export interface ImageResult {
  url: string;
  source: "wikipedia" | "unsplash" | "club-api" | "generated" | "placeholder";
  attribution?: string;
  license?: string;
  width?: number;
  height?: number;
  alt: string;
  type: "player" | "club-badge" | "stadium" | "action" | "celebration";
}

export interface ImageSearchOptions {
  preferredSources?: ImageResult["source"][];
  minWidth?: number;
  minHeight?: number;
  type?: ImageResult["type"];
  fallbackToPlaceholder?: boolean;
}

/**
 * Enhanced Wikipedia image fetcher
 */
async function fetchWikipediaImage(
  searchTerm: string,
  type: ImageResult["type"],
): Promise<ImageResult | null> {
  try {
    // This would use Wikipedia API in production
    const mockWikipediaImages: Record<string, ImageResult> = {
      "Erling Haaland": {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Erling_Haaland_2023.jpg/800px-Erling_Haaland_2023.jpg",
        source: "wikipedia",
        attribution: "Via Wikipedia Commons",
        license: "CC BY-SA 4.0",
        width: 800,
        height: 1067,
        alt: "Erling Haaland in Manchester City kit",
        type: "player",
      },
      "Manchester United": {
        url: "https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/800px-Manchester_United_FC_crest.svg.png",
        source: "wikipedia",
        attribution: "Manchester United FC",
        license: "Fair use",
        width: 800,
        height: 800,
        alt: "Manchester United club badge",
        type: "club-badge",
      },
      "Old Trafford": {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Manchester_United_Panorama_%288051523746%29.jpg/1280px-Manchester_United_Panorama_%288051523746%29.jpg",
        source: "wikipedia",
        attribution: "Via Wikipedia Commons",
        license: "CC BY 2.0",
        width: 1280,
        height: 478,
        alt: "Old Trafford stadium panorama",
        type: "stadium",
      },
    };

    return mockWikipediaImages[searchTerm] || null;
  } catch (error) {
    logger.error(`Wikipedia image fetch failed for ${searchTerm}`, error);
    return null;
  }
}

/**
 * Unsplash sports image fetcher
 */
async function fetchUnsplashImage(
  searchTerm: string,
  type: ImageResult["type"],
): Promise<ImageResult | null> {
  try {
    // This would use Unsplash API in production
    // For now, return mock action/celebration images
    const query =
      type === "action"
        ? "football action"
        : type === "celebration"
          ? "football celebration"
          : searchTerm;

    return {
      url: `https://source.unsplash.com/1200x800/?${encodeURIComponent(query)}`,
      source: "unsplash",
      attribution: "Photo via Unsplash",
      license: "Unsplash License",
      width: 1200,
      height: 800,
      alt: `${searchTerm} - football action shot`,
      type: type,
    };
  } catch (error) {
    logger.error(`Unsplash image fetch failed for ${searchTerm}`, error);
    return null;
  }
}

/**
 * Club official API image fetcher
 */
async function fetchClubApiImage(
  clubName: string,
  playerName?: string,
): Promise<ImageResult | null> {
  try {
    // This would connect to official club APIs in production
    // Mock data for demonstration
    const mockClubImages: Record<string, ImageResult> = {
      Arsenal: {
        url: "https://www.arsenal.com/sites/default/files/styles/large_16x9/public/images/arsenal-logo.jpg",
        source: "club-api",
        attribution: "© Arsenal FC",
        width: 1200,
        height: 675,
        alt: "Arsenal FC official",
        type: "club-badge",
      },
    };

    return mockClubImages[clubName] || null;
  } catch (error) {
    logger.error(`Club API image fetch failed for ${clubName}`, error);
    return null;
  }
}

/**
 * Generate placeholder image
 */
function generatePlaceholderImage(
  text: string,
  type: ImageResult["type"],
): ImageResult {
  const colors = {
    player: "3B82F6", // blue
    "club-badge": "EF4444", // red
    stadium: "10B981", // green
    action: "F59E0B", // amber
    celebration: "8B5CF6", // purple
  };

  const bgColor = colors[type] || "6B7280";
  const dimensions = type === "club-badge" ? "400x400" : "800x600";

  return {
    url: `https://via.placeholder.com/${dimensions}/${bgColor}/FFFFFF?text=${encodeURIComponent(text)}`,
    source: "placeholder",
    width: parseInt(dimensions.split("x")[0]),
    height: parseInt(dimensions.split("x")[1]),
    alt: `${text} placeholder image`,
    type: type,
  };
}

/**
 * Main image fetching function with fallbacks
 */
export async function fetchEnhancedImage(
  searchTerm: string,
  options: ImageSearchOptions = {},
): Promise<ImageResult> {
  const {
    preferredSources = ["wikipedia", "club-api", "unsplash", "placeholder"],
    type = "player",
    fallbackToPlaceholder = true,
  } = options;

  logger.info(`Fetching enhanced image for: ${searchTerm}, type: ${type}`);

  for (const source of preferredSources) {
    let result: ImageResult | null = null;

    switch (source) {
      case "wikipedia":
        result = await fetchWikipediaImage(searchTerm, type);
        break;
      case "unsplash":
        result = await fetchUnsplashImage(searchTerm, type);
        break;
      case "club-api":
        if (type === "club-badge" || type === "player") {
          result = await fetchClubApiImage(searchTerm);
        }
        break;
    }

    if (result) {
      logger.info(`Found image from ${source} for ${searchTerm}`);
      return result;
    }
  }

  // Fallback to placeholder
  if (fallbackToPlaceholder) {
    logger.info(`Using placeholder for ${searchTerm}`);
    return generatePlaceholderImage(searchTerm, type);
  }

  throw new Error(`No image found for ${searchTerm}`);
}

/**
 * Batch fetch images for multiple entities
 */
export async function batchFetchImages(
  requests: Array<{ searchTerm: string; type: ImageResult["type"] }>,
  options: ImageSearchOptions = {},
): Promise<Map<string, ImageResult>> {
  const results = new Map<string, ImageResult>();

  // Process in parallel with concurrency limit
  const concurrencyLimit = 5;
  for (let i = 0; i < requests.length; i += concurrencyLimit) {
    const batch = requests.slice(i, i + concurrencyLimit);
    const batchResults = await Promise.all(
      batch.map(async ({ searchTerm, type }) => {
        try {
          const image = await fetchEnhancedImage(searchTerm, {
            ...options,
            type,
          });
          return { searchTerm, image };
        } catch (error) {
          logger.error(`Failed to fetch image for ${searchTerm}`, error);
          return {
            searchTerm,
            image: generatePlaceholderImage(searchTerm, type),
          };
        }
      }),
    );

    batchResults.forEach(({ searchTerm, image }) => {
      results.set(searchTerm, image);
    });
  }

  return results;
}

/**
 * Optimize image URL for performance
 */
export function optimizeImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "webp" | "jpeg" | "png";
  } = {},
): string {
  // In production, this would use a CDN/image optimization service
  // For now, return the original URL
  return url;
}

/**
 * Get image set for a transfer story
 */
export async function getTransferStoryImages(
  playerName: string,
  fromClub: string,
  toClub: string,
): Promise<{
  player: ImageResult;
  fromClubBadge: ImageResult;
  toClubBadge: ImageResult;
  toClubStadium?: ImageResult;
  actionShot?: ImageResult;
}> {
  const [player, fromClubBadge, toClubBadge, toClubStadium, actionShot] =
    await Promise.all([
      fetchEnhancedImage(playerName, { type: "player" }),
      fetchEnhancedImage(fromClub, { type: "club-badge" }),
      fetchEnhancedImage(toClub, { type: "club-badge" }),
      fetchEnhancedImage(`${toClub} stadium`, {
        type: "stadium",
        preferredSources: ["wikipedia", "unsplash"],
      }),
      fetchEnhancedImage(`${playerName} playing`, {
        type: "action",
        preferredSources: ["unsplash"],
      }),
    ]);

  return {
    player,
    fromClubBadge,
    toClubBadge,
    toClubStadium: toClubStadium || undefined,
    actionShot: actionShot || undefined,
  };
}

/**
 * Create image collage URL for multiple players
 */
export function createPlayerCollageUrl(playerImages: ImageResult[]): string {
  // In production, this would use a service to create collages
  // For now, return the first player image
  return (
    playerImages[0]?.url ||
    generatePlaceholderImage("Transfer Targets", "action").url
  );
}
