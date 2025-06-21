/**
 * Terry AI Content Generation
 * Generates Terry's ascerbic commentary for briefings
 */

import { generateTerryCommentary } from '@/lib/ai/terryCommentary';
import type { 
  BriefingContent, 
  BriefingSection, 
  TimelineItem,
  SidebarSection,
  TerryCommentaryOptions 
} from '@/types/briefing';
import type { FeedItem } from '@prisma/client';

/**
 * Generate Terry content for briefing
 */
export async function generateTerryContent(
  feedItems: any[],
  timestamp: Date
): Promise<TerryContentResult> {
  console.log('🎭 Terry awakens to survey the chaos...');
  
  try {
    // Group feed items by priority and type
    const groupedItems = groupFeedItems(feedItems);
    
    // Generate title
    const title = await generateBriefingTitle(groupedItems, timestamp);
    
    // Generate main sections
    const sections = await generateMainSections(groupedItems);
    
    // Generate timeline items
    const timelineItems = await generateTimelineItems(feedItems);
    
    // Generate sidebar content
    const sidebar = await generateSidebarSections(groupedItems, feedItems);
    
    // Calculate Terry score
    const terryScore = await calculateTerryScore(sections);
    
    return {
      title,
      sections,
      timelineItems,
      sidebar,
      terryScore,
    };
    
  } catch (error) {
    console.error('❌ Terry has encountered an error:', error);
    throw error;
  }
}

/**
 * Generate briefing title with Terry style
 */
async function generateBriefingTitle(
  groupedItems: GroupedFeedItems,
  timestamp: Date
): Promise<BriefingContent['title']> {
  const hour = timestamp.getHours();
  const isEvening = hour >= 18;
  const isMorning = hour < 12;
  
  // Find the biggest story
  const leadStory = groupedItems.breaking[0] || 
                   groupedItems.high[0] || 
                   groupedItems.medium[0];
  
  if (!leadStory) {
    return {
      main: "Absolutely Nothing Happening",
      subtitle: "The transfer window's gone for a kip"
    };
  }
  
  // Generate contextual title
  const prompt = `
    Generate a witty, ascerbic briefing title in Joel Golby style.
    
    Lead story: ${leadStory.content}
    Time: ${isMorning ? 'Morning' : isEvening ? 'Evening' : 'Afternoon'}
    Total stories: ${groupedItems.all.length}
    
    Requirements:
    - Main title: 3-7 words, punchy and sarcastic
    - Subtitle: Expand on the absurdity
    - Reference the chaos or lack thereof
    - British humor, no emojis
    
    Examples:
    - "Proper Mental Transfer Tuesday" / "Everyone's lost their minds again"
    - "Sweet Transfer Nothingness" / "Tumbleweeds in the rumour mill"
    - "Deadline Day Without Deadlines" / "Just vibes and speculation"
  `;
  
  const result = await generateTerryCommentary(prompt, {
    style: 'witty',
    length: 'short',
  });
  
  // Parse result (assuming JSON response)
  return {
    main: result.main || "Transfer Chaos Unfolds",
    subtitle: result.subtitle || "The Terry surveys the madness"
  };
}

/**
 * Generate main content sections
 */
async function generateMainSections(
  groupedItems: GroupedFeedItems
): Promise<BriefingSection[]> {
  const sections: BriefingSection[] = [];
  
  // 1. Introduction section
  sections.push(await generateIntroSection(groupedItems));
  
  // 2. Breaking/High priority transfers
  if (groupedItems.breaking.length > 0 || groupedItems.high.length > 0) {
    sections.push(await generateTransferSection(
      [...groupedItems.breaking, ...groupedItems.high],
      'breaking'
    ));
  }
  
  // 3. Medium priority transfers
  if (groupedItems.medium.length > 0) {
    sections.push(await generateTransferSection(
      groupedItems.medium,
      'rumours'
    ));
  }
  
  // 4. Low priority / Bullshit Corner
  if (groupedItems.low.length > 0) {
    sections.push(await generateBullshitCorner(groupedItems.low));
  }
  
  // 5. Outro
  sections.push(await generateOutroSection(groupedItems));
  
  return sections.filter(s => s !== null) as BriefingSection[];
}

