/**
 * Image Sourcing System
 * Handles Twitter media extraction and Wikipedia Commons integration
 */

// Define TweetMediaInfo type based on Twitter API structure
type TweetMediaInfo = {
  media_key: string;
  type: string;
  url?: string;
  preview_image_url?: string;
  alt_text?: string;
  width?: number;
  height?: number;
};
import { z } from "zod";

// Image source schemas
export const TwitterImageSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  altText: z.string().optional(),
  type: z.enum(["photo", "video_thumbnail"]),
  width: z.number().optional(),
  height: z.number().optional(),
  tweetId: z.string(),
  authorHandle: z.string(),
});

export const WikipediaImageSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  description: z.string(),
  license: z.string(),
  attribution: z.string(),
  width: z.number(),
  height: z.number(),
  searchTerm: z.string(),
  relevanceScore: z.number().min(0).max(100),
});

export const ImageSourceSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  source: z.enum(["twitter", "wikipedia"]),
  type: z.enum(["player", "club", "news", "celebration"]),
  title: z.string(),
  altText: z.string(),
  attribution: z.string(),
  license: z.string(),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
  }),
  metadata: z.object({
    tweetId: z.string().optional(),
    authorHandle: z.string().optional(),
    searchTerm: z.string().optional(),
    relevanceScore: z.number().min(0).max(100),
  }),
  quality: z.object({
    resolution: z.enum(["low", "medium", "high"]),
    format: z.string(),
    fileSize: z.number().optional(),
  }),
});

export type TwitterImage = z.infer<typeof TwitterImageSchema>;
export type WikipediaImage = z.infer<typeof WikipediaImageSchema>;
export type ImageSource = z.infer<typeof ImageSourceSchema>;

interface WikipediaResponse {
  query: {
    pages: Record<
      string,
      {
        pageid: number;
        title: string;
        imageinfo?: Array<{
          url: string;
          descriptionurl: string;
          width: number;
          height: number;
          size: number;
          extmetadata?: {
            ObjectName?: { value: string };
            ImageDescription?: { value: string };
            LicenseShortName?: { value: string };
            Attribution?: { value: string };
          };
        }>;
      }
    >;
  };
}

interface ImageSourcingConfig {
  wikipediaApiUrl?: string;
  userAgent: string;
  enableCaching?: boolean;
  cacheTtl?: number;
  qualityThreshold?: number;
}

export class ImageSourcingService {
  private config: Required<ImageSourcingConfig>;
  private cache: Map<string, ImageSource[]> = new Map();

  constructor(config: ImageSourcingConfig) {
    this.config = {
      wikipediaApiUrl: "https://en.wikipedia.org/w/api.php",
      enableCaching: true,
      cacheTtl: 3600000, // 1 hour
      qualityThreshold: 60,
      ...config,
    };
  }

  /**
   * Extract images from Twitter media
   */
  async extractTwitterImages(
    mediaInfo: TweetMediaInfo[],
    tweetId: string,
    authorHandle: string,
  ): Promise<ImageSource[]> {
    const images: ImageSource[] = [];

    for (const media of mediaInfo) {
      if (media.type === "photo") {
        try {
          const twitterImage = this.processTwitterImage(
            media,
            tweetId,
            authorHandle,
          );
          const imageSource =
            await this.convertTwitterToImageSource(twitterImage);
          images.push(imageSource);
        } catch (error) {
          console.warn(`Failed to process Twitter image: ${error}`);
        }
      }
    }

    return images.filter(
      (img) => img.metadata.relevanceScore >= this.config.qualityThreshold,
    );
  }

  /**
   * Search Wikipedia Commons for relevant images
   */
  async searchWikipediaImages(
    searchTerms: string[],
    imageType: ImageSource["type"] = "player",
  ): Promise<ImageSource[]> {
    const cacheKey = `wiki_${searchTerms.join("_")}_${imageType}`;

    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const allImages: ImageSource[] = [];

    for (const term of searchTerms) {
      try {
        const images = await this.searchWikipediaForTerm(term, imageType);
        allImages.push(...images);
      } catch (error) {
        console.warn(`Wikipedia search failed for term "${term}": ${error}`);
      }
    }

    // Deduplicate and sort by relevance
    const uniqueImages = this.deduplicateImages(allImages);
    const sortedImages = uniqueImages
      .sort((a, b) => b.metadata.relevanceScore - a.metadata.relevanceScore)
      .slice(0, 10); // Top 10 results

    if (this.config.enableCaching) {
      this.cache.set(cacheKey, sortedImages);
      setTimeout(() => this.cache.delete(cacheKey), this.config.cacheTtl);
    }

    return sortedImages;
  }

