import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Briefing } from '@/lib/types/briefing';

// Mock data for development - replace with database query
const getMockBriefing = (timestamp: string): Briefing | null => {
  // Parse timestamp format: YYYY-MM-DD-HH
  const [year, month, day, hour] = timestamp.split('-');
  
  if (!year || !month || !day || !hour) {
    return null;
  }

  const date = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour)
  );

  // Mock briefing data
  return {
    id: `briefing-${timestamp}`,
    slug: timestamp,
    timestamp: date,
    title: {
      day: date.toLocaleDateString('en-US', { weekday: 'long' }),
      hour: `${hour}:00`,
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      year: year,
      funny: "Arsenal's £100m Gamble on a Man Who Can't Tie His Boots",
      full: `${date.toLocaleDateString('en-US', { weekday: 'long' })} ${hour}:00 Briefing ${date.toLocaleDateString('en-US', { month: 'short' })} ${year} - Arsenal's £100m Gamble on a Man Who Can't Tie His Boots`,
    },
    summary: "The Terry dissects Arsenal's latest transfer masterclass, Fabrizio's caffeine addiction reaches new heights, and we discover why Chelsea's scouting department might be using a Magic 8-Ball.",
    metaDescription: "Arsenal transfer chaos, Fabrizio Romano updates, and Chelsea's questionable scouting decisions - The Terry brings you the latest transfer madness.",
    sections: [
      {
        id: 'lead-1',
        type: 'lead',
        title: 'Lead Story',
        content: `<p>Right, so Arsenal have apparently decided that what they really need to complete their title charge is a striker who, according to multiple sources, <a href="https://twitter.com/FabrizioRomano/status/example">struggles with basic motor functions</a>. The £100 million man in question - let's call him "Mystery Boot Struggler" - has reportedly been spotted at London Colney attempting to tie his laces for a solid 45 minutes.</p>
        
        <p>Fabrizio Romano, who at this point must be surviving on a diet consisting entirely of espresso and Twitter notifications, has been posting "Here we go soon maybe possibly" every 37 seconds. The man's dedication to transfer chaos is honestly both inspiring and deeply concerning.</p>`,
        order: 1,
        playerMentions: ['Mystery Boot Struggler'],
      },
      {
        id: 'partner-1',
        type: 'partner',
        title: 'Meanwhile in Football Culture',
        content: `<p>Speaking of transfer chaos, I was reminded of that brilliant piece by <a href="https://theupshot.com/arsenal-history">The Upshot about Arsenal's history of panic buys</a>. They traced the lineage from Squillaci to Willian, and honestly, it reads like a horror anthology.</p>`,
        order: 2,
        partnerSources: ['The Upshot'],
      },
      {
        id: 'bullshit-1',
        type: 'bullshit_corner',
        title: 'Bullshit Corner',
        content: `<p>💩 <strong>Today's Nonsense Champion: El Chiringuito</strong></p>
        
        <p>They're claiming Messi is coming out of retirement to play for Stoke City because "he wants a real challenge." I mean, fair play for the ambition, but even Terry's comedy has limits.</p>`,
        order: 3,
      },
    ],
    polaroids: [],
    tags: {
      clubs: ['Arsenal', 'Chelsea'],
      players: ['Mystery Boot Struggler'],
      leagues: ['Premier League'],
      sources: ['FabrizioRomano', 'ElChiringuito'],
    },
    metadata: {
      estimatedReadTime: 5,
      wordCount: 1247,
      terryScore: 92,
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
      title: "Arsenal's £100m Gamble on a Man Who Can't Tie His Boots",
      description: "The Terry dissects Arsenal's latest transfer masterclass",
      shareCount: {
        twitter: 0,
        facebook: 0,
        whatsapp: 0,
        email: 0,
      },
    },
    openGraph: {
      title: "Arsenal's £100m Gamble on a Man Who Can't Tie His Boots - Transfer Juice",
      description: "The Terry dissects Arsenal's latest transfer masterclass, Fabrizio's caffeine addiction, and Chelsea's Magic 8-Ball scouting.",
      image: 'https://transferjuice.com/og/briefing-default.jpg',
      url: `https://transferjuice.com/briefings/${timestamp}`,
    },
    status: 'published',
    publishedAt: date,
    createdAt: date,
    updatedAt: date,
  };
};

// Timestamp validation schema
const timestampSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}-\d{2}$/,
  'Timestamp must be in format YYYY-MM-DD-HH'
);

export async function GET(
  request: NextRequest,
  { params }: { params: { timestamp: string } }
) {
  try {
    // Validate timestamp format
    const validatedTimestamp = timestampSchema.parse(params.timestamp);
    
    // TODO: Replace with actual database query
    // const briefing = await prisma.briefing.findUnique({
    //   where: { slug: validatedTimestamp },
    //   include: {
    //     sections: { orderBy: { order: 'asc' } },
    //     playerMentions: true,
    //   },
    // });

    const briefing = getMockBriefing(validatedTimestamp);

    if (!briefing) {
      return NextResponse.json(
        { error: 'Briefing not found' },
        { status: 404 }
      );
    }

    // Return briefing with cache headers for ISR
    return NextResponse.json(
      { briefing },
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
        { error: 'Invalid timestamp format. Use YYYY-MM-DD-HH' },
        { status: 400 }
      );
    }

    console.error('Error fetching briefing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}