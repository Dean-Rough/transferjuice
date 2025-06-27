/**
 * Briefing Content Component
 * Renders the main article content with Terry's commentary, interspersed with inline media
 */

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  Twitter as TwitterIcon,
  Quote,
  MessageCircle,
  Repeat2,
  Heart,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type { BriefingSection } from "@/types/briefing";
import { ShithouseCornerSection } from "./TikTokEmbed";
import { TweetEmbed as ProperTweetEmbed } from "@/components/media/TweetEmbed";
import { EnhancedBriefingContent } from "./EnhancedBriefingContent";
import { BriefingErrorBoundary } from "./BriefingErrorBoundary";
import { fetchPlayerImage } from "@/lib/media/wikimediaApi";

interface BriefingContentProps {
  sections: BriefingSection[];
  feedItems: any[];
}

// Known clubs and players for auto-linking
const KNOWN_CLUBS = [
  "Arsenal",
  "Chelsea",
  "Liverpool",
  "Manchester United",
  "Manchester City",
  "Tottenham",
  "Newcastle",
  "Brighton",
  "West Ham",
  "Aston Villa",
  "Real Madrid",
  "Barcelona",
  "Atletico Madrid",
  "Bayern Munich",
  "PSG",
  "Juventus",
  "Inter Milan",
  "AC Milan",
  "Dortmund",
  "Ajax",
];

const KNOWN_PLAYERS = [
  "Haaland",
  "Mbappe",
  "Bellingham",
  "Kane",
  "Saka",
  "Rice",
  "Bruno Fernandes",
  "Salah",
  "De Bruyne",
  "Rashford",
];

