import { BreakingNewsTicker } from "@/components/BreakingNewsTicker";
import { Header } from "@/components/Header";
import { AutoScrollRSSWidget } from "@/components/AutoScrollRSSWidget";
import { MobileTabNavigation } from "@/components/MobileTabNavigation";
import Link from "next/link";
import { getTimeAgo } from "@/lib/timeUtils";
import { FormattedText } from "@/components/FormattedText";

interface Story {
  id: string;
  headline: string | null;
  articleContent: string | null;
  headerImage: string | null;
  updateCount: number;
  createdAt: Date;
  updatedAt: Date;
  tweet: {
    content: string;
    url: string;
    source: {
      name: string;
      handle: string;
    };
  };
}

export function PageContent({ stories }: { stories: Story[] }) {
  // Stories content for mobile and desktop
  const storiesContent = (
    <>
      {/* Hero Section - Latest Story */}
      {stories.length > 0 && (
        <Link href={`/story/${stories[0].id}`} className="block mb-6 sm:mb-8 lg:mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 items-center">
            {/* Square image on the left */}
            {stories[0].headerImage && (
              <div className="aspect-square overflow-hidden rounded-lg bg-secondary">
                <img
                  src={stories[0].headerImage}
                  alt={stories[0].headline?.replace(/\*\*/g, '') || ""}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Headline on the right */}
            <div className={!stories[0].headerImage ? "md:col-span-2" : ""}>
              <h1 className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 hover:text-orange-500 transition-colors leading-tight">
                <FormattedText text={stories[0].headline?.replace(/\*\*/g, '') || ''} />
              </h1>
              <div className="text-xs sm:text-sm text-muted-foreground">
                <span>Source: {stories[0].tweet.source.name}</span>
                <span className="mx-2">•</span>
                <span>{getTimeAgo(new Date(stories[0].createdAt))}</span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* More Transfer Stories */}
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6">More Transfer Stories</h2>
      
      {/* Masonry grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 sm:gap-6">
        {stories.slice(1).map((story) => (
          <Link
            key={story.id}
            href={`/story/${story.id}`}
            className="group block break-inside-avoid mb-4 sm:mb-6 touch-feedback"
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
              <div className="p-3 sm:p-4 lg:p-6">
                <h3 className="text-sm sm:text-base lg:text-lg font-bold mb-2 sm:mb-3 group-hover:text-orange-500 transition-colors leading-tight">
                  <FormattedText text={story.headline?.replace(/\*\*/g, '') || ''} />
                </h3>

                {/* Meta */}
                <div className="text-xs text-muted-foreground">
                  <span className="block sm:inline">Source: {story.tweet.source.name}</span>
                  <span className="hidden sm:inline mx-2">•</span>
                  <span className="block sm:inline">{getTimeAgo(new Date(story.createdAt))}</span>
                  {story.updateCount > 0 && (
                    <>
                      <span className="hidden sm:inline mx-2">•</span>
                      <span className="text-orange-500 block sm:inline">
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

      {stories.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No stories available at the moment. Check back soon!
        </div>
      )}
    </>
  );

  // RSS content for mobile
  const rssContent = (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Live Transfer Feed</h2>
      <p className="text-sm text-muted-foreground">
        Real-time updates from trusted transfer sources
      </p>
      <AutoScrollRSSWidget />
    </div>
  );

  // Desktop layout (unchanged)
  const desktopContent = (
    <div className="container mx-auto px-4 lg:px-8 max-w-7xl py-8">
      {/* Main content - 66/33 split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left content - Stories (66%) */}
        <div className="lg:col-span-2">
          {storiesContent}
        </div>

        {/* Right sidebar - RSS Widget (33%) */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <h2 className="text-xl font-bold mb-4">Live Transfer Feed</h2>
            <AutoScrollRSSWidget />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Breaking News Ticker */}
      <BreakingNewsTicker />

      {/* Main Header */}
      <Header />

      {/* Content with mobile tabs */}
      <MobileTabNavigation
        rssContent={
          <div className="container mx-auto px-4 py-4 sm:py-6">
            {rssContent}
          </div>
        }
        storiesContent={
          <div className="container mx-auto px-4 py-4 sm:py-6">
            {storiesContent}
          </div>
        }
      >
        {desktopContent}
      </MobileTabNavigation>
    </>
  );
}