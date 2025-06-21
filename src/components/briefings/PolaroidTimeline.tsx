'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { PolaroidImage } from '@/lib/types/briefing';
import { generatePlayerFrame, type GeneratedFrame } from '@/lib/images/frameGenerator';
import { findPlayer } from '@/lib/players/playerDatabase';

interface PolaroidTimelineProps {
  playerNames: string[]; // Changed from polaroids to player names
  scrollPosition: number; // 0-1 representing scroll progress
  contentHeight: number;
  className?: string;
}

interface VisiblePolaroid extends GeneratedFrame {
  isVisible: boolean;
  opacity: number;
  scale: number;
  translateY: number;
  rotation: number;
}

export function PolaroidTimeline({ 
  playerNames, 
  scrollPosition, 
  contentHeight, 
  className = '' 
}: PolaroidTimelineProps) {
  const [generatedFrames, setGeneratedFrames] = useState<GeneratedFrame[]>([]);
  const [visiblePolaroids, setVisiblePolaroids] = useState<VisiblePolaroid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Generate frames for all players
  useEffect(() => {
    const generateFrames = async () => {
      setIsLoading(true);
      const frames: GeneratedFrame[] = [];
      
      for (const playerName of playerNames) {
        try {
          // Generate random rotation for each frame (±8 degrees)
          const rotation = (Math.random() - 0.5) * 16;
          
          const frame = await generatePlayerFrame(playerName, {
            rotation,
            maxWidth: 200,
            maxHeight: 250,
          });
          
          if (frame) {
            frames.push(frame);
          }
        } catch (error) {
          console.error(`Error generating frame for ${playerName}:`, error);
        }
      }
      
      setGeneratedFrames(frames);
      setIsLoading(false);
    };

    if (playerNames.length > 0) {
      generateFrames();
    }
  }, [playerNames]);

  // Calculate polaroid visibility and animations based on scroll
  useEffect(() => {
    const calculateVisibility = () => {
      const visible = generatedFrames.map((frame, index) => {
        // Each polaroid appears at different scroll positions
        const appearAt = (index + 1) / (generatedFrames.length + 1);
        const disappearAt = Math.min(appearAt + 0.3, 1); // Visible for 30% of scroll
        
        let isVisible = false;
        let opacity = 0;
        let scale = 0.8;
        let translateY = 20;

        if (scrollPosition >= appearAt && scrollPosition <= disappearAt) {
          isVisible = true;
          
          // Calculate fade in/out based on position within visibility window
          const visibilityProgress = (scrollPosition - appearAt) / (disappearAt - appearAt);
          
          if (visibilityProgress <= 0.2) {
            // Fade in
            opacity = visibilityProgress / 0.2;
            scale = 0.8 + (0.2 * opacity);
            translateY = 20 * (1 - opacity);
          } else if (visibilityProgress >= 0.8) {
            // Fade out
            const fadeOut = (1 - visibilityProgress) / 0.2;
            opacity = fadeOut;
            scale = 0.8 + (0.2 * fadeOut);
            translateY = 20 * (1 - fadeOut);
          } else {
            // Fully visible
            opacity = 1;
            scale = 1;
            translateY = 0;
          }
        }

        return {
          ...frame,
          isVisible,
          opacity,
          scale,
          translateY,
          rotation: (Math.random() - 0.5) * 16, // Random rotation for each render
        };
      });

      setVisiblePolaroids(visible);
    };

    if (!isLoading) {
      calculateVisibility();
    }
  }, [generatedFrames, scrollPosition, contentHeight, isLoading]);

  // Handle polaroid interaction
  const handlePolaroidClick = (frame: GeneratedFrame) => {
    // Could implement lightbox or player detail modal
    console.log('Clicked polaroid:', frame.playerName);
  };

  const handlePolaroidHover = (frame: GeneratedFrame, isHovering: boolean) => {
    // Could implement hover effects or preview
    if (isHovering) {
      console.log('Hovering:', frame.playerName);
    }
  };

  return (
    <div 
      ref={timelineRef}
      className={`polaroid-timeline relative w-full h-full overflow-hidden ${className}`}
      data-testid="polaroid-timeline"
    >
      {/* Timeline Background */}
      <div className="timeline-background absolute inset-0">
        <div className="timeline-line absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-border to-transparent transform -translate-x-0.5" />
        
        {/* Timeline dots for visual interest */}
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="timeline-dot absolute left-1/2 w-2 h-2 bg-muted rounded-full transform -translate-x-1/2"
            style={{
              top: `${(index + 1) * 20}%`,
              opacity: 0.5,
            }}
          />
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-muted-foreground">
              Generating polaroids...
            </p>
          </div>
        </div>
      )}

      {/* Polaroid Images */}
      <div className="polaroids-container relative z-10">
        {!isLoading && visiblePolaroids.map((frame, index) => (
          <div
            key={`${frame.playerName}-${index}`}
            className="polaroid-wrapper absolute cursor-pointer transform transition-all duration-500 ease-out"
            style={{
              left: index % 2 === 0 ? '10%' : '60%', // Alternate sides
              top: `${20 + (index * 15)}%`, // Stagger vertically
              opacity: frame.opacity,
              transform: `
                rotate(${frame.rotation}deg) 
                scale(${frame.scale})
                translateY(${frame.translateY}px)
              `,
              visibility: frame.isVisible ? 'visible' : 'hidden',
            }}
            onClick={() => handlePolaroidClick(frame)}
            onMouseEnter={() => handlePolaroidHover(frame, true)}
            onMouseLeave={() => handlePolaroidHover(frame, false)}
            data-testid={`polaroid-${frame.playerName}`}
            aria-label={`Player photo: ${frame.playerName}`}
          >
            {/* Use the generated frame directly - it already includes borders and text */}
            <div className="generated-frame-wrapper hover:shadow-xl transition-shadow duration-300">
              <Image
                src={frame.url}
                alt={`Polaroid-style photo of ${frame.playerName}`}
                width={frame.width}
                height={frame.height}
                className="generated-frame"
                sizes="(max-width: 768px) 150px, 200px"
                loading="lazy"
                onError={(e) => {
                  // Fallback to placeholder on error
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/player-placeholder.jpg';
                }}
              />
            </div>
            
            {/* Hover effect overlay */}
            <div className="polaroid-overlay absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-5 transition-all duration-300 rounded pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Floating particles for visual enhancement */}
      <div className="particles absolute inset-0 pointer-events-none">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="particle absolute w-1 h-1 bg-muted rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animation: `float 10s infinite ease-in-out`,
            }}
          />
        ))}
      </div>

      {/* Enhanced styles */}
      <style jsx>{`
        .polaroid-wrapper:hover {
          z-index: 20;
        }

        .polaroid-wrapper:hover .generated-frame-wrapper {
          transform: scale(1.05);
        }

        .generated-frame-wrapper {
          transition: all 0.3s ease;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 
            0 4px 8px rgba(0, 0, 0, 0.1),
            0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .generated-frame-wrapper:hover {
          box-shadow: 
            0 8px 16px rgba(0, 0, 0, 0.2),
            0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .generated-frame {
          display: block;
          border-radius: 4px;
        }

        /* Loading state styling */
        .loading-state {
          background: rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(2px);
        }

        /* Particle animation */
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-20px) translateX(10px) scale(1.1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-10px) translateX(-10px) scale(0.9);
            opacity: 0.4;
          }
          75% {
            transform: translateY(-15px) translateX(5px) scale(1.05);
            opacity: 0.5;
          }
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .polaroid-wrapper {
            position: relative !important;
            left: auto !important;
            top: auto !important;
            display: inline-block;
            margin: 0.5rem;
          }

          .polaroids-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            padding: 1rem;
          }

          .timeline-background {
            display: none;
          }

          .particles {
            display: none;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .polaroid-wrapper {
            transition: opacity 0.3s ease;
          }

          .polaroid-frame {
            transition: box-shadow 0.3s ease;
          }

          .particle {
            animation: none;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .polaroid-frame {
            border: 2px solid #000;
          }

          .timeline-line {
            background: #000;
          }

          .timeline-dot {
            background: #000;
          }
        }

        /* Loading states */
        .polaroid-image img[src=""] {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }

        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        /* Focus management for accessibility */
        .polaroid-wrapper:focus-visible {
          outline: 2px solid hsl(var(--tj-orange));
          outline-offset: 4px;
          border-radius: 4px;
        }

        /* Screen reader support */
        .polaroid-wrapper[aria-label] {
          position: relative;
        }

        .polaroid-wrapper[aria-label]::after {
          content: attr(aria-label);
          position: absolute;
          left: -9999px;
          width: 1px;
          height: 1px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}