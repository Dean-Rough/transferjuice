'use client';

import { useState } from 'react';

interface TerryCommentaryProps {
  commentary: string;
  className?: string;
  isExpandable?: boolean;
}

export function TerryCommentary({
  commentary,
  className = '',
  isExpandable = true,
}: TerryCommentaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldTruncate = isExpandable && commentary.length > 200;
  const displayCommentary =
    shouldTruncate && !isExpanded
      ? `${commentary.substring(0, 200)}...`
      : commentary;

  return (
    <div
      className={`terry-bubble relative ${className}`}
      data-testid='terry-commentary'
    >
      {/* Commentary content with Bouchers Sans */}
      <blockquote className='text-lg leading-relaxed'>
        {displayCommentary}
      </blockquote>

      {/* Expand/collapse button */}
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className='mt-2 text-brand-orange-500 hover:text-brand-orange-400 text-xs font-medium'
          data-testid='terry-expand-button'
        >
          {isExpanded ? 'Less Terry' : 'More Terry'}
        </button>
      )}

      {/* Voice consistency indicator */}
      <div className='flex items-center justify-end mt-2 space-x-1'>
        <span className='text-xs text-gray-400'>Voice Score:</span>
        <div className='flex space-x-px'>
          {[1, 2, 3, 4, 5].map((dot) => (
            <div
              key={dot}
              className={`w-1 h-1 rounded-full ${
                dot <= 4 // Mock 4/5 consistency score
                  ? 'bg-brand-orange-500'
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
        <span className='text-xs text-brand-orange-400'>92%</span>
      </div>
    </div>
  );
}
