/**
 * Feed Integration Utilities
 * Converts classified tweets into feed items and integrates with the feed store
 */

import { type FeedItem } from '@/lib/stores/feedStore';
import {
  type TweetData,
  type ClassificationResult,
} from './transferClassifier';
import { type ITKSource } from './globalSources';

/**
 * Convert a classified tweet into a feed item
 */
export const convertTweetToFeedItem = (
  tweet: TweetData,
  classification: ClassificationResult,
  source: ITKSource
): FeedItem => {
  const isBreaking =
    classification.confidence >= 0.9 &&
    (classification.transferType === 'confirmed' ||
      classification.transferType === 'signing');

  // Extract clubs and players from content
  const { clubs, players } = extractEntitiesFromContent(
    tweet.text,
    classification.language
  );

  // Determine priority based on confidence and transfer type
  const priority = determinePriority(classification, source);

  // Map transfer type
  const mappedTransferType = mapTransferType(classification.transferType);

  return {
    id: `tweet-${tweet.id}`,
    type: isBreaking ? 'breaking' : 'itk',
    timestamp: new Date(tweet.createdAt),
    content: cleanTweetContent(tweet.text),
    source: {
      name: source.name,
      handle: source.handle,
      tier: source.tier,
      reliability: source.reliability,
      region: source.region,
    },
    tags: {
      clubs,
      players,
      sources: [source.name],
    },
    media: tweet.media
      ? {
          type: tweet.media[0].type === 'photo' ? 'image' : 'video',
          url: tweet.media[0].url,
          altText: `Transfer update from ${source.name}`,
        }
      : undefined,
    engagement: tweet.metrics
      ? {
          shares: tweet.metrics.retweets,
          reactions: tweet.metrics.likes,
          clicks: tweet.metrics.replies,
        }
      : {
          shares: 0,
          reactions: 0,
          clicks: 0,
        },
    metadata: {
      transferType: mappedTransferType,
      priority,
      relevanceScore: classification.confidence,
      league: determineLeague(clubs),
      originalUrl: `https://twitter.com/${tweet.author.username}/status/${tweet.id}`,
    },
    isRead: false,
    isNew: true,
  };
};

/**
 * Extract club and player entities from tweet content
 */
const extractEntitiesFromContent = (content: string, language?: string) => {
  // Common club names patterns (could be enhanced with ML/NER)
  const clubPatterns = [
    // Premier League
    'Arsenal',
    'Chelsea',
    'Manchester United',
    'Man United',
    'United',
    'Liverpool',
    'Manchester City',
    'Man City',
    'City',
    'Tottenham',
    'Spurs',
    'Newcastle',
    'Brighton',
    'West Ham',
    'Aston Villa',
    'Crystal Palace',

    // La Liga
    'Real Madrid',
    'Madrid',
    'Barcelona',
    'Barca',
    'Atletico Madrid',
    'Atletico',
    'Sevilla',
    'Valencia',
    'Villarreal',
    'Real Sociedad',
    'Athletic Bilbao',

    // Serie A
    'Juventus',
    'Juve',
    'AC Milan',
    'Milan',
    'Inter Milan',
    'Inter',
    'Napoli',
    'AS Roma',
    'Roma',
    'Lazio',
    'Fiorentina',
    'Atalanta',

    // Bundesliga
    'Bayern Munich',
    'Bayern',
    'Borussia Dortmund',
    'Dortmund',
    'BVB',
    'RB Leipzig',
    'Leipzig',
    'Bayer Leverkusen',
    'Leverkusen',
    'Eintracht Frankfurt',

    // Ligue 1
    'PSG',
    'Paris Saint-Germain',
    'Lyon',
    'Marseille',
    'Monaco',
    'Lille',

    // Other major clubs
    'Ajax',
    'PSV',
    'Feyenoord',
    'Benfica',
    'Porto',
    'Sporting',
  ];

  // Extract clubs mentioned in the content
  const clubs = clubPatterns.filter((club) =>
    content.toLowerCase().includes(club.toLowerCase())
  );

  // Common player name patterns (simplified - could use NER)
  const playerPatterns = [
    'Haaland',
    'Mbappe',
    'Bellingham',
    'Kane',
    'Salah',
    'Vinicius',
    'Pedri',
    'Gavi',
    'Musiala',
    'Camavinga',
    'Osimhen',
    'Leao',
    'Kvaratskhelia',
    'Vlahovic',
    'Saka',
    'Foden',
    'Wirtz',
    'Moukoko',
  ];

  // Extract players mentioned in the content
  const players = playerPatterns.filter((player) =>
    content.toLowerCase().includes(player.toLowerCase())
  );

  return { clubs, players };
};

