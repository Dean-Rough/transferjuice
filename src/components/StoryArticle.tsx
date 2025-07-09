"use client";

import Image from "next/image";
import { TweetWidget } from "./TweetWidget";
import { formatDistanceToNow } from "date-fns";
import { FormattedText } from "@/components/FormattedText";

interface StoryArticleProps {
  story: {
    id: string;
    headline: string | null;
    articleContent: string | null;
    headerImage: string | null;
    updateCount: number;
    createdAt: string | Date;
    updatedAt: string | Date;
    tweet: {
      content: string;
      url: string;
      scrapedAt: string | Date;
      source: {
        name: string;
        handle: string;
      };
    };
    relatedTweets?: Array<{
      tweet: {
        content: string;
        url: string;
        scrapedAt: string | Date;
        source: {
          name: string;
          handle: string;
        };
      };
      addedAt: string | Date;
    }>;
  };
}

export function StoryArticle({ story }: StoryArticleProps) {
  const createdTime = formatDistanceToNow(new Date(story.createdAt), {
    addSuffix: true,
  });
  const updatedTime = formatDistanceToNow(new Date(story.updatedAt), {
    addSuffix: true,
  });

  // Parse article content into paragraphs
  const paragraphs =
    story.articleContent?.split("\n\n").filter((p) => p.trim()) || [];

  return (
    <article className="story-article max-w-6xl mx-auto">
      {/* Header Section - 2 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-12">
        {/* Square/Portrait Image on Left */}
        {story.headerImage && (
          <div className="aspect-square overflow-hidden rounded-lg bg-secondary">
            <img
              src={story.headerImage}
              alt={story.headline || "Transfer story"}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* Headline and Meta on Right */}
        <div className={!story.headerImage ? "md:col-span-2" : ""}>
          <h1 className="text-4xl font-bold mb-4 text-left">
            <FormattedText text={story.headline || "Transfer Update"} />
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Posted {createdTime}</span>
            {story.updateCount > 0 && (
              <>
                <span>•</span>
                <span>Updated {updatedTime}</span>
                <span className="bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded">
                  {story.updateCount} update{story.updateCount !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        {/* First few paragraphs */}
        {paragraphs.slice(0, 2).map((paragraph, index) => (
          <p key={`p1-${index}`} className="text-lg leading-relaxed mb-4">
            <FormattedText text={paragraph} />
          </p>
        ))}

        {/* Tweet Widgets - Main and Related */}
        <div className="my-8 space-y-6">
          {/* Main Tweet */}
          <div className="bg-secondary/30 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-orange-500 mb-4 uppercase tracking-wider">
              Original Report
            </h3>
            <TweetWidget tweet={story.tweet} source={story.tweet.source} />
          </div>

          {/* Related Tweets */}
          {story.relatedTweets && story.relatedTweets.length > 0 && (
            <div className="bg-secondary/30 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-orange-500 mb-4 uppercase tracking-wider">
                Additional Sources ({story.relatedTweets.length})
              </h3>
              <div className="space-y-4">
                {story.relatedTweets.map((related, index) => (
                  <TweetWidget 
                    key={index} 
                    tweet={related.tweet} 
                    source={related.tweet.source} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rest of the article */}
        {paragraphs.slice(2).map((paragraph, index) => {
          // Check if this is an update paragraph
          const isUpdate = paragraph.startsWith("**Update**:");

          if (isUpdate) {
            return (
              <div
                key={`p2-${index}`}
                className="my-6 p-4 bg-orange-500/10 border-l-4 border-orange-500 rounded-r-lg"
              >
                <p className="text-base">
                  <FormattedText text={paragraph} />
                </p>
              </div>
            );
          }

          return (
            <p key={`p2-${index}`} className="text-lg leading-relaxed mb-4">
              <FormattedText text={paragraph} />
            </p>
          );
        })}
      </div>

      {/* Article Footer */}
      <div className="mt-12 pt-8 border-t border-border">
        <p className="text-sm text-muted-foreground text-center">
          Story ID: {story.id} • Sources: {story.tweet.source.name}
          {story.relatedTweets && story.relatedTweets.length > 0 && (
            <>
              {story.relatedTweets.map((rt) => `, ${rt.tweet.source.name}`).join('')}
            </>
          )}
        </p>
      </div>
    </article>
  );
}
