/**
 * Contextual Image Placement System
 * AI-powered image-to-content matching and layout optimization
 */

import type { ProcessedImage } from "./processor";
import type { ArticleSection } from "@/lib/ai/article-generator";
import type { ContentAnalysis } from "@/lib/ai/content-analyzer";
import { z } from "zod";
import OpenAI from "openai";

// Placement schemas
export const ImagePlacementSchema = z.object({
  id: z.string(),
  imageId: z.string(),
  sectionId: z.string(),
  position: z.enum(["header", "inline", "sidebar", "footer"]),
  order: z.number(),
  size: z.enum(["thumbnail", "medium", "large", "full-width"]),
  alignment: z.enum(["left", "center", "right", "justify"]),
  caption: z.string(),
  relevanceScore: z.number().min(0).max(100),
  contextMatch: z.object({
    playerMatch: z.number().min(0).max(100),
    clubMatch: z.number().min(0).max(100),
    topicMatch: z.number().min(0).max(100),
    sentimentMatch: z.number().min(0).max(100),
  }),
  layout: z.object({
    breakAt: z.number(), // Character position in content
    wrapText: z.boolean(),
    marginTop: z.number(),
    marginBottom: z.number(),
    responsive: z.object({
      mobile: z.object({
        size: z.enum(["thumbnail", "medium", "large"]),
        alignment: z.enum(["left", "center", "right"]),
      }),
      tablet: z.object({
        size: z.enum(["thumbnail", "medium", "large"]),
        alignment: z.enum(["left", "center", "right"]),
      }),
      desktop: z.object({
        size: z.enum(["thumbnail", "medium", "large", "full-width"]),
        alignment: z.enum(["left", "center", "right", "justify"]),
      }),
    }),
  }),
  optimization: z.object({
    lazyLoad: z.boolean(),
    preload: z.boolean(),
    priority: z.enum(["high", "medium", "low"]),
    srcSet: z.array(z.string()),
  }),
});

export const ArticleLayoutSchema = z.object({
  articleId: z.string(),
  sections: z.array(
    z.object({
      sectionId: z.string(),
      placements: z.array(ImagePlacementSchema),
    }),
  ),
  heroImage: ImagePlacementSchema.optional(),
  thumbnailImage: ImagePlacementSchema.optional(),
  metadata: z.object({
    totalImages: z.number(),
    averageRelevance: z.number(),
    layoutScore: z.number().min(0).max(100),
    readabilityImpact: z.number().min(-10).max(10),
    loadTime: z.number(),
  }),
  performance: z.object({
    totalImageSize: z.number(),
    compressionRatio: z.number(),
    lazyLoadCount: z.number(),
    preloadCount: z.number(),
  }),
});

export type ImagePlacement = z.infer<typeof ImagePlacementSchema>;
export type ArticleLayout = z.infer<typeof ArticleLayoutSchema>;

interface PlacementConfig {
  openaiApiKey: string;
  maxImagesPerSection?: number;
  minRelevanceScore?: number;
  preferredAspectRatio?: number;
  enableLazyLoading?: boolean;
  optimizeForMobile?: boolean;
}

export class ImagePlacementService {
  private openai: OpenAI;
  private config: Required<PlacementConfig>;

  constructor(config: PlacementConfig) {
    this.config = {
      maxImagesPerSection: 2,
      minRelevanceScore: 60,
      preferredAspectRatio: 1.5, // 3:2 ratio
      enableLazyLoading: true,
      optimizeForMobile: true,
      ...config,
    };

    this.openai = new OpenAI({
      apiKey: this.config.openaiApiKey,
    });
  }

