/**
 * Twitter Integration for Briefing Generation
 * Fetches and processes tweets from ITK sources for briefings
 */

import { TwitterClient, type TwitterTweet, type TwitterTimelineResponse } from '@/lib/twitter/client';
import { classifyTransferTweet } from '@/lib/twitter/transferClassifier';
import { GLOBAL_ITK_SOURCES } from '@/lib/twitter/globalSources';
import { 
  getActiveITKSources, 
  updateSourceFetchStatus,
  upsertITKSource,
  type ITKSource 
} from '@/lib/database/sources';
import { 
  createFeedItemsFromTweets,
  getUnprocessedFeedItems
} from '@/lib/database/feedItems';
import { findOrCreateTags } from '@/lib/database/tags';
import { validateEnvironment } from '@/lib/validations/environment';
import type { TransferType, Priority, League, TagType } from '@prisma/client';

// Initialize Twitter client
let twitterClient: TwitterClient | null = null;

/**
 * Get or create Twitter client
 */
function getTwitterClient(): TwitterClient {
  if (!twitterClient) {
    const env = validateEnvironment();
    twitterClient = new TwitterClient({
      bearerToken: env.TWITTER_BEARER_TOKEN,
    });
  }
  return twitterClient;
}

/**
 * Sync global sources to database
 */
export async function syncGlobalSourcesToDatabase(): Promise<void> {
  console.log('🔄 Syncing global ITK sources to database...');
  
  for (const source of GLOBAL_ITK_SOURCES) {
    try {
      await upsertITKSource({
        username: source.handle.replace('@', ''),
        name: source.name,
        tier: source.tier,
        reliability: source.reliability,
        region: source.region,
        isVerified: source.isVerified,
      });
    } catch (error) {
      console.error(`Failed to sync source ${source.name}:`, error);
    }
  }
  
  console.log('✅ Global sources synced');
}

/**
 * Fetch tweets from ITK sources for a time period
 */
export async function fetchTweetsForBriefing(
  since: Date,
  until: Date
): Promise<FetchTweetsResult> {
  const client = getTwitterClient();
  const results: FetchTweetsResult = {
    totalTweets: 0,
    relevantTweets: 0,
    feedItemsCreated: 0,
    errors: [],
    sourceStats: {},
  };
  
  // Get active sources from database
  const sources = await getActiveITKSources();
  
  console.log(`📡 Fetching tweets from ${sources.length} sources...`);
  
  // Process each source
  for (const source of sources) {
    try {
      const sourceResult = await fetchTweetsFromSource(
        client,
        source,
        since,
        until
      );
      
      results.totalTweets += sourceResult.totalTweets;
      results.relevantTweets += sourceResult.relevantTweets;
      results.feedItemsCreated += sourceResult.feedItemsCreated;
      results.sourceStats[source.username] = sourceResult;
      
      // Update source fetch status
      await updateSourceFetchStatus(source.id, {
        lastFetchedAt: new Date(),
        lastTweetId: sourceResult.lastTweetId,
        tweetsProcessed: sourceResult.totalTweets,
        relevantTweets: sourceResult.relevantTweets,
      });
      
    } catch (error) {
      const errorMessage = `Failed to fetch from @${source.username}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMessage);
      results.errors.push(errorMessage);
      
      // Don't fail the entire process for one source
      continue;
    }
  }
  
  console.log(`✅ Fetched ${results.totalTweets} tweets, ${results.relevantTweets} relevant`);
  
  return results;
}

/**
 * Fetch tweets from a single source
 */
async function fetchTweetsFromSource(
  client: TwitterClient,
  source: ITKSource,
  since: Date,
  until: Date
): Promise<SourceFetchResult> {
  const result: SourceFetchResult = {
    sourceId: source.id,
    sourceName: source.name,
    totalTweets: 0,
    relevantTweets: 0,
    feedItemsCreated: 0,
    lastTweetId: undefined,
  };
  
  try {
    // Get user ID if we don't have it
    if (!source.twitterId) {
      const user = await client.getUserByUsername(source.username);
      await upsertITKSource({
        username: source.username,
        name: source.name,
        twitterId: user.id,
        profileImageUrl: user.profile_image_url,
        description: user.description,
        followerCount: user.public_metrics.followers_count,
        followingCount: user.public_metrics.following_count,
        tweetCount: user.public_metrics.tweet_count,
      });
      source.twitterId = user.id;
    }
    
    // Fetch timeline
    const timeline = await client.getUserTimeline(source.twitterId, {
      maxResults: 100,
      startTime: since.toISOString(),
      endTime: until.toISOString(),
      sinceId: source.lastTweetId || undefined,
    });
    
    if (!timeline.data || timeline.data.length === 0) {
      return result;
    }
    
    result.totalTweets = timeline.data.length;
    result.lastTweetId = timeline.meta.newest_id;
    
    // Process tweets
    const relevantTweets = await processTweetsForRelevance(
      timeline.data,
      source,
      timeline
    );
    
    result.relevantTweets = relevantTweets.length;
    
    if (relevantTweets.length > 0) {
      // Create feed items
      const feedItems = await createFeedItemsFromProcessedTweets(
        relevantTweets,
        source
      );
      result.feedItemsCreated = feedItems.length;
    }
    
  } catch (error) {
    console.error(`Error processing source @${source.username}:`, error);
    throw error;
  }
  
  return result;
}

/**
 * Process tweets for transfer relevance
 */
async function processTweetsForRelevance(
  tweets: TwitterTweet[],
  source: ITKSource,
  timeline: TwitterTimelineResponse
): Promise<ProcessedTweet[]> {
  const processed: ProcessedTweet[] = [];
  
  for (const tweet of tweets) {
    // Skip retweets and replies
    if (tweet.referenced_tweets?.some(rt => rt.type === 'retweeted')) {
      continue;
    }
    
    // Classify tweet
    const classification = await classifyTransferTweet(tweet.text);
    
    if (!classification.isTransferRelated || classification.confidence < 0.5) {
      continue;
    }
    
    // Extract media
    const media = extractMediaFromTweet(tweet, timeline);
    
    // Extract tags
    const tags = await extractTagsFromTweet(tweet, classification);
    
    processed.push({
      tweet,
      classification,
      source,
      media,
      tags,
      tweetUrl: `https://twitter.com/${source.username}/status/${tweet.id}`,
    });
  }
  
  return processed;
}

