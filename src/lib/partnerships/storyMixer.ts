/**
 * Story Mixer - Smart Content Padding System
 * 
 * During quiet transfer periods, mix in engaging football stories
 * from partner sources with proper attribution:
 * - The Upshot (player antics and culture)
 * - FourFourTwo (historical chaos and features)
 * - Football Ramble (weekly mishaps and comedy)
 * - The Athletic (deep dives and analysis)
 * - Reddit r/soccer (community stories)
 */

export interface EngagingStory {
  id: string;
  content: string;
  title: string;
  summary: string;
  url: string;
  source: {
    name: string;
    url: string;
    type: 'partner' | 'community' | 'official';
  };
  attribution: string; // "The brilliant lads at [The Football Ramble](link) covered this perfectly..."
  tags: Array<{
    name: string;
    type: 'club' | 'player' | 'source';
  }>;
  category: 'antics' | 'historical' | 'analysis' | 'community' | 'culture';
  publishedAt: Date;
  engagementScore: number; // 0-100
}

export interface StoryMixerOptions {
  minRequired: number;
  sources: string[];
  categories?: string[];
  maxAge?: number; // hours
}

/**
 * Get engaging football stories for content padding
 */
export async function getEngagingStories(options: StoryMixerOptions): Promise<EngagingStory[]> {
  const {
    minRequired,
    sources,
    categories = ['antics', 'historical', 'culture'],
    maxAge = 168 // 1 week
  } = options;

  console.log(`🎭 Fetching ${minRequired} engaging stories from ${sources.length} sources`);
  
  const allStories: EngagingStory[] = [];
  
  try {
    // Fetch stories from each source
    for (const source of sources) {
      const stories = await getStoriesFromSource(source, maxAge);
      allStories.push(...stories);
    }
    
    // Filter by categories
    const filteredStories = allStories.filter(story => 
      categories.includes(story.category)
    );
    
    // Sort by engagement score and recency
    const sortedStories = filteredStories.sort((a, b) => {
      const aScore = a.engagementScore + getRecencyBonus(a.publishedAt);
      const bScore = b.engagementScore + getRecencyBonus(b.publishedAt);
      return bScore - aScore;
    });
    
    // Return top stories
    const selectedStories = sortedStories.slice(0, minRequired);
    
    console.log(`✅ Selected ${selectedStories.length} engaging stories`);
    return selectedStories;
    
  } catch (error) {
    console.error('❌ Failed to get engaging stories:', error);
    return [];
  }
}

/**
 * Get stories from a specific source
 */
async function getStoriesFromSource(sourceName: string, maxAge: number): Promise<EngagingStory[]> {
  switch (sourceName.toLowerCase()) {
    case 'theupshot':
      return await getUpshotStories(maxAge);
    case 'fourfourtwo':
      return await getFourFourTwoStories(maxAge);
    case 'footballramble':
      return await getFootballRambleStories(maxAge);
    case 'theathletic':
      return await getAthleticStories(maxAge);
    case 'reddit':
      return await getRedditStories(maxAge);
    default:
      console.warn(`Unknown source: ${sourceName}`);
      return [];
  }
}

/**
 * Get stories from The Upshot (player antics and culture)
 */
