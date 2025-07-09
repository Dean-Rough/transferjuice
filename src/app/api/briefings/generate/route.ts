import { NextRequest, NextResponse } from "next/server";
import { processNewStories } from "@/lib/simplifiedStoryProcessor";

export async function POST(request: NextRequest) {
  try {
    // Optional: Check for cron secret
    const cronSecret = request.headers.get("X-Cron-Secret");
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🚀 Starting manual story generation via API...");

    const stories = await processNewStories();

    return NextResponse.json({
      success: true,
      results: {
        storiesProcessed: stories.length,
        stories: stories.map((s) => ({
          id: s.id,
          headline: s.headline,
          isUpdate: s.isUpdate,
          updateCount: s.updateCount,
        })),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to process stories:", error);
    return NextResponse.json(
      { error: "Failed to process stories" },
      { status: 500 },
    );
  }
}
