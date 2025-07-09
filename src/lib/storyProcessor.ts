import { PrismaClient } from "@prisma/client";
import { RSSItem } from "./types";
import { extractFacts, ExtractedFacts } from "./storyAggregator";

const prisma = new PrismaClient();

interface TransferMetadata {
  type: "transfer" | "loan" | "contract_extension" | "interest" | "negotiating";
  player: string;
  fromClub?: string;
  toClub?: string;
  transferType?: string;
  fee?: string;
  wages?: string;
  payCut?: string;
  loanDuration?: string;
  contractUntil?: string;
  managerMentioned?: string;
  status: "confirmed" | "negotiating" | "interest" | "rejected" | "completed";
  confidence: "high" | "medium" | "low";
  importance: number; // 1-10 score for story weight
  lastUpdated: Date;
  sources: string[];
  isHereWeGo?: boolean; // Romano's signature
  isMegaDeal?: boolean; // £50m+ or major club moves
}

// Extract player name with better logic
export function extractPlayerNameSmart(
  text: string,
  facts: ExtractedFacts,
): string | null {
  // Skip non-transfer content
  if (
    /suffered|injury|injured|fractured|surgery|hospital|medical emergency/i.test(
      text,
    )
  ) {
    return null;
  }

  // Clean text
  const cleanText = text
    .replace(/[🚨🔴⚪️💣❤️🤍🇸🇪🇧🇷🇫🇷🇩🇪🇮🇹🇪🇸🏴󐁧󐁢󐁥󐁮󐁧󐁿]+/g, "")
    .trim();

  // Look for specific patterns based on story type
  const patterns = [
    // "Player to Club" pattern - most common
    /([A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+(?:\s+[A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+)+)\s+to\s+[A-Z]/,
    // "Player leaves Club A and joins Club B"
    /([A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+(?:\s+[A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+)+)\s+leaves/,
    // "Player has accepted/agreed"
    /([A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+(?:\s+[A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+)+)\s+has\s+(?:accepted|agreed)/,
    // "Player and Club" pattern
    /([A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+(?:\s+[A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+)+)\s+and\s+[A-Z]/,
    // Start of sentence
    /^([A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+(?:\s+[A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+)+)\s+(?:to|will|could|set)/,
    // "have agreed new deal with PLAYER"
    /have\s+agreed\s+(?:new\s+)?deal\s+with\s+(?:Polish\s+defender\s+)?([A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+(?:\s+[A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+)+)/,
  ];

  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Don't reject if it's not in the clubs list - many clubs aren't in our list
      return name;
    }
  }

  return null;
}

// Determine transfer direction and type
export function extractTransferDetails(
  text: string,
  facts: ExtractedFacts,
): Partial<TransferMetadata> {
  const details: Partial<TransferMetadata> = {};

  // Extract FROM and TO clubs
  const leavesMatch = text.match(
    /leaves\s+([A-Z][a-zA-Z\s]+?)\s+and\s+joins\s+([A-Z][a-zA-Z\s]+?)(?:\s+on)?/,
  );
  const fromToMatch = text.match(
    /from\s+([A-Z][a-zA-Z\s]+?)\s+to\s+([A-Z][a-zA-Z\s]+)/,
  );
  const willReceiveMatch = text.match(/([A-Z][a-zA-Z\s]+?)\s+will\s+receive/);

  if (leavesMatch) {
    details.fromClub = leavesMatch[1].trim();
    details.toClub = leavesMatch[2].trim();
  } else if (fromToMatch) {
    details.fromClub = fromToMatch[1].trim();
    details.toClub = fromToMatch[2].trim();
  } else if (text.includes(" to ") && facts.clubs.length >= 1) {
    // Pattern like "Player to Club"
    const toMatch = text.match(/to\s+([A-Z][a-zA-Z\s]+?)(?:,|\.|\s+here)/);
    if (toMatch && facts.clubs.includes(toMatch[1].trim())) {
      details.toClub = toMatch[1].trim();
      // If there's a second club mentioned, it's likely the selling club
      if (facts.clubs.length >= 2 && willReceiveMatch) {
        details.fromClub = willReceiveMatch[1].trim();
      }
    }
  } else if (facts.clubs.length >= 2) {
    // For negotiations, first club mentioned is usually buying club
    if (facts.isConfirmed || facts.isNearConfirmed) {
      details.toClub = facts.clubs[0];
      details.fromClub = facts.clubs[1];
    }
  } else if (
    facts.clubs.length === 1 &&
    /new deal|contract extension|extends|renews/i.test(text)
  ) {
    // Contract extension at same club
    details.toClub = facts.clubs[0];
    details.fromClub = undefined;
  }

  // Determine transfer type
  if (/loan deal|on loan|year loan/i.test(text)) {
    details.type = "loan";
    const loanMatch = text.match(/(\d+)\s*year loan/i);
    if (loanMatch) {
      details.loanDuration = loanMatch[1] + " year";
    }
  } else if (
    /new deal|contract extension|extends|renews|new contract/i.test(text) &&
    !details.toClub
  ) {
    details.type = "contract_extension";
    details.toClub = facts.clubs[0]; // Same club
  } else if (facts.isConfirmed) {
    details.type = "transfer";
  } else if (facts.isNearConfirmed) {
    details.type = "negotiating";
  } else {
    details.type = "interest";
  }

  // Extract manager mentions
  const managerMatch = text.match(
    /(?:manager|coach|boss)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/,
  );
  if (managerMatch) {
    details.managerMentioned = managerMatch[1];
  } else if (/José Mourinho|Mourinho/i.test(text)) {
    details.managerMentioned = "José Mourinho";
  }

  // Status
  if (facts.isConfirmed) {
    details.status = "completed";
  } else if (facts.isRejected) {
    details.status = "rejected";
  } else if (facts.isNearConfirmed) {
    details.status = "negotiating";
  } else {
    details.status = "interest";
  }

  // Financial details
  if (facts.fee) details.fee = facts.fee;
  if (facts.wages) details.wages = facts.wages;
  if (facts.payCut) details.payCut = facts.payCut;
  if (facts.contractUntil) details.contractUntil = facts.contractUntil;

  return details;
}

// Calculate story importance (1-10 scale)
export function calculateStoryImportance(
  metadata: Partial<TransferMetadata>,
  facts: ExtractedFacts,
): number {
  let importance = 0;

  // Status weighting
  if (metadata.status === "completed") importance += 4;
  else if (metadata.status === "negotiating") importance += 3;
  else if (metadata.status === "rejected") importance += 2;
  else importance += 1;

  // Fee-based importance (mega deals get high scores)
  if (metadata.fee) {
    const feeValue = parseFloat(metadata.fee.replace(/[^0-9.]/g, ""));
    if (feeValue >= 100)
      importance += 5; // £100m+ is massive
    else if (feeValue >= 70)
      importance += 4; // £70m+ is huge
    else if (feeValue >= 50)
      importance += 3; // £50m+ is significant
    else if (feeValue >= 30) importance += 2;
    else if (feeValue >= 10) importance += 1;
  }

  // Big club involvement
  const megaClubs = [
    "Real Madrid",
    "Barcelona",
    "Manchester United",
    "Manchester City",
    "Liverpool",
    "Chelsea",
    "Arsenal",
    "Bayern Munich",
    "PSG",
    "Juventus",
  ];
  const bigClubs = [
    ...megaClubs,
    "Tottenham",
    "Atletico Madrid",
    "Inter Milan",
    "AC Milan",
    "Borussia Dortmund",
    "Newcastle",
  ];

  const involvedClubs = [metadata.fromClub, metadata.toClub].filter(Boolean);
  const megaClubCount = involvedClubs.filter(
    (club) => club && megaClubs.includes(club),
  ).length;
  const bigClubCount = involvedClubs.filter(
    (club) => club && bigClubs.includes(club),
  ).length;

  importance += megaClubCount * 2; // +2 for each mega club
  importance += bigClubCount - megaClubCount; // +1 for other big clubs

  // Special circumstances
  if (facts.isHereWeGo) importance += 2; // Romano confirmation is gold
  if (metadata.type === "loan" && metadata.managerMentioned) importance += 1; // Manager pull
  if (metadata.payCut) importance += 1; // Unusual situation

  // Multiple sources = more reliable/important
  if (metadata.sources && metadata.sources.length > 2) importance += 1;

  return Math.min(importance, 10); // Cap at 10
}

// Check if we already have this story
async function findExistingStory(
  player: string,
  clubs: string[],
): Promise<any | null> {
  // Look for stories about this player in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Get all recent stories and filter in JS
  const stories = await prisma.story.findMany({
    where: {
      tweet: {
        scrapedAt: {
          gte: sevenDaysAgo,
        },
      },
    },
    include: {
      tweet: true,
    },
    orderBy: {
      tweet: {
        scrapedAt: "desc",
      },
    },
  });

  // Filter for this player
  const playerStories = stories.filter((story) => {
    const meta = story.metadata as any;
    return meta?.player === player;
  });

  // Check if any story involves the same clubs
  for (const story of playerStories) {
    const storyMeta = story.metadata as any;
    if (storyMeta.fromClub && clubs.includes(storyMeta.fromClub)) return story;
    if (storyMeta.toClub && clubs.includes(storyMeta.toClub)) return story;
  }

  return null;
}

// Process RSS items into individual stories
export async function processRSSIntoStories(items: RSSItem[]) {
  const processedStories = [];

  for (const item of items) {
    try {
      // Extract facts
      const facts = extractFacts(item);
      const playerName = extractPlayerNameSmart(item.content_text, facts);

      if (!playerName) continue;

      // Extract transfer details
      const transferDetails = extractTransferDetails(item.content_text, facts);

      // Calculate importance
      const importance = calculateStoryImportance(transferDetails, facts);
      const feeValue = transferDetails.fee
        ? parseFloat(transferDetails.fee.replace(/[^0-9.]/g, ""))
        : 0;

      // Build metadata
      const metadata: TransferMetadata = {
        type: transferDetails.type || "interest",
        player: playerName,
        fromClub: transferDetails.fromClub,
        toClub: transferDetails.toClub,
        fee: transferDetails.fee,
        wages: transferDetails.wages,
        payCut: transferDetails.payCut,
        loanDuration: transferDetails.loanDuration,
        contractUntil: transferDetails.contractUntil,
        managerMentioned: transferDetails.managerMentioned,
        status: transferDetails.status || "interest",
        confidence: facts.isConfirmed
          ? "high"
          : facts.isNearConfirmed
            ? "medium"
            : "low",
        importance,
        lastUpdated: new Date(item.date_published),
        sources: [item.authors[0]?.name || "Unknown"],
        isHereWeGo: facts.isHereWeGo,
        isMegaDeal: feeValue >= 50,
      };

      // Check for existing story
      const existingStory = await findExistingStory(playerName, facts.clubs);

      if (existingStory) {
        // Update existing story if status has changed
        const existingMeta = existingStory.metadata as any;
        if (
          existingMeta.status !== metadata.status ||
          existingMeta.fee !== metadata.fee ||
          new Date(item.date_published) > new Date(existingMeta.lastUpdated)
        ) {
          // Update the story
          await prisma.story.update({
            where: { id: existingStory.id },
            data: {
              metadata: {
                ...existingMeta,
                ...metadata,
                sources: [
                  ...new Set([...existingMeta.sources, ...metadata.sources]),
                ],
                lastUpdated: new Date(item.date_published),
              },
            },
          });

          console.log(`Updated story: ${playerName} (${metadata.status})`);
        } else {
          console.log(`Skipped duplicate: ${playerName}`);
        }
        continue;
      }

      // Create source first
      const source = await prisma.source.upsert({
        where: { handle: item.authors[0]?.name || "Unknown" },
        update: {},
        create: {
          name: item.authors[0]?.name || "Unknown",
          handle: item.authors[0]?.name || "Unknown",
        },
      });

      // Create tweet record
      const tweet = await prisma.tweet.create({
        data: {
          tweetId: item.id,
          content: item.content_text,
          url: item.url,
          sourceId: source.id,
          scrapedAt: new Date(item.date_published),
        },
      });

      // Create story with metadata
      const story = await prisma.story.create({
        data: {
          tweetId: tweet.id,
          terryComment: generateTerryComment(metadata),
          metadata: metadata as any,
        },
      });

      processedStories.push(story);
      console.log(
        `Created story: ${playerName} - ${metadata.fromClub || "?"} → ${metadata.toClub || "?"} (${metadata.status})`,
      );
    } catch (error) {
      console.error(
        `Error processing item: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
  }

  return processedStories;
}

// Generate appropriate Terry comment based on transfer type
function generateTerryComment(metadata: TransferMetadata): string {
  if (
    metadata.type === "loan" &&
    metadata.managerMentioned === "José Mourinho"
  ) {
    return "Mourinho's pulling strings again. The Special One never could resist a loan deal.";
  }

  if (metadata.payCut) {
    return "Taking a pay cut in 2025? Someone check if hell's frozen over.";
  }

  if (metadata.type === "contract_extension") {
    return "Loyalty in football? Must be a typo.";
  }

  if (metadata.fee && parseFloat(metadata.fee.replace(/[^0-9.]/g, "")) > 50) {
    return "Another day, another small country's GDP changes hands.";
  }

  return "The carousel spins on.";
}

// Get mega stories from the last N hours for recap
export async function getMegaStoriesForRecap(
  hours: number = 24,
  minImportance: number = 7,
) {
  const sinceTime = new Date();
  sinceTime.setHours(sinceTime.getHours() - hours);

  // Use raw query for JSON field filtering
  const stories = await prisma.$queryRaw`
    SELECT s.*, 
           t.id as "tweet_id", t."tweetId" as "tweet_tweetId", t."sourceId" as "tweet_sourceId", 
           t.content as "tweet_content", t.url as "tweet_url", t."scrapedAt" as "tweet_scrapedAt",
           src.id as "source_id", src.name as "source_name", src.handle as "source_handle", src."createdAt" as "source_createdAt"
    FROM stories s
    JOIN tweets t ON s."tweetId" = t.id
    JOIN sources src ON t."sourceId" = src.id
    WHERE t."scrapedAt" >= ${sinceTime}
    AND (s.metadata->>'importance')::int >= ${minImportance}
    ORDER BY (s.metadata->>'importance')::int DESC, t."scrapedAt" DESC
  `;

  // Transform raw results to match expected format
  return (stories as any[]).map((row) => ({
    id: row.id,
    tweetId: row.tweetId,
    terryComment: row.terryComment,
    metadata: row.metadata,
    createdAt: row.createdAt,
    tweet: {
      id: row.tweet_id,
      tweetId: row.tweet_tweetId,
      sourceId: row.tweet_sourceId,
      content: row.tweet_content,
      url: row.tweet_url,
      scrapedAt: row.tweet_scrapedAt,
      source: {
        id: row.source_id,
        name: row.source_name,
        handle: row.source_handle,
        createdAt: row.source_createdAt,
      },
    },
  }));
}

// Get stories for hourly briefing (prioritizing by importance)
export async function getStoriesForBriefing(hours: number = 3) {
  const sinceTime = new Date();
  sinceTime.setHours(sinceTime.getHours() - hours);
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

  // First get stories with standard query, then sort by importance
  const stories = await prisma.story.findMany({
    where: {
      tweet: {
        scrapedAt: {
          gte: sinceTime,
        },
      },
      OR: [
        // Not included in any briefing yet
        {
          briefings: {
            none: {},
          },
        },
        // Or last included more than 6 hours ago
        {
          briefings: {
            every: {
              briefing: {
                publishedAt: {
                  lt: sixHoursAgo,
                },
              },
            },
          },
        },
      ],
    },
    include: {
      tweet: {
        include: {
          source: true,
        },
      },
      briefings: {
        include: {
          briefing: true,
        },
      },
    },
    orderBy: {
      tweet: {
        scrapedAt: "desc",
      },
    },
    take: 50, // Get more, then sort by importance
  });

  // Sort by importance (extracting from metadata)
  const sortedStories = stories.sort((a, b) => {
    const aImportance = (a.metadata as any)?.importance || 0;
    const bImportance = (b.metadata as any)?.importance || 0;
    return bImportance - aImportance;
  });

  return sortedStories.slice(0, 20); // Return top 20
}
