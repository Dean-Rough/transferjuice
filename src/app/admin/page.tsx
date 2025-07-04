"use client";

import { useState } from "react";
import { ITK_SOURCES } from "@/lib/sources";

export default function AdminPage() {
  const [sourceName, setSourceName] = useState("");
  const [sourceHandle, setSourceHandle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Submitting...");

    try {
      const response = await fetch("/api/tweets/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          sourceName,
          sourceHandle,
          content,
          url: url || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("✅ Tweet added successfully!");
        setContent("");
        setUrl("");
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setStatus("❌ Failed to submit");
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-orange-500 mb-8">
          Admin - Add Manual Tweet
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground"
              placeholder="Enter admin API key"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Source
            </label>
            <select
              value={`${sourceName}|${sourceHandle}`}
              onChange={(e) => {
                const [name, handle] = e.target.value.split("|");
                setSourceName(name);
                setSourceHandle(handle);
              }}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground"
              required
            >
              <option value="">Select a source...</option>
              {ITK_SOURCES.map((source) => (
                <option
                  key={source.handle}
                  value={`${source.name}|${source.handle}`}
                >
                  {source.name} ({source.handle})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Tweet Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground h-32"
              placeholder="Enter the tweet content..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Tweet URL (optional)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground"
              placeholder="https://twitter.com/..."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Add Tweet
          </button>

          {status && <div className="text-center text-sm mt-4">{status}</div>}
        </form>

        <div className="mt-12 p-4 bg-secondary/50 rounded-lg">
          <h2 className="text-sm font-mono text-orange-500 mb-2">
            Quick Generate Briefing
          </h2>
          <button
            onClick={async () => {
              const response = await fetch("/api/briefings/generate", {
                method: "POST",
                headers: {
                  "X-Cron-Secret": apiKey,
                },
              });
              const data = await response.json();
              setStatus(
                response.ok
                  ? "✅ Briefing generated!"
                  : `❌ Error: ${data.error}`,
              );
            }}
            className="bg-secondary hover:bg-secondary/80 text-foreground px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Generate Briefing Now
          </button>
        </div>
      </div>
    </div>
  );
}
