import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Briefing } from '@/lib/types/briefing';

// Timestamp validation schema
const timestampSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}-\d{2}$/,
  'Timestamp must be in format YYYY-MM-DD-HH'
);

// Generate mock related briefings
const generateRelatedBriefings = (currentTimestamp: string): Briefing[] => {
  const [year, month, day, hour] = currentTimestamp.split('-').map(Number);
  const currentDate = new Date(year, month - 1, day, hour);
  
  const relatedBriefings: Briefing[] = [];
  
  // Generate 2 previous and 2 next briefings for navigation
  const offsets = [-2, -1, 1, 2];
  
  offsets.forEach((offset, index) => {
    const relatedDate = new Date(currentDate.getTime() + offset * 60 * 60 * 1000);
    
    const timestamp = [
      relatedDate.getFullYear(),
      String(relatedDate.getMonth() + 1).padStart(2, '0'),
      String(relatedDate.getDate()).padStart(2, '0'),
      String(relatedDate.getHours()).padStart(2, '0'),
    ].join('-');
    
    // Vary titles based on position
    const titles = [
      "Barcelona's Director of Football Caught Using FIFA Career Mode for Transfers",
      "Bayern Munich's New Strategy: Only Sign Players Named Thomas",
      "PSG Considering Bid for the Moon to Improve Atmosphere at Parc des Princes",
      "Inter Milan's Scouting Network Revealed to be One Guy with Twitter",
    ];
    
    const funnyTitle = titles[index % titles.length];
    
    relatedBriefings.push({
      id: `briefing-${timestamp}`,
      slug: timestamp,
      timestamp: relatedDate,
      title: {
        day: relatedDate.toLocaleDateString('en-US', { weekday: 'long' }),
        hour: `${relatedDate.getHours()}:00`,
        month: relatedDate.toLocaleDateString('en-US', { month: 'short' }),
        year: String(relatedDate.getFullYear()),
        funny: funnyTitle,
        full: `${relatedDate.toLocaleDateString('en-US', { weekday: 'long' })} ${relatedDate.getHours()}:00 Briefing ${relatedDate.toLocaleDateString('en-US', { month: 'short' })} ${relatedDate.getFullYear()} - ${funnyTitle}`,
      },
      summary: "More transfer chaos and football absurdity from The Terry.",
      metaDescription: "The Terry's take on football's latest transfer nonsense.",
      sections: [], // Not needed for related briefings
      polaroids: [],
      tags: {
        clubs: ['Barcelona', 'Bayern Munich', 'PSG', 'Inter Milan'],
        players: ['Various Players'],
        leagues: ['La Liga', 'Bundesliga', 'Ligue 1', 'Serie A'],
        sources: ['Various Sources'],
      },
      metadata: {
        estimatedReadTime: 5,
        wordCount: 1200,
        terryScore: 88,
        shareCount: {
          twitter: 0,
          facebook: 0,
          whatsapp: 0,
          email: 0,
        },
        viewCount: 0,
      },
      sharing: {
        url: `https://transferjuice.com/briefings/${timestamp}`,
        shortUrl: `https://tjuice.co/b/${timestamp}`,
        title: funnyTitle,
        description: "The Terry's latest briefing",
        shareCount: {
          twitter: 0,
          facebook: 0,
          whatsapp: 0,
          email: 0,
        },
      },
      openGraph: {
        title: `${funnyTitle} - Transfer Juice`,
        description: "The Terry's latest briefing",
        image: 'https://transferjuice.com/og/briefing-default.jpg',
        url: `https://transferjuice.com/briefings/${timestamp}`,
      },
      status: 'published',
      publishedAt: relatedDate,
      createdAt: relatedDate,
      updatedAt: relatedDate,
    });
  });
  
  return relatedBriefings;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { timestamp: string } }
) {
  try {
    // Validate timestamp format
    const validatedTimestamp = timestampSchema.parse(params.timestamp);
    
    // TODO: Replace with actual database query
    // First, get the current briefing to find its tags
    // const currentBriefing = await prisma.briefing.findUnique({
    //   where: { slug: validatedTimestamp },
    //   select: {
    //     id: true,
    //     tags: true,
    //     publishedAt: true,
    //   },
    // });
    
    // if (!currentBriefing) {
    //   return NextResponse.json(
    //     { error: 'Briefing not found' },
    //     { status: 404 }
    //   );
    // }
    
    // Find related briefings based on:
    // 1. Same-day briefings (temporal proximity)
    // 2. Similar tags (content similarity)
    // 3. Exclude the current briefing
    
    // const relatedBriefings = await prisma.briefing.findMany({
    //   where: {
    //     id: { not: currentBriefing.id },
    //     status: 'published',
    //     OR: [
    //       // Same day briefings
    //       {
    //         publishedAt: {
    //           gte: startOfDay(currentBriefing.publishedAt),
    //           lte: endOfDay(currentBriefing.publishedAt),
    //         },
    //       },
    //       // Similar tags
    //       {
    //         tags: {
    //           clubs: {
    //             hasSome: currentBriefing.tags.clubs,
    //           },
    //         },
    //       },
    //       {
    //         tags: {
    //           players: {
    //             hasSome: currentBriefing.tags.players,
    //           },
    //         },
    //       },
    //     ],
    //   },
    //   orderBy: [
    //     // Prioritize temporal proximity
    //     {
    //       publishedAt: 'desc',
    //     },
    //   ],
    //   take: 5,
    //   select: {
    //     id: true,
    //     slug: true,
    //     timestamp: true,
    //     title: true,
    //     summary: true,
    //     tags: true,
    //     metadata: {
    //       select: {
    //         estimatedReadTime: true,
    //         terryScore: true,
    //       },
    //     },
    //   },
    // });
    
    const briefings = generateRelatedBriefings(validatedTimestamp);
    
    return NextResponse.json(
      { briefings },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid timestamp format. Use YYYY-MM-DD-HH' },
        { status: 400 }
      );
    }
    
    console.error('Error fetching related briefings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}