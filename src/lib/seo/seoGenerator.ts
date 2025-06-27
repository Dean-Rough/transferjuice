/**
 * Automated SEO System for Transfer Juice
 * Generates optimized metadata, structured data, and social sharing content
 */

import type { Briefing, FeedItem } from "@prisma/client";
import { format } from "date-fns";

interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  openGraph: {
    title: string;
    description: string;
    type: string;
    url: string;
    images: Array<{
      url: string;
      width: number;
      height: number;
      alt: string;
    }>;
    siteName: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    images: string[];
    creator: string;
    site: string;
  };
  structuredData: Record<string, any>;
  canonical: string;
}

interface SEOConfig {
  siteName: string;
  siteUrl: string;
  defaultImage: string;
  twitterHandle: string;
  author: string;
  keywords: string[];
}

const seoConfig: SEOConfig = {
  siteName: "Transfer Juice",
  siteUrl: "https://transferjuice.com",
  defaultImage: "https://transferjuice.com/images/og-default.jpg",
  twitterHandle: "@TransferJuice",
  author: "Transfer Juice",
  keywords: [
    "football transfers",
    "transfer news",
    "football rumors",
    "soccer transfers",
    "premier league transfers",
    "football briefings",
    "transfer window",
    "football market",
    "player transfers",
    "football ITK"
  ]
};

export class SEOGenerator {
  /**
   * Generate SEO metadata for homepage
   */
  static generateHomeSEO(): SEOMetadata {
    const title = "Transfer Juice - Latest Football Transfer News & Briefings";
    const description = "Get the latest football transfer news, rumors, and insights with our Terry-style briefings. Updated hourly with the most reliable ITK sources.";
    
    return {
      title,
      description,
      keywords: [...seoConfig.keywords, "transfer briefings", "football news", "ITK sources"],
      openGraph: {
        title,
        description,
        type: "website",
        url: seoConfig.siteUrl,
        images: [{
          url: seoConfig.defaultImage,
          width: 1200,
          height: 630,
          alt: "Transfer Juice - Football Transfer News"
        }],
        siteName: seoConfig.siteName
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [seoConfig.defaultImage],
        creator: seoConfig.twitterHandle,
        site: seoConfig.twitterHandle
      },
      structuredData: this.generateWebsiteStructuredData(),
      canonical: seoConfig.siteUrl
    };
  }

