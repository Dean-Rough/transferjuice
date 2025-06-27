/**
 * Simple player image fetcher
 * Gets player images from Wikipedia or returns a default
 */

import { WikipediaImageService } from "@/lib/images/wikipediaService";

export interface PlayerImageData {
  url: string;
  alt: string;
  caption: string;
  source: "wikipedia" | "fallback";
  confidence?: number;
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
 * Extract and fetch images for all players in content
 */
export async function addPlayerImagesToContent(
  content: string,
  feedItems: any[],
): Promise<string> {
  // Extract unique player names from feed items
  const playerNames = new Set<string>();

  feedItems.forEach((item) => {
    // Look for player names in various patterns
    const patterns = [
      /([A-Z][a-z]+ [A-Z][a-z]+)(?= to | from | has | agrees | signs | joins)/g,
      /🚨[^:]*:\s*([A-Z][a-z]+ [A-Z][a-z]+)/g,
      /EXCLUSIVE:\s*([A-Z][a-z]+ [A-Z][a-z]+)/g,
    ];

    patterns.forEach((pattern) => {
      const matches = item.content.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          playerNames.add(match[1]);
        }
      }
    });
  });

  // Fetch images for each player with enhanced data
  const playerImages = new Map<string, PlayerImageData>();

  for (const playerName of playerNames) {
    console.log(`🎯 Processing player: ${playerName}`);
    const imageData = await getPlayerImageUrl(playerName);
    playerImages.set(playerName, imageData);
  }

  // Add images after paragraphs mentioning the players
  let enhancedContent = content;
  const paragraphs = content.split("</p>");

  enhancedContent = paragraphs
    .map((para, idx) => {
      if (!para.trim()) return para;

      // Check which players are mentioned in this paragraph
      const mentionedPlayers: string[] = [];
      playerImages.forEach((imageData, name) => {
        if (para.includes(name)) {
          mentionedPlayers.push(name);
        }
      });

      // Add image after paragraph if player is mentioned
      if (mentionedPlayers.length > 0 && idx < paragraphs.length - 1) {
        const playerName = mentionedPlayers[0]; // Use first mentioned player
        const imageData = playerImages.get(playerName)!;
        const imageHtml = generatePlayerImageHTML(imageData);
        return para + "</p>" + imageHtml;
      }

      return para + (para.trim() ? "</p>" : "");
    })
    .join("");

  return enhancedContent;
}
