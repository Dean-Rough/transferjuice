import { NextRequest, NextResponse } from "next/server";

/**
 * Cron endpoint for briefing generation
 * Triggered 3x daily (9am, 2pm, 9pm)
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

    console.log("[CRON] Starting briefing generation...");

    // Import and run briefing generation
    const { spawn } = await import("child_process");

    return new Promise((resolve) => {
      const child = spawn("npm", ["run", "briefing:generate"], {
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
          console.log("[CRON] Briefing generation completed successfully");

          // Extract briefing URL from output
          const urlMatch = output.match(/URL: (http:\/\/[^\s]+)/);
          const briefingUrl = urlMatch ? urlMatch[1] : null;

          resolve(
            NextResponse.json({
              success: true,
              briefingUrl,
              output: output.slice(-1000), // Last 1000 chars
            }),
          );
        } else {
          console.error("[CRON] Briefing generation failed with code:", code);
          resolve(
            NextResponse.json(
              {
                success: false,
                error: `Process exited with code ${code}`,
                output: output.slice(-1000),
              },
              { status: 500 },
            ),
          );
        }
      });

      // Timeout after 10 minutes (briefing generation can be slow)
      setTimeout(
        () => {
          child.kill();
          resolve(
            NextResponse.json(
              {
                success: false,
                error: "Timeout after 10 minutes",
              },
              { status: 500 },
            ),
          );
        },
        10 * 60 * 1000,
      );
    });
  } catch (error) {
    console.error("[CRON] Briefing generation error:", error);
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
