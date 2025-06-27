"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { BriefingWithRelations } from "@/types/briefing";

interface ImageTimelineProps {
  briefings: BriefingWithRelations[];
}

interface TimelineImage {
  id: string;
  url: string;
  caption: string;
  playerName?: string;
  clubName?: string;
  briefingIndex: number;
  timestamp: Date;
}

export function ImageTimeline({ briefings }: ImageTimelineProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [images, setImages] = useState<TimelineImage[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Generate timeline images from briefings
  useEffect(() => {
    const timelineImages: TimelineImage[] = [];

    briefings.forEach((briefing, briefingIndex) => {
      // Extract player names from feed items for image generation
      briefing.feedItems?.forEach((item: any) => {
        // Extract potential player names from content
        const content = item.content.toLowerCase();

        // Common player name patterns in transfer news
        const playerMatches = content.match(/\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g);
        const clubMatches = content.match(
          /\b(Arsenal|Chelsea|Liverpool|Manchester United|Manchester City|Real Madrid|Barcelona|Bayern Munich|PSG|Juventus)\b/gi,
        );

        if (playerMatches) {
          playerMatches
            .slice(0, 2)
            .forEach((playerName: string, idx: number) => {
              timelineImages.push({
                id: `${briefing.id}-${item.id}-${idx}`,
                url: `/api/images/player-polaroid?name=${encodeURIComponent(playerName)}&style=vintage`,
                caption: `${playerName} - ${clubMatches?.[0] || "Transfer Update"}`,
                playerName,
                clubName: clubMatches?.[0],
                briefingIndex,
                timestamp: new Date(item.publishedAt),
              });
            });
        }
      });

      // Add some default club/league images
      const clubs = [
        "Arsenal",
        "Chelsea",
        "Liverpool",
        "Man City",
        "Real Madrid",
      ];
      const randomClub = clubs[Math.floor(Math.random() * clubs.length)];

      timelineImages.push({
        id: `${briefing.id}-club`,
        url: `/api/images/club-badge?name=${encodeURIComponent(randomClub)}`,
        caption: `${randomClub} Transfer Activity`,
        clubName: randomClub,
        briefingIndex,
        timestamp: new Date(briefing.timestamp),
      });
    });

    setImages(timelineImages);
  }, [briefings]);

  // Auto-advance images every 8 seconds
  useEffect(() => {
    if (images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [images.length]);

  // Sync with main content scroll
  useEffect(() => {
    const handleScroll = () => {
      // Listen for scroll events from main content
      const briefingElements = document.querySelectorAll(
        "[data-briefing-index]",
      );
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      let activeIndex = 0;
      briefingElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2) {
          activeIndex = index;
        }
      });

      // Find images for the active briefing
      const relevantImages = images.filter(
        (img) => img.briefingIndex === activeIndex,
      );
      if (relevantImages.length > 0) {
        const imageIndex = images.findIndex(
          (img) => img.id === relevantImages[0].id,
        );
        if (imageIndex >= 0) {
          setCurrentImage(imageIndex);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [images]);

  if (images.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center text-zinc-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-lg flex items-center justify-center">
            📷
          </div>
          <p>Loading polaroids...</p>
        </div>
      </div>
    );
  }

  const currentImg = images[currentImage];

  return (
    <div ref={timelineRef} className="h-full flex flex-col">
      {/* Current Image Display */}
      <div className="flex-1 relative overflow-hidden bg-zinc-900">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative w-full max-w-sm">
            {/* Polaroid Frame Effect */}
            <div className="bg-white p-4 pb-16 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="relative aspect-square overflow-hidden bg-zinc-200">
                <Image
                  src={currentImg.url}
                  alt={currentImg.caption}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    // Fallback to placeholder
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/transfer-placeholder.jpg";
                  }}
                />
              </div>

              {/* Polaroid Caption */}
              <div className="mt-4 text-center">
                <p className="text-black text-sm font-handwriting">
                  {currentImg.caption}
                </p>
                <p className="text-black text-xs opacity-60 mt-1">
                  {currentImg.timestamp.toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Image Counter */}
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
          {currentImage + 1} / {images.length}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() =>
            setCurrentImage((prev) =>
              prev === 0 ? images.length - 1 : prev - 1,
            )
          }
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
        >
          ←
        </button>
        <button
          onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
        >
          →
        </button>
      </div>

      {/* Timeline Thumbnails */}
      <div className="h-32 border-t border-zinc-800 bg-zinc-950 p-4 overflow-x-auto">
        <div className="flex gap-3 h-full">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setCurrentImage(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentImage
                  ? "border-orange-500 scale-110"
                  : "border-zinc-700 hover:border-zinc-500"
              }`}
            >
              <Image
                src={image.url}
                alt={image.caption}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/images/transfer-placeholder.jpg";
                }}
              />

              {/* Active indicator */}
              {index === currentImage && (
                <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Current Image Info */}
      <div className="p-4 bg-zinc-900 border-t border-zinc-800">
        <h3 className="text-white font-semibold text-sm mb-1">
          {currentImg.playerName || currentImg.clubName}
        </h3>
        <p className="text-zinc-400 text-xs">{currentImg.caption}</p>
        <p className="text-zinc-500 text-xs mt-1">
          {currentImg.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
