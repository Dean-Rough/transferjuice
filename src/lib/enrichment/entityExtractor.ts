/**
 * Entity Extraction Service
 * Identifies players, clubs, and other entities from transfer tweets
 */

import { logger } from "@/lib/logger";

export interface ExtractedEntity {
  type: "player" | "club" | "agent" | "manager" | "competition";
  name: string;
  confidence: number;
  context: string;
  aliases?: string[];
}

export interface ExtractedTransferData {
  players: ExtractedEntity[];
  clubs: ExtractedEntity[];
  fee?: {
    amount: number;
    currency: string;
    type: "fixed" | "with-addons" | "loan-fee";
  };
  dealType: "transfer" | "loan" | "contract-extension" | "release";
  stage:
    | "rumor"
    | "interest"
    | "negotiation"
    | "agreed"
    | "medical"
    | "completed";
  entities: ExtractedEntity[];
}

/**
 * Known football entities for better extraction
 */
const KNOWN_CLUBS = [
  // Premier League
  "Arsenal",
  "Chelsea",
  "Liverpool",
  "Manchester United",
  "Man United",
  "United",
  "Manchester City",
  "Man City",
  "City",
  "Tottenham",
  "Spurs",
  "Newcastle",
  "Brighton",
  "Aston Villa",
  "Villa",
  "West Ham",
  "Fulham",
  "Brentford",
  "Crystal Palace",
  "Wolves",
  "Bournemouth",
  "Nottingham Forest",
  "Everton",
  "Leicester",
  "Leeds",
  "Southampton",
  "Burnley",
  "Sheffield United",
  "Luton",

  // La Liga
  "Real Madrid",
  "Madrid",
  "Barcelona",
  "Barca",
  "Atletico Madrid",
  "Atletico",
  "Sevilla",
  "Real Sociedad",
  "Sociedad",
  "Villarreal",
  "Real Betis",
  "Betis",
  "Athletic Bilbao",
  "Athletic",
  "Valencia",
  "Girona",
  "Getafe",
  "Celta Vigo",

  // Serie A
  "Juventus",
  "Juve",
  "Inter Milan",
  "Inter",
  "AC Milan",
  "Milan",
  "Napoli",
  "Roma",
  "Lazio",
  "Atalanta",
  "Fiorentina",
  "Bologna",
  "Torino",
  "Udinese",

  // Bundesliga
  "Bayern Munich",
  "Bayern",
  "Borussia Dortmund",
  "Dortmund",
  "BVB",
  "RB Leipzig",
  "Leipzig",
  "Bayer Leverkusen",
  "Leverkusen",
  "Eintracht Frankfurt",
  "Frankfurt",
  "Wolfsburg",
  "Borussia Monchengladbach",
  "Gladbach",
  "Freiburg",

  // Ligue 1
  "PSG",
  "Paris Saint-Germain",
  "Paris",
  "Monaco",
  "Marseille",
  "Lyon",
  "Lille",
  "Nice",
  "Lens",
  "Rennes",
  "Toulouse",
  "Strasbourg",
  "Reims",

  // Other Major Clubs
  "Ajax",
  "PSV",
  "Feyenoord",
  "Benfica",
  "Porto",
  "Sporting CP",
  "Sporting",
  "Celtic",
  "Rangers",
  "Galatasaray",
  "Fenerbahce",
  "Besiktas",
  "River Plate",
  "Boca Juniors",
  "Flamengo",
  "Palmeiras",
  "Santos",
  "Al-Nassr",
  "Al-Hilal",
  "Al-Ittihad",
  "Inter Miami",
];

const PLAYER_PATTERNS = [
  /([A-Z][a-z]+ [A-Z][a-z]+)(?= (?:to|from|has|will|could|set|ready|close))/g,
  /(?:for|sign|signing|target|want|bid) ([A-Z][a-z]+ [A-Z][a-z]+)/g,
  /([A-Z][a-z]+ [A-Z][a-z]+) (?:deal|move|transfer|medical|agreement)/g,
  /([A-Z][a-z]+) (?:to|from|has|will|could|set|ready|close)/g,
];

const FEE_PATTERNS = [
  /[£€\$](\d+(?:\.\d+)?)[mMkK](?:illion)?/g,
  /(\d+(?:\.\d+)?)\s*(?:million|m)\s*(?:euros?|pounds?|dollars?)/gi,
];

const STAGE_KEYWORDS = {
  rumor: ["linked", "interested", "monitoring", "considering", "eyeing"],
  interest: ["want", "target", "pursue", "keen", "interested in"],
  negotiation: ["talks", "negotiations", "discussing", "negotiating", "bid"],
  agreed: ["agreed", "deal done", "terms agreed", "fee agreed", "accepted"],
  medical: [
    "medical",
    "undergoing medical",
    "medical booked",
    "medical scheduled",
  ],
  completed: [
    "completed",
    "signed",
    "done deal",
    "official",
    "confirmed",
    "unveiled",
  ],
};

/**
 * Extract entities from tweet content
 */
export function extractEntities(content: string): ExtractedTransferData {
  const normalizedContent = normalizeContent(content);

  const players = extractPlayers(normalizedContent);
  const clubs = extractClubs(normalizedContent);
  const fee = extractFee(normalizedContent);
  const dealType = detectDealType(normalizedContent);
  const stage = detectStage(normalizedContent);

  // Combine all entities
  const allEntities = [...players, ...clubs];

  return {
    players,
    clubs,
    fee,
    dealType,
    stage,
    entities: allEntities,
  };
}

/**
 * Normalize content for better extraction
 */
