import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import {
  MemoryOptimizer,
  getMemoryMetrics,
  checkMemoryThresholds,
} from "@/lib/performance/memoryMonitor";

export interface FeedItem {
  id: string;
  type: "itk" | "terry" | "partner" | "breaking";
  timestamp: Date;
  content: string;
  terryCommentary?: string;
  source: {
    name: string;
    handle?: string;
    tier: 1 | 2 | 3;
    reliability: number;
    region?: "UK" | "ES" | "IT" | "FR" | "DE" | "BR" | "GLOBAL";
  };
  tags: {
    clubs: string[];
    players: string[];
    sources: string[];
  };
  media?: {
    type: "image" | "video";
    url: string;
    altText?: string;
    thumbnailUrl?: string;
  };
  engagement?: {
    shares: number;
    reactions: number;
    clicks: number;
  };
  metadata: {
    transferType?:
      | "signing"
      | "rumour"
      | "medical"
      | "confirmed"
      | "bid"
      | "personal_terms";
    priority: "low" | "medium" | "high" | "breaking";
    relevanceScore: number;
    league?: "PL" | "LaLiga" | "SerieA" | "Bundesliga" | "Ligue1" | "Other";
    originalUrl?: string;
    attribution?: string; // For partner content
  };
  isRead?: boolean;
  isNew?: boolean; // Real-time updates
}

export interface FeedFilters {
  tags: string[];
  timeRange?: "today" | "week" | "month" | "transfer_window";
  contentType?: FeedItem["type"][];
  sources?: string[];
  leagues?: string[];
  priority?: FeedItem["metadata"]["priority"][];
  clubs?: string[];
  players?: string[];
}

export interface FeedState {
  // Feed items and pagination
  items: FeedItem[];
  filteredItems: FeedItem[];
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  lastUpdated: Date | null;
  totalItems: number;

  // Real-time updates
  isConnected: boolean;
  pendingUpdates: FeedItem[];
  unreadCount: number;

  // Filtering and search
  activeFilters: FeedFilters;
  isFiltering: boolean;

  // UI state
  scrollPosition: number;
  selectedItemId: string | null;
  viewMode: "infinite" | "paginated";

  // Memory management
  memoryUsageMB: number;
  maxItems: number;

  // Error handling
  error: string | null;
  retryCount: number;
}

export interface FeedActions {
  // Data loading
  loadItems: (count: number) => Promise<void>;
  loadMoreItems: (offset: number) => Promise<void>;
  refreshFeed: () => Promise<void>;

  // Real-time updates
  addItem: (item: FeedItem) => void;
  markUpdatesAsRead: () => void;
  setConnectionStatus: (connected: boolean) => void;

  // Filtering (enhanced)
  setFilter: (tag: string) => void;
  setActiveFilters: (filters: Partial<FeedFilters>) => void;
  clearFilters: () => void;
  addTagFilter: (tag: string, type?: "club" | "player" | "source") => void;
  removeTagFilter: (tag: string) => void;
  applyFilters: () => void;

  // UI interactions
  setScrollPosition: (position: number) => void;
  setSelectedItem: (itemId: string | null) => void;
  setViewMode: (mode: "infinite" | "paginated") => void;

  // Analytics and discovery
  getTrendingTags: (limit: number) => string[];
  getRelatedTags: (tag: string) => string[];
  trackEngagement: (
    itemId: string,
    action: "click" | "share" | "react",
  ) => void;

  // Memory and performance
  optimizeMemory: () => void;
  getMemoryStats: () => {
    usageMB: number;
    itemCount: number;
    avgItemSize: number;
  };

  // Error handling
  setError: (error: string | null) => void;
  incrementRetryCount: () => void;
  resetRetryCount: () => void;
}

