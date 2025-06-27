import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generateSlug } from "@/lib/utils/slug";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const testContent = await request.json();

    // Generate timestamp and slug
    const timestamp = new Date();
    const title = "Test Briefing - Rich Media Validation";
    const randomSuffix = Math.random().toString(36).substring(7);
    const slug = `${generateSlug(title, timestamp)}-${randomSuffix}`;

    // Process media placeholders in content (simplified for testing)
    const processedSections = testContent.sections.map((section: any) => {
      // Simple processing - just keep the content as is for now
      const processedContent = section.content;
      return {
        ...section,
        processedContent,
      };
    });

    // Process hero image
    const processedHeroImage = testContent.heroImage
      ? {
          ...testContent.heroImage,
          processed: true,
          width: 1200,
          height: 800,
        }
      : null;

    // Create briefing in database
    const briefing = await prisma.briefing.create({
      data: {
        title: JSON.stringify({
          main: title,
          timeSlot:
            timestamp.getHours() >= 21
              ? "evening"
              : timestamp.getHours() >= 14
                ? "afternoon"
                : "morning",
        }),
        slug,
        timestamp,
        content: JSON.stringify({
          ...testContent,
          heroImage: processedHeroImage,
          sections: processedSections,
        }),
        readTime: 5,
        wordCount: 500,
        terryScore: 8.5,
        visualTimeline: JSON.stringify([]),
        sidebarSections: JSON.stringify([]),
        publishedAt: timestamp,
        isPublished: true,
      },
    });

    return NextResponse.json(briefing);
  } catch (error) {
    console.error("Error creating test briefing:", error);
    return NextResponse.json(
      { error: "Failed to create test briefing" },
      { status: 500 },
    );
  }
}
