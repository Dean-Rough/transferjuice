/**
 * Memory monitoring and optimization utilities for feed performance
 */

export interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedMB: number;
  totalMB: number;
  limitMB: number;
  percentUsed: number;
}

export interface MemoryThresholds {
  warning: number; // MB
  critical: number; // MB
  maximum: number; // MB for 1000+ items requirement
}

export const DEFAULT_THRESHOLDS: MemoryThresholds = {
  warning: 75, // 75MB warning
  critical: 90, // 90MB critical
  maximum: 100, // 100MB hard limit
};

/**
 * Get current memory usage metrics
 */
export function getMemoryMetrics(): MemoryMetrics | null {
  if (typeof window === "undefined" || !("performance" in window)) {
    return null;
  }

  const memory = (performance as any).memory;
  if (!memory) {
    return null;
  }

  const usedMB = Math.round((memory.usedJSHeapSize / 1024 / 1024) * 100) / 100;
  const totalMB =
    Math.round((memory.totalJSHeapSize / 1024 / 1024) * 100) / 100;
  const limitMB =
    Math.round((memory.jsHeapSizeLimit / 1024 / 1024) * 100) / 100;
  const percentUsed =
    Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100 * 100) /
    100;

  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usedMB,
    totalMB,
    limitMB,
    percentUsed,
  };
}

/**
 * Check if memory usage exceeds thresholds
 */
export function checkMemoryThresholds(
  metrics: MemoryMetrics,
  thresholds: MemoryThresholds = DEFAULT_THRESHOLDS,
): {
  level: "safe" | "warning" | "critical" | "exceeded";
  message: string;
  shouldCleanup: boolean;
} {
  const { usedMB } = metrics;

  if (usedMB >= thresholds.maximum) {
    return {
      level: "exceeded",
      message: `Memory usage (${usedMB}MB) exceeds maximum threshold (${thresholds.maximum}MB)`,
      shouldCleanup: true,
    };
  }

  if (usedMB >= thresholds.critical) {
    return {
      level: "critical",
      message: `Memory usage (${usedMB}MB) is at critical level (${thresholds.critical}MB+)`,
      shouldCleanup: true,
    };
  }

  if (usedMB >= thresholds.warning) {
    return {
      level: "warning",
      message: `Memory usage (${usedMB}MB) approaching warning level (${thresholds.warning}MB+)`,
      shouldCleanup: false,
    };
  }

  return {
    level: "safe",
    message: `Memory usage (${usedMB}MB) is within safe limits`,
    shouldCleanup: false,
  };
}

/**
 * Memory monitoring hook for continuous tracking
 */
export class MemoryMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: ((metrics: MemoryMetrics) => void)[] = [];
  private thresholds: MemoryThresholds;

  constructor(thresholds: MemoryThresholds = DEFAULT_THRESHOLDS) {
    this.thresholds = thresholds;
  }

  /**
   * Start monitoring memory usage
   */
  start(intervalMs: number = 5000): void {
    if (this.intervalId) {
      this.stop();
    }

    this.intervalId = setInterval(() => {
      const metrics = getMemoryMetrics();
      if (metrics) {
        this.callbacks.forEach((callback) => callback(metrics));

        const status = checkMemoryThresholds(metrics, this.thresholds);
        if (status.level === "critical" || status.level === "exceeded") {
          console.warn(`Memory Monitor: ${status.message}`);
        }
      }
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Add callback for memory updates
   */
  onUpdate(callback: (metrics: MemoryMetrics) => void): () => void {
    this.callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get current memory snapshot
   */
  getSnapshot(): MemoryMetrics | null {
    return getMemoryMetrics();
  }

  /**
   * Force garbage collection if available (dev mode)
   */
  forceGarbageCollection(): void {
    if (typeof window !== "undefined" && (window as any).gc) {
      try {
        (window as any).gc();
        console.log("Manual garbage collection triggered");
      } catch (error) {
        console.warn("Failed to trigger garbage collection:", error);
      }
    }
  }
}

/**
 * Memory optimization utilities
 */
export const MemoryOptimizer = {
  /**
   * Optimize object for memory by removing unnecessary properties
   */
  optimizeObject<T extends Record<string, any>>(
    obj: T,
    keepKeys: (keyof T)[],
  ): Partial<T> {
    const optimized: Partial<T> = {};
    keepKeys.forEach((key) => {
      if (key in obj) {
        optimized[key] = obj[key];
      }
    });
    return optimized;
  },

  /**
   * Deep freeze object to prevent memory leaks from references
   */
  deepFreeze<T>(obj: T, visited = new WeakSet()): T {
    // Prevent infinite recursion with circular references
    if (visited.has(obj as any)) {
      return obj;
    }
    visited.add(obj as any);

    Object.getOwnPropertyNames(obj).forEach((prop) => {
      const value = (obj as any)[prop];
      if (value && typeof value === "object") {
        this.deepFreeze(value, visited);
      }
    });
    return Object.freeze(obj);
  },

  /**
   * Create memory-efficient array with maximum size
   */
  createBoundedArray<T>(maxSize: number): {
    items: T[];
    add: (item: T) => void;
    size: () => number;
    clear: () => void;
    getMemoryUsage: () => number;
  } {
    let items: T[] = [];

    return {
      get items() {
        return items;
      },

      add(item: T) {
        items.unshift(item);
        if (items.length > maxSize) {
          items = items.slice(0, maxSize);
        }
      },

      size() {
        return items.length;
      },

      clear() {
        items = [];
      },

      getMemoryUsage() {
        return JSON.stringify(items).length;
      },
    };
  },

  /**
   * Estimate object size in bytes
   */
  estimateObjectSize(obj: any): number {
    try {
      return JSON.stringify(obj).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 0;
    }
  },
};

/**
 * React hook for memory monitoring
 */
export function useMemoryMonitor(
  thresholds: MemoryThresholds = DEFAULT_THRESHOLDS,
  intervalMs: number = 5000,
): {
  metrics: MemoryMetrics | null;
  status: ReturnType<typeof checkMemoryThresholds> | null;
  monitor: MemoryMonitor;
} {
  const [metrics, setMetrics] = React.useState<MemoryMetrics | null>(null);
  const [status, setStatus] = React.useState<ReturnType<
    typeof checkMemoryThresholds
  > | null>(null);
  const [monitor] = React.useState(() => new MemoryMonitor(thresholds));

  React.useEffect(() => {
    const unsubscribe = monitor.onUpdate((newMetrics) => {
      setMetrics(newMetrics);
      setStatus(checkMemoryThresholds(newMetrics, thresholds));
    });

    monitor.start(intervalMs);

    return () => {
      unsubscribe();
      monitor.stop();
    };
  }, [monitor, thresholds, intervalMs]);

  return { metrics, status, monitor };
}

// Add React import for the hook
import React from "react";
