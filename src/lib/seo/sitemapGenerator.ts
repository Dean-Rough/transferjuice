/**
 * Automated Sitemap Generator for Transfer Juice
 * Generates XML sitemaps automatically based on content
 */

import { prisma } from "@/lib/prisma";
import { SEOGenerator } from "./seoGenerator";

interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

export class SitemapGenerator {
  private static readonly baseUrl = "https://transferjuice.com";

  /**
   * Generate complete sitemap
   */
  static async generateSitemap(): Promise<string> {
    const entries = await this.getAllSitemapEntries();
    
    return this.generateXML(entries);
  }

  /**
   * Get all sitemap entries
   */
  private static async getAllSitemapEntries(): Promise<SitemapEntry[]> {
    const entries: SitemapEntry[] = [];

    // Static pages
    entries.push(...this.getStaticPageEntries());

    // Briefing pages
    const briefingEntries = await this.getBriefingEntries();
    entries.push(...briefingEntries);

    // Archive pages
    entries.push(...this.getArchiveEntries());

    return entries.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get static page entries
   */
  private static getStaticPageEntries(): SitemapEntry[] {
    return [
      {
        url: this.baseUrl,
        lastModified: new Date().toISOString(),
        changeFrequency: "hourly",
        priority: 1.0
      },
      {
        url: `${this.baseUrl}/briefings`,
        lastModified: new Date().toISOString(),
        changeFrequency: "hourly",
        priority: 0.9
      },
      {
        url: `${this.baseUrl}/archive`,
        lastModified: new Date().toISOString(),
        changeFrequency: "daily",
        priority: 0.7
      }
    ];
  }

  /**
   * Get briefing page entries
   */
  private static async getBriefingEntries(): Promise<SitemapEntry[]> {
    try {
      const briefings = await prisma.briefing.findMany({
        select: {
          slug: true,
          timestamp: true,
          isPublished: true
        },
        where: {
          isPublished: true
        },
        orderBy: {
          timestamp: "desc"
        }
      });

      return briefings.map(briefing => ({
        url: `${this.baseUrl}/briefings/${briefing.slug}`,
        lastModified: briefing.timestamp.toISOString(),
        changeFrequency: "weekly" as const,
        priority: 0.8
      }));
    } catch (error) {
      console.error("Error fetching briefings for sitemap:", error);
      return [];
    }
  }

  /**
   * Get archive page entries
   */
  private static getArchiveEntries(): SitemapEntry[] {
    // For now, just include main archive page
    // Could be expanded to include paginated archive pages
    return [
      {
        url: `${this.baseUrl}/archive`,
        lastModified: new Date().toISOString(),
        changeFrequency: "daily",
        priority: 0.6
      }
    ];
  }

  /**
   * Generate XML sitemap
   */
  private static generateXML(entries: SitemapEntry[]): string {
    const urls = entries.map(entry => `
  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  }

  /**
   * Generate sitemap index for large sites
   */
  static async generateSitemapIndex(): Promise<string> {
    const now = new Date().toISOString();
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${this.baseUrl}/sitemap-main.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${this.baseUrl}/sitemap-briefings.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
  }

  /**
   * Generate briefings-specific sitemap
   */
  static async generateBriefingsSitemap(): Promise<string> {
    const briefingEntries = await this.getBriefingEntries();
    return this.generateXML(briefingEntries);
  }

  /**
   * Generate robots.txt
   */
  static generateRobotsTxt(): string {
    return SEOGenerator.generateRobotsTxt();
  }
}

export type { SitemapEntry };