'use client';

import { useState, useEffect } from 'react';
import { Briefing } from '@/lib/types/briefing';
import { NewsletterSignup } from '@/components/features/NewsletterSignup';

interface PremiumSharingModuleProps {
  briefing: Briefing;
  className?: string;
}

interface SharePlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  message: string;
  url: string;
  action: () => void;
}

export function PremiumSharingModule({ briefing, className = '' }: PremiumSharingModuleProps) {
  const [shareCount, setShareCount] = useState(briefing.sharing.shareCount);
  const [selectedQuote, setSelectedQuote] = useState(briefing.sharing.quotes[0] || '');
  const [isSharing, setIsSharing] = useState(false);
  const [recentShares, setRecentShares] = useState<string[]>([]);

  // Extract best Terry quote from briefing
  const featuredQuote = briefing.sharing.quotes[0] || 
    "Just read Terry's latest briefing - properly unhinged as usual";

  // Generate platform-specific share content
  const generateSharePlatforms = (): SharePlatform[] => {
    const baseUrl = typeof window !== 'undefined' ? window.location.href : '';
    const encodedUrl = encodeURIComponent(baseUrl);
    const encodedTitle = encodeURIComponent(briefing.title.funny);
    
    return [
      {
        id: 'twitter',
        name: 'Twitter',
        icon: '🐦',
        color: 'bg-blue-500 hover:bg-blue-600',
        message: briefing.sharing.platforms.twitter.message,
        url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(featuredQuote)}&url=${encodedUrl}&hashtags=${briefing.sharing.platforms.twitter.hashtags.join(',')}`,
        action: () => shareToTwitter(),
      },
      {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: '💼',
        color: 'bg-blue-700 hover:bg-blue-800',
        message: briefing.sharing.platforms.linkedin.message,
        url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        action: () => shareToLinkedIn(),
      },
      {
        id: 'whatsapp',
        name: 'WhatsApp',
        icon: '💬',
        color: 'bg-green-500 hover:bg-green-600',
        message: briefing.sharing.platforms.whatsapp.message,
        url: `https://wa.me/?text=${encodeURIComponent(briefing.sharing.platforms.whatsapp.message + ' ' + baseUrl)}`,
        action: () => shareToWhatsApp(),
      },
      {
        id: 'email',
        name: 'Email',
        icon: '📧',
        color: 'bg-gray-600 hover:bg-gray-700',
        message: briefing.sharing.platforms.email.subject,
        url: `mailto:?subject=${encodeURIComponent(briefing.sharing.platforms.email.subject)}&body=${encodeURIComponent(briefing.sharing.platforms.email.preview + '\n\n' + baseUrl)}`,
        action: () => shareViaEmail(),
      },
      {
        id: 'copy',
        name: 'Copy Link',
        icon: '🔗',
        color: 'bg-purple-600 hover:bg-purple-700',
        message: 'Copy briefing link',
        url: baseUrl,
        action: () => copyToClipboard(),
      },
      {
        id: 'instagram',
        name: 'Instagram',
        icon: '📸',
        color: 'bg-pink-600 hover:bg-pink-700',
        message: 'Share as Story',
        url: '#',
        action: () => generateInstagramStory(),
      },
    ];
  };

  const sharePlatforms = generateSharePlatforms();

  // Sharing actions
  const shareToTwitter = async () => {
    setIsSharing(true);
    window.open(sharePlatforms.find(p => p.id === 'twitter')?.url, '_blank', 'width=550,height=420');
    await trackShare('twitter');
    setIsSharing(false);
  };

  const shareToLinkedIn = async () => {
    setIsSharing(true);
    window.open(sharePlatforms.find(p => p.id === 'linkedin')?.url, '_blank', 'width=550,height=420');
    await trackShare('linkedin');
    setIsSharing(false);
  };

  const shareToWhatsApp = async () => {
    setIsSharing(true);
    window.open(sharePlatforms.find(p => p.id === 'whatsapp')?.url, '_blank');
    await trackShare('whatsapp');
    setIsSharing(false);
  };

  const shareViaEmail = async () => {
    setIsSharing(true);
    window.location.href = sharePlatforms.find(p => p.id === 'email')?.url || '';
    await trackShare('email');
    setIsSharing(false);
  };

  const copyToClipboard = async () => {
    setIsSharing(true);
    try {
      await navigator.clipboard.writeText(window.location.href);
      setRecentShares(prev => [...prev, 'copy']);
      setTimeout(() => setRecentShares(prev => prev.filter(s => s !== 'copy')), 2000);
      await trackShare('copyLink');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
    setIsSharing(false);
  };

  const generateInstagramStory = async () => {
    setIsSharing(true);
    // This would generate a quote image for Instagram Stories
    // For now, just track the intent
    await trackShare('instagram');
    setIsSharing(false);
    alert('Instagram story generator coming soon! 📸');
  };

  // Track sharing analytics
  const trackShare = async (platform: string) => {
    try {
      const response = await fetch('/api/analytics/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefingId: briefing.id,
          platform,
          quote: selectedQuote,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setShareCount(prev => ({
          ...prev,
          [platform]: (prev[platform as keyof typeof prev] || 0) + 1,
        }));
      }
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  };

  const handleQuoteSelect = (quote: string) => {
    setSelectedQuote(quote);
  };

  const getTotalShares = () => {
    return Object.values(shareCount).reduce((sum, count) => sum + count, 0);
  };

  return (
    <div className={`premium-sharing-module mt-12 pt-8 border-t border-border ${className}`} data-testid="premium-sharing-module">
      {/* Section Header */}
      <div className="sharing-header text-center mb-8">
        <h2 className="text-2xl font-black text-foreground mb-2">
          Share the Terry Chaos
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Spread the beautiful madness of transfer journalism. Your friends will thank you (or block you).
        </p>
        {getTotalShares() > 0 && (
          <div className="share-stats mt-3">
            <span className="text-sm text-orange-500 font-medium">
              {getTotalShares()} shares and counting 🔥
            </span>
          </div>
        )}
      </div>

      {/* Featured Quote Highlight */}
      <div className="quote-highlight mb-8">
        <div className="quote-card terry-bubble bg-orange-600 text-white p-6 max-w-2xl mx-auto">
          <blockquote className="text-lg leading-relaxed mb-4">
            "{selectedQuote}"
          </blockquote>
          <div className="quote-controls flex items-center justify-between">
            <span className="text-orange-100 text-sm">— The Terry</span>
            <button
              onClick={() => handleQuoteSelect(briefing.sharing.quotes[Math.floor(Math.random() * briefing.sharing.quotes.length)])}
              className="text-orange-100 hover:text-white text-sm underline"
            >
              Try another quote
            </button>
          </div>
        </div>
      </div>

      {/* Sharing Platform Grid */}
      <div className="sharing-platforms mb-8">
        <h3 className="text-lg font-bold text-foreground mb-4 text-center">
          Choose Your Weapon of Mass Disruption
        </h3>
        <div className="platforms-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
          {sharePlatforms.map((platform) => (
            <button
              key={platform.id}
              onClick={platform.action}
              disabled={isSharing}
              className={`platform-button ${platform.color} text-white p-4 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50`}
              data-testid={`share-${platform.id}`}
            >
              <div className="flex flex-col items-center space-y-2">
                <span className="text-2xl" role="img" aria-label={platform.name}>
                  {platform.icon}
                </span>
                <span className="text-sm font-medium">{platform.name}</span>
                {shareCount[platform.id as keyof typeof shareCount] > 0 && (
                  <span className="text-xs opacity-75">
                    {shareCount[platform.id as keyof typeof shareCount]}
                  </span>
                )}
                {recentShares.includes(platform.id) && (
                  <span className="text-xs bg-white text-gray-800 px-2 py-1 rounded animate-pulse">
                    ✓ Shared!
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Newsletter Integration */}
      <div className="newsletter-integration mb-8">
        <div className="newsletter-cta bg-gradient-to-r from-orange-600/10 to-orange-600/5 border border-orange-600/20 rounded-lg p-6 max-w-2xl mx-auto">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-foreground mb-2">
              Get Tomorrow's Chaos Delivered
            </h3>
            <p className="text-muted-foreground">
              Subscribe and never miss Terry's unhinged take on the transfer window
            </p>
          </div>
          <NewsletterSignup 
            variant="inline"
            source={`briefing-${briefing.id}`}
            compact={false}
          />
        </div>
      </div>

      {/* Related Actions */}
      <div className="related-actions">
        <h3 className="text-lg font-bold text-foreground mb-4 text-center">
          More Transfer Chaos
        </h3>
        <div className="actions-grid grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          
          {/* Archive Link */}
          <a 
            href="/archive"
            className="action-card card p-4 text-center hover:border-orange-600/30 transition-all duration-200 group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📚</div>
            <h4 className="font-bold text-foreground mb-1">Read Previous Briefings</h4>
            <p className="text-sm text-muted-foreground">Dive into the archive of magnificent chaos</p>
          </a>

          {/* Social Follow */}
          <a 
            href="https://twitter.com/transferjuice"
            target="_blank"
            rel="noopener noreferrer"
            className="action-card card p-4 text-center hover:border-orange-600/30 transition-all duration-200 group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🐦</div>
            <h4 className="font-bold text-foreground mb-1">Follow Transfer Juice</h4>
            <p className="text-sm text-muted-foreground">Real-time Terry wisdom on Twitter</p>
          </a>

          {/* Feedback */}
          <button 
            onClick={() => window.open('mailto:feedback@transferjuice.com?subject=Briefing Feedback', '_blank')}
            className="action-card card p-4 text-center hover:border-orange-600/30 transition-all duration-200 group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">💌</div>
            <h4 className="font-bold text-foreground mb-1">Send Feedback</h4>
            <p className="text-sm text-muted-foreground">Tell Terry what you really think</p>
          </button>
        </div>
      </div>

      {/* Enhanced styles */}
      <style jsx>{`
        .terry-bubble {
          transform: rotate(-1deg);
          transition: all 0.3s ease;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }

        .terry-bubble:hover {
          transform: rotate(0deg) scale(1.02);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
        }

        .platform-button:hover {
          transform: scale(1.05) translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }

        .platform-button:active {
          transform: scale(0.98);
        }

        .action-card {
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .action-card:hover {
          border-color: hsl(var(--tj-orange)) / 0.3;
          box-shadow: 0 4px 12px rgba(255, 138, 0, 0.1);
          transform: translateY(-2px);
        }

        .card {
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .platforms-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }

          .quote-card {
            transform: rotate(0deg);
            margin: 0 1rem;
          }

          .platform-button {
            padding: 1rem;
          }
        }

        /* Accessibility */
        .platform-button:focus-visible,
        .action-card:focus-visible {
          outline: 2px solid hsl(var(--tj-orange));
          outline-offset: 2px;
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .terry-bubble,
          .platform-button,
          .action-card {
            transform: none;
            transition: opacity 0.2s ease;
          }

          .platform-button:hover,
          .action-card:hover {
            transform: none;
          }
        }

        /* Print styles */
        @media print {
          .premium-sharing-module {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}