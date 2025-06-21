/**
 * Hourly Transfer Monitoring System
 * 
 * This system runs every hour to:
 * 1. Check all ITK accounts for new tweets/updates
 * 2. Generate engaging Terry-style updates
 * 3. Validate quality and route for human review if needed
 * 4. Search for relevant images
 * 5. Mix in funny stories from partner sources during quiet periods
 * 6. Track comprehensive metrics and performance
 */

import { prisma } from '@/lib/prisma';
import { twitterClient } from '@/lib/twitter/client';
import { classifyTransferContent } from '@/lib/twitter/transferClassifier';
import { generateTerryCommentary } from '@/lib/ai/terryCommentarySystem';
import { searchRelevantImages } from '@/lib/media/imageSearch';
import { getEngagingStories } from '@/lib/partnerships/storyMixer';
import { broadcastUpdate } from '@/lib/realtime/broadcaster';
import { ContentQualityValidator } from '@/lib/ai/quality-validator';
import { TerryArticleGenerator } from '@/lib/ai/article-generator';
import { metricsCollector, trackPipelineExecution } from '@/lib/monitoring/pipelineMetrics';
import { CONFIG } from '@/config/pipeline';

export interface HourlyUpdate {
  id: string;
  type: 'transfer_update' | 'breaking_news' | 'story_mix';
  content: string;
  terryCommentary: string;
  images: Array<{
    url: string;
    type: 'player' | 'club_badge' | 'stadium' | 'action';
    altText: string;
  }>;
  tags: Array<{
    name: string;
    type: 'club' | 'player' | 'source';
  }>;
  originalSource?: {
    name: string;
    username: string;
    url: string;
  };
  partnerAttribution?: {
    source: string;
    url: string;
    attribution: string;
  };
  timestamp: Date;
  priority: 'breaking' | 'high' | 'medium' | 'low';
  
  // Quality metrics
  qualityScore?: number;
  terryScore?: number;
  requiresHumanReview?: boolean;
  validationStatus?: 'passed' | 'failed' | 'review_required';
}

// Initialize quality validator and article generator
const qualityValidator = new ContentQualityValidator({
  openaiApiKey: CONFIG.ai.openai.apiKey,
  strictMode: CONFIG.env.NODE_ENV === 'production',
  autoReviewThreshold: CONFIG.quality.autoPublishThreshold * 100,
  terryMinimumScore: CONFIG.quality.thresholds.terryVoice * 100,
});

const articleGenerator = new TerryArticleGenerator({
  openaiApiKey: CONFIG.ai.openai.apiKey,
  model: CONFIG.ai.openai.model,
  terryIntensity: 'medium',
});

/**
 * Main hourly monitoring function
 * Called by cron job every hour - now with comprehensive metrics tracking
 */
