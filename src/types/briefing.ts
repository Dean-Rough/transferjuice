/**
 * Briefing Type Definitions
 * Types for magazine-style briefing system
 */

import type {
  Briefing,
  BriefingFeedItem,
  BriefingTag,
  BriefingMedia,
  FeedItem,
  Tag,
  ITKSource,
  League,
  TransferType,
  Priority,
} from "@prisma/client";

/**
 * Briefing status enum
 */
export enum BriefingStatus {
  Draft = "draft",
  Published = "published",
  All = "all",
}

/**
 * Briefing content structure
 */
export interface BriefingContent {
  title: {
    main: string;
    subtitle?: string;
  };
  sections: BriefingSection[];
  visualTimeline: TimelineItem[];
  sidebar: SidebarSection[];
}

/**
 * Main content section
 */
export interface BriefingSection {
  id: string;
  type: "intro" | "transfer" | "analysis" | "partner" | "outro";
  title?: string;
  content: string;
  feedItemIds?: string[];
  metadata?: {
    priority?: Priority;
    transferType?: TransferType;
    league?: League;
    source?: string;
    partnerAttribution?: string;
  };
}

/**
 * Visual timeline item
 */
export interface TimelineItem {
  id: string;
  time: string;
  type: "transfer" | "rumour" | "update" | "partner";
  title: string;
  description: string;
  polaroid?: {
    playerName: string;
    clubName: string;
    imageUrl: string;
    frameColor: string;
  };
  feedItemId?: string;
}

/**
 * Sidebar section
 */
export interface SidebarSection {
  id: string;
  type: "stats" | "trending" | "terry-take" | "quick-hits";
  title: string;
  content: any; // JSON structure varies by type
}

/**
 * Briefing with all relations
 */
export interface BriefingWithRelations extends Briefing {
  feedItems: (BriefingFeedItem & {
    feedItem: FeedItem & {
      source: ITKSource;
      tags: { tag: Tag }[];
      media: any[];
    };
  })[];
  tags: (BriefingTag & {
    tag: Tag;
  })[];
  media: BriefingMedia[];
}

/**
 * Briefing filter options
 */
export interface BriefingFilter {
  page?: number;
  limit?: number;
  status?: BriefingStatus;
  tags?: string[];
  leagues?: League[];
  startDate?: Date;
  endDate?: Date;
}

/**
 * Briefing list response
 */
export interface BriefingListResponse {
  briefings: (Briefing & {
    tags: (BriefingTag & { tag: Tag })[];
    _count: {
      feedItems: number;
      media: number;
    };
  })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Briefing generation options
 */
export interface GenerateBriefingOptions {
  timestamp: Date;
  testMode?: boolean;
  feedItemIds?: string[];
  includePartnerContent?: boolean;
  forceRegenerate?: boolean;
}

/**
 * Briefing generation result
 */
export interface BriefingGenerationResult {
  success: boolean;
  briefing?: Briefing;
  error?: string;
  stats?: {
    feedItemsProcessed: number;
    sectionsGenerated: number;
    polaroidsCreated: number;
    terryScore: number;
    generationTime: number;
  };
}

/**
 * Briefing email tracking
 */
export interface BriefingEmailStats {
  sent: number;
  opened: number;
  clicked: number;
  totalClicks: number;
  openRate: number;
  clickRate: number;
  avgClicksPerEmail: number;
}

/**
 * Terry commentary options
 */
export interface TerryCommentaryOptions {
  style: "witty" | "sarcastic" | "excited" | "analytical";
  length: "short" | "medium" | "long";
  includeEmoji?: boolean;
  targetAudience?: "casual" | "hardcore" | "mixed";
}

/**
 * Polaroid generation options
 */
export interface PolaroidOptions {
  playerName: string;
  clubName?: string;
  frameColor?: string;
  style?: "vintage" | "modern" | "club-themed";
  includeStats?: boolean;
}
