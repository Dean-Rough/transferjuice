import { NextRequest, NextResponse } from "next/server";
import { generateBriefing } from "@/lib/briefingGenerator";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`🚀 Cron job triggered at ${new Date().toISOString()}`);

    // Generate the briefing
    const briefing = await generateBriefing();

    return NextResponse.json({
      success: true,
      message: "Briefing generation completed",
      briefing: {
        id: briefing?.id,
        title: briefing?.title,
        storiesCount: briefing?.stories.length || 0,
        publishedAt: briefing?.publishedAt,
      },
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      {
        error: "Failed to generate briefing",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
