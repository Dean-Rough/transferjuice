import { NextRequest, NextResponse } from "next/server";

/**
 * Cron endpoint for cleanup
 * Triggered daily at 3am to clean old briefings
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Verify authorization
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new Response("Unauthorized", { status: 401 });
    }

    console.log("[CRON] Starting cleanup...");

    // Import and run cleanup
    const { spawn } = await import("child_process");

    return new Promise((resolve) => {
      const child = spawn(
        "npx",
        ["tsx", "scripts/clear-briefings.ts", "--keep-days=7"],
        {
          cwd: process.cwd(),
          stdio: "pipe",
        },
      );

      let output = "";
      child.stdout?.on("data", (data) => {
        output += data.toString();
      });

      child.stderr?.on("data", (data) => {
        output += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0) {
          console.log("[CRON] Cleanup completed successfully");
          resolve(
            NextResponse.json({
              success: true,
              output: output.slice(-500), // Last 500 chars
            }),
          );
        } else {
          console.error("[CRON] Cleanup failed with code:", code);
          resolve(
            NextResponse.json(
              {
                success: false,
                error: `Process exited with code ${code}`,
                output: output.slice(-500),
              },
              { status: 500 },
            ),
          );
        }
      });

      // Timeout after 2 minutes
      setTimeout(
        () => {
          child.kill();
          resolve(
            NextResponse.json(
              {
                success: false,
                error: "Timeout after 2 minutes",
              },
              { status: 500 },
            ),
          );
        },
        2 * 60 * 1000,
      );
    });
  } catch (error) {
    console.error("[CRON] Cleanup error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  // Also support POST for webhook-style crons
  return GET(request);
}
