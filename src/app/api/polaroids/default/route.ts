/**
 * Default Polaroid Generator API
 * Creates placeholder polaroid images for players without photos
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const initials = searchParams.get("initials") || "??";
  const club = searchParams.get("club") || "Unknown";

  // Generate SVG polaroid
  const svg = `
    <svg width="200" height="250" xmlns="http://www.w3.org/2000/svg">
      <!-- Polaroid frame -->
      <rect x="0" y="0" width="200" height="250" fill="#f8f8f8" stroke="#ddd" stroke-width="1"/>
      
      <!-- Photo area -->
      <rect x="10" y="10" width="180" height="180" fill="#1a1a1a"/>
      
      <!-- Initials -->
      <text x="100" y="110" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
            text-anchor="middle" fill="#666">${initials}</text>
      
      <!-- Caption area -->
      <text x="100" y="215" font-family="Arial, sans-serif" font-size="14" font-weight="bold" 
            text-anchor="middle" fill="#333">${club}</text>
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
    },
  });
}