  /**
   * Find contextual images for article content
   */
  async findContextualImages(
    playerNames: string[],
    clubNames: string[],
    transferType: string,
  ): Promise<{
    players: ImageSource[];
    clubs: ImageSource[];
    contextual: ImageSource[];
  }> {
    const [playerImages, clubImages, contextualImages] = await Promise.all([
      this.searchMultipleTerms(playerNames, "player"),
      this.searchMultipleTerms(clubNames, "club"),
      this.searchContextualImages(transferType),
    ]);

    return {
      players: playerImages,
      clubs: clubImages,
      contextual: contextualImages,
    };
  }

  /**
   * Process Twitter image data
   */
  private processTwitterImage(
    media: TweetMediaInfo,
    tweetId: string,
    authorHandle: string,
  ): TwitterImage {
    return TwitterImageSchema.parse({
      id: media.media_key,
      url: media.url,
      altText: media.alt_text,
      type: media.type === "photo" ? "photo" : "video_thumbnail",
      width: media.width,
      height: media.height,
      tweetId,
      authorHandle,
    });
  }

  /**
   * Convert Twitter image to standard ImageSource format
   */
  private async convertTwitterToImageSource(
    twitterImage: TwitterImage,
  ): Promise<ImageSource> {
    const relevanceScore = this.calculateTwitterRelevance(twitterImage);
    const resolution = this.determineResolution(
      twitterImage.width,
      twitterImage.height,
    );

    return ImageSourceSchema.parse({
      id: `twitter_${twitterImage.id}`,
      url: twitterImage.url,
      source: "twitter",
      type: "news",
      title: `Tweet image from @${twitterImage.authorHandle}`,
      altText:
        twitterImage.altText ||
        `Image from tweet by @${twitterImage.authorHandle}`,
      attribution: `@${twitterImage.authorHandle} on Twitter`,
      license: "Twitter Terms of Service",
      dimensions: {
        width: twitterImage.width || 400,
        height: twitterImage.height || 300,
      },
      metadata: {
        tweetId: twitterImage.tweetId,
        authorHandle: twitterImage.authorHandle,
        relevanceScore,
      },
      quality: {
        resolution,
        format: this.extractFormat(twitterImage.url),
        fileSize: undefined,
      },
    });
  }

