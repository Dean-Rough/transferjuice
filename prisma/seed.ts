/**
 * Database Seeding Script for Transfer Juice
 * Creates realistic test data for development and testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  console.log('📝 Cleaning existing data...');
  await prisma.emailDelivery.deleteMany();
  await prisma.subscriberAnalytics.deleteMany();
  await prisma.contentAnalytics.deleteMany();
  await prisma.systemAnalytics.deleteMany();
  await prisma.newsletterArticle.deleteMany();
  await prisma.articleTweet.deleteMany();
  await prisma.newsletter.deleteMany();
  await prisma.article.deleteMany();
  await prisma.subscriber.deleteMany();
  await prisma.tweet.deleteMany();
  await prisma.jobQueue.deleteMany();
  await prisma.appConfig.deleteMany();

  // Create sample tweets
  console.log('🐦 Creating sample tweets...');
  const tweets = await Promise.all([
    prisma.tweet.create({
      data: {
        id: 'tweet_001',
        text: 'BREAKING: Arsenal close to finalizing £75m deal for Brighton midfielder. Medical scheduled for tomorrow. #AFC #Transfers',
        authorId: 'fab_romano',
        authorHandle: 'FabrizioRomano',
        authorName: 'Fabrizio Romano',
        authorVerified: true,
        authorFollowers: 15000000,
        createdAt: new Date('2024-01-15T14:30:00Z'),
        retweetCount: 2500,
        likeCount: 8900,
        replyCount: 445,
        quoteCount: 180,
        viewCount: 125000,
        language: 'en',
        hashtags: ['AFC', 'Transfers'],
        mentions: [],
        urls: [],
        isTransferRelated: true,
        confidence: 0.95,
        transferType: 'CONFIRMED',
        priority: 'HIGH',
        keywords: ['deal', 'medical', 'finalizing', 'Brighton', 'midfielder'],
        playersExtracted: ['Brighton midfielder'],
        clubsExtracted: ['Arsenal', 'Brighton'],
        agentsExtracted: [],
        processed: true,
        processedAt: new Date('2024-01-15T14:35:00Z'),
      },
    }),
    prisma.tweet.create({
      data: {
        id: 'tweet_002',
        text: 'Manchester United exploring options for striker position. Several targets identified but nothing concrete yet. #MUFC',
        authorId: 'david_ornstein',
        authorHandle: 'DavidOrnstein',
        authorName: 'David Ornstein',
        authorVerified: true,
        authorFollowers: 850000,
        createdAt: new Date('2024-01-15T12:15:00Z'),
        retweetCount: 890,
        likeCount: 3200,
        replyCount: 156,
        quoteCount: 67,
        viewCount: 45000,
        language: 'en',
        hashtags: ['MUFC'],
        mentions: [],
        urls: [],
        isTransferRelated: true,
        confidence: 0.72,
        transferType: 'RUMOUR',
        priority: 'MEDIUM',
        keywords: ['exploring', 'options', 'striker', 'targets'],
        playersExtracted: [],
        clubsExtracted: ['Manchester United'],
        agentsExtracted: [],
        processed: true,
        processedAt: new Date('2024-01-15T12:20:00Z'),
      },
    }),
    prisma.tweet.create({
      data: {
        id: 'tweet_003',
        text: 'Beautiful sunset from my hotel balcony. Sometimes you need to pause and appreciate the simple things in life 🌅',
        authorId: 'transfer_guy',
        authorHandle: 'TransferGuy',
        authorName: 'Transfer Guy',
        authorVerified: false,
        authorFollowers: 45000,
        createdAt: new Date('2024-01-15T18:45:00Z'),
        retweetCount: 12,
        likeCount: 89,
        replyCount: 8,
        quoteCount: 2,
        viewCount: 1200,
        language: 'en',
        hashtags: [],
        mentions: [],
        urls: [],
        isTransferRelated: false,
        confidence: 0.05,
        transferType: null,
        priority: 'LOW',
        keywords: ['sunset', 'hotel', 'balcony'],
        playersExtracted: [],
        clubsExtracted: [],
        agentsExtracted: [],
        processed: true,
        processedAt: new Date('2024-01-15T18:50:00Z'),
      },
    }),
  ]);

  // Create sample articles
  console.log('📰 Creating sample articles...');
  const articles = await Promise.all([
    prisma.article.create({
      data: {
        title: 'Arsenal Close to Completing Major Midfield Signing',
        slug: 'arsenal-close-major-midfield-signing',
        content: {
          sections: [
            {
              id: 'intro',
              type: 'introduction',
              title: 'The Deal Takes Shape',
              content:
                'Arsenal are reportedly on the verge of securing a major midfield signing, with Brighton midfielder set to undergo medical examinations tomorrow.',
              sourceTweets: ['tweet_001'],
              order: 1,
              wordCount: 156,
            },
            {
              id: 'analysis',
              type: 'analysis',
              title: 'What This Means for Arsenal',
              content:
                "This potential signing would represent a significant investment in Arsenal's midfield, addressing key tactical needs identified by the coaching staff.",
              sourceTweets: [],
              order: 2,
              wordCount: 134,
            },
          ],
        },
        summary:
          'Arsenal are close to finalizing a £75m deal for a Brighton midfielder, with medical scheduled for tomorrow.',
        metaDescription:
          'Arsenal nearing completion of major midfield signing from Brighton for £75m. Medical scheduled.',
        briefingType: 'AFTERNOON',
        wordCount: 290,
        estimatedReadTime: 2,
        tags: ['Arsenal', 'Brighton', 'Transfers', 'Midfield'],
        status: 'PUBLISHED',
        publishedAt: new Date('2024-01-15T15:00:00Z'),
        aiModel: 'gpt-4',
        aiPromptVersion: 'v1.2',
        generationTime: 3.2,
        tokensUsed: 450,
        qualityScore: 92.5,
        brandVoiceScore: 89.0,
        factualityScore: 95.0,
        readabilityScore: 88.5,
        qualityFlags: [],
        humanReviewRequired: false,
        featuredImageUrl: 'https://example.com/arsenal-training.jpg',
        featuredImageAlt: 'Arsenal players training at London Colney',
        imageCredits: 'Getty Images',
        views: 1250,
        emailOpens: 890,
        emailClicks: 156,
      },
    }),
  ]);

  // Create subscribers
  console.log('👥 Creating sample subscribers...');
  const subscribers = await Promise.all([
    prisma.subscriber.create({
      data: {
        email: 'john.smith@example.com',
        firstName: 'John',
        lastName: 'Smith',
        timezone: 'Europe/London',
        country: 'GB',
        status: 'CONFIRMED',
        confirmedAt: new Date('2024-01-10T10:00:00Z'),
        favoriteTeams: ['Arsenal', 'England'],
        contentPreferences: ['TRANSFERS_ONLY', 'INJURY_NEWS'],
        totalOpens: 45,
        totalClicks: 12,
        lastOpenAt: new Date('2024-01-14T08:30:00Z'),
        lastClickAt: new Date('2024-01-13T14:15:00Z'),
        engagementScore: 0.85,
        source: 'website',
      },
    }),
    prisma.subscriber.create({
      data: {
        email: 'sarah.jones@example.com',
        firstName: 'Sarah',
        lastName: 'Jones',
        timezone: 'America/New_York',
        country: 'US',
        status: 'CONFIRMED',
        confirmedAt: new Date('2024-01-08T15:20:00Z'),
        favoriteTeams: ['Manchester United', 'Liverpool'],
        contentPreferences: ['TRANSFERS_ONLY', 'MATCH_ANALYSIS'],
        totalOpens: 32,
        totalClicks: 8,
        lastOpenAt: new Date('2024-01-15T07:45:00Z'),
        lastClickAt: new Date('2024-01-15T07:50:00Z'),
        engagementScore: 0.72,
        source: 'twitter',
        campaign: 'winter_transfer_window',
      },
    }),
  ]);

  // Create newsletter
  console.log('📧 Creating sample newsletter...');
  const newsletter = await prisma.newsletter.create({
    data: {
      subject: 'Transfer Juice Afternoon Brief - January 15, 2024',
      preheader:
        'Arsenal close to major signing, United exploring striker options',
      briefingType: 'AFTERNOON',
      briefingDate: new Date('2024-01-15'),
      htmlContent:
        '<html><body><h1>Transfer Juice Afternoon Brief</h1><p>Arsenal are close...</p></body></html>',
      textContent:
        'Transfer Juice Afternoon Brief\n\nArsenal are close to completing...',
      status: 'SENT',
      sentAt: new Date('2024-01-15T14:00:00Z'),
      recipientCount: 1250,
      deliveredCount: 1238,
      openCount: 892,
      clickCount: 156,
      unsubscribeCount: 2,
      bounceCount: 12,
      spamCount: 0,
    },
  });

  // Link article to tweet
  await prisma.articleTweet.create({
    data: {
      articleId: articles[0].id,
      tweetId: tweets[0].id,
      relevanceScore: 0.95,
      usedInSections: ['intro'],
      quotedDirectly: true,
    },
  });

  // Link article to newsletter
  await prisma.newsletterArticle.create({
    data: {
      newsletterId: newsletter.id,
      articleId: articles[0].id,
      order: 1,
    },
  });

  // Create email deliveries
  console.log('📮 Creating sample email deliveries...');
  for (const subscriber of subscribers) {
    await prisma.emailDelivery.create({
      data: {
        subscriberId: subscriber.id,
        newsletterId: newsletter.id,
        status: 'DELIVERED',
        sentAt: new Date('2024-01-15T14:00:00Z'),
        deliveredAt: new Date('2024-01-15T14:02:00Z'),
        openedAt:
          subscriber.email === 'john.smith@example.com'
            ? new Date('2024-01-15T14:30:00Z')
            : undefined,
        openCount: subscriber.email === 'john.smith@example.com' ? 2 : 0,
        clickCount: subscriber.email === 'john.smith@example.com' ? 1 : 0,
        lastClickAt:
          subscriber.email === 'john.smith@example.com'
            ? new Date('2024-01-15T14:35:00Z')
            : undefined,
        messageId: `msg_${subscriber.id}_${newsletter.id}`,
      },
    });
  }

  // Create analytics
  console.log('📊 Creating sample analytics...');
  const today = new Date('2024-01-15');

  await prisma.systemAnalytics.create({
    data: {
      date: today,
      tweetsProcessed: 450,
      transferRelevant: 89,
      articlesGenerated: 12,
      emailsSent: 1250,
      emailsDelivered: 1238,
      emailsOpened: 892,
      emailsClicked: 156,
      avgProcessingTime: 2.3,
      errorRate: 0.02,
      systemUptime: 99.8,
      aiTokensUsed: 15680,
      estimatedCost: 4.25,
    },
  });

  // Create job queue entries
  console.log('⚙️ Creating sample job queue...');
  await prisma.jobQueue.create({
    data: {
      type: 'FETCH_TWEETS',
      payload: {
        accounts: ['FabrizioRomano', 'DavidOrnstein'],
        sinceId: 'tweet_003',
      },
      scheduledFor: new Date(Date.now() + 3600000), // 1 hour from now
      priority: 'HIGH',
    },
  });

  // Create app config
  console.log('⚡ Creating app configuration...');
  await prisma.appConfig.createMany({
    data: [
      {
        key: 'TWEET_FETCH_INTERVAL',
        value: 900, // 15 minutes
        description: 'Interval in seconds between tweet fetching',
        category: 'scheduling',
      },
      {
        key: 'BRIEFING_TIMES',
        value: {
          morning: '08:00',
          afternoon: '14:00',
          evening: '20:00',
        },
        description: 'Daily briefing generation times (BST)',
        category: 'scheduling',
      },
      {
        key: 'QUALITY_THRESHOLDS',
        value: {
          minimum: 70.0,
          human_review: 85.0,
          auto_publish: 90.0,
        },
        description: 'Content quality score thresholds',
        category: 'quality',
      },
      {
        key: 'TARGET_ITK_ACCOUNTS',
        value: [
          'FabrizioRomano',
          'DavidOrnstein',
          'SkySportsNews',
          'BBCSport',
          'transferchecker',
        ],
        description: 'Twitter accounts to monitor for transfer news',
        category: 'sources',
      },
    ],
  });

  console.log('✅ Database seeding completed successfully!');
  console.log(`📝 Created:`);
  console.log(`   - ${tweets.length} tweets`);
  console.log(`   - ${articles.length} articles`);
  console.log(`   - ${subscribers.length} subscribers`);
  console.log(`   - 1 newsletter`);
  console.log(`   - 2 email deliveries`);
  console.log(`   - 1 system analytics record`);
  console.log(`   - 1 job queue entry`);
  console.log(`   - 4 app config entries`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
