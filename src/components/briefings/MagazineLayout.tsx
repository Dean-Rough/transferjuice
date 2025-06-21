'use client';

import { ReactNode, useEffect, useState, useRef } from 'react';
import { PolaroidTimeline } from './PolaroidTimeline';
import { BriefingSidebar } from './BriefingSidebar';
import { BriefingContent } from './BriefingContent';
import { VisualTimeline } from './VisualTimeline';
import type { BriefingWithRelations } from '@/types/briefing';

interface MagazineLayoutProps {
  briefing: BriefingWithRelations;
  onShare?: (platform: string) => void;
  className?: string;
}

export function MagazineLayout({ 
  briefing,
  onShare,
  className = '' 
}: MagazineLayoutProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track scroll position for synchronized effects
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Calculate relative scroll position within content
        const relativeScroll = Math.max(0, -rect.top);
        const maxScroll = Math.max(0, contentRef.current.offsetHeight - windowHeight);
        const scrollProgress = maxScroll > 0 ? relativeScroll / maxScroll : 0;
        
        setScrollPosition(scrollProgress);
      }
    };

    // Calculate content height
    const updateContentHeight = () => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.offsetHeight);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateContentHeight);
    
    // Initial calculations
    handleScroll();
    updateContentHeight();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateContentHeight);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`magazine-layout min-h-screen bg-background ${className}`}
      data-testid="magazine-layout"
    >
      {/* Header */}
      <header className="magazine-header px-4 py-8 md:px-8 lg:px-12 border-b border-zinc-800">
        <div className="max-w-[1400px] mx-auto">
          <time className="text-zinc-500 text-sm uppercase tracking-wider">
            {new Date(briefing.timestamp).toLocaleDateString('en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
          <h1 className="mt-4 text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-white">
            {(briefing.title as any).main}
          </h1>
          {(briefing.title as any).subtitle && (
            <p className="mt-2 text-xl md:text-2xl text-zinc-400">
              {(briefing.title as any).subtitle}
            </p>
          )}
          
          {/* Metadata bar */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            <span>{briefing.readTime} min read</span>
            <span>•</span>
            <span>{briefing.wordCount.toLocaleString()} words</span>
            <span>•</span>
            <span>Terry Score: {Math.round(briefing.terryScore * 100)}%</span>
            {briefing.viewCount > 0 && (
              <>
                <span>•</span>
                <span>{briefing.viewCount.toLocaleString()} views</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Magazine Grid Container */}
      <div className="magazine-grid max-w-[1400px] mx-auto px-4 lg:px-8">
        
        {/* Column 1: Main Content (40%) */}
        <article 
          ref={contentRef}
          className="content-column prose prose-invert max-w-none"
          data-testid="content-column"
        >
          <div className="content-wrapper">
            <BriefingContent 
              sections={briefing.content as any[]} 
              feedItems={briefing.feedItems}
            />
          </div>
        </article>

        {/* Column 2: Visual Timeline (40%) */}
        <aside 
          className="timeline-column"
          data-testid="timeline-column"
        >
          <VisualTimeline
            items={briefing.visualTimeline as any[]}
            feedItems={briefing.feedItems}
          />
        </aside>

        {/* Column 3: Sidebar (20%) */}
        <aside 
          className="sidebar-column"
          data-testid="sidebar-column"
        >
          <BriefingSidebar
            sections={briefing.sidebarSections as any[]}
            tags={briefing.tags}
            onShare={onShare}
          />
        </aside>
      </div>

      {/* Mobile Layout Adjustments */}
      <style jsx>{`
        .magazine-grid {
          display: grid;
          grid-template-columns: 40% 40% 20%;
          gap: 2rem;
          align-items: start;
        }

        .content-column {
          position: relative;
          z-index: 10;
        }

        .timeline-column {
          position: sticky;
          top: 2rem;
          height: calc(100vh - 4rem);
          overflow: hidden;
        }

        .sidebar-column {
          position: sticky;
          top: 2rem;
          height: calc(100vh - 4rem);
          overflow-y: auto;
        }

        /* Content typography optimized for magazine reading */
        .content-wrapper {
          line-height: 1.7;
          font-size: 1.1rem;
        }

        .content-wrapper h1 {
          font-size: 2.5rem;
          line-height: 1.2;
          margin-bottom: 1.5rem;
          font-weight: 900;
        }

        .content-wrapper h2 {
          font-size: 1.8rem;
          line-height: 1.3;
          margin-top: 3rem;
          margin-bottom: 1rem;
          font-weight: 800;
        }

        .content-wrapper h3 {
          font-size: 1.4rem;
          line-height: 1.4;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          font-weight: 700;
        }

        .content-wrapper p {
          margin-bottom: 1.5rem;
          text-align: left;
        }

        /* Drop cap for first paragraph */
        .content-wrapper p:first-of-type::first-letter {
          float: left;
          font-size: 4rem;
          line-height: 3.2rem;
          padding-right: 0.5rem;
          margin-top: 0.1rem;
          font-weight: 900;
          color: hsl(var(--tj-orange));
        }

        /* Enhanced blockquotes for Terry's voice */
        .content-wrapper blockquote {
          position: relative;
          margin: 2rem 0;
          padding: 1.5rem 2rem;
          background: linear-gradient(135deg, 
            rgba(255, 138, 0, 0.1) 0%, 
            rgba(255, 138, 0, 0.05) 100%);
          border-left: 4px solid hsl(var(--tj-orange));
          border-radius: 0 8px 8px 0;
          font-family: 'Bouchers Sans', system-ui, sans-serif;
          font-style: italic;
          transform: rotate(-0.5deg);
          transition: transform 0.3s ease;
        }

        .content-wrapper blockquote:hover {
          transform: rotate(0deg) scale(1.01);
        }

        /* Pull quotes */
        .content-wrapper .pull-quote {
          float: right;
          width: 40%;
          margin: 0 0 1rem 2rem;
          padding: 1rem;
          border: 2px solid hsl(var(--tj-orange));
          background: rgba(255, 138, 0, 0.05);
          font-size: 1.2rem;
          font-weight: 600;
          text-align: center;
          transform: rotate(1deg);
        }

        /* Mobile responsive adjustments */
        @media (max-width: 1024px) {
          .magazine-grid {
            grid-template-columns: 50% 30% 20%;
            gap: 1.5rem;
          }
        }

        @media (max-width: 768px) {
          .magazine-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .timeline-column,
          .sidebar-column {
            position: static;
            height: auto;
          }

          .timeline-column {
            order: 3;
          }

          .sidebar-column {
            order: 2;
          }

          .content-wrapper {
            font-size: 1rem;
            line-height: 1.6;
          }

          .content-wrapper h1 {
            font-size: 2rem;
          }

          .content-wrapper h2 {
            font-size: 1.5rem;
          }

          .content-wrapper .pull-quote {
            float: none;
            width: 100%;
            margin: 1rem 0;
          }
        }

        @media (max-width: 480px) {
          .magazine-grid {
            padding: 0 1rem;
          }

          .content-wrapper p:first-of-type::first-letter {
            font-size: 3rem;
            line-height: 2.5rem;
          }
        }

        /* Print styles for magazine layout */
        @media print {
          .magazine-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .timeline-column,
          .sidebar-column {
            display: none;
          }

          .content-wrapper {
            max-width: none;
            font-size: 11pt;
            line-height: 1.4;
          }

          .content-wrapper h1 {
            font-size: 24pt;
            page-break-after: avoid;
          }

          .content-wrapper h2 {
            font-size: 18pt;
            page-break-after: avoid;
          }

          .content-wrapper blockquote {
            transform: none;
            background: none;
            border: 1pt solid #ccc;
          }
        }

        /* Smooth scrolling */
        @media (prefers-reduced-motion: no-preference) {
          html {
            scroll-behavior: smooth;
          }
        }

        /* Focus management for accessibility */
        .content-column:focus-visible {
          outline: 2px solid hsl(var(--tj-orange));
          outline-offset: 4px;
        }

        /* Enhanced link styling for hyperlinked tweets */
        .content-wrapper a {
          color: hsl(var(--tj-orange));
          text-decoration: underline;
          text-decoration-thickness: 2px;
          text-underline-offset: 3px;
          transition: all 0.2s ease;
        }

        .content-wrapper a:hover {
          color: hsl(var(--tj-orange-light));
          text-decoration-thickness: 3px;
          background: rgba(255, 138, 0, 0.1);
          padding: 0 2px;
          border-radius: 2px;
        }

        /* Tweet quote styling */
        .content-wrapper .tweet-quote {
          background: rgba(29, 161, 242, 0.1);
          border-left: 4px solid #1da1f2;
          padding: 1rem;
          margin: 1.5rem 0;
          border-radius: 0 8px 8px 0;
          font-family: var(--font-geist-mono), monospace;
          font-size: 0.95rem;
        }

        .content-wrapper .tweet-quote::before {
          content: '🐦';
          margin-right: 0.5rem;
        }

        /* Partner content callouts */
        .content-wrapper .partner-callout {
          background: rgba(34, 197, 94, 0.1);
          border-left: 4px solid #22c55e;
          padding: 1.5rem;
          margin: 2rem 0;
          border-radius: 0 8px 8px 0;
          transform: rotate(0.5deg);
        }

        .content-wrapper .partner-callout h4 {
          color: #22c55e;
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
          font-weight: 700;
        }

        /* Bullshit Corner styling */
        .content-wrapper .bullshit-corner {
          background: linear-gradient(135deg, 
            rgba(239, 68, 68, 0.1) 0%, 
            rgba(239, 68, 68, 0.05) 100%);
          border: 2px dashed #ef4444;
          padding: 2rem;
          margin: 3rem 0;
          border-radius: 8px;
          transform: rotate(-1deg);
          position: relative;
        }

        .content-wrapper .bullshit-corner::before {
          content: '💩';
          position: absolute;
          top: -10px;
          left: 20px;
          background: hsl(var(--background));
          padding: 0 8px;
          font-size: 1.5rem;
        }

        .content-wrapper .bullshit-corner h4 {
          color: #ef4444;
          font-weight: 800;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}