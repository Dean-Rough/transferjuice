/**
 * Transfer Tweet Classifier
 * AI-powered classification of tweet transfer relevance with Terry-style insights
 */

// Terry style functionality removed - handled by AI pipeline
import type { TransferType } from "@prisma/client";

// Transfer keywords and patterns
const TRANSFER_KEYWORDS = {
  // Definitive transfer language
  confirmed: [
    "signed",
    "signs",
    "completed",
    "official",
    "announced",
    "confirmed",
    "done deal",
    "here we go",
    "welcome to",
    "joins",
    "joined",
  ],

  // Medical/final stages
  medical: [
    "medical",
    "medicals",
    "undergo medical",
    "passed medical",
    "medical scheduled",
    "medical tomorrow",
    "medical today",
  ],

  // Advanced negotiations
  advanced: [
    "advanced talks",
    "advanced negotiations",
    "close to signing",
    "final details",
    "finalizing",
    "agreement reached",
    "verbal agreement",
    "personal terms agreed",
    "fee agreed",
  ],

  // Early stage talks
  talks: [
    "interested in",
    "monitoring",
    "talks ongoing",
    "negotiations",
    "in talks",
    "discussing",
    "considering",
    "exploring",
    "approached",
    "contact made",
  ],

  // Rumours and speculation
  rumour: [
    "could be",
    "might be",
    "potentially",
    "reportedly",
    "rumoured",
    "according to",
    "sources suggest",
    "understood to be",
    "believed to be",
    "speculation",
  ],

  // Contract and financial terms
  financial: [
    "fee",
    "transfer fee",
    "price tag",
    "valuation",
    "bid",
    "offer",
    "contract",
    "wage",
    "salary",
    "bonus",
    "release clause",
    "buy-out clause",
    "add-ons",
  ],

  // Transfer window specific
  window: [
    "january window",
    "summer window",
    "transfer window",
    "deadline day",
    "window closes",
    "final hours",
  ],
};

// Football clubs and common abbreviations
const FOOTBALL_CLUBS = [
  // Premier League
  "Arsenal",
  "Chelsea",
  "Liverpool",
  "Manchester United",
  "Manchester City",
  "Tottenham",
  "Newcastle",
  "Brighton",
  "Aston Villa",
  "West Ham",
  "Crystal Palace",
  "Fulham",
  "Brentford",
  "Wolves",
  "Everton",
  "Nottingham Forest",
  "Leeds United",
  "Leicester",
  "Southampton",
  "Bournemouth",

  // Common abbreviations
  "AFC",
  "CFC",
  "LFC",
  "MUFC",
  "MCFC",
  "THFC",
  "NUFC",
  "WHUFC",

  // European giants
  "Real Madrid",
  "Barcelona",
  "Bayern Munich",
  "PSG",
  "Juventus",
  "AC Milan",
  "Inter Milan",
  "Atletico Madrid",
  "Borussia Dortmund",

  // Championship and others
  "Leeds",
  "Norwich",
  "Watford",
  "Sheffield United",
  "Burnley",
];

// Position-related keywords
const POSITION_KEYWORDS = [
  "striker",
  "forward",
  "winger",
  "midfielder",
  "defender",
  "goalkeeper",
  "centre-back",
  "full-back",
  "left-back",
  "right-back",
  "centre-forward",
  "attacking midfielder",
  "defensive midfielder",
  "central midfielder",
  "wing-back",
  "sweeper",
  "playmaker",
];

interface ClassificationInput {
  text: string;
  contextAnnotations?: Array<{
    domain: { id: string; name: string };
    entity: { id: string; name: string };
  }>;
  authorTier: "tier1" | "tier2" | "tier3";
  authorSpecialties: string[];
}

interface ClassificationResult {
  isTransferRelated: boolean;
  confidence: number;
  transferType?: TransferType;
  keywords: string[];
  reasonCode: string;
  explanation: string;
}

interface EntityExtractionResult {
  players: string[];
  clubs: string[];
  positions: string[];
  agents: string[];
  fees: string[];
}

