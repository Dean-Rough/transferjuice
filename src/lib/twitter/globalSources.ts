/**
 * Global ITK Source Configuration and Management
 * Defines trusted sources worldwide with region/language detection
 */

export interface ITKSource {
  id: string;
  name: string;
  handle: string;
  tier: 1 | 2 | 3;
  reliability: number;
  region: 'UK' | 'ES' | 'IT' | 'FR' | 'DE' | 'BR' | 'GLOBAL';
  language: 'en' | 'es' | 'it' | 'fr' | 'de' | 'pt';
  specialties: string[];
  leagues: string[];
  twitterId?: string; // For API v2 user ID
  isActive: boolean;
  isShitTier?: boolean; // Flag for comedy/entertainment sources (Terry's mockery targets)
  lastChecked?: Date;
  rateLimit?: {
    remaining: number;
    resetTime: Date;
  };
}

/**
 * Tier 1: Elite sources (95%+ reliability)
 * These are the Romano, Ornstein level sources from ITK_Twitter_Handles.csv
 */
export const TIER_1_SOURCES: ITKSource[] = [
  {
    id: 'fabrizio-romano',
    name: 'Fabrizio Romano',
    handle: '@FabrizioRomano',
    tier: 1,
    reliability: 0.95,
    region: 'GLOBAL',
    language: 'en',
    specialties: ['transfers', 'here-we-go', 'contracts'],
    leagues: ['PL', 'LaLiga', 'SerieA', 'Bundesliga', 'Ligue1', 'UCL'],
    isActive: true,
  },
  {
    id: 'david-ornstein',
    name: 'David Ornstein',
    handle: '@David_Ornstein',
    tier: 1,
    reliability: 0.93,
    region: 'UK',
    language: 'en',
    specialties: ['premier-league', 'arsenal', 'exclusive'],
    leagues: ['PL'],
    isActive: true,
  },
  {
    id: 'sam-lee',
    name: 'Sam Lee',
    handle: '@SamLee',
    tier: 1,
    reliability: 0.92,
    region: 'UK',
    language: 'en',
    specialties: ['manchester-city', 'premier-league', 'exclusive'],
    leagues: ['PL'],
    isActive: true,
  },
  {
    id: 'paul-joyce',
    name: 'Paul Joyce',
    handle: '@_pauljoyce',
    tier: 1,
    reliability: 0.91,
    region: 'UK',
    language: 'en',
    specialties: ['liverpool', 'everton', 'premier-league'],
    leagues: ['PL'],
    isActive: true,
  },
  {
    id: 'laurie-whitwell',
    name: 'Laurie Whitwell',
    handle: '@lauriewhitwell',
    tier: 1,
    reliability: 0.90,
    region: 'UK',
    language: 'en',
    specialties: ['manchester-united', 'premier-league', 'athletic'],
    leagues: ['PL'],
    isActive: true,
  },
  {
    id: 'rob-dawson',
    name: 'Rob Dawson',
    handle: '@RobDawsonESPN',
    tier: 1,
    reliability: 0.89,
    region: 'UK',
    language: 'en',
    specialties: ['manchester-united', 'espn', 'premier-league'],
    leagues: ['PL'],
    isActive: true,
  },
  {
    id: 'luke-edwards',
    name: 'Luke Edwards',
    handle: '@LukeEdwardsTele',
    tier: 1,
    reliability: 0.88,
    region: 'UK',
    language: 'en',
    specialties: ['newcastle', 'premier-league', 'telegraph'],
    leagues: ['PL'],
    isActive: true,
  },
  {
    id: 'john-percy',
    name: 'John Percy',
    handle: '@JPercyTelegraph',
    tier: 1,
    reliability: 0.87,
    region: 'UK',
    language: 'en',
    specialties: ['aston-villa', 'midlands', 'telegraph'],
    leagues: ['PL'],
    isActive: true,
  },
  {
    id: 'craig-hope',
    name: 'Craig Hope',
    handle: '@CraigHope_DM',
    tier: 1,
    reliability: 0.86,
    region: 'UK',
    language: 'en',
    specialties: ['newcastle', 'premier-league', 'daily-mail'],
    leagues: ['PL'],
    isActive: true,
  },
  {
    id: 'dean-jones',
    name: 'Dean Jones',
    handle: '@DeanJonesSoccer',
    tier: 1,
    reliability: 0.85,
    region: 'UK',
    language: 'en',
    specialties: ['transfers', 'premier-league', 'teamtalk'],
    leagues: ['PL'],
    isActive: true,
  },
  {
    id: 'sirayah-shiraz',
    name: 'Sirayah Shiraz',
    handle: '@SirayahShiraz',
    tier: 1,
    reliability: 0.84,
    region: 'UK',
    language: 'en',
    specialties: ['arsenal', 'premier-league', 'exclusive'],
    leagues: ['PL'],
    isActive: true,
  },
  {
    id: 'mohamed-bouhafsi',
    name: 'Mohamed Bouhafsi',
    handle: '@BouhafsiMohamed',
    tier: 1,
    reliability: 0.92,
    region: 'FR',
    language: 'fr',
    specialties: ['ligue1', 'psg', 'french-transfers'],
    leagues: ['Ligue1', 'UCL'],
    isActive: true,
  },
  {
    id: 'gianluca-di-marzio',
    name: 'Gianluca Di Marzio',
    handle: '@DiMarzio',
    tier: 1,
    reliability: 0.91,
    region: 'IT',
    language: 'it',
    specialties: ['serie-a', 'italian-clubs', 'juventus', 'inter', 'milan'],
    leagues: ['SerieA', 'UCL'],
    isActive: true,
  },
  {
    id: 'alfredo-pedulla',
    name: 'Alfredo Pedulla',
    handle: '@alfredopedulla',
    tier: 1,
    reliability: 0.89,
    region: 'IT',
    language: 'it',
    specialties: ['serie-a', 'transfers', 'italian-football'],
    leagues: ['SerieA', 'UCL'],
    isActive: true,
  },
  {
    id: 'raphael-honigstein',
    name: 'Raphael Honigstein',
    handle: '@honigstein',
    tier: 1,
    reliability: 0.88,
    region: 'DE',
    language: 'en',
    specialties: ['bundesliga', 'bayern', 'german-football'],
    leagues: ['Bundesliga', 'UCL'],
    isActive: true,
  },
];