async function getUpshotStories(maxAge: number): Promise<EngagingStory[]> {
  try {
    // In a real implementation, this would fetch from The Upshot's RSS/API
    // For now, return curated examples
    return [
      {
        id: 'upshot_1',
        content: 'Erling Haaland spotted at Manchester Tesco Metro buying 47 bananas and nothing else, reportedly for "pre-match fuel optimization"',
        title: 'Haaland\'s Banana Strategy Revealed',
        summary: 'The Norwegian striker\'s peculiar shopping habits continue to baffle nutritionists',
        url: 'https://theupshot.co.uk/haaland-banana-strategy',
        source: {
          name: 'The Upshot',
          url: 'https://theupshot.co.uk',
          type: 'partner'
        },
        attribution: 'The brilliant lads at [The Upshot](https://theupshot.co.uk) covered this perfectly...',
        tags: [
          { name: 'Haaland', type: 'player' },
          { name: 'Manchester City', type: 'club' }
        ],
        category: 'antics',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        engagementScore: 85
      },
      {
        id: 'upshot_2',
        content: 'Arsenal\'s Mikel Arteta reportedly practicing "passionate touchline celebrations" in front of mirror for 2 hours daily',
        title: 'Arteta\'s Secret Celebration Training',
        summary: 'Sources close to the manager reveal his dedication to perfecting sideline passion',
        url: 'https://theupshot.co.uk/arteta-celebration-training',
        source: {
          name: 'The Upshot',
          url: 'https://theupshot.co.uk',
          type: 'partner'
        },
        attribution: 'The brilliant lads at [The Upshot](https://theupshot.co.uk) uncovered this gem...',
        tags: [
          { name: 'Arteta', type: 'player' },
          { name: 'Arsenal', type: 'club' }
        ],
        category: 'antics',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        engagementScore: 78
      }
    ];
  } catch (error) {
    console.error('Failed to fetch Upshot stories:', error);
    return [];
  }
}

/**
 * Get stories from FourFourTwo (historical chaos and features)
 */
async function getFourFourTwoStories(maxAge: number): Promise<EngagingStory[]> {
  try {
    return [
      {
        id: 'fft_1',
        content: 'Remember when David Beckham once got a red card for sarcastically applauding the referee, then immediately regretted it when he realized he was being filmed for a documentary',
        title: 'Beckham\'s Most Awkward Red Card',
        summary: 'A reminder that even legends have their cringeworthy moments',
        url: 'https://fourfourtwo.com/beckham-red-card-regret',
        source: {
          name: 'FourFourTwo',
          url: 'https://fourfourtwo.com',
          type: 'partner'
        },
        attribution: 'The football historians at [FourFourTwo](https://fourfourtwo.com) reminded us...',
        tags: [
          { name: 'Beckham', type: 'player' },
          { name: 'England', type: 'club' }
        ],
        category: 'historical',
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        engagementScore: 72
      }
    ];
  } catch (error) {
    console.error('Failed to fetch FourFourTwo stories:', error);
    return [];
  }
}

/**
 * Get stories from Football Ramble (weekly mishaps and comedy)
 */
async function getFootballRambleStories(maxAge: number): Promise<EngagingStory[]> {
  try {
    return [
      {
        id: 'ramble_1',
        content: 'Local pub league player attempts Messi-style nutmeg, accidentally nutmegs himself, somehow scores anyway',
        title: 'Accidental Genius at Sunday League Level',
        summary: 'Sometimes the beautiful game is beautiful in the most chaotic way possible',
        url: 'https://footballramble.com/sunday-league-chaos',
        source: {
          name: 'Football Ramble',
          url: 'https://footballramble.com',
          type: 'partner'
        },
        attribution: 'The comedy geniuses at [Football Ramble](https://footballramble.com) brought us this beauty...',
        tags: [
          { name: 'Sunday League', type: 'club' },
          { name: 'Messi', type: 'player' }
        ],
        category: 'culture',
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        engagementScore: 80
      }
    ];
  } catch (error) {
    console.error('Failed to fetch Football Ramble stories:', error);
    return [];
  }
}

/**
 * Get stories from The Athletic (deep dives and analysis)
 */
async function getAthleticStories(maxAge: number): Promise<EngagingStory[]> {
  try {
    return [
      {
        id: 'athletic_1',
        content: 'How Barcelona\'s financial situation has become so complex that they need a team of accountants just to figure out if they can afford a packet of crisps from the vending machine',
        title: 'Barcelona\'s Accounting Nightmare',
        summary: 'A deep dive into the labyrinthine world of modern football finances',
        url: 'https://theathletic.com/barcelona-finances-deep-dive',
        source: {
          name: 'The Athletic',
          url: 'https://theathletic.com',
          type: 'partner'
        },
        attribution: 'The investigative minds at [The Athletic](https://theathletic.com) broke this down perfectly...',
        tags: [
          { name: 'Barcelona', type: 'club' },
          { name: 'La Liga', type: 'source' }
        ],
        category: 'analysis',
        publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 hours ago
        engagementScore: 68
      }
    ];
  } catch (error) {
    console.error('Failed to fetch Athletic stories:', error);
    return [];
  }
}

