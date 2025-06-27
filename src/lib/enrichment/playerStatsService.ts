/**
 * Player Stats Service
 * Fetches comprehensive player statistics and information
 */

import { logger } from "@/lib/logger";

export interface PlayerStats {
  player: {
    name: string;
    age: number;
    nationality: string;
    position: string;
    currentClub: string;
    contractUntil?: string;
    marketValue?: number;
    imageUrl?: string;
  };
  currentSeason: {
    appearances: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
  };
  careerStats: {
    totalAppearances: number;
    totalGoals: number;
    totalAssists: number;
    clubs: Array<{
      name: string;
      period: string;
      appearances: number;
      goals: number;
      assists: number;
    }>;
  };
  transferHistory: Array<{
    date: string;
    from: string;
    to: string;
    fee?: number;
    type: "transfer" | "loan" | "free";
  }>;
  strengths: string[];
  weaknesses: string[];
  similarPlayers: string[];
}

/**
 * Mock data for development - in production this would connect to real APIs
 */
const MOCK_PLAYER_DATA: Record<string, Partial<PlayerStats>> = {
  "Erling Haaland": {
    player: {
      name: "Erling Haaland",
      age: 24,
      nationality: "Norway",
      position: "Striker",
      currentClub: "Manchester City",
      contractUntil: "2027",
      marketValue: 180000000,
      imageUrl:
        "https://img.a.transfermarkt.technology/portrait/big/418560-1694603746.jpg",
    },
    currentSeason: {
      appearances: 31,
      goals: 29,
      assists: 6,
      yellowCards: 3,
      redCards: 0,
      minutesPlayed: 2456,
    },
    careerStats: {
      totalAppearances: 245,
      totalGoals: 192,
      totalAssists: 44,
      clubs: [
        {
          name: "Manchester City",
          period: "2022-present",
          appearances: 89,
          goals: 82,
          assists: 15,
        },
        {
          name: "Borussia Dortmund",
          period: "2020-2022",
          appearances: 89,
          goals: 86,
          assists: 23,
        },
        {
          name: "RB Salzburg",
          period: "2019-2020",
          appearances: 27,
          goals: 29,
          assists: 7,
        },
      ],
    },
    transferHistory: [
      {
        date: "2022-07-01",
        from: "Borussia Dortmund",
        to: "Manchester City",
        fee: 60000000,
        type: "transfer",
      },
      {
        date: "2020-01-01",
        from: "RB Salzburg",
        to: "Borussia Dortmund",
        fee: 20000000,
        type: "transfer",
      },
    ],
    strengths: [
      "Finishing",
      "Pace",
      "Physical presence",
      "Positioning",
      "Aerial ability",
    ],
    weaknesses: ["Link-up play", "Pressing resistance"],
    similarPlayers: ["Robert Lewandowski", "Karim Benzema", "Harry Kane"],
  },
  "Kylian Mbappe": {
    player: {
      name: "Kylian Mbappé",
      age: 25,
      nationality: "France",
      position: "Forward",
      currentClub: "Paris Saint-Germain",
      contractUntil: "2025",
      marketValue: 180000000,
      imageUrl:
        "https://img.a.transfermarkt.technology/portrait/big/342229-1682683695.jpg",
    },
    currentSeason: {
      appearances: 29,
      goals: 27,
      assists: 7,
      yellowCards: 4,
      redCards: 0,
      minutesPlayed: 2344,
    },
    careerStats: {
      totalAppearances: 367,
      totalGoals: 256,
      totalAssists: 128,
      clubs: [
        {
          name: "Paris Saint-Germain",
          period: "2017-present",
          appearances: 260,
          goals: 212,
          assists: 98,
        },
        {
          name: "Monaco",
          period: "2015-2017",
          appearances: 60,
          goals: 27,
          assists: 16,
        },
      ],
    },
    transferHistory: [
      {
        date: "2018-07-01",
        from: "Monaco",
        to: "Paris Saint-Germain",
        fee: 180000000,
        type: "transfer",
      },
    ],
    strengths: [
      "Pace",
      "Dribbling",
      "Finishing",
      "Movement",
      "Big game player",
    ],
    weaknesses: ["Defensive contribution", "Team play at times"],
    similarPlayers: ["Thierry Henry", "Ronaldo Nazário", "Cristiano Ronaldo"],
  },
  "Jude Bellingham": {
    player: {
      name: "Jude Bellingham",
      age: 21,
      nationality: "England",
      position: "Midfielder",
      currentClub: "Real Madrid",
      contractUntil: "2029",
      marketValue: 180000000,
      imageUrl:
        "https://img.a.transfermarkt.technology/portrait/big/581678-1693987944.jpg",
    },
    currentSeason: {
      appearances: 28,
      goals: 16,
      assists: 4,
      yellowCards: 7,
      redCards: 0,
      minutesPlayed: 2234,
    },
    careerStats: {
      totalAppearances: 195,
      totalGoals: 44,
      totalAssists: 25,
      clubs: [
        {
          name: "Real Madrid",
          period: "2023-present",
          appearances: 28,
          goals: 16,
          assists: 4,
        },
        {
          name: "Borussia Dortmund",
          period: "2020-2023",
          appearances: 132,
          goals: 24,
          assists: 25,
        },
        {
          name: "Birmingham City",
          period: "2019-2020",
          appearances: 44,
          goals: 4,
          assists: 3,
        },
      ],
    },
    transferHistory: [
      {
        date: "2023-07-01",
        from: "Borussia Dortmund",
        to: "Real Madrid",
        fee: 103000000,
        type: "transfer",
      },
      {
        date: "2020-07-01",
        from: "Birmingham City",
        to: "Borussia Dortmund",
        fee: 25000000,
        type: "transfer",
      },
    ],
    strengths: [
      "Box-to-box ability",
      "Leadership",
      "Technique",
      "Pressing",
      "Goal threat",
    ],
    weaknesses: ["Discipline (yellow cards)", "Consistency"],
    similarPlayers: ["Steven Gerrard", "Frank Lampard", "Yaya Touré"],
  },
};