  /**
   * Search Wikipedia for a specific term
   */
  private async searchWikipediaForTerm(
    searchTerm: string,
    imageType: ImageSource["type"],
  ): Promise<ImageSource[]> {
    const searchUrl = new URL(this.config.wikipediaApiUrl);
    searchUrl.searchParams.set("action", "query");
    searchUrl.searchParams.set("format", "json");
    searchUrl.searchParams.set("prop", "imageinfo");
    searchUrl.searchParams.set("generator", "images");
    searchUrl.searchParams.set("gimlimit", "10");
    searchUrl.searchParams.set("titles", searchTerm);
    searchUrl.searchParams.set("iiprop", "url|size|extmetadata");
    searchUrl.searchParams.set("origin", "*");

    const response = await fetch(searchUrl.toString(), {
      headers: {
        "User-Agent": this.config.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.status}`);
    }

    const data: WikipediaResponse = await response.json();

    if (!data.query?.pages) {
      return [];
    }

    const images: ImageSource[] = [];

    for (const page of Object.values(data.query.pages)) {
      if (page.imageinfo) {
        for (const imageInfo of page.imageinfo) {
          try {
            const wikipediaImage = this.processWikipediaImage(
              imageInfo,
              page.title,
              searchTerm,
            );
            const imageSource = this.convertWikipediaToImageSource(
              wikipediaImage,
              imageType,
            );
            images.push(imageSource);
          } catch (error) {
            console.warn(`Failed to process Wikipedia image: ${error}`);
          }
        }
      }
    }

    return images;
  }

  /**
   * Process Wikipedia image data
   */
  private processWikipediaImage(
    imageInfo: any,
    title: string,
    searchTerm: string,
  ): WikipediaImage {
    const extmetadata = imageInfo.extmetadata || {};
    const description = extmetadata.ImageDescription?.value || title;
    const license = extmetadata.LicenseShortName?.value || "CC BY-SA";
    const attribution = extmetadata.Attribution?.value || "Wikipedia";

    const relevanceScore = this.calculateWikipediaRelevance(
      title,
      searchTerm,
      description,
    );

    return WikipediaImageSchema.parse({
      title,
      url: imageInfo.url,
      description: this.stripHtml(description),
      license,
      attribution: this.stripHtml(attribution),
      width: imageInfo.width,
      height: imageInfo.height,
      searchTerm,
      relevanceScore,
    });
  }

  /**
   * Convert Wikipedia image to standard ImageSource format
   */
  private convertWikipediaToImageSource(
    wikipediaImage: WikipediaImage,
    imageType: ImageSource["type"],
  ): ImageSource {
    const resolution = this.determineResolution(
      wikipediaImage.width,
      wikipediaImage.height,
    );

    return ImageSourceSchema.parse({
      id: `wiki_${this.generateImageId(wikipediaImage.url)}`,
      url: wikipediaImage.url,
      source: "wikipedia",
      type: imageType,
      title: wikipediaImage.title,
      altText: wikipediaImage.description,
      attribution: wikipediaImage.attribution,
      license: wikipediaImage.license,
      dimensions: {
        width: wikipediaImage.width,
        height: wikipediaImage.height,
      },
      metadata: {
        searchTerm: wikipediaImage.searchTerm,
        relevanceScore: wikipediaImage.relevanceScore,
      },
      quality: {
        resolution,
        format: this.extractFormat(wikipediaImage.url),
        fileSize: undefined,
      },
    });
  }

  /**
   * Search for multiple terms and combine results
   */
  private async searchMultipleTerms(
    terms: string[],
    imageType: ImageSource["type"],
  ): Promise<ImageSource[]> {
    const allResults = await Promise.allSettled(
      terms.map((term) => this.searchWikipediaForTerm(term, imageType)),
    );

    const images: ImageSource[] = [];
    for (const result of allResults) {
      if (result.status === "fulfilled") {
        images.push(...result.value);
      }
    }

    return this.deduplicateImages(images)
      .sort((a, b) => b.metadata.relevanceScore - a.metadata.relevanceScore)
      .slice(0, 5);
  }

  /**
   * Search for contextual images based on transfer type
   */
  private async searchContextualImages(
    transferType: string,
  ): Promise<ImageSource[]> {
    const contextualTerms = {
      signing: ["football signing", "contract signing", "player presentation"],
      rumour: ["transfer news", "football speculation"],
      medical: ["medical test", "football medical"],
      agreement: ["handshake", "agreement"],
    };

    const terms = contextualTerms[
      transferType as keyof typeof contextualTerms
    ] || ["football"];
    return this.searchMultipleTerms(terms, "news");
  }

  /**
   * Calculate relevance score for Twitter images
   */
  private calculateTwitterRelevance(twitterImage: TwitterImage): number {
    let score = 50; // Base score

    // Higher score for verified accounts
    if (
      twitterImage.authorHandle &&
      this.isKnownItk(twitterImage.authorHandle)
    ) {
      score += 30;
    }

    // Higher score for images with alt text
    if (twitterImage.altText) {
      score += 10;
    }

    // Higher score for better resolution
    if (twitterImage.width && twitterImage.height) {
      const pixels = twitterImage.width * twitterImage.height;
      if (pixels > 500000)
        score += 20; // High resolution
      else if (pixels > 200000) score += 10; // Medium resolution
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate relevance score for Wikipedia images
   */
  private calculateWikipediaRelevance(
    title: string,
    searchTerm: string,
    description: string,
  ): number {
    let score = 30; // Base score

    const titleLower = title.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    const descLower = description.toLowerCase();

    // Exact match in title
    if (titleLower.includes(searchLower)) {
      score += 40;
    }

    // Partial match in title
    const searchWords = searchLower.split(" ");
    const titleMatches = searchWords.filter((word) =>
      titleLower.includes(word),
    );
    score += titleMatches.length * 10;

    // Match in description
    const descMatches = searchWords.filter((word) => descLower.includes(word));
    score += descMatches.length * 5;

    // Bonus for common football terms
    const footballTerms = [
      "football",
      "soccer",
      "premier league",
      "fc",
      "united",
      "city",
    ];
    const footballMatches = footballTerms.filter(
      (term) => titleLower.includes(term) || descLower.includes(term),
    );
    score += footballMatches.length * 5;

    return Math.min(score, 100);
  }

  /**
   * Determine image resolution category
   */
  private determineResolution(
    width?: number,
    height?: number,
  ): "low" | "medium" | "high" {
    if (!width || !height) return "medium";

    const pixels = width * height;
    if (pixels >= 1000000) return "high"; // 1MP+
    if (pixels >= 300000) return "medium"; // 300K+
    return "low";
  }

  /**
   * Extract file format from URL
   */
  private extractFormat(url: string): string {
    const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    return match ? match[1].toLowerCase() : "unknown";
  }

  /**
   * Generate unique image ID from URL
   */
  private generateImageId(url: string): string {
    return Buffer.from(url).toString("base64").slice(0, 16);
  }

  /**
   * Check if Twitter handle is a known ITK
   */
  private isKnownItk(handle: string): boolean {
    const knownItks = [
      "fabrizioromano",
      "johnnygould",
      "davidornstein",
      "jimwhite",
      "kayajournalist",
    ];
    return knownItks.includes(handle.toLowerCase());
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtml(text: string): string {
    return text.replace(/<[^>]*>/g, "").trim();
  }

  /**
   * Remove duplicate images based on URL
   */
  private deduplicateImages(images: ImageSource[]): ImageSource[] {
    const seen = new Set<string>();
    return images.filter((image) => {
      if (seen.has(image.url)) {
        return false;
      }
      seen.add(image.url);
      return true;
    });
  }

  /**
   * Clear cache manually
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
