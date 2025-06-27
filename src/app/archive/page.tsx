import { Metadata } from "next";
import Link from "next/link";
import { Briefing, BriefingArchive } from "@/lib/types/briefing";
import { NewsletterSignup } from "@/components/features/NewsletterSignup";

interface ArchivePageProps {
  searchParams: {
    page?: string;
    tags?: string;
    leagues?: string;
    dateRange?: string;
  };
}

async function getBriefingArchive(
  params: ArchivePageProps["searchParams"],
): Promise<BriefingArchive> {
  try {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set("page", params.page);
    if (params.tags) searchParams.set("tags", params.tags);
    if (params.leagues) searchParams.set("leagues", params.leagues);
    if (params.dateRange) searchParams.set("dateRange", params.dateRange);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/briefings/archive?${searchParams}`,
      {
        next: { revalidate: 300 }, // 5 minutes
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch archive");
    }

    const data = await response.json();
    return data.archive;
  } catch (error) {
    console.error("Error fetching briefing archive:", error);
    return {
      briefings: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
      },
      filters: {},
    };
  }
}

async function getArchiveStats(): Promise<{
  totalBriefings: number;
  averageTerryScore: number;
  topClubs: string[];
  topPlayers: string[];
}> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/briefings/stats`,
      {
        next: { revalidate: 600 }, // 10 minutes
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch stats");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching archive stats:", error);
    return {
      totalBriefings: 0,
      averageTerryScore: 0,
      topClubs: [],
      topPlayers: [],
    };
  }
}

