/**
 * Visual Timeline Component
 * Displays transfer timeline with polaroid images
 */

import React from 'react';
import Image from 'next/image';
import type { TimelineItem } from '@/types/briefing';

interface VisualTimelineProps {
  items: TimelineItem[];
  feedItems: any[];
}

export function VisualTimeline({ items }: VisualTimelineProps) {
  if (!items || items.length === 0) {
    return (
      <div className="timeline-empty text-center py-12 text-zinc-500">
        <p>No timeline items yet</p>
      </div>
    );
  }

  return (
    <div className="visual-timeline relative">
      {/* Timeline line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-zinc-800" />
      
      {/* Timeline items */}
      <div className="timeline-items space-y-8">
        {items.map((item, index) => (
          <TimelineEntry 
            key={item.id} 
            item={item} 
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineEntry({ item, index }: { item: TimelineItem; index: number }) {
  const typeColors = {
    transfer: 'bg-green-500',
    rumour: 'bg-blue-500',
    update: 'bg-yellow-500',
    partner: 'bg-purple-500',
  };

  const typeIcons = {
    transfer: '✅',
    rumour: '🗣️',
    update: '📰',
    partner: '🤝',
  };

  return (
    <div className="timeline-entry relative flex gap-4">
      {/* Time marker */}
      <div className="timeline-marker relative z-10">
        <div className={`w-16 h-16 rounded-full ${typeColors[item.type]} flex items-center justify-center`}>
          <span className="text-2xl">{typeIcons[item.type]}</span>
        </div>
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-zinc-500 whitespace-nowrap">
          {item.time}
        </div>
      </div>

      {/* Content */}
      <div className="timeline-content flex-1 pt-2">
        <h3 className="text-lg font-bold mb-1 text-white">
          {item.title}
        </h3>
        <p className="text-sm text-zinc-400 mb-3">
          {item.description}
        </p>

        {/* Polaroid if player is mentioned */}
        {item.polaroid && (
          <div className="timeline-polaroid mt-4">
            <Polaroid 
              playerName={item.polaroid.playerName}
              clubName={item.polaroid.clubName}
              imageUrl={item.polaroid.imageUrl}
              frameColor={item.polaroid.frameColor}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Polaroid({ 
  playerName, 
  clubName, 
  imageUrl, 
  frameColor 
}: {
  playerName: string;
  clubName: string;
  imageUrl: string;
  frameColor: string;
}) {
  return (
    <div 
      className="polaroid-frame relative inline-block transform hover:rotate-1 transition-transform"
      style={{ backgroundColor: frameColor }}
    >
      <div className="polaroid-inner bg-white p-2 shadow-xl">
        {imageUrl ? (
          <div className="polaroid-image relative w-48 h-48 bg-gray-100">
            <Image
              src={imageUrl}
              alt={playerName}
              fill
              className="object-cover"
              sizes="192px"
            />
          </div>
        ) : (
          <div className="polaroid-placeholder w-48 h-48 bg-zinc-900 flex items-center justify-center">
            <span className="text-6xl text-zinc-700">
              {playerName.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
        )}
        
        <div className="polaroid-caption mt-2 text-center">
          <p className="text-sm font-bold text-black">{playerName}</p>
          <p className="text-xs text-gray-600">{clubName}</p>
        </div>
      </div>

      <style jsx>{`
        .polaroid-frame {
          padding: 4px;
          transform: rotate(-2deg);
        }

        .polaroid-inner {
          transform: rotate(1deg);
        }

        .polaroid-frame:hover {
          transform: rotate(0deg) scale(1.05);
        }

        .polaroid-frame::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, 
            transparent 30%, 
            rgba(255,255,255,0.1) 50%, 
            transparent 70%
          );
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}