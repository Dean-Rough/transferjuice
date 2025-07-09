"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface TweetWidgetProps {
  tweet: {
    content: string;
    url: string;
    scrapedAt: string | Date;
  };
  source: {
    name: string;
    handle: string;
  };
}

export function TweetWidget({ tweet, source }: TweetWidgetProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load Twitter widgets script if not already loaded
    if (!(window as any).twttr) {
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      script.onload = () => {
        setIsLoaded(true);
        (window as any).twttr?.widgets?.load();
      };
      document.body.appendChild(script);
    } else {
      setIsLoaded(true);
      (window as any).twttr?.widgets?.load();
    }
  }, []);

  // Extract tweet ID from URL
  const tweetId = tweet.url.match(/status\/(\d+)/)?.[1];

  // Reliability badge colors based on source
  const getReliabilityBadge = () => {
    const tier1Sources = [
      "Fabrizio Romano",
      "David Ornstein",
      "Gianluca Di Marzio",
    ];
    const tier2Sources = ["Sam Lee", "Paul Joyce", "John Percy"];

    if (tier1Sources.includes(source.name)) {
      return { color: "bg-green-500", text: "Tier 1" };
    } else if (tier2Sources.includes(source.name)) {
      return { color: "bg-yellow-500", text: "Tier 2" };
    }
    return { color: "bg-gray-500", text: "Tier 3" };
  };

  const badge = getReliabilityBadge();
  const timeAgo = formatDistanceToNow(new Date(tweet.scrapedAt), {
    addSuffix: true,
  });

  return (
    <div className="tweet-widget">
      {/* Source header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-orange-500">{source.name}</span>
          <span className="text-sm text-muted-foreground">{source.handle}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 text-xs font-medium text-white rounded ${badge.color}`}
          >
            {badge.text}
          </span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
      </div>

      {/* Tweet embed or fallback */}
      {tweetId && isLoaded ? (
        <div className="tweet-embed">
          <blockquote className="twitter-tweet" data-theme="dark">
            <a href={tweet.url}></a>
          </blockquote>
        </div>
      ) : (
        <div className="bg-secondary/50 border border-border rounded-lg p-4">
          <p className="text-sm whitespace-pre-wrap">{tweet.content}</p>
          <a
            href={tweet.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-orange-500 hover:underline mt-2 inline-block"
          >
            View on Twitter →
          </a>
        </div>
      )}
    </div>
  );
}
