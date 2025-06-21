/**
 * Real-time Broadcasting System
 * 
 * Handles live updates to connected clients via Server-Sent Events (SSE)
 * for the live transfer feed experience
 */

interface BroadcastClient {
  id: string;
  response: Response;
  controller: ReadableStreamDefaultController;
  filters?: {
    tags?: string[];
    priority?: string[];
  };
  connectedAt: Date;
}

interface BroadcastMessage {
  type: 'feed-update' | 'breaking-news' | 'heartbeat' | 'connection-count';
  data: any;
  timestamp: Date;
  id: string;
}

class RealTimeBroadcaster {
  private clients: Map<string, BroadcastClient> = new Map();
  private messageHistory: BroadcastMessage[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  /**
   * Add a new client connection
   */
  addClient(clientId: string, response: Response, controller: ReadableStreamDefaultController, filters?: any): void {
    const client: BroadcastClient = {
      id: clientId,
      response,
      controller,
      filters,
      connectedAt: new Date()
    };

    this.clients.set(clientId, client);
    
    console.log(`📡 Client ${clientId} connected. Total clients: ${this.clients.size}`);
    
    // Send recent message history to new client
    this.sendHistoryToClient(client);
    
    // Broadcast updated connection count
    this.broadcastConnectionCount();
  }

  /**
   * Remove a client connection
   */
  removeClient(clientId: string): void {
    if (this.clients.has(clientId)) {
      try {
        const client = this.clients.get(clientId)!;
        client.controller.close();
      } catch (error) {
        console.warn(`Error closing client ${clientId}:`, error);
      }
      
      this.clients.delete(clientId);
      console.log(`📡 Client ${clientId} disconnected. Total clients: ${this.clients.size}`);
      
      // Broadcast updated connection count
      this.broadcastConnectionCount();
    }
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(type: BroadcastMessage['type'], data: any): void {
    const message: BroadcastMessage = {
      type,
      data,
      timestamp: new Date(),
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Add to history (keep last 50 messages)
    this.messageHistory.push(message);
    if (this.messageHistory.length > 50) {
      this.messageHistory = this.messageHistory.slice(-50);
    }

    // Send to all clients
    this.sendToAllClients(message);
  }

  /**
   * Broadcast a feed update
   */
  broadcastFeedUpdate(update: any): void {
    console.log(`📡 Broadcasting feed update: ${update.id}`);
    this.broadcast('feed-update', update);
  }

  /**
   * Broadcast breaking news
   */
  broadcastBreakingNews(news: any): void {
    console.log(`🚨 Broadcasting breaking news: ${news.id}`);
    this.broadcast('breaking-news', news);
  }

  /**
   * Send message to all clients with optional filtering
   */
  private sendToAllClients(message: BroadcastMessage): void {
    const clientsToRemove: string[] = [];

    for (const [clientId, client] of this.clients) {
      try {
        // Check if client should receive this message based on filters
        if (!this.shouldSendToClient(client, message)) {
          continue;
        }

        const formattedMessage = this.formatSSEMessage(message);
        client.controller.enqueue(formattedMessage);
        
      } catch (error) {
        console.warn(`Failed to send message to client ${clientId}:`, error);
        clientsToRemove.push(clientId);
      }
    }

    // Remove failed clients
    clientsToRemove.forEach(clientId => this.removeClient(clientId));
  }

  /**
   * Check if a message should be sent to a specific client based on filters
   */
  private shouldSendToClient(client: BroadcastClient, message: BroadcastMessage): boolean {
    // Always send heartbeat and connection count messages
    if (message.type === 'heartbeat' || message.type === 'connection-count') {
      return true;
    }

    // Always send breaking news
    if (message.type === 'breaking-news') {
      return true;
    }

    // Check tag filters for feed updates
    if (message.type === 'feed-update' && client.filters?.tags) {
      const updateTags = message.data.tags?.map((tag: any) => tag.name.toLowerCase()) || [];
      const clientTags = client.filters.tags.map(tag => tag.toLowerCase());
      
      // Send if any tag matches
      const hasMatchingTag = clientTags.some(clientTag => 
        updateTags.some((updateTag: string) => updateTag.includes(clientTag))
      );
      
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Check priority filters
    if (client.filters?.priority && message.data.priority) {
      if (!client.filters.priority.includes(message.data.priority.toLowerCase())) {
        return false;
      }
    }

    return true;
  }

  /**
   * Format message for Server-Sent Events
   */
  private formatSSEMessage(message: BroadcastMessage): Uint8Array {
    const sseData = {
      id: message.id,
      type: message.type,
      data: message.data,
      timestamp: message.timestamp.toISOString()
    };

    const formattedMessage = [
      `id: ${message.id}`,
      `event: ${message.type}`,
      `data: ${JSON.stringify(sseData)}`,
      '',
      ''
    ].join('\n');

    return new TextEncoder().encode(formattedMessage);
  }

  /**
   * Send recent message history to a new client
   */
  private sendHistoryToClient(client: BroadcastClient): void {
    // Send last 10 messages to catch up new clients
    const recentMessages = this.messageHistory.slice(-10);
    
    for (const message of recentMessages) {
      if (this.shouldSendToClient(client, message)) {
        try {
          const formattedMessage = this.formatSSEMessage(message);
          client.controller.enqueue(formattedMessage);
        } catch (error) {
          console.warn(`Failed to send history to client ${client.id}:`, error);
        }
      }
    }
  }

  /**
   * Start heartbeat to keep connections alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.broadcast('heartbeat', { 
        timestamp: new Date().toISOString(),
        clientCount: this.clients.size
      });
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Broadcast current connection count
   */
  private broadcastConnectionCount(): void {
    this.broadcast('connection-count', {
      count: this.clients.size,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalClients: number;
    messagesSent: number;
    uptime: number;
    clientDetails: Array<{
      id: string;
      connectedAt: Date;
      filters?: any;
    }>;
  } {
    return {
      totalClients: this.clients.size,
      messagesSent: this.messageHistory.length,
      uptime: Date.now(), // This should track actual uptime
      clientDetails: Array.from(this.clients.values()).map(client => ({
        id: client.id,
        connectedAt: client.connectedAt,
        filters: client.filters
      }))
    };
  }

  /**
   * Cleanup all connections
   */
  cleanup(): void {
    console.log('🧹 Cleaning up broadcaster...');
    
    // Close all client connections
    for (const [clientId, client] of this.clients) {
      try {
        client.controller.close();
      } catch (error) {
        console.warn(`Error closing client ${clientId} during cleanup:`, error);
      }
    }
    
    this.clients.clear();
    this.stopHeartbeat();
  }
}

// Global broadcaster instance
const broadcaster = new RealTimeBroadcaster();

// Export functions for use in API routes
export function addClient(clientId: string, response: Response, controller: ReadableStreamDefaultController, filters?: any): void {
  broadcaster.addClient(clientId, response, controller, filters);
}

export function removeClient(clientId: string): void {
  broadcaster.removeClient(clientId);
}

export function broadcastUpdate(type: 'feed-update' | 'breaking-news', data: any): void {
  if (type === 'feed-update') {
    broadcaster.broadcastFeedUpdate(data);
  } else if (type === 'breaking-news') {
    broadcaster.broadcastBreakingNews(data);
  }
}

export function getBroadcasterStats() {
  return broadcaster.getStats();
}

export function cleanupBroadcaster(): void {
  broadcaster.cleanup();
}

// Cleanup on process exit
process.on('SIGINT', cleanupBroadcaster);
process.on('SIGTERM', cleanupBroadcaster);