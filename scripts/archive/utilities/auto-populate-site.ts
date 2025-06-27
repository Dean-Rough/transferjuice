/**
 * Auto-populate site with content
 * Generates feed items, briefings, and ensures everything is published
 */

import { PrismaClient } from '@prisma/client';
import { ITK_ACCOUNTS } from '@/lib/twitter/itk-monitor';
import { generateBriefing } from '@/briefing-generator/orchestrator';

const prisma = new PrismaClient();

// Enhanced mock tweets for demonstration
const mockTweets = [
  {
    id: 'tweet-arsenal-rice',
    text: '🚨 BREAKING: Arsenal agree €65M fee for Declan Rice! Medical scheduled for tomorrow. Personal terms already agreed. Here we go! ✅',
    sourceUsername: 'FabrizioRomano',
    priority: 'HIGH' as const,
    transferType: 'CONFIRMED' as const,
    relevanceScore: 1.0,
    clubs: ['Arsenal', 'West Ham'],
    players: ['Declan Rice'],
  },
  {
    id: 'tweet-mbappe-madrid',
    text: 'Personal terms agreed between Kylian Mbappé and Real Madrid. Club-to-club negotiations ongoing for final fee structure.',
    sourceUsername: 'David_Ornstein',
    priority: 'HIGH' as const,
    transferType: 'PERSONAL_TERMS' as const,
    relevanceScore: 0.95,
    clubs: ['Real Madrid', 'PSG'],
    players: ['Kylian Mbappé'],
  },
  {
    id: 'tweet-osimhen-juve',
    text: 'CONFIRMED: Juventus complete signing of Victor Osimhen from Napoli. Medical tests completed successfully. 5-year contract agreed.',
    sourceUsername: 'DiMarzio',
    priority: 'HIGH' as const,
    transferType: 'SIGNING' as const,
    relevanceScore: 1.0,
    clubs: ['Juventus', 'Napoli'],
    players: ['Victor Osimhen'],
  },
  {
    id: 'tweet-musiala-bayern',
    text: 'Bayern Munich officials confident about completing Jamal Musiala contract extension. Talks progressing well.',
    sourceUsername: 'SkySportNewsHD',
    priority: 'MEDIUM' as const,
    transferType: 'EXTENSION' as const,
    relevanceScore: 0.85,
    clubs: ['Bayern Munich'],
    players: ['Jamal Musiala'],
  },
  {
    id: 'tweet-pedri-united',
    text: 'EXCLUSIVE: Manchester United monitoring Pedri situation at Barcelona. Initial contact made with agents.',
    sourceUsername: 'marca',
    priority: 'MEDIUM' as const,
    transferType: 'RUMOUR' as const,
    relevanceScore: 0.75,
    clubs: ['Manchester United', 'Barcelona'],
    players: ['Pedri'],
  },
  {
    id: 'tweet-enzo-chelsea',
    text: 'Chelsea preparing €80M bid for Enzo Fernández. Player keen on Premier League move. #CFC',
    sourceUsername: 'SkySportNewsHD',
    priority: 'HIGH' as const,
    transferType: 'BID' as const,
    relevanceScore: 0.88,
    clubs: ['Chelsea', 'Benfica'],
    players: ['Enzo Fernández'],
  },
];

