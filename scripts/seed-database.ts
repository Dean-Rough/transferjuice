/**
 * Database Seed Script
 * Populates the database with initial ITK sources and common tags
 */

import { PrismaClient } from '@prisma/client';
import { League, TagType } from '@prisma/client';

const prisma = new PrismaClient();

// Global ITK Sources - Tier 1 and 2 from major regions
const ITK_SOURCES = [
  // Tier 1 - Most Reliable
  {
    name: 'Fabrizio Romano',
    username: 'FabrizioRomano',
    tier: 1,
    reliability: 0.95,
    region: 'GLOBAL',
    isActive: true,
    isVerified: true,
    description: 'Here we go! Global transfer expert with worldwide network',
    followerCount: 19000000,
  },
  {
    name: 'David Ornstein',
    username: 'David_Ornstein',
    tier: 1,
    reliability: 0.98,
    region: 'UK',
    isActive: true,
    isVerified: true,
    description: 'The Athletic UK - Premier League specialist',
    followerCount: 2100000,
  },
  {
    name: 'Gianluca Di Marzio',
    username: 'DiMarzio',
    tier: 1,
    reliability: 0.92,
    region: 'IT',
    isActive: true,
    isVerified: true,
    description: 'Italian transfer expert - Serie A specialist',
    followerCount: 2800000,
  },
  {
    name: 'Mohamed Bouhafsi',
    username: 'mohamedbouhafsi',
    tier: 1,
    reliability: 0.90,
    region: 'FR',
    isActive: true,
    isVerified: true,
    description: 'RMC Sport - French football specialist',
    followerCount: 1200000,
  },
  {
    name: 'Florian Plettenberg',
    username: 'Plettigoal',
    tier: 1,
    reliability: 0.88,
    region: 'DE',
    isActive: true,
    isVerified: true,
    description: 'Sky Sport DE - Bundesliga transfer expert',
    followerCount: 800000,
  },

  // Tier 2 - Reliable but regional/club specific
  {
    name: 'James Pearce',
    username: 'JamesPearceLFC',
    tier: 2,
    reliability: 0.85,
    region: 'UK',
    isActive: true,
    isVerified: true,
    description: 'The Athletic - Liverpool specialist',
    followerCount: 650000,
  },
  {
    name: 'Simon Stone',
    username: 'sistoney67',
    tier: 2,
    reliability: 0.82,
    region: 'UK',
    isActive: true,
    isVerified: true,
    description: 'BBC Sport - Manchester clubs specialist',
    followerCount: 420000,
  },
  {
    name: 'Matteo Moretto',
    username: 'MatteMoretto',
    tier: 2,
    reliability: 0.80,
    region: 'ES',
    isActive: true,
    isVerified: true,
    description: 'Relevo - Spanish football transfers',
    followerCount: 380000,
  },
  {
    name: 'Santi Aouna',
    username: 'Santi_J_FM',
    tier: 2,
    reliability: 0.78,
    region: 'FR',
    isActive: true,
    isVerified: true,
    description: 'Foot Mercato - French transfer news',
    followerCount: 420000,
  },
  {
    name: 'César Luis Merlo',
    username: 'CLMerlo',
    tier: 2,
    reliability: 0.82,
    region: 'BR',
    isActive: true,
    isVerified: true,
    description: 'TyC Sports - South American transfers',
    followerCount: 980000,
  },
  {
    name: 'Mike Verweij',
    username: 'MikeVerweij',
    tier: 2,
    reliability: 0.80,
    region: 'GLOBAL',
    isActive: true,
    isVerified: true,
    description: 'De Telegraaf - Ajax and Dutch football',
    followerCount: 280000,
  },
  {
    name: 'Marcelo Bechler',
    username: 'marcelobechler',
    tier: 2,
    reliability: 0.78,
    region: 'BR',
    isActive: true,
    isVerified: true,
    description: 'TNT Sports Brasil - Barcelona specialist',
    followerCount: 520000,
  },
  
  // Additional UK-based Tier 2 sources
  {
    name: 'Sam Lee',
    username: 'SamLee',
    tier: 2,
    reliability: 0.85,
    region: 'UK',
    isActive: true,
    isVerified: true,
    description: 'The Athletic - Manchester City specialist',
    followerCount: 380000,
  },
  {
    name: 'Paul Joyce',
    username: '_pauljoyce',
    tier: 2,
    reliability: 0.84,
    region: 'UK',
    isActive: true,
    isVerified: false,
    description: 'The Times - Merseyside clubs specialist',
    followerCount: 290000,
  },
  {
    name: 'Laurie Whitwell',
    username: 'lauriewhitwell',
    tier: 2,
    reliability: 0.83,
    region: 'UK',
    isActive: true,
    isVerified: false,
    description: 'The Athletic - Manchester United specialist',
    followerCount: 180000,
  },
  {
    name: 'Rob Dawson',
    username: 'RobDawsonESPN',
    tier: 2,
    reliability: 0.80,
    region: 'UK',
    isActive: true,
    isVerified: false,
    description: 'ESPN - Manchester United correspondent',
    followerCount: 150000,
  },
  {
    name: 'Luke Edwards',
    username: 'LukeEdwardsTele',
    tier: 2,
    reliability: 0.78,
    region: 'UK',
    isActive: true,
    isVerified: false,
    description: 'Telegraph - Newcastle United specialist',
    followerCount: 85000,
  },
  {
    name: 'John Percy',
    username: 'JPercyTelegraph',
    tier: 2,
    reliability: 0.82,
    region: 'UK',
    isActive: true,
    isVerified: false,
    description: 'Telegraph - Midlands football correspondent',
    followerCount: 120000,
  },
  {
    name: 'Craig Hope',
    username: 'CraigHope_DM',
    tier: 2,
    reliability: 0.76,
    region: 'UK',
    isActive: true,
    isVerified: false,
    description: 'Daily Mail - Newcastle United correspondent',
    followerCount: 95000,
  },
  {
    name: 'Dean Jones',
    username: 'DeanJonesSoccer',
    tier: 2,
    reliability: 0.75,
    region: 'UK',
    isActive: true,
    isVerified: true,
    description: 'TeamTalk - Transfer insider',
    followerCount: 65000,
  },
];

