"use client";

import { useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { TagButton } from "./TagButton";
import { ShareButton } from "./ShareButton";
import { TerryCommentary } from "./TerryCommentary";
import { FeedItem as FeedItemType, useFeedStore } from "@/lib/stores/feedStore";

interface FeedItemProps {
  item: FeedItemType;
  onTagClick?: (tag: string) => void;
  className?: string;
}

export function FeedItem({ item, onTagClick, className = "" }: FeedItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { trackEngagement } = useFeedStore();

  const handleTagClick = useCallback(
    (tag: string) => {
      trackEngagement(item.id, "click");
      if (onTagClick) {
        onTagClick(tag);
      }
    },
    [item.id, onTagClick, trackEngagement],
  );

  const getItemTypeStyle = () => {
    switch (item.type) {
      case "terry":
        return "enhanced-content jaunty-cutout";
      case "breaking":
        return "border-l-4 border-red-500 bg-gradient-to-r from-red-500/20 to-transparent animate-pulse jaunty-cutout";
      case "partner":
        return "enhanced-content jaunty-cutout-left";
      case "itk":
      default:
        return "jaunty-cutout";
    }
  };

  const getSourceDisplay = () => {
    const { source } = item;

    switch (item.type) {
      case "terry":
        return { icon: "🗣️", name: "Terry" };
      case "breaking":
        return { icon: "🚨", name: source.name };
      case "partner":
        return { icon: "📰", name: item.metadata.attribution || source.name };
      case "itk":
      default:
        return { icon: getTierIcon(source.tier), name: source.name };
    }
  };

  const getTierIcon = (tier: 1 | 2 | 3) => {
    switch (tier) {
      case 1:
        return "⭐"; // Tier 1 (Romano, Ornstein)
      case 2:
        return "📱"; // Tier 2 (Sky Sports, Marca)
      case 3:
        return "📰"; // Tier 3 (other sources)
    }
  };

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 0.9) return "text-green-400";
    if (reliability >= 0.8) return "text-yellow-400";
    return "text-orange-400";
  };

  const shouldTruncate = item.content.length > 280;
  const displayContent =
    shouldTruncate && !isExpanded
      ? `${item.content.substring(0, 280)}...`
      : item.content;

  const sourceDisplay = getSourceDisplay();

  return (
    <article
      className={`feed-item card p-6 transition-all duration-300 ${getItemTypeStyle()} ${className} ${
        item.isNew ? "ring-2 ring-orange-500/50" : ""
      }`}
      data-testid={`feed-item-${item.id}`}
      data-item-type={item.type}
      data-priority={item.metadata.priority}
    >
      {/* Enhanced header with source info and priority indicators */}
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{sourceDisplay.icon}</span>
            <span className="font-semibold text-brand-cream text-sm">
              {sourceDisplay.name}
            </span>
            {item.source.handle && (
              <span className="text-xs text-gray-400">
                {item.source.handle}
              </span>
            )}
          </div>

          {/* Enhanced type and priority indicators */}
          <div className="flex items-center space-x-2">
            {item.type === "breaking" && (
              <span className="transfer-hot tag-pill">BREAKING</span>
            )}
            {item.type === "itk" && (
              <span className="transfer-confirmed tag-pill">ITK</span>
            )}
            {item.type === "partner" && (
              <span className="tag-pill tag-source">Partner</span>
            )}
            {item.metadata.priority === "high" && item.type !== "breaking" && (
              <span className="transfer-hot tag-pill">HOT</span>
            )}
            {item.isNew && (
              <span className="tag-pill tag-club animate-pulse">NEW</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Source reliability indicator for ITK sources */}
          {item.type === "itk" && (
            <div className="flex items-center space-x-1">
              <div
                className={`w-2 h-2 rounded-full ${getReliabilityColor(item.source.reliability)}`}
              />
              <span
                className={`text-xs ${getReliabilityColor(item.source.reliability)}`}
              >
                {Math.round(item.source.reliability * 100)}%
              </span>
            </div>
          )}

          {/* Transfer type and league info */}
          {item.metadata.transferType && (
            <span className="tag-pill text-xs">
              {item.metadata.transferType}
            </span>
          )}

          {item.metadata.league && (
            <span className="engagement-mono text-gray-400">
              {item.metadata.league}
            </span>
          )}

          <time
            className="engagement-mono text-gray-400"
            dateTime={
              item.timestamp instanceof Date && !isNaN(item.timestamp.getTime())
                ? item.timestamp.toISOString()
                : new Date().toISOString()
            }
            title={
              item.timestamp instanceof Date && !isNaN(item.timestamp.getTime())
                ? item.timestamp.toLocaleString()
                : "Invalid date"
            }
          >
            {item.timestamp instanceof Date && !isNaN(item.timestamp.getTime())
              ? formatDistanceToNow(item.timestamp, { addSuffix: true })
              : "Just now"}
          </time>
          <ShareButton item={item} />
        </div>
      </header>

      {/* Main content */}
      <div className="mb-3">
        <p className="text-brand-cream leading-relaxed whitespace-pre-wrap">
          {displayContent}
        </p>

        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-brand-orange-500 hover:text-brand-orange-400 text-sm font-medium"
            aria-label={isExpanded ? "Show less" : "Show more"}
          >
            {isExpanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      {/* Media content */}
      {item.media && (
        <div className="mb-3">
          {item.media.type === "image" && (
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={item.media.url}
                alt={item.media.altText || "Transfer related image"}
                className="w-full h-auto responsive-image"
                loading="lazy"
              />
            </div>
          )}
        </div>
      )}

      {/* Terry's commentary */}
      {item.terryCommentary && (
        <TerryCommentary commentary={item.terryCommentary} className="mb-3" />
      )}

      {/* Source attribution for partner content */}
      {item.type === "partner" && item.metadata.originalUrl && (
        <div className="mb-3 p-3 bg-blue-900/20 rounded border-l-2 border-blue-500">
          <p className="text-xs text-blue-300 flex items-center space-x-2">
            <span>📰</span>
            <span>
              Via{" "}
              <a
                href={item.metadata.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-200 font-medium"
                onClick={() => trackEngagement(item.id, "click")}
              >
                {item.metadata.attribution || item.source.name}
              </a>
            </span>
          </p>
        </div>
      )}

      {/* Enhanced tags with categories */}
      {(item.tags.clubs.length > 0 ||
        item.tags.players.length > 0 ||
        item.tags.sources.length > 0) && (
        <footer className="space-y-2">
          {/* Club tags */}
          {item.tags.clubs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-400 mr-2">Clubs:</span>
              {item.tags.clubs.map((club) => (
                <TagButton
                  key={`club-${club}`}
                  tag={club}
                  onClick={() => handleTagClick(club)}
                  size="sm"
                  variant="club"
                />
              ))}
            </div>
          )}

          {/* Player tags */}
          {item.tags.players.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-400 mr-2">Players:</span>
              {item.tags.players.map((player) => (
                <TagButton
                  key={`player-${player}`}
                  tag={player}
                  onClick={() => handleTagClick(player)}
                  size="sm"
                  variant="player"
                />
              ))}
            </div>
          )}

          {/* Engagement metrics */}
          {item.engagement && (
            <div className="flex items-center space-x-4 engagement-mono text-gray-400 pt-2 border-t border-gray-800">
              {item.engagement.reactions > 0 && (
                <span className="flex items-center space-x-1">
                  <span>❤️</span>
                  <span>{item.engagement.reactions}</span>
                </span>
              )}
              {item.engagement.shares > 0 && (
                <span className="flex items-center space-x-1">
                  <span>📤</span>
                  <span>{item.engagement.shares}</span>
                </span>
              )}
              {item.engagement.clicks > 0 && (
                <span className="flex items-center space-x-1">
                  <span>👆</span>
                  <span>{item.engagement.clicks}</span>
                </span>
              )}
            </div>
          )}
        </footer>
      )}
    </article>
  );
}