/**
 * Determine priority based on classification and source
 */
const determinePriority = (
  classification: ClassificationResult,
  source: ITKSource
): FeedItem['metadata']['priority'] => {
  // Breaking news: high confidence + tier 1 source + confirmed/signing
  if (
    classification.confidence >= 0.9 &&
    source.tier === 1 &&
    (classification.transferType === 'confirmed' ||
      classification.transferType === 'signing')
  ) {
    return 'breaking';
  }

  // High priority: good confidence + good source OR tier 1 source
  if (
    (classification.confidence >= 0.7 && source.tier <= 2) ||
    source.tier === 1
  ) {
    return 'high';
  }

  // Medium priority: decent confidence OR tier 2 source
  if (classification.confidence >= 0.5 || source.tier === 2) {
    return 'medium';
  }

  return 'low';
};

/**
 * Map classification transfer type to feed item transfer type
 */
const mapTransferType = (
  transferType?: ClassificationResult['transferType']
): FeedItem['metadata']['transferType'] => {
  switch (transferType) {
    case 'confirmed':
    case 'signing':
      return 'confirmed';
    case 'medical':
      return 'medical';
    case 'bid':
      return 'bid';
    case 'personal_terms':
      return 'personal_terms';
    case 'rumour':
    default:
      return 'rumour';
  }
};

/**
 * Determine league based on clubs mentioned
 */
const determineLeague = (clubs: string[]): FeedItem['metadata']['league'] => {
  const leagueClubs = {
    PL: [
      'Arsenal',
      'Chelsea',
      'Manchester United',
      'Liverpool',
      'Manchester City',
      'Tottenham',
    ],
    LaLiga: [
      'Real Madrid',
      'Barcelona',
      'Atletico Madrid',
      'Sevilla',
      'Valencia',
    ],
    SerieA: ['Juventus', 'AC Milan', 'Inter Milan', 'Napoli', 'AS Roma'],
    Bundesliga: [
      'Bayern Munich',
      'Borussia Dortmund',
      'RB Leipzig',
      'Bayer Leverkusen',
    ],
    Ligue1: ['PSG', 'Lyon', 'Marseille', 'Monaco'],
  };

  for (const [league, leagueClubList] of Object.entries(leagueClubs)) {
    if (
      clubs.some((club) =>
        leagueClubList.some((leagueClub) =>
          club.toLowerCase().includes(leagueClub.toLowerCase())
        )
      )
    ) {
      return league as FeedItem['metadata']['league'];
    }
  }

  return 'Other';
};

/**
 * Clean tweet content (remove URLs, normalize text)
 */
const cleanTweetContent = (content: string): string => {
  return (
    content
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Trim
      .trim()
  );
};

/**
 * Batch convert tweets to feed items
 */
export const convertTweetsToFeedItems = (
  tweetClassifications: Array<{
    tweet: TweetData;
    classification: ClassificationResult;
    source: ITKSource;
  }>
): FeedItem[] => {
  return tweetClassifications
    .filter(({ classification }) => classification.isTransferRelated)
    .map(({ tweet, classification, source }) =>
      convertTweetToFeedItem(tweet, classification, source)
    );
};

/**
 * Integration function to add classified tweets to feed store
 */
