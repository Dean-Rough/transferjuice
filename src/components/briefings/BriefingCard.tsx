/**
 * Sky-style Briefing Card Component
 * Individual story card with header, headline, and content
 */

import React from "react";
import Image from "next/image";
import type { BriefingSection } from "@/types/briefing";

interface BriefingCardProps {
  section: BriefingSection;
  timestamp: Date;
  index: number;
}

export function BriefingCard({ section, timestamp, index }: BriefingCardProps) {
  const cardTime = new Date(timestamp);
  cardTime.setMinutes(cardTime.getMinutes() + index * 5); // Stagger times for visual variety

  return (
    <div className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all shadow-medium hover-lift">
      {/* Card Header - Small mono font with time */}
      <div className="px-6 py-3 bg-zinc-950/50 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <time className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
            {cardTime.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            •{" "}
            {cardTime.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </time>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6">
        {/* Headline - Large Geist 900 font */}
        {section.title && (
          <h3 className="text-2xl md:text-3xl font-black mb-4 leading-tight">
            {section.title}
          </h3>
        )}

        {/* Terry's Commentary */}
        <div className="prose prose-invert prose-zinc max-w-none">
          {section.content.includes("<p>") ? (
            <div dangerouslySetInnerHTML={{ __html: section.content }} />
          ) : (
            section.content.split("\n\n").map((paragraph, i) => (
              <p
                key={i}
                className="text-zinc-300 leading-relaxed mb-4 last:mb-0"
              >
                {paragraph}
              </p>
            ))
          )}
        </div>

        {/* Metadata */}
        {section.metadata && (
          <div className="mt-6 pt-4 border-t border-zinc-800">
            <div className="flex flex-wrap gap-4 text-sm">
              {(section.metadata as any)?.clubs &&
                (section.metadata as any)?.clubs.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">Clubs:</span>
                    <div className="flex gap-1">
                      {(section.metadata as any).clubs.map((club: any) => (
                        <span key={club} className="tag-pill tag-club">
                          {club}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {(section.metadata as any)?.players &&
                (section.metadata as any)?.players.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">Players:</span>
                    <div className="flex gap-1">
                      {(section.metadata as any).players.map((player: any) => (
                        <span key={player} className="tag-pill tag-player">
                          {player}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
