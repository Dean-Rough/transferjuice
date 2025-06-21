import { useEffect, useRef, useCallback } from 'react';
import {
  MemoryMonitor,
  getMemoryMetrics,
  checkMemoryThresholds,
  DEFAULT_THRESHOLDS,
  type MemoryMetrics,
  type MemoryThresholds,
} from '@/lib/performance/memoryMonitor';
import { useFeedStore } from '@/lib/stores/feedStore';

interface UseMemoryOptimizationOptions {
  thresholds?: MemoryThresholds;
  monitoringInterval?: number;
  autoOptimize?: boolean;
  enableLogging?: boolean;
}

interface MemoryOptimizationState {
  currentUsage: MemoryMetrics | null;
  isOptimizing: boolean;
  lastOptimization: Date | null;
  optimizationCount: number;
  memoryHistory: Array<{ timestamp: Date; usageMB: number }>;
}

export function useMemoryOptimization(
  options: UseMemoryOptimizationOptions = {}
) {
  const {
    thresholds = DEFAULT_THRESHOLDS,
    monitoringInterval = 5000,
    autoOptimize = true,
    enableLogging = true,
  } = options;

  const monitorRef = useRef<MemoryMonitor | null>(null);
  const { optimizeMemory, getMemoryStats } = useFeedStore();

  const stateRef = useRef<MemoryOptimizationState>({
    currentUsage: null,
    isOptimizing: false,
    lastOptimization: null,
    optimizationCount: 0,
    memoryHistory: [],
  });

  // Initialize memory monitor
  useEffect(() => {
    if (!monitorRef.current) {
      monitorRef.current = new MemoryMonitor(thresholds);
    }

    const monitor = monitorRef.current;

    const unsubscribe = monitor.onUpdate((metrics) => {
      const state = stateRef.current;
      state.currentUsage = metrics;

      // Add to history (keep last 20 measurements)
      state.memoryHistory.push({
        timestamp: new Date(),
        usageMB: metrics.usedMB,
      });
      if (state.memoryHistory.length > 20) {
        state.memoryHistory.shift();
      }

      const status = checkMemoryThresholds(metrics, thresholds);

      if (
        enableLogging &&
        (status.level === 'warning' ||
          status.level === 'critical' ||
          status.level === 'exceeded')
      ) {
        console.log(`Memory Monitor: ${status.message}`, {
          usedMB: metrics.usedMB,
          percentUsed: metrics.percentUsed,
          feedStats: getMemoryStats(),
        });
      }

      // Auto-optimize if enabled and memory usage is critical
      if (autoOptimize && status.shouldCleanup && !state.isOptimizing) {
        performOptimization();
      }
    });

    monitor.start(monitoringInterval);

    return () => {
      unsubscribe();
      monitor.stop();
    };
  }, [
    thresholds,
    monitoringInterval,
    autoOptimize,
    enableLogging,
    optimizeMemory,
    getMemoryStats,
  ]);

  const performOptimization = useCallback(async () => {
    const state = stateRef.current;

    if (state.isOptimizing) {
      return; // Already optimizing
    }

    state.isOptimizing = true;
    const startTime = performance.now();
    const beforeMetrics = getMemoryMetrics();

    try {
      // Perform store optimization
      optimizeMemory();

      // Allow time for garbage collection
      await new Promise((resolve) => setTimeout(resolve, 100));

      const afterMetrics = getMemoryMetrics();
      const endTime = performance.now();

      state.lastOptimization = new Date();
      state.optimizationCount++;

      if (enableLogging && beforeMetrics && afterMetrics) {
        const memoryFreed = beforeMetrics.usedMB - afterMetrics.usedMB;
        console.log(
          `Memory optimization completed in ${(endTime - startTime).toFixed(2)}ms`,
          {
            before: `${beforeMetrics.usedMB}MB`,
            after: `${afterMetrics.usedMB}MB`,
            freed: `${memoryFreed.toFixed(2)}MB`,
            optimizationCount: state.optimizationCount,
          }
        );
      }
    } catch (error) {
      console.error('Memory optimization failed:', error);
    } finally {
      state.isOptimizing = false;
    }
  }, [optimizeMemory, enableLogging]);

  const forceOptimization = useCallback(() => {
    performOptimization();
  }, [performOptimization]);

  const getMemoryReport = useCallback(() => {
    const state = stateRef.current;
    const feedStats = getMemoryStats();

    return {
      current: state.currentUsage,
      isOptimizing: state.isOptimizing,
      lastOptimization: state.lastOptimization,
      optimizationCount: state.optimizationCount,
      feedStats,
      history: state.memoryHistory.slice(),
      thresholds,
      recommendations: generateRecommendations(
        state.currentUsage,
        thresholds,
        feedStats
      ),
    };
  }, [getMemoryStats, thresholds]);

  const isMemoryHealthy = useCallback(() => {
    const metrics = stateRef.current.currentUsage;
    if (!metrics) return true;

    const status = checkMemoryThresholds(metrics, thresholds);
    return status.level === 'safe';
  }, [thresholds]);

  const getMemoryTrend = useCallback(() => {
    const history = stateRef.current.memoryHistory;
    if (history.length < 2) return 'stable';

    const recent = history.slice(-5);
    const trend = recent[recent.length - 1].usageMB - recent[0].usageMB;

    if (trend > 5) return 'increasing';
    if (trend < -5) return 'decreasing';
    return 'stable';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitorRef.current) {
        monitorRef.current.stop();
      }
    };
  }, []);

  return {
    // State accessors
    getCurrentUsage: () => stateRef.current.currentUsage,
    isOptimizing: () => stateRef.current.isOptimizing,
    getOptimizationCount: () => stateRef.current.optimizationCount,
    getLastOptimization: () => stateRef.current.lastOptimization,

    // Actions
    forceOptimization,
    getMemoryReport,
    isMemoryHealthy,
    getMemoryTrend,

    // Monitor control
    startMonitoring: () => monitorRef.current?.start(monitoringInterval),
    stopMonitoring: () => monitorRef.current?.stop(),
  };
}

function generateRecommendations(
  metrics: MemoryMetrics | null,
  thresholds: MemoryThresholds,
  feedStats: { usageMB: number; itemCount: number; avgItemSize: number }
): string[] {
  const recommendations: string[] = [];

  if (!metrics) {
    recommendations.push('Memory monitoring not available in this browser');
    return recommendations;
  }

  const status = checkMemoryThresholds(metrics, thresholds);

  if (status.level === 'exceeded' || status.level === 'critical') {
    recommendations.push('Consider reducing the number of feed items loaded');
    recommendations.push('Clear filters to reduce memory usage');
    recommendations.push('Refresh the page to reset memory state');
  }

  if (status.level === 'warning') {
    recommendations.push('Monitor memory usage closely');
    recommendations.push('Avoid opening many browser tabs');
  }

  if (feedStats.itemCount > 800) {
    recommendations.push(
      `High item count (${feedStats.itemCount}). Consider pagination.`
    );
  }

  if (feedStats.avgItemSize > 2000) {
    recommendations.push(
      `Large average item size (${feedStats.avgItemSize} bytes). Consider data compression.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('Memory usage is healthy');
  }

  return recommendations;
}
