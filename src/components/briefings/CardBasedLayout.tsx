/**
 * Card-Based Briefing Layout
 * Sky Sports Transfer Centre inspired layout with story cards
 */

import React from 'react';
import { BriefingCard } from './BriefingCard';
import { PolaroidFrame } from './PolaroidFrame';
import type { BriefingWithRelations, BriefingSection } from '@/types/briefing';

interface CardBasedLayoutProps {
  briefing: BriefingWithRelations;
  onShare?: (platform: string) => void;
  className?: string;
}

export function CardBasedLayout({ briefing, onShare, className = '' }: CardBasedLayoutProps) {
  const sections = briefing.content as BriefingSection[];
  const visualTimeline = briefing.visualTimeline as any;

  // Extract polaroids for inline display
  const polaroidMap = new Map<string, any>();
  if (visualTimeline?.items) {
    visualTimeline.items.forEach((item: any) => {
      if (item.polaroid) {
        // Map polaroids to sections they relate to
        polaroidMap.set(item.id, item.polaroid);
      }
    });
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-black mb-2">
          {briefing.title.main}
        </h1>
        {briefing.title.subtitle && (
          <p className="text-xl text-zinc-400">
            {briefing.title.subtitle}
          </p>
        )}
        
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-zinc-500">
          <time>
            {new Date(briefing.timestamp).toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </time>
          <span>•</span>
          <span>{briefing.readTime} min read</span>
          <span>•</span>
          <span>{briefing._count?.feedItems || 0} stories</span>
        </div>

        {/* Share buttons */}
        {onShare && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => onShare('twitter')}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm transition-colors"
              aria-label="Share on Twitter"
            >
              Share on X
            </button>
            <button
              onClick={() => onShare('copy')}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm transition-colors"
              aria-label="Copy link"
            >
              Copy Link
            </button>
          </div>
        )}
      </header>

      {/* Story Cards */}
      <div className="space-y-6">
        {sections.map((section, index) => (
          <div key={section.id} className="relative">
            <BriefingCard 
              section={section} 
              timestamp={briefing.timestamp}
              index={index}
            />
            
            {/* Inline Polaroid - positioned after specific story types */}
            {section.type === 'transfer' && index % 3 === 1 && polaroidMap.size > 0 && (
              <div className="mt-6 flex justify-center">
                <div className="relative">
                  <PolaroidFrame
                    image={{
                      url: Array.from(polaroidMap.values())[index % polaroidMap.size]?.url || '/placeholder.jpg',
                      altText: Array.from(polaroidMap.values())[index % polaroidMap.size]?.altText || 'Player',
                    }}
                    caption={Array.from(polaroidMap.values())[index % polaroidMap.size]?.caption}
                    timestamp={new Date()}
                    angle={Math.random() * 10 - 5}
                  />
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-zinc-600 font-mono">
                    Via Wikipedia Commons
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-zinc-800">
        <div className="text-center">
          <p className="text-sm text-zinc-500 mb-4">
            The Terry needs a lie down after all that. Same time next hour?
          </p>
          
          {/* Related Tags */}
          {briefing.tags && briefing.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {briefing.tags.map((bt: any) => (
                <span 
                  key={bt.tag.id}
                  className="text-xs px-3 py-1 bg-zinc-800 rounded-full"
                >
                  #{bt.tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}