"use client";

import { FC } from "react";
import { Clock, TrendingUp, Users, Trophy } from "lucide-react";

interface PlayerStats {
  age?: number;
  currentClub?: string;
  position?: string;
  goals?: number;
  assists?: number;
  appearances?: number;
  trophies?: string[];
  marketValue?: string;
  contractUntil?: string;
}

interface EnhancedStoryData {
  headline: string;
  contextParagraph: string;
  careerContext: string;
  transferDynamics: string;
  widerImplications: string;
  playerStats?: PlayerStats;
  groupTopic?: string;
}

interface EnhancedBriefingCardProps {
  briefing?: any;
  story?: {
    id: string;
    terryComment: string;
    metadata?: any;
    tweet: {
      content: string;
      createdAt: Date;
      source: {
        name: string;
        handle: string;
      };
    };
  };
  isDetailPage?: boolean;
}

export const EnhancedBriefingCard: FC<EnhancedBriefingCardProps> = ({
  briefing,
  story: singleStory,
  isDetailPage = false,
}) => {
  // If briefing is provided, render all stories. Otherwise render single story
  if (briefing) {
    return (
      <div className="space-y-6">
        {briefing.stories.map(({ story }: any) => (
          <EnhancedBriefingCard
            key={story.id}
            story={story}
            isDetailPage={isDetailPage}
          />
        ))}
      </div>
    );
  }

  const story = singleStory!;
  const metadata: EnhancedStoryData = story.metadata || {};

  return (
    <div className="bg-card border border-border rounded-lg mb-6 hover:shadow-lg transition-shadow">
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-2xl font-bold leading-tight">
            {metadata.headline || "Transfer Update"}
          </h3>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground ml-2">
            <Clock className="w-3 h-3" />
            {new Date(story.tweet.createdAt).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Source attribution */}
        <div className="text-sm text-muted-foreground">
          via {story.tweet.source.name} ({story.tweet.source.handle})
        </div>
      </div>

      <div className="px-6 pb-6 space-y-4">
        {/* Context Paragraph */}
        <div className="text-base leading-relaxed">
          {metadata.contextParagraph || story.tweet.content}
        </div>

        {/* Player Stats Bar */}
        {metadata.playerStats &&
          Object.keys(metadata.playerStats).length > 0 && (
            <div className="flex flex-wrap gap-3 py-3 border-y">
              {metadata.playerStats.age && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {metadata.playerStats.age} years
                  </span>
                </div>
              )}
              {metadata.playerStats.currentClub && (
                <div className="flex items-center gap-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-border">
                    {metadata.playerStats.currentClub}
                  </span>
                </div>
              )}
              {metadata.playerStats.goals !== undefined && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {metadata.playerStats.goals} goals
                  </span>
                </div>
              )}
              {metadata.playerStats.marketValue && (
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-green-600">
                    {metadata.playerStats.marketValue}
                  </span>
                </div>
              )}
            </div>
          )}

        {/* Career Context */}
        {metadata.careerContext && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Career Context
            </h4>
            <p className="text-sm leading-relaxed">{metadata.careerContext}</p>
          </div>
        )}

        {/* Transfer Dynamics */}
        {metadata.transferDynamics && (
          <div>
            <h4 className="font-semibold mb-2">The Deal</h4>
            <p className="text-base leading-relaxed">
              {metadata.transferDynamics}
            </p>
          </div>
        )}

        {/* Wider Implications */}
        {metadata.widerImplications && (
          <div>
            <h4 className="font-semibold mb-2">What Happens Next</h4>
            <p className="text-base leading-relaxed">
              {metadata.widerImplications}
            </p>
          </div>
        )}

        {/* Terry's Take */}
        <div className="bg-accent/50 rounded-lg p-4 mt-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💭</div>
            <div>
              <div className="font-semibold mb-1">Terry's Take</div>
              <p className="text-sm italic">{story.terryComment}</p>
            </div>
          </div>
        </div>

        {/* Original Tweet (collapsed by default) */}
        <details className="mt-4">
          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
            View original tweet
          </summary>
          <div className="mt-2 p-3 bg-muted/30 rounded text-sm">
            {story.tweet.content}
          </div>
        </details>
      </div>
    </div>
  );
};