export async function runHourlyMonitor(): Promise<HourlyUpdate[]> {
  return trackPipelineExecution('source_monitoring', async () => {
    console.log('🔄 Starting hourly transfer monitor...');
    
    const startTime = Date.now();
    let totalItemsProcessed = 0;
    let itemsSuccessful = 0;
    let itemsFailed = 0;
    let humanReviewRequired = 0;
    let qualityScores: number[] = [];
    
    try {
      // 1. Get all active ITK sources
      const itkSources = await prisma.itkSource.findMany({
        where: { isActive: true },
        orderBy: { reliability: 'desc' }
      });

      console.log(`📡 Monitoring ${itkSources.length} ITK sources`);

      // 2. Check each source for new content
      const newContent = await trackPipelineExecution('source_monitoring', async () => {
        return checkAllSources(itkSources);
      });
      
      totalItemsProcessed = newContent.length;
      console.log(`📊 Found ${newContent.length} new pieces of content`);
      
      // 3. Process transfer-related content with quality validation
      const transferUpdates = await trackPipelineExecution('processing', async () => {
        const updates = [];
        
        for (const item of newContent) {
          try {
            const processedUpdate = await processTransferContentWithQuality(item);
            if (processedUpdate) {
              updates.push(processedUpdate);
              
              // Track metrics
              if (processedUpdate.validationStatus === 'passed') {
                itemsSuccessful++;
              } else if (processedUpdate.validationStatus === 'review_required') {
                humanReviewRequired++;
              } else {
                itemsFailed++;
              }
              
              if (processedUpdate.qualityScore) {
                qualityScores.push(processedUpdate.qualityScore);
              }
            }
          } catch (error) {
            console.error('Failed to process content item:', error);
            itemsFailed++;
          }
        }
        
        return updates;
      });
      
      console.log(`✅ Processed ${transferUpdates.length} transfer updates`);
      console.log(`📈 Quality: ${itemsSuccessful} passed, ${humanReviewRequired} need review, ${itemsFailed} failed`);
      
      // 4. Mix in engaging stories if content is light
      const mixedContent = await trackPipelineExecution('mixing', async () => {
        return addContentPadding(transferUpdates);
      });
      
      // 5. Generate images and finalize updates
      const finalUpdates = await trackPipelineExecution('broadcasting', async () => {
        return finalizeUpdates(mixedContent);
      });
      
      // 6. Broadcast live updates
      await broadcastLiveUpdates(finalUpdates);
      
      // Update execution metrics
      const executionTime = Date.now() - startTime;
      const averageQualityScore = qualityScores.length > 0 
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
        : 0;
      
      console.log(`✅ Hourly monitor complete in ${executionTime}ms`);
      console.log(`📊 Final stats: ${finalUpdates.length} updates, avg quality ${averageQualityScore.toFixed(1)}`);
      
      // Update metrics with final results
      metricsCollector.updateExecution('current', {
        itemsProcessed: totalItemsProcessed,
        itemsSuccessful: itemsSuccessful,
        itemsFailed: itemsFailed,
        humanReviewRequired: humanReviewRequired,
        averageQualityScore: averageQualityScore,
        duration: executionTime,
      });
      
      return finalUpdates;
      
    } catch (error) {
      console.error('❌ Hourly monitor failed:', error);
      
      // Update metrics with error info
      metricsCollector.updateExecution('current', {
        itemsProcessed: totalItemsProcessed,
        itemsSuccessful: itemsSuccessful,
        itemsFailed: totalItemsProcessed, // All failed if we hit this catch
      });
      
      throw error;
    }
  }, {
    pipeline_stage: 'hourly_monitor',
    total_sources: 'tracked_in_execution'
  });
}

/**
 * Check all ITK sources for new content since last check
 */
async function checkAllSources(sources: any[]): Promise<any[]> {
  const newContent = [];
  
  for (const source of sources) {
    try {
      // Get last check time for this source
      const lastCheck = await getLastCheckTime(source.id);
      
      // Fetch new tweets since last check
      const newTweets = await twitterClient.getUserTimeline(source.username, {
        since: lastCheck,
        maxResults: 20
      });
      
      // Filter for transfer relevance
      const relevantTweets = [];
      for (const tweet of newTweets) {
        const classification = await classifyTransferContent(tweet.text);
        if (classification.isTransferRelated && classification.confidence > 0.7) {
          relevantTweets.push({
            ...tweet,
            source,
            classification
          });
        }
      }
      
      newContent.push(...relevantTweets);
      
      // Update last check time
      await updateLastCheckTime(source.id, new Date());
      
    } catch (error) {
      console.error(`Failed to check source ${source.username}:`, error);
    }
  }
  
  return newContent;
}

/**
 * Process transfer content with integrated quality validation
 */
