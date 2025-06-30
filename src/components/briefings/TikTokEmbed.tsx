/**
 * TikTok Embed Component
 * Embeds TikTok videos in briefings with YouTube fallback
 */

"use client";

import React, { useEffect, useState } from "react";
import { Play, ExternalLink } from "lucide-react";
import {
  getRandomFootballTikTok,
  generateTikTokEmbed,
  getTikTokFallbackYouTube,
  formatTikTokStats,
  type TikTokVideo,
} from "@/lib/media/tikTokSearch";
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
  useTikTok?: boolean; // Toggle between TikTok and YouTube
  fallbackToYouTube?: boolean; // Auto-fallback on TikTok failure
  username?: string;
  description?: string;
  hashtag?: string;
}

export function TikTokEmbed({
  videoId,
  useTikTok = true,
  fallbackToYouTube = true,
  username,
  description,
  hashtag,
}: TikTokEmbedProps) {
  const [tikTokVideo, setTikTokVideo] = useState<TikTokVideo | null>(null);
  const [youTubeVideo, setYouTubeVideo] = useState<YouTubeVideo | null>(null);
  const [showTikTok, setShowTikTok] = useState(useTikTok);
  const [tikTokFailed, setTikTokFailed] = useState(false);

  // Initialize content
  useEffect(() => {
    if (useTikTok) {
      const randomTikTok = getRandomFootballTikTok();
      setTikTokVideo(randomTikTok);
    }

    // Always prepare YouTube fallback
    const randomYouTube = getRandomShithouseryVideo();
    setYouTubeVideo(randomYouTube);
  }, [useTikTok]);

  const embedUrl = tikTokVideo
    ? tikTokVideo.url
    : `https://www.tiktok.com/@${username || "433"}/video/${videoId || "7380650297168596256"}`;

  // TikTok script loading with fallback handling
  useEffect(() => {
    if (showTikTok && !tikTokFailed) {
      const timer = setTimeout(() => {
        // Load TikTok embed script if not already loaded
        if (
          !document.querySelector(
            'script[src="https://www.tiktok.com/embed.js"]',
          )
        ) {
          const script = document.createElement("script");
          script.src = "https://www.tiktok.com/embed.js";
          script.async = true;

          // Handle script load failure
          script.onerror = () => {
            console.warn(
              "TikTok embed script failed to load, falling back to YouTube",
            );
            setTikTokFailed(true);
            if (fallbackToYouTube) {
              setShowTikTok(false);
            }
          };

          document.body.appendChild(script);
        }

        // Set a timeout to fallback if TikTok doesn't load
        const fallbackTimer = setTimeout(() => {
          if (
            fallbackToYouTube &&
            !document.querySelector(".tiktok-embed iframe")
          ) {
            console.warn("TikTok embed timeout, falling back to YouTube");
            setTikTokFailed(true);
            setShowTikTok(false);
          }
        }, 5000);

        return () => clearTimeout(fallbackTimer);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [showTikTok, tikTokFailed, fallbackToYouTube]);

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

        {/* Smart Video Embed - TikTok with YouTube fallback */}
        <div className="flex justify-center mb-6">
          {showTikTok && tikTokVideo && !tikTokFailed ? (
            // TikTok Embed
            <div className="w-full max-w-[325px]">
              <blockquote
                className="tiktok-embed"
                cite={tikTokVideo.url}
                data-video-id={tikTokVideo.id}
                style={{
                  maxWidth: "605px",
                  minWidth: "325px",
                  background: "#0f0f0f",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <section>
                  <a
                    target="_blank"
                    title={`@${tikTokVideo.author.username}`}
                    href={`https://www.tiktok.com/@${tikTokVideo.author.username}?refer=embed`}
                    className="text-orange-400 font-bold"
                  >
                    @{tikTokVideo.author.username}
                  </a>
                  <p className="text-white my-2">{tikTokVideo.description}</p>
                  <a
                    target="_blank"
                    title={`♬ original sound - ${tikTokVideo.author.nickname}`}
                    href={`${tikTokVideo.url}?refer=embed`}
                    className="text-zinc-400 text-sm"
                  >
                    ♬ original sound - {tikTokVideo.author.nickname}
                  </a>
                </section>
              </blockquote>
              <div className="text-center mt-2">
                <span className="text-xs text-zinc-500">
                  {formatTikTokStats(tikTokVideo.stats)}
                </span>
              </div>
            </div>
          ) : (
            // YouTube Fallback
            <div className="relative w-full max-w-[600px] aspect-video bg-zinc-800 rounded-lg overflow-hidden">
              <iframe
                src={
                  youTubeVideo?.embedUrl ||
                  "https://www.youtube.com/embed/ALZHF5UqnU4"
                }
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                loading="lazy"
                title={
                  youTubeVideo?.title || "Football Shithousery Compilation"
                }
              />
              {tikTokFailed && (
                <div className="absolute top-2 right-2 bg-orange-600 text-white text-xs px-2 py-1 rounded">
                  YouTube Backup
                </div>
              )}
            </div>
          )}
        </div>

        {/* Platform Toggle & Links */}
        <div className="flex justify-center gap-4 mb-4">
          {tikTokVideo && (
            <a
              href={tikTokVideo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors text-sm font-mono"
            >
              <Play className="w-4 h-4" />
              {showTikTok && !tikTokFailed
                ? "Watch on TikTok"
                : "View TikTok Version"}
            </a>
          )}

          {youTubeVideo && (
            <a
              href={youTubeVideo.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm font-mono"
            >
              <ExternalLink className="w-4 h-4" />
              YouTube Version
            </a>
          )}

          {!showTikTok && fallbackToYouTube && (
            <button
              onClick={() => {
                setShowTikTok(true);
                setTikTokFailed(false);
              }}
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-300 transition-colors text-sm"
            >
              Try TikTok Again
            </button>
          )}
        </div>

        {/* Video info */}
        <div className="flex items-center justify-between text-sm mb-4">
          <p className="text-zinc-400">
            {showTikTok && tikTokVideo && !tikTokFailed ? (
              <>
                @{tikTokVideo.author.username} -{" "}
                {tikTokVideo.description.substring(0, 60)}...
              </>
            ) : youTubeVideo ? (
              <>
                {youTubeVideo.channelName} - {youTubeVideo.title}
              </>
            ) : (
              <>
                @{username || "433"} - {description || "Football content"}
              </>
            )}
          </p>
          <a
            href={
              showTikTok
                ? `https://www.tiktok.com/tag/footballshithousery`
                : `https://www.youtube.com/results?search_query=football+shithousery`
            }
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
