/**
 * Database Seeding Script for Transfer Juice
 * Creates realistic test data for development and testing
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // Clean existing data
  console.log("Cleaning existing data...");
  await prisma.analyticsEvent.deleteMany();
  await prisma.briefingEmail.deleteMany();
  await prisma.emailSummary.deleteMany();
  await prisma.emailSubscriber.deleteMany();
  await prisma.briefingMedia.deleteMany();
  await prisma.briefingTag.deleteMany();
  await prisma.briefingFeedItem.deleteMany();
  await prisma.briefing.deleteMany();
  await prisma.feedItemMedia.deleteMany();
  await prisma.feedItemTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.feedItem.deleteMany();
  await prisma.iTKSource.deleteMany();
  await prisma.systemConfig.deleteMany();

  // Create ITK sources
  console.log("Creating ITK sources...");
  const itkSources = await Promise.all([
    prisma.iTKSource.create({
      data: {
        name: "Fabrizio Romano",
        username: "FabrizioRomano",
        tier: 1,
        reliability: 0.95,
        region: "GLOBAL",
        isActive: true,
        isVerified: true,
        description: "Here we go! specialist",
        followerCount: 15000000,
      },
    }),
    prisma.iTKSource.create({
      data: {
        name: "David Ornstein",
        username: "David_Ornstein",
        tier: 1,
        reliability: 0.93,
        region: "UK",
        isActive: true,
        isVerified: true,
        description: "The Athletic - Premier League specialist",
        followerCount: 850000,
      },
    }),
    prisma.iTKSource.create({
      data: {
        name: "Gianluca Di Marzio",
        username: "DiMarzio",
        tier: 1,
        reliability: 0.9,
        region: "ITALY",
        isActive: true,
        isVerified: true,
        description: "Sky Italia - Serie A specialist",
        followerCount: 2500000,
      },
    }),
  ]);

  // Create some sample tags
  console.log("Creating tags...");
  const tags = await Promise.all([
    prisma.tag.create({
      data: {
        name: "Arsenal",
        type: "CLUB",
        normalizedName: "arsenal",
        isPopular: true,
        league: "PL",
        country: "England",
      },
    }),
    prisma.tag.create({
      data: {
        name: "Manchester United",
        type: "CLUB",
        normalizedName: "manchester_united",
        isPopular: true,
        league: "PL",
        country: "England",
      },
    }),
    prisma.tag.create({
      data: {
        name: "Erling Haaland",
        type: "PLAYER",
        normalizedName: "erling_haaland",
        isPopular: true,
        position: "Striker",
        transferValue: BigInt(180000000),
      },
    }),
    prisma.tag.create({
      data: {
        name: "Fabrizio Romano",
        type: "SOURCE",
        normalizedName: "fabrizio_romano",
        isPopular: true,
      },
    }),
  ]);

  // Create sample feed items
  console.log("Creating feed items...");
  const feedItems = await Promise.all([
    prisma.feedItem.create({
      data: {
        sourceId: itkSources[0].id,
        twitterId: "tweet_001",
        content:
          "BREAKING: Arsenal close to finalizing £75m deal for Brighton midfielder. Medical scheduled for tomorrow. #AFC #Transfers",
        terryCommentary:
          "Right, so Arsenal are apparently 'close' to something again. That's the 47th time this window they've been 'close' to a deal. At this rate they'll be 'close' to winning the league for another decade.",
        originalText:
          "BREAKING: Arsenal close to finalizing £75m deal for Brighton midfielder. Medical scheduled for tomorrow. #AFC #Transfers",
        type: "ITK",
        transferType: "MEDICAL",
        priority: "HIGH",
        relevanceScore: 0.95,
        league: "PL",
        originalUrl: "https://twitter.com/FabrizioRomano/status/tweet_001",
        originalShares: 2500,
        originalLikes: 8900,
        originalReplies: 445,
        isProcessed: true,
        isPublished: true,
        publishedAt: new Date("2024-01-15T14:30:00Z"),
      },
    }),
    prisma.feedItem.create({
      data: {
        sourceId: itkSources[1].id,
        twitterId: "tweet_002",
        content:
          "Manchester United exploring options for striker position. Several targets identified but nothing concrete yet. #MUFC",
        terryCommentary:
          "Ah yes, the classic 'exploring options' phase. You know, like when you open Deliveroo at 2am, scroll for 45 minutes, then eat cereal instead. Except this is a billion-pound football club.",
        originalText:
          "Manchester United exploring options for striker position. Several targets identified but nothing concrete yet. #MUFC",
        type: "ITK",
        transferType: "RUMOUR",
        priority: "MEDIUM",
        relevanceScore: 0.72,
        league: "PL",
        originalUrl: "https://twitter.com/David_Ornstein/status/tweet_002",
        originalShares: 890,
        originalLikes: 3200,
        originalReplies: 156,
        isProcessed: true,
        isPublished: true,
        publishedAt: new Date("2024-01-15T12:15:00Z"),
      },
    }),
  ]);

  // Connect tags to feed items
  console.log("Connecting tags to feed items...");
  await prisma.feedItemTag.createMany({
    data: [
      { feedItemId: feedItems[0].id, tagId: tags[0].id }, // Arsenal
      { feedItemId: feedItems[0].id, tagId: tags[3].id }, // Fabrizio Romano
      { feedItemId: feedItems[1].id, tagId: tags[1].id }, // Manchester United
    ],
  });

  // Create sample email subscribers
  console.log("Creating email subscribers...");
  await prisma.emailSubscriber.createMany({
    data: [
      {
        email: "test1@example.com",
        isActive: true,
        isVerified: true,
        frequency: "DAILY",
        preferredTime: "08:00",
        lastEmailSent: new Date(),
      },
      {
        email: "test2@example.com",
        isActive: true,
        isVerified: true,
        frequency: "DAILY",
        preferredTime: "18:00",
      },
      {
        email: "test3@example.com",
        isActive: true,
        isVerified: false,
        frequency: "DAILY",
        preferredTime: "08:00",
      },
    ],
  });

  // Create some analytics events
  console.log("Creating analytics events...");
  await prisma.analyticsEvent.createMany({
    data: [
      {
        type: "feed_view",
        sessionId: "session_001",
        metadata: {
          page: "homepage",
          userAgent: "Mozilla/5.0",
          referrer: "google.com",
        },
      },
      {
        type: "tag_click",
        tagId: tags[0].id,
        sessionId: "session_001",
        metadata: {
          tagName: "Arsenal",
          tagType: "CLUB",
        },
      },
    ],
  });

  // Create system config
  console.log("Creating system config...");
  await prisma.systemConfig.create({
    data: {
      key: "monitoring_interval",
      value: "60",
      description: "ITK source monitoring interval in seconds",
    },
  });

  // Create sample briefings
  console.log("Creating sample briefings...");
  const now = new Date();
  const briefing = await prisma.briefing.create({
    data: {
      slug: "january-15-2024-transfer-briefing",
      timestamp: now,
      title: {
        main: "Transfer Window Madness Continues",
        subtitle: "Arsenal close deals while United explore options",
      },
      visualTimeline: [],
      sidebarSections: [],
      content: [
        {
          id: "intro",
          type: "intro",
          title: "Welcome to Today's Transfer Chaos",
          content:
            "Another day, another collection of millionaires playing musical chairs. Today's update features Arsenal actually doing something useful for once, while Manchester United continue their tradition of 'exploring options' like they're browsing Netflix on a Sunday afternoon.",
          order: 1,
        },
        {
          id: "arsenal-transfer",
          type: "transfer",
          title: "Arsenal Close to Brighton Deal",
          content:
            "Arsenal are apparently 'close' to finalizing a £75m deal for Brighton midfielder. Medical scheduled for tomorrow. That's the 47th time this window they've been 'close' to a deal. At this rate they'll be 'close' to winning the league for another decade.\n\nThe Brighton player in question (whose name we'll definitely spell wrong in tomorrow's briefing) is reportedly excited about the move. Although given Arsenal's track record, he might want to keep his Brighton house keys just in case.",
          order: 2,
        },
        {
          id: "united-options",
          type: "transfer",
          title: "United's Eternal Option Exploration",
          content:
            "Manchester United are 'exploring options' for a striker position. Several targets identified but nothing concrete yet. Ah yes, the classic 'exploring options' phase. You know, like when you open Deliveroo at 2am, scroll for 45 minutes, then eat cereal instead. Except this is a billion-pound football club.\n\nSources suggest they're looking at 'world-class' options, which in United terms usually means someone who scored a goal that one time in the Champions League.",
          order: 3,
        },
        {
          id: "outro",
          type: "outro",
          title: "That's All For Now",
          content:
            "And that's today's dose of transfer madness. Remember, in the world of football transfers, being 'close' is like being 'almost pregnant' - it either happens or it doesn't. Check back in an hour when we'll undoubtedly have more tales of astronomical fees for players you've never heard of.",
          order: 4,
        },
      ],
      readTime: 3,
      wordCount: 296,
      terryScore: 0.87,
      isPublished: true,
      publishedAt: now,
    },
  });

  // Connect briefing to feed items
  await Promise.all([
    prisma.briefingFeedItem.create({
      data: {
        briefingId: briefing.id,
        feedItemId: feedItems[0].id,
        position: 0,
        section: "arsenal-transfer",
      },
    }),
    prisma.briefingFeedItem.create({
      data: {
        briefingId: briefing.id,
        feedItemId: feedItems[1].id,
        position: 1,
        section: "united-options",
      },
    }),
  ]);

  // Connect briefing to tags
  await Promise.all([
    prisma.briefingTag.create({
      data: {
        briefingId: briefing.id,
        tagId: tags[0].id, // Arsenal
        relevance: 0.9,
      },
    }),
    prisma.briefingTag.create({
      data: {
        briefingId: briefing.id,
        tagId: tags[1].id, // Manchester United
        relevance: 0.8,
      },
    }),
  ]);

  console.log("Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