export const integrateClassifiedTweets = async (
  tweetClassifications: Array<{
    tweet: TweetData;
    classification: ClassificationResult;
    source: ITKSource;
  }>,
  minConfidence: number = 0.4
) => {
  // Filter by confidence threshold
  const highConfidenceTweets = tweetClassifications.filter(
    ({ classification }) =>
      classification.isTransferRelated &&
      classification.confidence >= minConfidence
  );

  if (highConfidenceTweets.length === 0) {
    console.log('No high-confidence transfer tweets to process');
    return;
  }

  // Convert to feed items
  const feedItems = convertTweetsToFeedItems(highConfidenceTweets);

  // Sort by priority and confidence
  feedItems.sort((a, b) => {
    const priorityOrder = { breaking: 4, high: 3, medium: 2, low: 1 };
    const aPriority = priorityOrder[a.metadata.priority];
    const bPriority = priorityOrder[b.metadata.priority];

    if (aPriority !== bPriority) {
      return bPriority - aPriority; // Higher priority first
    }

    return b.metadata.relevanceScore - a.metadata.relevanceScore; // Higher confidence first
  });

  // Add to feed store (would integrate with actual store in production)
  console.log(`📊 Processing ${feedItems.length} transfer tweets into feed:`, {
    breaking: feedItems.filter((item) => item.metadata.priority === 'breaking')
      .length,
    high: feedItems.filter((item) => item.metadata.priority === 'high').length,
    medium: feedItems.filter((item) => item.metadata.priority === 'medium')
      .length,
    low: feedItems.filter((item) => item.metadata.priority === 'low').length,
  });

  // In production, this would call:
  // const { addItem } = useFeedStore.getState();
  // feedItems.forEach(item => addItem(item));

  return feedItems;
};

/**
 * Filter duplicate tweets (same content from multiple sources)
 */
export const filterDuplicateTweets = (tweets: TweetData[]): TweetData[] => {
  const seen = new Set<string>();
  return tweets.filter((tweet) => {
    // Create a normalized content signature
    const signature = tweet.text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (seen.has(signature)) {
      return false;
    }

    seen.add(signature);
    return true;
  });
};

/**
 * Merge tweets from different sources about the same transfer
 */
export const mergeSimilarTweets = (
  tweetClassifications: Array<{
    tweet: TweetData;
    classification: ClassificationResult;
    source: ITKSource;
  }>
): Array<{
  tweet: TweetData;
  classification: ClassificationResult;
  source: ITKSource;
  additionalSources?: ITKSource[];
}> => {
  // Simple implementation - could be enhanced with similarity algorithms
  const mergedResults: Array<{
    tweet: TweetData;
    classification: ClassificationResult;
    source: ITKSource;
    additionalSources?: ITKSource[];
  }> = [];

  const processed = new Set<string>();

  for (const item of tweetClassifications) {
    if (processed.has(item.tweet.id)) continue;

    // Find similar tweets (same transfer keywords and entities)
    const similar = tweetClassifications.filter(
      (other) =>
        other.tweet.id !== item.tweet.id &&
        !processed.has(other.tweet.id) &&
        haveSimilarKeywords(
          item.classification.keywords,
          other.classification.keywords
        )
    );

    // Mark similar tweets as processed
    similar.forEach((s) => processed.add(s.tweet.id));
    processed.add(item.tweet.id);

    // Add the main tweet with additional sources
    mergedResults.push({
      ...item,
      additionalSources:
        similar.length > 0 ? similar.map((s) => s.source) : undefined,
    });
  }

  return mergedResults;
};

/**
 * Check if two keyword arrays have significant overlap
 */
const haveSimilarKeywords = (
  keywords1: string[],
  keywords2: string[]
): boolean => {
  const set1 = new Set(keywords1.map((k) => k.toLowerCase()));
  const set2 = new Set(keywords2.map((k) => k.toLowerCase()));

  const intersection = new Set([...set1].filter((k) => set2.has(k)));
  const union = new Set([...set1, ...set2]);

  // Consider similar if >50% keyword overlap
  return intersection.size / union.size > 0.5;
};
