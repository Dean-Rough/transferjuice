/**
 * Content Enhancement Utilities
 * Adds dynamic context and rich information to briefing content
 */

export interface ContentEnhancement {
  tacticalAnalysis: string;
  financialContext: string;
  historicalComparison: string;
  squadImpact: string;
  marketContext: string;
}

/**
 * Generate tactical analysis for player transfers
 */
export function generateTacticalAnalysis(
  playerName: string,
  position: string,
  fromClub: string,
  toClub: string,
): string {
  const positionAnalysis = {
    striker: `This acquisition addresses ${toClub}'s need for a clinical finisher in the final third`,
    midfielder: `The versatile midfielder brings the creativity and work rate that ${toClub} has been lacking`,
    defender: `A solid defensive addition that could shore up ${toClub}'s backline vulnerabilities`,
    goalkeeper: `Between the sticks, this represents a significant upgrade in shot-stopping ability`,
    winger: `Pace and directness on the flanks - exactly what ${toClub}'s attack has been missing`,
  };

  return (
    positionAnalysis[position as keyof typeof positionAnalysis] ||
    `This tactical addition fits perfectly into ${toClub}'s system`
  );
}

/**
 * Add financial context to transfer fees
 */
export function addFinancialContext(fee: string, league: string): string {
  const contexts = {
    premier_league: {
      high: "A statement signing that puts them among the big spenders this window",
      medium:
        "A shrewd investment that balances ambition with financial prudence",
      low: "An astute pickup that could prove to be exceptional value",
    },
    championship: {
      high: "Championship record territory - the kind of fee that turns heads",
      medium:
        "Significant investment for a Championship club, showing real ambition",
      low: "Smart business at this level, with potential for massive returns",
    },
    default: {
      high: "A fee that reflects the current inflated transfer market",
      medium: "Reasonable money in today's market conditions",
      low: "Excellent value in the current transfer climate",
    },
  };

  const leagueContexts =
    contexts[league as keyof typeof contexts] || contexts.default;

  // Simple fee categorization
  const numericFee = parseFloat(fee.replace(/[£€$m]/g, ""));
  let category: "low" | "medium" | "high" = "medium";

  if (numericFee < 10) category = "low";
  else if (numericFee > 50) category = "high";

  return leagueContexts[category];
}

/**
 * Generate historical comparisons for transfers
 */
export function generateHistoricalComparison(
  club: string,
  fee: string,
  position: string,
): string {
  const clubHistories = {
    Arsenal: {
      striker: "Reminiscent of their marquee signings like Nicolas Pépé",
      midfielder: "Echoing their investment in players like Thomas Partey",
      defender: "Following their defensive rebuild strategy",
    },
    Liverpool: {
      striker: "Similar profile to their Darwin Núñez gamble",
      midfielder: "Fits their model of high-energy midfield acquisitions",
      defender: "Continuing their defensive excellence tradition",
    },
    "Manchester United": {
      striker: "Part of their ongoing striker carousel",
      midfielder: "Another attempt to solve their midfield puzzle",
      defender: "Addressing their long-standing defensive concerns",
    },
    Chelsea: {
      striker: "Adding to their extensive forward options",
      midfielder: "Bolstering their already deep midfield ranks",
      defender: "Strengthening their defensive foundations",
    },
  };

  const clubHistory = clubHistories[club as keyof typeof clubHistories];
  if (clubHistory) {
    return (
      clubHistory[position as keyof typeof clubHistory] ||
      `Continuing ${club}'s recent transfer strategy`
    );
  }

  return `A significant addition to ${club}'s project`;
}

/**
 * Analyze squad impact of new signing
 */
export function analyzeSquadImpact(
  playerName: string,
  position: string,
  club: string,
  age: number,
): string {
  if (age < 23) {
    return `At ${age}, ${playerName} represents both immediate impact and long-term investment for ${club}`;
  } else if (age > 30) {
    return `The experienced ${playerName} brings instant quality and leadership to ${club}'s squad`;
  } else {
    return `In his prime at ${age}, ${playerName} should slot seamlessly into ${club}'s first-team plans`;
  }
}

/**
 * Add broader market context
 */