export const metadata: Metadata = {
  title: "Briefing Archive - Transfer Juice",
  description:
    "Browse the complete archive of Terry's unhinged briefings. Months of magnificent chaos, organized for your browsing pleasure.",
  openGraph: {
    title: "Briefing Archive - Transfer Juice",
    description:
      "Browse the complete archive of Terry's unhinged briefings. Months of magnificent chaos, organized for your browsing pleasure.",
    type: "website",
    url: "https://transferjuice.com/archive",
  },
};

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const [archive, stats] = await Promise.all([
    getBriefingArchive(searchParams),
    getArchiveStats(),
  ]);

  const currentPage = parseInt(searchParams.page || "1", 10);

  return (
    <div className="archive-page min-h-screen bg-background">
      {/* Archive Header */}
      <header className="archive-header bg-gradient-to-b from-background to-card/50 border-b border-border py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground">
              The Terry Archive
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Months of magnificent chaos, organized for your browsing pleasure.
              Every unhinged briefing, every ascerbic observation, every moment
              of beautiful madness.
            </p>

            {/* Archive Stats */}
            <div className="stats-grid grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-8">
              <div className="stat-card bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-black text-orange-500">
                  {stats.totalBriefings}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Briefings
                </div>
              </div>
              <div className="stat-card bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-black text-orange-500">
                  {stats.averageTerryScore}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Avg Terry Score
                </div>
              </div>
              <div className="stat-card bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-black text-orange-500">
                  {stats.topClubs.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Clubs Covered
                </div>
              </div>
              <div className="stat-card bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl font-black text-orange-500">
                  {stats.topPlayers.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Players Mentioned
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="archive-content max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="archive-sidebar lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Search & Filters */}
              <div className="filter-card bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  Find Briefings
                </h3>

                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Date Range
                    </label>
                    <select
                      name="dateRange"
                      defaultValue={searchParams.dateRange || ""}
                      className="w-full p-2 bg-background border border-border rounded text-foreground"
                    >
                      <option value="">All Time</option>
                      <option value="week">Past Week</option>
                      <option value="month">Past Month</option>
                      <option value="quarter">Past 3 Months</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Leagues
                    </label>
                    <div className="space-y-2">
                      {["PL", "LaLiga", "SerieA", "Bundesliga", "Ligue1"].map(
                        (league) => (
                          <label key={league} className="flex items-center">
                            <input
                              type="checkbox"
                              name="leagues"
                              value={league}
                              className="mr-2"
                              defaultChecked={searchParams.leagues?.includes(
                                league,
                              )}
                            />
                            <span className="text-sm text-foreground">
                              {league}
                            </span>
                          </label>
                        ),
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded transition-colors"
                  >
                    Apply Filters
                  </button>
                </form>
              </div>

              {/* Top Content */}
              <div className="top-content-card bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  Most Mentioned
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Clubs
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {stats.topClubs.slice(0, 6).map((club) => (
                        <Link
                          key={club}
                          href={`/archive?tags=${encodeURIComponent(club)}`}
                          className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded hover:bg-orange-600 hover:text-white transition-colors"
                        >
                          {club}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Players
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {stats.topPlayers.slice(0, 6).map((player) => (
                        <Link
                          key={player}
                          href={`/archive?tags=${encodeURIComponent(player)}`}
                          className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded hover:bg-orange-600 hover:text-white transition-colors"
                        >
                          {player}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Newsletter Signup */}
              <div className="newsletter-card">
                <NewsletterSignup variant="compact" />
              </div>
            </div>
          </aside>

          {/* Briefings Grid */}
          <main className="briefings-grid lg:col-span-3">
            {archive.briefings.length === 0 ? (
              <div className="empty-state text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  No Briefings Found
                </h2>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters or check back later for new
                  briefings.
                </p>
                <Link
                  href="/briefings"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-6 rounded transition-colors"
                >
                  View Latest Briefing
                </Link>
              </div>
            ) : (
              <>
                {/* Results Header */}
                <div className="results-header mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {archive.pagination.total} Briefings Found
                  </h2>
                  <p className="text-muted-foreground">
                    Showing page {currentPage} of{" "}
                    {Math.ceil(
                      archive.pagination.total / archive.pagination.limit,
                    )}
                  </p>
                </div>

                {/* Briefings List */}
                <div className="briefings-list space-y-6">
                  {archive.briefings.map((briefing) => (
                    <article
                      key={briefing.id}
                      className="briefing-card bg-card border border-border rounded-lg p-6 hover:border-orange-600/30 transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="briefing-meta">
                          <div className="text-sm text-muted-foreground font-mono mb-1">
                            {briefing.title.day} {briefing.title.hour} •{" "}
                            {briefing.title.month} {briefing.title.year}
                          </div>
                          <h3 className="text-xl font-bold text-foreground group-hover:text-orange-500 transition-colors">
                            <Link href={`/briefings/${briefing.slug}`}>
                              {briefing.title.funny}
                            </Link>
                          </h3>
                        </div>
                        <div className="briefing-stats text-right">
                          <div className="text-sm text-muted-foreground">
                            {briefing.metadata.estimatedReadTime}m read
                          </div>
                          <div className="text-sm text-orange-500 font-medium">
                            {briefing.metadata.terryScore}% Terry
                          </div>
                        </div>
                      </div>

                      <p className="text-muted-foreground leading-relaxed mb-4">
                        {briefing.summary}
                      </p>

                      <div className="briefing-footer flex items-center justify-between">
                        <div className="tags flex flex-wrap gap-1">
                          {briefing.tags.clubs.slice(0, 3).map((club) => (
                            <span
                              key={club}
                              className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded"
                            >
                              {club}
                            </span>
                          ))}
                          {briefing.tags.clubs.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{briefing.tags.clubs.length - 3} more
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/briefings/${briefing.slug}`}
                          className="text-sm text-orange-500 hover:text-orange-400 font-medium"
                        >
                          Read Briefing →
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {archive.pagination.total > archive.pagination.limit && (
                  <nav className="pagination mt-12">
                    <div className="flex items-center justify-center space-x-4">
                      {currentPage > 1 && (
                        <Link
                          href={`/archive?page=${currentPage - 1}`}
                          className="pagination-link bg-card border border-border text-foreground px-4 py-2 rounded hover:border-orange-600/30 transition-colors"
                        >
                          ← Previous
                        </Link>
                      )}

                      <span className="text-muted-foreground">
                        Page {currentPage} of{" "}
                        {Math.ceil(
                          archive.pagination.total / archive.pagination.limit,
                        )}
                      </span>

                      {archive.pagination.hasMore && (
                        <Link
                          href={`/archive?page=${currentPage + 1}`}
                          className="pagination-link bg-card border border-border text-foreground px-4 py-2 rounded hover:border-orange-600/30 transition-colors"
                        >
                          Next →
                        </Link>
                      )}
                    </div>
                  </nav>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
