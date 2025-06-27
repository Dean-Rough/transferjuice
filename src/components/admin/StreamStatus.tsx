"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface StreamStatus {
  isConnected: boolean;
  reconnectAttempts: number;
  rules: Array<{ id: string; value: string; tag?: string }>;
  totalRules: number;
}

interface BroadcasterStats {
  totalClients: number;
  messagesSent: number;
  uptime: number;
  clientDetails: Array<{
    id: string;
    connectedAt: string;
    filters?: any;
  }>;
}

export function StreamStatus() {
  const [streamStatus, setStreamStatus] = useState<StreamStatus | null>(null);
  const [broadcasterStats, setBroadcasterStats] =
    useState<BroadcasterStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch status
  const fetchStatus = async () => {
    try {
      const [streamRes, statsRes] = await Promise.all([
        fetch("/api/twitter-stream"),
        fetch("/api/live-feed/stats"), // We'll need to create this
      ]);

      if (streamRes.ok) {
        const streamData = await streamRes.json();
        setStreamStatus(streamData.data);
      }

      // Broadcaster stats endpoint doesn't exist yet, so skip for now
      // if (statsRes.ok) {
      //   const statsData = await statsRes.json();
      //   setBroadcasterStats(statsData.data);
      // }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    }
  };

  // Start/stop stream
  const controlStream = async (action: "start" | "stop") => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/twitter-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      // Refresh status after action
      setTimeout(fetchStatus, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to ${action} stream`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh status
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Twitter Stream Status
        </h2>
        <Button
          onClick={fetchStatus}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {streamStatus && (
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                streamStatus.isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="font-medium">
              {streamStatus.isConnected ? "Connected" : "Disconnected"}
            </span>
            {streamStatus.reconnectAttempts > 0 && (
              <span className="text-sm text-gray-500">
                (Reconnect attempts: {streamStatus.reconnectAttempts})
              </span>
            )}
          </div>

          {/* Stream Rules */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              Stream Rules ({streamStatus.totalRules})
            </h3>
            <div className="bg-gray-50 rounded-md p-3 max-h-48 overflow-y-auto">
              {streamStatus.rules.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {streamStatus.rules.map((rule, index) => (
                    <li key={rule.id} className="flex justify-between">
                      <span className="font-mono text-xs">{rule.value}</span>
                      <span className="text-gray-500">{rule.tag}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No rules configured</p>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex space-x-3">
            <Button
              onClick={() => controlStream("start")}
              disabled={isLoading || streamStatus.isConnected}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "Starting..." : "Start Stream"}
            </Button>
            <Button
              onClick={() => controlStream("stop")}
              disabled={isLoading || !streamStatus.isConnected}
              variant="outline"
            >
              {isLoading ? "Stopping..." : "Stop Stream"}
            </Button>
          </div>

          {/* Broadcaster Stats (when available) */}
          {broadcasterStats && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="font-medium text-gray-900 mb-2">
                SSE Broadcaster
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Connected Clients:</span>
                  <span className="ml-2 font-medium">
                    {broadcasterStats.totalClients}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Messages Sent:</span>
                  <span className="ml-2 font-medium">
                    {broadcasterStats.messagesSent}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!streamStatus && !error && (
        <div className="text-center py-8 text-gray-500">
          Loading stream status...
        </div>
      )}
    </div>
  );
}
