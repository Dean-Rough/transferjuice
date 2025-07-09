import { PrismaClient } from "@prisma/client";
import { StoryArticle } from "@/components/StoryArticle";
import { BreakingNewsTicker } from "@/components/BreakingNewsTicker";
import { Header } from "@/components/Header";
import Link from "next/link";
import { getTimeAgo } from "@/lib/timeUtils";

const prisma = new PrismaClient();

async function getRecentStories() {
  const stories = await prisma.story.findMany({
    where: {
      headline: { not: null },
      articleContent: { not: null },
    },
    include: {
      tweet: {
        include: {
          source: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 20,
  });

  return stories;
}

export default async function StoriesPage() {
  const stories = await getRecentStories();

  return (
    <div className="min-h-screen bg-background">
      {/* Breaking News Ticker */}
      <BreakingNewsTicker />

      {/* Main Header */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-8 max-w-7xl py-8">
        <h1 className="text-4xl font-bold mb-2">Transfer Stories</h1>
        <p className="text-lg text-muted-foreground mb-8">
          The latest transfer news, written by someone who&apos;s had enough of all
          this
        </p>

        {/* Stories Grid */}
        {stories.length > 0 ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {stories.map((story) => (
              <Link
                key={story.id}
                href={`/story/${story.id}`}
                className="group block break-inside-avoid"
              >
                <article className="bg-card border border-border rounded-lg overflow-hidden hover:border-orange-500/50 transition-colors">
                  {/* Square Image */}
                  {story.headerImage && (
                    <div className="aspect-square overflow-hidden bg-secondary">
                      <img
                        src={story.headerImage}
                        alt={story.headline?.replace(/\*\*/g, '') || ""}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    <h2 className="text-xl font-bold mb-4 group-hover:text-orange-500 transition-colors">
                      {story.headline?.replace(/\*\*/g, '')}
                    </h2>

                    {/* Meta */}
                    <div className="text-xs text-muted-foreground">
                      <span>Source: {story.tweet.source.name}</span>
                      <span className="mx-2">•</span>
                      <span>{getTimeAgo(new Date(story.createdAt))}</span>
                      {story.updateCount > 0 && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="text-orange-500">
                            {story.updateCount} update{story.updateCount !== 1 ? 's' : ''}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">
              No stories yet. Check back in a bit, or yell at the ITKs to tweet
              something.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
