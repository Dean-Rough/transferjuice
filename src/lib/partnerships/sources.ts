/**
 * Partner Content Sources Configuration
 * Ethical attribution for quality football content during quiet periods
 */

export interface PartnerSource {
  id: string;
  name: string;
  platform: 'website' | 'podcast' | 'radio' | 'social';
  url?: string;
  handle?: string; // Twitter/X handle
  tone: 'scandal' | 'banter' | 'investigative' | 'comedy' | 'news' | 'mixed';
  description: string;
  categories: string[];
  isActive: boolean;
  attributionTemplate: string; // How Terry introduces their content
  contentTypes: ('article' | 'episode' | 'story' | 'video')[];
}

/**
 * Website and Social Media Sources
 * For viral stories, scandals, and football culture content
 */
export const WEBSITE_SOURCES: PartnerSource[] = [
  {
    id: 'sportbible',
    name: 'SportBible',
    platform: 'website',
    url: 'https://www.sportbible.com/',
    handle: '@sportbible',
    tone: 'scandal',
    description: 'Viral sports news, player antics, memes',
    categories: ['viral', 'scandal', 'player-antics', 'memes'],
    isActive: true,
    attributionTemplate: 'The lads at SportBible have uncovered',
    contentTypes: ['article', 'video'],
  },
  {
    id: 'daily-star-football',
    name: 'Daily Star Football',
    platform: 'website',
    url: 'https://www.dailystar.co.uk/sport/football/',
    handle: '@DailyStar_Sport',
    tone: 'scandal',
    description: 'Scandal-heavy tabloid sports section',
    categories: ['scandal', 'tabloid', 'controversy'],
    isActive: true,
    attributionTemplate: 'Even the Daily Star couldn\'t make this up',
    contentTypes: ['article'],
  },
  {
    id: 'planet-football',
    name: 'Planet Football',
    platform: 'website',
    url: 'https://www.planetfootball.com/',
    handle: '@planetfootball',
    tone: 'mixed',
    description: 'Cult stories, retrospectives, and niche football content',
    categories: ['cult-stories', 'retrospective', 'niche', 'history'],
    isActive: true,
    attributionTemplate: 'Planet Football reminded me of',
    contentTypes: ['article'],
  },
  {
    id: 'reddit-soccer',
    name: 'Reddit r/soccer',
    platform: 'social',
    url: 'https://www.reddit.com/r/soccer/',
    handle: null,
    tone: 'scandal',
    description: 'Community-sourced viral football stories and memes',
    categories: ['community', 'viral', 'memes', 'discussion'],
    isActive: true,
    attributionTemplate: 'The Reddit hivemind has discovered',
    contentTypes: ['story'],
  },
];

/**
 * Podcast Sources
 * For longer-form stories and football culture deep dives
 */
export const PODCAST_SOURCES: PartnerSource[] = [
  {
    id: 'the-upshot',
    name: 'The Upshot',
    platform: 'podcast',
    url: null, // Add when available
    handle: '@TheUpshotPod',
    tone: 'banter',
    description: 'Sex scandals, double-deals, holiday horror',
    categories: ['scandal', 'behind-scenes', 'player-stories'],
    isActive: true,
    attributionTemplate: 'Speaking of absolute chaos, The Upshot covered',
    contentTypes: ['episode'],
  },
  {
    id: 'football-culture-movement',
    name: 'Football Culture Movement',
    platform: 'podcast',
    url: null,
    handle: null,
    tone: 'investigative',
    description: 'Player deaths, match-fixing, bribery',
    categories: ['investigative', 'serious', 'documentary'],
    isActive: true,
    attributionTemplate: 'For those who want the dark truth, Football Culture Movement exposed',
    contentTypes: ['episode'],
  },
  {
    id: 'athletico-mince',
    name: 'Athletico Mince',
    platform: 'podcast',
    url: null,
    handle: '@AthleticoMince',
    tone: 'comedy',
    description: 'Absurd pub tales, cult football myths',
    categories: ['comedy', 'surreal', 'stories'],
    isActive: true,
    attributionTemplate: 'In completely unrelated madness, Bob Mortimer told',
    contentTypes: ['episode'],
  },
  {
    id: 'the-football-ramble',
    name: 'The Football Ramble',
    platform: 'podcast',
    url: null,
    handle: '@FootballRamble',
    tone: 'mixed',
    description: 'Transfer gossip meets off-pitch antics',
    categories: ['news', 'gossip', 'antics', 'analysis'],
    isActive: true,
    attributionTemplate: 'The Football Ramble boys were discussing',
    contentTypes: ['episode'],
  },
  {
    id: 'set-piece-menu',
    name: 'Set Piece Menu',
    platform: 'podcast',
    url: null,
    handle: '@SetPieceMenu',
    tone: 'investigative',
    description: 'Dressing room secrets, biz skulduggery',
    categories: ['business', 'behind-scenes', 'insider'],
    isActive: true,
    attributionTemplate: 'Set Piece Menu pulled back the curtain on',
    contentTypes: ['episode'],
  },
];