/**
 * Tier 2: Trusted sources (80-90% reliability)
 * Major sports outlets and regional experts
 */
export const TIER_2_SOURCES: ITKSource[] = [
  {
    id: 'sky-sports',
    name: 'Sky Sports',
    handle: '@SkySports',
    tier: 2,
    reliability: 0.8,
    region: 'UK',
    language: 'en',
    specialties: ['breaking-news', 'premier-league', 'transfer-centre'],
    leagues: ['PL', 'Championship'],
    isActive: true,
  },
  {
    id: 'marca',
    name: 'MARCA',
    handle: '@marca',
    tier: 2,
    reliability: 0.82,
    region: 'ES',
    language: 'es',
    specialties: ['real-madrid', 'la-liga', 'spanish-football'],
    leagues: ['LaLiga', 'UCL'],
    isActive: true,
  },
  {
    id: 'lequipe',
    name: "L'Équipe",
    handle: '@lequipe',
    tier: 2,
    reliability: 0.85,
    region: 'FR',
    language: 'fr',
    specialties: ['psg', 'ligue-1', 'french-football'],
    leagues: ['Ligue1', 'UCL'],
    isActive: true,
  },
  {
    id: 'espn-brasil',
    name: 'ESPN Brasil',
    handle: '@ESPNBrasil',
    tier: 2,
    reliability: 0.78,
    region: 'BR',
    language: 'pt',
    specialties: ['brazilian-players', 'south-america', 'europe-to-brazil'],
    leagues: ['PL', 'LaLiga', 'SerieA', 'Brasileirao'],
    isActive: true,
  },
  {
    id: 'gazzetta-sport',
    name: 'Gazzetta dello Sport',
    handle: '@Gazzetta_it',
    tier: 2,
    reliability: 0.81,
    region: 'IT',
    language: 'it',
    specialties: ['milan', 'juventus', 'inter', 'serie-a'],
    leagues: ['SerieA', 'UCL'],
    isActive: true,
  },
];

/**
 * Tier 2 Additional: More trusted sources
 */
