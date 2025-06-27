/**
 * Breaking News Ticker Component
 * Scrolling ticker with Terry's daily shitpost headlines
 */

"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  getCurrentBreakingNews,
  type BreakingNewsStory,
} from "@/lib/breakingNews/dailyTicker";

interface BreakingNewsTickerProps {
  className?: string;
  speed?: number; // pixels per second
}

export function BreakingNewsTicker({
  className = "",
  speed = 50,
}: BreakingNewsTickerProps) {
  const [stories, setStories] = useState<BreakingNewsStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const tickerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load breaking news stories
  useEffect(() => {
    async function loadStories() {
      try {
        const response = await fetch("/api/breaking-news");
        const data = await response.json();

        if (data.success && data.data) {
          setStories(data.data);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load breaking news:", error);
        setIsLoading(false);
      }
    }

    loadStories();

    // Refresh every hour
    const interval = setInterval(loadStories, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Scroll animation
  useEffect(() => {
    if (!tickerRef.current || !contentRef.current || stories.length === 0)
      return;

    const ticker = tickerRef.current;
    const content = contentRef.current;

    // Clone content for seamless loop
    const clone = content.cloneNode(true) as HTMLDivElement;
    clone.setAttribute("aria-hidden", "true");
    ticker.appendChild(clone);

    // Calculate animation duration based on content width and speed
    const contentWidth = content.offsetWidth;
    const duration = contentWidth / speed;

    // Apply CSS animation
    content.style.animation = `scroll ${duration}s linear infinite`;
    clone.style.animation = `scroll ${duration}s linear infinite`;
    clone.style.animationDelay = `${duration / 2}s`;

    return () => {
      if (ticker.contains(clone)) {
        ticker.removeChild(clone);
      }
    };
  }, [stories, speed]);

  if (isLoading) {
    return (
      <div className={`bg-red-600 text-white ${className}`}>
        <div className="py-2 px-4 text-sm font-mono animate-pulse">
          LOADING BREAKING NEWS...
        </div>
      </div>
    );
  }

  if (stories.length === 0) {
    return null;
  }

  return (
    <div className={`bg-red-600 text-white overflow-hidden ${className}`}>
      <div className="relative flex">
        {/* Static "BREAKING NEWS" label */}
        <div className="bg-red-700 px-4 py-2 flex items-center gap-2 flex-shrink-0 z-10">
          <span className="animate-pulse">🚨</span>
          <span className="font-black text-sm">BREAKING NEWS</span>
        </div>

        {/* Scrolling ticker */}
        <div
          ref={tickerRef}
          className="flex items-center h-10 overflow-hidden flex-1"
          role="marquee"
          aria-live="off"
        >
          <div ref={contentRef} className="flex items-center whitespace-nowrap">
            {stories.map((story, index) => (
              <React.Fragment key={story.id}>
                {index > 0 && <span className="mx-6 text-red-300">•</span>}
                <span className="text-sm font-medium uppercase tracking-wide">
                  {story.headline}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* CSS for animation */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Breaking News Ticker with controls
 */
export function BreakingNewsTickerWithControls({
  className = "",
}: {
  className?: string;
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(50);

  return (
    <div className={className}>
      <div
        className={isPaused ? "ticker-paused" : ""}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <BreakingNewsTicker speed={speed} />
      </div>

      {/* Speed controls (hidden by default, shown on hover) */}
      <div className="hidden group-hover:flex absolute top-full left-0 right-0 bg-black/80 p-2 items-center gap-4">
        <span className="text-xs text-white">Speed:</span>
        <input
          type="range"
          min="20"
          max="100"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="flex-1"
        />
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="text-xs text-white px-2 py-1 bg-red-600 rounded"
        >
          {isPaused ? "Play" : "Pause"}
        </button>
      </div>

      <style jsx>{`
        .ticker-paused :global([role="marquee"] > div) {
          animation-play-state: paused !important;
        }
      `}</style>
    </div>
  );
}
