"use client";

import { useState, useEffect } from "react";
import { NewsletterSignup } from "@/components/features/NewsletterSignup";

interface BriefingSidebarProps {
  sections?: any[]; // Sidebar sections from briefing
  tags?: any[]; // Briefing tags
  onShare?: (platform: string) => void;
  // Legacy props for backward compatibility
  briefingData?: {
    title: string;
    readTime: number;
    wordCount: number;
    shareCount: number;
    terryScore: number;
  };
  scrollPosition?: number; // 0-1 representing scroll progress
  className?: string;
}

interface ReadingProgress {
  percentage: number;
  estimatedTimeRemaining: number;
  currentSection: string;
}

export function BriefingSidebar({
  briefingData,
  scrollPosition,
  className = "",
}: BriefingSidebarProps) {
  const [readingProgress, setReadingProgress] = useState<ReadingProgress>({
    percentage: 0,
    estimatedTimeRemaining: briefingData?.readTime || 5,
    currentSection: "Introduction",
  });

  const [isSticky, setIsSticky] = useState(false);

  // Update reading progress based on scroll
  useEffect(() => {
    const percentage = Math.round((scrollPosition || 0) * 100);
    const timeRemaining = Math.max(
      0,
      (briefingData?.readTime || 5) * (1 - (scrollPosition || 0)),
    );

    // Determine current section based on scroll position
    let currentSection = "Introduction";
    const scroll = scrollPosition || 0;
    if (scroll > 0.8) currentSection = "Bullshit Corner";
    else if (scroll > 0.6) currentSection = "Analysis";
    else if (scroll > 0.3) currentSection = "Context & Stories";
    else if (scroll > 0.1) currentSection = "Main News";

    setReadingProgress({
      percentage,
      estimatedTimeRemaining: Math.ceil(timeRemaining),
      currentSection,
    });

    // Update sticky state
    setIsSticky(scroll > 0.1);
  }, [scrollPosition, briefingData?.readTime]);

  const getTerryScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 75) return "text-yellow-400";
    if (score >= 60) return "text-orange-400";
    return "text-red-400";
  };

  const getTerryScoreLabel = (score: number) => {
    if (score >= 90) return "Peak Terry";
    if (score >= 75) return "Proper Terry";
    if (score >= 60) return "Terry-ish";
    return "Not Terry";
  };

  return (
    <aside
      className={`briefing-sidebar space-y-6 ${className} ${isSticky ? "sidebar-sticky" : ""}`}
      data-testid="briefing-sidebar"
    >
      {/* Reading Progress */}
      <div className="progress-card card p-4">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center">
          <span className="mr-2">📖</span>
          Reading Progress
        </h3>

        <div className="space-y-3">
          {/* Progress bar */}
          <div className="progress-bar-container">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{readingProgress.percentage}% complete</span>
              <span>{readingProgress.estimatedTimeRemaining}m left</span>
            </div>
            <div className="progress-bar bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="progress-fill bg-orange-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${readingProgress.percentage}%` }}
              />
            </div>
          </div>

          {/* Current section */}
          <div className="current-section">
            <p className="text-xs text-muted-foreground">Currently reading:</p>
            <p className="text-sm font-medium text-foreground">
              {readingProgress.currentSection}
            </p>
          </div>
        </div>
      </div>

      {/* Briefing Stats */}
      <div className="stats-card card p-4">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center">
          <span className="mr-2">📊</span>
          Briefing Stats
        </h3>

        <div className="space-y-3">
          <div className="stat-item flex justify-between">
            <span className="text-xs text-muted-foreground">Read Time:</span>
            <span className="text-sm font-medium">
              {briefingData?.readTime || 5}m
            </span>
          </div>

          <div className="stat-item flex justify-between">
            <span className="text-xs text-muted-foreground">Word Count:</span>
            <span className="text-sm font-medium">
              {(briefingData?.wordCount || 1200).toLocaleString()}
            </span>
          </div>

          <div className="stat-item flex justify-between">
            <span className="text-xs text-muted-foreground">Shares:</span>
            <span className="text-sm font-medium">
              {briefingData?.shareCount || 0}
            </span>
          </div>

          <div className="stat-item flex justify-between">
            <span className="text-xs text-muted-foreground">Terry Score:</span>
            <span
              className={`text-sm font-bold ${getTerryScoreColor(briefingData?.terryScore || 85)}`}
            >
              {briefingData?.terryScore || 85}%{" "}
              {getTerryScoreLabel(briefingData?.terryScore || 85)}
            </span>
          </div>
        </div>
      </div>

      {/* Terry's Corner */}
      <div className="terry-corner card p-4 bg-gradient-to-br from-orange-600/10 to-orange-600/5 border-orange-600/20">
        <h3 className="text-sm font-bold text-orange-400 mb-3 flex items-center">
          <span className="mr-2">🎭</span>
          {"Terry's Corner"}
        </h3>

        <div className="space-y-3">
          <blockquote className="text-sm italic text-foreground leading-relaxed">
            {
              "Transfer deadline day is just Black Friday for billionaires with too much money and not enough sense."
            }
          </blockquote>

          <div className="terry-status flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">
              Terry is currently: Magnificently Annoyed
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="actions-card card p-4">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center">
          <span className="mr-2">⚡</span>
          Quick Actions
        </h3>

        <div className="space-y-2">
          <button className="action-button w-full text-left p-2 rounded hover:bg-muted transition-colors text-sm">
            <span className="mr-2">🔗</span>
            Copy Link to Briefing
          </button>

          <button className="action-button w-full text-left p-2 rounded hover:bg-muted transition-colors text-sm">
            <span className="mr-2">🐦</span>
            Share on Twitter
          </button>

          <button className="action-button w-full text-left p-2 rounded hover:bg-muted transition-colors text-sm">
            <span className="mr-2">📧</span>
            Email This Briefing
          </button>

          <button className="action-button w-full text-left p-2 rounded hover:bg-muted transition-colors text-sm">
            <span className="mr-2">🖨️</span>
            Print Version
          </button>
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="newsletter-card">
        <NewsletterSignup variant="compact" className="compact" />
      </div>

      {/* Archive Navigation */}
      <div className="archive-card card p-4">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center">
          <span className="mr-2">📚</span>
          Recent Briefings
        </h3>

        <div className="space-y-2">
          <a
            href="#"
            className="archive-link block p-2 rounded hover:bg-muted transition-colors"
          >
            <div className="text-xs text-muted-foreground">Yesterday 18:00</div>
            <div className="text-sm text-foreground leading-tight">
              {"Chelsea's £200m Masterclass in How Not to Build a Squad"}
            </div>
          </a>

          <a
            href="#"
            className="archive-link block p-2 rounded hover:bg-muted transition-colors"
          >
            <div className="text-xs text-muted-foreground">Yesterday 14:00</div>
            <div className="text-sm text-foreground leading-tight">
              {
                "Arsenal's Transfer Strategy: Expensive Excellence or Lucky Guesswork?"
              }
            </div>
          </a>

          <a
            href="#"
            className="archive-link block p-2 rounded hover:bg-muted transition-colors"
          >
            <div className="text-xs text-muted-foreground">Yesterday 09:00</div>
            <div className="text-sm text-foreground leading-tight">
              {"Morning Briefing: Why Every Club Thinks They're Barcelona"}
            </div>
          </a>
        </div>

        <div className="mt-3 pt-3 border-t border-border">
          <a
            href="/archive"
            className="text-sm text-orange-500 hover:text-orange-400 font-medium"
          >
            View All Briefings →
          </a>
        </div>
      </div>

      {/* Trending Tags */}
      <div className="trending-card card p-4">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center">
          <span className="mr-2">🔥</span>
          Trending Now
        </h3>

        <div className="flex flex-wrap gap-1">
          {[
            "Arsenal",
            "Haaland",
            "Transfer Deadline",
            "Terry Approved",
            "Shit Tier Sources",
          ].map((tag) => (
            <span
              key={tag}
              className="tag-pill text-xs px-2 py-1 bg-muted text-muted-foreground rounded hover:bg-orange-600 hover:text-white cursor-pointer transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Enhanced styles */}
      <style jsx>{`
        .card {
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .card:hover {
          border-color: hsl(var(--border)) / 0.8;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .progress-fill {
          background: linear-gradient(90deg, #ff8a00, #ff6b35);
          border-radius: inherit;
        }

        .sidebar-sticky .progress-card {
          border-color: hsl(var(--tj-orange)) / 0.3;
          box-shadow: 0 2px 8px rgba(255, 138, 0, 0.1);
        }

        .action-button:hover {
          background: hsl(var(--muted));
          color: hsl(var(--foreground));
        }

        .archive-link:hover {
          background: hsl(var(--muted));
          border-radius: 4px;
        }

        .tag-pill:hover {
          transform: scale(1.05);
        }

        /* Smooth animations */
        .card,
        .action-button,
        .archive-link,
        .tag-pill {
          transition: all 0.2s ease;
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .briefing-sidebar {
            display: flex;
            overflow-x: auto;
            space-y: 0;
            gap: 1rem;
            padding: 1rem;
          }

          .briefing-sidebar > div {
            flex-shrink: 0;
            width: 280px;
          }

          .newsletter-card {
            display: none;
          }
        }

        /* Accessibility improvements */
        .action-button:focus-visible,
        .archive-link:focus-visible,
        .tag-pill:focus-visible {
          outline: 2px solid hsl(var(--tj-orange));
          outline-offset: 2px;
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .card {
            border-width: 2px;
            border-color: hsl(var(--foreground));
          }

          .progress-fill {
            background: hsl(var(--foreground));
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .card,
          .action-button,
          .archive-link,
          .tag-pill,
          .progress-fill {
            transition: none;
          }

          .animate-pulse {
            animation: none;
          }
        }

        /* Print styles */
        @media print {
          .briefing-sidebar {
            display: none;
          }
        }
      `}</style>
    </aside>
  );
}
