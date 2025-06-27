/**
 * Club Context Service
 * Provides comprehensive club information and context
 */

import { logger } from "@/lib/logger";

export interface ClubContext {
  name: string;
  fullName: string;
  country: string;
  league: string;
  leaguePosition: string;
  points: number;
  recentForm: "excellent" | "good" | "average" | "poor";
  lastFiveResults: Array<"W" | "D" | "L">;
  squadInfo: {
    size: number;
    averageAge: number;
    foreignPlayers: number;
    injuredPlayers: number;
  };
  financials: {
    transferBudget?: number;
    wagebudget?: number;
    recentSpending: number;
    recentSales: number;
    netSpend: number;
    ffpStatus: "compliant" | "warning" | "breach";
  };
  tacticalStyle: {
    formation: string;
    playStyle: string;
    keyPlayers: string[];
  };
  needs: {
    positions: string[];
    priority: "urgent" | "high" | "moderate" | "low";
    specificTargets?: string[];
  };
  recentTransfers: {
    ins: Array<{ player: string; fee: number; position: string }>;
    outs: Array<{ player: string; fee: number; destination: string }>;
  };
  managerInfo: {
    name: string;
    nationality: string;
    appointed: string;
    preferredFormation: string;
    transferStrategy: string;
  };
  stadiumInfo: {
    name: string;
    capacity: number;
    averageAttendance: number;
  };
}

/**
 * Mock club data - in production this would connect to real APIs
 */