  /**
   * Create optimal image layout for an article
   */
  async createArticleLayout(
    sections: ArticleSection[],
    availableImages: ProcessedImage[],
    contentAnalyses: ContentAnalysis[],
  ): Promise<ArticleLayout> {
    const startTime = Date.now();

    // Select hero image
    const heroImage = await this.selectHeroImage(availableImages, sections[0]);

    // Select thumbnail for article preview
    const thumbnailImage = await this.selectThumbnailImage(
      availableImages,
      sections,
    );

    // Create placements for each section
    const sectionPlacements = await Promise.all(
      sections.map((section) =>
        this.createSectionPlacements(section, availableImages, contentAnalyses),
      ),
    );

    // Calculate layout metrics
    const allPlacements = sectionPlacements.flatMap((sp) => sp.placements);
    const metadata = this.calculateLayoutMetrics(allPlacements);
    const performance = this.calculatePerformanceMetrics(
      allPlacements,
      availableImages,
    );

    const layoutTime = Date.now() - startTime;

    return ArticleLayoutSchema.parse({
      articleId: `layout_${Date.now()}`,
      sections: sectionPlacements,
      heroImage,
      thumbnailImage,
      metadata: {
        ...metadata,
        loadTime: layoutTime,
      },
      performance,
    });
  }

  /**
   * Find optimal image placements for content
   */
  async findOptimalPlacements(
    content: string,
    availableImages: ProcessedImage[],
    contentAnalysis: ContentAnalysis,
  ): Promise<ImagePlacement[]> {
    const placements: ImagePlacement[] = [];

    // Filter images by relevance
    const relevantImages = await this.scoreImageRelevance(
      availableImages,
      content,
      contentAnalysis,
    );

    const filteredImages = relevantImages.filter(
      (scored) => scored.score >= this.config.minRelevanceScore,
    );

    // Create placements for top images
    const topImages = filteredImages
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.maxImagesPerSection);

    for (let i = 0; i < topImages.length; i++) {
      const { image, score, contextMatch } = topImages[i];

      const placement = await this.createPlacement(
        image,
        content,
        i,
        score,
        contextMatch,
      );

      placements.push(placement);
    }

