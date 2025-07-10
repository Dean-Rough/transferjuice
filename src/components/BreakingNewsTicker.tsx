"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TickerItem {
  id: string;
  headline: string;
  isHereWeGo?: boolean;
  fee?: string;
}

export function BreakingNewsTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch latest headlines
  useEffect(() => {
    const fetchHeadlines = async () => {
      try {
        const response = await fetch("/api/stories/ticker");
        if (response.ok) {
          const data = await response.json();
          setItems(data.items || []);
        }
      } catch (error) {
        console.error("Failed to fetch ticker items:", error);
        // Fallback to mock data
        setItems([
          {
            id: "1",
            headline: "Darwin Nunez Has Lost His Tiny Mind (£85m)",
            fee: "£85m",
          },
          {
            id: "2",
            headline: "Harry Maguire Somehow Still Exists at Man United",
            isHereWeGo: false,
          },
          {
            id: "3",
            headline: "Chelsea Sign Another Midfielder Nobody Asked For",
            fee: "£45m",
          },
          {
            id: "4",
            headline: "Fabrizio Romano Types 'Here We Go' for 47th Time Today",
            isHereWeGo: true,
          },
        ]);
      }
    };

    fetchHeadlines();
    const interval = setInterval(fetchHeadlines, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  // Rotate through items
  useEffect(() => {
    if (items.length === 0 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000); // 5 seconds per item

    return () => clearInterval(timer);
  }, [items.length, isPaused]);

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  return (
    <div
      className="breaking-news-ticker bg-orange-500/10 border-y border-orange-500/20"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setTimeout(() => setIsPaused(false), 3000)}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center min-h-[44px] py-2 sm:py-0 sm:h-12">
          {/* Breaking News Label */}
          <div className="flex items-center mr-2 sm:mr-4">
            <span className="bg-orange-500 text-black px-2 sm:px-3 py-1 font-bold text-xs sm:text-sm uppercase tracking-wider">
              Breaking
            </span>
            <div className="ml-1 sm:ml-2 flex gap-1 hidden sm:flex">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-1.5 h-1.5 bg-orange-500 rounded-full"
              />
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                className="w-1.5 h-1.5 bg-orange-500 rounded-full"
              />
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }}
                className="w-1.5 h-1.5 bg-orange-500 rounded-full"
              />
            </div>
          </div>

          {/* Ticker Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentItem.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"
              >
                <span className="text-xs sm:text-sm font-medium line-clamp-2 sm:line-clamp-1">
                  {currentItem.headline}
                </span>

                <div className="flex items-center gap-2">
                  {currentItem.fee && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="bg-green-500/20 text-green-500 px-2 py-0.5 rounded text-xs font-bold"
                    >
                      {currentItem.fee}
                    </motion.span>
                  )}

                  {currentItem.isHereWeGo && (
                    <motion.span
                      initial={{ rotate: -180, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-green-500 font-bold text-xs whitespace-nowrap"
                    >
                      ✓ HERE WE GO!
                    </motion.span>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation dots */}
          <div className="flex gap-1 ml-2 sm:ml-4">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`touch-area w-2 h-2 sm:w-1.5 sm:h-1.5 rounded-full transition-colors ${
                  index === currentIndex ? "bg-orange-500" : "bg-orange-500/30"
                }`}
                aria-label={`Go to item ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