const MOCK_CLUB_DATA: Record<string, Partial<ClubContext>> = {
  Arsenal: {
    name: "Arsenal",
    fullName: "Arsenal Football Club",
    country: "England",
    league: "Premier League",
    leaguePosition: "2nd",
    points: 84,
    recentForm: "excellent",
    lastFiveResults: ["W", "W", "D", "W", "W"],
    squadInfo: {
      size: 26,
      averageAge: 25.2,
      foreignPlayers: 18,
      injuredPlayers: 2,
    },
    financials: {
      transferBudget: 200000000,
      wagebudget: 180000000,
      recentSpending: 210000000,
      recentSales: 45000000,
      netSpend: 165000000,
      ffpStatus: "compliant",
    },
    tacticalStyle: {
      formation: "4-3-3",
      playStyle: "Possession-based attacking",
      keyPlayers: ["Bukayo Saka", "Martin Odegaard", "Declan Rice"],
    },
    needs: {
      positions: ["Striker", "Left Back"],
      priority: "high",
      specificTargets: ["Ivan Toney", "Theo Hernandez"],
    },
    recentTransfers: {
      ins: [
        { player: "Declan Rice", fee: 105000000, position: "Midfielder" },
        { player: "Kai Havertz", fee: 65000000, position: "Forward" },
        { player: "Jurrien Timber", fee: 38000000, position: "Defender" },
      ],
      outs: [
        {
          player: "Granit Xhaka",
          fee: 21000000,
          destination: "Bayer Leverkusen",
        },
        { player: "Folarin Balogun", fee: 35000000, destination: "Monaco" },
      ],
    },
    managerInfo: {
      name: "Mikel Arteta",
      nationality: "Spanish",
      appointed: "2019-12-20",
      preferredFormation: "4-3-3",
      transferStrategy: "Young talents with high potential",
    },
    stadiumInfo: {
      name: "Emirates Stadium",
      capacity: 60704,
      averageAttendance: 60213,
    },
  },
  Chelsea: {
    name: "Chelsea",
    fullName: "Chelsea Football Club",
    country: "England",
    league: "Premier League",
    leaguePosition: "6th",
    points: 63,
    recentForm: "average",
    lastFiveResults: ["L", "W", "D", "W", "L"],
    squadInfo: {
      size: 33,
      averageAge: 23.8,
      foreignPlayers: 24,
      injuredPlayers: 5,
    },
    financials: {
      transferBudget: 150000000,
      wagebudget: 220000000,
      recentSpending: 434000000,
      recentSales: 120000000,
      netSpend: 314000000,
      ffpStatus: "warning",
    },
    tacticalStyle: {
      formation: "4-2-3-1",
      playStyle: "Transitional with high press",
      keyPlayers: ["Cole Palmer", "Enzo Fernandez", "Moises Caicedo"],
    },
    needs: {
      positions: ["Striker", "Center Back", "Goalkeeper"],
      priority: "urgent",
      specificTargets: ["Victor Osimhen", "Jean-Clair Todibo"],
    },
    recentTransfers: {
      ins: [
        { player: "Moises Caicedo", fee: 116000000, position: "Midfielder" },
        { player: "Cole Palmer", fee: 42500000, position: "Forward" },
        { player: "Nicolas Jackson", fee: 32000000, position: "Striker" },
      ],
      outs: [
        {
          player: "Mason Mount",
          fee: 60000000,
          destination: "Manchester United",
        },
        { player: "Kai Havertz", fee: 65000000, destination: "Arsenal" },
      ],
    },
    managerInfo: {
      name: "Mauricio Pochettino",
      nationality: "Argentinian",
      appointed: "2023-07-01",
      preferredFormation: "4-2-3-1",
      transferStrategy: "Mix of youth and experience",
    },
    stadiumInfo: {
      name: "Stamford Bridge",
      capacity: 40341,
      averageAttendance: 39947,
    },
  },
  "Real Madrid": {
    name: "Real Madrid",
    fullName: "Real Madrid Club de Fútbol",
    country: "Spain",
    league: "La Liga",
    leaguePosition: "1st",
    points: 95,
    recentForm: "excellent",
    lastFiveResults: ["W", "W", "W", "W", "D"],
    squadInfo: {
      size: 24,
      averageAge: 27.1,
      foreignPlayers: 13,
      injuredPlayers: 1,
    },
    financials: {
      transferBudget: 300000000,
      wagebudget: 350000000,
      recentSpending: 150000000,
      recentSales: 40000000,
      netSpend: 110000000,
      ffpStatus: "compliant",
    },
    tacticalStyle: {
      formation: "4-3-3",
      playStyle: "Balanced with quick transitions",
      keyPlayers: ["Jude Bellingham", "Vinicius Junior", "Federico Valverde"],
    },
    needs: {
      positions: ["Center Back", "Right Back"],
      priority: "moderate",
      specificTargets: ["Kylian Mbappe", "Alphonso Davies"],
    },
    recentTransfers: {
      ins: [
        { player: "Jude Bellingham", fee: 103000000, position: "Midfielder" },
        { player: "Arda Guler", fee: 20000000, position: "Midfielder" },
      ],
      outs: [
        { player: "Karim Benzema", fee: 0, destination: "Al-Ittihad" },
        { player: "Marco Asensio", fee: 0, destination: "Paris Saint-Germain" },
      ],
    },
    managerInfo: {
      name: "Carlo Ancelotti",
      nationality: "Italian",
      appointed: "2021-06-01",
      preferredFormation: "4-3-3",
      transferStrategy: "Galacticos mixed with academy products",
    },
    stadiumInfo: {
      name: "Santiago Bernabéu",
      capacity: 81044,
      averageAttendance: 72367,
    },
  },
};

/**
 * Fetch club context by name
 */
export async function fetchClubContext(
  clubName: string,
): Promise<ClubContext | null> {
  try {
    logger.info(`Fetching context for club: ${clubName}`);

    // In production, this would call real APIs like:
    // - Transfermarkt API for squad/transfer data
    // - League APIs for standings/form
    // - Financial APIs for FFP/budget data

    const mockData = MOCK_CLUB_DATA[clubName];
    if (mockData) {
      return mockData as ClubContext;
    }

    // Generate basic context for unknown clubs
    return generateBasicClubContext(clubName);
  } catch (error) {
    logger.error(`Failed to fetch context for ${clubName}`, error);
    return null;
  }
}

/**
 * Generate basic context for clubs not in mock data
 */