// Enhanced mock data generator for global feed development
const generateMockItem = (index: number): FeedItem => {
  const types: FeedItem["type"][] = ["itk", "terry", "partner", "breaking"];

  // Global sources with tier and region
  const sources = [
    {
      name: "Fabrizio Romano",
      handle: "@FabrizioRomano",
      tier: 1 as const,
      reliability: 0.95,
      region: "GLOBAL" as const,
    },
    {
      name: "David Ornstein",
      handle: "@David_Ornstein",
      tier: 1 as const,
      reliability: 0.93,
      region: "UK" as const,
    },
    {
      name: "Gianluca Di Marzio",
      handle: "@DiMarzio",
      tier: 1 as const,
      reliability: 0.9,
      region: "IT" as const,
    },
    {
      name: "Marca",
      handle: "@marca",
      tier: 2 as const,
      reliability: 0.82,
      region: "ES" as const,
    },
    {
      name: "L'Équipe",
      handle: "@lequipe",
      tier: 2 as const,
      reliability: 0.85,
      region: "FR" as const,
    },
    {
      name: "Sky Sports",
      handle: "@SkySports",
      tier: 2 as const,
      reliability: 0.8,
      region: "UK" as const,
    },
    {
      name: "ESPN Brasil",
      handle: "@ESPNBrasil",
      tier: 2 as const,
      reliability: 0.78,
      region: "BR" as const,
    },
    {
      name: "Bild",
      handle: "@BILD",
      tier: 3 as const,
      reliability: 0.75,
      region: "DE" as const,
    },
  ];

  // Global club coverage
  const clubs = [
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
    "Ajax",
    "PSV",
    "Feyenoord",
  ];

  const players = [
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
  ];

  const leagues = ["PL", "LaLiga", "SerieA", "Bundesliga", "Ligue1", "Other"];
  const transferTypes = [
    "signing",
    "rumour",
    "medical",
    "confirmed",
    "bid",
    "personal_terms",
  ];
  const priorities = ["low", "medium", "high", "breaking"];

  const type = types[index % types.length];
  const source = sources[index % sources.length];
  const club = clubs[Math.floor(Math.random() * clubs.length)];
  const player = players[Math.floor(Math.random() * players.length)];
  const league = leagues[Math.floor(Math.random() * leagues.length)];

  // More realistic transfer content
  const contents = [
    `🚨 BREAKING: ${club} agree €${Math.floor(Math.random() * 100 + 20)}m fee for ${player}! Medical scheduled for tomorrow.`,
    `Personal terms agreed between ${player} and ${club}. Club-to-club negotiations ongoing for final fee structure.`,
    `Sources close to ${player} confirm excitement about potential ${club} move. Agent in advanced discussions.`,
    `${club} officials confident about completing ${player} signing within 48-72 hours.`,
    `Medical planned for ${player} at ${club} training ground this week. Deal 90% complete.`,
    `Payment structure still being negotiated between ${club} and selling club for ${player} transfer.`,
    `${player} has already agreed personal terms with ${club}. Just waiting for clubs to finalize deal.`,
    `Contract details being finalized by legal teams for ${player}'s move to ${club}.`,
    `${club} preparing official announcement for ${player} signing following completed medical.`,
    `CONFIRMED: ${player} joins ${club} on a ${Math.floor(Math.random() * 5 + 2)}-year deal!`,
  ];

  const terryCommentaries = [
    `Right, ${club} spending €${Math.floor(Math.random() * 100 + 20)}m on ${player} is either genius or the most expensive way to disappoint their fanbase.`,
    `The medical's tomorrow which means we'll get 47 updates about ${player} breathing correctly and walking in a straight line.`,
    `Personal terms agreed between ${player} and ${club}, which in football means they've successfully negotiated who pays for the fancy coffee machine.`,
    `${player}'s agent is probably stuck in traffic somewhere questioning whether this profession was worth the stress.`,
    `"48 hours FC" strikes again. In transfer speak, that's anywhere between now and the heat death of the universe.`,
    `${club} are "confident" about signing ${player}. That's the same confidence I have about finding my car keys each morning.`,
    `The medical at ${club}'s training ground will be more scrutinized than a space shuttle launch. Probably take longer too.`,
    `Payment structure negotiations between clubs is just posh blokes arguing about who pays for what while ${player} packs his bags optimistically.`,
    `Contract details being "finalized" is code for "lawyers are about to make this unnecessarily complicated for everyone involved."`,
    `CONFIRMED signings are like unicorns - beautiful when you finally see one, but you'd started doubting they actually existed.`,
  ];

  const attributions = [
    "The Upshot - Football's finest chaos documented",
    "FourFourTwo - Where football history lives",
    "Football Ramble - Weekly mishaps and comedy gold",
    "The Athletic - Deep dives into transfer madness",
  ];

  return {
    id: `feed-item-${index}-${Date.now()}`,
    type,
    timestamp: new Date(Date.now() - Math.random() * 86400000 * 2), // Random time in last 48h
    content: contents[index % contents.length],
    terryCommentary:
      type === "terry" || Math.random() > 0.6
        ? terryCommentaries[index % terryCommentaries.length]
        : undefined,
    source,
    tags: {
      clubs: [club],
      players: [player],
      sources: [source.name],
    },
    media:
      Math.random() > 0.7
        ? {
            type: "image",
            url: `https://picsum.photos/800/400?random=${index}`,
            altText: `${player} during training`,
            thumbnailUrl: `https://picsum.photos/200/120?random=${index}`,
          }
        : undefined,
    engagement: {
      shares: Math.floor(Math.random() * 500),
      reactions: Math.floor(Math.random() * 1500),
      clicks: Math.floor(Math.random() * 2000),
    },
    metadata: {
      transferType: transferTypes[
        Math.floor(Math.random() * transferTypes.length)
      ] as any,
      priority: priorities[
        Math.floor(Math.random() * priorities.length)
      ] as any,
      relevanceScore: Math.random() * 0.4 + 0.6, // 0.6-1.0 range
      league: league as any,
      originalUrl:
        type === "partner" ? `https://example.com/article/${index}` : undefined,
      attribution:
        type === "partner"
          ? attributions[index % attributions.length]
          : undefined,
    },
    isRead: Math.random() > 0.3,
    isNew: Math.random() > 0.8, // 20% chance of being new
  };
};

