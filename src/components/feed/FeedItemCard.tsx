"use client";

import Image from "next/image";
import { useState } from "react";

interface FeedItemCardProps {
  id: string;
  priority: "breaking" | "high" | "medium" | "low";
  headline: string;
  content: string;
  terryCommentary?: string;
  source: {
    name: string;
    handle?: string;
    profileImage?: string;
    tier: 1 | 2 | 3;
  };
  timestamp: Date;
  heroImage?: {
    url: string;
    alt: string;
    caption?: string;
  };
  tags: {
    clubs: Array<{ name: string; badge?: string }>;
    players: Array<{ name: string; photo?: string }>;
    sources: string[];
  };
  engagement?: {
    shares: number;
    reactions: number;
  };
}

export function FeedItemCard({
  priority,
  headline,
  content,
  terryCommentary,
  source,
  timestamp,
  heroImage,
  tags,
  engagement,
}: FeedItemCardProps) {
  const [imageError, setImageError] = useState(false);

  const priorityColors = {
    breaking: "bg-red-600 text-white",
    high: "bg-orange-600 text-white",
    medium: "bg-gray-600 text-white",
    low: "bg-gray-500 text-white",
  };

  const priorityLabels = {
    breaking: "BREAKING",
    high: "HIGH",
    medium: "MEDIUM",
    low: "LOW",
  };

  return (
    <article className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-rotate-0.5 -rotate-1">
      {/* Hero Image */}
      {heroImage && !imageError && (
        <div className="relative w-full aspect-video">
          <Image
            src={heroImage.url}
            alt={heroImage.alt}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            priority={priority === "breaking"}
          />
          {heroImage.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p className="text-xs text-white/80">{heroImage.caption}</p>
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        {/* Header - Priority, Source, Time */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Priority Badge */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold data-mono ${priorityColors[priority]}`}
            >
              {priorityLabels[priority]}
            </span>

            {/* Source */}
            <div className="flex items-center gap-2">
              {source.profileImage && (
                <Image
                  src={source.profileImage}
                  alt={source.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              )}
              <span className="text-sm text-muted-foreground">
                {source.name}
                {source.tier === 1 && (
                  <span className="ml-1 text-green-500">✓</span>
                )}
              </span>
            </div>
          </div>

          {/* Timestamp */}
          <time className="text-xs text-muted-foreground data-mono">
            {timestamp.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>

        {/* Headline */}
        <h3 className="text-2xl md:text-3xl font-black mb-3 leading-tight">
          {headline}
        </h3>

        {/* Content */}
        <p className="text-base md:text-lg font-light text-foreground/90 mb-4 leading-relaxed">
          {content}
        </p>

        {/* Terry Commentary */}
        {terryCommentary && (
          <div className="bg-orange-500/10 border-l-4 border-orange-500 p-4 mb-4 -rotate-0.5">
            <p className="terry-voice text-orange-100">
              &quot;{terryCommentary}&quot;
            </p>
            <span className="text-xs text-orange-400 mt-1 block">
              - The Terry
            </span>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Club Tags */}
          {tags.clubs.map((club, i) => (
            <button
              key={`club-${i}`}
              className="tag-pill tag-club flex items-center gap-2"
            >
              {club.badge && (
                <Image
                  src={club.badge}
                  alt={club.name}
                  width={16}
                  height={16}
                  className="w-4 h-4"
                />
              )}
              #{club.name}
            </button>
          ))}

          {/* Player Tags */}
          {tags.players.map((player, i) => (
            <button
              key={`player-${i}`}
              className="tag-pill tag-player flex items-center gap-2"
            >
              {player.photo && (
                <Image
                  src={player.photo}
                  alt={player.name}
                  width={16}
                  height={16}
                  className="w-4 h-4 rounded-full"
                />
              )}
              @{player.name}
            </button>
          ))}

          {/* Source Tags */}
          {tags.sources.map((source, i) => (
            <button key={`source-${i}`} className="tag-pill tag-source">
              Source:{source}
            </button>
          ))}
        </div>

        {/* Engagement Metrics */}
        {engagement && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground data-mono">
            <span>{engagement.shares} shares</span>
            <span>{engagement.reactions} reactions</span>
          </div>
        )}
      </div>
    </article>
  );
}