class TransferClassifier {
  /**
   * Classify a tweet for transfer relevance
   */
  async classifyTweet(
    input: ClassificationInput,
  ): Promise<ClassificationResult> {
    const text = input.text.toLowerCase();
    const keywords: string[] = [];
    let confidence = 0;
    let transferType: TransferType | undefined;
    let reasonCode = "";
    let explanation = "";

    // Check for transfer keywords
    const keywordMatches = this.findTransferKeywords(text);
    keywords.push(...keywordMatches.keywords);
    confidence += keywordMatches.confidence;

    // Check for club mentions
    const clubMatches = this.findClubMentions(text);
    if (clubMatches.count > 1) {
      confidence += 0.3; // Multiple clubs suggest transfer
      keywords.push("multiple_clubs");
    } else if (clubMatches.count === 1) {
      confidence += 0.1;
    }

    // Check for position mentions
    const positionMatches = this.findPositionMentions(text);
    if (positionMatches.length > 0) {
      confidence += 0.15;
      keywords.push(...positionMatches);
    }

    // Check for financial mentions
    const financialMatches = this.findFinancialMentions(text);
    if (financialMatches.length > 0) {
      confidence += 0.2;
      keywords.push(...financialMatches);
    }

    // Author tier bonus
    switch (input.authorTier) {
      case "tier1":
        confidence += 0.1;
        break;
      case "tier2":
        confidence += 0.05;
        break;
      case "tier3":
        break; // No bonus
    }

    // Determine transfer type
    transferType = this.determineTransferType(keywordMatches.type, confidence);

    // Generate explanation
    if (confidence >= 0.7) {
      reasonCode = "high_confidence";
      explanation = `Strong transfer indicators detected: ${keywords.slice(0, 3).join(", ")}`;
    } else if (confidence >= 0.4) {
      reasonCode = "medium_confidence";
      explanation = `Moderate transfer signals: ${keywords.slice(0, 2).join(", ")}`;
    } else {
      reasonCode = "low_confidence";
      explanation = "Minimal transfer relevance detected";
    }

    return {
      isTransferRelated: confidence >= 0.4,
      confidence: Math.min(confidence, 1.0),
      transferType,
      keywords: [...new Set(keywords)], // Remove duplicates
      reasonCode,
      explanation,
    };
  }

  /**
   * Extract entities (players, clubs, etc.) from tweet text
   */
  async extractEntities(text: string): Promise<EntityExtractionResult> {
    const result: EntityExtractionResult = {
      players: [],
      clubs: [],
      positions: [],
      agents: [],
      fees: [],
    };

    // Extract clubs
    result.clubs = this.extractClubs(text);

    // Extract positions
    result.positions = this.extractPositions(text);

    // Extract fees (£ amounts, etc.)
    result.fees = this.extractFees(text);

    // Extract potential player names (capitalized words not in club list)
    result.players = this.extractPotentialPlayerNames(text);

    // Extract agents (common agent indicators)
    result.agents = this.extractAgents(text);

    return result;
  }

  /**
   * Find transfer-related keywords in text
   */
  private findTransferKeywords(text: string): {
    keywords: string[];
    confidence: number;
    type: string;
  } {
    const keywords: string[] = [];
    let confidence = 0;
    let type = "rumour";

    // Check each category
    for (const [category, categoryKeywords] of Object.entries(
      TRANSFER_KEYWORDS,
    )) {
      for (const keyword of categoryKeywords) {
        if (text.includes(keyword)) {
          keywords.push(keyword);

          // Assign confidence and type based on category
          switch (category) {
            case "confirmed":
              confidence += 0.4;
              type = "confirmed";
              break;
            case "medical":
              confidence += 0.35;
              type = "medical";
              break;
            case "advanced":
              confidence += 0.25;
              type = "advanced";
              break;
            case "talks":
              confidence += 0.15;
              type = "talks";
              break;
            case "rumour":
              confidence += 0.1;
              type = "rumour";
              break;
            case "financial":
              confidence += 0.2;
              break;
            case "window":
              confidence += 0.1;
              break;
          }
        }
      }
    }

    return { keywords, confidence, type };
  }