// Enhanced filter utility function
const applyFilters = (items: FeedItem[], filters: FeedFilters): FeedItem[] => {
  return items.filter((item) => {
    // Tag filtering (supports all tag types)
    if (filters.tags.length > 0) {
      const allItemTags = [
        ...item.tags.clubs.map((tag) => tag.toLowerCase()),
        ...item.tags.players.map((tag) => tag.toLowerCase()),
        ...item.tags.sources.map((tag) => tag.toLowerCase()),
      ];

      const hasMatchingTag = filters.tags.some((filterTag) =>
        allItemTags.includes(filterTag.toLowerCase()),
      );

      if (!hasMatchingTag) return false;
    }

    // Club-specific filtering
    if (filters.clubs && filters.clubs.length > 0) {
      const hasMatchingClub = filters.clubs.some((club) =>
        item.tags.clubs.some((itemClub) =>
          itemClub.toLowerCase().includes(club.toLowerCase()),
        ),
      );
      if (!hasMatchingClub) return false;
    }

    // Player-specific filtering
    if (filters.players && filters.players.length > 0) {
      const hasMatchingPlayer = filters.players.some((player) =>
        item.tags.players.some((itemPlayer) =>
          itemPlayer.toLowerCase().includes(player.toLowerCase()),
        ),
      );
      if (!hasMatchingPlayer) return false;
    }

    // Content type filtering
    if (filters.contentType && filters.contentType.length > 0) {
      if (!filters.contentType.includes(item.type)) return false;
    }

    // Source filtering
    if (filters.sources && filters.sources.length > 0) {
      const hasMatchingSource = filters.sources.some((source) =>
        item.tags.sources.some((itemSource) =>
          itemSource.toLowerCase().includes(source.toLowerCase()),
        ),
      );
      if (!hasMatchingSource) return false;
    }

    // League filtering
    if (filters.leagues && filters.leagues.length > 0) {
      if (
        !item.metadata.league ||
        !filters.leagues.includes(item.metadata.league)
      ) {
        return false;
      }
    }

    // Time range filtering
    if (filters.timeRange) {
      const now = new Date();
      const itemDate = new Date(item.timestamp);

      switch (filters.timeRange) {
        case "today":
          if (itemDate.toDateString() !== now.toDateString()) return false;
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (itemDate < weekAgo) return false;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (itemDate < monthAgo) return false;
          break;
        case "transfer_window":
          // Transfer windows: July 1 - Aug 31, Jan 1 - Jan 31
          const month = now.getMonth() + 1;
          const itemMonth = itemDate.getMonth() + 1;
          const isTransferWindow = (month >= 7 && month <= 8) || month === 1;
          const isItemInWindow =
            (itemMonth >= 7 && itemMonth <= 8) || itemMonth === 1;
          if (!isTransferWindow || !isItemInWindow) return false;
          break;
      }
    }

    // Priority filtering
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(item.metadata.priority)) return false;
    }

    return true;
  });
};