/**
 * Radio Sources
 */
export const RADIO_SOURCES: PartnerSource[] = [
  {
    id: 'fighting-talk',
    name: 'Fighting Talk',
    platform: 'radio',
    url: null,
    handle: null,
    tone: 'banter',
    description: 'Weird on-field incidents, hot takes',
    categories: ['opinion', 'incidents', 'debate'],
    isActive: true,
    attributionTemplate: 'Fighting Talk brought up the time when',
    contentTypes: ['episode'],
  },
];

/**
 * All partner sources combined
 */
export const ALL_PARTNER_SOURCES: PartnerSource[] = [
  ...WEBSITE_SOURCES,
  ...PODCAST_SOURCES,
  ...RADIO_SOURCES,
];

/**
 * Get sources by platform
 */
export const getSourcesByPlatform = (
  platform: PartnerSource['platform']
): PartnerSource[] => {
  return ALL_PARTNER_SOURCES.filter(source => source.platform === platform);
};

/**
 * Get sources by tone
 */
export const getSourcesByTone = (
  tone: PartnerSource['tone']
): PartnerSource[] => {
  return ALL_PARTNER_SOURCES.filter(source => source.tone === tone);
};

/**
 * Get active sources only
 */
export const getActiveSources = (): PartnerSource[] => {
  return ALL_PARTNER_SOURCES.filter(source => source.isActive);
};

/**
 * Get source by ID
 */
export const getSourceById = (id: string): PartnerSource | undefined => {
  return ALL_PARTNER_SOURCES.find(source => source.id === id);
};

/**
 * Generate Terry's attribution for a source
 */
export const generateAttribution = (
  sourceId: string,
  contentTitle: string,
  url?: string
): string => {
  const source = getSourceById(sourceId);
  if (!source) return '';
  
  const attribution = `${source.attributionTemplate} "${contentTitle}"`;
  
  if (url) {
    return `${attribution} (<a href="${url}" target="_blank" rel="noopener noreferrer">${source.name}</a>)`;
  }
  
  return `${attribution} (${source.name})`;
};

/**
 * Content discovery priorities
 * Used during quiet periods to select appropriate partner content
 */
export const CONTENT_PRIORITIES = {
  // During transfer deadline day - focus on chaos
  deadlineDay: ['scandal', 'banter', 'mixed'],
  
  // Normal quiet periods - balance of content
  quietPeriod: ['banter', 'mixed', 'comedy'],
  
  // Weekend content - lighter tone
  weekend: ['comedy', 'banter', 'scandal'],
  
  // Serious news context - investigative content
  seriousContext: ['investigative', 'news'],
};

/**
 * Terry's intro variations for partner content
 */
export const TERRY_PARTNER_INTROS = [
  "Right, while we wait for someone to actually sign something,",
  "In the absence of actual transfer news,",
  "Since the ITK crowd have gone for a collective nap,",
  "While Fabrizio recharges his Twitter fingers,",
  "During this brief moment of transfer silence,",
  "As we endure another quiet spell in the chaos,",
  "In completely unrelated but equally mental news,",
  "Speaking of football madness,",
  "This reminds me of something equally ridiculous,",
  "While we're on the subject of football nonsense,",
];

/**
 * Partner content categories for smart mixing
 */
export const CONTENT_CATEGORIES = {
  scandal: {
    weight: 0.3,
    maxPerBriefing: 1,
    terryTone: 'shocked-but-entertained',
  },
  banter: {
    weight: 0.4,
    maxPerBriefing: 2,
    terryTone: 'amused-agreement',
  },
  investigative: {
    weight: 0.15,
    maxPerBriefing: 1,
    terryTone: 'serious-but-sarcastic',
  },
  comedy: {
    weight: 0.15,
    maxPerBriefing: 1,
    terryTone: 'laughing-along',
  },
};