// Simplified Transfer Schema for Transfer Juice v1
// Focused on easily extractable data from Twitter/ITK sources

export type TransferStatus =
  | 'rumoured'
  | 'confirmed'
  | 'medical'
  | 'personal_terms'
  | 'bid_submitted'
  | 'close';

export type TransferType = 'permanent' | 'loan' | 'free' | 'swap' | 'option';

export interface BaseTransfer {
  id: string;
  playerName: string;
  fromClub: string;
  toClub: string;
  estimatedFee: string; // e.g., "£45m", "Free", "Undisclosed"
  status: TransferStatus;
  type: TransferType;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  sourceUrl?: string; // Original tweet/source URL
  reliability: 'tier1' | 'tier2' | 'tier3' | 'tier4'; // Source reliability
}

export interface RumouredTransfer extends BaseTransfer {
  status: 'rumoured' | 'close' | 'bid_submitted' | 'personal_terms';
  likelihood: 'low' | 'medium' | 'high'; // Based on multiple reports
  lastUpdate: string; // Latest development
  updates: TransferUpdate[];
}

export interface ConfirmedTransfer extends BaseTransfer {
  status: 'confirmed' | 'medical';
  confirmedAt: string; // When it was officially confirmed
  contractLength?: string; // e.g., "4 years", "Until 2027"
  announcementUrl?: string; // Official club announcement
}

export interface TransferUpdate {
  id: string;
  content: string;
  timestamp: string;
  source: string; // Twitter handle or source name
  tier: 'tier1' | 'tier2' | 'tier3' | 'tier4';
}

// For parsing Twitter content
export interface TwitterTransferData {
  playerName?: string;
  fromClub?: string;
  toClub?: string;
  fee?: string;
  status?: TransferStatus;
  type?: TransferType;
  keywords: string[]; // Extracted keywords for matching
  confidence: number; // 0-1 confidence in extraction
}

// Common Premier League clubs for parsing
export const PREMIER_LEAGUE_CLUBS = [
  'Arsenal',
  'Aston Villa',
  'Bournemouth',
  'Brentford',
  'Brighton',
  'Chelsea',
  'Crystal Palace',
  'Everton',
  'Fulham',
  'Ipswich',
  'Leicester',
  'Liverpool',
  'Manchester City',
  'Manchester United',
  'Newcastle',
  'Nottingham Forest',
  'Southampton',
  'Tottenham',
  'West Ham',
  'Wolves',
] as const;

// Common transfer keywords for parsing
export const TRANSFER_KEYWORDS = {
  confirmed: [
    'signed',
    'confirmed',
    'official',
    'announced',
    'completed',
    'done deal',
  ],
  medical: [
    'medical',
    'medical scheduled',
    'undergoing medical',
    'medical booked',
  ],
  personal_terms: [
    'personal terms',
    'terms agreed',
    'contract agreed',
    'salary agreed',
  ],
  bid_submitted: ['bid submitted', 'offer made', 'bid lodged', 'formal offer'],
  close: ['close to', 'near to', 'almost done', 'final stages', 'imminent'],
  rumoured: ['interested', 'monitoring', 'considering', 'eyeing', 'target'],
} as const;

export const FEE_PATTERNS = {
  // Regex patterns for extracting fees
  exact: /£(\d+(?:\.\d+)?)[mk]?/gi, // £45m, £10.5m, £2k
  range: /£(\d+)-(\d+)m/gi, // £40-50m
  plus: /£(\d+)m\s*\+/gi, // £40m+
  free: /\b(free|bosman)\b/gi,
  undisclosed: /\b(undisclosed|confidential)\b/gi,
  loan: /\b(loan|temporary)\b/gi,
} as const;

// Helper types for feed organization
export type Timeframe = 'today' | 'yesterday' | 'this_week' | 'this_month';

export interface TransferFeed {
  timeframe: Timeframe;
  transfers: (RumouredTransfer | ConfirmedTransfer)[];
  lastUpdated: string;
}

export interface WeeklySummary {
  week: string; // e.g., "2024-W25"
  confirmed: ConfirmedTransfer[];
  majorRumours: RumouredTransfer[];
  totalSpent: string;
  biggestDeal: ConfirmedTransfer | null;
  mostActiveClub: string;
}
