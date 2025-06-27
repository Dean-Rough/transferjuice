/**
 * Twitter Filtered Stream Control API
 */

import { NextRequest, NextResponse } from "next/server";
import {
  startTwitterStream,
  stopTwitterStream,
  getTwitterStreamStatus,
} from "@/lib/twitter/filtered-stream";

export async function GET() {
  try {
    const status = getTwitterStreamStatus();
    const rules = await status.rules;

    return NextResponse.json({
      success: true,
      data: {
        isConnected: status.isConnected,
        reconnectAttempts: status.reconnectAttempts,
        rules: rules,
        totalRules: rules.length,
      },
    });
  } catch (error) {
    console.error("Error getting stream status:", error);
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

    if (action === "start") {
      console.log("🚀 Starting Twitter Filtered Stream...");
      await startTwitterStream();

      return NextResponse.json({
        success: true,
        message: "Twitter stream started successfully",
      });
    } else if (action === "stop") {
      console.log("🛑 Stopping Twitter Filtered Stream...");
      await stopTwitterStream();

      return NextResponse.json({
        success: true,
        message: "Twitter stream stopped successfully",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Use "start" or "stop"',
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error controlling stream:", error);
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
