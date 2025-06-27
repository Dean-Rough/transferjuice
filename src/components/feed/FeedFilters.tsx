"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { TagButton } from "./TagButton";
import {
  useFeedStore,
  selectActiveFilters,
  selectFilterStatus,
  selectFilteredItems,
} from "@/lib/stores/feedStore";
import { useUrlFilters } from "@/hooks/useUrlFilters";

export function FeedFilters() {
  const activeFilters = useFeedStore(selectActiveFilters);
  const filterStatus = useFeedStore(selectFilterStatus);
  const filteredItems = useFeedStore(selectFilteredItems);

  const {
    setActiveFilters,
    clearFilters,
    addTagFilter,
    removeTagFilter,
    getTrendingTags,
    getRelatedTags,
  } = useFeedStore();

  const { syncFiltersFromUrl, updateUrlFilters } = useUrlFilters();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<
    "all" | "clubs" | "players" | "sources"
  >("all");

  // Sync filters from URL on mount
  useEffect(() => {
    syncFiltersFromUrl();
  }, [syncFiltersFromUrl]);

  // Load trending tags
  useEffect(() => {
    const trending = getTrendingTags(10);
    setTrendingTags(trending);
  }, [getTrendingTags]);

  // Enhanced suggestions with global scope
  const allSuggestions = useMemo(
    () => ({
      clubs: [
        "Arsenal",
        "Chelsea",
        "Manchester United",
        "Liverpool",
        "Manchester City",
        "Tottenham",
        "Real Madrid",
        "Barcelona",
        "Atletico Madrid",
        "Sevilla",
        "Juventus",
        "AC Milan",
        "Inter Milan",
        "Napoli",
        "AS Roma",
        "Bayern Munich",
        "Borussia Dortmund",
        "RB Leipzig",
        "Bayer Leverkusen",
        "PSG",
        "Lyon",
        "Marseille",
        "Monaco",
      ],
      players: [
        "Erling Haaland",
        "Kylian Mbappe",
        "Jude Bellingham",
        "Harry Kane",
        "Mohamed Salah",
        "Vinicius Jr",
        "Pedri",
        "Gavi",
        "Jamal Musiala",
        "Eduardo Camavinga",
        "Victor Osimhen",
        "Rafael Leao",
        "Khvicha Kvaratskhelia",
        "Dusan Vlahovic",
        "Bukayo Saka",
        "Phil Foden",
        "Florian Wirtz",
        "Youssoufa Moukoko",
      ],
      sources: [
        "Fabrizio Romano",
        "David Ornstein",
        "Gianluca Di Marzio",
        "Marca",
        "L'Équipe",
        "Sky Sports",
        "ESPN Brasil",
        "Bild",
        "AS English",
        "SkySportsNews",
      ],
    }),
    [],
  );

  // Enhanced search handler with category support
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);

      if (query.length > 1) {
        const allTags = [
          ...allSuggestions.clubs,
          ...allSuggestions.players,
          ...allSuggestions.sources,
        ];

        const activeTags = [
          ...activeFilters.tags,
          ...(activeFilters.clubs || []),
          ...(activeFilters.players || []),
          ...(activeFilters.sources || []),
        ];

        const filteredSuggestions = allTags.filter(
          (tag) =>
            tag.toLowerCase().includes(query.toLowerCase()) &&
            !activeTags.includes(tag),
        );

        setSuggestions(filteredSuggestions.slice(0, 8));
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    },
    [allSuggestions, activeFilters],
  );

  const handleTagSelect = useCallback(
    (tag: string, type?: "club" | "player" | "source") => {
      // Determine type if not provided
      if (!type) {
        if (allSuggestions.clubs.includes(tag)) type = "club";
        else if (allSuggestions.players.includes(tag)) type = "player";
        else if (allSuggestions.sources.includes(tag)) type = "source";
      }

      addTagFilter(tag, type);
      updateUrlFilters(activeFilters.tags);
      setSearchQuery("");
      setShowSuggestions(false);
    },
    [addTagFilter, updateUrlFilters, activeFilters, allSuggestions],
  );

  const handleTagRemove = useCallback(
    (tag: string) => {
      removeTagFilter(tag);
      updateUrlFilters(activeFilters.tags);
    },
    [removeTagFilter, updateUrlFilters, activeFilters],
  );

  const handleClearAll = useCallback(() => {
    clearFilters();
    updateUrlFilters([]);
    setSearchQuery("");
  }, [clearFilters, updateUrlFilters]);

  return (
    <div className="feed-filters bg-background border-b border-border p-4">
      {/* Enhanced search input with filter tabs */}
      <div className="space-y-4">
        {/* Filter tabs */}
        <div className="flex items-center space-x-1 bg-secondary/50 rounded-lg p-1">
          {(["all", "clubs", "players", "sources"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors engagement-mono ${
                activeTab === tab
                  ? "bg-orange-600 text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
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
            placeholder={`Search ${activeTab === "all" ? "clubs, players, sources" : activeTab}...`}
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none"
            data-testid="tag-search-input"
          />

          {/* Search suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
              {suggestions.map((suggestion) => {
                const type = allSuggestions.clubs.includes(suggestion)
                  ? "club"
                  : allSuggestions.players.includes(suggestion)
                    ? "player"
                    : "source";
                const icon =
                  type === "club" ? "🏟️" : type === "player" ? "⚽" : "📰";

                return (
                  <button
                    key={suggestion}
                    onClick={() => handleTagSelect(suggestion, type)}
                    className="w-full px-4 py-2 text-left text-foreground hover:bg-muted first:rounded-t-lg last:rounded-b-lg flex items-center space-x-2"
                  >
                    <span>{icon}</span>
                    <span>{suggestion}</span>
                    <span className="text-xs text-muted-foreground ml-auto engagement-mono">
                      {type}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced active filters with categories */}
      {filterStatus.isFiltering && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Active Filters
            </h3>
            <button
              onClick={handleClearAll}
              className="text-xs text-muted-foreground hover:text-orange-500 flex items-center space-x-1 engagement-mono"
              data-testid="clear-filters-button"
            >
              <svg
                className="w-3 h-3"
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
              <span>Clear all</span>
            </button>
          </div>

          {/* Club filters */}
          {activeFilters.clubs && activeFilters.clubs.length > 0 && (
            <div>
              <h4 className="text-xs text-muted-foreground mb-2 flex items-center space-x-1 engagement-mono">
                <span>🏟️</span>
                <span>Clubs</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeFilters.clubs.map((club) => (
                  <TagButton
                    key={`club-${club}`}
                    tag={club}
                    isActive={true}
                    onClick={() => handleTagRemove(club)}
                    onRemove={() => handleTagRemove(club)}
                    size="sm"
                    variant="club"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Player filters */}
          {activeFilters.players && activeFilters.players.length > 0 && (
            <div>
              <h4 className="text-xs text-muted-foreground mb-2 flex items-center space-x-1 engagement-mono">
                <span>⚽</span>
                <span>Players</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeFilters.players.map((player) => (
                  <TagButton
                    key={`player-${player}`}
                    tag={player}
                    isActive={true}
                    onClick={() => handleTagRemove(player)}
                    onRemove={() => handleTagRemove(player)}
                    size="sm"
                    variant="player"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Source filters */}
          {activeFilters.sources && activeFilters.sources.length > 0 && (
            <div>
              <h4 className="text-xs text-muted-foreground mb-2 flex items-center space-x-1 engagement-mono">
                <span>📰</span>
                <span>Sources</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeFilters.sources.map((source) => (
                  <TagButton
                    key={`source-${source}`}
                    tag={source}
                    isActive={true}
                    onClick={() => handleTagRemove(source)}
                    onRemove={() => handleTagRemove(source)}
                    size="sm"
                    variant="source"
                  />
                ))}
              </div>
            </div>
          )}

          {/* General tags */}
          {activeFilters.tags && activeFilters.tags.length > 0 && (
            <div>
              <h4 className="text-xs text-muted-foreground mb-2 engagement-mono">
                Other Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeFilters.tags.map((tag) => (
                  <TagButton
                    key={`tag-${tag}`}
                    tag={tag}
                    isActive={true}
                    onClick={() => handleTagRemove(tag)}
                    onRemove={() => handleTagRemove(tag)}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Filter stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border engagement-mono">
            <span>
              Showing {filterStatus.filteredCount} of {filterStatus.totalCount}{" "}
              updates
            </span>
            {filterStatus.filteredCount < filterStatus.totalCount && (
              <span className="text-orange-500">
                {Math.round(
                  (filterStatus.filteredCount / filterStatus.totalCount) * 100,
                )}
                % match
              </span>
            )}
          </div>
        </div>
      )}

      {/* Enhanced trending tags with category tabs */}
      {trendingTags.length > 0 && !filterStatus.isFiltering && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center space-x-2">
            <span>🔥</span>
            <span>Trending</span>
          </h3>

          {/* Quick filter suggestions based on active tab */}
          <div className="space-y-2">
            {activeTab !== "all" && (
              <div>
                <h4 className="text-xs text-muted-foreground mb-1 capitalize engagement-mono">
                  {activeTab}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {allSuggestions[activeTab as keyof typeof allSuggestions]
                    ?.slice(0, 6)
                    .map((item) => (
                      <TagButton
                        key={item}
                        tag={item}
                        onClick={() => handleTagSelect(item, activeTab as any)}
                        size="sm"
                        variant={activeTab as any}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Trending from actual data */}
            <div>
              <h4 className="text-xs text-muted-foreground mb-1 engagement-mono">
                Most Active
              </h4>
              <div className="flex flex-wrap gap-2">
                {trendingTags.slice(0, 6).map((tag) => (
                  <TagButton
                    key={tag}
                    tag={tag}
                    onClick={() => handleTagSelect(tag)}
                    size="sm"
                    variant="secondary"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
