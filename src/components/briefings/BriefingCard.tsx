/**
 * Sky-style Briefing Card Component
 * Individual story card with header, headline, and content
 */

import React from 'react';
import Image from 'next/image';
import type { BriefingSection } from '@/types/briefing';

interface BriefingCardProps {
  section: BriefingSection;
  timestamp: Date;
  index: number;
}

export function BriefingCard({ section, timestamp, index }: BriefingCardProps) {
  const cardTime = new Date(timestamp);
  cardTime.setMinutes(cardTime.getMinutes() + (index * 5)); // Stagger times for visual variety

  return (
    <div className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all">
      {/* Card Header - Small mono font with time */}
      <div className="px-6 py-3 bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <time className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
            {cardTime.toLocaleTimeString('en-GB', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })} • {cardTime.toLocaleDateString('en-GB', { 
              day: 'numeric',
              month: 'short' 
            })}
          </time>
          {section.type === 'breaking' && (
            <span className="text-xs font-bold text-red-500 animate-pulse">
              🚨 BREAKING
            </span>
          )}
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
          {section.content.split('\n\n').map((paragraph, i) => (
            <p key={i} className="text-zinc-300 leading-relaxed mb-4 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Metadata */}
        {section.metadata && (
          <div className="mt-6 pt-4 border-t border-zinc-800">
            <div className="flex flex-wrap gap-4 text-sm">
              {section.metadata.clubs && section.metadata.clubs.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">Clubs:</span>
                  <div className="flex gap-1">
                    {section.metadata.clubs.map((club) => (
                      <span 
                        key={club}
                        className="px-2 py-1 bg-zinc-800 rounded text-xs font-medium"
                      >
                        {club}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {section.metadata.players && section.metadata.players.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">Players:</span>
                  <div className="flex gap-1">
                    {section.metadata.players.map((player) => (
                      <span 
                        key={player}
                        className="px-2 py-1 bg-zinc-800 rounded text-xs font-medium"
                      >
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