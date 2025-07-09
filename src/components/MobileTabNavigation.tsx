"use client";

import { useState } from "react";
import Link from "next/link";
import { Newspaper, Radio } from "lucide-react";

export function MobileTabNavigation({ 
  children, 
  rssContent, 
  storiesContent 
}: { 
  children: React.ReactNode;
  rssContent: React.ReactNode;
  storiesContent: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<"stories" | "rss">("stories");

  return (
    <>
      {/* Desktop view - show everything */}
      <div className="hidden lg:block">
        {children}
      </div>

      {/* Mobile view - tabbed interface */}
      <div className="lg:hidden">
        {/* Tab navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
          <div className="grid grid-cols-2 h-16">
            <button
              onClick={() => setActiveTab("stories")}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === "stories" 
                  ? "text-orange-500 bg-orange-500/10" 
                  : "text-muted-foreground"
              }`}
            >
              <Newspaper className="w-5 h-5" />
              <span className="text-xs font-medium">Stories</span>
            </button>
            
            <button
              onClick={() => setActiveTab("rss")}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === "rss" 
                  ? "text-orange-500 bg-orange-500/10" 
                  : "text-muted-foreground"
              }`}
            >
              <Radio className="w-5 h-5" />
              <span className="text-xs font-medium">Live Feed</span>
            </button>
          </div>
        </div>

        {/* Content area with padding for fixed nav */}
        <div className="pb-16">
          {activeTab === "stories" ? storiesContent : rssContent}
        </div>
      </div>
    </>
  );
}