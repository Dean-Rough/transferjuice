"use client";

import { MagazineLayout } from "./MagazineLayout";
import type { BriefingWithRelations } from "@/types/briefing";

interface CardBasedLayoutProps {
  briefing: BriefingWithRelations;
  onShare?: (platform: string) => void;
  className?: string;
}

/**
 * CardBasedLayout - Currently using MagazineLayout as the implementation
 * This ensures proper rendering of briefing content with HTML formatting
 */
export function CardBasedLayout({
  briefing,
  onShare,
  className = "",
}: CardBasedLayoutProps) {
  // For now, use MagazineLayout which properly renders content
  // TODO: Implement actual card-based layout when design is ready
  return (
    <MagazineLayout
      briefing={briefing}
      onShare={onShare}
      className={className}
    />
  );
}
