/**
 * Partner Content Sources
 * Ethical content partnerships for quiet ITK periods
 */

export interface PartnerSource {
  id: string;
  name: string;
  website: string;
  description: string;
  category: 'analysis' | 'news' | 'entertainment' | 'tactical';
  rss_url?: string;
  api_endpoint?: string;
  credibility: number; // 0-1 scale
  update_frequency: 'daily' | 'hourly' | 'weekly';
  tags: string[];
  attribution_format: string;
}

export const PARTNER_SOURCES: PartnerSource[] = [
  // Podcast Sources from CSV
  {
    id: 'the-upshot-podcast',
    name: 'The Upshot Podcast',
    website: 'https://www.theupshot.co.uk/podcast',
    description: 'Sex scandals, double-deals, holiday horror - outrageous football stories',
    category: 'entertainment',
    credibility: 0.83,
    update_frequency: 'weekly',
    tags: ['podcast', 'scandal', 'banter', 'outrageous-facts'],
    attribution_format: 'As brilliantly covered by {source} - {website}',
  },
  {
    id: 'football-culture-movement',
    name: 'Football Culture Movement',
    website: 'https://footballculturemovement.com',
    description: 'Player deaths, match-fixing, bribery - investigative football journalism',
    category: 'analysis',
    credibility: 0.86,
    update_frequency: 'weekly',
    tags: ['podcast', 'investigative', 'documentary', 'serious'],
    attribution_format: 'Investigated by {source} - {website}',
  },
  {
    id: 'athletico-mince',
    name: 'Athletico Mince',
    website: 'https://athleticomince.com',
    description: 'Absurd pub tales, cult football myths - comedy surrealism',
    category: 'entertainment',
    credibility: 0.75,
    update_frequency: 'weekly',
    tags: ['podcast', 'comedy', 'surreal', 'bob-mortimer'],
    attribution_format: 'Bob Mortimer told this one on {source} - {website}',
  },
  {
    id: 'fighting-talk',
    name: 'Fighting Talk',
    website: 'https://www.bbc.co.uk/programmes/b00858tf',
    description: 'Weird on-field incidents, hot takes - opinionated radio show',
    category: 'entertainment',
    credibility: 0.82,
    update_frequency: 'weekly',
    tags: ['radio', 'opinion', 'spicy-takes', 'incidents'],
    attribution_format: 'Discussed on {source} - {website}',
  },
  {
    id: 'set-piece-menu',
    name: 'Set Piece Menu',
    website: 'https://setpiecemenu.com',
    description: 'Dressing room secrets, biz skulduggery - pro insights',
    category: 'analysis',
    credibility: 0.84,
    update_frequency: 'weekly',
    tags: ['podcast', 'insider', 'business', 'secrets'],
    attribution_format: 'Revealed by {source} - {website}',
  },
  
  // Website Sources from CSV
  {
    id: 'sportbible',
    name: 'SportBible',
    website: 'https://www.sportbible.com/',
    description: 'Viral sports news, player antics, memes',
    category: 'entertainment',
    credibility: 0.78,
    update_frequency: 'hourly',
    tags: ['viral', 'scandal', 'memes', 'player-antics'],
    attribution_format: 'The lads at {source} spotted this - {website}',
  },
  {
    id: 'daily-star-football',
    name: 'Daily Star Football',
    website: 'https://www.dailystar.co.uk/sport/football/',
    description: 'Scandal-heavy tabloid sports section',
    category: 'entertainment',
    credibility: 0.72,
    update_frequency: 'hourly',
    tags: ['scandal', 'tabloid', 'viral-news'],
    attribution_format: 'Even {source} couldn\'t make this up - {website}',
  },
  {
    id: 'planet-football',
    name: 'Planet Football',
    website: 'https://www.planetfootball.com/',
    description: 'Cult stories, retrospectives, and niche football content',
    category: 'entertainment',
    credibility: 0.80,
    update_frequency: 'daily',
    tags: ['cult-stories', 'retrospectives', 'niche-content'],
    attribution_format: 'Unearthed by {source} - {website}',
  },
  {
    id: 'reddit-soccer',
    name: 'Reddit r/soccer',
    website: 'https://www.reddit.com/r/soccer/',
    description: 'Community-sourced viral football stories and memes',
    category: 'entertainment',
    credibility: 0.70,
    update_frequency: 'hourly',
    tags: ['community', 'viral', 'memes', 'discussion'],
    attribution_format: 'The Reddit crowd discovered this - {website}',
  },
  
  // Original Sources (keeping the good ones)
  {
    id: 'the-upshot',
    name: 'The Upshot',
    website: 'https://www.theupshot.co.uk',
    description: 'Independent football analysis and tactical insights',
    category: 'analysis',
    rss_url: 'https://www.theupshot.co.uk/feed',
    credibility: 0.88,
    update_frequency: 'daily',
    tags: ['tactics', 'analysis', 'premier-league', 'championship'],
    attribution_format: 'Originally published by {source} - {website}',
  },
  {
    id: 'fourfourtwo',
    name: 'FourFourTwo',
    website: 'https://www.fourfourtwo.com',
    description: 'Football magazine with transfer news and features',
    category: 'news',
    rss_url: 'https://www.fourfourtwo.com/feed',
    credibility: 0.85,
    update_frequency: 'hourly',
    tags: ['transfers', 'interviews', 'features', 'international'],
    attribution_format: 'Via {source} - Read the full story at {website}',
  },
  {
    id: 'football-ramble',
    name: 'Football Ramble',
    website: 'https://www.thefootballramble.com',
    description: 'Football podcast and blog content',
    category: 'entertainment',
    rss_url: 'https://www.thefootballramble.com/feed',
    credibility: 0.82,
    update_frequency: 'daily',
    tags: ['podcast', 'discussion', 'opinion', 'entertainment'],
    attribution_format:
      'From {source} - Listen to the full episode at {website}',
  },
  {
    id: 'tifo',
    name: 'Tifo Football',
    website: 'https://www.tifofootball.com',
    description: 'Tactical analysis and football data visualization',
    category: 'tactical',
    rss_url: 'https://www.tifofootball.com/feed',
    credibility: 0.91,
    update_frequency: 'weekly',
    tags: ['tactics', 'data', 'visualization', 'analysis'],
    attribution_format:
      'Analysis from {source} - See full tactical breakdown at {website}',
  },
  {
    id: 'athletic',
    name: 'The Athletic',
    website: 'https://www.theathletic.com',
    description: 'Premium sports journalism and in-depth reporting',
    category: 'news',
    credibility: 0.93,
    update_frequency: 'hourly',
    tags: ['premium', 'journalism', 'transfers', 'exclusive'],
    attribution_format:
      'Premium content from {source} - Full article available to subscribers at {website}',
  },
  {
    id: 'guardian-football',
    name: 'The Guardian Football',
    website: 'https://www.theguardian.com/football',
    description: "The Guardian's football coverage",
    category: 'news',
    rss_url: 'https://www.theguardian.com/football/rss',
    credibility: 0.89,
    update_frequency: 'hourly',
    tags: ['news', 'premier-league', 'transfers', 'international'],
    attribution_format: 'From {source} - Read more at {website}',
  },
  {
    id: 'sky-sports-football',
    name: 'Sky Sports Football',
    website: 'https://www.skysports.com/football',
    description: 'Sky Sports football news and transfer coverage',
    category: 'news',
    credibility: 0.84,
    update_frequency: 'hourly',
    tags: ['breaking', 'transfers', 'premier-league', 'sky-exclusive'],
    attribution_format:
      'Breaking from {source} - Watch highlights at {website}',
  },
  {
    id: 'bbc-sport-football',
    name: 'BBC Sport Football',
    website: 'https://www.bbc.co.uk/sport/football',
    description: "BBC's comprehensive football coverage",
    category: 'news',
    rss_url: 'https://feeds.bbci.co.uk/sport/football/rss.xml',
    credibility: 0.92,
    update_frequency: 'hourly',
    tags: [
      'news',
      'transfers',
      'premier-league',
      'international',
      'bbc-exclusive',
    ],
    attribution_format: 'BBC Sport reports - Full coverage at {website}',
  },
];

export function getPartnerSourceById(id: string): PartnerSource | undefined {
  return PARTNER_SOURCES.find((source) => source.id === id);
}

export function getPartnerSourcesByCategory(
  category: PartnerSource['category']
): PartnerSource[] {
  return PARTNER_SOURCES.filter((source) => source.category === category);
}

export function getHighCredibilityPartners(): PartnerSource[] {
  return PARTNER_SOURCES.filter((source) => source.credibility >= 0.85);
}

export function getActivePartnerSources(): PartnerSource[] {
  return PARTNER_SOURCES.filter(
    (source) =>
      source.update_frequency === 'hourly' ||
      source.update_frequency === 'daily'
  );
}

export function formatAttribution(
  source: PartnerSource,
  articleUrl?: string
): string {
  return source.attribution_format
    .replace('{source}', source.name)
    .replace('{website}', articleUrl || source.website);
}