export function addMarketContext(transferWindow: "summer" | "winter"): string {
  const contexts = {
    summer: {
      early:
        "In the early stages of the summer window, clubs are moving quickly to secure priority targets",
      mid: "As the summer window reaches its peak, the pressure is on to complete deals",
      late: "With the summer deadline approaching, desperation is starting to creep into negotiations",
    },
    winter: {
      early:
        "January business is traditionally quiet, but this move suggests serious intent",
      mid: "Mid-window activity as clubs look to strengthen for the second half of the season",
      late: "Last-minute January scrambling as clubs rush to complete deals before the deadline",
    },
  };

  const month = new Date().getMonth();
  let period: "early" | "mid" | "late" = "mid";

  if (transferWindow === "summer") {
    if (month === 5) period = "early";
    else if (month === 7) period = "late";
  } else {
    if (month === 0) period = "early";
    else if (month === 1) period = "late";
  }

  return contexts[transferWindow][period];
}

/**
 * Generate compelling narrative hooks
 */
export function generateNarrativeHooks(
  playerName: string,
  fromClub: string,
  toClub: string,
  transferType: string,
): string[] {
  const hooks = [];

  // Rivalry narratives
  const rivalries = {
    Arsenal: ["Tottenham", "Chelsea"],
    Liverpool: ["Manchester United", "Everton"],
    "Manchester United": ["Liverpool", "Manchester City"],
    "Manchester City": ["Manchester United"],
    Chelsea: ["Arsenal", "Tottenham"],
    Tottenham: ["Arsenal", "Chelsea"],
  };

  const fromRivals = rivalries[fromClub as keyof typeof rivalries] || [];
  const toRivals = rivalries[toClub as keyof typeof rivalries] || [];

  if (fromRivals.includes(toClub)) {
    hooks.push(
      `A controversial move between fierce rivals that will not go down well with ${fromClub} supporters`,
    );
  }

  // Homecoming narratives
  if (transferType === "return") {
    hooks.push(
      `The prodigal son returns - ${playerName} comes home to ${toClub}`,
    );
  }

  // Redemption narratives
  if (transferType === "relegation_escape") {
    hooks.push(
      `A chance for redemption as ${playerName} escapes the disappointment at ${fromClub}`,
    );
  }

  // Dream move narratives
  if (
    [
      "Real Madrid",
      "Barcelona",
      "Manchester United",
      "Liverpool",
      "Arsenal",
    ].includes(toClub)
  ) {
    hooks.push(`A dream move to one of football's elite clubs`);
  }

  return hooks;
}

/**
 * Create compelling section introductions
 */
export function createSectionIntro(
  sectionType: string,
  stories: any[],
): string {
  const intros = {
    breaking: `🚨 **The Latest Developments**\n\nThe transfer wires are buzzing with ${stories.length} major stories that are reshaping the landscape:`,
    confirmed: `✅ **Done Deals**\n\nWhile rumors swirl elsewhere, these ${stories.length} transfers have crossed the finish line:`,
    rumours: `👁️ **On The Radar**\n\nThe rumor mill is churning with ${stories.length} potential moves that could change everything:`,
    analysis: `🎯 **Deep Dive Analysis**\n\nBeyond the headlines, here's what these ${stories.length} developments really mean:`,
  };

  return (
    intros[sectionType as keyof typeof intros] ||
    `**Transfer Update**\n\nHere's what's happening with ${stories.length} key stories:`
  );
}

/**
 * Enhanced content wrapper that adds all enhancements
 */
export function enhanceTransferContent(
  originalContent: string,
  feedItems: any[],
): string {
  let enhancedContent = originalContent;

  // Add section introductions
  if (feedItems.length > 0) {
    const hasBreaking = feedItems.some((item) => item.priority === "HIGH");
    const hasConfirmed = feedItems.some(
      (item) => item.transferType === "confirmed",
    );

    if (hasBreaking) {
      enhancedContent =
        createSectionIntro(
          "breaking",
          feedItems.filter((item) => item.priority === "HIGH"),
        ) +
        "\n\n" +
        enhancedContent;
    } else if (hasConfirmed) {
      enhancedContent =
        createSectionIntro(
          "confirmed",
          feedItems.filter((item) => item.transferType === "confirmed"),
        ) +
        "\n\n" +
        enhancedContent;
    } else {
      enhancedContent =
        createSectionIntro("rumours", feedItems) + "\n\n" + enhancedContent;
    }
  }

  // Add market context
  const currentMonth = new Date().getMonth();
  const transferWindow =
    currentMonth >= 5 && currentMonth <= 8 ? "summer" : "winter";
  const marketContext = addMarketContext(transferWindow);

  enhancedContent = enhancedContent + "\n\n" + `*${marketContext}*`;

  return enhancedContent;
}
