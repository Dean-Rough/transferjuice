"use client";

import { useState } from "react";

export function FeedContainer() {
  const [items] = useState([
    {
      id: "1",
      content:
        "🎉 BREAKING: Fresh TransferJuice build is working! The Terry has successfully escaped the webpack haunted house.",
      timestamp: new Date(),
      source: { name: "The Terry", tier: 1 as const, reliability: 1 },
      tags: {
        clubs: ["TransferJuice FC"],
        players: ["webpack"],
        sources: ["The Terry"],
      },
      metadata: { priority: "breaking" as const, relevanceScore: 1 },
    },
    {
      id: "2",
      content:
        '✅ Next.js 14.2.3 confirmed working without cursed webpack errors. No more "Cannot read properties of undefined" madness.',
      timestamp: new Date(Date.now() - 300000),
      source: { name: "Development Team", tier: 1 as const, reliability: 0.95 },
      tags: { clubs: ["Next.js"], players: ["webpack"], sources: ["Dev Team"] },
      metadata: { priority: "high" as const, relevanceScore: 0.9 },
    },
    {
      id: "3",
      content:
        "🔧 Fresh project setup complete with Tailwind CSS, Prisma, and all essential dependencies. Ready for the real feed implementation.",
      timestamp: new Date(Date.now() - 600000),
      source: { name: "System", tier: 2 as const, reliability: 0.9 },
      tags: { clubs: ["Tailwind"], players: ["Prisma"], sources: ["System"] },
      metadata: { priority: "medium" as const, relevanceScore: 0.8 },
    },
  ]);

  return (
    <div className="w-full max-w-4xl mx-auto bg-background p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-orange-500 mb-2">
          🚀 Transfer Juice - Fresh Build
        </h1>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Live Transfer Feed
        </h2>
        <p className="text-muted-foreground text-sm font-mono">
          Nuclear rebuild successful • {items.length} status updates • LIVE
        </p>
      </div>

      <div className="space-y-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="font-semibold text-foreground">
                  {item.source.name}
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-mono ${
                    item.metadata.priority === "breaking"
                      ? "bg-red-600 text-white"
                      : item.metadata.priority === "high"
                        ? "bg-orange-600 text-white"
                        : "bg-gray-600 text-white"
                  }`}
                >
                  {item.metadata.priority.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {item.timestamp.toLocaleTimeString()}
              </div>
            </div>
            <p className="text-foreground text-base leading-relaxed mb-4">
              {item.content}
            </p>
            <div className="flex flex-wrap gap-2">
              {item.tags.clubs.map((club, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-orange-600 text-white text-xs rounded-full font-mono"
                >
                  #{club}
                </span>
              ))}
              {item.tags.players.map((player, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-green-600 text-white text-xs rounded-full font-mono"
                >
                  @{player}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-card border border-border rounded-lg">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          ✅ Status: OPERATIONAL
        </h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Fresh Next.js 14.2.3 build working</li>
          <li>• Webpack errors eliminated</li>
          <li>• Tailwind CSS configured</li>
          <li>• Dark theme active</li>
          <li>• Prisma client generated</li>
          <li>• Ready for real feed implementation</li>
        </ul>
      </div>
    </div>
  );
}
