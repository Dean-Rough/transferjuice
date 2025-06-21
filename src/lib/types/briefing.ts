/**
 * Transfer Juice Briefing System Types
 * Defines the structure for hourly editorial briefings
 */

export interface BriefingSection {
  id: string;
  type: 'lead' | 'context' | 'analysis' | 'bullshit_corner';
  title: string;
  content: string;
  order: number;
  sourceTweets: string[]; // Tweet IDs used in this section
  terryisms: string[]; // Specific Terry phrases used
  playerMentions: string[]; // For polaroid triggering
  partnerSources?: string[]; // Partner content references
}

export interface BriefingMetadata {
  wordCount: number;
  estimatedReadTime: number; // minutes
  terryScore: number; // 0-100, how Terry-esque it is
  qualityMetrics: {
    coherence: number; // 0-100
    factualAccuracy: number; // 0-100
    brandVoice: number; // 0-100
    readability: number; // 0-100
  };
  generationTime: number; // milliseconds
  sourceStats: {
    totalTweets: number;
    tier1Sources: number;
    tier2Sources: number;
    tier3Sources: number;
    shitTierSources: number;
  };
}

export interface BriefingTitle {
  full: string; // Complete title with format
  funny: string; // Just the Terry humor part
  day: string; // "Monday"
  hour: string; // "14:00"
  month: string; // "May"
  year: string; // "'25"
  timestamp: Date;
  slug: string; // URL-friendly version
}

export interface PolaroidImage {
  filename: string;
  playerName: string;
  rotation: number; // -8 to +8 degrees
  position: number; // Scroll position where it appears
  altText: string;
  source: 'wikipedia' | 'manual' | 'generated';
}

export interface BriefingSharing {
  platforms: {
    twitter: {
      message: string;
      hashtags: string[];
      quote?: string; // Featured Terry quote
    };
    linkedin: {
      message: string;
      description: string;
    };
    whatsapp: {
      message: string;
    };
    email: {
      subject: string;
      preview: string;
    };
  };
  shareCount: {
    twitter: number;
    linkedin: number;
    whatsapp: number;
    email: number;
    copyLink: number;
  };
  quotes: string[]; // Shareable Terry quotes
}

export interface Briefing {
  id: string;
  title: BriefingTitle;
  timestamp: Date;
  published: boolean;
  
  // Content structure
  sections: BriefingSection[];
  summary: string;
  metaDescription: string;
  
  // Visual elements
  polaroids: PolaroidImage[];
  featuredImage?: string;
  
  // Metadata
  metadata: BriefingMetadata;
  
  // Engagement
  sharing: BriefingSharing;
  tags: {
    clubs: string[];
    players: string[];
    sources: string[];
    leagues: string[];
    transferTypes: string[];
  };
  
  // SEO
  slug: string;
  canonicalUrl: string;
  openGraph: {
    title: string;
    description: string;
    image: string;
    type: 'article';
  };
  
  // Analytics
  engagement?: {
    views: number;
    readTime: number; // actual average read time
    shares: number;
    reactions: number;
    newsletterSignups: number; // from this briefing
  };
}

export interface BriefingArchive {
  briefings: Briefing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  filters: {
    dateRange?: {
      start: Date;
      end: Date;
    };
    tags?: string[];
    leagues?: string[];
    minReadTime?: number;
    maxReadTime?: number;
  };
}

export interface BriefingGenerationConfig {
  targetWordCount: {
    min: number;
    max: number;
    ideal: number;
  };
  qualityThresholds: {
    minTerryScore: number;
    minFactualAccuracy: number;
    minBrandVoice: number;
    minCoherence: number;
  };
  contentMix: {
    maxPartnerContentRatio: number; // 0-1
    minShitTierMockery: number; // minutes of content
    preferredSections: BriefingSection['type'][];
  };
  polaroidSettings: {
    maxPerBriefing: number;
    rotationRange: {
      min: number; // -8
      max: number; // +8
    };
    triggerThreshold: number; // minimum player mentions to trigger polaroid
  };
}

// Helper types for briefing generation
export type BriefingStatus = 'draft' | 'generating' | 'reviewing' | 'published' | 'failed';

export interface BriefingJob {
  id: string;
  status: BriefingStatus;
  scheduledFor: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  config: BriefingGenerationConfig;
  result?: Briefing;
}

// Utility functions for working with briefings
export const BriefingUtils = {
  // Generate title format: "Monday 14:00 Briefing May '25 - [Funny Title]"
  formatTitle: (date: Date, funnyTitle: string): BriefingTitle => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const day = days[date.getDay()];
    const hour = date.getHours().toString().padStart(2, '0') + ':00';
    const month = months[date.getMonth()];
    const year = "'" + date.getFullYear().toString().slice(-2);
    
    const full = `${day} ${hour} Briefing ${month} ${year} - ${funnyTitle}`;
    const slug = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}-${date.getHours().toString().padStart(2, '0')}`;
    
    return {
      full,
      funny: funnyTitle,
      day,
      hour,
      month,
      year,
      timestamp: date,
      slug,
    };
  },
  
  // Extract player mentions from content for polaroid triggering
  extractPlayerMentions: (content: string): string[] => {
    // This would be enhanced with a proper player database
    const commonPlayers = [
      'Haaland', 'Mbappe', 'Bellingham', 'Kane', 'Salah', 'Vinicius',
      'Pedri', 'Gavi', 'Musiala', 'Camavinga', 'Osimhen', 'Leao',
      'Kvaratskhelia', 'Vlahovic', 'Saka', 'Foden', 'Wirtz', 'Moukoko'
    ];
    
    return commonPlayers.filter(player => 
      content.toLowerCase().includes(player.toLowerCase())
    );
  },
  
  // Generate slug for URL
  generateSlug: (date: Date): string => {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}-${date.getHours().toString().padStart(2, '0')}`;
  },
  
  // Calculate estimated read time
  calculateReadTime: (wordCount: number): number => {
    const wordsPerMinute = 200; // Average reading speed
    return Math.ceil(wordCount / wordsPerMinute);
  },
  
  // Check if briefing meets quality standards
  meetsQualityStandards: (briefing: Briefing, config: BriefingGenerationConfig): boolean => {
    const { metadata } = briefing;
    const { qualityThresholds, targetWordCount } = config;
    
    return (
      metadata.wordCount >= targetWordCount.min &&
      metadata.wordCount <= targetWordCount.max &&
      metadata.terryScore >= qualityThresholds.minTerryScore &&
      metadata.qualityMetrics.factualAccuracy >= qualityThresholds.minFactualAccuracy &&
      metadata.qualityMetrics.brandVoice >= qualityThresholds.minBrandVoice &&
      metadata.qualityMetrics.coherence >= qualityThresholds.minCoherence
    );
  },
};

// Default configuration for briefing generation
export const DEFAULT_BRIEFING_CONFIG: BriefingGenerationConfig = {
  targetWordCount: {
    min: 1200,
    max: 2500,
    ideal: 1800,
  },
  qualityThresholds: {
    minTerryScore: 85,
    minFactualAccuracy: 80,
    minBrandVoice: 90,
    minCoherence: 85,
  },
  contentMix: {
    maxPartnerContentRatio: 0.25, // 25% max partner content
    minShitTierMockery: 2, // At least 2 minutes of Fechejes mockery
    preferredSections: ['lead', 'context', 'analysis', 'bullshit_corner'],
  },
  polaroidSettings: {
    maxPerBriefing: 8,
    rotationRange: {
      min: -8,
      max: 8,
    },
    triggerThreshold: 1, // 1+ mentions triggers polaroid
  },
};