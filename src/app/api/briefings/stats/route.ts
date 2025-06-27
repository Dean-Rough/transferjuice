import { NextRequest, NextResponse } from "next/server";

interface BriefingStats {
  totalBriefings: number;
  averageTerryScore: number;
  topClubs: string[];
  topPlayers: string[];
  totalWords: number;
  totalReadTime: number;
  mostActiveDay: {
    date: string;
    count: number;
  };
  tagDistribution: {
    clubs: Record<string, number>;
    players: Record<string, number>;
    leagues: Record<string, number>;
    sources: Record<string, number>;
  };
  engagement: {
    totalViews: number;
    totalShares: number;
    averageSharesPerBriefing: number;
  };
}

// Generate mock statistics
const generateMockStats = (): BriefingStats => {
  // Mock tag frequency data
  const clubFrequency: Record<string, number> = {
    Arsenal: 127,
    Chelsea: 114,
    "Manchester United": 98,
    Liverpool: 92,
    "Real Madrid": 87,
    Barcelona: 83,
    "Bayern Munich": 76,
    PSG: 71,
    "Manchester City": 69,
    Juventus: 65,
  };

  const playerFrequency: Record<string, number> = {
    "Erling Haaland": 45,
    "Kylian Mbappé": 42,
    "Jude Bellingham": 38,
    "Harry Kane": 35,
    "Mohamed Salah": 32,
    "Bukayo Saka": 30,
    "Vinícius Júnior": 28,
    Pedri: 26,
    "Phil Foden": 24,
    Gavi: 22,
  };

  const leagueFrequency: Record<string, number> = {
    "Premier League": 289,
    "La Liga": 187,
    "Serie A": 143,
    Bundesliga: 124,
    "Ligue 1": 98,
    "Champions League": 76,
  };

  const sourceFrequency: Record<string, number> = {
    FabrizioRomano: 234,
    David_Ornstein: 187,
    DiMarzio: 156,
    SamLee: 134,
    JPercyTelegraph: 98,
    ElChiringuito: 67, // For comedy value
  };

  // Get top items from each category
  const getTopItems = (
    frequency: Record<string, number>,
    limit = 10,
  ): string[] => {
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([key]) => key);
  };

  return {
    totalBriefings: 247,
    averageTerryScore: 87.3,
    topClubs: getTopItems(clubFrequency),
    topPlayers: getTopItems(playerFrequency),
    totalWords: 308275,
    totalReadTime: 1235, // minutes
    mostActiveDay: {
      date: "2025-01-31", // Transfer deadline day
      count: 24, // One every hour!
    },
    tagDistribution: {
      clubs: clubFrequency,
      players: playerFrequency,
      leagues: leagueFrequency,
      sources: sourceFrequency,
    },
    engagement: {
      totalViews: 45789,
      totalShares: 3421,
      averageSharesPerBriefing: 13.8,
    },
  };
};

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual database aggregation
    // const stats = await prisma.$transaction(async (tx) => {
    //   const [
    //     totalBriefings,
    //     avgTerryScore,
    //     totalMetrics,
    //     tagCounts,
    //   ] = await Promise.all([
    //     tx.briefing.count({ where: { status: 'published' } }),
    //     tx.briefing.aggregate({
    //       where: { status: 'published' },
    //       _avg: { 'metadata.terryScore': true },
    //     }),
    //     tx.briefing.aggregate({
    //       where: { status: 'published' },
    //       _sum: {
    //         'metadata.wordCount': true,
    //         'metadata.estimatedReadTime': true,
    //         'metadata.viewCount': true,
    //       },
    //     }),
    //     // Complex aggregation for tag frequencies
    //     tx.$queryRaw`
    //       SELECT
    //         jsonb_object_agg(tag_type, tag_counts) as tag_distribution
    //       FROM (
    //         SELECT
    //           'clubs' as tag_type,
    //           jsonb_object_agg(tag, count) as tag_counts
    //         FROM (
    //           SELECT
    //             jsonb_array_elements_text(tags->'clubs') as tag,
    //             COUNT(*) as count
    //           FROM briefings
    //           WHERE status = 'published'
    //           GROUP BY tag
    //           ORDER BY count DESC
    //         ) club_tags
    //         UNION ALL
    //         -- Similar for players, leagues, sources
    //       ) all_tags
    //     `,
    //   ]);
    //
    //   // Calculate most active day
    //   const mostActiveDay = await tx.$queryRaw`
    //     SELECT
    //       DATE(published_at) as date,
    //       COUNT(*) as count
    //     FROM briefings
    //     WHERE status = 'published'
    //     GROUP BY DATE(published_at)
    //     ORDER BY count DESC
    //     LIMIT 1
    //   `;
    //
    //   return {
    //     totalBriefings,
    //     averageTerryScore: avgTerryScore._avg['metadata.terryScore'] || 0,
    //     // ... process other stats
    //   };
    // });

    const stats = generateMockStats();

    return NextResponse.json(stats, {
      status: 200,
      headers: {
        // Cache for 10 minutes as specified
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch (error) {
    console.error("Error generating briefing stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