// Popular clubs by league
const POPULAR_CLUBS = {
  [League.PL]: [
    'Manchester United', 'Liverpool', 'Arsenal', 'Chelsea', 'Manchester City',
    'Tottenham', 'Newcastle', 'West Ham', 'Aston Villa', 'Brighton'
  ],
  [League.LALIGA]: [
    'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Real Sociedad',
    'Villarreal', 'Athletic Bilbao', 'Real Betis', 'Valencia', 'Girona'
  ],
  [League.SERIEA]: [
    'Juventus', 'Inter Milan', 'AC Milan', 'Napoli', 'Roma',
    'Lazio', 'Atalanta', 'Fiorentina', 'Bologna', 'Torino'
  ],
  [League.BUNDESLIGA]: [
    'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen',
    'Eintracht Frankfurt', 'Union Berlin', 'Wolfsburg', 'Borussia Mönchengladbach'
  ],
  [League.LIGUE1]: [
    'PSG', 'Monaco', 'Marseille', 'Lille', 'Lyon',
    'Nice', 'Lens', 'Rennes', 'Toulouse', 'Strasbourg'
  ],
};

// Popular players (current transfer targets)
const POPULAR_PLAYERS = [
  { name: 'Kylian Mbappé', position: 'Forward', league: League.LALIGA },
  { name: 'Erling Haaland', position: 'Forward', league: League.PL },
  { name: 'Jude Bellingham', position: 'Midfielder', league: League.LALIGA },
  { name: 'Victor Osimhen', position: 'Forward', league: League.SERIEA },
  { name: 'Declan Rice', position: 'Midfielder', league: League.PL },
  { name: 'Bukayo Saka', position: 'Winger', league: League.PL },
  { name: 'Pedri', position: 'Midfielder', league: League.LALIGA },
  { name: 'Jamal Musiala', position: 'Midfielder', league: League.BUNDESLIGA },
  { name: 'Rafael Leão', position: 'Winger', league: League.SERIEA },
  { name: 'William Saliba', position: 'Defender', league: League.PL },
  { name: 'Gavi', position: 'Midfielder', league: League.LALIGA },
  { name: 'Eduardo Camavinga', position: 'Midfielder', league: League.LALIGA },
  { name: 'Aurélien Tchouaméni', position: 'Midfielder', league: League.LALIGA },
  { name: 'Phil Foden', position: 'Midfielder', league: League.PL },
  { name: 'Florian Wirtz', position: 'Midfielder', league: League.BUNDESLIGA },
];