async function processTransferContentWithQuality(item: any): Promise<HourlyUpdate | null> {
  try {
    // Generate Terry's commentary
    const terryCommentary = await generateTerryCommentary(
      item.text,
      item.classification,
      item.source
    );
    
    // Extract tags from content
    const tags = extractTags(item.text, item.classification);
    
    // Create article structure for quality validation
    const articleForValidation = {
      title: `Transfer Update: ${item.source.name}`,
      slug: `update-${Date.now()}`,
      content: {
        sections: [{
          id: 'main',
          type: 'main' as const,
          title: 'Latest Update',
          content: terryCommentary,
          order: 1,
          sourceTweets: [item.id],
          terryisms: extractTerryisms(terryCommentary),
        }],
        wordCount: terryCommentary.split(' ').length,
        estimatedReadTime: Math.ceil(terryCommentary.split(' ').length / 200),
        terryScore: calculateTerryCompatibility(terryCommentary),
        qualityMetrics: {
          coherence: 85,
          factualAccuracy: 90,
          brandVoice: calculateTerryCompatibility(terryCommentary),
          readability: 80,
        },
      },
      summary: terryCommentary.substring(0, 160),
      metaDescription: `Transfer update: ${item.text.substring(0, 120)}...`,
      tags: tags.map(t => t.name),
      briefingType: 'SPECIAL' as const,
      status: 'DRAFT' as const,
      qualityScore: 0, // Will be calculated
      aiModel: CONFIG.ai.openai.model,
      generationTime: 0,
    };
    
    // Validate content quality
    const validationResult = await qualityValidator.validateContent(articleForValidation);
    
    // Create update object with quality metrics
    const update: HourlyUpdate = {
      id: `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'transfer_update',
      content: item.text,
      terryCommentary,
      tags,
      originalSource: {
        name: item.source.name,
        username: item.source.username,
        url: `https://twitter.com/${item.source.username}/status/${item.id}`
      },
      timestamp: new Date(item.created_at),
      priority: determinePriority(item.classification),
      
      // Quality metrics
      qualityScore: validationResult.overallScore,
      terryScore: articleForValidation.content.terryScore,
      requiresHumanReview: validationResult.requiresHumanReview,
      validationStatus: validationResult.passed 
        ? 'passed' 
        : validationResult.requiresHumanReview 
        ? 'review_required' 
        : 'failed'
    };
    
    // Log quality results
    if (validationResult.requiresHumanReview) {
      console.log(`🔍 Content requires human review - Quality: ${validationResult.overallScore}, Terry: ${update.terryScore}`);
      console.log(`   Blockers: ${validationResult.blockers.join(', ')}`);
    } else if (!validationResult.passed) {
      console.log(`❌ Content failed validation - Quality: ${validationResult.overallScore}`);
      console.log(`   Issues: ${validationResult.blockers.join(', ')}`);
      return null; // Don't process failed content
    } else {
      console.log(`✅ Content passed validation - Quality: ${validationResult.overallScore}, Terry: ${update.terryScore}`);
    }
    
    return update;
    
  } catch (error) {
    console.error('Failed to process content item with quality validation:', error);
    return null;
  }
}

/**
 * Legacy process function for backward compatibility
 */
async function processTransferContent(content: any[]): Promise<Partial<HourlyUpdate>[]> {
  const updates = [];
  
  for (const item of content) {
    const processedUpdate = await processTransferContentWithQuality(item);
    if (processedUpdate) {
      updates.push(processedUpdate);
    }
  }
  
  return updates;
}

/**
 * Add engaging stories during quiet periods
 */
async function addContentPadding(updates: Partial<HourlyUpdate>[]): Promise<Partial<HourlyUpdate>[]> {
  // If we have plenty of transfer content, return as-is
  if (updates.length >= 3) {
    return updates;
  }
  
  try {
    // Get engaging football stories from partner sources
    const stories = await getEngagingStories({
      minRequired: 3 - updates.length,
      sources: ['theupshot', 'fourfourtwo', 'footballramble', 'theathletic']
    });
    
    // Convert stories to updates with Terry commentary
    for (const story of stories) {
      const terryCommentary = await generateTerryCommentary(
        story.content,
        { isTransferRelated: false, isFootballStory: true },
        story.source
      );
      
      const paddingUpdate: Partial<HourlyUpdate> = {
        id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'story_mix',
        content: story.content,
        terryCommentary,
        tags: story.tags || [],
        partnerAttribution: {
          source: story.source.name,
          url: story.url,
          attribution: story.attribution
        },
        timestamp: new Date(),
        priority: 'medium'
      };
      
      updates.push(paddingUpdate);
    }
    
  } catch (error) {
    console.error('Failed to add content padding:', error);
  }
  
  return updates;
}

