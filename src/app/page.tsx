import Link from "next/link";
import { listBriefings } from "@/lib/database/briefings";
import { BriefingStatus, type League } from "@/types/briefing";
import { NewsletterSignup } from "@/components/features/NewsletterSignup";

interface HomePageProps {
  searchParams: {
    page?: string;
    tags?: string;
    leagues?: string;
  };
}

export default async function Home({
  searchParams,
}: HomePageProps) {
  const page = parseInt(searchParams.page || "1");
  const tags = searchParams.tags?.split(",").filter(Boolean);
  const leagues = searchParams.leagues?.split(",").filter(Boolean) as League[];

  const { briefings, pagination } = await listBriefings({
    page,
    limit: 24,
    status: BriefingStatus.Published,
    tags,
    leagues,
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Header */}
      <header className="border-b border-zinc-800 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            Transfer Briefings
          </h1>
          <p className="text-xl text-zinc-400 mb-8">
            Every hour of transfer chaos, with Terry&apos;s ascerbic commentary and polaroid memories
          </p>
          
          {/* Newsletter Signup */}
          <div className="max-w-md">
            <NewsletterSignup variant="hero" />
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b border-zinc-800 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-4">
            <FilterButton
              label="All Leagues"
              active={!leagues || leagues.length === 0}
              href="/"
            />
            <FilterButton
              label="Premier League"
              active={leagues?.includes("PL")}
              href={toggleLeagueFilter("PL", leagues)}
            />
            <FilterButton
              label="La Liga"
              active={leagues?.includes("LALIGA")}
              href={toggleLeagueFilter("LALIGA", leagues)}
            />
            <FilterButton
              label="Serie A"
              active={leagues?.includes("SERIEA")}
              href={toggleLeagueFilter("SERIEA", leagues)}
            />
          </div>
        </div>
      </div>

      {/* Briefing Grid with Polaroid Cards */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {briefings.map((briefing) => (
            <BriefingCard key={briefing.id} briefing={briefing} />
          ))}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-12 flex justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/?page=${page - 1}${leagues ? `&leagues=${leagues.join(",")}` : ""}`}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
              >
                Previous
              </Link>
            )}

            <span className="px-4 py-2 text-zinc-400">
              Page {page} of {pagination.pages}
            </span>

            {page < pagination.pages && (
              <Link
                href={`/?page=${page + 1}${leagues ? `&leagues=${leagues.join(",")}` : ""}`}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </main>

      {/* Terry's Corner - Fixed on Desktop */}
      <aside className="hidden lg:block fixed bottom-8 right-8 w-80">
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 shadow-lg rotate-1 hover:rotate-0 transition-transform">
          <h3 className="text-xl font-black mb-4">🎭 Terry&apos;s Corner</h3>
          <div className="space-y-4">
            <div className="terry-voice text-orange-500">
              &quot;These briefings are like watching billionaires play
              with very expensive action figures.&quot;
            </div>
            <div className="text-xs text-zinc-400 data-mono">
              BRIEFINGS ARCHIVE
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function BriefingCard({ briefing }: { briefing: any }) {
  const date = new Date(briefing.timestamp);
  const title = briefing.title as any;

  return (
    <Link
      href={`/briefings/${briefing.slug}`}
      className="group block bg-zinc-900 rounded-lg overflow-hidden hover:bg-zinc-800 transition-all hover:scale-[1.02] border border-zinc-800"
    >
      <div className="p-6">
        <time className="text-xs text-zinc-500 uppercase tracking-wider">
          {date.toLocaleDateString("en-GB", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>

        <h2 className="mt-2 text-xl font-bold group-hover:text-orange-500 transition-colors">
          {title.main}
        </h2>

        {title.subtitle && (
          <p className="mt-1 text-sm text-zinc-400 line-clamp-2">
            {title.subtitle}
          </p>
        )}

        <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
          <span>{briefing.readTime} min</span>
          <span>•</span>
          <span>{briefing._count.feedItems} stories</span>
          {briefing._count.media > 0 && (
            <>
              <span>•</span>
              <span className="text-orange-400">{briefing._count.media} polaroids</span>
            </>
          )}
        </div>

        {/* Tags */}
        {briefing.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {briefing.tags.slice(0, 3).map((bt: any) => (
              <span
                key={bt.tag.id}
                className="text-xs px-2 py-1 bg-zinc-800 rounded text-zinc-300"
              >
                {bt.tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function FilterButton({
  label,
  active,
  href,
}: {
  label: string;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded transition-colors ${
        active
          ? "bg-orange-500 text-black font-bold"
          : "bg-zinc-800 hover:bg-zinc-700"
      }`}
    >
      {label}
    </Link>
  );
}

function toggleLeagueFilter(league: League, current?: League[]): string {
  const leagues = current || [];
  const newLeagues = leagues.includes(league)
    ? leagues.filter((l) => l !== league)
    : [...leagues, league];

  return `/${newLeagues.length > 0 ? `?leagues=${newLeagues.join(",")}` : ""}`;
}
