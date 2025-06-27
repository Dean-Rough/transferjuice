/**
 * Tweet Embed Component
 * Visual representation of tweets within articles
 */

import React from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

interface TweetEmbedProps {
  author: {
    name: string;
    handle: string;
    avatar?: string;
    verified?: boolean;
    tier?: number;
  };
  content: string;
  timestamp: Date;
  engagement?: {
    likes: number;
    retweets: number;
    replies: number;
  };
  media?: {
    type: "image" | "video";
    url: string;
    alt?: string;
  }[];
  isQuote?: boolean;
  quotedTweet?: Omit<TweetEmbedProps, "isQuote" | "quotedTweet">;
  theme?: "light" | "dark";
}

export function TweetEmbed({
  author,
  content,
  timestamp,
  engagement,
  media,
  isQuote = false,
  quotedTweet,
  theme = "dark",
}: TweetEmbedProps) {
  const bgColor = theme === "dark" ? "bg-zinc-900" : "bg-white";
  const borderColor = theme === "dark" ? "border-zinc-800" : "border-gray-200";
  const textColor = theme === "dark" ? "text-white" : "text-gray-900";
  const mutedColor = theme === "dark" ? "text-zinc-400" : "text-gray-500";

  // Format content with mentions and hashtags
  const formattedContent = formatTweetContent(content);

  // Get tier badge color
  const tierBadgeColor = getTierBadgeColor(author.tier);

  return (
    <div
      className={`${bgColor} ${borderColor} ${isQuote ? "p-3" : "p-4"} rounded-lg border ${
        !isQuote && "my-8 shadow-medium hover-lift"
      } transition-all`}
    >
      {/* Tweet Header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {author.avatar ? (
            <Image
              src={author.avatar}
              alt={author.name}
              width={isQuote ? 36 : 48}
              height={isQuote ? 36 : 48}
              className="rounded-full"
            />
          ) : (
            <div
              className={`${
                isQuote ? "w-9 h-9" : "w-12 h-12"
              } bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center`}
            >
              <span className="text-white font-bold text-lg">
                {author.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {author.tier && (
            <div
              className={`absolute -bottom-1 -right-1 w-5 h-5 ${tierBadgeColor} rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-zinc-900`}
            >
              {author.tier}
            </div>
          )}
        </div>

        {/* Author Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span
              className={`font-bold ${textColor} ${isQuote ? "text-sm" : ""}`}
            >
              {author.name}
            </span>
            {author.verified && (
              <svg
                className="w-4 h-4 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span
              className={`${mutedColor} ${isQuote ? "text-xs" : "text-sm"}`}
            >
              @{author.handle}
            </span>
            <span
              className={`${mutedColor} ${isQuote ? "text-xs" : "text-sm"}`}
            >
              ·
            </span>
            <span
              className={`${mutedColor} ${isQuote ? "text-xs" : "text-sm"}`}
            >
              {formatDistanceToNow(timestamp, { addSuffix: true })}
            </span>
          </div>

          {/* Tweet Content */}
          <div
            className={`mt-2 ${textColor} ${isQuote ? "text-sm" : ""} whitespace-pre-wrap`}
          >
            {formattedContent}
          </div>

          {/* Quoted Tweet */}
          {quotedTweet && (
            <div className="mt-3">
              <TweetEmbed {...quotedTweet} isQuote={true} theme={theme} />
            </div>
          )}

          {/* Media */}
          {media && media.length > 0 && (
            <div
              className={`mt-3 ${media.length > 1 ? "grid grid-cols-2 gap-2" : ""}`}
            >
              {media.map((item, index) => (
                <div
                  key={index}
                  className="relative rounded-lg overflow-hidden"
                >
                  {item.type === "image" ? (
                    <Image
                      src={item.url}
                      alt={item.alt || "Tweet media"}
                      width={600}
                      height={400}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                      <span className="text-white text-sm">Video</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Engagement Stats */}
          {!isQuote && engagement && (
            <div
              className={`flex items-center gap-6 mt-4 ${mutedColor} text-sm`}
            >
              <button className="flex items-center gap-2 hover:text-red-500 transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span>{formatEngagement(engagement.likes)}</span>
              </button>

              <button className="flex items-center gap-2 hover:text-green-500 transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>{formatEngagement(engagement.retweets)}</span>
              </button>

              <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span>{formatEngagement(engagement.replies)}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Format tweet content with clickable mentions and hashtags
 */
function formatTweetContent(content: string): React.ReactNode {
  // This is a simplified version - in production you'd parse more thoroughly
  const parts = content.split(/(@\w+|#\w+)/g);

  return parts.map((part, index) => {
    if (part.startsWith("@")) {
      return (
        <span
          key={index}
          className="text-blue-400 hover:underline cursor-pointer"
        >
          {part}
        </span>
      );
    } else if (part.startsWith("#")) {
      return (
        <span
          key={index}
          className="text-blue-400 hover:underline cursor-pointer"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

/**
 * Get tier badge color based on reliability tier
 */
function getTierBadgeColor(tier?: number): string {
  switch (tier) {
    case 1:
      return "bg-green-600";
    case 2:
      return "bg-blue-600";
    case 3:
      return "bg-yellow-600";
    case 4:
      return "bg-orange-600";
    case 5:
      return "bg-red-600";
    default:
      return "bg-zinc-600";
  }
}

/**
 * Format engagement numbers
 */
function formatEngagement(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Simplified Tweet Embed for loading states
 */
export function TweetEmbedSkeleton() {
  return (
    <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 my-8 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-zinc-800 rounded-full"></div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 bg-zinc-800 rounded-md"></div>
            <div className="h-4 w-20 bg-zinc-800 rounded-md"></div>
          </div>
          <div className="mt-2 space-y-2">
            <div className="h-4 w-full bg-zinc-800 rounded-md"></div>
            <div className="h-4 w-3/4 bg-zinc-800 rounded-md"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
