interface PlayerContext {
  recentNews?: string;
  currentSituation?: string;
  relevantStats?: string;
  controversies?: string;
}

// Search for current context about a player
export async function getPlayerContext(
  playerName: string,
): Promise<PlayerContext> {
  const context: PlayerContext = {};

  try {
    // Use our RSS feed first to check recent mentions
    const recentMentions = await searchRecentMentions(playerName);

    // Extract current form/stats from recent tweets
    if (recentMentions) {
      const statsMatch = recentMentions.match(
        /(\d+)\s+goals?\s+(?:this\s+season|in\s+\d+\s+games?)/i,
      );
      if (statsMatch) {
        context.relevantStats = statsMatch[0];
      }

      // Check for injury mentions
      if (/injured|injury|sidelined|fitness/i.test(recentMentions)) {
        context.currentSituation = "dealing with injury concerns";
      }

      // Check for form mentions
      if (/scoring streak|red-hot form|goals in last/i.test(recentMentions)) {
        context.currentSituation = "in excellent form";
      }
    }

    // For sensitive topics, we'd need to be very careful
    // Only mention if directly relevant to transfer situation
    const contextKeywords = {
      availability: ["unavailable", "suspended", "banned"],
      form: ["scored", "goals", "assists", "MOTM", "player of the month"],
      situation: [
        "contract expires",
        "final year",
        "release clause",
        "unsettled",
      ],
    };

    return context;
  } catch (error) {
    console.error(`Failed to get context for ${playerName}:`, error);
    return context;
  }
}

// Search recent RSS items for mentions
async function searchRecentMentions(
  playerName: string,
): Promise<string | null> {
  try {
    // In practice, we'd search through recent RSS items we've collected
    // Looking for mentions of the player in the last week
    const response = await fetch(
      "https://rss.app/feeds/v1.1/_zMqruZvtL6XIMNVY.json",
    );
    const feed = await response.json();

    const recentItems = feed.items
      .filter((item: any) => {
        const text = item.title + " " + item.content_text;
        return text.includes(playerName);
      })
      .slice(0, 5); // Get last 5 mentions

    if (recentItems.length > 0) {
      return recentItems.map((item: any) => item.content_text).join(" ");
    }
  } catch (error) {
    console.error("Failed to search recent mentions:", error);
  }

  return null;
}

// Extract current season stats from news mentions
export function extractSeasonStats(text: string): string | null {
  // Look for patterns like "15 goals this season", "8 assists in 2024/25"
  const statsPatterns = [
    /(\d+)\s+goals?\s+this\s+season/i,
    /(\d+)\s+assists?\s+this\s+season/i,
    /(\d+)\s+goals?\s+in\s+(\d+)\/(\d+)/i,
    /(\d+)\s+appearances?\s+this\s+term/i,
    /scored\s+(\d+)\s+times?/i,
  ];

  for (const pattern of statsPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}

// Get club's current situation
export function getClubContext(clubName: string, text: string): string | null {
  // Extract league position, recent results, manager situation
  const positionMatch = text.match(
    new RegExp(
      `${clubName}.*?(\\d+)(?:st|nd|rd|th)\\s+(?:place|position)`,
      "i",
    ),
  );
  const managerMatch = text.match(
    new RegExp(
      `${clubName}.*?(?:manager|boss|coach)\\s+([A-Z][a-z]+\\s+[A-Z][a-z]+)`,
      "i",
    ),
  );

  if (positionMatch) {
    return `currently ${positionMatch[1]}${getOrdinalSuffix(parseInt(positionMatch[1]))} in the table`;
  }

  return null;
}

function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

// Search for recent controversies or important context
export async function searchRecentContext(
  playerName: string,
): Promise<string | null> {
  // This would integrate with news APIs to find recent stories
  // For sensitive topics like legal issues, we'd need to be careful about:
  // 1. Verifying from reputable sources
  // 2. Using appropriate language ("alleged", "reported")
  // 3. Focusing on football-relevant impact

  // Example of what we'd return:
  // "The midfielder has been in the headlines recently for off-field matters that could affect his availability"
  // "Currently sidelined with a hamstring injury picked up against Liverpool"
  // "In red-hot form with 7 goals in his last 5 matches"

  return null;
}
