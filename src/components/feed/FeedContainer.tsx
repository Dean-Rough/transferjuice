'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { FeedItem } from './FeedItem';
import { FeedFilters } from './FeedFilters';
import {
  useFeedStore,
  selectFilteredItems,
  selectFeedStatus,
  selectRealtimeStatus,
} from '@/lib/stores/feedStore';
// NO DEMO DATA - Real API only

interface FeedContainerProps {
  className?: string;
}

export function FeedContainer({ className = '' }: FeedContainerProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Store selectors
  const filteredItems = useFeedStore(selectFilteredItems);
  const feedStatus = useFeedStore(selectFeedStatus);
  const realtimeStatus = useFeedStore(selectRealtimeStatus);

  const loadItems = useFeedStore((state) => state.loadItems);
  const loadMoreItems = useFeedStore((state) => state.loadMoreItems);

  // Load more items callback
  const handleLoadMore = useCallback(() => {
    if (feedStatus.hasMore && !feedStatus.isLoading && !feedStatus.isLoadingMore) {
      loadMoreItems(filteredItems.length);
    }
  }, [feedStatus.hasMore, feedStatus.isLoading, feedStatus.isLoadingMore, filteredItems.length, loadMoreItems]);

  // Initialize feed on mount - REAL API ONLY
  useEffect(() => {
    // Small delay to ensure client-side hydration is complete
    const timer = setTimeout(() => {
      console.log('FeedContainer: Loading real feed from API...');
      loadItems(20); // Load initial items from API
    }, 100);
    
    return () => clearTimeout(timer);
  }, []); // Empty dependency array to run only once on mount

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [handleLoadMore]);

  return (
    <div
      className={`feed-container bg-background ${className}`}
      data-testid='feed-container'
    >
      {/* Header */}
      <div className='sticky top-0 z-10 bg-background border-b border-border'>
        <div className='flex items-center justify-between p-4'>
          <div>
            <h2 className='text-xl font-bold text-foreground'>
              Live Transfer Feed
            </h2>
            <p className='text-muted-foreground text-sm engagement-mono'>
              Global ITK monitoring • {filteredItems.length} updates
            </p>
          </div>
          <div className='flex items-center space-x-4'>
            <div className='flex items-center space-x-2'>
              <div
                className={`w-2 h-2 rounded-full ${realtimeStatus.isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              ></div>
              <span className='text-sm text-muted-foreground engagement-mono'>
                {realtimeStatus.isConnected ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <FeedFilters />
      </div>

      {/* Feed Items */}
      <div className='feed-list' data-testid='feed-list'>
        {feedStatus.isLoading && filteredItems.length === 0 ? (
          <div className='flex items-center justify-center h-64'>
            <div className='loading-spinner'></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-64 space-y-4'>
            <div className='text-gray-400'>
              <svg
                className='w-16 h-16 mx-auto mb-4'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                />
              </svg>
            </div>
            <p className='text-foreground text-lg text-center'>
              No transfers match your filters
            </p>
            <p className='text-muted-foreground text-sm text-center max-w-md engagement-mono'>
              The transfer window is quiet for these criteria. Try adjusting
              your filters or check back soon.
            </p>
          </div>
        ) : (
          <>
            {filteredItems.map((item) => (
              <FeedItem key={item.id} item={item} />
            ))}
            {feedStatus.isLoading && (
              <div className='flex items-center justify-center p-8'>
                <div className='loading-spinner'></div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Infinite scroll sentinel */}
      <div
        ref={sentinelRef}
        className='h-4 w-full flex items-center justify-center py-4'
        data-testid='infinite-scroll-sentinel'
      >
        {feedStatus.hasMore && !feedStatus.isLoading && (
          <span className='text-sm text-muted-foreground'>Loading more...</span>
        )}
      </div>
    </div>
  );
}
