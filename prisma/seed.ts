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
  await prisma.analyticsEvent.deleteMany();
  await prisma.emailSummary.deleteMany();
  await prisma.emailSubscriber.deleteMany();
  await prisma.feedItemMedia.deleteMany();
  await prisma.feedItemTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.feedItem.deleteMany();
  await prisma.iTKSource.deleteMany();
  await prisma.systemConfig.deleteMany();

  // Create ITK sources
  console.log('📰 Creating ITK sources...');
  const itkSources = await Promise.all([
    prisma.iTKSource.create({
      data: {
        name: 'Fabrizio Romano',
        username: 'FabrizioRomano',
        tier: 1,
        reliability: 0.95,
        region: 'GLOBAL',
        isActive: true,
        isVerified: true,
        description: 'Here we go! specialist',
        followerCount: 15000000,
      },
    }),
    prisma.iTKSource.create({
      data: {
        name: 'David Ornstein',
        username: 'David_Ornstein',
        tier: 1,
        reliability: 0.93,
        region: 'UK',
        isActive: true,
        isVerified: true,
        description: 'The Athletic - Premier League specialist',
        followerCount: 850000,
      },
    }),
    prisma.iTKSource.create({
      data: {
        name: 'Gianluca Di Marzio',
        username: 'DiMarzio',
        tier: 1,
        reliability: 0.90,
        region: 'ITALY',
        isActive: true,
        isVerified: true,
        description: 'Sky Italia - Serie A specialist',
        followerCount: 2500000,
      },
    }),
  ]);

  // Create some sample tags
  console.log('🏷️ Creating tags...');
  const tags = await Promise.all([
    prisma.tag.create({
      data: {
        name: 'Arsenal',
        type: 'CLUB',
        normalizedName: 'arsenal',
        isPopular: true,
        league: 'PL',
        country: 'England',
      },
    }),
    prisma.tag.create({
      data: {
        name: 'Manchester United',
        type: 'CLUB',
        normalizedName: 'manchester_united',
        isPopular: true,
        league: 'PL',
        country: 'England',
      },
    }),
    prisma.tag.create({
      data: {
        name: 'Erling Haaland',
        type: 'PLAYER',
        normalizedName: 'erling_haaland',
        isPopular: true,
        position: 'Striker',
        transferValue: BigInt(180000000),
      },
    }),
    prisma.tag.create({
      data: {
        name: 'Fabrizio Romano',
        type: 'SOURCE',
        normalizedName: 'fabrizio_romano',
        isPopular: true,
      },
    }),
  ]);

  // Create sample feed items
  console.log('📡 Creating feed items...');
  const feedItems = await Promise.all([
    prisma.feedItem.create({
      data: {
        sourceId: itkSources[0].id,
        twitterId: 'tweet_001',
        content: 'BREAKING: Arsenal close to finalizing £75m deal for Brighton midfielder. Medical scheduled for tomorrow. #AFC #Transfers',
        terryCommentary: "Right, so Arsenal are apparently 'close' to something again. That's the 47th time this window they've been 'close' to a deal. At this rate they'll be 'close' to winning the league for another decade.",
        originalText: 'BREAKING: Arsenal close to finalizing £75m deal for Brighton midfielder. Medical scheduled for tomorrow. #AFC #Transfers',
        type: 'ITK',
        transferType: 'MEDICAL',
        priority: 'HIGH',
        relevanceScore: 0.95,
        league: 'PL',
        originalUrl: 'https://twitter.com/FabrizioRomano/status/tweet_001',
        originalShares: 2500,
        originalLikes: 8900,
        originalReplies: 445,
        isProcessed: true,
        isPublished: true,
        publishedAt: new Date('2024-01-15T14:30:00Z'),
      },
    }),
    prisma.feedItem.create({
      data: {
        sourceId: itkSources[1].id,
        twitterId: 'tweet_002',
        content: 'Manchester United exploring options for striker position. Several targets identified but nothing concrete yet. #MUFC',
        terryCommentary: "Ah yes, the classic 'exploring options' phase. You know, like when you open Deliveroo at 2am, scroll for 45 minutes, then eat cereal instead. Except this is a billion-pound football club.",
        originalText: 'Manchester United exploring options for striker position. Several targets identified but nothing concrete yet. #MUFC',
        type: 'ITK',
        transferType: 'RUMOUR',
        priority: 'MEDIUM',
        relevanceScore: 0.72,
        league: 'PL',
        originalUrl: 'https://twitter.com/David_Ornstein/status/tweet_002',
        originalShares: 890,
        originalLikes: 3200,
        originalReplies: 156,
        isProcessed: true,
        isPublished: true,
        publishedAt: new Date('2024-01-15T12:15:00Z'),
      },
    }),
  ]);

  // Connect tags to feed items
  console.log('🔗 Connecting tags to feed items...');
  await prisma.feedItemTag.createMany({
    data: [
      { feedItemId: feedItems[0].id, tagId: tags[0].id }, // Arsenal
      { feedItemId: feedItems[0].id, tagId: tags[3].id }, // Fabrizio Romano
      { feedItemId: feedItems[1].id, tagId: tags[1].id }, // Manchester United
    ],
  });

  // Create sample email subscribers
  console.log('📧 Creating email subscribers...');
  await prisma.emailSubscriber.createMany({
    data: [
      {
        email: 'test1@example.com',
        isActive: true,
        isVerified: true,
        frequency: 'DAILY',
        preferredTime: '08:00',
        lastEmailSent: new Date(),
      },
      {
        email: 'test2@example.com',
        isActive: true,
        isVerified: true,
        frequency: 'DAILY',
        preferredTime: '18:00',
      },
      {
        email: 'test3@example.com',
        isActive: true,
        isVerified: false,
        frequency: 'DAILY',
        preferredTime: '08:00',
      },
    ],
  });

  // Create some analytics events
  console.log('📊 Creating analytics events...');
  await prisma.analyticsEvent.createMany({
    data: [
      {
        type: 'feed_view',
        sessionId: 'session_001',
        metadata: {
          page: 'homepage',
          userAgent: 'Mozilla/5.0',
          referrer: 'google.com',
        },
      },
      {
        type: 'tag_click',
        tagId: tags[0].id,
        sessionId: 'session_001',
        metadata: {
          tagName: 'Arsenal',
          tagType: 'CLUB',
        },
      },
    ],
  });

  // Create system config
  console.log('⚙️ Creating system config...');
  await prisma.systemConfig.create({
    data: {
      key: 'monitoring_interval',
      value: '60',
      description: 'ITK source monitoring interval in seconds',
    },
  });

  console.log('✅ Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });