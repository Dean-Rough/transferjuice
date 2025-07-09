"use client";

import { useEffect, useRef } from "react";

export function AutoScrollRSSWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isHovering = useRef(false);

  useEffect(() => {
    // Auto-scroll functionality
    const container = containerRef.current;
    if (!container) return;

    let scrollInterval: NodeJS.Timeout;

    const startAutoScroll = () => {
      scrollInterval = setInterval(() => {
        if (!isHovering.current && container) {
          const maxScroll = container.scrollHeight - container.clientHeight;

          if (container.scrollTop < maxScroll) {
            // Scroll down slowly
            container.scrollTop += 0.5;
          } else {
            // Reset to top when reaching bottom
            container.scrollTop = 0;
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

    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      clearInterval(scrollInterval);
      clearTimeout(startDelay);
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="h-[1200px] overflow-y-auto scrollbar-hide"
      dangerouslySetInnerHTML={{
        __html: '<rssapp-feed id="_zMqruZvtL6XIMNVY"></rssapp-feed><script src="https://widget.rss.app/v1/feed.js" type="text/javascript" async></script>',
      }}
    />
  );
}