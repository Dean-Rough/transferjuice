"use client";

import { format } from "date-fns";
import { EnhancedBriefingCard } from "./EnhancedBriefingCard";
import { SimpleBriefingCard } from "./SimpleBriefingCard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BriefingDetailProps {
  briefing: any;
}

export function BriefingDetail({ briefing }: BriefingDetailProps) {
  const hasEnhancedContent = briefing.stories.some(
    (story: any) => story.story.metadata?.headline,
  );

  return (
    <article className="space-y-8">
      <Link
        href="/briefings"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to briefings
      </Link>

      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight">
          {briefing.title}
        </h1>
        <time className="text-muted-foreground font-mono text-sm">
          {format(new Date(briefing.publishedAt || briefing.createdAt), "PPpp")}
        </time>
      </header>

      <div className="briefing-content">
        {hasEnhancedContent ? (
          <EnhancedBriefingCard briefing={briefing} isDetailPage />
        ) : (
          <SimpleBriefingCard briefing={briefing} isDetailPage />
        )}
      </div>
    </article>
  );
}
