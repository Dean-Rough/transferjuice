/**
 * API Authentication System
 * Handles authentication for protected API endpoints
 */

import { NextRequest } from "next/server";
import { createHash } from "crypto";

export interface ApiAuthResult {
  authenticated: boolean;
  userId?: string;
  error?: string;
}

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  permissions: string[];
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
}

/**
 * Verify API authentication from request
 */
export async function verifyApiAuth(
  request: NextRequest,
  requiredPermission?: string,
): Promise<ApiAuthResult> {
  try {
    // Check for API key in header
    const apiKey = request.headers.get("X-API-Key");
    if (apiKey) {
      return verifyApiKey(apiKey, requiredPermission);
    }

    // Check for Bearer token
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      return verifyBearerToken(token, requiredPermission);
    }

    // Check for session (for admin UI)
    const sessionId = request.cookies.get("session")?.value;
    if (sessionId) {
      return verifySession(sessionId, requiredPermission);
    }

    return {
      authenticated: false,
      error: "No authentication credentials provided",
    };
  } catch (error) {
    console.error("API authentication error:", error);
    return {
      authenticated: false,
      error: "Authentication failed",
    };
  }
}

/**
 * Verify API key authentication
 */
async function verifyApiKey(
  key: string,
  requiredPermission?: string,
): Promise<ApiAuthResult> {
  try {
    // Hash the key for comparison (keys are stored hashed)
    const hashedKey = hashApiKey(key);

    // TODO: Replace with database lookup
    // const apiKeyRecord = await prisma.apiKey.findUnique({
    //   where: { hashedKey },
    // });

    // Mock implementation for now
    const validKeys: Record<string, ApiKey> = {
      [process.env.BRIEFING_GENERATION_API_KEY || "test-key"]: {
        id: "key-1",
        key: process.env.BRIEFING_GENERATION_API_KEY || "test-key",
        name: "Briefing Generation Key",
        permissions: ["briefing.generate", "briefing.read"],
        createdAt: new Date(),
      },
    };

    const apiKeyRecord = validKeys[key];

    if (!apiKeyRecord) {
      return {
        authenticated: false,
        error: "Invalid API key",
      };
    }

    // Check if key is expired
    if (apiKeyRecord.expiresAt && new Date() > apiKeyRecord.expiresAt) {
      return {
        authenticated: false,
        error: "API key expired",
      };
    }

    // Check permissions
    if (
      requiredPermission &&
      !apiKeyRecord.permissions.includes(requiredPermission)
    ) {
      return {
        authenticated: false,
        error: "Insufficient permissions",
      };
    }

    // Update last used timestamp
    // TODO: Update in database
    // await prisma.apiKey.update({
    //   where: { id: apiKeyRecord.id },
    //   data: { lastUsedAt: new Date() },
    // });

    return {
      authenticated: true,
      userId: `api-key-${apiKeyRecord.id}`,
    };
  } catch (error) {
    console.error("API key verification error:", error);
    return {
      authenticated: false,
      error: "API key verification failed",
    };
  }
}

/**
 * Verify Bearer token authentication
 */
async function verifyBearerToken(
  token: string,
  requiredPermission?: string,
): Promise<ApiAuthResult> {
  try {
    // TODO: Implement JWT verification or external auth service
    // For now, check against environment variable
    const validToken = process.env.BRIEFING_GENERATION_TOKEN;

    if (!validToken || token !== validToken) {
      return {
        authenticated: false,
        error: "Invalid bearer token",
      };
    }

    return {
      authenticated: true,
      userId: "bearer-token-user",
    };
  } catch (error) {
    console.error("Bearer token verification error:", error);
    return {
      authenticated: false,
      error: "Bearer token verification failed",
    };
  }
}

/**
 * Verify session authentication (for admin UI)
 */
async function verifySession(
  sessionId: string,
  requiredPermission?: string,
): Promise<ApiAuthResult> {
  try {
    // TODO: Implement session verification
    // const session = await prisma.session.findUnique({
    //   where: { id: sessionId },
    //   include: { user: true },
    // });

    // Mock implementation
    return {
      authenticated: false,
      error: "Session authentication not implemented",
    };
  } catch (error) {
    console.error("Session verification error:", error);
    return {
      authenticated: false,
      error: "Session verification failed",
    };
  }
}

/**
 * Hash API key for secure storage
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Generate a new API key
 */
export function generateApiKey(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const segments = 4;
  const segmentLength = 8;

  const segments_array = [];
  for (let i = 0; i < segments; i++) {
    let segment = "";
    for (let j = 0; j < segmentLength; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments_array.push(segment);
  }

  return segments_array.join("-");
}

/**
 * Rate limiting for API endpoints
 */
export class ApiRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs = 60000, maxRequests = 60) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check if request should be rate limited
   */
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];

    // Remove expired timestamps
    const validRequests = requests.filter(
      (timestamp) => now - timestamp < this.windowMs,
    );

    if (validRequests.length >= this.maxRequests) {
      return true;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return false;
  }

  /**
   * Get rate limit headers
   */
  getRateLimitHeaders(identifier: string): Record<string, string> {
    const requests = this.requests.get(identifier) || [];
    const now = Date.now();
    const validRequests = requests.filter(
      (timestamp) => now - timestamp < this.windowMs,
    );

    const remaining = Math.max(0, this.maxRequests - validRequests.length);
    const resetTime =
      validRequests.length > 0
        ? validRequests[0] + this.windowMs
        : now + this.windowMs;

    return {
      "X-RateLimit-Limit": this.maxRequests.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": new Date(resetTime).toISOString(),
    };
  }
}

// Export singleton rate limiter
export const apiRateLimiter = new ApiRateLimiter(
  parseInt(process.env.API_RATE_LIMIT_WINDOW || "60000"),
  parseInt(process.env.API_RATE_LIMIT_MAX || "60"),
);