// Parse content and highlight clubs/players without linking
function parseAndLinkContent(text: string): React.ReactNode {
  // Sort entities by length (longest first) to handle compound names properly
  const sortedClubs = [...KNOWN_CLUBS].sort((a, b) => b.length - a.length);
  const sortedPlayers = [...KNOWN_PLAYERS].sort((a, b) => b.length - a.length);

  // Create a single array of all entities
  const allEntities = [...sortedClubs, ...sortedPlayers];

  // Create a regex that captures the entities
  const pattern = new RegExp(
    `(${allEntities.map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );

  const parts = text.split(pattern);

  return parts.map((part, index) => {
    // Check if this part matches a club or player
    const matchedClub = KNOWN_CLUBS.find(
      (club) => club.toLowerCase() === part.toLowerCase(),
    );
    const matchedPlayer = KNOWN_PLAYERS.find(
      (player) => player.toLowerCase() === part.toLowerCase(),
    );

    if (matchedClub || matchedPlayer) {
      // Just style the text without linking
      return (
        <span
          key={index}
          className="text-orange-400 font-semibold hover:text-orange-300 transition-colors"
        >
          {part}
        </span>
      );
    }

    return part;
  });
}

export function BriefingContent({ sections, feedItems }: BriefingContentProps) {
  // Handle case where sections might not be an array
  if (!sections || !Array.isArray(sections)) {
    return (
      <div className="briefing-content">
        <p className="text-zinc-400">No content sections available.</p>
      </div>
    );
  }

  // Generate inline media items from feed items
  const inlineMedia = generateInlineMedia(feedItems);

  return (
    <BriefingErrorBoundary>
      <div className="briefing-content space-y-10">
        {sections.map((section, index) => (
          <React.Fragment key={section.id || index}>
            <BriefingErrorBoundary>
              <section
                className={`content-section section-${section.type}`}
                data-section-type={section.type}
              >
                {renderSection(section)}
              </section>
            </BriefingErrorBoundary>

            {/* Add inline media after every 2nd section */}
            {(index + 1) % 2 === 0 && inlineMedia[Math.floor(index / 2)] && (
              <BriefingErrorBoundary>
                <div className="inline-media-break">
                  {renderInlineMedia(inlineMedia[Math.floor(index / 2)])}
                </div>
              </BriefingErrorBoundary>
            )}
          </React.Fragment>
        ))}

        {/* Always add Shithouse Corner at the end */}
        <BriefingErrorBoundary>
          <ShithouseCornerSection />
        </BriefingErrorBoundary>
      </div>
    </BriefingErrorBoundary>
  );
}

function renderSection(section: BriefingSection) {
  switch (section.type) {
    case "intro":
      return <IntroSection content={section.content} />;

    case "transfer":
      return <TransferSection section={section} />;

    case "partner":
      return <PartnerSection section={section} />;

    case "analysis":
      return <AnalysisSection section={section} />;

    case "outro":
      return <OutroSection content={section.content} />;

    // case "shithouse":
    //   return <ShithouseSection section={section} />;

    default:
      return <GenericSection section={section} />;
  }
}

// Section Components

function IntroSection({ content }: { content: string }) {
  return (
    <div className="intro-section">
      <p className="text-base md:text-lg text-zinc-300 leading-relaxed">
        {parseAndLinkContent(content)}
      </p>
    </div>
  );
}

function TransferSection({ section }: { section: BriefingSection }) {
  const isBreaking = section.metadata?.priority === "BREAKING";

  return (
    <div className="transfer-section">
      {section.title && (
        <h2
          className={`text-xl md:text-2xl font-black mb-4 leading-tight ${isBreaking ? "text-red-500" : "text-white"}`}
        >
          {isBreaking && <span className="animate-pulse mr-2">🚨</span>}
          {section.title}
        </h2>
      )}

      <div className="transfer-content space-y-4">
        {/* Check if content has any HTML tags (including figures with images) */}
        {(section.content.includes("<") && section.content.includes(">")) ||
        section.content.includes("<figure") ? (
          <EnhancedBriefingContent
            htmlContent={section.content}
            className="transfer-section-content"
          />
        ) : (
          section.content.split("\n\n").map((paragraph, idx) => (
            <p key={idx} className="text-zinc-200 leading-relaxed">
              {parseAndLinkContent(paragraph)}
            </p>
          ))
        )}
      </div>

      {section.feedItemIds && section.feedItemIds.length > 0 && (
        <div className="mt-4 text-sm text-zinc-500">
          <span>{section.feedItemIds.length} sources</span>
        </div>
      )}
    </div>
  );
}

function PartnerSection({ section }: { section: BriefingSection }) {
  return (
    <div className="partner-callout">
      {section.title && (
        <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
      )}

      <div className="partner-content">
        {(section.content.includes("<") && section.content.includes(">")) ||
        section.content.includes("<figure") ? (
          <EnhancedBriefingContent htmlContent={section.content} />
        ) : (
          <p className="text-zinc-200">
            {parseAndLinkContent(section.content)}
          </p>
        )}
      </div>
    </div>
  );
}

function AnalysisSection({ section }: { section: BriefingSection }) {
  const isBullshit = section.title?.toLowerCase().includes("bullshit");

  return (
    <div className={`analysis-section ${isBullshit ? "bullshit-corner" : ""}`}>
      {section.title && (
        <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
      )}

      <div className="analysis-content">
        {(section.content.includes("<") && section.content.includes(">")) ||
        section.content.includes("<figure") ? (
          <EnhancedBriefingContent htmlContent={section.content} />
        ) : (
          <p className="text-zinc-200">
            {parseAndLinkContent(section.content)}
          </p>
        )}
      </div>
    </div>
  );
}

function OutroSection({ content }: { content: string }) {
  return (
    <div className="outro-section text-center">
      <div className="w-16 h-1 bg-orange-500 mx-auto mb-6" />
      <p className="text-lg text-zinc-400 italic">
        {parseAndLinkContent(content)}
      </p>
    </div>
  );
}

function GenericSection({ section }: { section: BriefingSection }) {
  return (
    <div className="generic-section">
      {section.title && (
        <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
      )}
      <div>
        <p className="text-zinc-200">{parseAndLinkContent(section.content)}</p>
      </div>
    </div>
  );
}

function ShithouseSection({ section }: { section: BriefingSection }) {
  return (
    <div className="shithouse-section">
      <div className="content-wrapper">
        <p className="text-zinc-200">{parseAndLinkContent(section.content)}</p>
      </div>
    </div>
  );
}

// Inline Media Helpers

interface InlineMediaItem {
  type: "tweet" | "image" | "quote";
  content: any;
}

function generateInlineMedia(feedItems: any[]): InlineMediaItem[] {
  const mediaItems: InlineMediaItem[] = [];

  if (!feedItems || feedItems.length === 0) return mediaItems;

  // Add tweets from feed items
  feedItems.slice(0, 3).forEach((item) => {
    if (item.feedItem) {
      const feedItem = item.feedItem;
      mediaItems.push({
        type: "tweet",
        content: {
          url: feedItem.originalUrl || "#",
          text: feedItem.content || "Transfer update",
          author: feedItem.source?.name || "ITK Source",
          timestamp: feedItem.publishedAt || new Date(),
          verified: feedItem.source?.isVerified || false,
          tier: feedItem.source?.tier || 3,
        },
      });
    }
  });

  // Add images from feed items that have media
  feedItems.forEach((item) => {
    if (item.feedItem?.media && item.feedItem.media.length > 0) {
      item.feedItem.media.forEach((media: any) => {
        if (media.type === "IMAGE" && media.url) {
          mediaItems.push({
            type: "image",
            content: {
              url: media.url,
              alt: media.altText || "Transfer news image",
              caption: media.caption || "",
              name: media.altText || "Article image",
            },
          });
        }
      });
    }
  });

  // If no images found, add player images from the story
  if (!mediaItems.some((item) => item.type === "image")) {
    // Extract player names from feed items
    const playerNames = new Set<string>();
    feedItems.forEach((item) => {
      if (item.feedItem?.tags?.players) {
        item.feedItem.tags.players.forEach((player: string) => {
          playerNames.add(player);
        });
      }
    });

    // Add player images
    Array.from(playerNames)
      .slice(0, 2)
      .forEach((playerName) => {
        mediaItems.push({
          type: "image",
          content: {
            url: `/images/player-placeholder.svg`, // Use placeholder for now
            alt: `${playerName} transfer news`,
            caption: `${playerName} - Latest transfer target`,
            name: playerName,
          },
        });
      });

    // If still no images, add generic placeholder
    if (mediaItems.filter((item) => item.type === "image").length === 0) {
      mediaItems.push({
        type: "image",
        content: {
          url: `/images/player-placeholder.svg`,
          alt: "Transfer target",
          caption: "Latest transfer news",
          name: "Transfer Target",
        },
      });
    }
  }

  return mediaItems;
}

function renderInlineMedia(mediaItem: InlineMediaItem) {
  switch (mediaItem.type) {
    case "tweet":
      return <TweetEmbed tweet={mediaItem.content} />;
    case "image":
      return <InlineImage image={mediaItem.content} />;
    case "quote":
      return <TerryQuote quote={mediaItem.content} />;
    default:
      return null;
  }
}

// Media Components

function TweetEmbed({ tweet }: { tweet: any }) {
  // Transform data to match ProperTweetEmbed props
  const tweetProps = {
    author: {
      name: tweet.author || "ITK Source",
      handle: tweet.author?.toLowerCase().replace(/\s/g, "") || "itksource",
      verified: tweet.verified || false,
      tier: tweet.tier || 3,
    },
    content: tweet.text || tweet.content || "Transfer update",
    timestamp: new Date(tweet.timestamp || Date.now()),
    engagement: {
      likes: Math.floor(Math.random() * 5000) + 100,
      retweets: Math.floor(Math.random() * 1000) + 50,
      replies: Math.floor(Math.random() * 200) + 10,
    },
  };

  return <ProperTweetEmbed {...tweetProps} />;
}

function InlineImage({ image }: { image: any }) {
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [wikimediaImage, setWikimediaImage] = useState<string | null>(null);

  // Fetch Wikimedia image if this is a player placeholder
  React.useEffect(() => {
    if (image.url?.includes("player-placeholder") && image.name) {
      fetchPlayerImage(image.name)
        .then((result) => {
          if (result.source === "wikimedia") {
            setWikimediaImage(result.url);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch Wikimedia image:", err);
        });
    }
  }, [image.name, image.url]);

  const imageUrl = wikimediaImage || image.url;

  // If image has a URL and hasn't failed, try to display it
  if (imageUrl && !imageError) {
    return (
      <div className="inline-image my-8">
        <div className="relative rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 bg-zinc-800/50 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-zinc-400 animate-spin" />
            </div>
          )}
          <Image
            src={imageUrl}
            alt={image.alt || image.name || "Article image"}
            width={800}
            height={450}
            className="w-full h-auto"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setImageError(true);
              setIsLoading(false);
            }}
            priority={false}
          />
          {image.caption && (
            <p className="mt-2 text-sm text-zinc-400 text-center italic">
              {image.caption}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Error state with retry option
  if (imageError && retryCount < 2) {
    return (
      <div className="inline-image text-center my-8">
        <div className="mx-auto max-w-md">
          <div className="bg-zinc-800/50 rounded-lg p-6 md:p-8 border border-zinc-700 shadow-subtle">
            <AlertCircle className="w-12 md:w-16 h-12 md:h-16 text-red-400 mx-auto mb-4" />
            <p className="text-sm text-zinc-400 mb-2">Failed to load image</p>
            <p className="text-xs text-zinc-500 italic mb-4">
              {image.name || image.alt}
            </p>
            <button
              onClick={() => {
                setImageError(false);
                setRetryCount((prev) => prev + 1);
                setIsLoading(true);
              }}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 inline-block mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback placeholder (no URL or permanent failure)
  return (
    <div className="inline-image text-center my-8">
      <div className="mx-auto max-w-md">
        <div className="bg-zinc-800/50 rounded-lg p-6 md:p-8 border border-zinc-700 shadow-subtle">
          <Camera className="w-12 md:w-16 h-12 md:h-16 text-zinc-400 mx-auto mb-4" />
          <p className="text-sm text-zinc-400 mb-2">
            {image.name || "Transfer Image"}
          </p>
          <p className="text-xs text-zinc-500 italic">
            {image.caption || "Image temporarily unavailable"}
          </p>
        </div>
      </div>
    </div>
  );
}

function TerryQuote({ quote }: { quote: any }) {
  return (
    <div className="terry-quote bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-l-4 border-orange-500 rounded-r-lg p-6">
      <div className="flex items-start gap-4">
        <Quote className="w-8 h-8 text-orange-400 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-orange-400 font-bold mb-2">Terry&apos;s Take</h4>
          <blockquote className="text-lg text-orange-200 italic leading-relaxed mb-3">
            &quot;{quote.text}&quot;
          </blockquote>
          <p className="text-orange-300/70 text-sm">On: {quote.context}</p>
        </div>
      </div>
    </div>
  );
}
