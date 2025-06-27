import { NextResponse } from "next/server";
import { itkMonitor } from "@/lib/twitter/itk-monitor";
import { broadcastUpdate } from "@/lib/realtime/broadcaster";

export async function POST() {
  try {
    // Fetch latest updates
    const updates = await itkMonitor.monitorAllAccounts();

    // Broadcast to connected clients
    if (updates.length > 0) {
      broadcastUpdate("feed-update", updates);
    }

    return NextResponse.json({
      success: true,
      updates: updates.length,
    });
  } catch (error) {
    console.error("Real-time monitoring failed:", error);
    return NextResponse.json({ error: "Monitoring failed" }, { status: 500 });
  }
}
