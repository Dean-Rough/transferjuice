/**
 * Enhanced Briefing Content Component
 * Processes HTML content to properly display tweets, images, and other media
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { AlertCircle, RefreshCw } from "lucide-react";

interface EnhancedBriefingContentProps {
  htmlContent: string;
  className?: string;
}

export function EnhancedBriefingContent({
  htmlContent,
  className = "",
}: EnhancedBriefingContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [twitterError, setTwitterError] = useState(false);
  const [twitterLoading, setTwitterLoading] = useState(false);

  useEffect(() => {
    // Check if content contains Twitter embeds
    const hasTwitterEmbed =
      htmlContent.includes("twitter.com") || htmlContent.includes("x.com");
    if (!hasTwitterEmbed) return;

    setTwitterLoading(true);

    // Load Twitter widgets script if not already loaded
    if (
      !document.querySelector(
        'script[src="https://platform.twitter.com/widgets.js"]',
      )
    ) {
      const script = document.createElement("script");
      script.src = "https://platform.twitter.com/widgets.js";
      script.async = true;
      document.body.appendChild(script);

      // When script loads, process any Twitter embeds
      script.onload = () => {
        try {
          if ((window as any).twttr && (window as any).twttr.widgets) {
            (window as any).twttr.widgets
              .load(contentRef.current)
              .then(() => {
                setTwitterLoading(false);
              })
              .catch(() => {
                setTwitterError(true);
                setTwitterLoading(false);
              });
          } else {
            setTwitterError(true);
            setTwitterLoading(false);
          }
        } catch (error) {
          setTwitterError(true);
          setTwitterLoading(false);
        }
      };

      script.onerror = () => {
        setTwitterError(true);
        setTwitterLoading(false);
      };
    } else if ((window as any).twttr && (window as any).twttr.widgets) {
      // Script already loaded, just process widgets
      try {
        (window as any).twttr.widgets
          .load(contentRef.current)
          .then(() => {
            setTwitterLoading(false);
          })
          .catch(() => {
            setTwitterError(true);
            setTwitterLoading(false);
          });
      } catch (error) {
        setTwitterError(true);
        setTwitterLoading(false);
      }
    } else {
      setTwitterLoading(false);
    }
  }, [htmlContent]);

  // Sanitize HTML to prevent XSS but keep necessary tags
  const sanitizedContent = DOMPurify.sanitize(htmlContent, {
    ADD_TAGS: ["iframe", "blockquote", "script", "figure", "figcaption"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "scrolling",
      "class",
      "data-tweet-id",
      "src",
      "alt",
      "width",
      "height",
      "loading",
    ],
    ALLOW_DATA_ATTR: true,
    KEEP_CONTENT: true,
  });

  return (
    <div className={`briefing-content enhanced-content ${className}`}>
      {/* Twitter loading indicator */}
      {twitterLoading && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-4 flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-zinc-400 animate-spin" />
          <span className="text-sm text-zinc-400">
            Loading Twitter embed...
          </span>
        </div>
      )}

      {/* Twitter error indicator */}
      {twitterError && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-sm text-red-400">Twitter embed failed to load</p>
            <p className="text-xs text-red-400/70">
              Content may still be visible below
            </p>
          </div>
        </div>
      )}

      <div
        ref={contentRef}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    </div>
  );
}
