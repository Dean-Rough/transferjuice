/**
 * Hourly Cron Job Endpoint
 *
 * Triggers the hourly monitoring system:
 * 1. Check all ITK accounts for new tweets
 * 2. Generate Terry-style updates
 * 3. Search for relevant images
 * 4. Mix in engaging stories if needed
 * 5. Broadcast live updates
 */

import { NextRequest, NextResponse } from "next/server";
import { globalMonitor } from "@/lib/twitter/globalMonitor";
import { generateBriefing } from "@/briefing-generator/orchestrator";

export async function POST(request: NextRequest): Promise<Response> {
  console.log("⏰ Hourly cron job triggered");

  try {
    // Verify cron secret if in production
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (process.env.NODE_ENV === "production" && cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        console.warn("🚫 Unauthorized cron request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Run the global monitoring cycle
    const startTime = Date.now();
    console.log("🌍 Running global ITK monitoring...");

    const monitoringStats = await globalMonitor.runMonitoringCycle();

    console.log(
      `✅ Monitoring completed: ${monitoringStats.totalTransferTweets} transfer tweets found`,
    );

    // If we have enough content, generate a briefing
    let briefingGenerated = false;
    let briefingSlug = null;
    if (monitoringStats.totalTransferTweets >= 3) {
      console.log("📝 Generating hourly briefing...");
      try {
        const result = await generateBriefing({
          timestamp: new Date(),
          testMode: false,
          forceRegenerate: true,
        });
        briefingGenerated = true;
        briefingSlug = result.success ? "generated" : null;
        console.log(`✅ Briefing generation attempted: ${result.success}`);
      } catch (error) {
        console.error("❌ Briefing generation failed:", error);
      }
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: "Hourly monitoring completed",
      data: {
        monitoring: {
          duration: `${duration}ms`,
          sources: monitoringStats.totalSources,
          activeSources: monitoringStats.activeSources,
          rateLimitedSources: monitoringStats.rateLimitedSources,
          tweetsChecked: monitoringStats.totalTweetsChecked,
          transferTweets: monitoringStats.totalTransferTweets,
          averageConfidence: monitoringStats.averageConfidence,
          regionStats: monitoringStats.regionStats,
          languageStats: monitoringStats.languageStats,
        },
        briefing: {
          generated: briefingGenerated,
          slug: briefingSlug,
          reason: !briefingGenerated
            ? `Not enough content (${monitoringStats.totalTransferTweets} tweets, need 3+)`
            : "Success",
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Hourly cron job failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Hourly monitoring failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  // Health check endpoint
  return NextResponse.json({
    message: "Hourly cron endpoint is healthy",
    timestamp: new Date().toISOString(),
    status: "ready",
    monitorStatus: globalMonitor.getStatus(),
  });
}
