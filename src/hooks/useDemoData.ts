/**
 * Demo Data Loader Hook
 * Loads demo transfer feed data for development and demonstration
 */

import { useEffect } from "react";
import { useFeedStore } from "@/lib/stores/feedStore";
import { getDemoFeedData, getMoreDemoFeedData } from "@/lib/data/demoFeedData";

export function useDemoData() {
  const { items, addItem } = useFeedStore();

  // Load initial demo data
  useEffect(() => {
    // Only load if store is empty
    if (items.length === 0) {
      console.log("Loading demo transfer feed data...");

      // Simulate loading delay
      setTimeout(() => {
        const demoData = getDemoFeedData();

        // Add items one by one to trigger proper store updates
        demoData.forEach((item) => {
          addItem(item);
        });

        console.log(`Loaded ${demoData.length} demo feed items`);
      }, 500); // 500ms loading simulation
    }
  }, [items.length, addItem]);

  // Function to load more demo data (for infinite scroll)
  const loadMoreDemoData = () => {
    console.log("Loading more demo data...");

    setTimeout(() => {
      const moreData = getMoreDemoFeedData(Math.floor(items.length / 10));

      moreData.forEach((item) => {
        addItem(item);
      });

      console.log(`Loaded ${moreData.length} additional demo items`);
    }, 800); // Simulate network delay
  };

  // Function to initialize demo feed
  const initializeDemoFeed = () => {
    if (items.length === 0) {
      console.log("Initializing demo transfer feed...");
      const demoData = getDemoFeedData();
      demoData.forEach((item) => {
        addItem(item);
      });
      console.log(`Initialized with ${demoData.length} demo feed items`);
    }
  };

  return {
    initializeDemoFeed,
    loadMoreDemoData,
    isLoaded: items.length > 0,
  };
}