  /**
   * Generate SEO metadata for briefing pages
   */
  static generateBriefingSEO(briefing: any): SEOMetadata {
    const date = format(new Date(briefing.timestamp), "MMMM d, yyyy");
    const time = format(new Date(briefing.timestamp), "HH:mm");
    
    // Handle title properly - it might be a JSON object or string
    const titleObj = typeof briefing.title === 'string' 
      ? { main: briefing.title } 
      : briefing.title || { main: "Transfer Briefing" };
    
    const briefingTitle = titleObj.main || "Transfer Briefing";
    const title = `${briefingTitle} - ${date} | Transfer Juice`;
    
    // Generate description from content since summary might not exist
    const description = this.extractDescription(briefing.content) || `Latest transfer briefing from ${date}`;
    
    // Extract key entities for keywords (handle potential null content)
    const entities = briefing.content ? this.extractEntities(briefing.content) : [];
    const keywords = [...seoConfig.keywords, ...entities, date.toLowerCase()];

    const briefingUrl = `${seoConfig.siteUrl}/briefings/${briefing.slug}`;
    const imageUrl = seoConfig.defaultImage; // Use default since featuredImage doesn't exist in schema

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        type: "article",
        url: briefingUrl,
        images: [{
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: briefingTitle
        }],
        siteName: seoConfig.siteName
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
        creator: seoConfig.twitterHandle,
        site: seoConfig.twitterHandle
      },
      structuredData: this.generateBriefingStructuredData(briefing),
      canonical: briefingUrl
    };
  }

  /**
   * Generate SEO metadata for archive pages
   */
  static generateArchiveSEO(page: number = 1): SEOMetadata {
    const title = page === 1 
      ? "Transfer Briefings Archive | Transfer Juice"
      : `Transfer Briefings Archive - Page ${page} | Transfer Juice`;
    
    const description = "Browse our complete archive of football transfer briefings with Terry's expert insights and analysis.";
    
    return {
      title,
      description,
      keywords: [...seoConfig.keywords, "archive", "briefings", "history"],
      openGraph: {
        title,
        description,
        type: "website",
        url: `${seoConfig.siteUrl}/archive${page > 1 ? `?page=${page}` : ""}`,
        images: [{
          url: seoConfig.defaultImage,
          width: 1200,
          height: 630,
          alt: "Transfer Juice Archive"
        }],
        siteName: seoConfig.siteName
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [seoConfig.defaultImage],
        creator: seoConfig.twitterHandle,
        site: seoConfig.twitterHandle
      },
      structuredData: this.generateCollectionStructuredData("archive"),
      canonical: `${seoConfig.siteUrl}/archive`
    };
  }

  /**
   * Generate website structured data
   */
  private static generateWebsiteStructuredData() {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": seoConfig.siteName,
      "url": seoConfig.siteUrl,
      "description": "Latest football transfer news and briefings",
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${seoConfig.siteUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      },
      "publisher": {
        "@type": "Organization",
        "name": seoConfig.siteName,
        "url": seoConfig.siteUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${seoConfig.siteUrl}/images/logo.png`
        }
      }
    };
  }

  /**
   * Generate briefing structured data
   */
  private static generateBriefingStructuredData(briefing: any) {
    // Handle title properly - it might be a JSON object or string
    const titleObj = typeof briefing.title === 'string' 
      ? { main: briefing.title } 
      : briefing.title || { main: "Transfer Briefing" };
    
    const briefingTitle = titleObj.main || "Transfer Briefing";
    
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": briefingTitle,
      "description": this.extractDescription(briefing.content) || `Latest transfer briefing`,
      "image": seoConfig.defaultImage,
      "datePublished": briefing.timestamp.toISOString(),
      "dateModified": briefing.timestamp.toISOString(),
      "author": {
        "@type": "Person",
        "name": "Terry",
        "description": "Football transfer expert and analyst"
      },
      "publisher": {
        "@type": "Organization",
        "name": seoConfig.siteName,
        "url": seoConfig.siteUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${seoConfig.siteUrl}/images/logo.png`
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${seoConfig.siteUrl}/briefings/${briefing.slug}`
      },
      "articleSection": "Sports",
      "about": {
        "@type": "Thing",
        "name": "Football Transfers"
      },
      "keywords": briefing.content ? this.extractEntities(briefing.content).join(", ") : ""
    };
  }

  /**
   * Generate collection structured data
   */
  private static generateCollectionStructuredData(type: string) {
    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `Transfer Juice ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      "description": `Browse our ${type} of football transfer content`,
      "url": `${seoConfig.siteUrl}/${type}`,
      "isPartOf": {
        "@type": "WebSite",
        "name": seoConfig.siteName,
        "url": seoConfig.siteUrl
      }
    };
  }

  /**
   * Extract SEO-friendly description from content
   */
  private static extractDescription(content: any): string {
    if (!content) return "";
    
    // Handle JSON content or string content
    let textContent = "";
    if (typeof content === "string") {
      textContent = content;
    } else if (typeof content === "object") {
      // Extract text from JSON structure
      textContent = JSON.stringify(content).replace(/[{}"\[\]]/g, " ");
    }
    
    // Remove HTML tags and clean up content
    const cleanContent = textContent
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanContent) return "";

    // Extract first meaningful sentence or truncate
    const sentences = cleanContent.split(/[.!?]+/);
    let description = sentences[0];

    // If first sentence is too short, add the second
    if (description.length < 100 && sentences[1]) {
      description += ". " + sentences[1];
    }

    // Truncate to ideal length
    if (description.length > 160) {
      description = description.substring(0, 157) + "...";
    }

    return description;
  }

  /**
   * Extract entities (clubs, players, leagues) for keywords
   */
  private static extractEntities(content: any): string[] {
    if (!content) return [];
    
    // Handle JSON content or string content
    let textContent = "";
    if (typeof content === "string") {
      textContent = content;
    } else if (typeof content === "object") {
      // Extract text from JSON structure
      textContent = JSON.stringify(content).replace(/[{}"\[\]]/g, " ");
    }
    
    if (!textContent) return [];
    
    const entities = new Set<string>();
    
    // Common football clubs
    const clubs = [
      "Arsenal", "Chelsea", "Liverpool", "Man United", "Manchester United",
      "Man City", "Manchester City", "Tottenham", "Newcastle", "Brighton",
      "Real Madrid", "Barcelona", "Bayern Munich", "PSG", "Juventus",
      "AC Milan", "Inter Milan", "Atletico Madrid", "Dortmund", "Leipzig"
    ];

    // Common leagues
    const leagues = [
      "Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1",
      "Champions League", "Europa League", "World Cup", "Euro"
    ];

    // Extract mentioned clubs and leagues
    [...clubs, ...leagues].forEach(entity => {
      if (textContent.toLowerCase().includes(entity.toLowerCase())) {
        entities.add(entity.toLowerCase());
      }
    });

    // Extract player names (simple heuristic: capitalized words after common patterns)
    const playerPatterns = [
      /(?:signs?|signed|signing|transfer|move|joins?|joined|deal for|bid for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:signs?|signed|joins?|joined|moves?|transferred)/gi
    ];

    playerPatterns.forEach(pattern => {
      const matches = textContent.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const playerName = match.replace(/^.*?(signs?|signed|signing|transfer|move|joins?|joined|deal for|bid for)\s+/i, "")
                                .replace(/\s+(?:signs?|signed|joins?|joined|moves?|transferred).*$/i, "")
                                .trim()
                                .toLowerCase();
          if (playerName.length > 3 && playerName.split(" ").length <= 3) {
            entities.add(playerName);
          }
        });
      }
    });

    return Array.from(entities);
  }

  /**
   * Generate sitemap entry for a briefing
   */
  static generateSitemapEntry(briefing: Briefing) {
    return {
      url: `${seoConfig.siteUrl}/briefings/${briefing.slug}`,
      lastModified: briefing.timestamp.toISOString(),
      changeFrequency: "weekly" as const,
      priority: 0.8
    };
  }

  /**
   * Generate robots.txt content
   */
  static generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${seoConfig.siteUrl}/sitemap.xml

