/**
 * Live Feed Filters Component
 *
 * Provides real-time tag-based filtering for the live transfer feed:
 * - Club tags (#Arsenal, #Chelsea, etc.)
 * - Player tags (@Haaland, @Mbappe, etc.)
 * - Source tags (FabrizioRomano, David_Ornstein, etc.)
 * - URL state management for shareable filtered views
 * - Real-time SSE connection with filtered updates
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TagButton } from "./TagButton";

interface LiveFeedFiltersProps {
  availableTags: Array<{
    id: string;
    name: string;
    type: "CLUB" | "PLAYER" | "SOURCE";
    count: number;
  }>;
  activeTags: string[];
  onTagToggle: (tagName: string) => void;
  onClearAll: () => void;
  onFiltersChange: (tags: string[]) => void;
}

export function LiveFeedFilters({
  availableTags,
  activeTags,
  onTagToggle,
  onClearAll,
  onFiltersChange,
}: LiveFeedFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    club: true,
    player: true,
    source: false,
  });

  // Update URL when filters change
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeTags.length > 0) {
      url.searchParams.set("tags", activeTags.join(","));
    } else {
      url.searchParams.delete("tags");
    }
    window.history.replaceState({}, "", url.toString());
    onFiltersChange(activeTags);
  }, [activeTags, onFiltersChange]);

  // Load filters from URL on mount
  useEffect(() => {
    const url = new URL(window.location.href);
    const tagsParam = url.searchParams.get("tags");
    if (tagsParam) {
      const urlTags = tagsParam.split(",").filter(Boolean);
      urlTags.forEach((tag) => {
        if (!activeTags.includes(tag)) {
          onTagToggle(tag);
        }
      });
    }
  }, []); // Only run on mount

  // Group tags by type
  const clubTags = availableTags.filter((tag) => tag.type === "CLUB");
  const playerTags = availableTags.filter((tag) => tag.type === "PLAYER");
  const sourceTags = availableTags.filter((tag) => tag.type === "SOURCE");

  // Filter tags based on search query
  const filteredClubTags = clubTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredPlayerTags = playerTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredSourceTags = sourceTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleSection = (section: "club" | "player" | "source") => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const getTagIcon = (type: string) => {
    switch (type) {
      case "CLUB":
        return "🏟️";
      case "PLAYER":
        return "⚽";
      case "SOURCE":
        return "📰";
      default:
        return "🏷️";
    }
  };

  const getTagPrefix = (type: string) => {
    switch (type) {
      case "CLUB":
        return "#";
      case "PLAYER":
        return "@";
      case "SOURCE":
        return "";
      default:
        return "";
    }
  };

  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="mx-auto max-w-4xl px-4 py-4">
        {/* Filter Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-lg">🔍 Filter Live Feed</h3>
            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {activeTags.length > 0
                ? `${activeTags.length} active`
                : "Show all"}
            </div>
          </div>

          {activeTags.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-sm text-orange-500 hover:text-orange-400 font-medium transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search clubs, players, sources..."
            className="w-full pl-10 pr-10 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg
                className="h-4 w-4 text-gray-400 hover:text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Active Tags Display */}
        {activeTags.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">
              🎯 Active filters:
            </p>
            <div className="flex flex-wrap gap-2">
              {activeTags.map((tagName) => {
                const tag = availableTags.find((t) => t.name === tagName);
                if (!tag) return null;

                return (
                  <TagButton
                    key={tagName}
                    tag={{
                      ...tag,
                      displayName: `${getTagPrefix(tag.type)}${tag.name}`,
                    }}
                    isActive={true}
                    onClick={() => onTagToggle(tagName)}
                    showCount={false}
                    size="sm"
                    showRemove={true}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Tag Categories */}
        <div className="space-y-4">
          {/* Club Tags */}
          {filteredClubTags.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection("club")}
                className="flex items-center gap-2 w-full text-left mb-2 hover:text-orange-500 transition-colors"
              >
                <span className="font-bold text-sm">🏟️ #CLUBS</span>
                <span className="text-xs text-muted-foreground">
                  ({filteredClubTags.length})
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {expandedSections.club ? "▼" : "▶"}
                </span>
              </button>

              {expandedSections.club && (
                <div className="flex flex-wrap gap-2">
                  {filteredClubTags.slice(0, 12).map((tag) => (
                    <TagButton
                      key={tag.id}
                      tag={{
                        ...tag,
                        displayName: `#${tag.name}`,
                      }}
                      isActive={activeTags.includes(tag.name)}
                      onClick={() => onTagToggle(tag.name)}
                      showCount={true}
                      size="md"
                    />
                  ))}
                  {filteredClubTags.length > 12 && (
                    <span className="text-xs text-muted-foreground self-center">
                      +{filteredClubTags.length - 12} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Player Tags */}
          {filteredPlayerTags.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection("player")}
                className="flex items-center gap-2 w-full text-left mb-2 hover:text-orange-500 transition-colors"
              >
                <span className="font-bold text-sm">⚽ @PLAYERS</span>
                <span className="text-xs text-muted-foreground">
                  ({filteredPlayerTags.length})
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {expandedSections.player ? "▼" : "▶"}
                </span>
              </button>

              {expandedSections.player && (
                <div className="flex flex-wrap gap-2">
                  {filteredPlayerTags.slice(0, 10).map((tag) => (
                    <TagButton
                      key={tag.id}
                      tag={{
                        ...tag,
                        displayName: `@${tag.name}`,
                      }}
                      isActive={activeTags.includes(tag.name)}
                      onClick={() => onTagToggle(tag.name)}
                      showCount={true}
                      size="md"
                    />
                  ))}
                  {filteredPlayerTags.length > 10 && (
                    <span className="text-xs text-muted-foreground self-center">
                      +{filteredPlayerTags.length - 10} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Source Tags */}
          {filteredSourceTags.length > 0 && (
            <div>
              <button
                onClick={() => toggleSection("source")}
                className="flex items-center gap-2 w-full text-left mb-2 hover:text-orange-500 transition-colors"
              >
                <span className="font-bold text-sm">📰 SOURCES</span>
                <span className="text-xs text-muted-foreground">
                  ({filteredSourceTags.length})
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {expandedSections.source ? "▼" : "▶"}
                </span>
              </button>

              {expandedSections.source && (
                <div className="flex flex-wrap gap-2">
                  {filteredSourceTags.slice(0, 8).map((tag) => (
                    <TagButton
                      key={tag.id}
                      tag={tag}
                      isActive={activeTags.includes(tag.name)}
                      onClick={() => onTagToggle(tag.name)}
                      showCount={true}
                      size="md"
                    />
                  ))}
                  {filteredSourceTags.length > 8 && (
                    <span className="text-xs text-muted-foreground self-center">
                      +{filteredSourceTags.length - 8} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Connection Status */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live feed active</span>
              {activeTags.length > 0 && (
                <span>• Filtering real-time updates</span>
              )}
            </div>
            <span>
              💡 Click tags to filter instantly • Multiple selections supported
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
