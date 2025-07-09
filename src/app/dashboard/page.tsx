import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { getTimeAgo } from "@/lib/timeUtils";
import { DashboardActions } from "@/components/DashboardActions";
import { DeleteStoryButton } from "@/components/DeleteStoryButton";

const prisma = new PrismaClient();

async function getStories() {
  const stories = await prisma.story.findMany({
    include: {
      tweet: {
        include: {
          source: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return stories;
}

export default async function Dashboard() {
  const stories = await getStories();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Transfer Juice Dashboard</h1>
          <div className="flex gap-4">
            <Link 
              href="/" 
              className="px-4 py-2 text-sm hover:text-orange-500 transition-colors"
            >
              View Site
            </Link>
            <DashboardActions />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Stories ({stories.length})
          </h2>
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        <div className="space-y-4">
          {stories.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-lg">
              <p className="text-muted-foreground">No stories found.</p>
            </div>
          ) : (
            stories.map((story) => (
              <div
                key={story.id}
                className="bg-card border border-border rounded-lg p-6 hover:border-orange-500/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">
                      {story.headline || "Untitled Story"}
                    </h3>
                    
                    <div className="text-sm text-muted-foreground mb-4">
                      <span>ID: {story.id}</span>
                      <span className="mx-2">•</span>
                      <span>Source: {story.tweet.source.name}</span>
                      <span className="mx-2">•</span>
                      <span>Created: {getTimeAgo(new Date(story.createdAt))}</span>
                      {story.updateCount > 0 && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="text-orange-500">
                            {story.updateCount} updates
                          </span>
                        </>
                      )}
                    </div>


                    <div className="flex gap-2">
                      <Link
                        href={`/story/${story.id}`}
                        target="_blank"
                        className="px-3 py-1.5 bg-secondary text-sm rounded hover:bg-secondary/80 transition-colors"
                      >
                        View Story
                      </Link>
                      <Link
                        href={`/dashboard/edit/${story.id}`}
                        className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors"
                      >
                        Edit
                      </Link>
                      <DeleteStoryButton storyId={story.id} />
                    </div>
                  </div>

                  {story.headerImage && (
                    <div className="w-24 h-24 flex-shrink-0">
                      <img
                        src={story.headerImage}
                        alt=""
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}