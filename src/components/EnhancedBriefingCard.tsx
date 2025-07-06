"use client";

import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  story: {
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
}

export const EnhancedBriefingCard: FC<EnhancedBriefingCardProps> = ({ story }) => {
  const metadata: EnhancedStoryData = story.metadata || {};
  
  return (
    <Card className="mb-6 hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-2xl font-bold leading-tight">
            {metadata.headline || "Transfer Update"}
          </CardTitle>
          <Badge variant="secondary" className="ml-2">
            <Clock className="w-3 h-3 mr-1" />
            {new Date(story.tweet.createdAt).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Badge>
        </div>
        
        {/* Source attribution */}
        <div className="text-sm text-muted-foreground">
          via {story.tweet.source.name} ({story.tweet.source.handle})
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Context Paragraph */}
        <div className="text-base leading-relaxed">
          {metadata.contextParagraph || story.tweet.content}
        </div>
        
        {/* Player Stats Bar */}
        {metadata.playerStats && Object.keys(metadata.playerStats).length > 0 && (
          <div className="flex flex-wrap gap-3 py-3 border-y">
            {metadata.playerStats.age && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{metadata.playerStats.age} years</span>
              </div>
            )}
            {metadata.playerStats.currentClub && (
              <div className="flex items-center gap-1">
                <Badge variant="outline">{metadata.playerStats.currentClub}</Badge>
              </div>
            )}
            {metadata.playerStats.goals !== undefined && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{metadata.playerStats.goals} goals</span>
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
            <p className="text-base leading-relaxed">{metadata.transferDynamics}</p>
          </div>
        )}
        
        {/* Wider Implications */}
        {metadata.widerImplications && (
          <div>
            <h4 className="font-semibold mb-2">What Happens Next</h4>
            <p className="text-base leading-relaxed">{metadata.widerImplications}</p>
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
      </CardContent>
    </Card>
  );
};