/**
 * Content Enrichment Orchestrator
 * Coordinates entity extraction, stats fetching, and context building
 */

import { logger } from "@/lib/logger";
import { extractEntities, ExtractedTransferData } from "./entityExtractor";
import { fetchPlayerStats, PlayerStats } from "./playerStatsService";
import { getTransferContext, TransferContext } from "./transferHistoryService";
import { fetchClubContext, ClubContext } from "./clubContextService";

export interface EnrichedTweet {
  id: string;
  originalContent: string;
  entities: ExtractedTransferData;
  enrichment: {
    players: Map<string, PlayerStats | null>;
    clubs: Map<string, ClubContext | null>;
    transferContext?: TransferContext;
  };
  storyElements: {
    headline: string;
    mainPlayer?: string;
    mainClubs: string[];
    transferFee?: string;
    dealStage: string;
    narrativeHooks: string[];
  };
}

export interface EnrichmentOptions {
  includeStats?: boolean;
  includeTransferHistory?: boolean;
  includeClubContext?: boolean;
  maxPlayers?: number;
  priority?: "speed" | "depth";
}

/**
 * Enrich a single tweet with comprehensive data
 */
export async function enrichTweet(
  tweet: { id: string; content: string; author: string },
  options: EnrichmentOptions = {},
): Promise<EnrichedTweet> {
  const {
    includeStats = true,
    includeTransferHistory = true,
    includeClubContext = true,
    maxPlayers = 3,
    priority = "depth",
  } = options;

  logger.info(`Enriching tweet ${tweet.id} with priority: ${priority}`);

  // Extract entities
  const entities = extractEntities(tweet.content);

  // Fetch player stats
  const playerStats = new Map<string, PlayerStats | null>();
  if (includeStats && entities.players.length > 0) {
    const playersToFetch = entities.players
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxPlayers)
      .map((p) => p.name);

    for (const playerName of playersToFetch) {
      const stats = await fetchPlayerStats(playerName);
      playerStats.set(playerName, stats);
    }
  }

  // Fetch club context
  const clubContext = new Map<string, ClubContext | null>();
  if (includeClubContext && entities.clubs.length > 0) {
    for (const club of entities.clubs) {
      const context = await fetchClubContext(club.name);
      clubContext.set(club.name, context);
    }
  }

  // Get transfer context if we have the key elements
  let transferContext: TransferContext | undefined;
  if (
    includeTransferHistory &&
    entities.players.length > 0 &&
    entities.clubs.length >= 2
  ) {
    const mainPlayer = entities.players[0].name;
    const [fromClub, toClub] = entities.clubs.map((c) => c.name);
    const playerStat = playerStats.get(mainPlayer);

    transferContext = await getTransferContext(
      mainPlayer,
      fromClub,
      toClub,
      playerStat?.player.position || "Unknown",
      entities.fee?.amount,
    );
  }

  // Generate story elements
  const storyElements = generateStoryElements(
    tweet,
    entities,
    playerStats,
    clubContext,
  );

  return {
    id: tweet.id,
    originalContent: tweet.content,
    entities,
    enrichment: {
      players: playerStats,
      clubs: clubContext,
      transferContext,
    },
    storyElements,
  };
}

/**
 * Enrich multiple tweets in batch
 */
export async function batchEnrichTweets(
  tweets: Array<{ id: string; content: string; author: string }>,
  options: EnrichmentOptions = {},
): Promise<Map<string, EnrichedTweet>> {
  const enriched = new Map<string, EnrichedTweet>();

  // Process in parallel if priority is speed
  if (options.priority === "speed") {
    const promises = tweets.map((tweet) => enrichTweet(tweet, options));
    const results = await Promise.all(promises);
    results.forEach((result) => enriched.set(result.id, result));
  } else {
    // Process sequentially for depth priority
    for (const tweet of tweets) {
      const result = await enrichTweet(tweet, options);
      enriched.set(tweet.id, result);
    }
  }

  return enriched;
}

/**
 * Generate story elements from enriched data
 */
function generateStoryElements(
  tweet: { content: string; author: string },
  entities: ExtractedTransferData,
  playerStats: Map<string, PlayerStats | null>,
  clubContext: Map<string, ClubContext | null>,
): EnrichedTweet["storyElements"] {
  const mainPlayer = entities.players[0]?.name;
  const mainClubs = entities.clubs.map((c) => c.name);

  // Generate headline based on deal stage
  const headline = generateHeadline(entities, mainPlayer, mainClubs);

  // Format transfer fee
  const transferFee = entities.fee
    ? `${entities.fee.currency === "EUR" ? "€" : entities.fee.currency === "GBP" ? "£" : "$"}${
        entities.fee.amount >= 1000000
          ? `${(entities.fee.amount / 1000000).toFixed(1)}m`
          : `${(entities.fee.amount / 1000).toFixed(0)}k`
      }`
    : undefined;

  // Generate narrative hooks
  const narrativeHooks = generateNarrativeHooks(
    entities,
    playerStats,
    clubContext,
    mainPlayer,
    mainClubs,
  );

  return {
    headline,
    mainPlayer,
    mainClubs,
    transferFee,
    dealStage: entities.stage,
    narrativeHooks,
  };
}