/**
 * Get stories from Reddit r/soccer (community stories)
 */
async function getRedditStories(maxAge: number): Promise<EngagingStory[]> {
  try {
    return [
      {
        id: 'reddit_1',
        content: 'Local football fan discovers that screaming "PASS THE BALL" at his TV actually improves his team\'s passing accuracy by exactly 0%',
        title: 'Groundbreaking Research from r/soccer',
        summary: 'The community continues to provide valuable scientific insights',
        url: 'https://reddit.com/r/soccer/comments/tv-shouting-study',
        source: {
          name: 'r/soccer',
          url: 'https://reddit.com/r/soccer',
          type: 'community'
        },
        attribution: 'The brilliant minds over at [r/soccer](https://reddit.com/r/soccer) conducted this vital research...',
        tags: [
          { name: 'Community', type: 'source' },
          { name: 'Research', type: 'source' }
        ],
        category: 'community',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        engagementScore: 75
      }
    ];
  } catch (error) {
    console.error('Failed to fetch Reddit stories:', error);
    return [];
  }
}

/**
 * Calculate recency bonus for story scoring
 */
function getRecencyBonus(publishedAt: Date): number {
  const hoursAgo = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
  
  if (hoursAgo < 2) return 20;  // Very recent
  if (hoursAgo < 6) return 15;  // Recent
  if (hoursAgo < 12) return 10; // Somewhat recent
  if (hoursAgo < 24) return 5;  // Yesterday
  return 0; // Older
}

/**
 * Generate attribution text for a story
 */
export function generateAttribution(story: EngagingStory): string {
  const templates = [
    `The brilliant lads at [${story.source.name}](${story.url}) covered this perfectly...`,
    `Our friends over at [${story.source.name}](${story.url}) brought us this gem...`,
    `The legends at [${story.source.name}](${story.url}) uncovered this beauty...`,
    `Credit where it's due - [${story.source.name}](${story.url}) nailed this one...`,
    `Hat tip to the geniuses at [${story.source.name}](${story.url}) for this...`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Validate story content for appropriateness
 */
export function validateStoryContent(story: EngagingStory): boolean {
  // Check for inappropriate content
  const inappropriateKeywords = ['violence', 'racism', 'discrimination'];
  const content = (story.content + ' ' + story.title).toLowerCase();
  
  for (const keyword of inappropriateKeywords) {
    if (content.includes(keyword)) {
      console.warn(`Story rejected for inappropriate content: ${keyword}`);
      return false;
    }
  }
  
  // Ensure minimum quality
  if (story.engagementScore < 50) {
    console.warn('Story rejected for low engagement score');
    return false;
  }
  
  return true;
}

/**
 * Mix stories with transfer content intelligently
 */
export function mixStoriesWithTransfers(
  transferUpdates: any[],
  stories: EngagingStory[],
  maxTotal: number = 10
): any[] {
  const mixed = [];
  let transferIndex = 0;
  let storyIndex = 0;
  
  // Aim for 70% transfers, 30% stories when mixing
  const transferRatio = 0.7;
  const storyRatio = 0.3;
  
  for (let i = 0; i < maxTotal; i++) {
    const shouldUseTransfer = (
      (mixed.filter(item => item.type === 'transfer_update').length / mixed.length) < transferRatio ||
      storyIndex >= stories.length
    ) && transferIndex < transferUpdates.length;
    
    if (shouldUseTransfer) {
      mixed.push(transferUpdates[transferIndex++]);
    } else if (storyIndex < stories.length) {
      mixed.push({
        ...stories[storyIndex++],
        type: 'story_mix'
      });
    } else if (transferIndex < transferUpdates.length) {
      mixed.push(transferUpdates[transferIndex++]);
    }
  }
  
  return mixed;
}