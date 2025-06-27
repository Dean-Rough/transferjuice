"use client";

import { useEffect, useState } from "react";

export default function DebugPage() {
  const [status, setStatus] = useState("Initial");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    console.log("Debug: useEffect triggered");
    setStatus("useEffect triggered");

    fetch("/api/feed?limit=3")
      .then((res) => {
        setStatus("Response received");
        return res.json();
      })
      .then((data) => {
        setStatus("Data parsed");
        setData(data);
      })
      .catch((err) => {
        setStatus(`Error: ${err.message}`);
      });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      <p>Status: {status}</p>
      {data && (
        <div className="mt-4">
          <p>Items count: {data.data?.length || 0}</p>
          <pre className="bg-gray-800 p-4 rounded text-xs overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
