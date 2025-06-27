/**
 * Live Feed SSE (Server-Sent Events) Endpoint
 *
 * Provides real-time updates to connected clients
 * for the live transfer feed experience
 */

import { NextRequest } from "next/server";
import { addClient, removeClient } from "@/lib/realtime/broadcaster";

export async function GET(request: NextRequest) {
  console.log("🔌 New SSE connection request");

  // Extract client filters from query params
  const { searchParams } = new URL(request.url);
  const tags = searchParams.get("tags")?.split(",") || [];
  const priority = searchParams.get("priority")?.split(",") || [];

  const filters = {
    ...(tags.length > 0 && { tags }),
    ...(priority.length > 0 && { priority }),
  };

  console.log("🔍 Client filters:", filters);

  // Generate unique client ID
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      console.log(`📡 Starting SSE stream for client ${clientId}`);

      // Add client to broadcaster
      addClient(clientId, new Response(), controller, filters);

      // Send initial connection message
      const welcomeMessage = {
        id: `welcome_${Date.now()}`,
        type: "connection",
        data: {
          message: "Connected to Transfer Juice live feed",
          clientId,
          filters,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      const formattedWelcome = [
        `id: ${welcomeMessage.id}`,
        `event: connection`,
        `data: ${JSON.stringify(welcomeMessage)}`,
        "",
        "",
      ].join("\n");

      controller.enqueue(new TextEncoder().encode(formattedWelcome));
    },

    cancel() {
      console.log(`🔌 SSE stream cancelled for client ${clientId}`);
      removeClient(clientId);
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}