/**
 * Extract media from tweet
 */
function extractMediaFromTweet(
  tweet: TwitterTweet,
  timeline: TwitterTimelineResponse
): TweetMedia[] {
  const media: TweetMedia[] = [];
  
  if (!tweet.attachments?.media_keys || !timeline.includes?.media) {
    return media;
  }
  
  for (const mediaKey of tweet.attachments.media_keys) {
    const mediaItem = timeline.includes.media.find(
      m => m.media_key === mediaKey
    );
    
    if (mediaItem) {
      media.push({
        type: mediaItem.type as 'photo' | 'video' | 'gif',
        url: mediaItem.url || mediaItem.preview_image_url || '',
        altText: undefined, // Not available in current response
      });
    }
  }
  
  return media;
}

/**
 * Extract tags from tweet and classification
 */
async function extractTagsFromTweet(
  tweet: TwitterTweet,
  classification: any
): Promise<ExtractedTags> {
  const tags: ExtractedTags = {
    clubs: [],
    players: [],
    leagues: [],
  };
  
  // Extract from classification keywords
  const text = tweet.text.toLowerCase();
  
  // Club detection (basic - could be enhanced with NLP)
  const clubPatterns = [
    { pattern: /manchester united|man utd|mufc/gi, club: 'Manchester United' },
    { pattern: /manchester city|man city|mcfc/gi, club: 'Manchester City' },
    { pattern: /liverpool|lfc/gi, club: 'Liverpool' },
    { pattern: /chelsea|cfc/gi, club: 'Chelsea' },
    { pattern: /arsenal|afc/gi, club: 'Arsenal' },
    { pattern: /tottenham|spurs|thfc/gi, club: 'Tottenham' },
    { pattern: /real madrid|madrid/gi, club: 'Real Madrid' },
    { pattern: /barcelona|barca|fcb/gi, club: 'Barcelona' },
    { pattern: /bayern|fcb/gi, club: 'Bayern Munich' },
    { pattern: /psg|paris/gi, club: 'PSG' },
  ];
  
  for (const { pattern, club } of clubPatterns) {
    if (pattern.test(text)) {
      tags.clubs.push(club);
    }
  }
  
  // League detection
  if (classification.league) {
    tags.leagues.push(classification.league);
  } else {
    // Infer from clubs
    if (tags.clubs.some(c => ['Manchester United', 'Manchester City', 'Liverpool', 'Chelsea', 'Arsenal', 'Tottenham'].includes(c))) {
      tags.leagues.push('PL');
    }
  }
  
  // Player extraction would require more sophisticated NLP
  // For now, we'll rely on Terry AI to extract player names during content generation
  
  return tags;
}

