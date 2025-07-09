// Basic fact-checking and validation for transfer stories
export interface FactCheckResult {
  isValid: boolean;
  issues: string[];
  corrections?: Record<string, string>;
}

// Known manager-club associations (as of 2025)
const KNOWN_MANAGERS: Record<string, string> = {
  "Max Allegri": "Juventus",
  "Massimiliano Allegri": "Juventus",
  "Carlo Ancelotti": "Real Madrid",
  "Pep Guardiola": "Manchester City",
  "Mikel Arteta": "Arsenal",
  "Ange Postecoglou": "Tottenham",
  "Erik ten Hag": "Manchester United",
  "Mauricio Pochettino": "Chelsea",
  "Eddie Howe": "Newcastle United",
  "Unai Emery": "Aston Villa",
  "Jürgen Klopp": "Retired", // Left Liverpool
};

// Common fact-checking issues
const SUSPICIOUS_PATTERNS = [
  // Unrealistic fees
  {
    pattern: /£(\d+)m/,
    check: (match: string) => {
      const amount = parseInt(match.replace(/[£m]/g, ""));
      return amount > 300
        ? `Suspicious transfer fee: ${match} seems unrealistic`
        : null;
    },
  },

  // Future dates
  {
    pattern: /(?:will join|to join|joining) (?:in|after) (\w+ \d{4})/,
    check: (match: string) => {
      if (match.includes("August") || match.includes("July")) return null;
      return `Future transfer date seems too far: ${match}`;
    },
  },

  // Retired players
  {
    pattern: /Lionel Messi|Cristiano Ronaldo/,
    check: (match: string) => {
      return `Be cautious with aging superstar rumors`;
    },
  },
];

export function factCheckStory(
  content: string,
  metadata?: any,
): FactCheckResult {
  const issues: string[] = [];
  const corrections: Record<string, string> = {};

  // Ensure content is valid
  if (!content || typeof content !== "string") {
    return {
      isValid: false,
      issues: ["Invalid content provided"],
      corrections: undefined,
    };
  }

  // Check manager associations
  for (const [manager, correctClub] of Object.entries(KNOWN_MANAGERS)) {
    const managerPattern = new RegExp(
      `${manager}.*(?:manager|coach|confirms)`,
      "i",
    );
    if (managerPattern.test(content)) {
      // Check if wrong club is mentioned
      const clubPattern =
        /(?:AC Milan|Inter Milan|Chelsea|Arsenal|Barcelona|PSG|Bayern Munich)/i;
      const mentionedClub = content.match(clubPattern)?.[0];

      if (
        mentionedClub &&
        mentionedClub !== correctClub &&
        correctClub !== "Retired"
      ) {
        issues.push(
          `Manager mismatch: ${manager} is at ${correctClub}, not ${mentionedClub}`,
        );
        corrections[mentionedClub] = correctClub;
      }
    }
  }

  // Check suspicious patterns
  for (const { pattern, check } of SUSPICIOUS_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      const issue = check(matches[0]);
      if (issue) issues.push(issue);
    }
  }

  // Check for contradictions
  if (
    content.includes("confirmed") &&
    content.includes("might") &&
    content.includes("could")
  ) {
    issues.push(
      "Mixed signals: Story contains both confirmed and speculative language",
    );
  }

  // Check for pay cut stories that seem unrealistic
  if (metadata?.payCut && typeof metadata.payCut === "string") {
    const payCutMatch = metadata.payCut.match(/(\d+)%/);
    if (payCutMatch) {
      const percentage = parseInt(payCutMatch[1]);
      if (percentage > 50) {
        issues.push(
          `Unrealistic pay cut: ${percentage}% reduction seems excessive`,
        );
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    corrections: Object.keys(corrections).length > 0 ? corrections : undefined,
  };
}

// Validate RSS item before processing
export function validateRSSItem(item: any): boolean {
  // Skip items that are retweets or quotes without content
  if (
    item.content_text.startsWith("RT by") ||
    item.content_text.trim() === ""
  ) {
    return false;
  }

  // Skip items that are just links or minimal content
  if (item.content_text.length < 50) {
    return false;
  }

  // Skip obvious ads or promotions
  if (
    item.content_text.toLowerCase().includes("bet now") ||
    item.content_text.toLowerCase().includes("odds") ||
    item.content_text.toLowerCase().includes("promo code")
  ) {
    return false;
  }

  return true;
}

// Clean up story content
export function cleanStoryContent(content: string): string {
  // Remove image URLs
  content = content.replace(/pic\.twitter\.com\/\w+/g, "").trim();

  // Remove duplicate Twitter handles
  content = content.replace(/— .+ \(@.+\) .+$/gm, "").trim();

  // Fix common encoding issues
  content = content
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€"/g, "—")
    .replace(/Ã©/g, "é")
    .replace(/Ã¡/g, "á")
    .replace(/Ã­/g, "í");

  return content;
}

// Extract actual facts from tweet noise
export function extractFactualContent(content: string): string {
  // Remove emoji spam at the start
  const emojiPattern =
    /^[\s\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+/gu;
  content = content.replace(emojiPattern, "").trim();

  // Extract quoted speech as primary content
  const quotedSpeech = content.match(/"([^"]+)"/g);
  if (quotedSpeech && quotedSpeech.length > 0) {
    return quotedSpeech.join(" ");
  }

  // Otherwise return cleaned content
  return content;
}
