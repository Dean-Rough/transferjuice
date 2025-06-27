import { useEffect, useRef, useState } from "react";

interface WebSocketMessage {
  data: string;
  timestamp: Date;
}

interface UseWebSocketReturn {
  lastMessage: WebSocketMessage | null;
  connectionStatus: "connecting" | "connected" | "disconnected";
  sendMessage: (message: string) => void;
}

export function useWebSocket(url: string): UseWebSocketReturn {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus("connecting");

    try {
      // For demo purposes, we'll simulate a WebSocket connection
      // In production, this would be a real WebSocket URL
      console.log(`Attempting to connect to WebSocket: ${url}`);

      // Simulate connection success after delay
      setTimeout(() => {
        setConnectionStatus("connected");
        reconnectAttempts.current = 0;

        // Simulate incoming messages for demo
        const interval = setInterval(() => {
          if (Math.random() > 0.8) {
            // 20% chance of new message
            const mockMessage = {
              data: JSON.stringify({
                id: `live-${Date.now()}`,
                content: `🚨 LIVE UPDATE: ${["Transfer agreed!", "Medical confirmed!", "Deal announced!"][Math.floor(Math.random() * 3)]}`,
                author: ["FabrizioRomano", "David_Ornstein", "DiMarzio"][
                  Math.floor(Math.random() * 3)
                ],
                timestamp: new Date(),
                tags: ["#Arsenal", "@Haaland", "FabrizioRomano"],
                type: "itk",
              }),
              timestamp: new Date(),
            };
            setLastMessage(mockMessage);
          }
        }, 5000); // New message every 5 seconds (when chance hits)

        // Store interval reference to clean up later
        wsRef.current = { close: () => clearInterval(interval) } as any;
      }, 1000);
    } catch (error) {
      console.error("WebSocket connection error:", error);
      setConnectionStatus("disconnected");
      scheduleReconnect();
    }
  };

  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const maxAttempts = 5;
    const baseDelay = 1000;

    if (reconnectAttempts.current < maxAttempts) {
      const delay = baseDelay * Math.pow(2, reconnectAttempts.current); // Exponential backoff

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttempts.current++;
        console.log(
          `Reconnect attempt ${reconnectAttempts.current}/${maxAttempts}`,
        );
        connect();
      }, delay);
    } else {
      console.log("Max reconnection attempts reached");
      setConnectionStatus("disconnected");
    }
  };

  const sendMessage = (message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    } else {
      console.warn("WebSocket is not connected");
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionStatus("disconnected");
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [url]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, can reduce connection frequency
        console.log("Page hidden, maintaining connection");
      } else {
        // Page is visible, ensure connection
        if (connectionStatus === "disconnected") {
          connect();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [connectionStatus]);

  return {
    lastMessage,
    connectionStatus,
    sendMessage,
  };
}
