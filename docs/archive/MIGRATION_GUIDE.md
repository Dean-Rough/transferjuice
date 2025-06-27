# Migration Guide: Briefings → Live Feed

**Purpose:** Complete the pivot from magazine-style briefings to real-time live feed  
**Effort:** ~2-3 days of focused development  
**Risk:** Low - infrastructure already exists

---

## Overview

This guide provides step-by-step instructions to activate the hidden live feed system and complete the vision described in PIVOT_DOCUMENT.md. All infrastructure is already built - this is primarily a "wiring up" exercise.

---

## Pre-Migration Checklist

### ✅ Already Built (No Action Needed)

- [ ] Live feed UI components (`LiveFeedContainer.tsx`)
- [ ] Real-time SSE infrastructure (`broadcaster.ts`)
- [ ] Feed item data model and storage
- [ ] Tag filtering system
- [ ] API endpoints for live feed
- [ ] Global ITK source monitoring

### ⚠️ Requires Attention

- [ ] Homepage currently shows briefings, not live feed
- [ ] Monitoring runs hourly, not real-time
- [ ] Feed items used for briefings, not direct display
- [ ] SSE endpoint exists but no clients connect
- [ ] Email system not implemented

---

## Migration Steps

### Phase 1: Activate Live Feed UI (Day 1)

#### Step 1.1: Update Homepage

```typescript
// src/app/page.tsx

// REMOVE:
import ContinuousFeed from '@/components/briefings/ContinuousFeed'

// ADD:
import LiveFeedContainer from '@/components/feed/LiveFeedContainer'

// In the component, REPLACE:
<ContinuousFeed />

// WITH:
<LiveFeedContainer />
```

#### Step 1.2: Fix Import Paths

The `LiveFeedContainer` may have outdated imports. Update:

```typescript
// src/components/feed/LiveFeedContainer.tsx

// Check and update these imports:
import { api } from '@/lib/api'
import { FeedItem } from '@/components/feed/FeedItem'
import { useFeedStore } from '@/lib/stores/feedStore'
```

#### Step 1.3: Connect to Live Feed API

```typescript
// Ensure LiveFeedContainer connects to:
const FEED_ENDPOINT = '/api/feed'
const SSE_ENDPOINT = '/api/live-feed'
```

### Phase 2: Enable Real-Time Monitoring (Day 1)

#### Step 2.1: Update Monitoring Frequency

```typescript
// src/app/api/cron/hourly/route.ts

// Change from hourly to every 5 minutes:
// Update cron job configuration in Vercel/hosting:
// FROM: 0 * * * *  (hourly)
// TO:   */5 * * * * (every 5 minutes)
```

#### Step 2.2: Create Real-Time Monitor

Create a new monitoring service:

```typescript
// src/lib/monitoring/realTimeMonitor.ts

export class RealTimeMonitor {
  private broadcaster = new RealTimeBroadcaster()
  
  async checkForUpdates() {
    // 1. Fetch latest tweets from sources
    const updates = await fetchLatestTweets()
    
    // 2. Process with Terry AI
    const processed = await generateTerryCommentary(updates)
    
    // 3. Save as FeedItems (not briefings)
    const items = await saveFeedItems(processed)
    
    // 4. Broadcast to connected clients
    this.broadcaster.broadcast({
      type: 'new_items',
      data: items
    })
  }
}
```

#### Step 2.3: Update API Route

```typescript
// src/app/api/monitoring/realtime/route.ts

import { RealTimeMonitor } from '@/lib/monitoring/realTimeMonitor'

export async function POST() {
  const monitor = new RealTimeMonitor()
  await monitor.checkForUpdates()
  return Response.json({ success: true })
}
```

### Phase 3: Modify Content Flow (Day 2)

#### Step 3.1: Skip Briefing Generation

