'use client';

import { useState } from 'react';

interface TagButtonProps {
  tag: string | {
    id?: string;
    name: string;
    displayName?: string;
    type?: string;
    count?: number;
  };
  onClick: (tag: string) => void;
  onRemove?: (tag: string) => void;
  isActive?: boolean;
  size?: 'sm' | 'md';
  variant?: 'primary' | 'secondary' | 'club' | 'player' | 'source';
  className?: string;
  showCount?: boolean;
  showRemove?: boolean;
}

export function TagButton({
  tag,
  onClick,
  onRemove,
  isActive = false,
  size = 'md',
  variant = 'primary',
  className = '',
  showCount = false,
  showRemove = false,
}: TagButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Handle both string and object tag formats
  const tagName = typeof tag === 'string' ? tag : tag.name;
  const displayName = typeof tag === 'string' ? tag : (tag.displayName || tag.name);
  const tagCount = typeof tag === 'object' ? tag.count : undefined;
  const tagType = typeof tag === 'object' ? tag.type?.toLowerCase() : undefined;

  const getTagType = () => {
    if (tagType) return tagType;
    if (displayName.startsWith('#')) return 'club';
    if (displayName.startsWith('@')) return 'player';
    return 'source';
  };

  const getTagIcon = () => {
    // Use variant if provided, otherwise fall back to tag type detection
    const tagType =
      variant === 'club' || variant === 'player' || variant === 'source'
        ? variant
        : getTagType();

    switch (tagType) {
      case 'club':
        return '🏟️';
      case 'player':
        return '⚽';
      case 'source':
        return '📰';
      default:
        return '';
    }
  };

  const getVariantStyles = () => {
    if (isActive) {
      return 'tag-club'; // Active state uses orange club styling
    }

    switch (variant) {
      case 'club':
        return 'tag-club';
      case 'player':
        return 'tag-player';
      case 'source':
        return 'tag-source';
      case 'secondary':
        return 'tag-pill';
      case 'primary':
      default:
        return 'tag-pill';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'md':
      default:
        return 'px-3 py-1.5 text-sm';
    }
  };

  const handleClick = () => {
    onClick(tagName);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(tagName);
    } else {
      onClick(tagName); // Fallback to toggle
    }
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${isActive ? '' : 'opacity-90 hover:opacity-100'}
        transition-all duration-200
        ${className}
      `}
      data-testid={`tag-button-${tagName}`}
      data-tag-type={getTagType()}
      data-active={isActive}
      title={`Filter by ${displayName}`}
    >
      <span className='flex items-center space-x-1'>
        <span className='text-xs'>{getTagIcon()}</span>
        <span className='font-medium'>{displayName}</span>
        {showCount && tagCount && (
          <span className='text-xs opacity-75 ml-1'>({tagCount})</span>
        )}
      </span>

      {(showRemove || (isActive && (isHovered || onRemove))) && (
        <button
          onClick={handleRemove}
          className='ml-1 p-0.5 rounded-full hover:bg-black/20 transition-colors'
          aria-label={`Remove ${displayName} filter`}
          data-testid={`remove-tag-${tagName}`}
        >
          <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
              clipRule='evenodd'
            />
          </svg>
        </button>
      )}
    </button>
  );
}
