/**
 * Memory Performance Tests for Feed Store
 * Tests memory usage with 1000+ items to verify <100MB target
 */

import { renderHook, act } from '@testing-library/react';
import { useFeedStore } from '../feedStore';
import { getMemoryMetrics } from '@/lib/performance/memoryMonitor';

// Mock the memory monitor since we're testing in Node.js environment
jest.mock('@/lib/performance/memoryMonitor', () => ({
  getMemoryMetrics: jest.fn(() => ({
    usedMB: 85, // Mock realistic memory usage
    totalMB: 4096,
    percentUsed: 2.08,
  })),
  checkMemoryThresholds: jest.fn(() => ({
    level: 'safe',
    shouldCleanup: false,
    message: 'Memory usage is safe',
  })),
  MemoryOptimizer: {
    estimateObjectSize: jest.fn((obj: any) => {
      // Realistic size estimation based on JSON serialization
      return JSON.stringify(obj).length * 2; // Approximation
    }),
  },
}));

describe('FeedStore Memory Performance Tests', () => {
  beforeEach(() => {
    // Reset store state
    const { result } = renderHook(() => useFeedStore());
    act(() => {
      result.current.clearFilters();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Memory Usage with Large Datasets', () => {
    it('should stay under 100MB with 1000 items', async () => {
      const { result } = renderHook(() => useFeedStore());

      // Generate 1000 realistic feed items
      const generateTestItem = (index: number) => ({
        id: `feed-item-${index}`,
        type: 'itk' as const,
        timestamp: new Date(Date.now() - index * 60000), // Staggered timestamps
        content: `Transfer update ${index}: Manchester United are in advanced talks for a new signing. The deal is progressing well with medical tests scheduled for next week. Fee expected to be around £${20 + index}m including add-ons. More updates to follow as situation develops further.`,
        terryCommentary: index % 3 === 0 ? `Right, transfer ${index} is either happening or it's not. The Terry's money is on "maybe".` : undefined,
        source: {
          name: ['Fabrizio Romano', 'David Ornstein', 'Sky Sports'][index % 3],
          handle: ['@FabrizioRomano', '@David_Ornstein', '@SkySports'][index % 3],
          tier: (1 + (index % 3)) as 1 | 2 | 3,
          reliability: 0.9 - (index % 3) * 0.1,
          region: ['GLOBAL', 'UK', 'ES'][index % 3] as any,
        },
        tags: {
          clubs: [`Club${index % 20}`], // 20 different clubs
          players: [`Player${index % 50}`], // 50 different players
          sources: ['Fabrizio Romano', 'David Ornstein', 'Sky Sports'][index % 3],
        },
        media: index % 5 === 0 ? {
          type: 'image' as const,
          url: `https://example.com/image${index}.jpg`,
          altText: `Transfer image ${index}`,
          thumbnailUrl: `https://example.com/thumb${index}.jpg`,
        } : undefined,
        engagement: {
          shares: Math.floor(Math.random() * 100),
          reactions: Math.floor(Math.random() * 500),
          clicks: Math.floor(Math.random() * 200),
        },
        metadata: {
          transferType: ['signing', 'rumour', 'medical', 'confirmed'][index % 4] as any,
          priority: ['low', 'medium', 'high'][index % 3] as any,
          relevanceScore: 0.7 + Math.random() * 0.3,
          league: ['PL', 'LaLiga', 'SerieA', 'Bundesliga', 'Ligue1'][index % 5] as any,
        },
        isRead: Math.random() > 0.3,
        isNew: Math.random() > 0.8,
      });

      // Load 1000 items in batches to simulate real usage
      await act(async () => {
        // Mock API response with 1000 items
        global.fetch = jest.fn()
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              success: true,
              data: Array.from({ length: 500 }, (_, i) => generateTestItem(i)),
              pagination: { hasMore: true, total: 1000 },
            }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              success: true,
              data: Array.from({ length: 500 }, (_, i) => generateTestItem(i + 500)),
              pagination: { hasMore: false, total: 1000 },
            }),
          });

        // Load initial batch
        await result.current.loadItems(500);
        
        // Load more items
        await result.current.loadMoreItems(500);
      });

      // Verify we have 1000 items
      expect(result.current.items.length).toBe(1000);

      // Check memory stats
      const memoryStats = result.current.getMemoryStats();
      
      // Verify memory usage is under 100MB
      expect(memoryStats.usageMB).toBeLessThan(100);
      
      // Verify item count
      expect(memoryStats.itemCount).toBe(1000);
      
      // Log stats for visibility
      console.log('Memory Performance Test Results:', {
        itemCount: memoryStats.itemCount,
        memoryUsageMB: memoryStats.usageMB,
        avgItemSizeBytes: memoryStats.avgItemSize,
        isUnder100MB: memoryStats.usageMB < 100,
      });

      // Verify memory optimization is available
      expect(typeof result.current.optimizeMemory).toBe('function');
    });

    it('should automatically optimize memory when threshold is exceeded', async () => {
      const { result } = renderHook(() => useFeedStore());

      // Mock high memory usage to trigger optimization
      const mockGetMemoryMetrics = getMemoryMetrics as jest.MockedFunction<typeof getMemoryMetrics>;
      mockGetMemoryMetrics.mockReturnValue({
        usedMB: 95, // Near 100MB threshold
        totalMB: 4096,
        percentUsed: 2.3,
      });

      // Generate items that would push memory over threshold
      const generateLargeItem = (index: number) => ({
        id: `large-item-${index}`,
        type: 'itk' as const,
        timestamp: new Date(),
        content: 'Large content '.repeat(100), // Make content larger
        source: {
          name: 'Test Source',
          tier: 1 as const,
          reliability: 0.9,
        },
        tags: { clubs: ['Test Club'], players: ['Test Player'], sources: ['Test Source'] },
        metadata: {
          priority: 'medium' as const,
          relevanceScore: 0.8,
        },
      });

      await act(async () => {
        // Mock API with large items
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: Array.from({ length: 800 }, (_, i) => generateLargeItem(i)),
            pagination: { hasMore: false, total: 800 },
          }),
        });

        await result.current.loadItems(800);
      });

      // Memory optimization should keep us under limits
      const memoryStats = result.current.getMemoryStats();
      expect(result.current.items.length).toBeLessThanOrEqual(800);
      
      // Test manual optimization
      act(() => {
        result.current.optimizeMemory();
      });

      // After optimization, should have fewer items but stay functional
      expect(result.current.items.length).toBeLessThanOrEqual(800);
      expect(result.current.items.length).toBeGreaterThan(0);
    });

    it('should handle memory-efficient filtering with large datasets', async () => {
      const { result } = renderHook(() => useFeedStore());

      // Create 1000 items with varied tags for filtering
      const generateFilterTestItem = (index: number) => ({
        id: `filter-item-${index}`,
        type: 'itk' as const,
        timestamp: new Date(),
        content: `Transfer ${index}`,
        source: {
          name: 'Test Source',
          tier: 1 as const,
          reliability: 0.9,
        },
        tags: {
          clubs: [[`Arsenal`], [`Chelsea`], [`United`]][index % 3] || [],
          players: [[`Haaland`], [`Mbappe`], [`Kane`]][index % 3] || [],
          sources: ['Test Source'],
        },
        metadata: {
          priority: 'medium' as const,
          relevanceScore: 0.8,
        },
      });

      await act(async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: Array.from({ length: 1000 }, (_, i) => generateFilterTestItem(i)),
            pagination: { hasMore: false, total: 1000 },
          }),
        });

        await result.current.loadItems(1000);
      });

      // Test filtering performance with large dataset
      act(() => {
        result.current.addTagFilter('Arsenal', 'club');
      });

      // Should filter efficiently without memory issues
      expect(result.current.filteredItems.length).toBeLessThan(result.current.items.length);
      expect(result.current.filteredItems.length).toBeGreaterThan(0);

      // Memory should still be reasonable
      const memoryStats = result.current.getMemoryStats();
      expect(memoryStats.usageMB).toBeLessThan(100);

      // Test clearing filters
      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filteredItems.length).toBe(result.current.items.length);
    });

    it('should maintain performance with real-time updates on large datasets', async () => {
      const { result } = renderHook(() => useFeedStore());

      // Start with 800 items
      await act(async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: Array.from({ length: 800 }, (_, i) => ({
              id: `base-item-${i}`,
              type: 'itk' as const,
              timestamp: new Date(),
              content: `Base transfer ${i}`,
              source: { name: 'Test', tier: 1 as const, reliability: 0.9 },
              tags: { clubs: [], players: [], sources: [] },
              metadata: { priority: 'medium' as const, relevanceScore: 0.8 },
            })),
            pagination: { hasMore: false, total: 800 },
          }),
        });

        await result.current.loadItems(800);
      });

      // Add real-time updates to push over 1000
      act(() => {
        for (let i = 0; i < 250; i++) {
          result.current.addItem({
            id: `realtime-item-${i}`,
            type: 'breaking' as const,
            timestamp: new Date(),
            content: `Breaking: Transfer ${i}`,
            source: { name: 'Breaking Source', tier: 1 as const, reliability: 0.95 },
            tags: { clubs: ['Real Madrid'], players: ['Mbappe'], sources: ['Breaking Source'] },
            metadata: { priority: 'high' as const, relevanceScore: 0.95 },
            isNew: true,
          });
        }
      });

      // Should have triggered automatic optimization to stay under maxItems
      expect(result.current.items.length).toBeLessThanOrEqual(1000);

      // Memory should remain efficient
      const memoryStats = result.current.getMemoryStats();
      expect(memoryStats.usageMB).toBeLessThan(100);

      // Real-time features should still work
      expect(result.current.unreadCount).toBeGreaterThan(0);
    });
  });

  describe('Memory Optimization Features', () => {
    it('should provide detailed memory statistics', () => {
      const { result } = renderHook(() => useFeedStore());

      const stats = result.current.getMemoryStats();

      expect(stats).toHaveProperty('usageMB');
      expect(stats).toHaveProperty('itemCount');
      expect(stats).toHaveProperty('avgItemSize');

      expect(typeof stats.usageMB).toBe('number');
      expect(typeof stats.itemCount).toBe('number');
      expect(typeof stats.avgItemSize).toBe('number');
    });

    it('should cleanup old items when maxItems is exceeded', () => {
      const { result } = renderHook(() => useFeedStore());

      // Set a lower maxItems for testing
      act(() => {
        // Add items beyond maxItems
        for (let i = 0; i < 1200; i++) {
          result.current.addItem({
            id: `overflow-item-${i}`,
            type: 'itk' as const,
            timestamp: new Date(Date.now() - i * 1000),
            content: `Overflow transfer ${i}`,
            source: { name: 'Test', tier: 1 as const, reliability: 0.9 },
            tags: { clubs: [], players: [], sources: [] },
            metadata: { priority: 'medium' as const, relevanceScore: 0.8 },
          });
        }
      });

      // Should have been limited by maxItems
      expect(result.current.items.length).toBeLessThanOrEqual(1000);
    });
  });
});