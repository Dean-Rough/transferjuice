"use client";

interface Story {
  id: string;
  terryComment: string;
  tweet: {
    id: string;
    content: string;
    url: string;
    source: {
      name: string;
      handle: string;
    };
  };
}

interface SimpleBriefingCardProps {
  title: string;
  stories: Array<{
    story: Story;
  }>;
  publishedAt: Date;
}

export function SimpleBriefingCard({
  title,
  stories,
  publishedAt,
}: SimpleBriefingCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6 hover:border-orange-500/20 transition-colors">
      <div className="mb-6 border-b border-border pb-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground font-mono">
          {new Date(publishedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      <div className="space-y-8">
        {stories.map(({ story }) => (
          <div
            key={story.id}
            className="border-b border-border pb-6 last:border-b-0"
          >
            <div className="mb-3">
              <div className="flex items-center gap-2 text-sm mb-4">
                <span className="font-semibold text-orange-500">
                  {story.tweet.source.name}
                </span>
                <span className="text-muted-foreground">
                  {story.tweet.source.handle}
                </span>
              </div>

              {/* Tweet Content */}
              <div className="my-4 bg-secondary/50 border border-border rounded-lg p-5">
                <p className="text-foreground leading-relaxed">
                  {story.tweet.content}
                </p>
                <a
                  href={story.tweet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 text-sm mt-3 inline-block hover:text-orange-400 transition-colors"
                >
                  View on Twitter →
                </a>
              </div>

              {/* Terry's Comment */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mt-4">
                <p className="text-xs font-mono text-orange-500 mb-2">
                  TERRY&apos;S TAKE:
                </p>
                <p className="text-foreground italic leading-relaxed">
                  {story.terryComment}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
