# API Specification

**Version:** 1.0.0-reality  
**Last Updated:** June 2025  
**Base URL:** `http://localhost:4433/api` (development)  
**Production URL:** `https://transferjuice.com/api`

---

## Overview

This document describes the **actual API endpoints** that exist in TransferJuice. Previous documentation described a fictional REST API - this reflects reality.

**Note:** All endpoints are implemented as Next.js 13+ App Router API routes in `src/app/api/`.

---

## Authentication

Most endpoints are public. Protected endpoints use a simple Bearer token check:

```typescript
// Protected endpoints check for:
Authorization: Bearer YOUR_SECRET_API_KEY

// Affected endpoints:
- POST /api/briefings/generate
- POST /api/cron/hourly
- POST /api/monitoring/start
```

---

## Endpoints

### 1. Live Feed & Real-time

#### GET /api/live-feed

Server-Sent Events (SSE) endpoint for real-time feed updates.

**Query Parameters:**
- `tags` - Comma-separated tag IDs to filter
- `priority` - Filter by priority level

**Response:** SSE stream
```
event: update
data: {"type":"new_item","item":{...}}

event: heartbeat
data: {"type":"heartbeat","timestamp":"2025-06-24T10:00:00Z"}
```

#### POST /api/twitter-stream

Control Twitter streaming for real-time monitoring.

**Body:**
```json
{
  "action": "start" | "stop",
  "filters": ["premierleague", "transfers"]
}
```

**Response:**
```json
{
  "status": "streaming_started",
  "sessionId": "abc123"
}
```

---

### 2. Briefings System

#### POST /api/briefings/generate

Generate a new briefing (requires authentication).

**Headers:**
```
Authorization: Bearer YOUR_SECRET_API_KEY
```

**Body:**
```json
{
  "timeSlot": "morning" | "afternoon" | "evening",
  "test": false
}
```

**Response:**
```json
{
  "success": true,
  "briefing": {
    "id": "2025-06-24-morning",
    "title": "Morning Madness: Terry's Transfer Theatre",
    "content": "...",
    "publishedAt": "2025-06-24T09:00:00Z"
  }
}
```

#### GET /api/briefings/archive

Get all published briefings.

**Query Parameters:**
- `limit` - Number of briefings (default: 20)
- `offset` - Pagination offset
- `league` - Filter by league

**Response:**
```json
{
  "briefings": [
    {
      "id": "2025-06-24-morning",
      "title": "Morning Madness",
      "publishedAt": "2025-06-24T09:00:00Z",
      "timeSlot": "morning",
      "summary": "Chelsea linked with everyone again..."
    }
  ],
  "total": 47,
  "hasMore": true
}
```

#### GET /api/briefings/[timestamp]

Get a specific briefing by timestamp.

**Parameters:**
- `timestamp` - Briefing ID (e.g., "2025-06-24-morning")

**Response:**
```json
{
  "id": "2025-06-24-morning",
  "title": "Morning Madness: Terry's Transfer Theatre",
  "content": "Full Terry commentary here...",
  "publishedAt": "2025-06-24T09:00:00Z",
  "sources": ["FabrizioRomano", "David_Ornstein"],
  "tags": [
    {"id": "arsenal", "name": "Arsenal", "type": "club"},
    {"id": "rice", "name": "Declan Rice", "type": "player"}
  ]
}
```

---

### 3. Content & Feed

#### GET /api/feed

Main feed endpoint with extensive filtering.

**Query Parameters:**
- `type` - Content type filter
- `priority` - Priority level (high/medium/low)
- `league` - League filter (PL/LALIGA/SERIEA/etc)
- `source` - Source ID filter
- `tags` - Comma-separated tag IDs
- `limit` - Items per page (default: 20)
- `cursor` - Pagination cursor

**Response:**
```json
{
  "items": [
    {
      "id": "feed_123",
      "content": "Original tweet content",
      "terryCommentary": "Terry's witty take",
      "source": {
        "id": "FabrizioRomano",
        "name": "Fabrizio Romano",
        "tier": "1"
      },
      "timestamp": "2025-06-24T10:30:00Z",
      "tags": ["arsenal", "rice"]
    }
  ],
  "nextCursor": "eyJpZCI6MTIzfQ==",
  "hasMore": true
}
```

#### GET /api/stories

Get story/article content.

**Response:**
```json
{
  "stories": [
    {
      "id": "story_123",
      "title": "The Maddest Transfer Window Yet",
      "content": "Full article content...",
      "author": "Terry",
      "publishedAt": "2025-06-24T10:00:00Z"
    }
  ]
}
```

#### GET /api/breaking-news

Get Terry's daily breaking news ticker items.

**Response:**
```json
{
  "items": [
    "🚨 BREAKING: Pep's press conference enters third hour; journalists considering unionization",
    "🚨 BREAKING: Arsenal's title hopes spotted in North London medical facility",
    "🚨 BREAKING: Chelsea linked with signing the concept of defending"
  ],
  "updatedAt": "2025-06-24T09:00:00Z"
}
```

---

