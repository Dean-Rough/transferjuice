import { useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFeedStore } from '@/lib/stores/feedStore';

interface UseUrlFiltersReturn {
  updateUrlFilters: (filters: string[]) => void;
  syncFiltersFromUrl: () => void;
}

export function useUrlFilters(): UseUrlFiltersReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeFilters, setFilter, clearFilters } = useFeedStore();

  // Sync filters from URL to store on mount
  const syncFiltersFromUrl = useCallback(() => {
    const urlFilters = searchParams.get('filters');

    if (urlFilters) {
      const filters = urlFilters.split(',').filter(Boolean);

      // Only proceed if there are valid filters
      if (filters.length > 0) {
        // Clear current filters first
        clearFilters();

        // Apply URL filters one by one
        filters.forEach((filter) => {
          // Decode URI component in case of special characters
          const decodedFilter = decodeURIComponent(filter);
          setFilter(decodedFilter);
        });
      }
    }
  }, [searchParams, setFilter, clearFilters]);

  // Update URL when filters change
  const updateUrlFilters = useCallback(
    (filters: string[]) => {
      const params = new URLSearchParams(searchParams.toString());

      if (filters.length > 0) {
        // Encode filters and join with commas
        const encodedFilters = filters
          .map((filter) => encodeURIComponent(filter))
          .join(',');
        params.set('filters', encodedFilters);
      } else {
        // Remove filters parameter if no filters
        params.delete('filters');
      }

      // Build new URL
      const newUrl = params.toString()
        ? `?${params.toString()}`
        : window.location.pathname;

      // Update URL without triggering a page reload
      router.replace(newUrl, { scroll: false });
    },
    [router, searchParams]
  );

  // Sync filters to URL when activeFilters change
  useEffect(() => {
    updateUrlFilters(activeFilters.tags);
  }, [activeFilters, updateUrlFilters]);

  // Sync filters from URL on mount
  useEffect(() => {
    syncFiltersFromUrl();
  }, []); // Only run on mount

  return {
    updateUrlFilters,
    syncFiltersFromUrl,
  };
}
