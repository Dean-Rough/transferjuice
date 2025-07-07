"use client";

import Link from "next/link";

interface Story {
  id: string;
  terryComment: string;
  metadata?: any; // Enhanced briefing data
  tweet: {
    id: string;
    content: string;
    url: string;
    source: {
      name: string;
      handle: string;
    };
  };
}

interface SimpleBriefingCardProps {
  briefing?: any;
  title?: string;
  stories?: Array<{
    story: Story;
  }>;
  publishedAt?: Date;
  isDetailPage?: boolean;
}

export function SimpleBriefingCard({
  briefing,
  title: propTitle,
  stories: propStories,
  publishedAt: propPublishedAt,
  isDetailPage = false,
}: SimpleBriefingCardProps) {
  const title = propTitle || briefing?.title;
  const stories = propStories || briefing?.stories || [];
  const publishedAt = propPublishedAt || briefing?.publishedAt || briefing?.createdAt;
  const briefingId = briefing?.id;
  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6 hover:border-orange-500/20 transition-colors">
      <div className="mb-6 border-b border-border pb-4">
        {isDetailPage ? (
          <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        ) : briefingId ? (
          <Link href={`/briefing/${briefingId}`}>
            <h2 className="text-2xl font-bold text-foreground mb-2 hover:text-orange-500 transition-colors cursor-pointer">
              {title}
            </h2>
          </Link>
        ) : (
          <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        )}
        <p className="text-sm text-muted-foreground font-mono">
          {new Date(publishedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      <div className="space-y-8">
        {stories.map(({ story }: { story: Story }) => {
          const isEnhanced = story.metadata?.headline;
          const isCohesive = story.metadata?.type === 'cohesive';
          const isDailySummary = story.metadata?.type === 'daily_summary';
          
          if (isDailySummary) {
            // Daily summary format - HTML content with stats
            return (
              <div
                key={story.id}
                className="briefing-article max-w-none"
              >
                <div 
                  className="briefing-content enhanced-content daily-summary-content"
                  dangerouslySetInnerHTML={{ __html: story.metadata.content }}
                />
                
                {/* Terry's Take on the Day */}
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mt-6">
                  <p className="text-xs font-mono text-orange-500 mb-2">
                    TERRY&apos;S TAKE ON THE DAY:
                  </p>
                  <p className="text-foreground italic leading-relaxed">
                    {story.terryComment}
                  </p>
                </div>
              </div>
            );
          } else if (isCohesive) {
            // Cohesive briefing format - single flowing article
            return (
              <div
                key={story.id}
                className="briefing-article max-w-none"
              >
                <div 
                  className="briefing-content enhanced-content"
                  dangerouslySetInnerHTML={{ __html: story.metadata.content }}
                />
                
                {/* Sources */}
                {story.metadata.sources && (
                  <div className="mt-8 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Sources: {story.metadata.sources.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            );
          } else if (isEnhanced) {
            // Enhanced briefing format
            const metadata = story.metadata;
            return (
              <div
                key={story.id}
                className="border-b border-border pb-6 last:border-b-0"
              >
                {/* Headline */}
                <h3 className="text-xl font-bold mb-3">{metadata.headline}</h3>
                
                {/* Source attribution */}
                <div className="flex items-center gap-2 text-sm mb-4">
                  <span className="font-semibold text-orange-500">
                    {story.tweet.source.name}
                  </span>
                  <span className="text-muted-foreground">
                    {story.tweet.source.handle}
                  </span>
                </div>

                {/* Context Paragraph */}
                <div className="mb-4">
                  <p className="text-foreground leading-relaxed">
                    {metadata.contextParagraph}
                  </p>
                </div>

                {/* Player Stats if available */}
                {metadata.playerStats && Object.keys(metadata.playerStats).length > 0 && (
                  <div className="flex flex-wrap gap-3 py-3 mb-4 border-y">
                    {metadata.playerStats.age && (
                      <span className="text-sm font-medium">
                        Age: {metadata.playerStats.age}
                      </span>
                    )}
                    {metadata.playerStats.currentClub && (
                      <span className="text-sm font-medium">
                        Club: {metadata.playerStats.currentClub}
                      </span>
                    )}
                    {metadata.playerStats.goals !== undefined && (
                      <span className="text-sm font-medium">
                        Goals: {metadata.playerStats.goals}
                      </span>
                    )}
                    {metadata.playerStats.marketValue && (
                      <span className="text-sm font-medium text-green-600">
                        {metadata.playerStats.marketValue}
                      </span>
                    )}
                  </div>
                )}

                {/* Career Context */}
                {metadata.careerContext && (
                  <div className="bg-secondary/50 rounded-lg p-4 mb-4">
                    <p className="text-sm leading-relaxed">{metadata.careerContext}</p>
                  </div>
                )}

                {/* Transfer Dynamics */}
                {metadata.transferDynamics && (
                  <div className="mb-4">
                    <p className="text-foreground leading-relaxed">
                      {metadata.transferDynamics}
                    </p>
                  </div>
                )}

                {/* Wider Implications */}
                {metadata.widerImplications && (
                  <div className="mb-4">
                    <p className="text-foreground leading-relaxed">
                      {metadata.widerImplications}
                    </p>
                  </div>
                )}

                {/* Terry's Comment */}
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mt-4">
                  <p className="text-xs font-mono text-orange-500 mb-2">
                    TERRY&apos;S TAKE:
                  </p>
                  <p className="text-foreground italic leading-relaxed">
                    {story.terryComment}
                  </p>
                </div>

                {/* Original Tweet (collapsed) */}
                <details className="mt-4">
                  <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                    View original tweet
                  </summary>
                  <div className="mt-2 p-3 bg-secondary/30 rounded text-sm">
                    {story.tweet.content}
                    <a
                      href={story.tweet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-500 text-sm mt-2 inline-block hover:text-orange-400"
                    >
                      View on Twitter →
                    </a>
                  </div>
                </details>
              </div>
            );
          } else {
            // Original format
            return (
              <div
                key={story.id}
                className="border-b border-border pb-6 last:border-b-0"
              >
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-sm mb-4">
                    <span className="font-semibold text-orange-500">
                      {story.tweet.source.name}
                    </span>
                    <span className="text-muted-foreground">
                      {story.tweet.source.handle}
                    </span>
                  </div>

                  {/* Tweet Content */}
                  <div className="my-4 bg-secondary/50 border border-border rounded-lg p-5">
                    <p className="text-foreground leading-relaxed">
                      {story.tweet.content}
                    </p>
                    <a
                      href={story.tweet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-500 text-sm mt-3 inline-block hover:text-orange-400 transition-colors"
                    >
                      View on Twitter →
                    </a>
                  </div>

                  {/* Terry's Comment */}
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mt-4">
                    <p className="text-xs font-mono text-orange-500 mb-2">
                      TERRY&apos;S TAKE:
                    </p>
                    <p className="text-foreground italic leading-relaxed">
                      {story.terryComment}
                    </p>
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
