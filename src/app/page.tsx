import { Suspense } from "react";
import { ContinuousFeed } from "@/components/feed/ContinuousFeed";
import { FixedSidebar } from "@/components/layout/FixedSidebar";
import { getBriefingsForFeed } from "@/lib/database/briefings";
import { League } from "@prisma/client";

interface HomePageProps {
  searchParams: {
    cursor?: string;
    tags?: string;
    leagues?: string;
  };
}

export default async function Home({ searchParams }: HomePageProps) {
  // Fetch initial briefings for the feed
  const leagueStrings = searchParams.leagues?.split(",").filter(Boolean);
  const leagues = leagueStrings?.filter((l) =>
    Object.values(League).includes(l as League),
  ) as League[] | undefined;

  const initialBriefings = await getBriefingsForFeed({
    limit: 10,
    tags: searchParams.tags?.split(","),
    leagues,
  });

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Responsive Layout: Mobile stacked, Desktop 70/30 split */}
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Main Content Column - Full width mobile, 70% desktop */}
        <main className="w-full lg:w-[70%] h-full overflow-y-auto scroll-smooth">
          <Suspense
            fallback={
              <div className="p-8 text-zinc-400 text-center">
                <div className="loading-spinner mx-auto mb-4"></div>
                <span className="font-mono text-sm">Loading briefings...</span>
              </div>
            }
          >
            <ContinuousFeed
              initialBriefings={initialBriefings}
              tags={searchParams.tags?.split(",")}
              leagues={searchParams.leagues?.split(",")}
            />
          </Suspense>
        </main>

        {/* Fixed Sidebar - Hidden mobile, 30% desktop */}
        <aside className="hidden lg:block lg:w-[30%] h-full border-l border-zinc-800 bg-zinc-900">
          <FixedSidebar />
        </aside>
      </div>
    </div>
  );
}