/**
 * Finalize updates with images and save to database
 */
async function finalizeUpdates(updates: Partial<HourlyUpdate>[]): Promise<HourlyUpdate[]> {
  const finalizedUpdates = [];
  
  for (const update of updates) {
    try {
      // Search for relevant images based on content
      const images = await searchRelevantImages(
        update.content + ' ' + update.terryCommentary,
        update.tags
      );
      
      // Complete the update object
      const finalUpdate: HourlyUpdate = {
        ...update as HourlyUpdate,
        images: images || []
      };
      
      // Save to database
      await saveUpdateToDatabase(finalUpdate);
      
      finalizedUpdates.push(finalUpdate);
      
    } catch (error) {
      console.error('Failed to finalize update:', error);
    }
  }
  
  return finalizedUpdates;
}

/**
 * Broadcast updates to live feed clients
 */
async function broadcastLiveUpdates(updates: HourlyUpdate[]): Promise<void> {
  for (const update of updates) {
    await broadcastUpdate('feed-update', update);
  }
}

/**
 * Extract tags from content and classification
 */
function extractTags(content: string, classification: any): Array<{name: string, type: 'club' | 'player' | 'source'}> {
  const tags = [];
  
  // Extract club tags
  const clubMatches = content.match(/#\w+/g) || [];
  for (const match of clubMatches) {
    tags.push({ name: match, type: 'club' as const });
  }
  
  // Extract player tags
  const playerMatches = content.match(/@\w+/g) || [];
  for (const match of playerMatches) {
    tags.push({ name: match, type: 'player' as const });
  }
  
  // Add classification-based tags
  if (classification.keywords) {
    for (const keyword of classification.keywords) {
      if (!tags.some(tag => tag.name.toLowerCase().includes(keyword.toLowerCase()))) {
        // Determine tag type based on keyword
        const type = determineTagType(keyword);
        tags.push({ name: keyword, type });
      }
    }
  }
  
  return tags;
}

/**
 * Determine tag type from keyword
 */
function determineTagType(keyword: string): 'club' | 'player' | 'source' {
  const clubs = ['arsenal', 'chelsea', 'liverpool', 'madrid', 'barcelona', 'psg'];
  const players = ['haaland', 'mbappe', 'bellingham', 'kane', 'messi'];
  
  if (clubs.some(club => keyword.toLowerCase().includes(club))) {
    return 'club';
  }
  if (players.some(player => keyword.toLowerCase().includes(player))) {
    return 'player';
  }
  return 'source';
}

/**
 * Determine priority based on classification
 */
function determinePriority(classification: any): 'breaking' | 'high' | 'medium' | 'low' {
  if (classification.confidence > 0.95) return 'breaking';
  if (classification.confidence > 0.85) return 'high';
  if (classification.confidence > 0.7) return 'medium';
  return 'low';
}

/**
 * Get last check time for a source
 */
async function getLastCheckTime(sourceId: string): Promise<Date> {
  const lastCheck = await prisma.sourceCheckLog.findFirst({
    where: { sourceId },
    orderBy: { checkedAt: 'desc' }
  });
  
  return lastCheck?.checkedAt || new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
}

/**
 * Update last check time for a source
 */
async function updateLastCheckTime(sourceId: string, timestamp: Date): Promise<void> {
  await prisma.sourceCheckLog.create({
    data: {
      sourceId,
      checkedAt: timestamp
    }
  });
}

/**
 * Extract Terry-isms from content for quality validation
 */
function extractTerryisms(content: string): string[] {
  const terryisms: string[] = [];
  
  // Look for parenthetical asides
  const parentheticals = content.match(/\([^)]+\)/g);
  if (parentheticals) {
    terryisms.push(...parentheticals);
  }
  
  // Look for specific Terry phrases
  const terryPhrases = [
    'of course',
    'apparently',
    'somehow',
    'brilliant',
    'properly mental',
    'exactly the sort of',
    'which is',
    'absolutely mental',
    'right then',
    'here we are',
    'naturally',
  ];
  
  for (const phrase of terryPhrases) {
    if (content.toLowerCase().includes(phrase)) {
      terryisms.push(phrase);
    }
  }
  
  return [...new Set(terryisms)]; // Remove duplicates
}

