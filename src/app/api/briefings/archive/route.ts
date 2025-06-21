import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Briefing, BriefingArchive } from '@/lib/types/briefing';

// Query parameters schema
const archiveQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  tags: z.string().optional(),
  leagues: z.string().optional(),
  dateRange: z.enum(['week', 'month', 'quarter', 'year', 'all']).optional(),
  search: z.string().optional(),
});

// Generate mock briefings for archive
const generateMockBriefings = (
  page: number,
  limit: number,
  filters?: {
    tags?: string;
    leagues?: string;
    dateRange?: string;
    search?: string;
  }
): BriefingArchive => {
  const total = 247; // Mock total count
  const offset = (page - 1) * limit;
  
  // Generate briefings for the requested page
  const briefings: Briefing[] = [];
  const now = new Date();
  
  for (let i = 0; i < limit && offset + i < total; i++) {
    const hoursAgo = offset + i;
    const briefingDate = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    
    const timestamp = [
      briefingDate.getFullYear(),
      String(briefingDate.getMonth() + 1).padStart(2, '0'),
      String(briefingDate.getDate()).padStart(2, '0'),
      String(briefingDate.getHours()).padStart(2, '0'),
    ].join('-');
    
    // Mock different titles for variety
    const titles = [
      "Arsenal's £100m Gamble on a Man Who Can't Tie His Boots",
      "Chelsea's Latest Striker Reportedly Allergic to Goals",
      "Manchester United's Transfer Strategy: A Masterclass in Chaos",
      "Liverpool's Scouting Team Discovers Football Exists Outside England",
      "Real Madrid's Galactico Policy Now Includes Literal Galactic Beings",
    ];
    
    const funnyTitle = titles[i % titles.length];
    
    briefings.push({
      id: `briefing-${timestamp}`,
      slug: timestamp,
      timestamp: briefingDate,
      title: {
        day: briefingDate.toLocaleDateString('en-US', { weekday: 'long' }),
        hour: `${briefingDate.getHours()}:00`,
        month: briefingDate.toLocaleDateString('en-US', { month: 'short' }),
        year: String(briefingDate.getFullYear()),
        funny: funnyTitle,
        full: `${briefingDate.toLocaleDateString('en-US', { weekday: 'long' })} ${briefingDate.getHours()}:00 Briefing ${briefingDate.toLocaleDateString('en-US', { month: 'short' })} ${briefingDate.getFullYear()} - ${funnyTitle}`,
      },
      summary: "The Terry brings you the latest transfer chaos, questionable scouting decisions, and football's most ridiculous rumors.",
      metaDescription: "Transfer news, rumors, and Terry's ascerbic commentary on football's silly season.",
      sections: [], // Not needed for archive view
      polaroids: [],
      tags: {
        clubs: ['Arsenal', 'Chelsea', 'Manchester United', 'Liverpool'],
        players: ['Mystery Player', 'Unknown Striker'],
        leagues: ['Premier League', 'La Liga'],
        sources: ['FabrizioRomano', 'David_Ornstein'],
      },
      metadata: {
        estimatedReadTime: 5 + (i % 3),
        wordCount: 1200 + (i * 47),
        terryScore: 85 + (i % 15),
        shareCount: {
          twitter: Math.floor(Math.random() * 100),
          facebook: Math.floor(Math.random() * 50),
          whatsapp: Math.floor(Math.random() * 30),
          email: Math.floor(Math.random() * 20),
        },
        viewCount: Math.floor(Math.random() * 1000),
      },
      sharing: {
        url: `https://transferjuice.com/briefings/${timestamp}`,
        shortUrl: `https://tjuice.co/b/${timestamp}`,
        title: funnyTitle,
        description: "The Terry's latest transfer briefing",
        shareCount: {
          twitter: 0,
          facebook: 0,
          whatsapp: 0,
          email: 0,
        },
      },
      openGraph: {
        title: `${funnyTitle} - Transfer Juice`,
        description: "The Terry's latest transfer briefing",
        image: 'https://transferjuice.com/og/briefing-default.jpg',
        url: `https://transferjuice.com/briefings/${timestamp}`,
      },
      status: 'published',
      publishedAt: briefingDate,
      createdAt: briefingDate,
      updatedAt: briefingDate,
    });
  }
  
  return {
    briefings,
    pagination: {
      page,
      limit,
      total,
      hasMore: offset + limit < total,
    },
    filters: {
      tags: filters?.tags,
      leagues: filters?.leagues,
      dateRange: filters?.dateRange,
      search: filters?.search,
    },
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const query = archiveQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      tags: searchParams.get('tags'),
      leagues: searchParams.get('leagues'),
      dateRange: searchParams.get('dateRange'),
      search: searchParams.get('search'),
    });
    
    // TODO: Replace with actual database query
    // const where = {
    //   status: 'published',
    //   ...(query.tags && {
    //     tags: {
    //       hasSome: query.tags.split(','),
    //     },
    //   }),
    //   ...(query.leagues && {
    //     leagues: {
    //       hasSome: query.leagues.split(','),
    //     },
    //   }),
    //   ...(query.search && {
    //     OR: [
    //       { title: { contains: query.search, mode: 'insensitive' } },
    //       { summary: { contains: query.search, mode: 'insensitive' } },
    //     ],
    //   }),
    //   ...(query.dateRange && {
    //     publishedAt: {
    //       gte: getDateRangeStart(query.dateRange),
    //     },
    //   }),
    // };
    
    // const [briefings, total] = await Promise.all([
    //   prisma.briefing.findMany({
    //     where,
    //     orderBy: { publishedAt: 'desc' },
    //     skip: (query.page - 1) * query.limit,
    //     take: query.limit,
    //   }),
    //   prisma.briefing.count({ where }),
    // ]);
    
    const archive = generateMockBriefings(
      query.page,
      query.limit,
      {
        tags: query.tags,
        leagues: query.leagues,
        dateRange: query.dateRange,
        search: query.search,
      }
    );
    
    return NextResponse.json(
      { archive },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    console.error('Error fetching briefing archive:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate date range start
function getDateRangeStart(range: string): Date {
  const now = new Date();
  switch (range) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'quarter':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(0); // All time
  }
}