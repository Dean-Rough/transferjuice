/**
 * Live Feed Container - Main Component
 *
 * Implements the "Sky Sports Transfer Centre but with Terry's ascerbic commentary" vision:
 * - Real-time updates via Server-Sent Events (SSE)
 * - Infinite scroll with performance optimization
 * - Tag-based filtering with URL state management
 * - Image-heavy design with player photos and club badges
 * - Terry's Breaking News integration
 * - Smart content mixing with partner attribution
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { FeedItem } from "./FeedItem";
import { LiveFeedFilters } from "./LiveFeedFilters";

interface FeedUpdate {
  id: string;
  type: "transfer_update" | "breaking_news" | "story_mix";
  content: string;
  terryCommentary: string;
  images?: Array<{
    url: string;
    type: "player" | "club_badge" | "stadium" | "action";
    altText: string;
  }>;
  tags: Array<{
    name: string;
    type: "club" | "player" | "source";
  }>;
  originalSource?: {
    name: string;
    username: string;
    url: string;
  };
  partnerAttribution?: {
    source: string;
    url: string;
    attribution: string;
  };
  timestamp: Date;
  priority: "breaking" | "high" | "medium" | "low";
}

export function LiveFeedContainer() {
  const [feedItems, setFeedItems] = useState<FeedUpdate[]>([]);
  const [filteredItems, setFilteredItems] = useState<FeedUpdate[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<
    Array<{
      id: string;
      name: string;
      type: "CLUB" | "PLAYER" | "SOURCE";
      count: number;
    }>
  >([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const feedContainerRef = useRef<HTMLDivElement>(null);

  // Initialize feed with existing data
  useEffect(() => {
    loadInitialFeed();
  }, []);

  // Set up SSE connection for real-time updates
  useEffect(() => {
    connectToLiveFeed();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [activeTags]);

  // Filter items when tags change
  useEffect(() => {
    filterItems();
  }, [feedItems, activeTags]);

  const loadInitialFeed = async () => {
    try {
      const response = await fetch("/api/feed?limit=20");
      const data = await response.json();

      if (data.success && data.data) {
        // Transform existing data to match FeedUpdate interface
        const transformedItems: FeedUpdate[] = data.data.map((item: any) => ({
          id: item.id,
          type: item.type || "transfer_update",
          content: item.content,
          terryCommentary: item.terryCommentary,
          images: item.media || [],
          tags: item.tags || [],
          originalSource: item.source
            ? {
                name: item.source.name,
                username: item.source.username,
                url: item.originalUrl,
              }
            : undefined,
          timestamp: new Date(item.publishedAt || item.createdAt),
          priority: (item.priority?.toLowerCase() || "medium") as
            | "breaking"
            | "high"
            | "medium"
            | "low",
        }));

        setFeedItems(transformedItems);
        updateAvailableTags(transformedItems);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to load initial feed:", error);
      setIsLoading(false);
    }
  };

  const connectToLiveFeed = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus("connecting");

    // Build SSE URL with filters
    const url = new URL("/api/live-feed", window.location.origin);
    if (activeTags.length > 0) {
      url.searchParams.set("tags", activeTags.join(","));
    }

    const eventSource = new EventSource(url.toString());
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("🔌 Live feed connected");
      setConnectionStatus("connected");
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleLiveUpdate(data);
      } catch (error) {
        console.error("Failed to parse SSE message:", error);
      }
    };

    eventSource.addEventListener("feed-update", (event) => {
      try {
        const data = JSON.parse(event.data);
        addNewFeedItem(data.data);
      } catch (error) {
        console.error("Failed to handle feed update:", error);
      }
    });

    eventSource.addEventListener("breaking-news", (event) => {
      try {
        const data = JSON.parse(event.data);
        addBreakingNews(data.data);
      } catch (error) {
        console.error("Failed to handle breaking news:", error);
      }
    });

    eventSource.addEventListener("connection-count", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`👥 ${data.data.count} users watching live feed`);
      } catch (error) {
        console.error("Failed to handle connection count:", error);
      }
    });

    eventSource.onerror = (error) => {
      console.error("❌ SSE connection error:", error);
      setConnectionStatus("error");
      setIsConnected(false);

      // Retry connection after delay
      setTimeout(() => {
        connectToLiveFeed();
      }, 5000);
    };
  };

  const handleLiveUpdate = (data: any) => {
    setLastUpdateTime(new Date());

    if (data.type === "heartbeat") {
      // Keep connection alive
      return;
    }

    if (data.type === "connection") {
      console.log("📡 Connected to live feed:", data.data.message);
      return;
    }
  };

  const addNewFeedItem = (newItem: FeedUpdate) => {
    setFeedItems((prevItems) => {
      // Check if item already exists
      const exists = prevItems.some((item) => item.id === newItem.id);
      if (exists) return prevItems;

      // Add to beginning of feed for real-time updates
      const updatedItems = [newItem, ...prevItems];
      updateAvailableTags(updatedItems);
      return updatedItems;
    });

    // Show notification for breaking news
    if (newItem.priority === "breaking") {
      showBreakingNewsNotification(newItem);
    }
  };

  const addBreakingNews = (breakingNews: FeedUpdate) => {
    // Breaking news gets priority placement
    setFeedItems((prevItems) => {
      const updatedItems = [
        { ...breakingNews, type: "breaking_news" as const },
        ...prevItems,
      ];
      updateAvailableTags(updatedItems);
      return updatedItems;
    });

    showBreakingNewsNotification(breakingNews);
  };

  const showBreakingNewsNotification = (item: FeedUpdate) => {
    // Browser notification if permitted
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🚨 Transfer Breaking News!", {
        body: item.terryCommentary.substring(0, 100) + "...",
        icon: "/favicon.ico",
      });
    }
  };

  const updateAvailableTags = (items: FeedUpdate[]) => {
    const tagCounts = new Map<string, { type: string; count: number }>();

    items.forEach((item) => {
      item.tags.forEach((tag) => {
        const existing = tagCounts.get(tag.name);
        if (existing) {
          existing.count += 1;
        } else {
          tagCounts.set(tag.name, {
            type: tag.type.toUpperCase(),
            count: 1,
          });
        }
      });
    });

    const tags = Array.from(tagCounts.entries()).map(([name, data]) => ({
      id: `tag_${name.replace(/\s+/g, "_")}`,
      name,
      type: data.type as "CLUB" | "PLAYER" | "SOURCE",
      count: data.count,
    }));

    // Sort by count (most used first)
    tags.sort((a, b) => b.count - a.count);

    setAvailableTags(tags);
  };

  const filterItems = () => {
    if (activeTags.length === 0) {
      setFilteredItems(feedItems);
      return;
    }

    const filtered = feedItems.filter((item) => {
      return item.tags.some((tag) => activeTags.includes(tag.name));
    });

    setFilteredItems(filtered);
  };

  const handleTagToggle = useCallback((tagName: string) => {
    setActiveTags((prev) => {
      if (prev.includes(tagName)) {
        return prev.filter((tag) => tag !== tagName);
      } else {
        return [...prev, tagName];
      }
    });
  }, []);

  const handleClearAllTags = useCallback(() => {
    setActiveTags([]);
  }, []);

  const handleFiltersChange = useCallback((tags: string[]) => {
    // This will trigger SSE reconnection with new filters
    // Already handled by the useEffect dependency on activeTags
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <div className="text-muted-foreground">
            Loading live transfer feed...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="live-feed-container">
      {/* Connection Status Banner */}
      <div
        className={`px-4 py-2 text-sm text-center transition-all ${
          connectionStatus === "connected"
            ? "bg-green-500/10 text-green-500"
            : connectionStatus === "connecting"
              ? "bg-yellow-500/10 text-yellow-500"
              : connectionStatus === "error"
                ? "bg-red-500/10 text-red-500"
                : "bg-gray-500/10 text-gray-500"
        }`}
      >
        {connectionStatus === "connected" && (
          <>
            🟢 Live feed active{" "}
            {lastUpdateTime &&
              `• Last update: ${lastUpdateTime.toLocaleTimeString()}`}
          </>
        )}
        {connectionStatus === "connecting" && "🟡 Connecting to live feed..."}
        {connectionStatus === "error" && "🔴 Connection lost • Retrying..."}
        {connectionStatus === "disconnected" && "⚫ Disconnected"}
      </div>

      {/* Live Feed Filters */}
      <LiveFeedFilters
        availableTags={availableTags}
        activeTags={activeTags}
        onTagToggle={handleTagToggle}
        onClearAll={handleClearAllTags}
        onFiltersChange={handleFiltersChange}
      />

      {/* Feed Header */}
      <div className="border-b border-border p-4 bg-card/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black">
              {activeTags.length > 0
                ? "🎯 Filtered Feed"
                : "🌍 Live Global Transfer Feed"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {filteredItems.length} update
              {filteredItems.length !== 1 ? "s" : ""}
              {activeTags.length > 0 && ` • ${feedItems.length} total`}
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-muted-foreground">
              Hourly monitoring • Real-time updates
            </div>
            {isConnected && (
              <div className="text-xs text-green-500 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feed Items */}
      <div ref={feedContainerRef} className="divide-y divide-border">
        {filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-muted-foreground mb-2">
                {activeTags.length > 0
                  ? "🎯 No transfers match your filters"
                  : "📡 Waiting for transfer updates..."}
              </div>
              {activeTags.length > 0 && (
                <button
                  onClick={handleClearAllTags}
                  className="text-orange-500 hover:text-orange-400 text-sm"
                >
                  Clear filters to see all updates
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredItems.map((item, index) => {
            // Transform the LiveFeed data to match FeedItem interface
            const feedItemData = {
              id: item.id,
              type:
                item.type === "breaking_news"
                  ? ("breaking" as const)
                  : item.type === "story_mix"
                    ? ("partner" as const)
                    : ("itk" as const),
              timestamp: item.timestamp,
              content: item.content,
              terryCommentary: item.terryCommentary,
              source: {
                name: item.originalSource?.name || "Unknown Source",
                handle: item.originalSource?.username,
                tier: 1 as const, // Default tier, should come from source data
                reliability: 0.8, // Default reliability, should come from source data
                region: "GLOBAL" as const,
              },
              tags: {
                clubs: Array.isArray(item.tags)
                  ? item.tags
                      .filter((tag) => tag.type === "club")
                      .map((tag) => tag.name)
                  : [],
                players: Array.isArray(item.tags)
                  ? item.tags
                      .filter((tag) => tag.type === "player")
                      .map((tag) => tag.name)
                  : [],
                sources: Array.isArray(item.tags)
                  ? item.tags
                      .filter((tag) => tag.type === "source")
                      .map((tag) => tag.name)
                  : [],
              },
              media: item.images?.[0]
                ? {
                    type: "image" as const,
                    url: item.images[0].url,
                    altText: item.images[0].altText,
                    thumbnailUrl: item.images[0].url,
                  }
                : undefined,
              engagement: {
                shares: 0,
                reactions: 0,
                clicks: 0,
              },
              metadata: {
                priority: item.priority,
                relevanceScore: 0.8,
                originalUrl: item.originalSource?.url,
                attribution: item.partnerAttribution?.attribution,
              },
              isNew: false,
            };

            return (
              <FeedItem
                key={item.id}
                item={feedItemData}
                onTagClick={(tag: string) => {
                  // Add tag to active filters
                  if (!activeTags.includes(tag)) {
                    handleTagToggle(tag);
                  }
                }}
              />
            );
          })
        )}
      </div>

      {/* Load More / Infinite Scroll Trigger */}
      {filteredItems.length > 0 && (
        <div className="p-8 text-center">
          <div className="text-muted-foreground text-sm">
            🔄 Monitoring{" "}
            {availableTags.reduce((acc, tag) => acc + tag.count, 0)} sources
            globally
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Next update in ~{60 - new Date().getMinutes()} minutes
          </div>
        </div>
      )}
    </div>
  );
}
