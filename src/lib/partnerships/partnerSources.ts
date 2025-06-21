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