### 4. Data Management

#### GET /api/tags

Get all available tags for filtering.

**Response:**
```json
{
  "clubs": [
    {"id": "arsenal", "name": "Arsenal", "league": "PL"},
    {"id": "chelsea", "name": "Chelsea", "league": "PL"}
  ],
  "players": [
    {"id": "rice", "name": "Declan Rice", "club": "arsenal"},
    {"id": "haaland", "name": "Erling Haaland", "club": "mancity"}
  ],
  "sources": [
    {"id": "FabrizioRomano", "name": "Fabrizio Romano", "tier": "1"},
    {"id": "David_Ornstein", "name": "David Ornstein", "tier": "1"}
  ]
}
```

#### GET /api/itk-sources

Get all ITK (In The Know) sources.

**Response:**
```json
{
  "sources": [
    {
      "id": "FabrizioRomano",
      "handle": "@FabrizioRomano",
      "name": "Fabrizio Romano",
      "region": "GLOBAL",
      "tier": "1",
      "isActive": true
    }
  ],
  "total": 52,
  "byRegion": {
    "UK": 15,
    "IT": 8,
    "ES": 7,
    "DE": 6,
    "FR": 5,
    "BR": 4,
    "GLOBAL": 7
  }
}
```

---

### 5. System Operations

#### POST /api/cron/hourly

Hourly cron job for monitoring and content generation (requires auth).

**Headers:**
```
Authorization: Bearer YOUR_SECRET_API_KEY
```

**Response:**
```json
{
  "success": true,
  "operations": {
    "tweetsCollected": 47,
    "feedItemsCreated": 12,
    "briefingGenerated": false,
    "duration": "3.2s"
  }
}
```

#### GET /api/health/pipeline

Check system health and pipeline status.

**Response:**
```json
{
  "status": "healthy",
  "components": {
    "database": "connected",
    "twitter": "rate_limited",
    "openai": "operational",
    "monitoring": "active"
  },
  "lastRun": "2025-06-24T10:00:00Z",
  "uptime": "72h 15m"
}
```

---

### 6. User Features

#### POST /api/email/subscribe

Subscribe to email updates (note: email delivery not implemented).

**Body:**
```json
{
  "email": "fan@example.com",
  "preferences": {
    "frequency": "daily",
    "leagues": ["PL", "LALIGA"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscribed successfully",
  "subscriberId": "sub_123"
}
```

---

## Error Responses

All endpoints use consistent error formatting:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Twitter API rate limit exceeded",
    "details": {
      "resetAt": "2025-06-24T11:00:00Z",
      "limit": 15,
      "remaining": 0
    }
  }
}
```

**Common Error Codes:**
- `UNAUTHORIZED` - Missing or invalid auth token
- `NOT_FOUND` - Resource not found
- `RATE_LIMITED` - API rate limit exceeded
- `VALIDATION_ERROR` - Invalid request parameters
- `INTERNAL_ERROR` - Server error

---

## Rate Limiting

- Public endpoints: 100 requests per minute
- Authenticated endpoints: 1000 requests per minute
- SSE connections: Max 10 per IP

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1719226800
```

---

## Real-time Updates

The `/api/live-feed` endpoint uses Server-Sent Events (SSE), NOT WebSockets:

```javascript
// Client example:
const eventSource = new EventSource('/api/live-feed?tags=arsenal,chelsea')

eventSource.onmessage = (event) => {
  const update = JSON.parse(event.data)
  console.log('New update:', update)
}
```

---

## Development

### Running Locally

```bash
# Start development server
npm run dev

# API available at:
http://localhost:4433/api/*
```

### Testing Endpoints

```bash
# Test briefing generation
curl -X POST http://localhost:4433/api/briefings/generate \
  -H "Authorization: Bearer test-key" \
  -H "Content-Type: application/json" \
  -d '{"timeSlot":"morning","test":true}'

# Test feed endpoint
curl http://localhost:4433/api/feed?league=PL&limit=10

# Test SSE stream
curl -N http://localhost:4433/api/live-feed
```

---

## Notes on Implementation

1. **No External API**: This is not a separate API service - all endpoints are Next.js API routes
2. **SSE not WebSocket**: Real-time uses Server-Sent Events, not WebSocket
3. **Simple Auth**: Basic Bearer token auth, not OAuth/JWT
4. **File-based**: API routes are in `src/app/api/*/route.ts` files

---

## Missing Features

These were documented but don't exist:

- ❌ Separate API service at api.transferjuice.com
- ❌ OpenAPI/Swagger documentation
- ❌ WebSocket endpoints
- ❌ OAuth authentication
- ❌ Email sending (only subscription storage)
- ❌ RSS feed endpoints
- ❌ Comprehensive rate limiting

---

**The Terry says:** "Right, that's the actual API then. Not quite the Bloomberg Terminal of football APIs we promised, but it does the job. Like a reliable defensive midfielder - not flashy, but gets you results."

---

*For architecture details, see CURRENT_ARCHITECTURE.md. For frontend integration, see MIGRATION_GUIDE.md.*