/**
 * Demo Feed Data
 * Sample transfer feed items for development and demonstration
 */

import { type FeedItem } from '@/lib/stores/feedStore';

export const DEMO_FEED_DATA: FeedItem[] = [
  {
    id: 'demo-1',
    type: 'breaking',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    content:
      '🚨 BREAKING: Arsenal agree €65M fee for Declan Rice! Medical scheduled for tomorrow. Personal terms already agreed. Here we go! ✅',
    terryCommentary:
      'Right, Arsenal spending €65M on Declan Rice is either genius or the most expensive way to disappoint their fanbase.',
    source: {
      name: 'Fabrizio Romano',
      handle: '@FabrizioRomano',
      tier: 1,
      reliability: 0.95,
      region: 'GLOBAL',
    },
    tags: {
      clubs: ['Arsenal'],
      players: ['Declan Rice'],
      sources: ['Fabrizio Romano'],
    },
    engagement: {
      shares: 847,
      reactions: 3201,
      clicks: 156,
    },
    metadata: {
      transferType: 'confirmed',
      priority: 'breaking',
      relevanceScore: 0.95,
      league: 'PL',
    },
  },
  {
    id: 'demo-2',
    type: 'itk',
    timestamp: new Date(Date.now() - 32 * 60 * 1000), // 32 minutes ago
    content:
      'Personal terms agreed between Kylian Mbappé and Real Madrid. Club-to-club negotiations ongoing for final fee structure. Deal expected to be completed within 48-72 hours.',
    terryCommentary:
      'When David Ornstein says something, football Twitter collectively holds its breath. Kylian Mbappé to Real Madrid is as good as done.',
    source: {
      name: 'David Ornstein',
      handle: '@David_Ornstein',
      tier: 1,
      reliability: 0.93,
      region: 'UK',
    },
    tags: {
      clubs: ['Real Madrid'],
      players: ['Kylian Mbappé'],
      sources: ['David Ornstein'],
    },
    engagement: {
      shares: 623,
      reactions: 2187,
      clicks: 89,
    },
    metadata: {
      transferType: 'personal_terms',
      priority: 'high',
      relevanceScore: 0.91,
      league: 'LaLiga',
    },
  },
  {
    id: 'demo-3',
    type: 'itk',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    content:
      'UFFICIALE: Juventus confermato accordo per Victor Osimhen! Visite mediche programmate per domani mattina. Contratto di 5 anni. 🇳🇬⚫⚪',
    terryCommentary:
      'Gianluca Di Marzio with the Italian exclusive. Victor Osimhen to Juventus because apparently Serie A needed more drama.',
    source: {
      name: 'Gianluca Di Marzio',
      handle: '@DiMarzio',
      tier: 1,
      reliability: 0.9,
      region: 'IT',
    },
    tags: {
      clubs: ['Juventus'],
      players: ['Victor Osimhen'],
      sources: ['Gianluca Di Marzio'],
    },
    engagement: {
      shares: 445,
      reactions: 1634,
      clicks: 67,
    },
    metadata: {
      transferType: 'confirmed',
      priority: 'high',
      relevanceScore: 0.87,
      league: 'SerieA',
    },
  },
  {
    id: 'demo-4',
    type: 'partner',
    timestamp: new Date(Date.now() - 65 * 60 * 1000), // 1 hour 5 minutes ago
    content:
      "Tactical Analysis: How Arsenal's transfer strategy is shaping their season. Deep dive into Arsenal's recent transfer decisions and their tactical implications for the upcoming matches.",
    terryCommentary:
      'Quality content from The Upshot to fill the void between "Here we go!" announcements.',
    source: {
      name: 'The Upshot',
      tier: 2,
      reliability: 0.88,
      region: 'UK',
    },
    tags: {
      clubs: ['Arsenal'],
      players: [],
      sources: ['The Upshot'],
    },
    engagement: {
      shares: 89,
      reactions: 234,
      clicks: 145,
    },
    metadata: {
      priority: 'medium',
      relevanceScore: 0.75,
      league: 'PL',
      attribution:
        'Originally published by The Upshot - https://www.theupshot.co.uk',
      originalUrl:
        'https://www.theupshot.co.uk/article/arsenal-transfer-strategy',
    },
  },
  {
    id: 'demo-5',
    type: 'itk',
    timestamp: new Date(Date.now() - 78 * 60 * 1000), // 1 hour 18 minutes ago
    content:
      'Bayern Munich officials confident about completing Jamal Musiala contract extension. New deal until 2029 with significant salary increase. Announcement expected this week.',
    source: {
      name: 'Sky Sports',
      handle: '@SkySports',
      tier: 2,
      reliability: 0.8,
      region: 'UK',
    },
    tags: {
      clubs: ['Bayern Munich'],
      players: ['Jamal Musiala'],
      sources: ['Sky Sports'],
    },
    engagement: {
      shares: 234,
      reactions: 897,
      clicks: 45,
    },
    metadata: {
      transferType: 'signing',
      priority: 'medium',
      relevanceScore: 0.72,
      league: 'Bundesliga',
    },
  },
  {
    id: 'demo-6',
    type: 'itk',
    timestamp: new Date(Date.now() - 95 * 60 * 1000), // 1 hour 35 minutes ago
    content:
      'EXCLUSIVE: Manchester United monitoring Pedri situation at Barcelona. Initial contact made with player representatives. No formal bid yet but interest is genuine.',
    terryCommentary:
      'Manchester United "monitoring" a player is code for "we\'ll probably sign someone else entirely in six months."',
    source: {
      name: 'MARCA',
      handle: '@marca',
      tier: 2,
      reliability: 0.82,
      region: 'ES',
    },
    tags: {
      clubs: ['Manchester United', 'Barcelona'],
      players: ['Pedri'],
      sources: ['MARCA'],
    },
    engagement: {
      shares: 345,
      reactions: 1256,
      clicks: 78,
    },
    metadata: {
      transferType: 'rumour',
      priority: 'medium',
      relevanceScore: 0.69,
      league: 'PL',
    },
  },
  {
    id: 'demo-7',
    type: 'itk',
    timestamp: new Date(Date.now() - 112 * 60 * 1000), // 1 hour 52 minutes ago
    content:
      'Chelsea preparing improved offer for Rafael Leão. AC Milan want €120M, Chelsea willing to pay €100M plus bonuses. Player keen on Premier League move.',
    terryCommentary:
      "€120M for Rafael Leão? That's either shrewd business or the most expensive midlife crisis in football history.",
    source: {
      name: "L'Équipe",
      tier: 2,
      reliability: 0.85,
      region: 'FR',
    },
    tags: {
      clubs: ['Chelsea', 'AC Milan'],
      players: ['Rafael Leão'],
      sources: ["L'Équipe"],
    },
    engagement: {
      shares: 278,
      reactions: 967,
      clicks: 56,
    },
    metadata: {
      transferType: 'bid',
      priority: 'medium',
      relevanceScore: 0.78,
      league: 'PL',
    },
  },
  {
    id: 'demo-8',
    type: 'itk',
    timestamp: new Date(Date.now() - 135 * 60 * 1000), // 2 hours 15 minutes ago
    content:
      'Liverpool close to securing João Palhinha deal. West Ham demanding £40M, Liverpool confident of agreement at £35M plus add-ons. Medical could be arranged quickly.',
    source: {
      name: 'The Times',
      tier: 2,
      reliability: 0.83,
      region: 'UK',
    },
    tags: {
      clubs: ['Liverpool', 'West Ham'],
      players: ['João Palhinha'],
      sources: ['The Times'],
    },
    engagement: {
      shares: 189,
      reactions: 743,
      clicks: 34,
    },
    metadata: {
      transferType: 'bid',
      priority: 'medium',
      relevanceScore: 0.71,
      league: 'PL',
    },
  },
  {
    id: 'demo-9',
    type: 'itk',
    timestamp: new Date(Date.now() - 158 * 60 * 1000), // 2 hours 38 minutes ago
    content:
      "PSG exploring move for Marcus Rashford. Manchester United open to offers over €80M. Player's representatives in contact with multiple clubs.",
    terryCommentary:
      'PSG "exploring" Marcus Rashford like they explore every winger who\'s had a decent season. Spoiler: they\'ll sign someone completely different.',
    source: {
      name: 'RMC Sport',
      tier: 2,
      reliability: 0.79,
      region: 'FR',
    },
    tags: {
      clubs: ['PSG', 'Manchester United'],
      players: ['Marcus Rashford'],
      sources: ['RMC Sport'],
    },
    engagement: {
      shares: 412,
      reactions: 1534,
      clicks: 98,
    },
    metadata: {
      transferType: 'rumour',
      priority: 'medium',
      relevanceScore: 0.76,
      league: 'PL',
    },
  },
  {
    id: 'demo-10',
    type: 'itk',
    timestamp: new Date(Date.now() - 185 * 60 * 1000), // 3 hours 5 minutes ago
    content:
      'Tottenham target Ivan Toney as Harry Kane replacement. Brentford valuation around €60M. Spurs willing to meet asking price if Kane deal materializes.',
    source: {
      name: 'Football London',
      tier: 3,
      reliability: 0.72,
      region: 'UK',
    },
    tags: {
      clubs: ['Tottenham', 'Brentford'],
      players: ['Ivan Toney', 'Harry Kane'],
      sources: ['Football London'],
    },
    engagement: {
      shares: 156,
      reactions: 623,
      clicks: 29,
    },
    metadata: {
      transferType: 'rumour',
      priority: 'low',
      relevanceScore: 0.65,
      league: 'PL',
    },
  },
];

/**
 * Get demo feed data with realistic timestamps
 */
export function getDemoFeedData(): FeedItem[] {
  // Keep timestamps as Date objects as expected by the store
  return DEMO_FEED_DATA.map((item) => ({
    ...item,
    timestamp: new Date(item.timestamp), // Ensure it's a proper Date object
  }));
}

/**
 * Simulate loading more demo data
 */
export function getMoreDemoFeedData(offset: number = 0): FeedItem[] {
  const baseData = getDemoFeedData();

  // Create additional items by duplicating and modifying existing ones
  const additionalItems = baseData.map((item, index) => ({
    ...item,
    id: `demo-${offset}-${index + 1}`,
    timestamp: new Date(
      Date.now() - (200 + offset * 30 + index * 15) * 60 * 1000
    ),
    engagement: {
      shares: Math.floor(Math.random() * 500),
      reactions: Math.floor(Math.random() * 2000),
      clicks: Math.floor(Math.random() * 100),
    },
  }));

  return additionalItems;
}
