// Define the type locally since it's not exported
interface EnhancedStory {
  id: string;
  tweet: any;
  headline: string;
  subheadline?: string;
  narrative: string;
  keyEntities: any;
  contextParagraph?: string;
  transferDynamics?: any;
}

interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  structuredData: any;
  ogTags: {
    title: string;
    description: string;
    type: string;
    image?: string;
  };
}

interface BriefingAnalysis {
  mainStory: {
    player?: string;
    fromClub?: string;
    toClub?: string;
    fee?: string;
    status?: string;
  };
  secondaryStories: string[];
  keyPlayers: string[];
  keyClubs: string[];
  transferTypes: string[];
}

// Analyze briefing content to extract key information
export function analyzeBriefingContent(stories: any[]): BriefingAnalysis {
  const analysis: BriefingAnalysis = {
    mainStory: {},
    secondaryStories: [],
    keyPlayers: [],
    keyClubs: [],
    transferTypes: [],
  };

  // Process stories by importance (assuming they're ordered)
  stories.forEach((storyData, index) => {
    const story = storyData.story.metadata as EnhancedStory;
    if (!story) return;

    // Extract player names
    const playerMatch = story.headline.match(
      /([A-Z][a-z]+ [A-Z][a-zöäüßéè]+)/g,
    );
    if (playerMatch) {
      analysis.keyPlayers.push(...playerMatch);
    }

    // Extract club names
    const clubPattern =
      /(Arsenal|Chelsea|Liverpool|Manchester United|Manchester City|Tottenham|Newcastle|West Ham|Bayern Munich|Real Madrid|Barcelona|PSG|Juventus|Milan|Inter|Dortmund)/gi;
    const clubMatches = (story.headline + " " + story.contextParagraph).match(
      clubPattern,
    );
    if (clubMatches) {
      analysis.keyClubs.push(...clubMatches);
    }

    // Extract transfer type
    if (/agreement|agreed|deal reached|here we go/i.test(story.headline)) {
      analysis.transferTypes.push("confirmed");
    } else if (/talks|negotiations|interested/i.test(story.headline)) {
      analysis.transferTypes.push("negotiations");
    } else if (/rejected|turned down|failed/i.test(story.headline)) {
      analysis.transferTypes.push("failed");
    }

    // Process main story (first one)
    if (index === 0) {
      analysis.mainStory.player = playerMatch?.[0];

      // Extract clubs from context
      const fromMatch = story.contextParagraph?.match(
        /from ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      );
      const toMatch = story.contextParagraph?.match(
        /to ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      );

      if (fromMatch) analysis.mainStory.fromClub = fromMatch[1];
      if (toMatch) analysis.mainStory.toClub = toMatch[1];

      // Extract fee
      const feeMatch = story.transferDynamics?.match(/[€£](\d+)m/);
      if (feeMatch) analysis.mainStory.fee = feeMatch[0];

      // Extract status
      if (/agreement|agreed|deal reached|here we go/i.test(story.headline)) {
        analysis.mainStory.status = "confirmed";
      } else if (/advanced talks|close to/i.test(story.headline)) {
        analysis.mainStory.status = "advanced";
      } else {
        analysis.mainStory.status = "developing";
      }
    } else {
      // Secondary stories - extract brief summaries
      const summary = playerMatch?.[0] || clubMatches?.[0] || "Transfer update";
      analysis.secondaryStories.push(summary);
    }
  });

  // Deduplicate
  analysis.keyPlayers = [...new Set(analysis.keyPlayers)];
  analysis.keyClubs = [...new Set(analysis.keyClubs)];
  analysis.transferTypes = [...new Set(analysis.transferTypes)];

  return analysis;
}

// Generate SEO-optimized headline based on content weight
export function generateOptimizedHeadline(
  analysis: BriefingAnalysis,
  date: Date,
): string {
  const dateStr = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });

  // If we have a confirmed main story
  if (analysis.mainStory.status === "confirmed" && analysis.mainStory.player) {
    if (analysis.mainStory.toClub) {
      return `${analysis.mainStory.player} to ${analysis.mainStory.toClub} CONFIRMED - Transfer News ${dateStr}`;
    }
    return `BREAKING: ${analysis.mainStory.player} Transfer Agreed - ${dateStr} Update`;
  }

  // Advanced negotiations
  if (analysis.mainStory.status === "advanced" && analysis.mainStory.player) {
    const clubs = [];
    if (analysis.mainStory.toClub) clubs.push(analysis.mainStory.toClub);
    if (analysis.mainStory.fromClub) clubs.push(analysis.mainStory.fromClub);

    if (clubs.length > 0) {
      return `${analysis.mainStory.player} Transfer Latest: ${clubs.join(" and ")} in Advanced Talks - ${dateStr}`;
    }
    return `${analysis.mainStory.player} Transfer Update - ${dateStr} Briefing`;
  }

  // Multiple big stories
  if (analysis.keyPlayers.length >= 3) {
    const topPlayers = analysis.keyPlayers.slice(0, 3).join(", ");
    return `Transfer News: ${topPlayers} - ${dateStr} Briefing`;
  }

  // Club-focused headline
  if (analysis.keyClubs.length >= 2) {
    const topClubs = analysis.keyClubs.slice(0, 2).join(" and ");
    return `${topClubs} Transfer Updates - ${dateStr} Briefing`;
  }

  // Default with key player if available
  if (analysis.keyPlayers.length > 0) {
    return `${analysis.keyPlayers[0]} Headlines Transfer News - ${dateStr} Briefing`;
  }

  // Fallback
  return `Transfer Briefing: Latest Updates - ${dateStr}`;
}

