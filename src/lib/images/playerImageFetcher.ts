/**
 * Advanced Image Pipeline
 * Comprehensive image system with entity extraction, multiple image types, and confidence scoring
 */

import { WikipediaImageService } from "@/lib/images/wikipediaService";
import { 
  searchRelevantImages, 
  extractImageSearchTerms, 
  validateImageUrls,
  type ImageResult 
} from "@/lib/media/imageSearch";

export interface PlayerImageData {
  url: string;
  alt: string;
  caption: string;
  source: "wikipedia" | "fallback" | "commons";
  confidence?: number;
  type?: "player" | "club_badge" | "stadium" | "action";
}

/**
 * Get image URL for a player with enhanced Wikipedia search
 */
export async function getPlayerImageUrl(
  playerName: string,
): Promise<PlayerImageData> {
  console.log(`🔍 Searching for image: ${playerName}`);

  try {
    // Try to get from Wikipedia with enhanced search
    const wikiResult = await WikipediaImageService.findPlayerImage(playerName);

    if (wikiResult && wikiResult.confidence > 0.6) {
      console.log(
        `✅ Found Wikipedia image for ${playerName} (confidence: ${wikiResult.confidence})`,
      );
      return {
        url: wikiResult.url,
        alt: playerName,
        caption: `${playerName} - ${wikiResult.description || ""}`,
        source: "wikipedia",
        confidence: wikiResult.confidence,
      };
    } else if (wikiResult) {
      console.log(
        `⚠️ Low confidence Wikipedia image for ${playerName} (${wikiResult.confidence})`,
      );
    }
  } catch (error) {
    console.warn(`❌ Failed to get Wikipedia image for ${playerName}:`, error);
  }

  // Return a default placeholder with initials
  const initials = playerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2); // Limit to 2 characters

  console.log(`📷 Using fallback image for ${playerName}`);

  return {
    url: `/api/polaroids/default?initials=${initials}&club=${encodeURIComponent(playerName)}`,
    alt: playerName,
    caption: playerName,
    source: "fallback",
  };
}

/**
 * Generate HTML for player image with enhanced formatting
 */
export function generatePlayerImageHTML(playerData: PlayerImageData): string {
  const confidenceIndicator =
    playerData.source === "wikipedia"
      ? `<span style="font-size: 12px; color: #888;">📸 Wikipedia</span>`
      : `<span style="font-size: 12px; color: #888;">🎨 Generated</span>`;

  return `
    <figure class="player-image" style="margin: 20px auto; text-align: center; max-width: 320px;">
      <img src="${playerData.url}" 
           alt="${playerData.alt}" 
           style="max-width: 300px; height: auto; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); transition: transform 0.2s ease;"
           loading="lazy" 
           onerror="this.style.opacity='0.7';" />
      <figcaption style="margin-top: 12px; font-size: 14px; color: #333; font-weight: 500;">
        ${playerData.caption}
        <br>${confidenceIndicator}
      </figcaption>
    </figure>
  `;
}

/**
 * Enhanced content image processing with multiple image types
 */
