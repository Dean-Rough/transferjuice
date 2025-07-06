import { NextRequest, NextResponse } from "next/server";
import { generateEnhancedBriefing } from "@/lib/enhancedBriefingGenerator";

export async function POST(request: NextRequest) {
  try {
    // Optional: Check for cron secret
    const cronSecret = request.headers.get("X-Cron-Secret");
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🚀 Starting enhanced briefing generation via API...");

    const briefing = await generateEnhancedBriefing();

    return NextResponse.json({
      success: true,
      briefing: {
        id: briefing?.id,
        title: briefing?.title,
        storiesCount: briefing?.stories.length || 0,
        publishedAt: briefing?.publishedAt,
      },
    });
  } catch (error) {
    console.error("Failed to generate enhanced briefing:", error);
    return NextResponse.json(
      { error: "Failed to generate enhanced briefing", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}