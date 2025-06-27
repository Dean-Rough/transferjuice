# Current System Architecture

**Last Updated:** June 2025  
**Status:** ⚠️ **DUAL SYSTEM** - Two complete architectures coexist

---

## Executive Summary

TransferJuice contains **two complete but separate systems**:

1. **ACTIVE SYSTEM:** Magazine-style briefing platform (what users see)
2. **HIDDEN SYSTEM:** Real-time live feed infrastructure (built but disconnected)

This document maps the actual architecture to help developers understand what exists and make informed decisions about the future direction.

---

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                   USER EXPERIENCE                       │
│                                                         │
│  Homepage (/app/page.tsx)                              │
│  └── ContinuousFeed ──> Briefings (ACTIVE)            │
│      └── BriefingCard components                      │
│                                                         │
│  Hidden: LiveFeedContainer.tsx (508 lines)             │
│          └── FeedItem components (NOT CONNECTED)       │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    API LAYER                            │
│                                                         │
│  ACTIVE ENDPOINTS:                                      │
│  - /api/briefings/* (generate, archive, [timestamp])   │
│  - /api/cron/hourly (monitoring)                       │
│                                                         │
│  HIDDEN ENDPOINTS:                                      │
│  - /api/live-feed (SSE real-time)                     │
│  - /api/feed (supports live feed)                      │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  DATA LAYER                             │
│                                                         │
│  Database Models:                                       │
│  - Briefing (ACTIVE) - Magazine articles               │
│  - FeedItem (HIDDEN) - Individual updates              │
│  - Source (ACTIVE) - 52 global ITK accounts           │
│  - Tag (ACTIVE) - Filtering system                     │
│  - Subscriber (INACTIVE) - No email delivery           │
└─────────────────────────────────────────────────────────┘
```

---

## Active System: Briefing Platform

### Core Components

```
src/
├── app/
│   ├── page.tsx                    # Homepage with ContinuousFeed
│   └── briefings/
│       └── [slug]/page.tsx         # Individual briefing pages
├── components/
│   └── briefings/
│       ├── ContinuousFeed.tsx      # Main briefing display
│       ├── BriefingCard.tsx        # Briefing preview cards
│       └── BriefingContent.tsx     # Full briefing display
└── briefing-generator/
    └── orchestrator.ts             # NEW 9-step generation system
```

### Data Flow

```
1. Hourly Monitoring (cron)
   └── Fetch tweets from 52 sources
       └── Store in FeedItem table
   
2. Briefing Generation (3x daily)
   └── Aggregate FeedItems
       └── Generate Terry AI commentary
           └── Create Briefing record
               └── Display on homepage
```

### Key Features

- **Scheduled Generation:** 9am, 2pm, 9pm
- **Terry AI Integration:** GPT-4 commentary
- **Global Coverage:** 7 regions, multiple leagues
- **Tag System:** Club, Player, Source filtering
- **Continuous Scroll:** Load more briefings

---

## Hidden System: Live Feed Infrastructure

### Complete But Disconnected Components

```
src/
├── components/
│   └── feed/
│       ├── LiveFeedContainer.tsx    # 508 lines - COMPLETE
│       ├── FeedItem.tsx            # Individual updates
│       ├── FeedFilters.tsx         # Tag filtering
│       └── LiveFeedFilters.tsx     # Real-time filters
├── lib/
│   └── realtime/
│       └── broadcaster.ts          # SSE infrastructure
└── app/
    └── api/
        ├── live-feed/route.ts      # SSE endpoint
        └── feed/route.ts           # Feed data API
```

### Unrealized Architecture

```
What Was Built:
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│ ITK Monitor  │ ──> │ Feed Items  │ ──> │ Live Feed UI │
│ (Real-time)  │     │ (Database)  │     │ (SSE Push)   │
└──────────────┘     └─────────────┘     └──────────────┘

Current Reality:
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│ ITK Monitor  │ ──> │ Feed Items  │ ──> │  Briefings   │
│ (Hourly)     │     │ (Database)  │     │ (3x Daily)   │
└──────────────┘     └─────────────┘     └──────────────┘
```

### Hidden Capabilities

1. **Real-time Updates:** Full SSE implementation
2. **Infinite Scroll:** Performance-optimized loading
3. **Live Filtering:** Instant tag-based filtering
4. **Individual Items:** Per-transfer display ready
5. **Broadcasting:** Push updates to connected clients

---

## Database Architecture

### Schema Overview

```prisma
model Briefing {
  id            String    @id
  title         String
  content       String    # Full Terry commentary
  publishedAt   DateTime
  timeSlot      String    # morning/afternoon/evening
  sources       Json      # ITK sources included
  leagues       String[]  # League coverage
  tags          Tag[]     # Related tags
}

model FeedItem {
  id            String    @id
  content       String    # Original tweet
  sourceId      String    # ITK source
  timestamp     DateTime
  processed     Boolean   # Used in briefing?
  relevance     Float?    # AI scoring
  tags          Tag[]     # Extracted entities
}

model Source {
  id            String    @id
  name          String    # Display name
  handle        String    # Twitter handle
  region        String    # UK/IT/DE/FR/ES/BR/GLOBAL
  tier          String?   # Reliability tier
  isActive      Boolean
}
```

---

## Dual Briefing System Issue

### Problem: Two Generation Systems

```
NEW SYSTEM (WORKING):
src/briefing-generator/orchestrator.ts
└── Used by: API endpoints
└── Scripts: npm run briefing:generate

OLD SYSTEM (BROKEN):
src/lib/briefings/generator.ts
└── Used by: 6 legacy scripts
└── Status: WILL FAIL
```

### Affected Scripts (DON'T USE)

```bash
# These use OLD system and are BROKEN:
scripts/generate-test-briefing.ts
scripts/test-briefing-generation.ts
scripts/generate-production-briefing.ts
scripts/create-briefing-from-fresh-data.ts
scripts/test-enhanced-briefing.ts
scripts/test-briefing-mock.ts
```

---

## API Architecture

### Active Endpoints

```typescript
// Briefing Management
POST   /api/briefings/generate      # Create new briefing
GET    /api/briefings/archive       # List briefings
GET    /api/briefings/[timestamp]   # Single briefing
GET    /api/briefings/stats         # Analytics

// System Operations  
POST   /api/cron/hourly            # ITK monitoring
GET    /api/health/pipeline        # System health

// Content Management
GET    /api/tags                   # Tag system
GET    /api/stories                # Story data
```

### Hidden/Incomplete Endpoints

```typescript
// Live Feed (Built but not used)
GET    /api/live-feed              # SSE stream
GET    /api/feed                   # Feed items

// Not Implemented
POST   /api/email/subscribe        # No email system
GET    /api/rss/*                  # No RSS parsing
```

---

## Real-time Infrastructure

### SSE Implementation (Not WebSocket)

```typescript
// lib/realtime/broadcaster.ts
class RealTimeBroadcaster {
  private clients: Set<ReadableStreamDefaultController>
  
  broadcast(event: FeedUpdateEvent): void {
    // Pushes to all connected clients
  }
  
  addClient(controller: ReadableStreamDefaultController): void {
    // SSE connection management
  }
}

// Current Status: Built but no clients connect
```

### WebSocket Claims vs Reality

- **Documentation:** Claims WebSocket support
- **Reality:** SSE (Server-Sent Events) only
- **Hook:** `useWebSocket.ts` exists but mocked
- **Status:** SSE works, WebSocket doesn't exist

---

## Integration Points

### Twitter/X Integration

```
Primary: X API v2 (Bearer Token)
├── Rate Limit: 15 requests/15 minutes
├── Fallback 1: Apify scraping
└── Fallback 2: Playwright automation

Configuration:
- USE_REAL_TWITTER_API=true  # Enable API
- Default: Mock data for development
```

### AI Integration

```
OpenAI GPT-4:
├── Terry commentary generation
├── Content classification
├── Quality validation
└── Transfer relevance scoring

Status: Fully operational
```

---

## Missing Implementations

### Email System

```
Structure Exists:
- Database: Subscriber model
- UI: Signup forms
- Config: Email service variables

Not Implemented:
- No email sending code
- No template system
- No delivery provider
- Default: "mock" provider
```

### Content Partnerships

```
Planned Sources:
- The Upshot (RSS)
- FourFourTwo (RSS)
- Football Ramble (RSS)

Current Status:
- Data structures exist
- No RSS parsing code
- No integration logic
```

---

## Performance Considerations

### Current Load

```
Daily Operations:
- 24 hourly monitoring runs
- 3 briefing generations
- ~50-100 tweets processed
- Minimal database usage

Capacity:
- Over-engineered for scale
- Could handle 1000x current load
- Database: 52 sources, 30 items total
```

### Hidden Optimizations

```
Built but Unused:
- Memory optimization hooks
- Infinite scroll virtualization
- SSE connection pooling
- Caching strategies
```

---

## Developer Guidance

### To Work With Current System

```bash
# Use these commands:
npm run dev                    # Start development
npm run briefing:generate      # Generate briefing
npm run briefing:test         # Test generation

# Monitor these files:
src/briefing-generator/orchestrator.ts  # Main logic
src/app/page.tsx                       # Homepage
src/components/briefings/*             # UI components
```

### To Activate Live Feed

```typescript
// 1. Update homepage (app/page.tsx):
import LiveFeedContainer from '@/components/feed/LiveFeedContainer'
// Replace <ContinuousFeed> with <LiveFeedContainer>

// 2. Enable real-time monitoring:
// Update cron to run every 5 minutes instead of hourly

// 3. Connect SSE to frontend:
// LiveFeedContainer already has SSE hooks ready
```

### To Fix Legacy Scripts

```bash
# Update imports in broken scripts:
# OLD: import { generateBriefing } from '@/lib/briefings/generator'
# NEW: import { BriefingOrchestrator } from '@/briefing-generator/orchestrator'
```

---

## Architecture Decision Record

### Why Two Systems Exist

1. **Original Vision:** Real-time live feed (like Sky Sports)
2. **Pivot Concern:** Complexity and user expectations
3. **Compromise Built:** Magazine-style briefings
4. **Result:** Both systems built, only one connected

### Recommendation

**Option 1: Complete Live Feed Vision**
- Activate `LiveFeedContainer`
- Switch to real-time updates
- Remove briefing generation
- Match PIVOT_DOCUMENT vision

**Option 2: Enhance Current System**
- Delete live feed code
- Improve briefing frequency
- Add email delivery
- Focus on magazine format

**Option 3: Hybrid Approach**
- Keep briefings as primary
- Add live feed as secondary view
- Let users choose experience
- Maintain both systems

---

## Conclusion

TransferJuice has a complete dual architecture where only the briefing system is active. The live feed infrastructure is fully built but disconnected. This creates confusion but also opportunity - the system can easily pivot to either vision or support both.

**The Terry says:** "It's like having Messi on the bench while playing hoofball. The quality's there, someone just needs to make the substitution."

---

*For migration guidance, see MIGRATION_GUIDE.md. For hidden features documentation, see HIDDEN_FEATURES.md.*