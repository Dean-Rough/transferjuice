/**
 * Transfer History Service
 * Provides historical transfer data and context
 */

import { logger } from "@/lib/logger";

export interface TransferRecord {
  date: string;
  player: string;
  fromClub: string;
  toClub: string;
  fee: number;
  currency: string;
  type: "permanent" | "loan" | "free" | "undisclosed";
  age: number;
  position: string;
  nationality: string;
}

export interface ClubTransferHistory {
  club: string;
  recentSignings: TransferRecord[];
  recentDepartures: TransferRecord[];
  totalSpent: number;
  totalReceived: number;
  netSpend: number;
  biggestSigning: TransferRecord | null;
  biggestSale: TransferRecord | null;
}

export interface TransferContext {
  similarTransfers: TransferRecord[];
  marketTrend: {
    averageFee: number;
    priceEvolution: Array<{ year: number; avgFee: number }>;
  };
  recordTransfer: TransferRecord;
  clubHistory: {
    buying: ClubTransferHistory;
    selling: ClubTransferHistory;
  };
}

/**
 * Mock historical transfer data
 */
const MOCK_TRANSFER_DATABASE: TransferRecord[] = [
  // Recent big transfers
  {
    date: "2023-07-01",
    player: "Jude Bellingham",
    fromClub: "Borussia Dortmund",
    toClub: "Real Madrid",
    fee: 103000000,
    currency: "EUR",
    type: "permanent",
    age: 20,
    position: "Midfielder",
    nationality: "England",
  },
  {
    date: "2023-08-14",
    player: "Moises Caicedo",
    fromClub: "Brighton",
    toClub: "Chelsea",
    fee: 116000000,
    currency: "GBP",
    type: "permanent",
    age: 21,
    position: "Midfielder",
    nationality: "Ecuador",
  },
  {
    date: "2023-07-15",
    player: "Declan Rice",
    fromClub: "West Ham",
    toClub: "Arsenal",
    fee: 105000000,
    currency: "GBP",
    type: "permanent",
    age: 24,
    position: "Midfielder",
    nationality: "England",
  },
  {
    date: "2022-07-01",
    player: "Erling Haaland",
    fromClub: "Borussia Dortmund",
    toClub: "Manchester City",
    fee: 60000000,
    currency: "EUR",
    type: "permanent",
    age: 21,
    position: "Striker",
    nationality: "Norway",
  },
  {
    date: "2023-01-31",
    player: "Enzo Fernandez",
    fromClub: "Benfica",
    toClub: "Chelsea",
    fee: 121000000,
    currency: "EUR",
    type: "permanent",
    age: 22,
    position: "Midfielder",
    nationality: "Argentina",
  },
  {
    date: "2021-08-28",
    player: "Cristiano Ronaldo",
    fromClub: "Juventus",
    toClub: "Manchester United",
    fee: 15000000,
    currency: "EUR",
    type: "permanent",
    age: 36,
    position: "Forward",
    nationality: "Portugal",
  },
  {
    date: "2022-08-31",
    player: "Antony",
    fromClub: "Ajax",
    toClub: "Manchester United",
    fee: 95000000,
    currency: "EUR",
    type: "permanent",
    age: 22,
    position: "Winger",
    nationality: "Brazil",
  },
  {
    date: "2023-08-04",
    player: "Rasmus Hojlund",
    fromClub: "Atalanta",
    toClub: "Manchester United",
    fee: 72000000,
    currency: "EUR",
    type: "permanent",
    age: 20,
    position: "Striker",
    nationality: "Denmark",
  },
  // Historical context transfers
  {
    date: "2017-08-04",
    player: "Neymar",
    fromClub: "Barcelona",
    toClub: "Paris Saint-Germain",
    fee: 222000000,
    currency: "EUR",
    type: "permanent",
    age: 25,
    position: "Forward",
    nationality: "Brazil",
  },
  {
    date: "2018-01-06",
    player: "Philippe Coutinho",
    fromClub: "Liverpool",
    toClub: "Barcelona",
    fee: 135000000,
    currency: "EUR",
    type: "permanent",
    age: 25,
    position: "Midfielder",
    nationality: "Brazil",
  },
];

/**
 * Get transfer history context for a potential transfer
 */
export async function getTransferContext(
  playerName: string,
  fromClub: string,
  toClub: string,
  position: string,
  fee?: number,
): Promise<TransferContext> {
  logger.info(
    `Getting transfer context for ${playerName} from ${fromClub} to ${toClub}`,
  );

  // Find similar transfers (same position, similar age range)
  const similarTransfers = findSimilarTransfers(position, fee);

  // Get market trends for this position
  const marketTrend = calculateMarketTrend(position);

  // Find record transfer for this position
  const recordTransfer = findRecordTransfer(position);

  // Get club transfer histories
  const buyingClubHistory = getClubTransferHistory(toClub);
  const sellingClubHistory = getClubTransferHistory(fromClub);

  return {
    similarTransfers,
    marketTrend,
    recordTransfer,
    clubHistory: {
      buying: buyingClubHistory,
      selling: sellingClubHistory,
    },
  };
}

/**
 * Find similar transfers based on position and fee
 */