/**
 * Create feed items from processed tweets
 */
async function createFeedItemsFromProcessedTweets(
  processedTweets: ProcessedTweet[],
  source: ITKSource
): Promise<any[]> {
  // Create tags first
  const allTags = new Set<{ name: string; type: TagType }>();
  
  for (const pt of processedTweets) {
    pt.tags.clubs.forEach(club => allTags.add({ name: club, type: 'CLUB' }));
    pt.tags.players.forEach(player => allTags.add({ name: player, type: 'PLAYER' }));
  }
  
  const tags = await findOrCreateTags(Array.from(allTags));
  const tagMap = Object.fromEntries(tags.map(t => [t.name, t.id]));
  
  // Prepare feed items
  const feedItemData = processedTweets.map(pt => {
    const tagIds: string[] = [];
    pt.tags.clubs.forEach(club => {
      if (tagMap[club]) tagIds.push(tagMap[club]);
    });
    pt.tags.players.forEach(player => {
      if (tagMap[player]) tagIds.push(tagMap[player]);
    });
    
    // Add source as tag
    const sourceTag = tags.find(t => t.name === source.name && t.type === 'SOURCE');
    if (sourceTag) tagIds.push(sourceTag.id);
    
    return {
      content: pt.tweet.text,
      originalText: pt.tweet.text,
      sourceId: source.id,
      twitterId: pt.tweet.id,
      originalUrl: pt.tweetUrl,
      publishedAt: new Date(pt.tweet.created_at),
      transferType: mapTransferType(pt.classification.transferType),
      priority: calculatePriority(pt.classification, source),
      league: pt.tags.leagues[0] as League || undefined,
      relevanceScore: pt.classification.confidence,
      originalShares: pt.tweet.public_metrics.retweet_count,
      originalLikes: pt.tweet.public_metrics.like_count,
      originalReplies: pt.tweet.public_metrics.reply_count,
      tagIds,
    };
  });
  
  return await createFeedItemsFromTweets(feedItemData);
}

/**
 * Map classification transfer type to enum
 */
function mapTransferType(type?: string): TransferType | undefined {
  const mapping: Record<string, TransferType> = {
    'signing': 'SIGNING',
    'rumour': 'RUMOUR',
    'medical': 'MEDICAL',
    'confirmed': 'CONFIRMED',
    'bid': 'BID',
    'personal_terms': 'PERSONAL_TERMS',
    'loan': 'LOAN',
    'extension': 'EXTENSION',
  };
  
  return type ? mapping[type] : undefined;
}

/**
 * Calculate priority based on classification and source
 */
function calculatePriority(
  classification: any,
  source: ITKSource
): Priority {
  // High priority for Tier 1 sources with high confidence
  if (source.tier === 1 && classification.confidence > 0.8) {
    if (classification.transferType === 'confirmed' || 
        classification.transferType === 'medical') {
      return 'BREAKING';
    }
    return 'HIGH';
  }
  
  // Medium priority for good sources or high confidence
  if (source.tier <= 2 || classification.confidence > 0.7) {
    return 'MEDIUM';
  }
  
  return 'LOW';
}

/**
 * Get tweets for briefing generation
 */
export async function getTweetsForBriefing(
  timestamp: Date
): Promise<{
  feedItems: any[];
  stats: FetchTweetsResult;
}> {
  // Fetch tweets from the last hour
  const since = new Date(timestamp.getTime() - 60 * 60 * 1000);
  const until = timestamp;
  
  // Fetch new tweets
  const fetchStats = await fetchTweetsForBriefing(since, until);
  
  // Get unprocessed feed items
  const feedItems = await getUnprocessedFeedItems(since, until);
  
  return {
    feedItems,
    stats: fetchStats,
  };
}

// Type definitions
interface FetchTweetsResult {
  totalTweets: number;
  relevantTweets: number;
  feedItemsCreated: number;
  errors: string[];
  sourceStats: Record<string, SourceFetchResult>;
}

interface SourceFetchResult {
  sourceId: string;
  sourceName: string;
  totalTweets: number;
  relevantTweets: number;
  feedItemsCreated: number;
  lastTweetId?: string;
}

interface ProcessedTweet {
  tweet: TwitterTweet;
  classification: any;
  source: ITKSource;
  media: TweetMedia[];
  tags: ExtractedTags;
  tweetUrl: string;
}

interface TweetMedia {
  type: 'photo' | 'video' | 'gif';
  url: string;
  altText?: string;
}

interface ExtractedTags {
  clubs: string[];
  players: string[];
  leagues: string[];
}