// Generate meta description focusing on main stories
export function generateMetaDescription(analysis: BriefingAnalysis): string {
  const parts: string[] = [];

  // Lead with main story
  if (analysis.mainStory.player) {
    let mainPart = `${analysis.mainStory.player}`;
    if (analysis.mainStory.toClub) {
      mainPart += ` to ${analysis.mainStory.toClub}`;
    }
    if (analysis.mainStory.fee) {
      mainPart += ` for ${analysis.mainStory.fee}`;
    }
    if (analysis.mainStory.status === "confirmed") {
      mainPart += " transfer confirmed";
    } else {
      mainPart += " transfer latest";
    }
    parts.push(mainPart);
  }

  // Add secondary stories
  if (analysis.secondaryStories.length > 0) {
    parts.push(
      `Plus updates on ${analysis.secondaryStories.slice(0, 2).join(" and ")}`,
    );
  }

  // Add general context
  parts.push("Get the latest transfer news, rumours and confirmed deals");

  return parts.join(". ").substring(0, 160); // Meta descriptions should be under 160 chars
}

// Generate structured data for search engines
export function generateStructuredData(
  briefing: any,
  analysis: BriefingAnalysis,
  url: string,
): any {
  const stories = briefing.stories || [];

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: briefing.title,
    description: generateMetaDescription(analysis),
    datePublished: briefing.publishedAt || briefing.createdAt,
    dateModified: briefing.updatedAt || briefing.createdAt,
    author: {
      "@type": "Organization",
      name: "TransferJuice",
      logo: {
        "@type": "ImageObject",
        url: `${url}/transfer-logo-cream.svg`,
      },
    },
    publisher: {
      "@type": "Organization",
      name: "TransferJuice",
      logo: {
        "@type": "ImageObject",
        url: `${url}/transfer-logo-cream.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${url}/briefing/${briefing.id}`,
    },
    keywords: [
      ...analysis.keyPlayers.map((p) => `${p} transfer`),
      ...analysis.keyClubs.map((c) => `${c} transfers`),
      "transfer news",
      "football transfers",
      "transfer rumours",
      "transfer briefing",
    ].join(", "),
    articleSection: "Football Transfers",
    about: analysis.keyPlayers.map((player) => ({
      "@type": "Person",
      name: player,
      sameAs: `https://en.wikipedia.org/wiki/${player.replace(" ", "_")}`,
    })),
  };
}

// Generate complete SEO metadata for a briefing
export function generateSEOMetadata(
  briefing: any,
  baseUrl: string = "https://transferjuice.com",
): SEOMetadata {
  const analysis = analyzeBriefingContent(briefing.stories || []);
  const publishDate = new Date(briefing.publishedAt || briefing.createdAt);

  const optimizedTitle = generateOptimizedHeadline(analysis, publishDate);
  const metaDescription = generateMetaDescription(analysis);

  // Extract main image if available
  let mainImage: string | undefined;
  if (briefing.stories?.[0]?.story?.metadata?.image) {
    mainImage = briefing.stories[0].story.metadata.image;
  }

  return {
    title: optimizedTitle,
    description: metaDescription,
    keywords: [
      ...analysis.keyPlayers.map((p) => `${p} transfer`),
      ...analysis.keyClubs,
      "transfer news",
      "football transfers",
      publishDate.toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      }) + " transfers",
    ],
    structuredData: generateStructuredData(briefing, analysis, baseUrl),
    ogTags: {
      title: optimizedTitle,
      description: metaDescription,
      type: "article",
      image: mainImage,
    },
  };
}

// Generate RSS feed metadata
export function generateRSSMetadata(briefing: any): {
  title: string;
  description: string;
  guid: string;
  pubDate: string;
  categories: string[];
} {
  const analysis = analyzeBriefingContent(briefing.stories || []);
  const publishDate = new Date(briefing.publishedAt || briefing.createdAt);

  return {
    title: generateOptimizedHeadline(analysis, publishDate),
    description: generateMetaDescription(analysis),
    guid: briefing.id,
    pubDate: publishDate.toUTCString(),
    categories: [
      ...analysis.keyClubs,
      ...analysis.transferTypes.map((t) => `transfer-${t}`),
      "football",
      "transfers",
    ],
  };
}
