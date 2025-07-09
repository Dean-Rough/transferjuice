import { RSSItem } from "./types";

export interface ExtractedFacts {
  fee?: string;
  wages?: string;
  payCut?: string;
  contractLength?: string;
  contractUntil?: string;
  clubs: string[];
  isConfirmed: boolean;
  isHereWeGo: boolean;
  isNearConfirmed: boolean;
  isInterest: boolean;
  isRejected: boolean;
  age?: string;
  position?: string;
  currentGoals?: string;
  source: {
    name: string;
    url: string;
  };
}

export interface AggregatedStory {
  player: string;
  items: RSSItem[];
  facts: ExtractedFacts[];
  primaryClubs: string[];
  storyType: "confirmed" | "negotiating" | "interest" | "contract" | "rejected";
  importance: number; // 1-10 score
}

// Extract player name more intelligently
function extractPlayerName(text: string, authorName?: string): string | null {
  // Skip injury/medical news that isn't transfer related
  if (
    /suffered|injury|injured|fractured|surgery|hospital|medical emergency|passed away|died/i.test(
      text,
    )
  ) {
    return null;
  }

  // Remove emojis and special characters first (but keep accented characters)
  const cleanText = text
    .replace(/[🚨🔴⚪️💣❤️🤍🇸🇪🇧🇷🇫🇷🇩🇪🇮🇹🇪🇸🏴󐁧󐁢󐁥󐁮󐁧󐁿]+/g, "")
    .trim();

  // Common club names to filter out
  const clubNames = [
    "Crystal Palace",
    "Manchester United",
    "Manchester City",
    "Real Madrid",
    "Sporting Lisbon",
    "Aston Villa",
    "West Ham",
    "Newcastle United",
    "Nottingham Forest",
    "Leicester City",
    "Bayern Munich",
    "Atletico Madrid",
    "Paris Saint",
    "AC Milan",
    "Inter Milan",
  ];

  // Enhanced patterns for player names including special characters
  const patterns = [
    // Pattern for names with special characters (Gyökeres, Durán, etc)
    /(?:EXCL:|Exclusive:|BREAKING:)?\s*([A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+(?:\s+[A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+)+)(?:\s+(?:to|joins|signs|agrees|rejects|extends|commits))/,

    // Pattern for "Player has agreed/accepted/etc"
    /([A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+(?:\s+[A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+)+)(?:\s+has\s+(?:agreed|accepted|rejected|signed))/,

    // Pattern for "Player's future/contract/deal"
    /([A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+(?:\s+[A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+)+)(?:'s\s+(?:future|contract|deal))/,

    // Pattern for names at start of sentence
    /^([A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+(?:\s+[A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+)+)\s+(?:will|could|might|set|ready)/,
  ];

  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // Filter out author name if it matches
      if (authorName && name === authorName) continue;
      // Filter out club names
      if (clubNames.some((club) => name.includes(club))) continue;
      return name;
    }
  }

  // Fallback to general name pattern with special character support
  const generalMatch = cleanText.match(
    /\b([A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+\s+[A-ZÁÀÂÄÃÅĄČĆĘÈÉÊËĖĮÌÍÎÏŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑÇČŠŽ][a-záàâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšž]+)\b/,
  );
  if (
    generalMatch &&
    generalMatch[1] !== authorName &&
    !clubNames.some((club) => generalMatch[1].includes(club))
  ) {
    return generalMatch[1];
  }

  return null;
}

// Extract facts from a single RSS item
export function extractFacts(item: RSSItem): ExtractedFacts {
  const text = item.content_text + " " + item.title;

  // Look for transfer direction indicators
  const leavesMatch = text.match(
    /leaves\s+([A-Z][a-zA-Z\s]+?)\s+and\s+joins\s+([A-Z][a-zA-Z\s]+)/,
  );
  const fromToMatch = text.match(
    /from\s+([A-Z][a-zA-Z\s]+?)\s+to\s+([A-Z][a-zA-Z\s]+)/,
  );

  let fromClub: string | undefined;
  let toClub: string | undefined;

  if (leavesMatch) {
    fromClub = leavesMatch[1].trim();
    toClub = leavesMatch[2].trim();
  } else if (fromToMatch) {
    fromClub = fromToMatch[1].trim();
    toClub = fromToMatch[2].trim();
  }

  // Fee extraction - handle various formats WITH CONTEXT
  let fee: string | undefined;

  // Check if this is about wages/pay cuts first
  const isWageStory =
    /pay cut|wage|salary|earning|per week|per year|weekly|annual/i.test(text);

  if (!isWageStory) {
    // Enhanced fee patterns to catch more formats
    const feePatterns = [
      // Standard patterns with fee keywords
      /(?:fee|deal worth|valued at|price tag).*?[€£$]([\d.]+)m(?:illion)?/gi,
      /[€£$]([\d.]+)m(?:illion)?\s+(?:fee|transfer|deal|bid|offer)/gi,
      /(?:bid|offer) of [€£$]([\d.]+)m/gi,

      // New patterns for amounts without "fee" keyword
      /[€£$]([\d.]+)m(?:illion)?\s+(?:move|transfer|switch)/gi,
      /(?:worth|around|approximately)\s+[€£$]([\d.]+)m(?:illion)?/gi,
      /[€£$]([\d.]+)m(?:illion)?\s+(?:price|valuation)/gi,

      // Patterns for "X million euros/pounds" format
      /([\d.]+)\s+million\s+(?:euros?|pounds?|dollars?)/gi,

      // Simple currency amount at start of sentence or after colon
      /(?:^|:\s*)[€£$]([\d.]+)m(?:illion)?/gi,

      // Format like "€85m" or "£70m" standalone
      /\b[€£$]([\d.]+)m\b/gi,
    ];

    for (const pattern of feePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        // Extract the numeric value and currency
        for (const match of matches) {
          const currencyMatch = match.match(/[€£$]/);
          const valueMatch = match.match(/([\d.]+)/);
          if (valueMatch) {
            const currency = currencyMatch ? currencyMatch[0] : "£";
            fee = `${currency}${valueMatch[1]}m`;
            break;
          }
        }
        if (fee) break;
      }
    }
  }

  // Extract wage/pay cut information
  let wages: string | undefined;
  let payCut: string | undefined;

  if (isWageStory) {
    // Pay cut patterns
    const payCutMatch = text.match(
      /(?:pay cut|salary cut|wage cut).*?[€£$]([\d.]+)m(?:illion)?/i,
    );
    if (payCutMatch) {
      payCut = payCutMatch[0].match(/[€£$][\d.]+m(?:illion)?/i)?.[0];
    }

    // Wage patterns
    const wageMatch = text.match(
      /[€£$]([\d.]+)(?:k|m)?(?:\s+)?(?:per week|pw|weekly|per year|annually)/i,
    );
    if (wageMatch && !payCutMatch) {
      wages = wageMatch[0];
    }
  }

  // Contract details
  const contractUntilMatch = text.match(/until (\d{4})/i);
  const contractLengthMatch = text.match(/(\d+)[-\s]?year?/i);

  // Clubs extraction - be more comprehensive with word boundaries
  const clubPattern =
    /\b(Arsenal|Chelsea|Liverpool|Manchester United|Manchester City|Tottenham|Newcastle|West Ham|Everton|Leicester|Leeds|Aston Villa|Southampton|Brighton|Burnley|Norwich|Watford|Brentford|Crystal Palace|Fulham|Bournemouth|Nottingham Forest|Bayern Munich|Bayern|Borussia Dortmund|RB Leipzig|Bayer Leverkusen|Real Madrid|Barcelona|Atletico Madrid|Sevilla|Valencia|Villarreal|PSG|Paris Saint-Germain|Monaco|Lyon|Marseille|Juventus|Inter Milan|Inter|AC Milan|Milan|Roma|Napoli|Lazio|Atalanta|Sporting|Sporting CP|Porto|Benfica|Ajax|PSV|Feyenoord|Fenerbahçe|Fenerbahce|Al Nassr|Al-Nassr|Al Hilal|Al-Hilal|Galatasaray|Besiktas|Mainz)\b/gi;

  const clubMatches = text.match(clubPattern) || [];
  const clubs = [...new Set(clubMatches)];

  // Story type detection
  const isConfirmed =
    /here we go(?!\s+can\s+be)|confirmed|done deal|completed|official|deal done|medical done|reached TOTAL agreement/i.test(
      text,
    );
  const isHereWeGo = /here we go(?!\s+can\s+be)/i.test(text); // Special flag for Romano's signature phrase (not "can be soon")
  const isNearConfirmed =
    /getting closer|can be very soon|TOTAL agreement/i.test(text);
  const isInterest =
    /interested|monitoring|tracking|considering|eyeing|targeting/i.test(text);
  const isRejected = /rejected|turned down|refused|snubbed/i.test(text);

  // Additional player info
  const ageMatch = text.match(/(\d{2})[-\s]?year[-\s]?old/i);
  const goalsMatch = text.match(
    /(\d+)\s+goals?\s+(?:this\s+)?(?:season|campaign)/i,
  );

  // Position detection
  let position: string | undefined;
  if (/striker|forward|CF|ST/i.test(text)) position = "striker";
  else if (/winger|LW|RW/i.test(text)) position = "winger";
  else if (/midfielder|CM|CAM|CDM/i.test(text)) position = "midfielder";
  else if (/defender|CB|LB|RB/i.test(text)) position = "defender";
  else if (/goalkeeper|GK/i.test(text)) position = "goalkeeper";

  return {
    fee,
    wages,
    payCut,
    contractLength: contractLengthMatch?.[1]
      ? `${contractLengthMatch[1]} years`
      : undefined,
    contractUntil: contractUntilMatch?.[1],
    clubs,
    isConfirmed,
    isHereWeGo,
    isNearConfirmed,
    isInterest,
    isRejected,
    age: ageMatch?.[1],
    position,
    currentGoals: goalsMatch?.[0],
    source: {
      name: item.authors[0]?.name || "Unknown",
      url: item.url,
    },
  };
}

// Determine story type from aggregated facts
function determineStoryType(
  facts: ExtractedFacts[],
): AggregatedStory["storyType"] {
  // Check for pay cuts or wage adjustments first
  if (facts.some((f) => f.payCut)) return "contract";

  // Check for confirmed deals
  if (facts.some((f) => f.isConfirmed)) {
    // But verify it's actually confirmed, not just using the word
    const confirmedCount = facts.filter((f) => f.isConfirmed).length;
    const totalCount = facts.length;
    // If most sources say confirmed, it's confirmed
    if (confirmedCount / totalCount >= 0.5) return "confirmed";
  }

  // Check for rejections
  if (facts.some((f) => f.isRejected)) return "rejected";

  // Check for contract extensions
  if (facts.every((f) => (f.contractLength || f.contractUntil) && !f.fee))
    return "contract";

  // Check for active negotiations - "getting closer", "TOTAL agreement", etc
  if (
    facts.some((f) => f.isNearConfirmed) ||
    facts.some((f) => f.fee && !f.isConfirmed)
  )
    return "negotiating";

  // Default to interest
  return "interest";
}

// Calculate importance score
function calculateImportance(story: Partial<AggregatedStory>): number {
  let score = 0;

  // Story type weighting
  if (story.storyType === "confirmed") score += 4;
  else if (story.storyType === "negotiating") score += 3;
  else if (story.storyType === "contract") score += 2;
  else if (story.storyType === "rejected") score += 2;
  else score += 1;

  // Multiple sources = more important
  score += Math.min(story.items!.length, 3);

  // Fee-based scoring with higher weight for big transfers
  const fees = story.facts?.map((f) => f.fee).filter(Boolean) || [];
  if (fees.length > 0) {
    // Extract numeric value from fee (e.g., "£70m" -> 70)
    const maxFeeValue = Math.max(
      ...fees.map((fee) => {
        const match = fee?.match(/([\d.]+)/);
        return match ? parseFloat(match[1]) : 0;
      }),
    );

    // Weight based on fee amount
    if (maxFeeValue >= 70)
      score += 4; // Mega transfer (like Gyökeres)
    else if (maxFeeValue >= 50)
      score += 3; // Big transfer
    else if (maxFeeValue >= 30)
      score += 2; // Significant transfer
    else if (maxFeeValue >= 10) score += 1; // Standard transfer
  }

  // "Here we go" bonus - Romano's confirmation is gold
  if (story.facts?.some((f) => f.isHereWeGo)) score += 2;

  // Big clubs involved
  const bigClubs = [
    "Arsenal",
    "Chelsea",
    "Liverpool",
    "Manchester United",
    "Manchester City",
    "Real Madrid",
    "Barcelona",
    "Bayern Munich",
    "PSG",
    "Juventus",
    "Atletico Madrid",
    "Sporting",
    "Sporting CP",
    "Porto",
    "Benfica",
  ];
  const clubCount =
    story.primaryClubs?.filter((club) => bigClubs.includes(club)).length || 0;
  score += clubCount; // +1 per big club involved

  return Math.min(score, 10);
}

// Main aggregation function
export function aggregateStories(items: RSSItem[]): AggregatedStory[] {
  const storyMap = new Map<
    string,
    {
      items: RSSItem[];
      facts: ExtractedFacts[];
    }
  >();

  // Group items by player
  for (const item of items) {
    const playerName = extractPlayerName(
      item.content_text,
      item.authors[0]?.name,
    );
    if (!playerName) continue;

    if (!storyMap.has(playerName)) {
      storyMap.set(playerName, { items: [], facts: [] });
    }

    const story = storyMap.get(playerName)!;
    story.items.push(item);
    story.facts.push(extractFacts(item));
  }

  // Convert to AggregatedStory format
  const aggregatedStories: AggregatedStory[] = [];

  for (const [player, data] of storyMap) {
    // Get all unique clubs mentioned
    const allClubs = new Set<string>();
    data.facts.forEach((f) => f.clubs.forEach((c) => allClubs.add(c)));

    // Determine primary clubs (mentioned most frequently)
    const clubCounts = new Map<string, number>();
    data.facts.forEach((f) => {
      f.clubs.forEach((c) => {
        clubCounts.set(c, (clubCounts.get(c) || 0) + 1);
      });
    });

    const primaryClubs = Array.from(clubCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([club]) => club);

    const storyType = determineStoryType(data.facts);

    const story: AggregatedStory = {
      player,
      items: data.items,
      facts: data.facts,
      primaryClubs,
      storyType,
      importance: 0, // Will calculate after
    };

    story.importance = calculateImportance(story);
    aggregatedStories.push(story);
  }

  // Sort by importance and recency
  return aggregatedStories.sort((a, b) => {
    if (a.importance !== b.importance) return b.importance - a.importance;
    return (
      new Date(b.items[0].date_published).getTime() -
      new Date(a.items[0].date_published).getTime()
    );
  });
}

// Helper to compare facts across sources
export function compareFacts(facts: ExtractedFacts[]): {
  agreed: Record<string, any>;
  disputed: Record<string, any[]>;
} {
  const agreed: Record<string, any> = {};
  const disputed: Record<string, any[]> = {};

  // Check fees
  const fees = facts.map((f) => f.fee).filter(Boolean);
  if (fees.length === 1 || new Set(fees).size === 1) {
    agreed.fee = fees[0];
  } else if (fees.length > 1) {
    disputed.fees = fees;
  }

  // Check contract details
  const contractLengths = facts.map((f) => f.contractLength).filter(Boolean);
  if (new Set(contractLengths).size === 1) {
    agreed.contractLength = contractLengths[0];
  } else if (contractLengths.length > 1) {
    disputed.contractLengths = contractLengths;
  }

  // Story status
  if (facts.every((f) => f.isConfirmed)) {
    agreed.status = "confirmed";
  } else if (
    facts.some((f) => f.isConfirmed) &&
    facts.some((f) => !f.isConfirmed)
  ) {
    disputed.status = facts.map((f) => ({
      source: f.source.name,
      confirmed: f.isConfirmed,
    }));
  }

  return { agreed, disputed };
}
