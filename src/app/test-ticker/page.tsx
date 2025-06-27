"use client";

import { useEffect, useState } from "react";

export default function TestTickerPage() {
  const [breakingNews, setBreakingNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/breaking-news")
      .then((res) => res.json())
      .then((data) => {
        setBreakingNews(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.toString());
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Breaking News Test</h1>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">API Response:</h2>
        <pre className="bg-zinc-800 p-4 rounded mt-2 overflow-auto">
          {JSON.stringify(breakingNews, null, 2)}
        </pre>
      </div>

      {breakingNews?.data && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Headlines:</h2>
          <div className="space-y-2">
            {breakingNews.data.map((story: any) => (
              <div key={story.id} className="p-3 bg-zinc-800 rounded">
                <p className="font-mono text-sm">{story.headline}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