/**
 * Calculate Terry compatibility score for content
 */
function calculateTerryCompatibility(content: string): number {
  let score = 0;
  
  // Check for Terry-isms
  const terryisms = extractTerryisms(content);
  score += terryisms.length * 5;
  
  // Check for specific Terry patterns
  if (content.includes('(')) score += 10; // Parenthetical asides
  if (content.includes('brilliant')) score += 5;
  if (content.includes('of course')) score += 5;
  if (content.includes('properly')) score += 5;
  if (content.includes('mental')) score += 8;
  if (content.includes('chaos')) score += 10;
  
  // Check for emotional content
  const emotionalWords = ['ridiculous', 'absurd', 'madness', 'genius', 'disaster'];
  for (const word of emotionalWords) {
    if (content.toLowerCase().includes(word)) {
      score += 3;
    }
  }
  
  // Check for specificity (Terry loves specific details)
  const specificPatterns = [
    /£\d+/g, // Money amounts
    /\d+ million/g, // Large numbers
    /\d+ years?/g, // Time periods
  ];
  
  for (const pattern of specificPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      score += matches.length * 5;
    }
  }
  
  return Math.min(score, 100);
}

/**
 * Save update to database with quality metrics
 */
async function saveUpdateToDatabase(update: HourlyUpdate): Promise<void> {
  try {
    // Determine published status based on validation
    const isPublished = update.validationStatus === 'passed' && !update.requiresHumanReview;
    
    // Save the main feed item
    const feedItem = await prisma.feedItem.create({
      data: {
        type: update.type,
        content: update.content,
        terryCommentary: update.terryCommentary,
        sourceId: update.originalSource?.username,
        originalUrl: update.originalSource?.url,
        priority: update.priority.toUpperCase(),
        publishedAt: update.timestamp,
        isPublished,
        // Store quality metrics in metadata if needed
        // qualityScore: update.qualityScore,
        // terryScore: update.terryScore,
      }
    });
    
    // Save tags
    for (const tag of update.tags) {
      const tagRecord = await prisma.tag.upsert({
        where: { name: tag.name },
        update: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
        create: { 
          name: tag.name, 
          type: tag.type.toUpperCase(),
          normalizedName: tag.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
          usageCount: 1,
          lastUsedAt: new Date(),
        }
      });
      
      await prisma.feedItemTag.create({
        data: {
          feedItemId: feedItem.id,
          tagId: tagRecord.id
        }
      });
    }
    
    // Save images
    for (const image of update.images) {
      await prisma.feedItemMedia.create({
        data: {
          feedItemId: feedItem.id,
          type: image.type.toUpperCase(),
          url: image.url,
          altText: image.altText
        }
      });
    }
    
    // Log quality metrics for monitoring
    if (update.qualityScore) {
      console.log(`💾 Saved feed item ${feedItem.id} - Quality: ${update.qualityScore}, Terry: ${update.terryScore}, Published: ${isPublished}`);
    }
    
  } catch (error) {
    console.error('Failed to save update to database:', error);
    throw error;
  }
}