/**
 * Generate a compelling headline
 */
function generateHeadline(
  entities: ExtractedTransferData,
  mainPlayer?: string,
  clubs: string[] = [],
): string {
  const [club1, club2] = clubs;

  switch (entities.stage) {
    case "completed":
      return `${mainPlayer || "Player"} Completes ${entities.fee ? "Big Money " : ""}Move to ${club2 || "New Club"}`;
    case "medical":
      return `${mainPlayer || "Player"} Undergoing Medical Ahead of ${club2 || "Club"} Switch`;
    case "agreed":
      return `Deal Agreed: ${mainPlayer || "Player"} Set for ${club2 || "Club"} Move`;
    case "negotiation":
      return `${club2 || "Club"} in Advanced Talks for ${mainPlayer || "Transfer Target"}`;
    case "interest":
      return `${club2 || "Club"} Eyes Move for ${mainPlayer || "Player"}`;
    default:
      return `Transfer Update: ${mainPlayer || "Player"} Linked with ${club2 || "Club"}`;
  }
}

/**
 * Generate narrative hooks for the story
 */
function generateNarrativeHooks(
  entities: ExtractedTransferData,
  playerStats: Map<string, PlayerStats | null>,
  clubContext: Map<string, ClubContext | null>,
  mainPlayer?: string,
  clubs: string[] = [],
): string[] {
  const hooks: string[] = [];

  // Player performance hook
  if (mainPlayer) {
    const stats = playerStats.get(mainPlayer);
    if (stats?.currentSeason?.goals && stats.currentSeason.goals > 15) {
      hooks.push(
        `Prolific scorer with ${stats.currentSeason.goals} goals this season`,
      );
    }
    if (stats?.player.age && stats.player.age < 23) {
      hooks.push(`Young talent at just ${stats.player.age} years old`);
    }
  }

  // Club context hooks
  for (const clubName of clubs) {
    const context = clubContext.get(clubName);
    if (context?.needs?.positions?.length && context.needs.positions.length > 0) {
      hooks.push(
        `${clubName} desperately needs reinforcement in ${context.needs.positions[0]}`,
      );
    }
    if (context?.recentForm === "poor") {
      hooks.push(`${clubName} looking to reverse poor form with new signing`);
    }
  }

  // Transfer fee hooks
  if (entities.fee) {
    if (entities.fee.amount > 100000000) {
      hooks.push("Blockbuster fee could break club transfer record");
    } else if (entities.fee.amount < 20000000) {
      hooks.push("Bargain deal in today's inflated market");
    }
  }

  // Competition hooks
  if (clubs.length > 2) {
    hooks.push("Multiple clubs battling for signature");
  }

  // Deal type hooks
  if (entities.dealType === "loan") {
    hooks.push("Loan move could benefit all parties");
  } else if (entities.dealType === "release") {
    hooks.push("Release clause could be triggered");
  }

  return hooks;
}

/**
 * Generate rich context paragraph for a transfer
 */
export function generateRichContext(enrichedTweet: EnrichedTweet): string {
  const { entities, enrichment, storyElements } = enrichedTweet;
  const parts: string[] = [];

  // Main transfer narrative
  if (storyElements.mainPlayer && storyElements.mainClubs.length > 0) {
    const playerStats = enrichment.players.get(storyElements.mainPlayer);
    const toClub = enrichment.clubs.get(
      storyElements.mainClubs[1] || storyElements.mainClubs[0],
    );

    if (playerStats) {
      parts.push(
        `${storyElements.mainPlayer}, the ${playerStats.player.age}-year-old ${playerStats.player.nationality} ${playerStats.player.position}, has been in ${getFormDescription(playerStats.currentSeason)} form this season with ${playerStats.currentSeason.goals} goals and ${playerStats.currentSeason.assists} assists in ${playerStats.currentSeason.appearances} appearances.`,
      );
    }

    if (toClub) {
      parts.push(
        `${toClub.name} currently sits ${toClub.leaguePosition} in the ${toClub.league} and has ${toClub.squadInfo.size} players, with a particular need for ${toClub.needs.positions[0] || "reinforcements"}.`,
      );
    }
  }

  // Transfer context
  if (enrichment.transferContext) {
    const { marketTrend, similarTransfers } = enrichment.transferContext;
    if (marketTrend.averageFee && entities.fee) {
      const comparison = entities.fee.amount / marketTrend.averageFee;
      if (comparison > 1.5) {
        parts.push(
          "This fee would be significantly above market average for similar players.",
        );
      } else if (comparison < 0.7) {
        parts.push(
          "The proposed fee represents good value compared to recent similar deals.",
        );
      }
    }
  }

  return parts.join(" ");
}

/**
 * Get form description based on stats
 */
function getFormDescription(season: PlayerStats["currentSeason"]): string {
  const goalsPerGame = season.goals / Math.max(season.appearances, 1);

  if (goalsPerGame > 0.8) return "sensational";
  if (goalsPerGame > 0.5) return "excellent";
  if (goalsPerGame > 0.3) return "good";
  if (goalsPerGame > 0.1) return "decent";
  return "modest";
}