export const useFeedStore = create<FeedState & FeedActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      items: [],
      filteredItems: [],
      hasMore: true,
      isLoading: false,
      isLoadingMore: false,
      lastUpdated: null,
      totalItems: 0,

      // Real-time updates
      isConnected: false,
      pendingUpdates: [],
      unreadCount: 0,

      // Filtering and search
      activeFilters: { tags: [] },
      isFiltering: false,

      // UI state
      scrollPosition: 0,
      selectedItemId: null,
      viewMode: "infinite",

      // Memory management
      memoryUsageMB: 0,
      maxItems: 1000,

      // Error handling
      error: null,
      retryCount: 0,

      // Enhanced data loading actions
      loadItems: async (count: number) => {
        const startTime = performance.now();
        console.log(`[feedStore] loadItems called with count: ${count}`);
        set({ isLoading: true, error: null });

        try {
          const { items, activeFilters } = get();

          // Fetch from real API
          console.log(
            `[feedStore] Fetching from /api/feed?limit=${count}&offset=0`,
          );
          const response = await fetch(`/api/feed?limit=${count}&offset=0`);

          if (!response.ok) {
            throw new Error(`API responded with ${response.status}`);
          }

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error || "Failed to fetch feed data");
          }

          const newItems = data.data || [];
          const memoryMetrics = getMemoryMetrics();
          const currentMemoryMB = memoryMetrics?.usedMB || 0;

          if (memoryMetrics && currentMemoryMB > 90) {
            const status = checkMemoryThresholds(memoryMetrics);
            if (status.shouldCleanup) {
              get().optimizeMemory();
            }
          }

          // Ensure items have proper date objects
          const processedItems = newItems.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }));

          set({
            items: processedItems,
            filteredItems: applyFilters(processedItems, activeFilters),
            hasMore: data.pagination?.hasMore || false,
            totalItems: data.pagination?.total || processedItems.length,
            lastUpdated: new Date(),
            isLoading: false,
            memoryUsageMB: currentMemoryMB,
            retryCount: 0,
          });

          const loadTime = performance.now() - startTime;
          console.log(
            `Loaded ${newItems.length} items from API in ${loadTime.toFixed(2)}ms`,
          );
        } catch (error) {
          console.error("Failed to load feed items:", error);
          set({
            error:
              error instanceof Error ? error.message : "Failed to load items",
            isLoading: false,
          });
        }
      },

      loadMoreItems: async (offset: number) => {
        if (get().isLoadingMore || !get().hasMore) return;

        set({ isLoadingMore: true, error: null });

        try {
          const { items, activeFilters } = get();

          // Fetch more items from API
          const response = await fetch(`/api/feed?limit=20&offset=${offset}`);

          if (!response.ok) {
            throw new Error(`API responded with ${response.status}`);
          }

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error || "Failed to fetch more feed data");
          }

          const newItems = data.data || [];

          // Ensure items have proper date objects
          const processedNewItems = newItems.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }));

          const allItems = [...items, ...processedNewItems];

          set({
            items: allItems,
            filteredItems: applyFilters(allItems, activeFilters),
            hasMore: data.pagination?.hasMore || false,
            totalItems: data.pagination?.total || allItems.length,
            isLoadingMore: false,
            retryCount: 0,
          });

          console.log(`Loaded ${newItems.length} more items from API`);
        } catch (error) {
          console.error("Failed to load more feed items:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to load more items",
            isLoadingMore: false,
          });
        }
      },

      refreshFeed: async () => {
        const { loadItems } = get();
        set({ items: [], filteredItems: [] });
        await loadItems(50);
      },

      // Enhanced real-time update actions
      addItem: (newItem: FeedItem) => {
        const { items, activeFilters, pendingUpdates, maxItems } = get();

        // Check if item already exists
        const exists = items.some((item) => item.id === newItem.id);
        if (exists) return;

        // Mark as new and add to pending updates
        const itemWithNewFlag = { ...newItem, isNew: true };
        const updatedPendingUpdates = [itemWithNewFlag, ...pendingUpdates];

        // Add to main feed (insert at beginning for recency)
        let updatedItems = [itemWithNewFlag, ...items];
        if (updatedItems.length > maxItems) {
          updatedItems = updatedItems.slice(0, maxItems);
        }

        const memoryMetrics = getMemoryMetrics();
        const currentMemoryMB = memoryMetrics?.usedMB || 0;

        set({
          items: updatedItems,
          filteredItems: applyFilters(updatedItems, activeFilters),
          pendingUpdates: updatedPendingUpdates,
          unreadCount: get().unreadCount + 1,
          lastUpdated: new Date(),
          memoryUsageMB: currentMemoryMB,
        });
      },

      markUpdatesAsRead: () => {
        const { items } = get();
        const updatedItems = items.map((item) => ({
          ...item,
          isNew: false,
          isRead: true,
        }));

        set({
          items: updatedItems,
          filteredItems: applyFilters(updatedItems, get().activeFilters),
          pendingUpdates: [],
          unreadCount: 0,
        });
      },

      setConnectionStatus: (connected: boolean) => {
        set({ isConnected: connected });
      },

      // Enhanced filtering actions
      setFilter: (tag: string) => {
        const { activeFilters } = get();
        const newTags = activeFilters.tags.includes(tag)
          ? activeFilters.tags.filter((f) => f !== tag)
          : [...activeFilters.tags, tag];

        const updatedFilters = { ...activeFilters, tags: newTags };
        const { items } = get();

        set({
          activeFilters: updatedFilters,
          filteredItems: applyFilters(items, updatedFilters),
          isFiltering: Object.values(updatedFilters).some((value) =>
            Array.isArray(value) ? value.length > 0 : value !== undefined,
          ),
        });
      },

      setActiveFilters: (newFilters: Partial<FeedFilters>) => {
        const updatedFilters = { ...get().activeFilters, ...newFilters };
        const { items } = get();

        set({
          activeFilters: updatedFilters,
          filteredItems: applyFilters(items, updatedFilters),
          isFiltering: Object.values(updatedFilters).some((value) =>
            Array.isArray(value) ? value.length > 0 : value !== undefined,
          ),
        });
      },

      clearFilters: () => {
        const defaultFilters: FeedFilters = { tags: [] };
        const { items } = get();

        set({
          activeFilters: defaultFilters,
          filteredItems: items,
          isFiltering: false,
        });
      },

      addTagFilter: (tag: string, type?: "club" | "player" | "source") => {
        const { activeFilters } = get();

        if (type === "club") {
          const updatedFilters = {
            ...activeFilters,
            clubs: [...(activeFilters.clubs || []), tag],
          };
          get().setActiveFilters(updatedFilters);
        } else if (type === "player") {
          const updatedFilters = {
            ...activeFilters,
            players: [...(activeFilters.players || []), tag],
          };
          get().setActiveFilters(updatedFilters);
        } else if (type === "source") {
          const updatedFilters = {
            ...activeFilters,
            sources: [...(activeFilters.sources || []), tag],
          };
          get().setActiveFilters(updatedFilters);
        } else {
          // Default to general tags
          if (!activeFilters.tags.includes(tag)) {
            const updatedFilters = {
              ...activeFilters,
              tags: [...activeFilters.tags, tag],
            };
            get().setActiveFilters(updatedFilters);
          }
        }
      },

      removeTagFilter: (tag: string) => {
        const { activeFilters } = get();
        const updatedFilters = {
          ...activeFilters,
          tags: activeFilters.tags.filter((t) => t !== tag),
          clubs: activeFilters.clubs?.filter((c) => c !== tag) || [],
          players: activeFilters.players?.filter((p) => p !== tag) || [],
          sources: activeFilters.sources?.filter((s) => s !== tag) || [],
        };

        get().setActiveFilters(updatedFilters);
      },

      applyFilters: () => {
        const { items, activeFilters } = get();
        set({
          filteredItems: applyFilters(items, activeFilters),
          isFiltering: Object.values(activeFilters).some((value) =>
            Array.isArray(value) ? value.length > 0 : value !== undefined,
          ),
        });
      },

      // Enhanced UI interaction actions
      setScrollPosition: (position: number) => {
        set({ scrollPosition: position });
      },

      setSelectedItem: (itemId: string | null) => {
        set({ selectedItemId: itemId });
      },

      setViewMode: (mode: "infinite" | "paginated") => {
        set({ viewMode: mode });
      },

      // Enhanced analytics and discovery
      getTrendingTags: (limit: number) => {
        const { items } = get();
        const tagCounts = new Map<string, number>();

        items.forEach((item) => {
          [
            ...item.tags.clubs,
            ...item.tags.players,
            ...item.tags.sources,
          ].forEach((tag) => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          });
        });

        return Array.from(tagCounts.entries())
          .sort(([, a], [, b]) => b - a)
          .slice(0, limit)
          .map(([tag]) => tag);
      },

      getRelatedTags: (tag: string) => {
        const { items } = get();
        const relatedTags = new Map<string, number>();

        // Find items that contain the given tag
        const relatedItems = items.filter((item) =>
          [...item.tags.clubs, ...item.tags.players, ...item.tags.sources].some(
            (itemTag) => itemTag.toLowerCase().includes(tag.toLowerCase()),
          ),
        );

        // Count other tags that appear with the given tag
        relatedItems.forEach((item) => {
          [
            ...item.tags.clubs,
            ...item.tags.players,
            ...item.tags.sources,
          ].forEach((relatedTag) => {
            if (relatedTag.toLowerCase() !== tag.toLowerCase()) {
              relatedTags.set(
                relatedTag,
                (relatedTags.get(relatedTag) || 0) + 1,
              );
            }
          });
        });

        return Array.from(relatedTags.entries())
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([relatedTag]) => relatedTag);
      },

      trackEngagement: (
        itemId: string,
        action: "click" | "share" | "react",
      ) => {
        const { items } = get();
        const updatedItems = items.map((item) => {
          if (item.id === itemId && item.engagement) {
            const updatedEngagement = { ...item.engagement };

            switch (action) {
              case "click":
                updatedEngagement.clicks += 1;
                break;
              case "share":
                updatedEngagement.shares += 1;
                break;
              case "react":
                updatedEngagement.reactions += 1;
                break;
            }

            return { ...item, engagement: updatedEngagement };
          }
          return item;
        });

        set({
          items: updatedItems,
          filteredItems: applyFilters(updatedItems, get().activeFilters),
        });
      },

      // Enhanced memory and performance actions
      optimizeMemory: () => {
        const { items, maxItems, activeFilters } = get();

        const safeItemCount = Math.floor(maxItems * 0.8);

        if (items.length > safeItemCount) {
          const optimizedItems = items.slice(0, safeItemCount);

          if (typeof window !== "undefined" && (window as any).gc) {
            try {
              (window as any).gc();
            } catch (e) {
              // Ignore GC errors
            }
          }

          const memoryMetrics = getMemoryMetrics();
          const currentMemoryMB = memoryMetrics?.usedMB || 0;

          set({
            items: optimizedItems,
            filteredItems: applyFilters(optimizedItems, activeFilters),
            memoryUsageMB: currentMemoryMB,
          });

          console.log(
            `Memory optimization: Reduced items from ${items.length} to ${optimizedItems.length}`,
          );
        }
      },

      getMemoryStats: () => {
        const { items, memoryUsageMB } = get();
        const totalSize = items.reduce(
          (acc, item) => acc + MemoryOptimizer.estimateObjectSize(item),
          0,
        );
        const avgItemSize = items.length > 0 ? totalSize / items.length : 0;

        return {
          usageMB: memoryUsageMB,
          itemCount: items.length,
          avgItemSize: Math.round(avgItemSize),
        };
      },

      // Enhanced error handling actions
      setError: (error: string | null) => {
        set({ error });
      },

      incrementRetryCount: () => {
        set({ retryCount: get().retryCount + 1 });
      },

      resetRetryCount: () => {
        set({ retryCount: 0 });
      },
    })),
    {
      name: "transfer-juice-feed",
    },
  ),
);

