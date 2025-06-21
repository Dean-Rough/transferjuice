'use client';

import { useEffect, useState } from 'react';

interface BreakingNewsItem {
  id: string;
  text: string;
  timestamp: Date;
}

const mockBreakingNews: BreakingNewsItem[] = [
  {
    id: '1',
    text: '🚨 BREAKING: Ten Hag reportedly spotted at Carrington despite sacking rumors',
    timestamp: new Date(),
  },
  {
    id: '2',
    text: '🔴 Liverpool close in on £60m midfielder from Real Madrid',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: '3',
    text: '⚡ Chelsea preparing fourth bid for striker after £150m spending spree',
    timestamp: new Date(Date.now() - 7200000),
  },
];

export function BreakingNewsTicker() {
  const [isVisible, setIsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mockBreakingNews.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || mockBreakingNews.length === 0) return null;

  return (
    <div className="bg-red-600 text-white relative overflow-hidden">
      <div className="flex items-center">
        {/* Breaking Label */}
        <div className="bg-red-700 px-4 py-2 flex items-center gap-2 flex-shrink-0 z-10">
          <span className="animate-pulse">🚨</span>
          <span className="font-black text-sm">BREAKING NEWS</span>
        </div>

        {/* Ticker Content */}
        <div className="flex-1 relative h-10 overflow-hidden">
          <div className="absolute inset-0 flex items-center">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {mockBreakingNews.map((item) => (
                <div
                  key={item.id}
                  className="min-w-full px-4 flex items-center justify-between"
                >
                  <p className="text-sm font-medium pr-4">{item.text}</p>
                  <time className="text-xs opacity-75 data-mono flex-shrink-0">
                    {item.timestamp.toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setIsVisible(false)}
          className="px-4 py-2 hover:bg-red-700 transition-colors z-10"
          aria-label="Close breaking news"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}