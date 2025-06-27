import { NextRequest, NextResponse } from "next/server";

/**
 * Cron endpoint for ITK monitoring
 * Triggered hourly to monitor ITK sources
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

    console.log("[CRON] Starting ITK monitoring...");

    // Import and run monitoring (dynamic import to avoid build issues)
    const { spawn } = await import("child_process");

    return new Promise((resolve) => {
      const child = spawn("npx", ["tsx", "scripts/hourly-itk-monitor.ts"], {
        cwd: process.cwd(),
        stdio: "pipe",
      });

      let output = "";
      child.stdout?.on("data", (data) => {
        output += data.toString();
      });

      child.stderr?.on("data", (data) => {
        output += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0) {
          console.log("[CRON] ITK monitoring completed successfully");
          resolve(
            NextResponse.json({
              success: true,
              output: output.slice(-500), // Last 500 chars
            }),
          );
        } else {
          console.error("[CRON] ITK monitoring failed with code:", code);
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

      // Timeout after 5 minutes
      setTimeout(
        () => {
          child.kill();
          resolve(
            NextResponse.json(
              {
                success: false,
                error: "Timeout after 5 minutes",
              },
              { status: 500 },
            ),
          );
        },
        5 * 60 * 1000,
      );
    });
  } catch (error) {
    console.error("[CRON] ITK monitoring error:", error);
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
