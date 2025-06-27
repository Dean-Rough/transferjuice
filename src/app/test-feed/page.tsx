"use client";

import { useEffect, useState } from "react";

export default function TestFeedPage() {
  const [apiData, setApiData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/feed?limit=5")
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
        setApiData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("API Error:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Feed API Test</h1>

      {loading && <p>Loading...</p>}

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
          Error: {error}
        </div>
      )}

      {apiData && (
        <div>
          <h2 className="text-xl font-bold mb-2">API Response</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(apiData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
