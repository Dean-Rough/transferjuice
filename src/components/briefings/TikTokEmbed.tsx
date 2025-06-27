/**
 * TikTok Embed Component
 * Embeds TikTok videos in briefings
 */

"use client";

import React, { useEffect, useState } from "react";
import { Play } from "lucide-react";
import {
  getRandomShithouseryVideo,
  type YouTubeVideo,
} from "@/lib/media/youtubeSearch";

// Declare TikTok global
declare global {
  interface Window {
    tiktok?: {
      init: () => void;
    };
  }
}

interface TikTokEmbedProps {
  videoId?: string;
  username?: string;
  description?: string;
  hashtag?: string;
}

export function TikTokEmbed({
  videoId = "7380650297168596256", // Working shithouse TikTok
  username = "433",
  description = "Vintage shithousery compilation",
  hashtag = "footballshithousery",
}: TikTokEmbedProps) {
  const embedUrl = `https://www.tiktok.com/@${username}/video/${videoId}`;

  useEffect(() => {
    // Create a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Load TikTok embed script if not already loaded
      if (
        !document.querySelector('script[src="https://www.tiktok.com/embed.js"]')
      ) {
        const script = document.createElement("script");
        script.src = "https://www.tiktok.com/embed.js";
        script.async = true;
        script.setAttribute("data-video-id", videoId);
        document.body.appendChild(script);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [videoId]);

  return (
    <div className="my-8">
      {/* Shithouse Corner Header */}
      <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 shadow-medium">
        <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
          <Play className="w-6 h-6 text-orange-500" />
          Shithouse Corner
        </h3>

        <p className="text-zinc-300 mb-6 italic">
          "And now for something completely different - it's time for Shithouse
          Corner, where we celebrate football's finest wind-up merchants and
          masters of the dark arts."
        </p>

        {/* Video Embed - Fallback to YouTube for reliability */}
        <div className="flex justify-center mb-6">
          <div className="relative w-full max-w-[600px] aspect-video bg-zinc-800 rounded-lg overflow-hidden">
            <iframe
              src="https://www.youtube.com/embed/ALZHF5UqnU4"
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              loading="lazy"
              title="Football Shithousery Compilation"
            />
          </div>
        </div>

        {/* Fallback link */}
        <div className="text-center mb-4">
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors text-sm font-mono"
          >
            <Play className="w-4 h-4" />
            Watch on TikTok
          </a>
        </div>

        {/* Video info */}
        <div className="flex items-center justify-between text-sm mb-4">
          <p className="text-zinc-400">
            @{username} - {description}
          </p>
          <a
            href={`https://www.tiktok.com/tag/${hashtag}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:text-orange-300 transition-colors font-mono"
          >
            #{hashtag}
          </a>
        </div>

        <p className="text-zinc-500 text-xs text-center italic">
          "Remember, it's not cheating if the ref doesn't see it."
        </p>
      </div>
    </div>
  );
}

/**
 * Static shithouse corner section for briefings
 */
export function ShithouseCornerSection() {
  const [video, setVideo] = useState<YouTubeVideo | null>(null);

  useEffect(() => {
    // Get a random shithousery video on mount
    const randomVideo = getRandomShithouseryVideo();
    setVideo(randomVideo);
  }, []);

  if (!video) {
    return (
      <div className="my-8">
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 shadow-medium">
          <div className="flex items-center justify-center h-64">
            <div className="text-zinc-500">Loading Shithouse Corner...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-8">
      {/* Shithouse Corner Header */}
      <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 shadow-medium">
        <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
          <Play className="w-6 h-6 text-orange-500" />
          Shithouse Corner
        </h3>

        <p className="text-zinc-300 mb-6 italic">
          "And now for something completely different - it's time for Shithouse
          Corner, where we celebrate football's finest wind-up merchants and
          masters of the dark arts."
        </p>

        {/* Video Embed */}
        <div className="flex justify-center mb-6">
          <div className="relative w-full max-w-[600px] aspect-video bg-zinc-800 rounded-lg overflow-hidden">
            <iframe
              src={video.embedUrl}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              loading="lazy"
              title={video.title}
            />
          </div>
        </div>

        {/* Video info */}
        <div className="text-center mb-4">
          <p className="text-zinc-200 font-semibold mb-1">{video.title}</p>
          <p className="text-zinc-400 text-sm">by {video.channelName}</p>
        </div>

        {/* Link to YouTube */}
        <div className="text-center mb-4">
          <a
            href={video.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors text-sm font-mono"
          >
            <Play className="w-4 h-4" />
            Watch on YouTube {video.isShort ? "(Short)" : ""}
          </a>
        </div>

        <p className="text-zinc-500 text-xs text-center italic">
          "Remember, it's not cheating if the ref doesn't see it."
        </p>
      </div>
    </div>
  );
}
