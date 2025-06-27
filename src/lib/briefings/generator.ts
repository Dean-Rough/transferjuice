/**
 * Core Briefing Generation Logic
 * Orchestrates the hourly briefing creation pipeline
 */

import type { Briefing } from "@prisma/client";
import {
  createBriefing,
  briefingExistsForTimestamp,
} from "@/lib/database/briefings";
import type { BriefingContent } from "@/types/briefing";
import { getTweetsForBriefing, syncGlobalSourcesToDatabase } from "./twitter";
import { generateTerryContent } from "./terry";
import { mixPartnerContent } from "./partner";
import { addPlayerImagesToContent } from "@/lib/images/playerImageFetcher";
import { generateSlug } from "@/lib/utils/slug";
import { findSimilarBriefedStories } from "@/lib/database/feedItems";
import {
  formatBriefingContent,
  generateTableOfContents,
} from "./contentFormatter";

export interface GenerateBriefingOptions {
  timestamp: Date;
  testMode?: boolean;
  forceRegenerate?: boolean;
}

export interface GenerationResult {
  briefing: Briefing;
  stats: {
    tweetsProcessed: number;
    sourcesMonitored: number;
    processingTime: number;
    terryScore: number;
  };
}

export async function generateBriefing(
  options: GenerateBriefingOptions,
): Promise<Briefing> {
  const { timestamp, testMode = false, forceRegenerate = false } = options;

  console.log(`🚀 Generating briefing for ${timestamp.toISOString()}`);

  // Check if briefing already exists
  if (!forceRegenerate && (await briefingExistsForTimestamp(timestamp))) {
    throw new Error(`Briefing already exists for ${timestamp.toISOString()}`);
  }

  try {
    // Step 1: Sync sources (run periodically)
    await syncGlobalSourcesToDatabase();

    // Step 2: Fetch tweets from ITK sources
    console.log("📡 Fetching tweets...");
    const { feedItems, stats } = await getTweetsForBriefing(timestamp);

    if (feedItems.length === 0 && !testMode) {
      throw new Error("No relevant tweets found for briefing generation");
    }

    // For test mode, create mock feed items
    const itemsToProcess =
      testMode && feedItems.length === 0 ? createMockFeedItems() : feedItems;

    console.log(`✅ Found ${itemsToProcess.length} relevant feed items`);

    // Step 2.5: Check for duplicate stories and filter out already briefed content
    console.log("🔍 Checking for duplicate stories...");
    const duplicateChecks = await findSimilarBriefedStories(itemsToProcess, 48);

    // Filter out items that are too similar to recently briefed content
    const filteredItems = itemsToProcess.filter((item) => {
      const duplicateCheck = duplicateChecks.find(
        (check) => check.item.id === item.id,
      );
      if (duplicateCheck && duplicateCheck.similarBriefings.length > 0) {
        const maxSimilarity = Math.max(
          ...duplicateCheck.similarBriefings.map((s) => s.similarity),
        );
        if (maxSimilarity > 0.8) {
          console.log(
            `⏭️ Skipping duplicate story: ${item.content.substring(0, 100)}... (similarity: ${maxSimilarity})`,
          );
          return false;
        } else if (maxSimilarity > 0.6) {
          console.log(
            `⚠️ Similar story found but including with new angle: ${item.content.substring(0, 100)}... (similarity: ${maxSimilarity})`,
          );
          // Add context about previous coverage
          item.briefingHistory = duplicateCheck.similarBriefings;
        }
      }
      return true;
    });

    console.log(
      `📝 Processing ${filteredItems.length} unique stories (filtered out ${itemsToProcess.length - filteredItems.length} duplicates)`,
    );

    if (filteredItems.length === 0 && !testMode) {
      throw new Error(
        "All stories have been recently briefed - no new content to generate",
      );
    }

    // Step 3: Generate Terry content
    console.log("🎭 Generating Terry commentary...");
    const terryContent = await generateTerryContent(filteredItems, timestamp);

    // Step 4: Mix in partner content if needed
    console.log("🤝 Checking for partner content...");
    const mixedContent = await mixPartnerContent(
      terryContent.sections,
      filteredItems,
      timestamp,
    );

    // Step 5: Add player images to content
    console.log("📸 Adding player images...");
    const sectionsWithImages = await Promise.all(
      mixedContent.map(async (section) => {
        if (section.type === "transfer" || section.type === "analysis") {
          const contentWithImages = await addPlayerImagesToContent(
            section.content,
            filteredItems.filter((item) =>
              section.feedItemIds?.includes(item.id),
            ),
          );
          return { ...section, content: contentWithImages };
        }
        return section;
      }),
    );

    // Step 5.5: Format content with rich formatting (bold/links for players, clubs, fees)
    console.log("✨ Formatting content with rich styling...");
    const richlyFormattedSections = sectionsWithImages.map((section) => {
      const relatedFeedItems = filteredItems.filter((item) =>
        section.feedItemIds?.includes(item.id),
      );

      // Temporarily disable HTML formatting due to malformed HTML issue
      // TODO: Fix the formatBriefingContent function to generate valid HTML
      // const formattedContent = formatBriefingContent(
      //   section.content,
      //   relatedFeedItems,
      //   {
      //     linkPlayers: true,
      //     linkClubs: true,
      //     boldEntities: true,
      //     includeTweets: true,
      //     baseUrl: process.env.APP_URL || "http://localhost:3000",
      //   }
      // );

      return { ...section, content: section.content };
    });

    // Step 6: Generate table of contents for long briefings
    const tableOfContents = generateTableOfContents(richlyFormattedSections);

    // Step 7: Calculate metadata
    const wordCount = calculateWordCount(richlyFormattedSections);
    const readTime = Math.ceil(wordCount / 200); // 200 words per minute

    // Step 7.5: Generate polaroids for timeline
    console.log("📸 Generating polaroids for timeline...");
    const { generatePolaroids } = await import("@/lib/briefings/polaroids");
    const timelineWithPolaroids = await generatePolaroids(
      filteredItems,
      terryContent.timelineItems || [],
    );

    // Step 8: Create briefing content structure
    const briefingContent: BriefingContent = {
      title: terryContent.title,
      sections: richlyFormattedSections,
      visualTimeline: timelineWithPolaroids, // Use timeline items with polaroids
      sidebar: terryContent.sidebar,
    };

    // Step 9: Save to database
    console.log("💾 Saving briefing...");

    // In test mode with mock data, skip feed item relationships to avoid foreign key errors
    const feedItemIds =
      testMode && feedItems.length === 0
        ? [] // Skip feed item relationships for mock data
        : itemsToProcess.map((item) => item.id);

    const briefing = await createBriefing({
      timestamp,
      title: briefingContent.title,
      content: briefingContent.sections,
      visualTimeline: briefingContent.visualTimeline,
      sidebarSections: briefingContent.sidebar,
      readTime,
      wordCount,
      terryScore: terryContent.terryScore,
      feedItemIds,
      tagIds: extractTagIds(itemsToProcess),
    });

    // Step 9.5: Save polaroid media
    console.log("💾 Saving polaroid media...");
    if (briefing && timelineWithPolaroids.length > 0) {
      const { prisma } = await import("@/lib/prisma");
      const polaroidMedia = timelineWithPolaroids
        .filter((item) => item.polaroid?.imageUrl)
        .map((item) => ({
          briefingId: briefing.id,
          type: "POLAROID" as const,
          url: item.polaroid!.imageUrl!,
          playerName: item.polaroid!.playerName,
          clubName: item.polaroid!.clubName,
          frameColor: item.polaroid!.frameColor,
          altText: `${item.polaroid!.playerName} - ${item.polaroid!.clubName}`,
        }));

      if (polaroidMedia.length > 0) {
        await prisma.briefingMedia.createMany({
          data: polaroidMedia,
        });
        console.log(`✅ Saved ${polaroidMedia.length} polaroid images`);
      }
    }

    // Step 9: Publish if not test mode
    if (!testMode && briefing) {
      await publishBriefing(briefing.id);
    }

    console.log(`✅ Briefing generated successfully: ${briefing.slug}`);

    return briefing;
  } catch (error) {
    console.error("❌ Briefing generation failed:", error);
    throw error;
  }
}