/**
 * Fetch player stats by name
 */
export async function fetchPlayerStats(
  playerName: string,
): Promise<PlayerStats | null> {
  try {
    logger.info(`Fetching stats for player: ${playerName}`);

    // In production, this would call real APIs like:
    // - Transfermarkt API
    // - Football-data.org
    // - SofaScore API
    // - Opta Stats

    // For now, return mock data
    const mockData = MOCK_PLAYER_DATA[playerName];
    if (
      mockData &&
      mockData.player &&
      mockData.currentSeason &&
      mockData.careerStats
    ) {
      return mockData as PlayerStats;
    }

    // Generate basic stats for unknown players
    return generateBasicPlayerStats(playerName);
  } catch (error) {
    logger.error(`Failed to fetch stats for ${playerName}`, error);
    return null;
  }
}

/**
 * Generate basic stats for players not in mock data
 */
function generateBasicPlayerStats(playerName: string): PlayerStats {
  return {
    player: {
      name: playerName,
      age: Math.floor(Math.random() * 15) + 18, // 18-32
      nationality: "Unknown",
      position: "Unknown",
      currentClub: "Unknown",
      marketValue: Math.floor(Math.random() * 50000000) + 5000000, // 5M-55M
    },
    currentSeason: {
      appearances: Math.floor(Math.random() * 30),
      goals: Math.floor(Math.random() * 15),
      assists: Math.floor(Math.random() * 10),
      yellowCards: Math.floor(Math.random() * 8),
      redCards: Math.floor(Math.random() * 2),
      minutesPlayed: Math.floor(Math.random() * 2000) + 500,
    },
    careerStats: {
      totalAppearances: Math.floor(Math.random() * 200) + 50,
      totalGoals: Math.floor(Math.random() * 100),
      totalAssists: Math.floor(Math.random() * 80),
      clubs: [],
    },
    transferHistory: [],
    strengths: ["Potential", "Youth", "Ambition"],
    weaknesses: ["Experience", "Consistency"],
    similarPlayers: [],
  };
}

/**
 * Fetch multiple player stats in batch
 */
export async function batchFetchPlayerStats(
  playerNames: string[],
): Promise<Map<string, PlayerStats | null>> {
  const results = new Map<string, PlayerStats | null>();

  // In production, this would make parallel API calls
  for (const playerName of playerNames) {
    const stats = await fetchPlayerStats(playerName);
    results.set(playerName, stats);
  }

  return results;
}

/**
 * Get player comparison data
 */
export async function getPlayerComparison(
  player1: string,
  player2: string,
): Promise<{
  player1Stats: PlayerStats | null;
  player2Stats: PlayerStats | null;
  comparison: {
    goalsPerGame: { player1: number; player2: number };
    assistsPerGame: { player1: number; player2: number };
    marketValueDiff: number;
    ageGap: number;
  } | null;
}> {
  const [stats1, stats2] = await Promise.all([
    fetchPlayerStats(player1),
    fetchPlayerStats(player2),
  ]);

  let comparison = null;

  if (stats1 && stats2) {
    comparison = {
      goalsPerGame: {
        player1:
          stats1.currentSeason.goals /
          Math.max(stats1.currentSeason.appearances, 1),
        player2:
          stats2.currentSeason.goals /
          Math.max(stats2.currentSeason.appearances, 1),
      },
      assistsPerGame: {
        player1:
          stats1.currentSeason.assists /
          Math.max(stats1.currentSeason.appearances, 1),
        player2:
          stats2.currentSeason.assists /
          Math.max(stats2.currentSeason.appearances, 1),
      },
      marketValueDiff:
        (stats1.player.marketValue || 0) - (stats2.player.marketValue || 0),
      ageGap: stats1.player.age - stats2.player.age,
    };
  }

  return {
    player1Stats: stats1,
    player2Stats: stats2,
    comparison,
  };
}

/**
 * Format player stats for display
 */
export function formatPlayerStats(stats: PlayerStats): string {
  const { player, currentSeason } = stats;

  return `
${player.name} (${player.age}, ${player.nationality})
Position: ${player.position}
Current Club: ${player.currentClub}
Market Value: €${(player.marketValue || 0).toLocaleString()}

This Season:
- ${currentSeason.appearances} appearances
- ${currentSeason.goals} goals
- ${currentSeason.assists} assists
- ${currentSeason.minutesPlayed} minutes played

Career Total:
- ${stats.careerStats.totalAppearances} appearances
- ${stats.careerStats.totalGoals} goals
- ${stats.careerStats.totalAssists} assists

Strengths: ${stats.strengths.join(", ")}
Similar Players: ${stats.similarPlayers.join(", ")}
  `.trim();
}
