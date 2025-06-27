/**
 * Dynamic Robots.txt Route
 * Automatically generates robots.txt
 */

import { NextResponse } from "next/server";
import { SitemapGenerator } from "@/lib/seo/sitemapGenerator";

export async function GET() {
  try {
    const robots = SitemapGenerator.generateRobotsTxt();

    return new NextResponse(robots, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=86400, s-maxage=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Error generating robots.txt:", error);

    return new NextResponse("Error generating robots.txt", {
      status: 500,
    });
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 86400; // Revalidate daily