function findSimilarTransfers(
  position: string,
  fee?: number,
): TransferRecord[] {
  return MOCK_TRANSFER_DATABASE.filter((transfer) => {
    const positionMatch =
      transfer.position.toLowerCase() === position.toLowerCase() ||
      (position === "Forward" && transfer.position === "Striker") ||
      (position === "Striker" && transfer.position === "Forward");

    if (!fee) return positionMatch;

    // Within 30% of the fee
    const feeMatch = transfer.fee >= fee * 0.7 && transfer.fee <= fee * 1.3;
    return positionMatch && feeMatch;
  })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
}

/**
 * Calculate market trend for a position
 */
function calculateMarketTrend(
  position: string,
): TransferContext["marketTrend"] {
  const positionTransfers = MOCK_TRANSFER_DATABASE.filter(
    (t) => t.position.toLowerCase() === position.toLowerCase(),
  );

  // Group by year
  const byYear = positionTransfers.reduce(
    (acc, transfer) => {
      const year = new Date(transfer.date).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(transfer.fee);
      return acc;
    },
    {} as Record<number, number[]>,
  );

  // Calculate averages
  const priceEvolution = Object.entries(byYear)
    .map(([year, fees]) => ({
      year: parseInt(year),
      avgFee: fees.reduce((sum, fee) => sum + fee, 0) / fees.length,
    }))
    .sort((a, b) => a.year - b.year);

  const allFees = positionTransfers.map((t) => t.fee);
  const averageFee =
    allFees.reduce((sum, fee) => sum + fee, 0) / allFees.length;

  return {
    averageFee,
    priceEvolution,
  };
}

/**
 * Find record transfer for a position
 */
function findRecordTransfer(position: string): TransferRecord {
  const positionTransfers = MOCK_TRANSFER_DATABASE.filter(
    (t) => t.position.toLowerCase() === position.toLowerCase(),
  );

  return positionTransfers.reduce(
    (record, transfer) => (transfer.fee > record.fee ? transfer : record),
    positionTransfers[0] || MOCK_TRANSFER_DATABASE[0],
  );
}

/**
 * Get club transfer history
 */
function getClubTransferHistory(clubName: string): ClubTransferHistory {
  const signings = MOCK_TRANSFER_DATABASE.filter((t) => t.toClub === clubName);
  const departures = MOCK_TRANSFER_DATABASE.filter(
    (t) => t.fromClub === clubName,
  );

  const totalSpent = signings.reduce((sum, t) => sum + t.fee, 0);
  const totalReceived = departures.reduce((sum, t) => sum + t.fee, 0);

  const biggestSigning = signings.reduce(
    (biggest, t) => (!biggest || t.fee > biggest.fee ? t : biggest),
    null as TransferRecord | null,
  );

  const biggestSale = departures.reduce(
    (biggest, t) => (!biggest || t.fee > biggest.fee ? t : biggest),
    null as TransferRecord | null,
  );

  return {
    club: clubName,
    recentSignings: signings.slice(0, 5),
    recentDepartures: departures.slice(0, 5),
    totalSpent,
    totalReceived,
    netSpend: totalSpent - totalReceived,
    biggestSigning,
    biggestSale,
  };
}

/**
 * Get notable transfers between two clubs
 */
export async function getTransfersBetweenClubs(
  club1: string,
  club2: string,
): Promise<TransferRecord[]> {
  return MOCK_TRANSFER_DATABASE.filter(
    (t) =>
      (t.fromClub === club1 && t.toClub === club2) ||
      (t.fromClub === club2 && t.toClub === club1),
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Format transfer fee for display
 */
export function formatTransferFee(
  fee: number,
  currency: string = "EUR",
): string {
  const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";

  if (fee >= 1000000) {
    return `${symbol}${(fee / 1000000).toFixed(1)}m`;
  } else if (fee >= 1000) {
    return `${symbol}${(fee / 1000).toFixed(0)}k`;
  }

  return `${symbol}${fee.toLocaleString()}`;
}

/**
 * Generate transfer context narrative
 */
export function generateTransferContextNarrative(
  context: TransferContext,
): string {
  const { similarTransfers, marketTrend, recordTransfer, clubHistory } =
    context;

  const parts: string[] = [];

  // Market context
  if (marketTrend.averageFee) {
    parts.push(
      `The average transfer fee for this position is ${formatTransferFee(marketTrend.averageFee)}.`,
    );
  }

  // Record transfer
  if (recordTransfer) {
    parts.push(
      `The record transfer for this position is ${recordTransfer.player} to ${recordTransfer.toClub} for ${formatTransferFee(recordTransfer.fee)} in ${new Date(recordTransfer.date).getFullYear()}.`,
    );
  }

  // Club spending
  if (clubHistory.buying.netSpend !== 0) {
    const spending = clubHistory.buying.netSpend > 0 ? "spent" : "received";
    parts.push(
      `${clubHistory.buying.club} has ${spending} a net ${formatTransferFee(Math.abs(clubHistory.buying.netSpend))} in recent transfer windows.`,
    );
  }

  // Recent similar transfers
  if (similarTransfers.length > 0) {
    const recent = similarTransfers[0];
    parts.push(
      `A comparable recent transfer was ${recent.player} from ${recent.fromClub} to ${recent.toClub} for ${formatTransferFee(recent.fee)}.`,
    );
  }

  return parts.join(" ");
}
