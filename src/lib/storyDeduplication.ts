import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

export interface TransferInfo {
  player: string;
  fromClub?: string;
  toClub?: string;
  type: "transfer" | "loan" | "contract_extension" | "interest" | "negotiating";
}

// Generate a hash for story deduplication
export function generateStoryHash(info: TransferInfo): string {
  // Normalize names to lowercase and remove common words
  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/^(fc|afc|cf|sc)-/, "") // Remove common prefixes
      .replace(/-(fc|afc|cf|sc)$/, ""); // Remove common suffixes

  const player = normalizeText(info.player);
  const from = info.fromClub ? normalizeText(info.fromClub) : "free-agent";
  const to = info.toClub ? normalizeText(info.toClub) : "unknown";
  const type = info.type;

  // Create a deterministic hash
  // For similar transfer types, use a common base to avoid duplicates
  let typeGroup: string = type;
  if (type === 'interest' || type === 'negotiating') {
    typeGroup = 'potential-transfer'; // Group early-stage transfer news
  }
  
  const hashInput = `${player}-${from}-${to}-${typeGroup}`;
  return crypto
    .createHash("md5")
    .update(hashInput)
    .digest("hex")
    .substring(0, 16);
}

// Extract transfer info from tweet content
export function extractTransferInfo(tweetContent: string): TransferInfo | null {
  // Clean the tweet
  const cleanText = tweetContent
    .replace(/[🚨🔴⚪️💣❤️🤍]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Try to extract player name
  const playerPatterns = [
    /([A-Z][a-z]+(?: [A-Z][a-z]+)+) (?:to|has|will|could|set)/,
    /^([A-Z][a-z]+(?: [A-Z][a-z]+)+) /,
    /(?:with|for) ([A-Z][a-z]+(?: [A-Z][a-z]+)+)/,
  ];

  let player: string | null = null;
  for (const pattern of playerPatterns) {
    const match = cleanText.match(pattern);
    if (match?.[1]) {
      player = match[1];
      break;
    }
  }

  if (!player) return null;

  // Extract clubs - improved patterns
  const fromClubPatterns = [
    /(?:from|leaves|exit from|departing) ([A-Z][A-Za-z\s]+?)(?:\s+(?:to|and|for|after))/,
    /([A-Z][A-Za-z\s]+?) (?:ready to sell|willing to let|to offload)/,
    /Chelsea over move for/, // Special case: "Chelsea over move for" means FROM Chelsea
  ];
  
  const toClubPatterns = [
    /(?:to|joins?|move to|heading to) ([A-Z][A-Za-z\s]+?)(?:[,.\s]|$)/,
    /([A-Z][A-Za-z\s]+?) (?:want|interested in|make contact|in talks|preparing bid)/,
    /Arsenal (?:make contact|and Chelsea)/, // Special cases for Arsenal/Chelsea
  ];

  let fromClub: string | undefined;
  let toClub: string | undefined;
  
  // Special handling for "Arsenal make contact with Chelsea over move for"
  if (cleanText.includes("Arsenal make contact with Chelsea")) {
    fromClub = "Chelsea";
    toClub = "Arsenal";
  } else if (cleanText.includes("Arsenal and Chelsea")) {
    // Both clubs interested, no specific from club
    toClub = "Arsenal/Chelsea";
  } else {
    // Try standard patterns
    for (const pattern of fromClubPatterns) {
      const match = cleanText.match(pattern);
      if (match?.[1]) {
        fromClub = match[1].trim();
        break;
      }
    }
    
    for (const pattern of toClubPatterns) {
      const match = cleanText.match(pattern);
      if (match?.[1]) {
        toClub = match[1].trim();
        break;
      }
    }
  }

  // Determine transfer type
  let type: TransferInfo["type"] = "transfer";
  if (/loan|on loan|loan deal/i.test(cleanText)) {
    type = "loan";
  } else if (/contract extension|new deal|extends|renews/i.test(cleanText)) {
    type = "contract_extension";
  } else if (/interested|monitoring|tracking|considering/i.test(cleanText)) {
    type = "interest";
  } else if (/negotiating|talks|discussions|bid/i.test(cleanText)) {
    type = "negotiating";
  }

  return {
    player,
    fromClub,
    toClub,
    type,
  };
}

// Check if a story already exists
export async function findExistingStory(hash: string) {
  return await prisma.story.findUnique({
    where: { storyHash: hash },
    include: {
      tweet: {
        include: { source: true },
      },
      relatedTweets: {
        include: {
          tweet: {
            include: { source: true },
          },
        },
        orderBy: { addedAt: "desc" },
      },
    },
  });
}

// Update an existing story with new information
export async function updateExistingStory(
  storyId: string,
  newTweetId: string,
  newContent?: {
    headline?: string;
    articleContent?: string;
    contextData?: any;
  },
) {
  // Add the new tweet to related tweets
  await prisma.storyTweet.create({
    data: {
      storyId,
      tweetId: newTweetId,
    },
  });

  // Update story if new content provided
  if (newContent) {
    await prisma.story.update({
      where: { id: storyId },
      data: {
        ...newContent,
        lastChecked: new Date(),
        updateCount: { increment: 1 },
      },
    });
  } else {
    // Just update the last checked time
    await prisma.story.update({
      where: { id: storyId },
      data: {
        lastChecked: new Date(),
      },
    });
  }
}

// Check if story needs updating based on new information
export function shouldUpdateStory(
  existingStory: any,
  newTweetContent: string,
): boolean {
  // Update if it's been more than 2 hours since last check
  const hoursSinceUpdate =
    (Date.now() - new Date(existingStory.lastChecked).getTime()) /
    (1000 * 60 * 60);

  if (hoursSinceUpdate > 2) return true;

  // Update if the new tweet contains significant new information
  const significantKeywords = [
    "confirmed",
    "official",
    "done deal",
    "here we go",
    "medical",
    "agreement reached",
    "deal off",
    "collapsed",
  ];

  const hasSignificantUpdate = significantKeywords.some(
    (keyword) =>
      newTweetContent.toLowerCase().includes(keyword) &&
      !existingStory.articleContent?.toLowerCase().includes(keyword),
  );

  return hasSignificantUpdate;
}

// Get all stories that haven't been checked recently
export async function getStoriesNeedingUpdate(hoursThreshold: number = 6) {
  const threshold = new Date();
  threshold.setHours(threshold.getHours() - hoursThreshold);

  return await prisma.story.findMany({
    where: {
      lastChecked: {
        lt: threshold,
      },
      // Only get stories from the last 7 days
      createdAt: {
        gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    include: {
      tweet: {
        include: { source: true },
      },
    },
    orderBy: {
      lastChecked: "asc",
    },
    take: 20, // Process 20 at a time
  });
}

// Clean up old stories
export async function cleanupOldStories(daysToKeep: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const deleted = await prisma.story.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
      // Don't delete stories that have been updated recently
      lastChecked: {
        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  console.log(`Cleaned up ${deleted.count} old stories`);
  return deleted.count;
}
