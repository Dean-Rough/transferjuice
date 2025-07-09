import { NextRequest, NextResponse } from "next/server";
import {
  processNewStories,
  updateOldStories,
  generateDailySummary,
} from "@/lib/simplifiedStoryProcessor";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      `🚀 Story processing cron triggered at ${new Date().toISOString()}`,
    );

    // Get current hour to determine what to run
    const currentHour = new Date().getHours();

    // Process new stories every 2 hours
    const newStories = await processNewStories();

    // Update existing stories
    const updatedCount = await updateOldStories();

    // Generate daily summary at 9pm (21:00)
    let dailySummaryGenerated = false;
    if (currentHour === 21) {
      await generateDailySummary();
      dailySummaryGenerated = true;
    }

    return NextResponse.json({
      success: true,
      message: "Story processing completed",
      results: {
        newStories: newStories.length,
        updatedStories: updatedCount,
        dailySummary: dailySummaryGenerated,
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Story processing cron failed:", error);
    return NextResponse.json(
      {
        error: "Failed to process stories",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
