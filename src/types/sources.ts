/**
 * Source-related type definitions
 */

export interface ITKSource {
  id?: string;
  handle: string;
  username: string;
  name: string;
  tier: 1 | 2 | 3;
  reliability: number;
  region: "UK" | "ES" | "IT" | "FR" | "DE" | "BR" | "GLOBAL";
  league?: string[];
  isVerified: boolean;
  language?: "en" | "es" | "it" | "fr" | "de" | "pt";
  specialties?: string[];
  leagues?: string[];
  twitterId?: string;
  isActive?: boolean;
  isShitTier?: boolean;
  lastChecked?: Date;
  rateLimit?: {
    remaining: number;
    resetTime: Date;
  };
  lastTweetId?: string;
}