export const TIER_2_ADDITIONAL: ITKSource[] = [
  {
    id: 'sky-sports-de',
    name: 'Sky Sport DE',
    handle: '@SkySportDE',
    tier: 2,
    reliability: 0.79,
    region: 'DE',
    language: 'de',
    specialties: ['bundesliga', 'bayern', 'dortmund'],
    leagues: ['Bundesliga', 'UCL'],
    isActive: true,
  },
  {
    id: 'the-athletic',
    name: 'The Athletic',
    handle: '@TheAthletic',
    tier: 2,
    reliability: 0.84,
    region: 'GLOBAL',
    language: 'en',
    specialties: ['exclusive', 'in-depth', 'premier-league'],
    leagues: ['PL', 'LaLiga', 'SerieA', 'Bundesliga', 'Ligue1'],
    isActive: true,
  },
  {
    id: 'sky-italia',
    name: 'Sky Sport Italia',
    handle: '@SkySport',
    tier: 2,
    reliability: 0.81,
    region: 'IT',
    language: 'it',
    specialties: ['serie-a', 'juventus', 'milan'],
    leagues: ['SerieA', 'UCL'],
    isActive: true,
  },
  {
    id: 'footmercato',
    name: 'Foot Mercato',
    handle: '@footmercato',
    tier: 2,
    reliability: 0.77,
    region: 'FR',
    language: 'fr',
    specialties: ['ligue1', 'psg', 'transfers'],
    leagues: ['Ligue1', 'UCL'],
    isActive: true,
  },
];

/**
 * Tier 3: Regional sources (70-80% reliability)
 * Good for breaking stories but need verification
 */
export const TIER_3_SOURCES: ITKSource[] = [
  {
    id: 'bild',
    name: 'BILD',
    handle: '@BILD',
    tier: 3,
    reliability: 0.75,
    region: 'DE',
    language: 'de',
    specialties: ['bayern-munich', 'bundesliga', 'german-football'],
    leagues: ['Bundesliga', 'UCL'],
    isActive: true,
  },
  {
    id: 'as-com',
    name: 'AS',
    handle: '@diarioas',
    tier: 3,
    reliability: 0.73,
    region: 'ES',
    language: 'es',
    specialties: ['atletico-madrid', 'barcelona', 'valencia'],
    leagues: ['LaLiga'],
    isActive: true,
  },
  {
    id: 'sport-mediaset',
    name: 'Sport Mediaset',
    handle: '@Sport_Mediaset',
    tier: 3,
    reliability: 0.72,
    region: 'IT',
    language: 'it',
    specialties: ['napoli', 'roma', 'serie-a-lower'],
    leagues: ['SerieA'],
    isActive: true,
  },
  {
    id: 'rmc-sport',
    name: 'RMC Sport',
    handle: '@RMCsport',
    tier: 3,
    reliability: 0.76,
    region: 'FR',
    language: 'fr',
    specialties: ['om', 'ol', 'ligue1-transfers'],
    leagues: ['Ligue1'],
    isActive: true,
  },
  {
    id: 'espn-fc',
    name: 'ESPN FC',
    handle: '@ESPNFC',
    tier: 3,
    reliability: 0.74,
    region: 'GLOBAL',
    language: 'en',
    specialties: ['breaking-news', 'transfers', 'global'],
    leagues: ['PL', 'LaLiga', 'SerieA', 'Bundesliga', 'Ligue1'],
    isActive: true,
  },
  {
    id: 'ben-jacobs',
    name: 'Ben Jacobs',
    handle: '@JacobsBen',
    tier: 3,
    reliability: 0.78,
    region: 'UK',
    language: 'en',
    specialties: ['chelsea', 'premier-league', 'exclusive'],
    leagues: ['PL'],
    isActive: true,
  },
  {
    id: 'nicolo-schira',
    name: 'Nicolò Schira',
    handle: '@NicoSchira',
    tier: 3,
    reliability: 0.71,
    region: 'IT',
    language: 'en',
    specialties: ['serie-a', 'transfers', 'breaking'],
    leagues: ['SerieA'],
    isActive: true,
  },
  {
    id: 'kicker',
    name: 'kicker',
    handle: '@kicker',
    tier: 3,
    reliability: 0.77,
    region: 'DE',
    language: 'de',
    specialties: ['bundesliga', 'german-clubs', 'transfers'],
    leagues: ['Bundesliga'],
    isActive: true,
  },
  {
    id: 'sport-es',
    name: 'SPORT',
    handle: '@sport',
    tier: 3,
    reliability: 0.74,
    region: 'ES',
    language: 'es',
    specialties: ['barcelona', 'la-liga', 'catalan'],
    leagues: ['LaLiga'],
    isActive: true,
  },
  {
    id: 'matt-law',
    name: 'Matt Law',
    handle: '@Matt_Law_DT',
    tier: 3,
    reliability: 0.79,
    region: 'UK',
    language: 'en',
    specialties: ['chelsea', 'premier-league', 'telegraph'],
    leagues: ['PL'],
    isActive: true,
  },
  {
    id: 'globo-esporte',
    name: 'Globo Esporte',
    handle: '@globoesporte',
    tier: 3,
    reliability: 0.76,
    region: 'BR',
    language: 'pt',
    specialties: ['brazilian-players', 'south-america', 'europe-to-brazil'],
    leagues: ['PL', 'LaLiga', 'SerieA', 'Brasileirao'],
    isActive: true,
  },
  {
    id: 'mundo-deportivo',
    name: 'Mundo Deportivo',
    handle: '@mundodeportivo',
    tier: 3,
    reliability: 0.73,
    region: 'ES',
    language: 'es',
    specialties: ['barcelona', 'spain', 'catalan-football'],
    leagues: ['LaLiga'],
    isActive: true,
  },
];

