/**
 * Embed Skeleton Component
 * Consistent loading states for embedded content
 */

import React from "react";
import { clsx } from "clsx";

interface EmbedSkeletonProps {
  type?: "tweet" | "tiktok" | "image" | "generic";
  className?: string;
}

export function EmbedSkeleton({
  type = "generic",
  className = "",
}: EmbedSkeletonProps) {
  if (type === "tweet") {
    return (
      <div
        className={clsx(
          "bg-zinc-900 p-4 rounded-lg border border-zinc-800 my-8 animate-pulse",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-zinc-800 rounded-full"></div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-24 bg-zinc-800 rounded-md"></div>
              <div className="h-4 w-20 bg-zinc-800 rounded-md"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-zinc-800 rounded-md"></div>
              <div className="h-4 w-3/4 bg-zinc-800 rounded-md"></div>
            </div>
            <div className="flex gap-6 mt-4">
              <div className="h-4 w-16 bg-zinc-800 rounded-md"></div>
              <div className="h-4 w-16 bg-zinc-800 rounded-md"></div>
              <div className="h-4 w-16 bg-zinc-800 rounded-md"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "tiktok") {
    return (
      <div
        className={clsx(
          "bg-zinc-900 rounded-lg p-6 border border-zinc-800 my-8 animate-pulse",
          className,
        )}
      >
        <div className="aspect-[9/16] max-w-[325px] mx-auto bg-zinc-800 rounded-lg"></div>
        <div className="mt-4 space-y-2">
          <div className="h-4 w-3/4 bg-zinc-800 rounded-md mx-auto"></div>
          <div className="h-4 w-1/2 bg-zinc-800 rounded-md mx-auto"></div>
        </div>
      </div>
    );
  }

  if (type === "image") {
    return (
      <div className={clsx("my-8 animate-pulse", className)}>
        <div className="aspect-video bg-zinc-800 rounded-lg"></div>
        <div className="h-3 w-2/3 bg-zinc-800 rounded-md mt-3 mx-auto"></div>
      </div>
    );
  }

  // Generic embed skeleton
  return (
    <div
      className={clsx(
        "bg-zinc-900 p-6 rounded-lg border border-zinc-800 my-8 animate-pulse",
        className,
      )}
    >
      <div className="space-y-3">
        <div className="h-4 w-full bg-zinc-800 rounded-md"></div>
        <div className="h-4 w-5/6 bg-zinc-800 rounded-md"></div>
        <div className="h-4 w-4/6 bg-zinc-800 rounded-md"></div>
      </div>
    </div>
  );
}