/**
 * Calculate total word count
 */
function calculateWordCount(sections: BriefingContent["sections"]): number {
  return sections.reduce((total, section) => {
    const words = section.content.split(/\s+/).length;
    return total + words;
  }, 0);
}

/**
 * Extract unique tag IDs from feed items
 */
function extractTagIds(feedItems: any[]): string[] {
  const tagIds = new Set<string>();

  feedItems.forEach((item) => {
    if (item.tags) {
      item.tags.forEach((tag: any) => {
        if (tag.tagId) {
          tagIds.add(tag.tagId);
        } else if (tag.tag?.id) {
          tagIds.add(tag.tag.id);
        }
      });
    }
  });

  return Array.from(tagIds);
}

/**
 * Publish briefing
 */
async function publishBriefing(briefingId: string): Promise<void> {
  const { updateBriefing } = await import("@/lib/database/briefings");
  await updateBriefing(briefingId, {
    isPublished: true,
    publishedAt: new Date(),
  });
}

/**
 * Create mock feed items for testing
 */
function createMockFeedItems(): any[] {
  return [
    {
      id: "mock-1",
      type: "ITK",
      content:
        "BREAKING: Arsenal preparing £100m bid for striker who reportedly struggles with basic motor functions. Medical team on standby. More to follow... 🔴⚪ #AFC",
      originalText: "BREAKING: Arsenal preparing £100m bid for striker...",
      sourceId: "source-1",
      source: {
        id: "source-1",
        name: "Fabrizio Romano",
        username: "FabrizioRomano",
        tier: 1,
        reliability: 0.95,
      },
      publishedAt: new Date(),
      priority: "HIGH",
      relevanceScore: 0.9,
      tags: [],
    },
    {
      id: "mock-2",
      type: "ITK",
      content:
        "Chelsea considering move for 18-year-old wonderkid from Brazilian third division. Scouting department using advanced FIFA Career Mode analytics. #CFC",
      originalText: "Chelsea considering move for 18-year-old wonderkid...",
      sourceId: "source-2",
      source: {
        id: "source-2",
        name: "David Ornstein",
        username: "David_Ornstein",
        tier: 1,
        reliability: 0.92,
      },
      publishedAt: new Date(),
      priority: "MEDIUM",
      relevanceScore: 0.8,
      tags: [],
    },
  ];
}