```typescript
// src/lib/feedItems/processor.ts

// CHANGE FROM:
async function processTweet(tweet: Tweet) {
  // Save for briefing generation
  await saveFeedItem({
    ...tweet,
    processed: false,
    briefingId: null
  })
}

// TO:
async function processTweet(tweet: Tweet) {
  // Process immediately for live feed
  const terryComment = await generateTerryMicroComment(tweet)
  
  const feedItem = await saveFeedItem({
    ...tweet,
    terryCommentary: terryComment,
    processed: true,
    publishedAt: new Date()
  })
  
  // Broadcast immediately
  broadcaster.broadcast({
    type: 'new_item',
    data: feedItem
  })
}
```

#### Step 3.2: Update Terry AI for Micro-Updates

```typescript
// src/lib/ai/terryMicroCommentary.ts

const MICRO_UPDATE_PROMPT = `
You are Terry, providing quick one-liner reactions to transfer news.
Keep it under 280 characters, sharp and witty.
No need for context or explanation - just pure reaction.

Examples:
- "Ah yes, another 'monitoring the situation' - football's equivalent of 'it's not you, it's me'"
- "£80m for a left back who can't defend? Games absolutely gone"
- "BREAKING: Player wants more money. In other news, water remains wet"
`
```

### Phase 4: Frontend Integration (Day 2)

#### Step 4.1: Enable Real-Time Updates

```typescript
// src/components/feed/LiveFeedContainer.tsx

useEffect(() => {
  // Connect to SSE endpoint
  const eventSource = new EventSource('/api/live-feed')
  
  eventSource.onmessage = (event) => {
    const update = JSON.parse(event.data)
    
    if (update.type === 'new_item') {
      // Add to top of feed
      prependFeedItem(update.data)
    }
  }
  
  return () => eventSource.close()
}, [])
```

#### Step 4.2: Update Feed Item Display

```typescript
// src/components/feed/FeedItem.tsx

// Ensure it can display:
// - Original tweet content
// - Terry's micro-commentary
// - Source attribution
// - Timestamp (relative)
// - Tags (clickable)
```

### Phase 5: Clean Up & Optimize (Day 3)

#### Step 5.1: Remove/Hide Briefing UI

```typescript
// Option A: Complete removal
// Delete: src/components/briefings/*
// Delete: src/app/briefings/*

// Option B: Keep but hide
// Add feature flag: ENABLE_BRIEFINGS=false
```

#### Step 5.2: Update Navigation

```typescript
// src/components/layout/Header.tsx

// REMOVE:
<Link href="/briefings">Briefings</Link>

// No additional nav needed - feed is homepage
```

#### Step 5.3: Implement Infinite Scroll

```typescript
// src/components/feed/LiveFeedContainer.tsx

// Already implemented in the component!
// Just ensure it's connected to pagination API:

const loadMore = async () => {
  const response = await fetch(`/api/feed?cursor=${lastItemId}`)
  const { items, nextCursor } = await response.json()
  appendFeedItems(items)
  setLastItemId(nextCursor)
}
```

### Phase 6: Complete Missing Features

#### Step 6.1: Terry's Breaking News

```typescript
// src/lib/breaking-news/generator.ts

const BREAKING_NEWS_RULES = {
  maxPerMonth: 3,
  requiresContext: true,
  style: 'comedy_soundbite'
}

export async function generateBreakingNews(context: CurrentEvents) {
  // Only during genuine drama
  if (!isGenuineDrama(context)) return null
  
  return {
    emoji: '🚨',
    prefix: 'BREAKING:',
    content: await generateComedySoundbite(context)
  }
}
```

#### Step 6.2: Smart Content Mixing

```typescript
// src/lib/content/mixer.ts

export async function mixContent(feedItems: FeedItem[]) {
  // If last hour had < 5 updates, add partner content
  if (feedItems.length < 5) {
    const partnerStory = await fetchPartnerContent()
    
    return [
      ...feedItems,
      {
        type: 'partner_content',
        source: partnerStory.source,
        attribution: `The brilliant lads at ${partnerStory.source}`,
        content: partnerStory.summary,
        link: partnerStory.url
      }
    ]
  }
  
  return feedItems
}
```