function normalizeContent(content: string): string {
  return content
    .replace(/[^\w\s£€$]/g, " ") // Keep currency symbols
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract player names from content
 */
function extractPlayers(content: string): ExtractedEntity[] {
  const players: ExtractedEntity[] = [];
  const foundNames = new Set<string>();

  for (const pattern of PLAYER_PATTERNS) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const name = match[1]?.trim();
      if (name && !foundNames.has(name) && isLikelyPlayerName(name)) {
        foundNames.add(name);
        players.push({
          type: "player",
          name,
          confidence: calculateConfidence(name, content),
          context: extractContext(name, content),
        });
      }
    }
  }

  return players;
}

/**
 * Extract club names from content
 */
function extractClubs(content: string): ExtractedEntity[] {
  const clubs: ExtractedEntity[] = [];
  const foundClubs = new Set<string>();

  for (const knownClub of KNOWN_CLUBS) {
    const regex = new RegExp(`\\b${escapeRegex(knownClub)}\\b`, "gi");
    if (regex.test(content) && !foundClubs.has(knownClub)) {
      foundClubs.add(knownClub);
      clubs.push({
        type: "club",
        name: knownClub,
        confidence: 1.0,
        context: extractContext(knownClub, content),
        aliases: getClubAliases(knownClub),
      });
    }
  }

  return clubs;
}

/**
 * Extract transfer fee from content
 */
function extractFee(content: string): ExtractedTransferData["fee"] | undefined {
  for (const pattern of FEE_PATTERNS) {
    const match = pattern.exec(content);
    if (match) {
      const amount = parseFloat(match[1]);
      const multiplier = match[0].toLowerCase().includes("k") ? 1000 : 1000000;
      const currency = match[0].includes("€")
        ? "EUR"
        : match[0].includes("$")
          ? "USD"
          : "GBP";

      return {
        amount: amount * multiplier,
        currency,
        type: content.toLowerCase().includes("addon") ? "with-addons" : "fixed",
      };
    }
  }

  return undefined;
}

/**
 * Detect the type of deal
 */
function detectDealType(content: string): ExtractedTransferData["dealType"] {
  const lower = content.toLowerCase();

  if (lower.includes("loan")) return "loan";
  if (lower.includes("contract extension") || lower.includes("new deal"))
    return "contract-extension";
  if (lower.includes("release") || lower.includes("free agent"))
    return "release";

  return "transfer";
}

/**
 * Detect the stage of the transfer
 */
function detectStage(content: string): ExtractedTransferData["stage"] {
  const lower = content.toLowerCase();

  for (const [stage, keywords] of Object.entries(STAGE_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return stage as ExtractedTransferData["stage"];
    }
  }

  return "rumor";
}

/**
 * Check if a name is likely to be a player name
 */
function isLikelyPlayerName(name: string): boolean {
  // Basic checks to filter out non-player names
  const words = name.split(" ");

  // Must have at least 2 words (first and last name)
  if (words.length < 2) return false;

  // Each word should start with capital letter
  if (!words.every((word) => /^[A-Z]/.test(word))) return false;

  // Avoid common non-player phrases
  const nonPlayerPhrases = [
    "Transfer News",
    "Breaking News",
    "Sky Sports",
    "Here We Go",
  ];
  if (nonPlayerPhrases.includes(name)) return false;

  return true;
}

/**
 * Calculate confidence score for extracted entity
 */
function calculateConfidence(name: string, content: string): number {
  let confidence = 0.5;

  // Boost confidence if name appears multiple times
  const occurrences = (content.match(new RegExp(escapeRegex(name), "gi")) || [])
    .length;
  confidence += Math.min(occurrences * 0.1, 0.3);

  // Boost confidence if near transfer keywords
  const transferKeywords = ["transfer", "deal", "sign", "move", "join"];
  const nearKeyword = transferKeywords.some((keyword) => {
    const regex = new RegExp(
      `${escapeRegex(name)}.{0,20}${keyword}|${keyword}.{0,20}${escapeRegex(name)}`,
      "gi",
    );
    return regex.test(content);
  });
  if (nearKeyword) confidence += 0.2;

  return Math.min(confidence, 1.0);
}

/**
 * Extract context around an entity
 */
function extractContext(
  entity: string,
  content: string,
  contextLength: number = 50,
): string {
  const index = content.toLowerCase().indexOf(entity.toLowerCase());
  if (index === -1) return "";

  const start = Math.max(0, index - contextLength);
  const end = Math.min(content.length, index + entity.length + contextLength);

  return content.substring(start, end).trim();
}

/**
 * Get known aliases for clubs
 */
function getClubAliases(clubName: string): string[] {
  const aliases: Record<string, string[]> = {
    "Manchester United": ["Man United", "United", "MUFC"],
    "Manchester City": ["Man City", "City", "MCFC"],
    Tottenham: ["Spurs", "THFC"],
    Arsenal: ["Gunners", "AFC"],
    Chelsea: ["Blues", "CFC"],
    Liverpool: ["Reds", "LFC"],
    "Real Madrid": ["Madrid", "Los Blancos"],
    Barcelona: ["Barca", "Blaugrana"],
    "Bayern Munich": ["Bayern", "FCB"],
    "Paris Saint-Germain": ["PSG", "Paris"],
  };

  return aliases[clubName] || [];
}

/**
 * Escape regex special characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Batch extract entities from multiple tweets
 */
export async function batchExtractEntities(
  tweets: Array<{ id: string; content: string }>,
): Promise<Map<string, ExtractedTransferData>> {
  const results = new Map<string, ExtractedTransferData>();

  for (const tweet of tweets) {
    try {
      const extracted = extractEntities(tweet.content);
      results.set(tweet.id, extracted);
    } catch (error) {
      logger.error(`Failed to extract entities from tweet ${tweet.id}`, error);
    }
  }

  return results;
}
