/**
 * Global type definitions for TransferJuice
 * Temporary file to fix compilation errors
 */

// Briefing types (referenced in multiple files but not in Prisma schema)
export enum BriefingType {
  MORNING = "morning",
  AFTERNOON = "afternoon",
  EVENING = "evening",
  BREAKING = "breaking",
  WEEKLY = "weekly",
}

// Export for compatibility - temporarily disabled to prevent circular dependency
// export type { TweetMediaInfo } from './twitter/client';

// Export types that tests need but were missing
export interface TweetInput {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics?: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
}

export interface GenerationInput {
  feedType: string;
  briefingDate: Date;
  tweetAnalyses: any[];
  previousArticles?: string[];
  targetWordCount?: number;
  focusClubs?: string[];
}