// General tags
const GENERAL_TAGS = [
  'breaking', 'exclusive', 'confirmed', 'medical', 'here we go',
  'done deal', 'agreement', 'personal terms', 'fee agreed', 'loan',
  'permanent', 'option to buy', 'obligation', 'contract extension',
  'release clause', 'negotiations', 'advanced talks', 'interest',
  'bid rejected', 'bid accepted'
];

async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.feedItemTag.deleteMany();
    await prisma.feedItemMedia.deleteMany();
    await prisma.feedItem.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.iTKSource.deleteMany();

    // Seed ITK Sources
    console.log('📰 Seeding ITK sources...');
    for (const source of ITK_SOURCES) {
      await prisma.iTKSource.create({
        data: source
      });
    }
    console.log(`✅ Created ${ITK_SOURCES.length} ITK sources`);

    // Seed Club Tags
    console.log('⚽ Seeding club tags...');
    let clubCount = 0;
    for (const [league, clubs] of Object.entries(POPULAR_CLUBS)) {
      for (const clubName of clubs) {
        await prisma.tag.create({
          data: {
            name: clubName,
            type: TagType.CLUB,
            normalizedName: clubName.toLowerCase().replace(/\s+/g, ''),
            league: league as League,
            isPopular: true,
            usageCount: Math.floor(Math.random() * 100) + 50, // Random popularity
          }
        });
        clubCount++;
      }
    }
    console.log(`✅ Created ${clubCount} club tags`);

    // Seed Player Tags
    console.log('👤 Seeding player tags...');
    for (const player of POPULAR_PLAYERS) {
      await prisma.tag.create({
        data: {
          name: player.name,
          type: TagType.PLAYER,
          normalizedName: player.name.toLowerCase().replace(/\s+/g, ''),
          league: player.league,
          position: player.position,
          isPopular: true,
          usageCount: Math.floor(Math.random() * 80) + 30,
        }
      });
    }
    console.log(`✅ Created ${POPULAR_PLAYERS.length} player tags`);

    // Seed Source Tags (from ITK sources)
    console.log('📡 Seeding source tags...');
    for (const source of ITK_SOURCES) {
      await prisma.tag.create({
        data: {
          name: source.name,
          type: TagType.SOURCE,
          normalizedName: source.name.toLowerCase().replace(/\s+/g, ''),
          isPopular: source.tier === 1,
          usageCount: source.tier === 1 ? 100 : 50,
        }
      });
    }
    console.log(`✅ Created ${ITK_SOURCES.length} source tags`);

    // Seed General Tags
    console.log('🏷️  Seeding general tags...');
    for (const tagName of GENERAL_TAGS) {
      await prisma.tag.create({
        data: {
          name: tagName,
          type: TagType.GENERAL,
          normalizedName: tagName.toLowerCase().replace(/\s+/g, ''),
          isPopular: ['breaking', 'exclusive', 'confirmed', 'here we go'].includes(tagName),
          usageCount: Math.floor(Math.random() * 50) + 10,
        }
      });
    }
    console.log(`✅ Created ${GENERAL_TAGS.length} general tags`);

    // Get counts
    const sourcesCount = await prisma.iTKSource.count();
    const tagsCount = await prisma.tag.count();

    console.log('\n✨ Database seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   - ITK Sources: ${sourcesCount}`);
    console.log(`   - Tags: ${tagsCount}`);
    console.log(`     • Clubs: ${clubCount}`);
    console.log(`     • Players: ${POPULAR_PLAYERS.length}`);
    console.log(`     • Sources: ${ITK_SOURCES.length}`);
    console.log(`     • General: ${GENERAL_TAGS.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedDatabase()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });