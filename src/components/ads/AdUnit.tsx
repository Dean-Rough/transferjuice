"use client";

import { useEffect } from "react";

interface AdUnitProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal";
  style?: React.CSSProperties;
  className?: string;
}

export function AdUnit({
  slot,
  format = "auto",
  style = {},
  className = "",
}: AdUnitProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <div className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          ...style,
        }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXXX" // Replace with your AdSense client ID
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Feed Ad - Native style matching feed items
export function FeedAd() {
  return (
    <article className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold data-mono bg-gray-600 text-white">
            SPONSORED
          </span>
        </div>
        <AdUnit
          slot="1234567890" // Replace with your ad slot ID
          format="fluid"
          className="min-h-[200px]"
        />
      </div>
    </article>
  );
}

// Sidebar Ad
export function SidebarAd() {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <p className="text-xs text-muted-foreground mb-2 text-center">
        Advertisement
      </p>
      <AdUnit
        slot="0987654321" // Replace with your ad slot ID
        format="rectangle"
        style={{ width: "300px", height: "250px" }}
      />
    </div>
  );
}