  /**
   * Find club mentions in text
   */
  private findClubMentions(text: string): { count: number; clubs: string[] } {
    const clubs: string[] = [];

    for (const club of FOOTBALL_CLUBS) {
      if (text.toLowerCase().includes(club.toLowerCase())) {
        clubs.push(club);
      }
    }

    return { count: clubs.length, clubs };
  }

  /**
   * Find position mentions in text
   */
  private findPositionMentions(text: string): string[] {
    const positions: string[] = [];

    for (const position of POSITION_KEYWORDS) {
      if (text.includes(position)) {
        positions.push(position);
      }
    }

    return positions;
  }

  /**
   * Find financial mentions in text
   */
  private findFinancialMentions(text: string): string[] {
    const financial: string[] = [];

    // Look for currency symbols and amounts
    const currencyRegex = /[£$€]\d+[kmb]?/gi;
    const matches = text.match(currencyRegex);
    if (matches) {
      financial.push(...matches);
    }

    // Look for financial keywords
    for (const keyword of TRANSFER_KEYWORDS.financial) {
      if (text.includes(keyword)) {
        financial.push(keyword);
      }
    }

    return financial;
  }

  /**
   * Determine transfer type based on keywords
   */
  private determineTransferType(
    keywordType: string,
    confidence: number,
  ): TransferType | undefined {
    if (confidence < 0.4) return undefined;

    switch (keywordType) {
      case "confirmed":
        return "CONFIRMED";
      case "medical":
        return "MEDICAL";
      case "advanced":
        return "PERSONAL_TERMS";
      case "talks":
        return "BID";
      case "rumour":
      default:
        return "RUMOUR";
    }
  }

  /**
   * Extract club names from text
   */
  private extractClubs(text: string): string[] {
    const clubs: string[] = [];

    for (const club of FOOTBALL_CLUBS) {
      if (text.toLowerCase().includes(club.toLowerCase())) {
        clubs.push(club);
      }
    }

    return clubs;
  }

  /**
   * Extract position mentions from text
   */
  private extractPositions(text: string): string[] {
    const positions: string[] = [];

    for (const position of POSITION_KEYWORDS) {
      if (text.toLowerCase().includes(position)) {
        positions.push(position);
      }
    }

    return positions;
  }

  /**
   * Extract fee amounts from text
   */
  private extractFees(text: string): string[] {
    const fees: string[] = [];

    // Match currency amounts
    const currencyRegex = /[£$€]\d+(?:\.\d+)?[kmb]?/gi;
    const matches = text.match(currencyRegex);
    if (matches) {
      fees.push(...matches);
    }

    // Match written amounts
    const writtenAmounts = /\d+(?:\.\d+)?\s*(?:million|billion|thousand)/gi;
    const writtenMatches = text.match(writtenAmounts);
    if (writtenMatches) {
      fees.push(...writtenMatches);
    }

    return fees;
  }

  /**
   * Extract potential player names (very basic implementation)
   */
  private extractPotentialPlayerNames(text: string): string[] {
    const players: string[] = [];

    // Look for capitalized words that might be names
    // This is a simplified approach - in practice, you'd use NER or a player database
    const nameRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    const matches = text.match(nameRegex);

    if (matches) {
      for (const match of matches) {
        // Filter out obvious non-names (clubs, etc.)
        if (
          !FOOTBALL_CLUBS.some((club) =>
            club.toLowerCase().includes(match.toLowerCase()),
          )
        ) {
          players.push(match);
        }
      }
    }

    return players;
  }

  /**
   * Extract agent mentions
   */
  private extractAgents(text: string): string[] {
    const agents: string[] = [];

    // Look for agent indicators
    const agentKeywords = ["agent", "representative", "intermediary", "broker"];

    for (const keyword of agentKeywords) {
      if (text.toLowerCase().includes(keyword)) {
        agents.push(keyword);
      }
    }

    return agents;
  }

  /**
   * Get classification stats for debugging
   */
  getClassificationStats() {
    return {
      totalKeywords: Object.values(TRANSFER_KEYWORDS).flat().length,
      totalClubs: FOOTBALL_CLUBS.length,
      totalPositions: POSITION_KEYWORDS.length,
    };
  }
}

export const transferKeywordClassifier = new TransferClassifier();
