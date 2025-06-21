/**
 * Partner Content Integration for Briefings
 * Mixes partner content during quiet transfer periods
 */

import { contentMixer } from '@/lib/partnerships/contentMixer';
import type { BriefingSection } from '@/types/briefing';
import { prisma } from '@/lib/prisma';

/**
 * Mix partner content into briefing sections
 */
export async function mixPartnerContent(
  sections: BriefingSection[],
  feedItems: any[],
  timestamp: Date
): Promise<BriefingSection[]> {
  // Check if we should mix content
  const mixingDecision = contentMixer.shouldMixPartnerContent(
    feedItems,
    timestamp
  );
  
  if (!mixingDecision.shouldMixContent) {
    console.log(`📰 Partner content not needed: ${mixingDecision.reason}`);
    return sections;
  }
  
  console.log(`📰 Mixing partner content: ${mixingDecision.reason}`);
  
  try {
    // Get suggested partner content
    const partnerContent = await contentMixer.getSuggestedContent(
      feedItems,
      ['entertainment', 'analysis'] // Prefer these during quiet periods
    );
    
    if (!partnerContent) {
      console.log('📰 No suitable partner content found');
      return sections;
    }
    
    // Convert to briefing section
    const partnerSection = await createPartnerSection(partnerContent);
    
    // Insert partner section strategically
    const updatedSections = insertPartnerSection(sections, partnerSection);
    
    // Track that we used this content
    contentMixer.trackPartnerContentAdded(partnerContent);
    
    // Save to database for tracking
    await savePartnerContentUsage(partnerContent, timestamp);
    
    return updatedSections;
    
  } catch (error) {
    console.error('❌ Failed to mix partner content:', error);
    return sections; // Return original sections on error
  }
}

/**
 * Create briefing section from partner content
 */
async function createPartnerSection(
  partnerContent: any
): Promise<BriefingSection> {
  // Generate Terry's introduction to the partner content
  const terryIntro = generatePartnerIntro(partnerContent);
  
  return {
    id: `partner-${partnerContent.id}`,
    type: 'partner',
    title: 'Meanwhile, In Football Land...',
    content: `
      ${terryIntro}
      <blockquote class="partner-content">
        <h4>${partnerContent.title}</h4>
        <p>${partnerContent.content}</p>
        <cite>${partnerContent.source.attribution_format
          .replace('{source}', partnerContent.source.name)
          .replace('{website}', `<a href="${partnerContent.url}" target="_blank" rel="noopener noreferrer">${partnerContent.url}</a>`)
        }</cite>
      </blockquote>
    `,
    metadata: {
      partnerAttribution: partnerContent.source.attribution_format
        .replace('{source}', partnerContent.source.name)
        .replace('{website}', partnerContent.url),
    },
  };
}

/**
 * Generate Terry's intro to partner content
 */
function generatePartnerIntro(partnerContent: any): string {
  const intros = [
    "Right, while we wait for actual transfer news to materialize from the ether,",
    "In the brief respite from ITK nonsense,",
    "During this moment of blessed transfer silence,",
    "While the rumour mill takes a quick breather,",
    "As we endure another quiet spell in the chaos,",
  ];
  
  const intro = intros[Math.floor(Math.random() * intros.length)];
  
  // Add source-specific commentary
  const sourceCommentary = {
    'the-upshot-podcast': "the lads at The Upshot have uncovered another absolute belter:",
    'sportbible': "SportBible's found something properly mental:",
    'planet-football': "Planet Football's dug up this gem:",
    'football-culture-movement': "Football Culture Movement's gone deep on this one:",
    'athletico-mince': "Bob Mortimer's been at it again:",
  };
  
  const commentary = sourceCommentary[partnerContent.source.id as keyof typeof sourceCommentary] || 
    `${partnerContent.source.name} has this to share:`;
  
  return `<p class="terry-intro">${intro} ${commentary}</p>`;
}

/**
 * Insert partner section into briefing
 */
function insertPartnerSection(
  sections: BriefingSection[],
  partnerSection: BriefingSection
): BriefingSection[] {
  // Find optimal position for partner content
  // Usually after main transfer news but before outro
  
  const outroIndex = sections.findIndex(s => s.type === 'outro');
  const insertIndex = outroIndex > -1 ? outroIndex : sections.length;
  
  // If we have very few sections, insert after intro
  if (sections.length <= 3) {
    const introIndex = sections.findIndex(s => s.type === 'intro');
    if (introIndex > -1) {
      return [
        ...sections.slice(0, introIndex + 1),
        partnerSection,
        ...sections.slice(introIndex + 1),
      ];
    }
  }
  
  // Otherwise insert before outro
  return [
    ...sections.slice(0, insertIndex),
    partnerSection,
    ...sections.slice(insertIndex),
  ];
}

/**
 * Save partner content usage to database
 */
async function savePartnerContentUsage(
  partnerContent: any,
  briefingTimestamp: Date
): Promise<void> {
  try {
    await prisma.partnerContent.create({
      data: {
        sourceId: partnerContent.source.id,
        title: partnerContent.title,
        content: partnerContent.content,
        url: partnerContent.url,
        publishedAt: partnerContent.publishedAt,
        category: partnerContent.category,
        tags: partnerContent.tags,
        usedAt: new Date(),
        // We'll link to briefing once it's created
      },
    });
  } catch (error) {
    console.error('Failed to save partner content usage:', error);
  }
}

/**
 * Get partner content analytics for a briefing
 */
export async function getPartnerContentAnalytics(
  briefingId: string
): Promise<PartnerContentAnalytics> {
  const briefing = await prisma.briefing.findUnique({
    where: { id: briefingId },
    include: {
      _count: {
        select: {
          feedItems: true,
        },
      },
    },
  });
  
  if (!briefing) {
    throw new Error('Briefing not found');
  }
  
  // Check if briefing has partner content
  const hasPartnerContent = (briefing.content as any[]).some(
    section => section.type === 'partner'
  );
  
  // Get mixing analytics from content mixer
  const mixerAnalytics = contentMixer.getAnalytics();
  
  return {
    hasPartnerContent,
    feedItemCount: briefing._count.feedItems,
    wasQuietPeriod: briefing._count.feedItems < 5,
    partnerContentStats: mixerAnalytics,
  };
}

// Type definitions

interface PartnerContentAnalytics {
  hasPartnerContent: boolean;
  feedItemCount: number;
  wasQuietPeriod: boolean;
  partnerContentStats: any;
}