# Crawl delay for politeness
Crawl-delay: 1

# Block test pages
Disallow: /api/
Disallow: /test*
Disallow: /debug*
`;
  }

  /**
   * Generate meta tags for social sharing
   */
  static generateSocialTags(metadata: SEOMetadata): Record<string, string> {
    return {
      // Open Graph
      "og:title": metadata.openGraph.title,
      "og:description": metadata.openGraph.description,
      "og:type": metadata.openGraph.type,
      "og:url": metadata.openGraph.url,
      "og:image": metadata.openGraph.images[0]?.url || "",
      "og:image:width": metadata.openGraph.images[0]?.width.toString() || "",
      "og:image:height": metadata.openGraph.images[0]?.height.toString() || "",
      "og:image:alt": metadata.openGraph.images[0]?.alt || "",
      "og:site_name": metadata.openGraph.siteName,

      // Twitter
      "twitter:card": metadata.twitter.card,
      "twitter:title": metadata.twitter.title,
      "twitter:description": metadata.twitter.description,
      "twitter:image": metadata.twitter.images[0] || "",
      "twitter:creator": metadata.twitter.creator,
      "twitter:site": metadata.twitter.site,

      // Additional meta tags
      "description": metadata.description,
      "keywords": metadata.keywords.join(", "),
      "author": seoConfig.author,
      "robots": "index, follow",
      "canonical": metadata.canonical
    };
  }
}

export type { SEOMetadata, SEOConfig };