/**
 * Polaroid Generation Service
 * Creates dynamic polaroid images for players in briefings
 */

import { getPlayerImage } from "@/lib/wikipedia/playerImages";
import { generatePolaroidFrame } from "@/lib/images/polaroidGenerator";
import type { TimelineItem, PolaroidOptions } from "@/types/briefing";
import { prisma } from "@/lib/prisma";

/**
 * Generate polaroids for timeline items
 */
export async function generatePolaroids(
  feedItems: any[],
  timelineItems: TimelineItem[],
): Promise<TimelineItem[]> {
  console.log("📸 Generating polaroids for timeline...");

  const itemsWithPolaroids = await Promise.all(
    timelineItems.map(async (item) => {
      if (!item.polaroid?.playerName) {
        return item;
      }

      try {
        // Generate or retrieve polaroid
        const polaroidUrl = await getOrGeneratePolaroid({
          playerName: item.polaroid.playerName,
          clubName: item.polaroid.clubName,
          frameColor: item.polaroid.frameColor,
        });

        return {
          ...item,
          polaroid: {
            ...item.polaroid,
            imageUrl: polaroidUrl,
          },
        };
      } catch (error) {
        console.warn(
          `Failed to generate polaroid for ${item.polaroid.playerName}:`,
          error,
        );
        return item;
      }
    }),
  );

  return itemsWithPolaroids;
}

/**
 * Get or generate polaroid for player
 */
async function getOrGeneratePolaroid(
  options: PolaroidOptions,
): Promise<string> {
  const { playerName, clubName, frameColor } = options;

  // Check if we have a cached polaroid
  const cachedPlayer = await prisma.player.findFirst({
    where: {
      normalizedName: playerName.toLowerCase().replace(/\s+/g, "-"),
    },
  });

  if (
    cachedPlayer?.polaroidUrl &&
    isRecentPolaroid(cachedPlayer.polaroidUpdatedAt)
  ) {
    return cachedPlayer.polaroidUrl;
  }

  // Generate new polaroid
  console.log(`🎨 Generating polaroid for ${playerName}...`);

  // Get player image from Wikipedia
  const playerImage = await getPlayerImage(playerName);

  if (!playerImage) {
    // Return default polaroid
    return generateDefaultPolaroid(playerName, clubName);
  }

  // Generate polaroid frame
  const polaroidUrl = await generatePolaroidFrame({
    imageUrl: playerImage.url,
    playerName,
    clubName,
    frameColor: frameColor || "#FFFFFF",
    style:
      (options.style === "club-themed" ? "classic" : options.style) ||
      "vintage",
  });

  // Cache the polaroid
  if (cachedPlayer) {
    await prisma.player.update({
      where: { id: cachedPlayer.id },
      data: {
        polaroidUrl,
        polaroidUpdatedAt: new Date(),
        imageUrl: playerImage.url,
        imageLicense: playerImage.license,
      },
    });
  } else {
    await prisma.player.create({
      data: {
        name: playerName,
        normalizedName: playerName.toLowerCase().replace(/\s+/g, "-"),
        wikipediaUrl: playerImage.wikipediaUrl,
        imageUrl: playerImage.url,
        imageLicense: playerImage.license,
        currentClub: clubName,
        polaroidUrl,
        polaroidUpdatedAt: new Date(),
      },
    });
  }

  return polaroidUrl;
}

/**
 * Check if polaroid is recent enough
 */
function isRecentPolaroid(updatedAt: Date | null): boolean {
  if (!updatedAt) return false;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return updatedAt > thirtyDaysAgo;
}

/**
 * Generate default polaroid for players without images
 */
async function generateDefaultPolaroid(
  playerName: string,
  clubName?: string,
): Promise<string> {
  // This would generate a default silhouette polaroid
  // For now, return a placeholder URL

  const initials = playerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // In production, this would generate an actual image
  return `/api/polaroids/default?initials=${initials}&club=${encodeURIComponent(clubName || "Unknown")}`;
}

/**
 * Extract player mentions from feed items
 */
export function extractPlayerMentions(feedItems: any[]): PlayerMention[] {
  const mentions: Map<string, PlayerMention> = new Map();

  feedItems.forEach((item) => {
    // Extract from tags
    if (item.tags) {
      item.tags.forEach((tag: any) => {
        if (tag.tag?.type === "PLAYER") {
          const playerName = tag.tag.name;
          const existing = mentions.get(playerName);

          mentions.set(playerName, {
            name: playerName,
            count: (existing?.count || 0) + 1,
            clubs: existing?.clubs || extractClubsFromItem(item),
            lastMentioned: item.publishedAt,
          });
        }
      });
    }

    // Also try to extract from content using NER
    const extractedPlayers = extractPlayersFromText(item.content);
    extractedPlayers.forEach((playerName) => {
      const existing = mentions.get(playerName);

      mentions.set(playerName, {
        name: playerName,
        count: (existing?.count || 0) + 1,
        clubs: existing?.clubs || extractClubsFromItem(item),
        lastMentioned: item.publishedAt,
      });
    });
  });

  return Array.from(mentions.values()).sort((a, b) => b.count - a.count);
}

/**
 * Extract player names from text
 */
function extractPlayersFromText(text: string): string[] {
  const players: string[] = [];

  // Common player name patterns
  // This is simplified - production would use proper NER
  const patterns = [
    // Full names
    /(?:(?:signs?|join|move|transfer|bid|medical|deal|target)\s+(?:for\s+)?)((?:[A-Z][a-z]+\s+){1,2}[A-Z][a-z]+)(?:\s|,|\.)/g,
    // Names after positions
    /(?:striker|midfielder|defender|goalkeeper|winger|forward)\s+((?:[A-Z][a-z]+\s+){1,2}[A-Z][a-z]+)/g,
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim();
      // Filter out common false positives
      if (!isLikelyPlayerName(name)) continue;
      players.push(name);
    }
  });

  return [...new Set(players)];
}

/**
 * Check if extracted text is likely a player name
 */
function isLikelyPlayerName(name: string): boolean {
  // Filter out clubs, countries, etc.
  const notPlayerNames = [
    "Manchester United",
    "Manchester City",
    "Real Madrid",
    "Barcelona",
    "Premier League",
    "La Liga",
    "Champions League",
    "England",
    "Spain",
    "France",
    "Germany",
    "Brazil",
    "The Athletic",
    "Sky Sports",
    "BBC Sport",
  ];

  return (
    !notPlayerNames.includes(name) &&
    name.split(" ").length >= 2 &&
    name.split(" ").length <= 4
  );
}

/**
 * Extract clubs from feed item
 */
function extractClubsFromItem(item: any): string[] {
  const clubs: string[] = [];

  if (item.tags) {
    item.tags.forEach((tag: any) => {
      if (tag.tag?.type === "CLUB") {
        clubs.push(tag.tag.name);
      }
    });
  }

  return clubs;
}

// Type definitions

interface PlayerMention {
  name: string;
  count: number;
  clubs: string[];
  lastMentioned: Date;
}