/**
 * Generate intro section
 */
async function generateIntroSection(
  groupedItems: GroupedFeedItems
): Promise<BriefingSection> {
  const totalStories = groupedItems.all.length;
  const hasBreaking = groupedItems.breaking.length > 0;
  
  const prompt = `
    Write a brief, sarcastic introduction for this hour's transfer briefing.
    
    Context:
    - ${totalStories} total stories
    - ${hasBreaking ? 'BREAKING NEWS included' : 'No major breaking news'}
    - Hour's highlight: ${groupedItems.all[0]?.content || 'Absolutely nothing'}
    
    Style: Joel Golby ascerbic wit
    Length: 2-3 sentences
    Tone: Weary British sarcasm about transfer nonsense
  `;
  
  const content = await generateTerryCommentary(prompt, {
    style: 'sarcastic',
    length: 'short',
  });
  
  return {
    id: 'intro',
    type: 'intro',
    content: content.text || "Right, let's see what fresh hell the transfer window has birthed this hour.",
  };
}

/**
 * Generate transfer section
 */
async function generateTransferSection(
  items: any[],
  sectionType: 'breaking' | 'rumours'
): Promise<BriefingSection> {
  const prompt = `
    Create a transfer news section combining these stories with Terry's commentary.
    
    Stories to cover:
    ${items.map((item, i) => `${i + 1}. ${item.content} (Source: ${item.source.name})`).join('\n')}
    
    Requirements:
    - Weave stories together naturally
    - Add sarcastic commentary between reports
    - Mock the absurdity where appropriate
    - Include source attribution
    - ${sectionType === 'breaking' ? 'Emphasize the "BREAKING" nature sarcastically' : 'Treat as standard rumours'}
    
    Style: Joel Golby voice - ascerbic, witty, British
    Format: HTML paragraphs
  `;
  
  const result = await generateTerryCommentary(prompt, {
    style: 'analytical',
    length: 'medium',
  });
  
  return {
    id: `transfer-${sectionType}`,
    type: 'transfer',
    title: sectionType === 'breaking' ? 'Actually Important Bits' : 'The Rumour Mill Churns On',
    content: result.html || formatFeedItemsAsHTML(items),
    feedItemIds: items.map(item => item.id),
    metadata: {
      priority: sectionType === 'breaking' ? 'BREAKING' : 'MEDIUM',
    },
  };
}

/**
 * Generate Bullshit Corner
 */
async function generateBullshitCorner(
  items: any[]
): Promise<BriefingSection | null> {
  if (items.length === 0) return null;
  
  const prompt = `
    Write the "Bullshit Corner" section for these dubious transfer rumours.
    
    Dubious claims:
    ${items.map((item, i) => `${i + 1}. ${item.content} (${item.source.name})`).join('\n')}
    
    Requirements:
    - Maximum sarcasm and disbelief
    - Point out the obvious nonsense
    - Question everyone's sanity
    - Brief roasting of sources
    
    Style: Peak British sarcasm
    Format: Short HTML paragraphs
  `;
  
  const result = await generateTerryCommentary(prompt, {
    style: 'sarcastic',
    length: 'short',
  });
  
  return {
    id: 'bullshit-corner',
    type: 'analysis',
    title: 'Bullshit Corner 🗑️',
    content: result.html || '<p>The usual suspects peddling the usual nonsense.</p>',
    feedItemIds: items.map(item => item.id),
  };
}

/**
 * Generate outro section
 */