    return placements;
  }

  /**
   * Select hero image for article
   */
  private async selectHeroImage(
    availableImages: ProcessedImage[],
    firstSection: ArticleSection,
  ): Promise<ImagePlacement | undefined> {
    if (availableImages.length === 0) return undefined;

    // Prefer high-quality, high-relevance images for hero
    const candidates = availableImages
      .filter((img) => img.variants.large.width >= 600)
      .filter((img) => img.type === "player" || img.type === "club")
      .sort((a, b) => {
        // Prioritize by type, then by resolution
        const aScore = this.calculateHeroScore(a);
        const bScore = this.calculateHeroScore(b);
        return bScore - aScore;
      });

    if (candidates.length === 0) return undefined;

    const heroImage = candidates[0];
    const caption = await this.generateCaption(heroImage, firstSection.content);

    return {
      id: `hero_${heroImage.id}`,
      imageId: heroImage.id,
      sectionId: firstSection.id,
      position: "header",
      order: 0,
      size: "full-width",
      alignment: "center",
      caption,
      relevanceScore: 95,
      contextMatch: {
        playerMatch: 90,
        clubMatch: 85,
        topicMatch: 95,
        sentimentMatch: 80,
      },
      layout: this.createResponsiveLayout("header", "full-width"),
      optimization: {
        lazyLoad: false,
        preload: true,
        priority: "high",
        srcSet: this.generateSrcSet(heroImage),
      },
    };
  }

  /**
   * Select thumbnail image for article preview
   */
  private async selectThumbnailImage(
    availableImages: ProcessedImage[],
    sections: ArticleSection[],
  ): Promise<ImagePlacement | undefined> {
    if (availableImages.length === 0) return undefined;

    // Prefer square or landscape images for thumbnails
    const candidates = availableImages.filter((img) => {
      const aspect = img.variants.medium.width / img.variants.medium.height;
      return aspect >= 1.0 && aspect <= 2.0; // 1:1 to 2:1 ratio
    });

    if (candidates.length === 0)
      return availableImages[0]
        ? this.createThumbnailPlacement(availableImages[0])
        : undefined;

    return this.createThumbnailPlacement(candidates[0]);
  }

  /**
   * Create thumbnail placement configuration
   */
  private createThumbnailPlacement(image: ProcessedImage): ImagePlacement {
    return {
      id: `thumb_${image.id}`,
      imageId: image.id,
      sectionId: "thumbnail",
      position: "inline",
      order: 0,
      size: "thumbnail",
      alignment: "center",
      caption: "",
      relevanceScore: 80,
      contextMatch: {
        playerMatch: 75,
        clubMatch: 75,
        topicMatch: 80,
        sentimentMatch: 70,
      },
      layout: this.createResponsiveLayout("inline", "thumbnail"),
      optimization: {
        lazyLoad: false,
        preload: true,
        priority: "high",
        srcSet: [image.variants.thumbnail.url],
      },
    };
  }

  /**
   * Create placements for a section
   */
  private async createSectionPlacements(
    section: ArticleSection,
    availableImages: ProcessedImage[],
    contentAnalyses: ContentAnalysis[],
  ): Promise<{ sectionId: string; placements: ImagePlacement[] }> {
    const sectionAnalysis = contentAnalyses.find((analysis) =>
      section.sourceTweets.some((tweetId) => analysis.tweetId === tweetId),
    );

    if (!sectionAnalysis) {
      return { sectionId: section.id, placements: [] };
    }

    const placements = await this.findOptimalPlacements(
      section.content,
      availableImages,
      sectionAnalysis,
    );

    return {
      sectionId: section.id,
      placements: placements.map((p) => ({ ...p, sectionId: section.id })),
    };
  }

  /**
   * Score image relevance to content
   */
  private async scoreImageRelevance(
    images: ProcessedImage[],
    content: string,
    contentAnalysis: ContentAnalysis,
  ): Promise<
    Array<{
      image: ProcessedImage;
      score: number;
      contextMatch: ImagePlacement["contextMatch"];
    }>
  > {
    const results = await Promise.all(
      images.map(async (image) => {
        const contextMatch = await this.calculateContextMatch(
          image,
          content,
          contentAnalysis,
        );

        const score = this.calculateOverallRelevance(contextMatch, image);

        return { image, score, contextMatch };
      }),
    );

    return results;
  }

  /**
   * Calculate context match scores
   */
  private async calculateContextMatch(
    image: ProcessedImage,
    content: string,
    contentAnalysis: ContentAnalysis,
  ): Promise<ImagePlacement["contextMatch"]> {
    const playerMatch = this.calculatePlayerMatch(image, contentAnalysis);
    const clubMatch = this.calculateClubMatch(image, contentAnalysis);
    const topicMatch = await this.calculateTopicMatch(image, content);
    const sentimentMatch = this.calculateSentimentMatch(image, contentAnalysis);

    return {
      playerMatch,
      clubMatch,
      topicMatch,
      sentimentMatch,
    };
  }

  /**
   * Calculate player name matching
   */
  private calculatePlayerMatch(
    image: ProcessedImage,
    contentAnalysis: ContentAnalysis,
  ): number {
    if (image.type !== "player") return 50; // Neutral for non-player images

    const playerNames = contentAnalysis.entities.players.map((p) =>
      p.name.toLowerCase(),
    );
    const imageTitle = image.title.toLowerCase();
    const imageAlt = image.altText.toLowerCase();

    let matchScore = 0;

    for (const playerName of playerNames) {
      if (imageTitle.includes(playerName) || imageAlt.includes(playerName)) {
        matchScore += 60; // Higher base score for exact matches
      }

      // Partial name matching
      const nameParts = playerName.split(" ");
      for (const part of nameParts) {
        if (
          part.length > 2 &&
          (imageTitle.includes(part) || imageAlt.includes(part))
        ) {
          matchScore += 20; // Higher partial match bonus
        }
      }
    }

    // If we found any player-related content, give minimum good score
    if (matchScore > 0 && matchScore < 60) {
      matchScore = 60;
    }

    return Math.min(matchScore, 100);
  }

  /**
   * Calculate club name matching
   */
  private calculateClubMatch(
    image: ProcessedImage,
    contentAnalysis: ContentAnalysis,
  ): number {
    if (image.type !== "club") return 50; // Neutral for non-club images

    const clubNames = contentAnalysis.entities.clubs.map((c) =>
      c.name.toLowerCase(),
    );
    const imageTitle = image.title.toLowerCase();
    const imageAlt = image.altText.toLowerCase();

    let matchScore = 0;

    for (const clubName of clubNames) {
      const lowerClubName = clubName.toLowerCase();

      // Direct name matching
      if (
        imageTitle.includes(lowerClubName) ||
        imageAlt.includes(lowerClubName)
      ) {
        matchScore += 80; // Higher base score for exact matches
      }

      // Common club abbreviations
      const abbreviations = this.generateClubAbbreviations(clubName);
      for (const abbrev of abbreviations) {
        if (imageTitle.includes(abbrev) || imageAlt.includes(abbrev)) {
          matchScore += 60; // Higher abbreviation bonus
        }
      }

      // Partial word matching for club names
      const clubWords = lowerClubName.split(" ");
      for (const word of clubWords) {
        if (
          word.length > 2 &&
          (imageTitle.includes(word) || imageAlt.includes(word))
        ) {
          matchScore += 30;
        }
      }
    }

    return Math.min(matchScore, 100);
  }

  /**
   * Calculate topic relevance using AI
   */
  private async calculateTopicMatch(
    image: ProcessedImage,
    content: string,
  ): Promise<number> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content:
              "You are an expert at matching images to content. Rate how well an image relates to the given text content on a scale of 0-100.",
          },
          {
            role: "user",
            content: `Rate the relevance of this image to the content (0-100):

Image: ${image.title}
Alt text: ${image.altText}
Type: ${image.type}
Source: ${image.source}

Content: ${content.substring(0, 500)}...

Return only a number between 0 and 100.`,
          },
        ],
        max_tokens: 10,
        temperature: 0.1,
      });

      const score = parseInt(
        response.choices[0]?.message?.content?.trim() || "50",
      );
      return Math.max(0, Math.min(100, score));
    } catch (error) {
      console.warn("Topic matching failed, using fallback:", error);
      return 50; // Neutral fallback
    }
  }

  /**
   * Calculate sentiment matching
   */
  private calculateSentimentMatch(
    image: ProcessedImage,
    contentAnalysis: ContentAnalysis,
  ): number {
    // Images from celebrations/signings match positive sentiment
    if (
      image.type === "celebration" &&
      contentAnalysis.sentiment.sentiment === "positive"
    ) {
      return 90;
    }

    // News images are generally neutral and match any sentiment
    if (image.type === "news") {
      return 75;
    }

    // Player/club images match based on transfer context
    if (contentAnalysis.classification.transferType === "CONFIRMED") {
      return 85;
    }

    return 70; // Default moderate match
  }

  /**
   * Calculate overall relevance score
   */
  private calculateOverallRelevance(
    contextMatch: ImagePlacement["contextMatch"],
    image: ProcessedImage,
  ): number {
    const weights = {
      playerMatch: 0.3,
      clubMatch: 0.3,
      topicMatch: 0.25,
      sentimentMatch: 0.15,
    };

    let score =
      contextMatch.playerMatch * weights.playerMatch +
      contextMatch.clubMatch * weights.clubMatch +
      contextMatch.topicMatch * weights.topicMatch +
      contextMatch.sentimentMatch * weights.sentimentMatch;

    // Quality bonuses
    if (image.accessibility.readabilityScore > 80) score += 5;
    if (image.optimization.compressionRatio > 0.5) score += 3;
    if (image.variants.large.width >= 800) score += 2;

    return Math.min(score, 100);
  }

  /**
   * Create individual placement
   */
  private async createPlacement(
    image: ProcessedImage,
    content: string,
    order: number,
    relevanceScore: number,
    contextMatch: ImagePlacement["contextMatch"],
  ): Promise<ImagePlacement> {
    const position = this.determineOptimalPosition(content, order);
    const size = this.determineOptimalSize(image, position);
    const alignment = this.determineOptimalAlignment(size, position);
    const caption = await this.generateCaption(image, content);

    return {
      id: `placement_${image.id}_${order}`,
      imageId: image.id,
      sectionId: "", // Will be set by caller
      position,
      order,
      size,
      alignment,
      caption,
      relevanceScore,
      contextMatch,
      layout: this.createResponsiveLayout(position, size),
      optimization: {
        lazyLoad: this.config.enableLazyLoading && order > 0,
        preload: order === 0,
        priority: order === 0 ? "high" : "medium",
        srcSet: this.generateSrcSet(image),
      },
    };
  }

  /**
   * Determine optimal position for image
   */
  private determineOptimalPosition(
    content: string,
    order: number,
  ): ImagePlacement["position"] {
    const contentLength = content.length;

    if (order === 0 && contentLength < 500) return "sidebar"; // First image in short content goes to sidebar
    if (order === 0) return "inline"; // First image in longer content inline

    if (contentLength > 1000) return "inline"; // Long content benefits from inline images

    return "sidebar"; // Shorter content can use sidebar
  }

  /**
   * Determine optimal size for image
   */
  private determineOptimalSize(
    image: ProcessedImage,
    position: ImagePlacement["position"],
  ): ImagePlacement["size"] {
    if (position === "header") return "full-width";
    if (position === "sidebar") return "medium";

    // For inline, choose based on image quality and aspect ratio
    const aspect = image.variants.large.width / image.variants.large.height;

    if (aspect > 1.8) return "large"; // Wide images work well large
    if (aspect < 1.2) return "medium"; // Square-ish images better medium

    return "medium"; // Default to medium
  }

  /**
   * Determine optimal alignment
   */
  private determineOptimalAlignment(
    size: ImagePlacement["size"],
    position: ImagePlacement["position"],
  ): ImagePlacement["alignment"] {
    if (position === "header") return "center";
    if (position === "sidebar") return "right";
    if (size === "full-width") return "center";

    return "left"; // Default for inline images
  }

  /**
   * Generate image caption
   */
  private async generateCaption(
    image: ProcessedImage,
    content: string,
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content:
              "Generate concise, informative captions for transfer news images. Include attribution and keep under 100 characters.",
          },
          {
            role: "user",
            content: `Generate a caption for this image in the context of this content:

Image: ${image.title}
Alt text: ${image.altText}
Attribution: ${image.attribution}
Type: ${image.type}

Content context: ${content.substring(0, 300)}...

Create a caption that's informative, includes proper attribution, and is under 100 characters.`,
          },
        ],
        max_tokens: 50,
        temperature: 0.3,
      });

      const caption = response.choices[0]?.message?.content?.trim();
      return caption && caption.length <= 100
        ? caption
        : `${image.title} (${image.attribution})`;
    } catch (error) {
      console.warn("Caption generation failed:", error);
      return `${image.title} (${image.attribution})`;
    }
  }

  /**
   * Create responsive layout configuration
   */
  private createResponsiveLayout(
    position: ImagePlacement["position"],
    size: ImagePlacement["size"],
  ): ImagePlacement["layout"] {
    const baseMargin = 16;

    return {
      breakAt: 0, // Will be calculated during actual placement
      wrapText: position === "inline",
      marginTop: baseMargin,
      marginBottom: baseMargin,
      responsive: {
        mobile: {
          size: size === "full-width" ? "large" : "medium",
          alignment: "center",
        },
        tablet: {
          size: size === "full-width" ? "large" : (size as any),
          alignment: position === "sidebar" ? "right" : "center",
        },
        desktop: {
          size,
          alignment: position === "header" ? "center" : "left",
        },
      },
    };
  }

  /**
   * Generate responsive srcSet
   */
  private generateSrcSet(image: ProcessedImage): string[] {
    return [
      `${image.variants.thumbnail.url} 150w`,
      `${image.variants.medium.url} 400w`,
      `${image.variants.large.url} 800w`,
    ];
  }

  /**
   * Calculate hero image score
   */
  private calculateHeroScore(image: ProcessedImage): number {
    let score = 0;

    // Type preferences
    if (image.type === "player") score += 40;
    else if (image.type === "club") score += 35;
    else if (image.type === "celebration") score += 30;
    else score += 20;

    // Quality bonuses
    score += image.accessibility.readabilityScore * 0.2;
    score += image.variants.large.width / 10; // Resolution bonus

    // Source preferences
    if (image.source === "twitter") score += 10;

    return score;
  }

  /**
   * Generate club abbreviations for matching
   */
  private generateClubAbbreviations(clubName: string): string[] {
    const name = clubName.toLowerCase();
    const abbreviations: string[] = [];

    // Common patterns
    if (name.includes("manchester united"))
      abbreviations.push("mufc", "united");
    if (name.includes("manchester city")) abbreviations.push("mcfc", "city");
    if (name.includes("arsenal")) abbreviations.push("afc");
    if (name.includes("chelsea")) abbreviations.push("cfc");
    if (name.includes("liverpool")) abbreviations.push("lfc");
    if (name.includes("tottenham")) abbreviations.push("thfc", "spurs");

    // Generic patterns
    if (name.includes(" fc")) abbreviations.push(name.replace(" fc", " f.c."));
    if (name.includes(" united"))
      abbreviations.push(name.replace(" united", " utd"));

    return abbreviations;
  }

  /**
   * Calculate layout metrics
   */
  private calculateLayoutMetrics(
    placements: ImagePlacement[],
  ): Omit<ArticleLayout["metadata"], "loadTime"> {
    const totalImages = placements.length;
    const averageRelevance =
      placements.length > 0
        ? placements.reduce((sum, p) => sum + p.relevanceScore, 0) /
          placements.length
        : 0;

    // Layout score based on image distribution and relevance
    let layoutScore = averageRelevance * 0.6;

    // Bonus for good image distribution
    if (totalImages >= 2 && totalImages <= 4) layoutScore += 20;
    else if (totalImages === 1) layoutScore += 10;
    else if (totalImages > 4) layoutScore -= 10;

    // Readability impact (negative if too many images)
    const readabilityImpact = totalImages > 3 ? -2 * (totalImages - 3) : 1;

    return {
      totalImages,
      averageRelevance: Math.round(averageRelevance),
      layoutScore: Math.max(0, Math.min(100, Math.round(layoutScore))),
      readabilityImpact,
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(
    placements: ImagePlacement[],
    availableImages: ProcessedImage[],
  ): ArticleLayout["performance"] {
    const usedImages = availableImages.filter((img) =>
      placements.some((p) => p.imageId === img.id),
    );

    const totalImageSize = usedImages.reduce(
      (sum, img) => sum + img.variants.large.fileSize,
      0,
    );

    const originalSize = usedImages.reduce(
      (sum, img) => sum + img.optimization.originalSize,
      0,
    );

    const compressionRatio =
      originalSize > 0 ? (originalSize - totalImageSize) / originalSize : 0;

    const lazyLoadCount = placements.filter(
      (p) => p.optimization.lazyLoad,
    ).length;
    const preloadCount = placements.filter(
      (p) => p.optimization.preload,
    ).length;

    return {
      totalImageSize,
      compressionRatio,
      lazyLoadCount,
      preloadCount,
    };
  }
}