/**
 * Shit-Tier Sources: For Terry's entertainment ONLY (20-45% reliability)
 * These exist purely for Terry to mock mercilessly
 * IMPORTANT: These should be clearly marked as comedy/satire sources in the feed
 */
export const SHIT_TIER_SOURCES: ITKSource[] = [
  {
    id: 'fechejes',
    name: 'Fechejes',
    handle: '@Fechejes',
    tier: 3, // Will be overridden to Shit-Tier in display
    reliability: 0.45,
    region: 'ES',
    language: 'es',
    specialties: ['wild-speculation', 'clickbait', 'made-up-stories', 'comedy-tier'],
    leagues: ['LaLiga'],
    isActive: true,
    isShitTier: true, // Special flag for comedy sources
  },
  {
    id: 'el-chiringuito',
    name: 'El Chiringuito TV',
    handle: '@elchiringuitotv',
    tier: 3,
    reliability: 0.35,
    region: 'ES',
    language: 'es',
    specialties: ['madrid-bias', 'shouting', 'dramatic-nonsense', 'comedy-tier'],
    leagues: ['LaLiga'],
    isActive: true,
    isShitTier: true,
  },
  {
    id: 'troll-football',
    name: 'Troll Football',
    handle: '@TrollFootball',
    tier: 3,
    reliability: 0.25,
    region: 'GLOBAL',
    language: 'en',
    specialties: ['memes', 'fake-news', 'engagement-farming', 'comedy-tier'],
    leagues: ['PL', 'LaLiga', 'SerieA', 'Bundesliga', 'Ligue1'],
    isActive: true,
    isShitTier: true,
  },
  {
    id: 'football-italia',
    name: 'Football Italia Random Twitter',
    handle: '@FootItalia',
    tier: 3,
    reliability: 0.4,
    region: 'IT',
    language: 'en',
    specialties: ['serie-a-chaos', 'unverified-rumors', 'agent-gossip', 'comedy-tier'],
    leagues: ['SerieA'],
    isActive: true,
    isShitTier: true,
  },
  {
    id: 'caughtoffside',
    name: 'CaughtOffside',
    handle: '@caughtoffside',
    tier: 3,
    reliability: 0.3,
    region: 'UK',
    language: 'en',
    specialties: ['transfer-nonsense', 'daily-mail-level', 'clickbait-headlines', 'comedy-tier'],
    leagues: ['PL'],
    isActive: true,
    isShitTier: true,
  },
  {
    id: 'dont-la-una',
    name: 'Don Balón',
    handle: '@DonBalon',
    tier: 3,
    reliability: 0.35,
    region: 'ES',
    language: 'es',
    specialties: ['real-madrid-fiction', 'messi-obsession', 'fantasy-transfers', 'comedy-tier'],
    leagues: ['LaLiga'],
    isActive: true,
    isShitTier: true,
  },
  {
    id: 'teamtalk',
    name: 'TeamTalk',
    handle: '@TeamTalk',
    tier: 3,
    reliability: 0.42,
    region: 'UK',
    language: 'en',
    specialties: ['recycled-rumors', 'agent-quotes', 'weekly-nonsense', 'comedy-tier'],
    leagues: ['PL', 'Championship'],
    isActive: true,
    isShitTier: true,
  },
  {
    id: 'calciomercato-random',
    name: 'Calciomercato Random',
    handle: '@CalcioMercatoIT',
    tier: 3,
    reliability: 0.38,
    region: 'IT',
    language: 'it',
    specialties: ['juventus-propaganda', 'agent-inventions', 'deadline-day-chaos', 'comedy-tier'],
    leagues: ['SerieA'],
    isActive: true,
    isShitTier: true,
  },
];

// Combine all sources
export const ALL_ITK_SOURCES: ITKSource[] = [
  ...TIER_1_SOURCES,
  ...TIER_2_SOURCES,
  ...TIER_2_ADDITIONAL,
  ...TIER_3_SOURCES,
  ...SHIT_TIER_SOURCES,
];