export async function addPlayerImagesToContent(
  content: string,
  feedItems: any[],
): Promise<string> {
  console.log("🖼️ Starting advanced image pipeline processing...");

  // Step 1: Extract all entities from content using advanced extraction
  const entities = extractImageSearchTerms(content);
  console.log(`📊 Extracted entities:`, {
    players: entities.players.length,
    clubs: entities.clubs.length,
    locations: entities.locations.length
  });

  // Step 2: Build comprehensive tag list for image search
  const tags = [
    ...entities.players.map(name => ({ name, type: "player" as const })),
    ...entities.clubs.map(name => ({ name, type: "club" as const })),
  ];

  // Step 3: Search for relevant images using advanced pipeline
  console.log("🔍 Searching for relevant images...");
  const searchResults = await searchRelevantImages(content, tags, {
    maxResults: Math.min(6, tags.length), // Scale with content richness
    preferredTypes: ["player", "club_badge", "stadium", "action"],
    fallbackToGeneric: true
  });

  // Step 4: Validate images and ensure they're accessible
  console.log("✅ Validating image URLs...");
  const validatedImages = await validateImageUrls(searchResults);
  console.log(`📸 ${validatedImages.length} valid images found`);

  // Step 5: Legacy fallback - get high-confidence player images from Wikipedia service
  const playerImages = new Map<string, PlayerImageData>();
  
  for (const playerName of entities.players.slice(0, 3)) { // Limit to prevent overwhelming
    try {
      const legacyImageData = await getPlayerImageUrl(playerName);
      playerImages.set(playerName, legacyImageData);
    } catch (error) {
      console.warn(`⚠️ Failed to get image for ${playerName}:`, error);
    }
  }

  // Step 6: Process content and add relevant images
  let enhancedContent = content;
  const paragraphs = content.split("</p>");

  enhancedContent = paragraphs
    .map((para, idx) => {
      if (!para.trim()) return para;

      // Find relevant images for this paragraph
      const relevantImages: ImageResult[] = [];
      const mentionedPlayers: string[] = [];

      // Check for entity mentions in this paragraph
      entities.players.forEach(playerName => {
        if (para.toLowerCase().includes(playerName.toLowerCase())) {
          mentionedPlayers.push(playerName);
          // Find corresponding images
          const playerImages = validatedImages.filter(img => 
            img.altText.toLowerCase().includes(playerName.toLowerCase()) && img.type === "player"
          );
          relevantImages.push(...playerImages.slice(0, 1));
        }
      });

      entities.clubs.forEach(clubName => {
        if (para.toLowerCase().includes(clubName.toLowerCase())) {
          const clubImages = validatedImages.filter(img => 
            img.altText.toLowerCase().includes(clubName.toLowerCase()) && img.type === "club_badge"
          );
          relevantImages.push(...clubImages.slice(0, 1));
        }
      });

      // Add rich media after significant paragraphs
      if (relevantImages.length > 0 && idx < paragraphs.length - 1) {
        const mediaHtml = generateAdvancedImageHTML(relevantImages[0]);
        return para + "</p>" + mediaHtml;
      }

      // Fallback to legacy player images if advanced search didn't find anything
      if (mentionedPlayers.length > 0 && relevantImages.length === 0 && idx < paragraphs.length - 1) {
        const playerName = mentionedPlayers[0];
        const legacyImageData = playerImages.get(playerName);
        if (legacyImageData) {
          const legacyHtml = generatePlayerImageHTML(legacyImageData);
          return para + "</p>" + legacyHtml;
        }
      }

      return para + (para.trim() ? "</p>" : "");
    })
    .join("");

  console.log("✨ Advanced image pipeline processing complete");
  return enhancedContent;
}

/**
 * Generate HTML for advanced image types (club badges, stadiums, action shots)
 */
function generateAdvancedImageHTML(imageResult: ImageResult): string {
  const typeLabels = {
    player: "📸 Player Photo",
    club_badge: "🛡️ Club Badge", 
    stadium: "🏟️ Stadium",
    action: "⚽ Action Shot"
  };

  const typeStyles = {
    player: "max-width: 320px; border-radius: 12px;",
    club_badge: "max-width: 120px; border-radius: 50%;",
    stadium: "max-width: 400px; border-radius: 8px;",
    action: "max-width: 400px; border-radius: 8px;"
  };

  return `
    <figure class="advanced-image" style="margin: 24px auto; text-align: center; max-width: 500px;">
      <img src="${imageResult.url}" 
           alt="${imageResult.altText}" 
           style="${typeStyles[imageResult.type]}; height: auto; box-shadow: 0 8px 24px rgba(0,0,0,0.15); transition: transform 0.2s ease;"
           loading="lazy" 
           onerror="this.style.opacity='0.7'; this.style.filter='grayscale(1)';" />
      <figcaption style="margin-top: 12px; font-size: 14px; color: #666; font-weight: 500;">
        ${imageResult.altText}
        <br><span style="font-size: 12px; color: #888;">${typeLabels[imageResult.type]} • ${imageResult.source}</span>
      </figcaption>
    </figure>
  `;
}
