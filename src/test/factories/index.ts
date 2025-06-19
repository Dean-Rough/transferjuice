/**
 * Test Data Factories
 * Generate realistic test data for all entities
 */

import {
  TwitterUser,
  TwitterTweet,
  ProcessedTweet,
  TransferRelevance,
} from '@/lib/validations/twitter';
import {
  Article,
  ArticleSection,
  ContentQuality,
  AIGeneration,
} from '@/lib/validations/article';
import {
  Subscriber,
  EmailCampaign,
  SubscriberPreferences,
} from '@/lib/validations/subscriber';

// Utility function to generate random IDs
const generateId = (prefix: string = '') =>
  `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Twitter User Factory
export const createTwitterUser = (
  overrides: Partial<TwitterUser> = {}
): TwitterUser => {
  const baseUser: TwitterUser = {
    id: generateId('user_'),
    username: `TestUser${Math.floor(Math.random() * 1000)}`,
    name: `Test User ${Math.floor(Math.random() * 1000)}`,
    profile_image_url: 'https://pbs.twimg.com/profile_images/test/avatar.jpg',
    verified: Math.random() > 0.7,
    public_metrics: {
      followers_count: Math.floor(Math.random() * 1000000),
      following_count: Math.floor(Math.random() * 5000),
      tweet_count: Math.floor(Math.random() * 50000),
      listed_count: Math.floor(Math.random() * 10000),
    },
  };

  return { ...baseUser, ...overrides };
};

// Famous ITK accounts factory
export const createITKUser = (
  journalistType: 'tier1' | 'tier2' | 'tier3' = 'tier1'
): TwitterUser => {
  const tier1Users = [
    {
      username: 'FabrizioRomano',
      name: 'Fabrizio Romano',
      followers: 15000000,
    },
    { username: 'DavidOrnstein', name: 'David Ornstein', followers: 1200000 },
    { username: 'SkySportsNews', name: 'Sky Sports News', followers: 8000000 },
  ];

  const tier2Users = [
    {
      username: 'TransferChecker',
      name: 'Transfer Checker',
      followers: 250000,
    },
    {
      username: 'FootballInsider',
      name: 'Football Insider',
      followers: 180000,
    },
  ];

  const tier3Users = [
    { username: 'ITKSource', name: 'ITK Source', followers: 50000 },
    { username: 'TransferGossip', name: 'Transfer Gossip', followers: 25000 },
  ];

  const users =
    journalistType === 'tier1'
      ? tier1Users
      : journalistType === 'tier2'
        ? tier2Users
        : tier3Users;

  const selectedUser = users[Math.floor(Math.random() * users.length)];

  return createTwitterUser({
    username: selectedUser.username,
    name: selectedUser.name,
    verified: journalistType === 'tier1',
    public_metrics: {
      followers_count: selectedUser.followers,
      following_count: Math.floor(Math.random() * 2000),
      tweet_count: Math.floor(Math.random() * 100000),
      listed_count: Math.floor(Math.random() * 20000),
    },
  });
};

// Twitter Tweet Factory
export const createTwitterTweet = (
  overrides: Partial<TwitterTweet> = {}
): TwitterTweet => {
  const transferTexts = [
    '🚨 EXCLUSIVE: {{club1}} are in advanced talks with {{club2}} for {{player}}. Fee could reach £{{fee}}m with add-ons. Here we go! ⚪🔴',
    'BREAKING: {{player}} has agreed personal terms with {{club1}}. Medical scheduled for this week. €{{fee}}m deal.',
    '{{club1}} submit official bid for {{player}}. £{{fee}}m package offered to {{club2}}. Player is keen on the move.',
    'CONFIRMED: {{club1}} complete signing of {{player}} from {{club2}} for £{{fee}}m. 5-year deal agreed.',
  ];

  const clubs = [
    'Arsenal',
    'Chelsea',
    'Manchester United',
    'Liverpool',
    'Manchester City',
    'Tottenham',
    'Brighton',
    'Newcastle',
  ];
  const players = [
    'Declan Rice',
    'Jude Bellingham',
    'Christopher Nkunku',
    'Victor Osimhen',
    'Kai Havertz',
  ];

  const randomText = transferTexts[
    Math.floor(Math.random() * transferTexts.length)
  ]
    .replace('{{club1}}', clubs[Math.floor(Math.random() * clubs.length)])
    .replace('{{club2}}', clubs[Math.floor(Math.random() * clubs.length)])
    .replace('{{player}}', players[Math.floor(Math.random() * players.length)])
    .replace(/\{\{fee\}\}/g, (Math.floor(Math.random() * 100) + 20).toString());

  const baseTweet: TwitterTweet = {
    id: generateId('tweet_'),
    text: randomText,
    author_id: generateId('user_'),
    created_at: new Date(
      Date.now() - Math.random() * 24 * 60 * 60 * 1000
    ).toISOString(),
    conversation_id: generateId('conv_'),
    public_metrics: {
      retweet_count: Math.floor(Math.random() * 5000),
      reply_count: Math.floor(Math.random() * 2000),
      like_count: Math.floor(Math.random() * 20000),
      quote_count: Math.floor(Math.random() * 1000),
      bookmark_count: Math.floor(Math.random() * 3000),
    },
    entities: {
      hashtags: [
        {
          start: randomText.length - 10,
          end: randomText.length - 2,
          tag: 'TransferNews',
        },
      ],
    },
  };

  return { ...baseTweet, ...overrides };
};

// Transfer Relevance Factory
export const createTransferRelevance = (
  relevanceLevel: 'high' | 'medium' | 'low' | 'none' = 'medium'
): TransferRelevance => {
  const baseRelevance: TransferRelevance = {
    isTransferRelated: relevanceLevel !== 'none',
    confidence:
      relevanceLevel === 'high'
        ? 0.9 + Math.random() * 0.1
        : relevanceLevel === 'medium'
          ? 0.6 + Math.random() * 0.3
          : relevanceLevel === 'low'
            ? 0.3 + Math.random() * 0.3
            : Math.random() * 0.3,
    keywords:
      relevanceLevel === 'high'
        ? ['signing', 'medical', 'here we go', 'confirmed']
        : relevanceLevel === 'medium'
          ? ['talks', 'interested', 'bid']
          : relevanceLevel === 'low'
            ? ['linked', 'monitoring']
            : ['holiday', 'dinner', 'weather'],
    entities: {
      players: relevanceLevel !== 'none' ? ['Test Player'] : [],
      clubs: relevanceLevel !== 'none' ? ['Test FC', 'Another FC'] : [],
      agents: relevanceLevel === 'high' ? ['Test Agent'] : [],
      journalists: ['Test Journalist'],
    },
    transferType:
      relevanceLevel === 'high'
        ? 'confirmed'
        : relevanceLevel === 'medium'
          ? 'rumour'
          : relevanceLevel === 'low'
            ? 'rumour'
            : undefined,
    priority:
      relevanceLevel === 'high'
        ? 'high'
        : relevanceLevel === 'medium'
          ? 'medium'
          : 'low',
  };

  return baseRelevance;
};

// Processed Tweet Factory
export const createProcessedTweet = (
  overrides: Partial<ProcessedTweet> = {}
): ProcessedTweet => {
  const tweet = createTwitterTweet();
  const user = createTwitterUser();

  const baseProcessedTweet: ProcessedTweet = {
    id: generateId('processed_'),
    originalTweet: tweet,
    author: user,
    processedAt: new Date(),
    relevance: createTransferRelevance('medium'),
    content: {
      cleanText: tweet.text.replace(/[🚨⚪🔴]/g, '').trim(),
      mentions: [],
      hashtags: ['TransferNews'],
      urls: [],
      mediaUrls: [],
    },
    metadata: {
      wordCount: tweet.text.split(' ').length,
      readabilityScore: 70 + Math.random() * 30,
      sentimentScore: -0.2 + Math.random() * 1.4,
      spamScore: Math.random() * 0.3,
    },
  };

  return { ...baseProcessedTweet, ...overrides };
};

// Content Quality Factory
export const createContentQuality = (
  level: 'high' | 'medium' | 'low' = 'high'
): ContentQuality => {
  const baseScores = {
    high: { base: 85, variance: 15 },
    medium: { base: 70, variance: 15 },
    low: { base: 50, variance: 20 },
  };

  const scores = baseScores[level];

  return {
    grammarScore: Math.max(
      0,
      Math.min(100, scores.base + (Math.random() - 0.5) * scores.variance)
    ),
    readabilityScore: Math.max(
      0,
      Math.min(100, scores.base + (Math.random() - 0.5) * scores.variance)
    ),
    brandVoiceScore: Math.max(
      0,
      Math.min(100, scores.base + (Math.random() - 0.5) * scores.variance)
    ),
    factualAccuracy: Math.max(
      0,
      Math.min(100, scores.base + (Math.random() - 0.5) * scores.variance)
    ),
    engagementPotential: Math.max(
      0,
      Math.min(100, scores.base + (Math.random() - 0.5) * scores.variance)
    ),
    overallScore: Math.max(
      0,
      Math.min(100, scores.base + (Math.random() - 0.5) * scores.variance)
    ),
    flags:
      level === 'low'
        ? ['grammar_issues', 'readability_low']
        : level === 'medium'
          ? ['minor_issues']
          : [],
    humanReviewRequired: level === 'low',
  };
};

// AI Generation Factory
export const createAIGeneration = (
  overrides: Partial<AIGeneration> = {}
): AIGeneration => {
  const baseGeneration: AIGeneration = {
    model: 'gpt-4-turbo',
    prompt:
      'Generate a witty Transfer Juice article based on the provided tweets...',
    temperature: 0.7,
    maxTokens: 2000,
    generatedAt: new Date(),
    processingTime: 1500 + Math.random() * 2000,
    tokenUsage: {
      promptTokens: 500 + Math.floor(Math.random() * 500),
      completionTokens: 800 + Math.floor(Math.random() * 400),
      totalTokens: 1300 + Math.floor(Math.random() * 900),
    },
    qualityChecks: {
      passedAllChecks: Math.random() > 0.2,
      contentFilter: Math.random() > 0.1,
      brandVoiceCheck: Math.random() > 0.15,
      factualityCheck: Math.random() > 0.2,
      grammarCheck: Math.random() > 0.1,
    },
  };

  return { ...baseGeneration, ...overrides };
};

// Article Section Factory
export const createArticleSection = (
  overrides: Partial<ArticleSection> = {}
): ArticleSection => {
  const sectionTypes = [
    'intro',
    'news_item',
    'analysis',
    'roundup',
    'conclusion',
  ] as const;
  const randomType =
    sectionTypes[Math.floor(Math.random() * sectionTypes.length)];

  const baseSection: ArticleSection = {
    id: generateId('section_'),
    type: randomType,
    title: randomType === 'intro' ? undefined : `Test Section Title`,
    content: `This is a test section of type ${randomType}. It contains relevant transfer information and analysis based on the latest reports from reliable sources.`,
    sourceTweets: [
      {
        tweetId: generateId('tweet_'),
        authorHandle: 'TestJournalist',
        relevanceScore: 0.8 + Math.random() * 0.2,
        usedInSections: [generateId('section_')],
        quotedDirectly: Math.random() > 0.5,
      },
    ],
    order: Math.floor(Math.random() * 5),
    wordCount: 50 + Math.floor(Math.random() * 100),
  };

  return { ...baseSection, ...overrides };
};

// Article Factory
export const createArticle = (overrides: Partial<Article> = {}): Article => {
  const briefingTypes = ['morning', 'afternoon', 'evening'] as const;
  const statuses = [
    'draft',
    'ai_generated',
    'under_review',
    'approved',
    'published',
  ] as const;

  const randomBriefingType =
    briefingTypes[Math.floor(Math.random() * briefingTypes.length)];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

  const sections = [
    createArticleSection({ type: 'intro', order: 0 }),
    createArticleSection({ type: 'news_item', order: 1 }),
    createArticleSection({ type: 'analysis', order: 2 }),
  ];

  const totalWordCount = sections.reduce(
    (total, section) => total + section.wordCount,
    0
  );

  const baseArticle: Article = {
    id: generateId('article_'),
    title: 'Test Transfer Article - Major Signing Update',
    subtitle: 'Latest developments in the ongoing transfer saga',
    briefingType: randomBriefingType,
    status: randomStatus,
    sections,
    summary:
      'This is a test article summarizing the latest transfer developments with insights from reliable sources.',
    publishedAt: randomStatus === 'published' ? new Date() : undefined,
    scheduledFor: undefined,
    lastModified: new Date(),
    aiGeneration: createAIGeneration(),
    quality: createContentQuality(),
    sourceTweets: [generateId('tweet_'), generateId('tweet_')],
    totalSourceTweets: 2,
    slug: 'test-transfer-article-major-signing-update',
    metaDescription:
      'Latest transfer developments and analysis from reliable sources in the football world.',
    tags: ['Transfer', 'Test', 'Football', 'Premier League'],
    estimatedReadTime: Math.max(1, Math.floor(totalWordCount / 200)),
    wordCount: totalWordCount,
    sentToSubscribers: false,
  };

  return { ...baseArticle, ...overrides };
};

// Subscriber Preferences Factory
export const createSubscriberPreferences = (
  overrides: Partial<SubscriberPreferences> = {}
): SubscriberPreferences => {
  const teams = [
    'arsenal',
    'chelsea',
    'manchester_united',
    'liverpool',
    'manchester_city',
  ];
  const randomTeams = teams.slice(0, Math.floor(Math.random() * 3) + 1);

  const basePreferences: SubscriberPreferences = {
    emailFrequency: 'all',
    preferredTeams: randomTeams as any,
    receiveBreakingNews: Math.random() > 0.3,
    emailFormat: 'html',
    timezone: 'Europe/London',
    language: 'en',
    includeRumours: Math.random() > 0.4,
    includeConfirmed: Math.random() > 0.1,
    includeLoanDeals: Math.random() > 0.5,
    includeYouthPlayers: Math.random() > 0.7,
    marketingEmails: Math.random() > 0.8,
    surveyParticipation: Math.random() > 0.6,
    feedbackRequests: Math.random() > 0.4,
  };

  return { ...basePreferences, ...overrides };
};

// Subscriber Factory
export const createSubscriber = (
  overrides: Partial<Subscriber> = {}
): Subscriber => {
  const statuses = ['pending', 'active', 'paused', 'unsubscribed'] as const;
  const sources = ['website', 'social_media', 'referral', 'organic'] as const;

  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  const randomSource = sources[Math.floor(Math.random() * sources.length)];

  const subscribedDate = new Date(
    Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
  );
  const confirmedDate =
    randomStatus !== 'pending'
      ? new Date(subscribedDate.getTime() + Math.random() * 24 * 60 * 60 * 1000)
      : undefined;

  const baseSubscriber: Subscriber = {
    id: generateId('sub_'),
    email: `test.user.${Math.floor(Math.random() * 10000)}@example.com`,
    status: randomStatus,
    preferences: createSubscriberPreferences(),
    subscribedAt: subscribedDate,
    confirmedAt: confirmedDate,
    lastEmailSent:
      randomStatus === 'active'
        ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        : undefined,
    lastEngagement:
      randomStatus === 'active'
        ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        : undefined,
    subscriptionSource: randomSource,
    emailsReceived: Math.floor(Math.random() * 100),
    emailsOpened: Math.floor(Math.random() * 80),
    linksClicked: Math.floor(Math.random() * 20),
    lastOpenedAt:
      randomStatus === 'active'
        ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        : undefined,
    gdprConsent: true,
    consentDate: subscribedDate,
    dataProcessingConsent: true,
    createdAt: subscribedDate,
    updatedAt: new Date(),
    isTestAccount: Math.random() > 0.8,
  };

  return { ...baseSubscriber, ...overrides };
};

// Email Campaign Factory
export const createEmailCampaign = (
  overrides: Partial<EmailCampaign> = {}
): EmailCampaign => {
  const types = [
    'briefing',
    'breaking_news',
    'weekly_digest',
    'welcome',
  ] as const;
  const statuses = ['draft', 'scheduled', 'sending', 'sent'] as const;

  const randomType = types[Math.floor(Math.random() * types.length)];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

  const baseCampaign: EmailCampaign = {
    id: generateId('campaign_'),
    name: `Test ${randomType} Campaign`,
    type: randomType,
    subject: `Test Email Subject - ${randomType}`,
    preheader: 'This is a test email campaign preview text',
    htmlContent:
      '<html><body><h1>Test Email</h1><p>This is a test email campaign with sufficient content for validation. It includes multiple paragraphs and proper structure for testing purposes.</p></body></html>',
    textContent:
      'Test Email\n\nThis is a test email campaign with sufficient content for validation. It includes multiple paragraphs and proper structure for testing purposes.',
    targetAudience: {
      includeStatuses: ['active'],
      excludeStatuses: ['unsubscribed', 'bounced'],
    },
    scheduledAt:
      randomStatus === 'scheduled'
        ? new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000)
        : undefined,
    sentAt:
      randomStatus === 'sent'
        ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
        : undefined,
    status: randomStatus,
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    createdBy: 'test_user',
  };

  return { ...baseCampaign, ...overrides };
};

// Batch factory functions
export const createMultipleTwitterUsers = (
  count: number,
  overrides: Partial<TwitterUser> = {}
): TwitterUser[] => {
  return Array.from({ length: count }, () => createTwitterUser(overrides));
};

export const createMultipleTwitterTweets = (
  count: number,
  overrides: Partial<TwitterTweet> = {}
): TwitterTweet[] => {
  return Array.from({ length: count }, () => createTwitterTweet(overrides));
};

export const createMultipleArticles = (
  count: number,
  overrides: Partial<Article> = {}
): Article[] => {
  return Array.from({ length: count }, () => createArticle(overrides));
};

export const createMultipleSubscribers = (
  count: number,
  overrides: Partial<Subscriber> = {}
): Subscriber[] => {
  return Array.from({ length: count }, () => createSubscriber(overrides));
};

// Export all factories as a collection
export const factories = {
  twitterUser: createTwitterUser,
  itkUser: createITKUser,
  twitterTweet: createTwitterTweet,
  transferRelevance: createTransferRelevance,
  processedTweet: createProcessedTweet,
  contentQuality: createContentQuality,
  aiGeneration: createAIGeneration,
  articleSection: createArticleSection,
  article: createArticle,
  subscriberPreferences: createSubscriberPreferences,
  subscriber: createSubscriber,
  emailCampaign: createEmailCampaign,
  multiple: {
    twitterUsers: createMultipleTwitterUsers,
    twitterTweets: createMultipleTwitterTweets,
    articles: createMultipleArticles,
    subscribers: createMultipleSubscribers,
  },
};
