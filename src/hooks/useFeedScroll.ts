import { useCallback, useState, useRef, useEffect } from "react";
import { useFeedStore } from "@/lib/stores/feedStore";

interface UseFeedScrollOptions {
  hasMore?: boolean;
  loadItems?: (count: number) => Promise<void>;
  threshold?: number; // Distance from bottom to trigger load more (in pixels)
  rootMargin?: string; // Root margin for intersection observer
  enabled?: boolean; // Whether infinite scroll is enabled
  onScrollPositionChange?: (position: number) => void;
}

interface UseFeedScrollReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  sentinelRef: React.RefObject<HTMLDivElement>;
  loadMore: () => Promise<void>;
  isLoadingMore: boolean;
  isNearBottom: boolean;
  scrollToTop: () => void;
  scrollToPosition: (position: number) => void;
  scrollMetrics: {
    lastScrollTime: number;
    scrollVelocity: number;
    isSmooth: boolean;
  };
  updateScrollMetrics: (position: number, velocity: number) => void;
}

export function useFeedScroll({
  hasMore: propHasMore,
  loadItems: propLoadItems,
  threshold = 1000,
  rootMargin = "200px",
  enabled = true,
  onScrollPositionChange,
}: UseFeedScrollOptions = {}): UseFeedScrollReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(false);

  // Get from store if not provided as props
  const {
    loadMoreItems: storeLoadMoreItems,
    setScrollPosition,
    isLoadingMore: storeIsLoadingMore,
    hasMore: storeHasMore,
    filteredItems,
    scrollPosition: storedScrollPosition,
  } = useFeedStore();

  // Use props or fallback to store values
  const hasMore = propHasMore ?? storeHasMore;
  const loadItems = propLoadItems ?? storeLoadMoreItems;
  const isLoadingMore = storeIsLoadingMore;

  const scrollMetricsRef = useRef({
    lastScrollTime: 0,
    scrollVelocity: 0,
    isSmooth: true,
    lastScrollPosition: 0,
    frameDropCount: 0,
  });

  // Mobile-specific performance monitoring
  useEffect(() => {
    let rafId: number;
    let lastFrameTime = performance.now();

    const monitorPerformance = () => {
      const now = performance.now();
      const frameDelta = now - lastFrameTime;

      // Detect frame drops (60fps = 16.67ms per frame)
      if (frameDelta > 32) {
        // More than 2 frames dropped
        scrollMetricsRef.current.frameDropCount++;
        scrollMetricsRef.current.isSmooth =
          scrollMetricsRef.current.frameDropCount < 5;
      }

      lastFrameTime = now;
      rafId = requestAnimationFrame(monitorPerformance);
    };

    // Start monitoring on mobile devices
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
      rafId = requestAnimationFrame(monitorPerformance);
    }

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!enabled || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      {
        rootMargin,
        threshold: 0.1,
      },
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [enabled, hasMore, isLoadingMore, rootMargin]);

  // Handle scroll position tracking and near-bottom detection
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Calculate how close we are to the bottom
    const scrollBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = scrollBottom < threshold;

    setIsNearBottom(nearBottom);

    // Update scroll position in store for persistence
    setScrollPosition(scrollTop);

    // Call external scroll position handler
    onScrollPositionChange?.(scrollTop);

    // Calculate velocity for performance tracking
    const now = performance.now();
    const timeDelta = now - scrollMetricsRef.current.lastScrollTime;
    const positionDelta = Math.abs(
      scrollTop - scrollMetricsRef.current.lastScrollPosition,
    );
    const velocity = timeDelta > 0 ? positionDelta / timeDelta : 0;

    updateScrollMetrics(scrollTop, velocity);
  }, [threshold, setScrollPosition, onScrollPositionChange]);

  // Debounced load more for smooth mobile scrolling
  const loadMoreRef = useRef<NodeJS.Timeout>();

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !enabled) {
      return;
    }

    // Clear any pending load more calls
    if (loadMoreRef.current) {
      clearTimeout(loadMoreRef.current);
    }

    // On mobile, add slight delay to prevent janky loading during fast scrolls
    const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const delay =
      isMobile && scrollMetricsRef.current.scrollVelocity > 100 ? 100 : 0;

    loadMoreRef.current = setTimeout(async () => {
      try {
        const startTime = performance.now();

        // Smaller batch size on mobile for smoother loading
        const batchSize = isMobile ? 25 : 50;

        if (propLoadItems) {
          await propLoadItems(batchSize);
        } else {
          await loadItems(filteredItems.length);
        }

        const loadTime = performance.now() - startTime;

        // Track loading performance
        const isLoadingSlow = loadTime > (isMobile ? 500 : 1000);
        if (isLoadingSlow) {
          console.warn(
            `Mobile scroll loading slower than optimal: ${loadTime.toFixed(2)}ms`,
          );
        }

        console.log(
          `Infinite scroll loaded ${batchSize} items in ${loadTime.toFixed(2)}ms (mobile: ${isMobile})`,
        );
      } catch (error) {
        console.error("Failed to load more items:", error);
      }
    }, delay);
  }, [
    hasMore,
    isLoadingMore,
    enabled,
    loadItems,
    filteredItems.length,
    propLoadItems,
  ]);

  // Attach scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll, enabled]);

  // Restore scroll position on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (storedScrollPosition > 0) {
      // Use setTimeout to ensure content is rendered
      setTimeout(() => {
        container.scrollTop = storedScrollPosition;
      }, 100);
    }
  }, [storedScrollPosition]);

  // Utility functions
  const scrollToTop = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    setScrollPosition(0);
  }, [setScrollPosition]);

  const scrollToPosition = useCallback(
    (position: number) => {
      const container = containerRef.current;
      if (!container) return;

      container.scrollTo({
        top: position,
        behavior: "smooth",
      });

      setScrollPosition(position);
    },
    [setScrollPosition],
  );

  // Update scroll metrics for performance tracking
  const updateScrollMetrics = useCallback(
    (position: number, velocity: number) => {
      const now = performance.now();
      scrollMetricsRef.current = {
        ...scrollMetricsRef.current,
        lastScrollTime: now,
        scrollVelocity: velocity,
        lastScrollPosition: position,
      };
    },
    [],
  );

  return {
    containerRef,
    sentinelRef,
    loadMore,
    isLoadingMore,
    isNearBottom,
    scrollToTop,
    scrollToPosition,
    scrollMetrics: {
      lastScrollTime: scrollMetricsRef.current.lastScrollTime,
      scrollVelocity: scrollMetricsRef.current.scrollVelocity,
      isSmooth: scrollMetricsRef.current.isSmooth,
    },
    updateScrollMetrics,
  };
}

