/**
 * Player Card Component
 * Rich media display of player information and stats
 */

import React from "react";
import Image from "next/image";
import { PlayerStats } from "@/lib/enrichment/playerStatsService";

interface PlayerCardProps {
  stats: PlayerStats;
  imageUrl?: string;
  showFullStats?: boolean;
  theme?: "light" | "dark";
  layout?: "horizontal" | "vertical";
}

export function PlayerCard({
  stats,
  imageUrl,
  showFullStats = false,
  theme = "dark",
  layout = "horizontal",
}: PlayerCardProps) {
  const bgColor = theme === "dark" ? "bg-zinc-900" : "bg-white";
  const borderColor = theme === "dark" ? "border-zinc-800" : "border-gray-200";
  const textColor = theme === "dark" ? "text-white" : "text-gray-900";
  const mutedColor = theme === "dark" ? "text-zinc-400" : "text-gray-500";
  const accentColor = theme === "dark" ? "bg-orange-500" : "bg-blue-600";

  const isHorizontal = layout === "horizontal";

  return (
    <div
      className={`${bgColor} ${borderColor} rounded-xl border shadow-lg overflow-hidden ${
        isHorizontal ? "flex" : ""
      }`}
    >
      {/* Player Image */}
      <div className={`relative ${isHorizontal ? "w-1/3" : "w-full h-64"}`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={stats.player.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
            <span className="text-white text-4xl font-bold">
              {stats.player.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
        )}

        {/* Position Badge */}
        <div
          className={`absolute top-4 left-4 ${accentColor} text-white px-3 py-1 rounded-full text-sm font-bold`}
        >
          {stats.player.position}
        </div>

        {/* Market Value */}
        {stats.player.marketValue && (
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-bold">
            €{(stats.player.marketValue / 1000000).toFixed(1)}M
          </div>
        )}
      </div>

      {/* Player Info */}
      <div className={`${isHorizontal ? "flex-1" : ""} p-6`}>
        {/* Header */}
        <div className="mb-4">
          <h3 className={`text-2xl font-bold ${textColor} mb-1`}>
            {stats.player.name}
          </h3>
          <div className={`flex items-center gap-4 ${mutedColor} text-sm`}>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              {stats.player.age} years
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                  clipRule="evenodd"
                />
              </svg>
              {stats.player.nationality}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              {stats.player.currentClub}
            </span>
          </div>
        </div>

        {/* Current Season Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <StatBlock
            label="Apps"
            value={stats.currentSeason.appearances}
            icon="calendar"
            theme={theme}
          />
          <StatBlock
            label="Goals"
            value={stats.currentSeason.goals}
            icon="target"
            theme={theme}
            highlight={stats.currentSeason.goals > 10}
          />
          <StatBlock
            label="Assists"
            value={stats.currentSeason.assists}
            icon="assist"
            theme={theme}
            highlight={stats.currentSeason.assists > 10}
          />
        </div>

        {/* Additional Stats */}
        {showFullStats && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <StatBlock
                label="Minutes"
                value={stats.currentSeason.minutesPlayed}
                icon="clock"
                theme={theme}
              />
              <StatBlock
                label="Yellow"
                value={stats.currentSeason.yellowCards}
                icon="card"
                theme={theme}
                variant="warning"
              />
              <StatBlock
                label="Red"
                value={stats.currentSeason.redCards}
                icon="card"
                theme={theme}
                variant="danger"
              />
            </div>

            {/* Career Stats */}
            <div className={`mt-4 pt-4 border-t ${borderColor}`}>
              <h4 className={`font-bold ${textColor} mb-2`}>Career Stats</h4>
              <div className={`${mutedColor} text-sm space-y-1`}>
                <div className="flex justify-between">
                  <span>Total Appearances:</span>
                  <span className="font-semibold">
                    {stats.careerStats.totalAppearances}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Goals:</span>
                  <span className="font-semibold">
                    {stats.careerStats.totalGoals}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Assists:</span>
                  <span className="font-semibold">
                    {stats.careerStats.totalAssists}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Goals per Game:</span>
                  <span className="font-semibold">
                    {(
                      stats.careerStats.totalGoals /
                      stats.careerStats.totalAppearances
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            {(stats.strengths.length > 0 || stats.weaknesses.length > 0) && (
              <div className={`mt-4 pt-4 border-t ${borderColor}`}>
                {stats.strengths.length > 0 && (
                  <div className="mb-3">
                    <h4 className={`font-bold ${textColor} mb-2`}>Strengths</h4>
                    <div className="flex flex-wrap gap-2">
                      {stats.strengths.map((strength, index) => (
                        <span
                          key={index}
                          className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm"
                        >
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {stats.weaknesses.length > 0 && (
                  <div>
                    <h4 className={`font-bold ${textColor} mb-2`}>
                      Areas to Improve
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {stats.weaknesses.map((weakness, index) => (
                        <span
                          key={index}
                          className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm"
                        >
                          {weakness}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Individual stat block component
 */
function StatBlock({
  label,
  value,
  icon,
  theme,
  highlight = false,
  variant = "default",
}: {
  label: string;
  value: number | string;
  icon: string;
  theme: "light" | "dark";
  highlight?: boolean;
  variant?: "default" | "warning" | "danger";
}) {
  const textColor = theme === "dark" ? "text-white" : "text-gray-900";
  const mutedColor = theme === "dark" ? "text-zinc-400" : "text-gray-500";
  const bgColor = theme === "dark" ? "bg-zinc-800" : "bg-gray-100";

  const highlightColor = highlight
    ? "text-green-400 bg-green-400/10"
    : variant === "warning"
      ? "text-yellow-400 bg-yellow-400/10"
      : variant === "danger"
        ? "text-red-400 bg-red-400/10"
        : "";

  return (
    <div className={`${bgColor} ${highlightColor} rounded-lg p-3 text-center`}>
      <div className={`${mutedColor} text-xs mb-1`}>{label}</div>
      <div
        className={`${highlight || variant !== "default" ? "" : textColor} text-xl font-bold`}
      >
        {value}
      </div>
    </div>
  );
}

/**
 * Simplified Player Card for lists
 */
export function PlayerCardCompact({
  name,
  position,
  club,
  value,
  imageUrl,
  theme = "dark",
}: {
  name: string;
  position: string;
  club: string;
  value?: number;
  imageUrl?: string;
  theme?: "light" | "dark";
}) {
  const bgColor = theme === "dark" ? "bg-zinc-900" : "bg-white";
  const borderColor = theme === "dark" ? "border-zinc-800" : "border-gray-200";
  const textColor = theme === "dark" ? "text-white" : "text-gray-900";
  const mutedColor = theme === "dark" ? "text-zinc-400" : "text-gray-500";

  return (
    <div
      className={`${bgColor} ${borderColor} rounded-lg border p-3 flex items-center gap-3`}
    >
      {/* Avatar */}
      <div className="relative w-12 h-12 flex-shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover rounded-full"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className={`font-semibold ${textColor} truncate`}>{name}</div>
        <div className={`${mutedColor} text-sm flex items-center gap-2`}>
          <span>{position}</span>
          <span>·</span>
          <span>{club}</span>
        </div>
      </div>

      {/* Value */}
      {value && (
        <div className="text-right">
          <div className={`font-bold ${textColor}`}>
            €{(value / 1000000).toFixed(1)}M
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Player Card Skeleton for loading states
 */
export function PlayerCardSkeleton({
  layout = "horizontal",
}: {
  layout?: "horizontal" | "vertical";
}) {
  const isHorizontal = layout === "horizontal";

  return (
    <div
      className={`bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-hidden animate-pulse ${
        isHorizontal ? "flex" : ""
      }`}
    >
      <div
        className={`${isHorizontal ? "w-1/3" : "w-full h-64"} bg-zinc-800`}
      ></div>
      <div className={`${isHorizontal ? "flex-1" : ""} p-6`}>
        <div className="h-7 w-48 bg-zinc-800 rounded mb-2"></div>
        <div className="h-4 w-64 bg-zinc-800 rounded mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-16 bg-zinc-800 rounded"></div>
          <div className="h-16 bg-zinc-800 rounded"></div>
          <div className="h-16 bg-zinc-800 rounded"></div>
        </div>
      </div>
    </div>
  );
}