// Performance-optimized selectors
export const selectFilteredItems = (state: FeedState) => state.filteredItems;
export const selectIsLoading = (state: FeedState) => state.isLoading;
export const selectIsLoadingMore = (state: FeedState) => state.isLoadingMore;
export const selectHasUnreadUpdates = (state: FeedState) =>
  state.unreadCount > 0;
export const selectActiveFilters = (state: FeedState) => state.activeFilters;
export const selectConnectionStatus = (state: FeedState) => state.isConnected;
export const selectIsFiltering = (state: FeedState) => state.isFiltering;
export const selectTotalItems = (state: FeedState) => state.totalItems;
export const selectHasMore = (state: FeedState) => state.hasMore;
export const selectError = (state: FeedState) => state.error;
export const selectLastUpdated = (state: FeedState) => state.lastUpdated;
export const selectScrollPosition = (state: FeedState) => state.scrollPosition;
export const selectSelectedItem = (state: FeedState) => state.selectedItemId;
export const selectViewMode = (state: FeedState) => state.viewMode;
export const selectUnreadCount = (state: FeedState) => state.unreadCount;
export const selectMemoryStats = (state: FeedState) => ({
  usageMB: state.memoryUsageMB,
  itemCount: state.items.length,
  maxItems: state.maxItems,
});

