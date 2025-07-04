# API Routes Investigation Report

## Executive Summary

This investigation reveals significant discrepancies between documented API routes in CLAUDE.md and actual implementation. The system has **20 API endpoints** versus the **2 documented endpoints**, with evidence of dual system architecture (briefing-based vs live feed).

## Key Findings

### 1. Documented vs Actual Endpoints

**Documented in CLAUDE.md:**

- `/api/cron/hourly` - Primary hourly monitoring system
- `/api/briefings/generate` - Legacy briefing generation
- `/api/polaroids/default` - Mentioned for fallback images
- `/api/websocket/*` - Mentioned but NOT IMPLEMENTED
- `/api/feed/` - Mentioned in architecture target

**Actually Implemented (20 total):**

```
✅ Documented & Implemented:
- /api/cron/hourly
- /api/briefings/generate
- /api/polaroids/default

❌ Documented but NOT Implemented:
- /api/websocket/* (no WebSocket endpoints exist)

🆕 Undocumented but Implemented:
- /api/live-feed (SSE real-time updates)
- /api/feed (main feed data endpoint)
- /api/twitter-stream (Twitter filtered stream control)
- /api/briefing-processor (stream to briefing processor)
- /api/breaking-news
- /api/briefings/[timestamp]
- /api/briefings/[timestamp]/related
- /api/briefings/archive
- /api/briefings/stats
- /api/briefings/test
- /api/email/subscribe
- /api/itk-sources
- /api/monitoring/start
- /api/monitoring/dashboard
- /api/stories
- /api/tags
- /api/health/pipeline
```

### 2. Dual System Architecture Confirmed

The API layer reveals two parallel systems:

**A. Briefing System (OLD/CURRENT):**

- `/api/briefings/*` - Full suite of briefing endpoints
- `/api/cron/hourly` - Generates briefings after monitoring
- Magazine-style layout focus
- 3x daily generation pattern

**B. Live Feed System (NEW/PARTIAL):**

- `/api/feed` - Real-time feed data
- `/api/live-feed` - SSE streaming (not WebSocket)
- `/api/twitter-stream` - Twitter filtered stream
- `/api/briefing-processor` - Stream to briefing converter
- Real-time focus but not fully integrated

### 3. Real-Time Implementation Discrepancy

**Documentation Claims:**

- WebSocket infrastructure for live updates
- Real-time feed as primary experience

**Reality:**

- NO WebSocket implementation exists
- SSE (Server-Sent Events) implemented instead at `/api/live-feed`
- Live feed endpoints exist but not connected to UI
- System still briefing-centric despite feed APIs

### 4. Undocumented Critical Endpoints

Several important endpoints are not mentioned in CLAUDE.md:

1. **`/api/feed`** - Main feed data endpoint with:

   - Full filtering (type, priority, league, tags)
   - Pagination support
   - Rich data transformation
   - POST endpoint for manual entries

2. **`/api/twitter-stream`** - Twitter filtered stream control:

   - Start/stop stream functionality
   - Status monitoring
   - Not integrated with main system

3. **`/api/briefing-processor`** - Bridge between systems:

   - Converts stream data to briefings
   - Buffer management
   - Force generation capabilities

4. **`/api/tags`** - Tag management system
5. **`/api/stories`** - Content story management
6. **`/api/itk-sources`** - ITK source management

### 5. Authentication Inconsistencies

Different endpoints use different auth methods:

- `/api/cron/hourly` - Bearer token (CRON_SECRET)
- `/api/briefings/generate` - X-API-Key header
- `/api/feed` - No authentication
- `/api/live-feed` - No authentication

### 6. Missing Implementations

Per CLAUDE.md, these are NOT implemented:

- WebSocket real-time updates (SSE exists instead)
- RSS feed parsing for content partners
- Email subscription system (endpoint exists but incomplete)
- Production analytics and monitoring (partial)
- User authentication and accounts

## Implications

1. **Documentation is Severely Outdated**: CLAUDE.md reflects aspirational architecture, not current reality

2. **System in Transition**: Clear evidence of migration from briefing-based to feed-based architecture, but incomplete

3. **Real-Time Claims Misleading**: No WebSocket implementation despite documentation claims

4. **Hidden Functionality**: Many working endpoints not documented, suggesting shadow development

5. **Authentication Chaos**: Inconsistent auth patterns across endpoints pose security risk

## Recommendations

1. **Update CLAUDE.md** to reflect actual API endpoints
2. **Choose One Architecture**: Complete migration to live feed or commit to briefings
3. **Implement WebSockets** if real-time is truly required, or update docs to mention SSE
4. **Standardize Authentication** across all endpoints
5. **Document All Endpoints** including undocumented ones
6. **Complete Live Feed Integration** - endpoints exist but aren't used by UI

## Evidence Summary

- 20 actual API endpoints vs 2-3 documented
- Dual system architecture (briefing vs feed)
- SSE implemented instead of WebSocket
- Live feed APIs exist but disconnected from UI
- Multiple undocumented critical endpoints
- Inconsistent authentication patterns