async function autoPopulateSite() {
  console.log('🚀 Auto-populating TransferJuice site...\n');

  try {
    // 1. Sync ITK sources
    console.log('📡 Syncing ITK sources...');
    for (const account of ITK_ACCOUNTS) {
      await prisma.iTKSource.upsert({
        where: { username: account.username },
        update: {
          reliability: account.reliabilityScore,
          tier: account.tier === 'tier1' ? 1 : account.tier === 'tier2' ? 2 : 3,
          region: account.region || 'GLOBAL',
        },
        create: {
          name: account.displayName,
          username: account.username,
          tier: account.tier === 'tier1' ? 1 : account.tier === 'tier2' ? 2 : 3,
          reliability: account.reliabilityScore,
          region: account.region || 'GLOBAL',
          isActive: true,
          isVerified: account.isVerified || false,
        },
      });
    }
    console.log(`✅ Synced ${ITK_ACCOUNTS.length} ITK sources\n`);

    // 2. Create feed items with Terry commentary
    console.log('📰 Creating feed items with Terry commentary...');
    const createdFeedItems = [];
    
    for (const tweet of mockTweets) {
      const source = await prisma.iTKSource.findUnique({
        where: { username: tweet.sourceUsername },
      });

      if (!source) continue;

      const feedItem = await prisma.feedItem.upsert({
        where: { id: tweet.id },
        update: {
          content: tweet.text,
          terryCommentary: generateTerryCommentary(tweet),
          priority: tweet.priority,
          transferType: tweet.transferType,
          relevanceScore: tweet.relevanceScore,
          isPublished: true,
          isProcessed: true,
          publishedAt: new Date(Date.now() - Math.random() * 86400000),
        },
        create: {
          id: tweet.id,
          content: tweet.text,
          originalText: tweet.text,
          terryCommentary: generateTerryCommentary(tweet),
          sourceId: source.id,
          priority: tweet.priority,
          transferType: tweet.transferType,
          relevanceScore: tweet.relevanceScore,
          isPublished: true,
          isProcessed: true,
          publishedAt: new Date(Date.now() - Math.random() * 86400000), // Random time in last 24h
          processedAt: new Date(),
        },
      });

      createdFeedItems.push(feedItem);
      console.log(`✅ Created: ${tweet.players[0]} → ${tweet.clubs[0]}`);
    }

    // 3. Create tags
    console.log('\n🏷️  Creating tags...');
    const allClubs = [...new Set(mockTweets.flatMap(t => t.clubs))];
    const allPlayers = [...new Set(mockTweets.flatMap(t => t.players))];

    for (const club of allClubs) {
      await prisma.tag.upsert({
        where: { name: club },
        update: {},
        create: {
          name: club,
          type: 'CLUB',
          normalizedName: club.toLowerCase().replace(/\s+/g, '-'),
          usageCount: 1,
        },
      });
    }

    for (const player of allPlayers) {
      await prisma.tag.upsert({
        where: { name: player },
        update: {},
        create: {
          name: player,
          type: 'PLAYER',
          normalizedName: player.toLowerCase().replace(/\s+/g, '-'),
          usageCount: 1,
        },
      });
    }
    console.log(`✅ Created ${allClubs.length} club tags and ${allPlayers.length} player tags\n`);

    // 4. Generate a new briefing
    console.log('🎬 Generating new briefing with all content...');
    const briefingResult = await generateBriefing({
      timestamp: new Date(),
      testMode: false,
      forceRegenerate: true,
    });

    if (briefingResult.success) {
      // Ensure briefing is published
      await prisma.briefing.update({
        where: { id: briefingResult.briefing.id },
        data: { 
          isPublished: true,
          publishedAt: new Date(),
        },
      });
      
      console.log(`✅ Briefing generated and published: ${briefingResult.briefing.title}`);
      console.log(`   URL: /briefings/${briefingResult.briefing.slug}`);
    }

    // 5. Summary
    const stats = await prisma.$transaction([
      prisma.feedItem.count({ where: { isPublished: true } }),
      prisma.briefing.count({ where: { isPublished: true } }),
      prisma.tag.count(),
      prisma.iTKSource.count({ where: { isActive: true } }),
    ]);

    console.log('\n📊 Site Population Summary:');
    console.log('==========================');
    console.log(`✅ Published feed items: ${stats[0]}`);
    console.log(`✅ Published briefings: ${stats[1]}`);
    console.log(`✅ Total tags: ${stats[2]}`);
    console.log(`✅ Active ITK sources: ${stats[3]}`);
    console.log('\n🎉 Site successfully populated and ready to view!');
    console.log('🌐 Open http://localhost:4433 to see your content');
    console.log('\n💡 Note: Make sure your dev server is running with: npm run dev');

  } catch (error) {
    console.error('❌ Error populating site:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function generateTerryCommentary(tweet: typeof mockTweets[0]): string {
  const terryLines = [
    `BREAKING: ${tweet.players[0]} to ${tweet.clubs[0]} is happening, which means we'll spend the next 72 hours analyzing their sock choices.`,
    `Another day, another £${Math.floor(Math.random() * 50 + 30)}m being thrown around like it's Monopoly money. ${tweet.players[0]} must be loving this.`,
    `${tweet.clubs[0]} preparing to splash cash on ${tweet.players[0]}. Someone's clearly been at the champagne again.`,
    `Personal terms agreed, which in football means they've successfully negotiated who pays for the private jet.`,
    `Medical scheduled for ${tweet.players[0]}. Doctors will check if they can kick a ball and count to ten. Revolutionary stuff.`,
    `Here we go! The three words that launch a thousand memes and make grown adults cry with joy. ${tweet.players[0]} incoming.`,
  ];

  return terryLines[Math.floor(Math.random() * terryLines.length)];
}

// Run the script
autoPopulateSite();