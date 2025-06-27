/**
 * Briefing Layout Components
 * Different layout options for briefing content sections
 */

import React from "react";
import Image from "next/image";

interface LayoutProps {
  image?: {
    src: string;
    alt: string;
    caption?: string;
  };
  content: string | React.ReactNode;
  className?: string;
}

/**
 * 50/50 Split Layout - Image on left, text on right
 */
export function SplitLayout({ image, content, className = "" }: LayoutProps) {
  return (
    <div
      className={`split-layout flex flex-col md:flex-row gap-6 md:gap-8 items-start ${className}`}
    >
      {/* Image Column - 50% on desktop, full width on mobile */}
      {image && (
        <div className="w-full md:w-1/2 flex-shrink-0">
          <figure className="briefing-image-split">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            {image.caption && (
              <figcaption className="text-sm text-zinc-400 mt-2">
                {image.caption}
              </figcaption>
            )}
          </figure>
        </div>
      )}

      {/* Text Column - 50% on desktop, full width on mobile */}
      <div className="w-full md:w-1/2">
        <div className="text-content text-left">
          {typeof content === "string" ? (
            <p className="text-zinc-200 leading-relaxed">{content}</p>
          ) : (
            content
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Image Right Layout - Text flows around image on right
 */
export function ImageRightLayout({
  image,
  content,
  className = "",
}: LayoutProps) {
  return (
    <div className={`image-right-layout ${className}`}>
      {image && (
        <figure className="briefing-image float-right ml-6 mb-4 w-full md:w-1/2 max-w-[400px]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
          {image.caption && (
            <figcaption className="text-sm text-zinc-400 mt-2 text-left">
              {image.caption}
            </figcaption>
          )}
        </figure>
      )}
      <div className="text-content text-left">
        {typeof content === "string" ? (
          <p className="text-zinc-200 leading-relaxed">{content}</p>
        ) : (
          content
        )}
      </div>
    </div>
  );
}

/**
 * Full Width Image Layout - Image above text
 */
export function FullImageLayout({
  image,
  content,
  className = "",
}: LayoutProps) {
  return (
    <div className={`full-image-layout ${className}`}>
      {image && (
        <figure className="briefing-image-full mb-6">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
          {image.caption && (
            <figcaption className="text-sm text-zinc-400 mt-2 text-left">
              {image.caption}
            </figcaption>
          )}
        </figure>
      )}
      <div className="text-content text-left">
        {typeof content === "string" ? (
          <p className="text-zinc-200 leading-relaxed">{content}</p>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
