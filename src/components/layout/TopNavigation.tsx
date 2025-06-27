"use client";

import { useState } from "react";

export function TopNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-zinc-800">
      <div
        className="flex items-center justify-between h-16"
        style={{ paddingLeft: "10%", paddingRight: "10%" }}
      >
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          {/* Menu Icon */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-zinc-800 rounded-md transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">TJ</span>
            </div>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                Transfer Juice
              </h1>
            </div>
          </div>
        </div>

        {/* Right side - optional actions */}
        <div className="flex items-center gap-4">
          <button className="text-zinc-400 hover:text-white transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile/Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-black border-b border-zinc-800 shadow-lg">
          <div style={{ paddingLeft: "10%", paddingRight: "10%" }}>
            <div className="py-4 space-y-2">
              <a
                href="/"
                className="block px-4 py-2 text-white hover:bg-zinc-800 rounded-md transition-colors"
              >
                Home
              </a>
              <a
                href="/archive"
                className="block px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
              >
                Archive
              </a>
              <a
                href="/about"
                className="block px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
              >
                About Terry
              </a>
              <a
                href="/api/feed"
                className="block px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
              >
                RSS Feed
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
