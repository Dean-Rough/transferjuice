"use client";

import { SimpleBriefingCard } from "./SimpleBriefingCard";

interface Briefing {
  id: string;
  title: string;
  publishedAt: Date;
  stories: Array<{
    story: {
      id: string;
      terryComment: string;
      tweet: {
        id: string;
        content: string;
        url: string;
        source: {
          name: string;
          handle: string;
        };
      };
    };
  }>;
}

interface BriefingListProps {
  briefings: Briefing[];
}

export function BriefingList({ briefings }: BriefingListProps) {
  if (!briefings || briefings.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 mb-4">
          <span className="text-2xl">⚽</span>
        </div>
        <p className="text-muted-foreground text-lg">
          No briefings available yet.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Check back at the next update time!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {briefings.map((briefing) => (
        <SimpleBriefingCard
          key={briefing.id}
          title={briefing.title}
          stories={briefing.stories}
          publishedAt={briefing.publishedAt}
        />
      ))}
    </div>
  );
}