// Hook for managing feed scroll behavior with memory optimization
export const useMemoryOptimizedScroll = (
  options: UseFeedScrollOptions = {},
) => {
  const { getMemoryStats, optimizeMemory } = useFeedStore();
  const scroll = useFeedScroll(options);

  // Monitor memory usage and trigger optimization if needed
  useEffect(() => {
    const checkMemory = () => {
      const stats = getMemoryStats();

      // If memory usage is high or we have too many items, optimize
      if (stats.usageMB > 150 || stats.itemCount > 800) {
        console.log("Memory threshold reached, optimizing...", stats);
        optimizeMemory();
      }
    };

    // Check memory every 30 seconds during active scrolling
    const interval = setInterval(checkMemory, 30000);

    return () => clearInterval(interval);
  }, [getMemoryStats, optimizeMemory]);

  return scroll;
};

// Hook for scroll restoration (useful for navigation back/forward)
export const useScrollRestoration = () => {
  const { scrollPosition, setScrollPosition } = useFeedStore();

  const saveScrollPosition = useCallback(() => {
    if (typeof window === "undefined") return;

    const scrollY = window.scrollY || document.documentElement.scrollTop;
    setScrollPosition(scrollY);
  }, [setScrollPosition]);

  const restoreScrollPosition = useCallback(() => {
    if (typeof window === "undefined") return;

    if (scrollPosition > 0) {
      window.scrollTo(0, scrollPosition);
    }
  }, [scrollPosition]);

  // Save scroll position before page unload
  useEffect(() => {
    window.addEventListener("beforeunload", saveScrollPosition);
    return () => window.removeEventListener("beforeunload", saveScrollPosition);
  }, [saveScrollPosition]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    currentPosition: scrollPosition,
  };
};
