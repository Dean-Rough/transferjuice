"use client";

import { useState, useEffect, useRef } from "react";
import { BriefingContent } from "@/components/briefings/BriefingContent";
import { Quote, PartyPopper } from "lucide-react";
import type { BriefingWithRelations } from "@/types/briefing";

interface ContinuousFeedProps {
  initialBriefings: BriefingWithRelations[];
  tags?: string[];
  leagues?: string[];
}

export function ContinuousFeed({
  initialBriefings,
  tags,
  leagues,
}: ContinuousFeedProps) {
  const [briefings, setBriefings] = useState(initialBriefings);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current || loading || !hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      // Load more when 80% scrolled
      if (scrollPercentage > 0.8) {
        loadMoreBriefings();
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll, { passive: true });
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
  }, [loading, hasMore, page]);

  const loadMoreBriefings = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", (page + 1).toString());
      if (tags?.length) params.set("tags", tags.join(","));
      if (leagues?.length) params.set("leagues", leagues.join(","));

      const response = await fetch(`/api/briefings?${params}`);
      const data = await response.json();

      if (data.briefings?.length) {
        setBriefings((prev) => [...prev, ...data.briefings]);
        setPage((prev) => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more briefings:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto scroll-smooth px-4 sm:px-8 md:px-16 lg:px-20 py-8 md:py-12"
    >
      {/* Continuous Feed */}
      <div className="space-y-12 md:space-y-16">
        {briefings.map((briefing, index) => (
          <article
            key={briefing.id}
            className="group"
            data-briefing-index={index}
          >
            {/* Briefing Header */}
            <header className="mb-6 md:mb-10 pb-6 md:pb-8 border-b border-zinc-800">
              <time
                className="text-xs text-orange-500 font-mono uppercase tracking-wider"
                suppressHydrationWarning
              >
                {new Date(briefing.timestamp).toLocaleDateString("en-GB", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }) +
                  " at " +
                  new Date(briefing.timestamp).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
              </time>

              <h2 className="mt-3 md:mt-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight">
                {(briefing.title as any).main}
              </h2>

              {(briefing.title as any).subtitle && (
                <p className="mt-2 md:mt-3 text-lg md:text-xl text-zinc-400 leading-relaxed">
                  {(briefing.title as any).subtitle}
                </p>
              )}
            </header>

            {/* Briefing Content */}
            <div className="prose prose-invert prose-lg max-w-none">
              <BriefingContent
                sections={(briefing.content as any).sections || []}
                feedItems={
                  briefing.feedItems?.map((item: any) => item.feedItem) || []
                }
              />
            </div>

            {/* Terry's Commentary Section */}
            {briefing.feedItems?.some((item: any) => item.terryCommentary) && (
              <aside className="mt-12 p-6 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-l-4 border-orange-500 rounded-r-lg shadow-subtle">
                <h3 className="text-xl font-black mb-4 text-orange-400 flex items-center gap-2">
                  <Quote className="w-6 h-6" /> Terry&apos;s Take
                </h3>
                <div className="space-y-4">
                  {briefing.feedItems
                    ?.filter((item: any) => item.terryCommentary)
                    .slice(0, 2)
                    .map((item: any, idx: number) => (
                      <blockquote
                        key={idx}
                        className="text-orange-300 italic text-lg leading-relaxed"
                      >
                        &quot;{item.terryCommentary}&quot;
                      </blockquote>
                    ))}
                </div>
              </aside>
            )}
          </article>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="py-12 text-center">
            <div className="inline-flex items-center gap-3 text-zinc-400">
              <div className="loading-spinner"></div>
              <span className="font-mono text-sm">
                Loading more briefings...
              </span>
            </div>
          </div>
        )}

        {/* End of feed */}
        {!hasMore && briefings.length > 0 && (
          <div className="py-12 text-center text-zinc-500">
            <p className="text-lg flex items-center justify-center gap-2">
              <PartyPopper className="w-6 h-6" /> You&apos;ve reached the end of
              today&apos;s transfer chaos
            </p>
            <p className="text-sm mt-2">Check back soon for more updates</p>
          </div>
        )}

        {/* Empty state */}
        {briefings.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-2xl text-zinc-400 mb-4">No briefings yet</p>
            <p className="text-zinc-500">
              The transfer window is quiet... for now
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
