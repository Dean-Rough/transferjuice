"use client";

import { useState } from "react";

import { FeedItem } from "@/lib/stores/feedStore";

interface ShareButtonProps {
  item: FeedItem;
  className?: string;
}

export function ShareButton({ item, className = "" }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateShareUrl = () => {
    const baseUrl = window.location.origin;
    const allTags = [
      ...item.tags.clubs,
      ...item.tags.players,
      ...item.tags.sources,
    ];
    const tags = allTags.join(",");
    return `${baseUrl}/feed?item=${item.id}&tags=${encodeURIComponent(tags)}`;
  };

  const generateShareText = () => {
    const authorDisplay = item.type === "terry" ? "Terry" : item.source.name;
    const preview =
      item.content.length > 100
        ? `${item.content.substring(0, 100)}...`
        : item.content;

    return `${authorDisplay}: "${preview}" - Transfer Juice Live Feed`;
  };

  const handleCopyLink = async () => {
    try {
      const url = generateShareUrl();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowMenu(false);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleTwitterShare = () => {
    const text = generateShareText();
    const url = generateShareUrl();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
    setShowMenu(false);
  };

  const handleFacebookShare = () => {
    const url = generateShareUrl();
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, "_blank", "noopener,noreferrer");
    setShowMenu(false);
  };

  const handleRedditShare = () => {
    const title = generateShareText();
    const url = generateShareUrl();
    const redditUrl = `https://reddit.com/submit?title=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(redditUrl, "_blank", "noopener,noreferrer");
    setShowMenu(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1 text-gray-400 hover:text-brand-orange-500 transition-colors"
        aria-label="Share"
        data-testid="share-button"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
          />
        </svg>
      </button>

      {showMenu && (
        <div
          className="absolute right-0 top-8 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-20 min-w-48"
          data-testid="share-menu"
        >
          <div className="py-1">
            <button
              onClick={handleCopyLink}
              className="flex items-center w-full px-4 py-2 text-sm text-brand-cream hover:bg-gray-800"
              data-testid="copy-link-button"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              {copied ? "Copied!" : "Copy Link"}
            </button>

            <button
              onClick={handleTwitterShare}
              className="flex items-center w-full px-4 py-2 text-sm text-brand-cream hover:bg-gray-800"
              data-testid="twitter-share-button"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
              Share on Twitter
            </button>

            <button
              onClick={handleFacebookShare}
              className="flex items-center w-full px-4 py-2 text-sm text-brand-cream hover:bg-gray-800"
              data-testid="facebook-share-button"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Share on Facebook
            </button>

            <button
              onClick={handleRedditShare}
              className="flex items-center w-full px-4 py-2 text-sm text-brand-cream hover:bg-gray-800"
              data-testid="reddit-share-button"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
              </svg>
              Share on Reddit
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
