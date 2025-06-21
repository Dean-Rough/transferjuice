/**
 * Core Briefing Generation Logic
 * Orchestrates the hourly briefing creation pipeline
 */

import type { Briefing } from '@prisma/client';
import { 
  createBriefing, 
  briefingExistsForTimestamp,
  type BriefingContent 
} from '@/lib/database/briefings';
import { getTweetsForBriefing, syncGlobalSourcesToDatabase } from './twitter';
import { generateTerryContent } from './terry';
import { generatePolaroids } from './polaroids';
import { mixPartnerContent } from './partner';
import { generateSlug } from '@/lib/utils/slug';

export interface GenerateBriefingOptions {
  timestamp: Date;
  testMode?: boolean;
  forceRegenerate?: boolean;
}

export interface GenerationResult {
  briefing: Briefing;
  stats: {
    tweetsProcessed: number;
    sourcesMonitored: number;
    processingTime: number;
    terryScore: number;
  };
}

export async function generateBriefing(
  options: GenerateBriefingOptions
): Promise<Briefing> {
  const { timestamp, testMode = false, forceRegenerate = false } = options;
  
  console.log(`🚀 Generating briefing for ${timestamp.toISOString()}`);
  
  // Check if briefing already exists
  if (!forceRegenerate && await briefingExistsForTimestamp(timestamp)) {
    throw new Error(`Briefing already exists for ${timestamp.toISOString()}`);
  }
  
  try {
    // Step 1: Sync sources (run periodically)
    await syncGlobalSourcesToDatabase();
    
    // Step 2: Fetch tweets from ITK sources
    console.log('📡 Fetching tweets...');
    const { feedItems, stats } = await getTweetsForBriefing(timestamp);
    
    if (feedItems.length === 0 && !testMode) {
      throw new Error('No relevant tweets found for briefing generation');
    }
    
    // For test mode, create mock feed items
    const itemsToProcess = testMode && feedItems.length === 0 
      ? createMockFeedItems() 
      : feedItems;
    
    console.log(`✅ Found ${itemsToProcess.length} relevant feed items`);
    
    // Step 3: Generate Terry content
    console.log('🎭 Generating Terry commentary...');
    const terryContent = await generateTerryContent(itemsToProcess, timestamp);
    
    // Step 4: Mix in partner content if needed
    console.log('🤝 Checking for partner content...');
    const mixedContent = await mixPartnerContent(
      terryContent.sections,
      itemsToProcess,
      timestamp
    );
    
    // Step 5: Generate visual timeline with polaroids
    console.log('📸 Generating polaroids...');
    const visualTimeline = await generatePolaroids(
      itemsToProcess,
      terryContent.timelineItems
    );
    
    // Step 6: Calculate metadata
    const wordCount = calculateWordCount(mixedContent);
    const readTime = Math.ceil(wordCount / 200); // 200 words per minute
    
    // Step 7: Create briefing content structure
    const briefingContent: BriefingContent = {
      title: terryContent.title,
      sections: mixedContent,
      visualTimeline,
      sidebar: terryContent.sidebar,
    };
    
    // Step 8: Save to database
    console.log('💾 Saving briefing...');
    const briefing = await createBriefing({
      timestamp,
      title: briefingContent.title,
      content: briefingContent.sections,
      visualTimeline: briefingContent.visualTimeline,
      sidebarSections: briefingContent.sidebar,
      readTime,
      wordCount,
      terryScore: terryContent.terryScore,
      feedItemIds: itemsToProcess.map(item => item.id),
      tagIds: extractTagIds(itemsToProcess),
    });
    
    // Step 9: Publish if not test mode
    if (!testMode && briefing) {
      await publishBriefing(briefing.id);
    }
    
    console.log(`✅ Briefing generated successfully: ${briefing.slug}`);
    
    return briefing;
    
  } catch (error) {
    console.error('❌ Briefing generation failed:', error);
    throw error;
  }
}

/**
 * Calculate total word count
 */
function calculateWordCount(sections: BriefingContent['sections']): number {
  return sections.reduce((total, section) => {
    const words = section.content.split(/\s+/).length;
    return total + words;
  }, 0);
}

/**
 * Extract unique tag IDs from feed items
 */
function extractTagIds(feedItems: any[]): string[] {
  const tagIds = new Set<string>();
  
  feedItems.forEach(item => {
    if (item.tags) {
      item.tags.forEach((tag: any) => {
        if (tag.tagId) {
          tagIds.add(tag.tagId);
        } else if (tag.tag?.id) {
          tagIds.add(tag.tag.id);
        }
      });
    }
  });
  
  return Array.from(tagIds);
}

/**
 * Publish briefing
 */
async function publishBriefing(briefingId: string): Promise<void> {
  const { updateBriefing } = await import('@/lib/database/briefings');
  await updateBriefing(briefingId, {
    isPublished: true,
    publishedAt: new Date(),
  });
}

/**
 * Create mock feed items for testing
 */
function createMockFeedItems(): any[] {
  return [
    {
      id: 'mock-1',
      type: 'ITK',
      content: 'BREAKING: Arsenal preparing £100m bid for striker who reportedly struggles with basic motor functions. Medical team on standby. More to follow... 🔴⚪ #AFC',
      originalText: 'BREAKING: Arsenal preparing £100m bid for striker...',
      sourceId: 'source-1',
      source: {
        id: 'source-1',
        name: 'Fabrizio Romano',
        username: 'FabrizioRomano',
        tier: 1,
        reliability: 0.95,
      },
      publishedAt: new Date(),
      priority: 'HIGH',
      relevanceScore: 0.9,
      tags: [],
    },
    {
      id: 'mock-2',
      type: 'ITK',
      content: 'Chelsea considering move for 18-year-old wonderkid from Brazilian third division. Scouting department using advanced FIFA Career Mode analytics. #CFC',
      originalText: 'Chelsea considering move for 18-year-old wonderkid...',
      sourceId: 'source-2',
      source: {
        id: 'source-2',
        name: 'David Ornstein',
        username: 'David_Ornstein',
        tier: 1,
        reliability: 0.92,
      },
      publishedAt: new Date(),
      priority: 'MEDIUM',
      relevanceScore: 0.8,
      tags: [],
    },
  ];
}