async function generateOutroSection(
  groupedItems: GroupedFeedItems
): Promise<BriefingSection> {
  const prompt = `
    Write a closing paragraph for this transfer briefing.
    
    Summary:
    - Covered ${groupedItems.all.length} stories
    - Main theme: ${groupedItems.breaking.length > 0 ? 'Actual news happened' : 'Another quiet hour'}
    
    Requirements:
    - Sardonic sign-off
    - Tease the next hour
    - 1-2 sentences max
    
    Style: Exhausted British sarcasm
  `;
  
  const content = await generateTerryCommentary(prompt, {
    style: 'witty',
    length: 'short',
  });
  
  return {
    id: 'outro',
    type: 'outro',
    content: content.text || "Same time next hour for more of this relentless nonsense. The Terry needs a lie down.",
  };
}

/**
 * Generate timeline items
 */
async function generateTimelineItems(
  feedItems: any[]
): Promise<TimelineItem[]> {
  // Sort by time and importance
  const sortedItems = [...feedItems].sort((a, b) => {
    const timeCompare = new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    if (timeCompare !== 0) return timeCompare;
    
    // Sort by priority if same time
    const priorityOrder = { BREAKING: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
  });
  
  // Take top 10 for timeline
  return sortedItems.slice(0, 10).map((item, index) => {
    const time = new Date(item.publishedAt);
    const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    
    // Extract player name for polaroid (if applicable)
    const playerMatch = item.content.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
    const playerName = playerMatch ? playerMatch[1] : undefined;
    
    return {
      id: `timeline-${item.id}`,
      time: timeStr,
      type: mapToTimelineType(item.transferType || 'rumour'),
      title: extractTimelineTitle(item),
      description: item.content.substring(0, 100) + '...',
      feedItemId: item.id,
      ...(playerName && {
        polaroid: {
          playerName,
          clubName: extractClubName(item),
          imageUrl: '', // Will be generated
          frameColor: getClubColor(extractClubName(item)),
        },
      }),
    };
  });
}

/**
 * Generate sidebar sections
 */
async function generateSidebarSections(
  groupedItems: GroupedFeedItems,
  allItems: any[]
): Promise<SidebarSection[]> {
  const sections: SidebarSection[] = [];
  
  // 1. Quick Stats
  sections.push({
    id: 'stats',
    type: 'stats',
    title: "Hour's Numbers",
    content: {
      totalStories: allItems.length,
      breakingNews: groupedItems.breaking.length,
      confirmedDeals: allItems.filter(i => i.transferType === 'CONFIRMED').length,
      medicals: allItems.filter(i => i.transferType === 'MEDICAL').length,
      bullshitQuotient: Math.round((groupedItems.low.length / allItems.length) * 100),
    },
  });
  
  // 2. Trending
  const trending = extractTrendingTopics(allItems);
  if (trending.length > 0) {
    sections.push({
      id: 'trending',
      type: 'trending',
      title: 'Currently Losing It Over',
      content: trending,
    });
  }
  
  // 3. Terry's Hot Take
  const hotTake = await generateTerryHotTake(groupedItems);
  sections.push({
    id: 'terry-take',
    type: 'terry-take',
    title: "Terry's Take",
    content: hotTake,
  });
  
  return sections;
}

/**
 * Calculate Terry voice consistency score
 */
async function calculateTerryScore(
  sections: BriefingSection[]
): Promise<number> {
  // In production, this would analyze the generated content
  // for voice consistency using AI
  
  // Mock implementation
  const hasProperBritishSarcasm = sections.some(s => 
    s.content.includes('mental') || 
    s.content.includes('proper') || 
    s.content.includes('absolute scenes')
  );
  
  const hasSelfReference = sections.some(s => 
    s.content.toLowerCase().includes('the terry')
  );
  
  let score = 0.7; // Base score
  if (hasProperBritishSarcasm) score += 0.15;
  if (hasSelfReference) score += 0.15;
  
  return Math.min(score, 1.0);
}

// Helper functions

function groupFeedItems(items: any[]): GroupedFeedItems {
  const grouped = {
    breaking: [] as any[],
    high: [] as any[],
    medium: [] as any[],
    low: [] as any[],
    all: items,
  };
  
  items.forEach(item => {
    switch (item.priority) {
      case 'BREAKING':
        grouped.breaking.push(item);
        break;
      case 'HIGH':
        grouped.high.push(item);
        break;
      case 'MEDIUM':
        grouped.medium.push(item);
        break;
      default:
        grouped.low.push(item);
    }
  });
  
  return grouped;
}

function formatFeedItemsAsHTML(items: any[]): string {
  return items.map(item => 
    `<p><strong>${item.source.name}:</strong> ${item.content}</p>`
  ).join('\n');
}

function mapToTimelineType(
  transferType: string
): TimelineItem['type'] {
  const mapping: Record<string, TimelineItem['type']> = {
    'CONFIRMED': 'transfer',
    'SIGNING': 'transfer',
    'MEDICAL': 'update',
    'BID': 'rumour',
    'RUMOUR': 'rumour',
  };
  
  return mapping[transferType] || 'rumour';
}

function extractTimelineTitle(item: any): string {
  // Extract key action from content
  const content = item.content;
  
  if (content.includes('BREAKING')) {
    return content.split('BREAKING:')[1]?.split('.')[0]?.trim() || 'Breaking News';
  }
  
  // Take first part before comma or period
  return content.split(/[,.]/)[0]?.trim().substring(0, 50) || 'Transfer Update';
}

function extractClubName(item: any): string {
  // Simple pattern matching for clubs
  const clubs = [
    'Arsenal', 'Chelsea', 'Liverpool', 'Manchester United', 'Manchester City',
    'Tottenham', 'Real Madrid', 'Barcelona', 'Bayern Munich', 'PSG'
  ];
  
  for (const club of clubs) {
    if (item.content.includes(club)) {
      return club;
    }
  }
  
  return 'Unknown Club';
}

function getClubColor(club: string): string {
  const colors: Record<string, string> = {
    'Arsenal': '#EF0107',
    'Chelsea': '#034694',
    'Liverpool': '#C8102E',
    'Manchester United': '#DA020E',
    'Manchester City': '#6CABDD',
    'Tottenham': '#132257',
    'Real Madrid': '#FFFFFF',
    'Barcelona': '#A50044',
    'Bayern Munich': '#DC052D',
    'PSG': '#004170',
  };
  
  return colors[club] || '#333333';
}

function extractTrendingTopics(items: any[]): string[] {
  const topics = new Map<string, number>();
  
  // Count mentions of clubs and players
  items.forEach(item => {
    const clubs = item.tags?.clubs || [];
    const players = item.tags?.players || [];
    
    [...clubs, ...players].forEach(topic => {
      topics.set(topic, (topics.get(topic) || 0) + 1);
    });
  });
  
  // Sort by frequency and take top 5
  return Array.from(topics.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);
}

async function generateTerryHotTake(
  groupedItems: GroupedFeedItems
): Promise<string> {
  const prompt = `
    Generate a brief, sarcastic "hot take" about this hour's transfer news.
    
    Context:
    - ${groupedItems.breaking.length} breaking stories
    - ${groupedItems.all.length} total stories
    - Chaos level: ${groupedItems.breaking.length > 2 ? 'HIGH' : 'MODERATE'}
    
    Requirements:
    - 1-2 sentences max
    - Maximum British sarcasm
    - Reference the absurdity
    
    Style: Joel Golby at his most exasperated
  `;
  
  const result = await generateTerryCommentary(prompt, {
    style: 'witty',
    length: 'short',
  });
  
  return result.text || "Everyone's lost their bloody minds again. Standard Tuesday then.";
}

// Type definitions

interface GroupedFeedItems {
  breaking: any[];
  high: any[];
  medium: any[];
  low: any[];
  all: any[];
}

interface TerryContentResult {
  title: BriefingContent['title'];
  sections: BriefingSection[];
  timelineItems: TimelineItem[];
  sidebar: SidebarSection[];
  terryScore: number;
}