---

## Configuration Updates

### Environment Variables

```env
# .env.local

# Change from briefing mode to live feed
ENABLE_LIVE_FEED=true
ENABLE_BRIEFINGS=false

# Increase monitoring frequency
MONITORING_INTERVAL_MINUTES=5

# Enable real-time features
ENABLE_SSE=true
SSE_HEARTBEAT_SECONDS=30

# Content mixing
ENABLE_PARTNER_CONTENT=true
MIN_UPDATES_PER_HOUR=5
```

### Vercel Cron Jobs

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/monitoring/realtime",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## Testing Plan

### 1. Component Testing

```bash
# Test live feed container
npm run test src/components/feed/LiveFeedContainer.test.tsx

# Test real-time updates
npm run test src/lib/realtime/broadcaster.test.ts
```

### 2. Integration Testing

```typescript
// tests/live-feed.e2e.ts

test('live feed updates in real-time', async ({ page }) => {
  await page.goto('/')
  
  // Trigger a test update
  await fetch('/api/test/trigger-update', { method: 'POST' })
  
  // Should appear without refresh
  await expect(page.locator('[data-testid="feed-item"]').first())
    .toContainText('Test update')
})
```

### 3. Load Testing

```bash
# Test SSE connections
artillery run tests/sse-load-test.yml

# Test feed performance
npm run test:performance
```

---

## Rollback Plan

If issues arise, rollback is simple:

```typescript
// src/app/page.tsx

// Quick rollback - just swap components:
// FROM: <LiveFeedContainer />
// TO:   <ContinuousFeed />

// Everything else can stay in place
```

---

## Post-Migration Tasks

### 1. Update Documentation

- [ ] Update README.md to describe live feed
- [ ] Archive briefing-related docs
- [ ] Update API documentation
- [ ] Create user guide for live feed

### 2. Monitor Performance

- [ ] Set up error tracking for SSE connections
- [ ] Monitor feed update latency
- [ ] Track user engagement metrics
- [ ] Watch for memory leaks in real-time system

### 3. Gather Feedback

- [ ] Add feedback widget
- [ ] Monitor user behavior
- [ ] A/B test if keeping both systems
- [ ] Iterate based on usage patterns

---

## Common Issues & Solutions

### Issue: Feed Items Don't Appear

```typescript
// Check:
1. Is LiveFeedContainer connected to correct API?
2. Are feed items being saved with correct structure?
3. Is SSE connection established?

// Debug:
console.log('SSE State:', eventSource.readyState)
console.log('Feed Items:', feedStore.items)
```

### Issue: Performance Degradation

```typescript
// Solutions:
1. Implement virtual scrolling (already in LiveFeedContainer)
2. Limit feed items in memory
3. Add pagination cursor
4. Use React.memo for FeedItem components
```

### Issue: Terry Commentary Too Slow

```typescript
// Options:
1. Pre-generate commentary during quiet periods
2. Use faster AI model for micro-updates
3. Show tweet immediately, add commentary async
4. Cache common commentary patterns
```

---

## Success Metrics

After migration, monitor:

1. **Page Load Time:** Should be < 2s
2. **Time to First Update:** < 10s after news breaks
3. **User Session Length:** Target > 5 minutes
4. **Scroll Depth:** > 70% of available content
5. **Return Visits:** Daily active users > 60%

---

## Conclusion

The migration from briefings to live feed is straightforward because the infrastructure already exists. The main work is:

1. Swapping UI components
2. Increasing monitoring frequency  
3. Adjusting content flow
4. Testing real-time features

Total effort: 2-3 days for core migration, 1-2 days for optimization and testing.

**The Terry says:** "Right, time to stop sitting on the bench and get in the game. This live feed's been warming up longer than a substitute goalkeeper."

---

*For current architecture details, see CURRENT_ARCHITECTURE.md. For hidden features, see HIDDEN_FEATURES.md.*