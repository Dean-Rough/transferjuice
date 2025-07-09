"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Story, Tweet, Source } from "@prisma/client";

type StoryWithRelations = Story & {
  tweet: Tweet & {
    source: Source;
  };
};

export function StoryEditForm({ story }: { story: StoryWithRelations }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    headline: story.headline || "",
    articleContent: story.articleContent || "",
    headerImage: story.headerImage || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/dashboard/stories/${story.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update story");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Dashboard
        </Link>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="px-4 py-2 text-sm bg-secondary rounded hover:bg-secondary/80"
        >
          {showPreview ? "Hide Preview" : "Show Preview"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Edit Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Headline
              </label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) =>
                  setFormData({ ...formData, headline: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>


            <div>
              <label className="block text-sm font-medium mb-2">
                Header Image URL
              </label>
              <input
                type="text"
                value={formData.headerImage}
                onChange={(e) =>
                  setFormData({ ...formData, headerImage: e.target.value })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {formData.headerImage && (
                <img
                  src={formData.headerImage}
                  alt="Header preview"
                  className="mt-2 w-full h-48 object-cover rounded"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Article Content
              </label>
              <textarea
                value={formData.articleContent}
                onChange={(e) =>
                  setFormData({ ...formData, articleContent: e.target.value })
                }
                rows={20}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-2 bg-secondary rounded hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">Preview</h2>
            
            {formData.headerImage && (
              <img
                src={formData.headerImage}
                alt={formData.headline}
                className="w-full h-64 object-cover rounded mb-6"
              />
            )}
            
            <h1 className="text-2xl font-bold mb-4">{formData.headline}</h1>
            
            
            <div className="prose prose-invert max-w-none">
              {formData.articleContent.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}