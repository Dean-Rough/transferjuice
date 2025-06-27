/**
 * Polaroid Frame Component
 * Instagram-style instant photo frames with captions
 */

import React from "react";
import Image from "next/image";

interface PolaroidFrameProps {
  image: {
    url: string;
    altText: string;
  };
  caption?: string;
  timestamp: Date;
  angle?: number;
  className?: string;
}

export function PolaroidFrame({
  image,
  caption,
  timestamp,
  angle = 0,
  className = "",
}: PolaroidFrameProps) {
  return (
    <div
      className={`inline-block ${className}`}
      style={{ transform: `rotate(${angle}deg)` }}
    >
      <div className="bg-white p-3 shadow-xl">
        <div className="relative w-64 h-64 bg-zinc-100">
          <Image
            src={image.url}
            alt={image.altText}
            fill
            className="object-cover"
            sizes="256px"
          />
        </div>

        <div className="mt-3 space-y-1">
          {caption && (
            <p className="text-sm text-black font-handwriting text-center px-2">
              {caption}
            </p>
          )}

          <time className="block text-xs text-gray-600 text-center">
            {timestamp.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
      </div>
    </div>
  );
}
