/**
 * Loading Spinner Component
 * Consistent loading states throughout the app
 */

import React from "react";
import { clsx } from "clsx";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({
  size = "md",
  className = "",
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-3",
  };

  return (
    <div className={clsx("inline-flex items-center gap-3", className)}>
      <div className={clsx("loading-spinner", sizeClasses[size])} />
      {text && <span className="text-zinc-400 font-mono text-sm">{text}</span>}
    </div>
  );
}

export function LoadingState({
  text = "Loading...",
  fullScreen = false,
}: {
  text?: string;
  fullScreen?: boolean;
}) {
  const containerClasses = fullScreen
    ? "fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
    : "py-12 text-center";

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-zinc-400 font-mono text-sm animate-pulse">{text}</p>
      </div>
    </div>
  );
}