// Export GLOBAL_ITK_SOURCES as an alias for ALL_ITK_SOURCES
export const GLOBAL_ITK_SOURCES = ALL_ITK_SOURCES;

// Transfer-related keywords by language
export const TRANSFER_KEYWORDS = {
  en: [
    'signing',
    'transfer',
    'medical',
    'fee',
    'contract',
    'bid',
    'offer',
    'deal',
    'agreement',
    'personal terms',
    'here we go',
    'done deal',
    'confirmed',
    'breaking',
    'exclusive',
    'official',
    '🚨', // Breaking news emoji
    '✅', // Confirmed emoji
  ],
  es: [
    'fichaje',
    'traspaso',
    'contrato',
    'oferta',
    'acuerdo',
    'confirmado',
    'oficial',
    'exclusiva',
    'última hora',
    'reconocimiento médico',
    'fee', // Often used in Spanish tweets
    '🚨',
    '✅',
  ],
  it: [
    'trasferimento',
    'contratto',
    'offerta',
    'accordo',
    'ufficiale',
    'confermato',
    'esclusiva',
    'visite mediche',
    'calciomercato',
    'trattativa',
    '🚨',
    '✅',
  ],
  fr: [
    'transfert',
    'contrat',
    'offre',
    'accord',
    'officiel',
    'confirmé',
    'exclusif',
    'visite médicale',
    'mercato',
    'négociation',
    '🚨',
    '✅',
  ],
  de: [
    'transfer',
    'vertrag',
    'angebot',
    'vereinbarung',
    'offiziell',
    'bestätigt',
    'exklusiv',
    'medizincheck',
    'wechsel',
    'verhandlung',
    '🚨',
    '✅',
  ],
  pt: [
    'transferência',
    'contrato',
    'oferta',
    'acordo',
    'oficial',
    'confirmado',
    'exclusivo',
    'exames médicos',
    'mercado',
    'negociação',
    '🚨',
    '✅',
  ],
};

/**
 * Get sources by region
 */
export const getSourcesByRegion = (
  region: ITKSource['region']
): ITKSource[] => {
  return ALL_ITK_SOURCES.filter((source) => source.region === region);
};

/**
 * Get sources by tier
 */
export const getSourcesByTier = (tier: 1 | 2 | 3): ITKSource[] => {
  return ALL_ITK_SOURCES.filter((source) => source.tier === tier);
};

/**
 * Get sources by language
 */
export const getSourcesByLanguage = (
  language: ITKSource['language']
): ITKSource[] => {
  return ALL_ITK_SOURCES.filter((source) => source.language === language);
};

/**
 * Get transfer keywords for a language
 */
export const getTransferKeywords = (
  language: ITKSource['language']
): string[] => {
  return TRANSFER_KEYWORDS[language] || TRANSFER_KEYWORDS.en;
};

/**
 * Get active sources (for monitoring)
 */
export const getActiveSources = (): ITKSource[] => {
  return ALL_ITK_SOURCES.filter((source) => source.isActive);
};

/**
 * Get source by handle (for tweet processing)
 */
export const getSourceByHandle = (handle: string): ITKSource | undefined => {
  const normalizedHandle = handle.startsWith('@') ? handle : `@${handle}`;
  return ALL_ITK_SOURCES.find(
    (source) => source.handle.toLowerCase() === normalizedHandle.toLowerCase()
  );
};

/**
 * Update source rate limit info
 */
export const updateSourceRateLimit = (
  sourceId: string,
  remaining: number,
  resetTime: Date
): void => {
  const source = ALL_ITK_SOURCES.find((s) => s.id === sourceId);
  if (source) {
    source.rateLimit = { remaining, resetTime };
    source.lastChecked = new Date();
  }
};

/**
 * Check if source is rate limited
 */
export const isSourceRateLimited = (sourceId: string): boolean => {
  const source = ALL_ITK_SOURCES.find((s) => s.id === sourceId);
  if (!source?.rateLimit) return false;

  return (
    source.rateLimit.remaining <= 0 && new Date() < source.rateLimit.resetTime
  );
};

/**
 * Get available sources (not rate limited)
 */
export const getAvailableSources = (): ITKSource[] => {
  return getActiveSources().filter((source) => !isSourceRateLimited(source.id));
};

/**
 * Priority order for monitoring (Tier 1 first, then by reliability)
 */
export const getMonitoringPriority = (): ITKSource[] => {
  return getAvailableSources().sort((a, b) => {
    if (a.tier !== b.tier) {
      return a.tier - b.tier; // Lower tier number = higher priority
    }
    return b.reliability - a.reliability; // Higher reliability = higher priority
  });
};