function generateBasicClubContext(clubName: string): ClubContext {
  return {
    name: clubName,
    fullName: clubName,
    country: "Unknown",
    league: "Unknown",
    leaguePosition: "Mid-table",
    points: 45,
    recentForm: "average",
    lastFiveResults: ["W", "L", "D", "W", "L"],
    squadInfo: {
      size: 25,
      averageAge: 26,
      foreignPlayers: 15,
      injuredPlayers: 2,
    },
    financials: {
      transferBudget: 50000000,
      recentSpending: 30000000,
      recentSales: 20000000,
      netSpend: 10000000,
      ffpStatus: "compliant",
    },
    tacticalStyle: {
      formation: "4-4-2",
      playStyle: "Balanced",
      keyPlayers: [],
    },
    needs: {
      positions: ["Various"],
      priority: "moderate",
    },
    recentTransfers: {
      ins: [],
      outs: [],
    },
    managerInfo: {
      name: "Unknown",
      nationality: "Unknown",
      appointed: "Unknown",
      preferredFormation: "4-4-2",
      transferStrategy: "Balanced approach",
    },
    stadiumInfo: {
      name: `${clubName} Stadium`,
      capacity: 30000,
      averageAttendance: 25000,
    },
  };
}

/**
 * Get transfer need analysis for a club
 */
export function analyzeTransferNeed(
  club: ClubContext,
  position: string,
): {
  needLevel: "critical" | "high" | "moderate" | "low" | "none";
  reason: string;
} {
  const positionNeed = club.needs.positions.includes(position);
  const squadDepth = club.squadInfo.size;
  const injuries = club.squadInfo.injuredPlayers;

  if (positionNeed && club.needs.priority === "urgent") {
    return {
      needLevel: "critical",
      reason: `${club.name} desperately needs a ${position} with ${injuries} injuries affecting squad depth`,
    };
  }

  if (positionNeed && club.needs.priority === "high") {
    return {
      needLevel: "high",
      reason: `${position} has been identified as a priority position for ${club.name}`,
    };
  }

  if (positionNeed) {
    return {
      needLevel: "moderate",
      reason: `${club.name} could benefit from strengthening the ${position} position`,
    };
  }

  if (squadDepth < 23) {
    return {
      needLevel: "low",
      reason: `Squad depth could be improved, though ${position} isn't a priority`,
    };
  }

  return {
    needLevel: "none",
    reason: `${club.name} is well-stocked in the ${position} position`,
  };
}

/**
 * Compare two clubs
 */
export async function compareClubs(
  club1Name: string,
  club2Name: string,
): Promise<{
  club1: ClubContext | null;
  club2: ClubContext | null;
  comparison: {
    leagueGap: number;
    financialDifference: number;
    squadSizeDifference: number;
    formComparison: string;
  } | null;
}> {
  const [club1, club2] = await Promise.all([
    fetchClubContext(club1Name),
    fetchClubContext(club2Name),
  ]);

  let comparison = null;

  if (club1 && club2) {
    comparison = {
      leagueGap: Math.abs(
        parseInt(club1.leaguePosition) - parseInt(club2.leaguePosition),
      ),
      financialDifference:
        (club1.financials.transferBudget || 0) -
        (club2.financials.transferBudget || 0),
      squadSizeDifference: club1.squadInfo.size - club2.squadInfo.size,
      formComparison: `${club1.name} (${club1.recentForm}) vs ${club2.name} (${club2.recentForm})`,
    };
  }

  return { club1, club2, comparison };
}

/**
 * Generate club narrative context
 */
export function generateClubNarrative(club: ClubContext): string {
  const parts: string[] = [];

  // League position and form
  parts.push(
    `${club.name} currently sits ${club.leaguePosition} in ${club.league} with ${club.points} points, showing ${club.recentForm} form with their last five results reading ${club.lastFiveResults.join("-")}.`,
  );

  // Squad context
  if (club.squadInfo.injuredPlayers > 3) {
    parts.push(
      `The club is dealing with an injury crisis, with ${club.squadInfo.injuredPlayers} players currently sidelined.`,
    );
  }

  // Financial context
  if (club.financials.ffpStatus === "warning") {
    parts.push(
      `Financial Fair Play concerns may impact their spending power, with a net spend of €${(club.financials.netSpend / 1000000).toFixed(1)}m recently.`,
    );
  } else if (
    club.financials.transferBudget &&
    club.financials.transferBudget > 100000000
  ) {
    parts.push(
      `The club has significant financial muscle with a reported €${(club.financials.transferBudget / 1000000).toFixed(0)}m transfer budget.`,
    );
  }

  // Tactical fit
  parts.push(
    `Under ${club.managerInfo.name}, they typically play a ${club.tacticalStyle.formation} formation with a ${club.tacticalStyle.playStyle} approach.`,
  );

  return parts.join(" ");
}
