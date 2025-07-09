"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

export function RSSFeedWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isHovering = useRef(false);

  useEffect(() => {
    // Ensure the widget is properly initialized when component mounts
    if (typeof window !== "undefined" && (window as any).rssapp) {
      (window as any).rssapp.refresh();
    }
  }, []);

  useEffect(() => {
    // Auto-scroll functionality
    const container = containerRef.current;
    if (!container) return;

    let scrollInterval: NodeJS.Timeout;

    const startAutoScroll = () => {
      scrollInterval = setInterval(() => {
        if (!isHovering.current && container.parentElement) {
          const scrollContainer = container.parentElement;
          const maxScroll =
            scrollContainer.scrollHeight - scrollContainer.clientHeight;

          if (scrollContainer.scrollTop < maxScroll) {
            // Scroll down slowly
            scrollContainer.scrollTop += 0.5;
          } else {
            // Reset to top when reaching bottom
            scrollContainer.scrollTop = 0;
          }
        }
      }, 30); // Adjust speed here (lower = faster)
    };

    // Start scrolling after a delay to let content load
    const startDelay = setTimeout(() => {
      startAutoScroll();
    }, 3000);

    // Handle mouse enter/leave for pause on hover
    const handleMouseEnter = () => {
      isHovering.current = true;
    };

    const handleMouseLeave = () => {
      isHovering.current = false;
    };

    const scrollContainer = container.parentElement;
    if (scrollContainer) {
      scrollContainer.addEventListener("mouseenter", handleMouseEnter);
      scrollContainer.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      clearInterval(scrollInterval);
      clearTimeout(startDelay);
      if (scrollContainer) {
        scrollContainer.removeEventListener("mouseenter", handleMouseEnter);
        scrollContainer.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  return (
    <>
      <Script
        src="https://widget.rss.app/v1/feed.js"
        strategy="afterInteractive"
      />
      <div ref={containerRef} className="rss-feed-container h-full">
        <rssapp-feed id="_zMqruZvtL6XIMNVY"></rssapp-feed>
      </div>
    </>
  );
}
