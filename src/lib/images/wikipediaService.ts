/**
 * Wikipedia Commons Image Service
 * Fetches high-quality player images from Wikipedia Commons API
 */

interface WikipediaSearchResult {
  title: string;
  url: string;
  description?: string;
  width: number;
  height: number;
  size: number;
  timestamp: string;
}

interface WikipediaImageInfo {
  url: string;
  width: number;
  height: number;
  size: number;
  mime: string;
  timestamp: string;
  user: string;
  description?: string;
}

interface PlayerImageResult {
  url: string;
  width: number;
  height: number;
  source: "wikipedia" | "fallback";
  description?: string;
  confidence: number; // 0-1 confidence in match quality
}

export class WikipediaImageService {
  private static readonly BASE_API_URL = "https://en.wikipedia.org/api/rest_v1";
  private static readonly COMMONS_API_URL =
    "https://commons.wikimedia.org/w/api.php";
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static cache = new Map<
    string,
    { result: PlayerImageResult | null; timestamp: number }
  >();

  /**
   * Search for a player image with intelligent matching
   */
  static async findPlayerImage(
    playerName: string,
  ): Promise<PlayerImageResult | null> {
    // Check cache first
    const cacheKey = this.normalizePlayerName(playerName);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.result;
    }

    try {
      // Try multiple search strategies
      const searchVariations = this.generateSearchVariations(playerName);

      for (const searchTerm of searchVariations) {
        const result = await this.searchWikipediaImage(searchTerm);
        if (result && result.confidence > 0.6) {
          // Cache the result
          this.cache.set(cacheKey, { result, timestamp: Date.now() });
          return result;
        }
      }

      // If no good match found, cache null result to avoid repeated API calls
      this.cache.set(cacheKey, { result: null, timestamp: Date.now() });
      return null;
    } catch (error) {
      console.error("Error fetching player image:", error);
      return null;
    }
  }

  /**
   * Search Wikipedia for player with multiple strategies
   */
  private static async searchWikipediaImage(
    searchTerm: string,
  ): Promise<PlayerImageResult | null> {
    try {
      // First, try to find the Wikipedia page for the player
      const pageInfo = await this.findWikipediaPage(searchTerm);
      if (!pageInfo) {
        return null;
      }

      // Get the main image from the page
      const imageInfo = await this.getPageMainImage(pageInfo.title);
      if (!imageInfo) {
        return null;
      }

      // Score the image quality and relevance
      const confidence = this.calculateImageConfidence(
        imageInfo,
        searchTerm,
        pageInfo,
      );

      if (confidence < 0.3) {
        return null; // Too low confidence
      }

      return {
        url: imageInfo.url,
        width: imageInfo.width,
        height: imageInfo.height,
        source: "wikipedia",
        description: imageInfo.description || pageInfo.description,
        confidence,
      };
    } catch (error) {
      console.error("Error in Wikipedia image search:", error);
      return null;
    }
  }

  /**
   * Find Wikipedia page for player
   */
  private static async findWikipediaPage(
    searchTerm: string,
  ): Promise<{ title: string; description?: string } | null> {
    try {
      const searchUrl = `${this.BASE_API_URL}/page/summary/${encodeURIComponent(searchTerm)}`;
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent":
            "TransferJuice/1.0 (https://transferjuice.com; contact@transferjuice.com)",
        },
      });

      if (!response.ok) {
        // Try search API if direct page lookup fails
        return await this.searchWikipediaPages(searchTerm);
      }

      const data = await response.json();

      // Validate this is likely a football player page
      if (this.isLikelyFootballPlayer(data)) {
        return {
          title: data.title,
          description: data.extract,
        };
      }

      return null;
    } catch (error) {
      console.error("Error finding Wikipedia page:", error);
      return null;
    }
  }

  /**
   * Search Wikipedia pages when direct lookup fails
   */
  private static async searchWikipediaPages(
    searchTerm: string,
  ): Promise<{ title: string; description?: string } | null> {
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(searchTerm)}&limit=5&format=json&origin=*`;
      const response = await fetch(searchUrl);

      if (!response.ok) {
        return null;
      }

      const [, titles, descriptions, urls] = await response.json();

      // Find the best match that's likely a football player
      for (let i = 0; i < titles.length; i++) {
        if (this.isLikelyFootballPlayerTitle(titles[i], descriptions[i])) {
          return {
            title: titles[i],
            description: descriptions[i],
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Error searching Wikipedia pages:", error);
      return null;
    }
  }

  /**
   * Get main image from Wikipedia page
   */
  private static async getPageMainImage(
    pageTitle: string,
  ): Promise<WikipediaImageInfo | null> {
    try {
      // Get page images
      const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages|images&format=json&origin=*&pithumbsize=400`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const pages = data.query?.pages;

      if (!pages) {
        return null;
      }

      const page = Object.values(pages)[0] as any;

      // Try to get the main page image first
      if (page.thumbnail?.source) {
        const imageInfo = await this.getImageDetails(page.thumbnail.source);
        if (imageInfo) {
          return imageInfo;
        }
      }

      // Fallback to other images on the page
      if (page.images && page.images.length > 0) {
        for (const image of page.images) {
          if (this.isLikelyPlayerPhoto(image.title)) {
            const imageInfo = await this.getImageDetails(image.title);
            if (imageInfo) {
              return imageInfo;
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting page main image:", error);
      return null;
    }
  }

  /**
   * Get detailed information about an image
   */
  private static async getImageDetails(
    imageTitle: string,
  ): Promise<WikipediaImageInfo | null> {
    try {
      const cleanTitle = imageTitle.startsWith("File:")
        ? imageTitle
        : `File:${imageTitle}`;
      const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanTitle)}&prop=imageinfo&iiprop=url|size|mime|timestamp|user|extmetadata&format=json&origin=*`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const pages = data.query?.pages;

      if (!pages) {
        return null;
      }

      const page = Object.values(pages)[0] as any;
      const imageInfo = page.imageinfo?.[0];

      if (!imageInfo) {
        return null;
      }

      return {
        url: imageInfo.url,
        width: imageInfo.width,
        height: imageInfo.height,
        size: imageInfo.size,
        mime: imageInfo.mime,
        timestamp: imageInfo.timestamp,
        user: imageInfo.user,
        description: imageInfo.extmetadata?.ImageDescription?.value,
      };
    } catch (error) {
      console.error("Error getting image details:", error);
      return null;
    }
  }

  /**
   * Generate search variations for better matching
   */
  private static generateSearchVariations(playerName: string): string[] {
    const variations = [playerName];

    // Add "footballer" suffix
    variations.push(`${playerName} footballer`);
    variations.push(`${playerName} football player`);

    // Handle common name patterns
    const nameParts = playerName.trim().split(/\s+/);

    if (nameParts.length > 1) {
      // Try first name + last name
      variations.push(`${nameParts[0]} ${nameParts[nameParts.length - 1]}`);

      // Try just last name for famous players
      if (nameParts.length > 2) {
        variations.push(nameParts[nameParts.length - 1]);
      }
    }

    // Add full name variations
    if (nameParts.length === 2) {
      // Try with middle names/full names that might exist
      const commonMiddleNames = ["de", "van", "dos", "da", "del", "di"];
      for (const middle of commonMiddleNames) {
        variations.push(`${nameParts[0]} ${middle} ${nameParts[1]}`);
      }
    }

    return [...new Set(variations)]; // Remove duplicates
  }

  /**
   * Calculate confidence score for image match
   */
  private static calculateImageConfidence(
    imageInfo: WikipediaImageInfo,
    searchTerm: string,
    pageInfo: { title: string; description?: string },
  ): number {
    let confidence = 0.5; // Base confidence

    // Size quality scoring
    const minDimension = Math.min(imageInfo.width, imageInfo.height);
    if (minDimension >= 300) confidence += 0.2;
    if (minDimension >= 500) confidence += 0.1;

    // Aspect ratio scoring (prefer portrait-ish photos)
    const aspectRatio = imageInfo.width / imageInfo.height;
    if (aspectRatio >= 0.7 && aspectRatio <= 1.3) confidence += 0.1;

    // File type scoring
    if (imageInfo.mime === "image/jpeg") confidence += 0.05;

    // Title matching
    const normalizedSearch = this.normalizePlayerName(searchTerm);
    const normalizedTitle = this.normalizePlayerName(pageInfo.title);
    if (normalizedTitle.includes(normalizedSearch)) confidence += 0.1;

    // Description matching
    if (pageInfo.description) {
      const desc = pageInfo.description.toLowerCase();
      if (desc.includes("football") || desc.includes("soccer"))
        confidence += 0.1;
      if (
        desc.includes("player") ||
        desc.includes("striker") ||
        desc.includes("midfielder") ||
        desc.includes("defender") ||
        desc.includes("goalkeeper")
      )
        confidence += 0.1;
    }

    // Recent timestamp scoring (prefer more recent photos)
    if (imageInfo.timestamp) {
      const imageDate = new Date(imageInfo.timestamp);
      const age = Date.now() - imageDate.getTime();
      const years = age / (365 * 24 * 60 * 60 * 1000);
      if (years < 2) confidence += 0.05;
      if (years < 5) confidence += 0.03;
    }

    return Math.min(confidence, 1.0); // Cap at 1.0
  }

  /**
   * Check if page content suggests a football player
   */
  private static isLikelyFootballPlayer(pageData: any): boolean {
    const text = `${pageData.title} ${pageData.extract || ""}`.toLowerCase();

    const footballKeywords = [
      "football",
      "soccer",
      "footballer",
      "striker",
      "midfielder",
      "defender",
      "goalkeeper",
      "winger",
      "forward",
      "player",
      "club",
      "team",
      "league",
      "premier league",
      "la liga",
      "serie a",
      "bundesliga",
      "ligue 1",
      "champions league",
    ];

    return footballKeywords.some((keyword) => text.includes(keyword));
  }

  /**
   * Check if title/description suggests a football player
   */
  private static isLikelyFootballPlayerTitle(
    title: string,
    description: string,
  ): boolean {
    const text = `${title} ${description}`.toLowerCase();
    return this.isLikelyFootballPlayer({ title, extract: description });
  }

  /**
   * Check if image is likely a player photo
   */
  private static isLikelyPlayerPhoto(imageTitle: string): boolean {
    const title = imageTitle.toLowerCase();

    // Exclude common non-player images
    const excludePatterns = [
      "logo",
      "badge",
      "crest",
      "stadium",
      "flag",
      "map",
      "chart",
      "graph",
      "icon",
      "svg",
      "commons-logo",
    ];

    if (excludePatterns.some((pattern) => title.includes(pattern))) {
      return false;
    }

    // Prefer image formats and names that suggest photos
    return (
      title.includes(".jpg") ||
      title.includes(".jpeg") ||
      title.includes("photo") ||
      title.includes("image") ||
      title.includes("portrait")
    );
  }

  /**
   * Normalize player name for consistent matching
   */
  private static normalizePlayerName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, "") // Remove special characters
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  }

  /**
   * Get fallback image URL for when Wikipedia search fails
   */
  static getFallbackImageUrl(): string {
    return "/images/player-placeholder.svg"; // You'd create this fallback image
  }

  /**
   * Clear the cache (useful for development)
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // You could implement hit rate tracking
    };
  }
}

// Export convenience functions
export const findPlayerImage = (playerName: string) =>
  WikipediaImageService.findPlayerImage(playerName);
export const getFallbackImage = () =>
  WikipediaImageService.getFallbackImageUrl();
export const clearImageCache = () => WikipediaImageService.clearCache();
