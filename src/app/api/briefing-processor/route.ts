/**
 * Briefing Processor Control API
 */

import { NextRequest, NextResponse } from "next/server";
import { streamToBriefingProcessor } from "@/lib/twitter/stream-to-briefing";

export async function GET() {
  try {
    const status = streamToBriefingProcessor.getBufferStatus();

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        recommendations: {
          canGenerateNow: status.tweetsInBuffer >= 3,
          shouldWaitForMore:
            status.tweetsInBuffer < 5 && !status.canTriggerEmergency,
          isReadyForScheduled: status.hoursSinceLastBriefing >= 3,
        },
      },
    });
  } catch (error) {
    console.error("Error getting briefing processor status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "force-briefing") {
      console.log("🎬 Forcing briefing generation...");

      await streamToBriefingProcessor.forceBriefingGeneration();

      return NextResponse.json({
        success: true,
        message: "Briefing generation triggered successfully",
      });
    } else if (action === "clear-buffer") {
      console.log("🧹 Clearing tweet buffer...");

      streamToBriefingProcessor.clearBuffer();

      return NextResponse.json({
        success: true,
        message: "Tweet buffer cleared successfully",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Use "force-briefing" or "clear-buffer"',
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error controlling briefing processor:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