// Compound selectors for common use cases
export const selectFeedStatus = (state: FeedState) => ({
  isLoading: state.isLoading,
  isLoadingMore: state.isLoadingMore,
  hasMore: state.hasMore,
  error: state.error,
  isConnected: state.isConnected,
});

export const selectFilterStatus = (state: FeedState) => ({
  activeFilters: state.activeFilters,
  isFiltering: state.isFiltering,
  filteredCount: state.filteredItems.length,
  totalCount: state.items.length,
});

export const selectRealtimeStatus = (state: FeedState) => ({
  isConnected: state.isConnected,
  unreadCount: state.unreadCount,
  pendingUpdates: state.pendingUpdates.length,
  lastUpdated: state.lastUpdated,
});

// Partner content selectors
export const selectPartnerContent = (state: FeedState) => ({
  partnerItems: state.items.filter((item) => item.type === "partner"),
  partnerCount: state.items.filter((item) => item.type === "partner").length,
  partnerRatio:
    state.items.length > 0
      ? state.items.filter((item) => item.type === "partner").length /
        state.items.length
      : 0,
});

// Memory optimization hook
export function useMemoryOptimization() {
  const { optimizeMemory, getMemoryStats } = useFeedStore();

  return {
    optimizeMemory,
    getMemoryStats,
  };
}

// Partner content integration hook
export function usePartnerContentIntegration() {
  const { items, addItem } = useFeedStore();

  const getPartnerContentRatio = () => {
    const partnerCount = items.filter((item) => item.type === "partner").length;
    return items.length > 0 ? partnerCount / items.length : 0;
  };

  const getRecentPartnerContent = (hours: number = 24) => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return items.filter(
      (item) => item.type === "partner" && new Date(item.timestamp) >= cutoff,
    );
  };

  const addPartnerContent = (partnerItem: FeedItem) => {
    if (partnerItem.type !== "partner") {
      console.warn(
        "Attempted to add non-partner content via partner integration",
      );
      return;
    }
    addItem(partnerItem);
  };

  return {
    getPartnerContentRatio,
    getRecentPartnerContent,
    addPartnerContent,
    partnerContentCount: items.filter((item) => item.type === "partner").length,
  };
}
