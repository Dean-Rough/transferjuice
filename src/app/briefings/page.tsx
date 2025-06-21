/**
 * Briefing Archive Page
 * Browse all published briefings with filtering
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { listBriefings } from '@/lib/database/briefings';
import { BriefingStatus, type League } from '@/types/briefing';

export const metadata: Metadata = {
  title: 'Transfer Briefings Archive | Transfer Juice',
  description: 'Browse all hourly transfer briefings with The Terry\'s ascerbic commentary',
};

interface BriefingArchiveProps {
  searchParams: {
    page?: string;
    tags?: string;
    leagues?: string;
  };
}

export default async function BriefingArchivePage({ searchParams }: BriefingArchiveProps) {
  const page = parseInt(searchParams.page || '1');
  const tags = searchParams.tags?.split(',').filter(Boolean);
  const leagues = searchParams.leagues?.split(',').filter(Boolean) as League[];

  const { briefings, pagination } = await listBriefings({
    page,
    limit: 24,
    status: BriefingStatus.Published,
    tags,
    leagues,
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Briefing Archive
          </h1>
          <p className="text-xl text-zinc-400">
            Every hour of transfer chaos, preserved for posterity
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b border-zinc-800 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-4">
            <FilterButton
              label="All Leagues"
              active={!leagues || leagues.length === 0}
              href="/briefings"
            />
            <FilterButton
              label="Premier League"
              active={leagues?.includes('PL')}
              href={toggleLeagueFilter('PL', leagues)}
            />
            <FilterButton
              label="La Liga"
              active={leagues?.includes('LALIGA')}
              href={toggleLeagueFilter('LALIGA', leagues)}
            />
            <FilterButton
              label="Serie A"
              active={leagues?.includes('SERIEA')}
              href={toggleLeagueFilter('SERIEA', leagues)}
            />
          </div>
        </div>
      </div>

      {/* Briefing Grid */}
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
                href={`/briefings?page=${page - 1}${leagues ? `&leagues=${leagues.join(',')}` : ''}`}
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
                href={`/briefings?page=${page + 1}${leagues ? `&leagues=${leagues.join(',')}` : ''}`}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function BriefingCard({ briefing }: { briefing: any }) {
  const date = new Date(briefing.timestamp);
  const title = briefing.title as any;
  
  return (
    <Link 
      href={`/briefings/${briefing.slug}`}
      className="group block bg-zinc-900 rounded-lg overflow-hidden hover:bg-zinc-800 transition-all hover:scale-[1.02]"
    >
      <div className="p-6">
        <time className="text-xs text-zinc-500 uppercase tracking-wider">
          {date.toLocaleDateString('en-GB', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </time>
        
        <h2 className="mt-2 text-xl font-bold group-hover:text-tj-orange transition-colors">
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
              <span>{briefing._count.media} polaroids</span>
            </>
          )}
        </div>
        
        {/* Tags */}
        {briefing.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {briefing.tags.slice(0, 3).map((bt: any) => (
              <span 
                key={bt.tag.id}
                className="text-xs px-2 py-1 bg-zinc-800 rounded"
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
  href 
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
          ? 'bg-tj-orange text-black font-bold' 
          : 'bg-zinc-800 hover:bg-zinc-700'
      }`}
    >
      {label}
    </Link>
  );
}

function toggleLeagueFilter(league: League, current?: League[]): string {
  const leagues = current || [];
  const newLeagues = leagues.includes(league)
    ? leagues.filter(l => l !== league)
    : [...leagues, league];
  
  return `/briefings${newLeagues.length > 0 ? `?leagues=${newLeagues.join(',')}` : ''}`;
}