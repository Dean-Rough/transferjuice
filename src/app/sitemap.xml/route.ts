/**
 * Dynamic Sitemap Route
 * Automatically generates XML sitemap
 */

import { NextResponse } from "next/server";
import { SitemapGenerator } from "@/lib/seo/sitemapGenerator";

export async function GET() {
  try {
    const sitemap = await SitemapGenerator.generateSitemap();

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);

    return new NextResponse("Error generating sitemap", {
      status: 500,
    });
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour
