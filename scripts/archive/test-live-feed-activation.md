# Live Feed Activation Test Instructions

## What We've Completed (Day 1 - Morning Session)

### ✅ Step 1.1: Update Homepage
- Replaced `ContinuousFeed` with `LiveFeedContainer` in `/src/app/page.tsx`
- Homepage now loads the hidden live feed infrastructure

### ✅ Step 1.2: Fix Import Errors  
- Verified correct named import: `import { LiveFeedContainer } from "@/components/feed/LiveFeedContainer"`
- Confirmed all component dependencies exist (FeedItem, LiveFeedFilters)

### ✅ Step 1.3: Connect Feed API
- Verified endpoints are correctly configured:
  - `/api/feed?limit=20` for initial data
  - `/api/live-feed` for SSE real-time updates
- Both endpoints exist and are ready

### ✅ Step 1.4: Test SSE Connection
- Created `test-sse-connection.ts` script
- Installed `eventsource` package for testing

### ✅ Step 1.5: Update Monitoring Frequency  
- Created `/api/monitoring/realtime` endpoint
- Added `vercel.json` with 5-minute cron schedule
- Keeps hourly monitoring as fallback

## Testing Instructions

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test the Homepage
```bash
# In a new terminal:
npx tsx scripts/test-homepage.ts
```

Expected: Should show "Has Live Feed references: ✅"

### 3. Test Feed API
```bash
npx tsx scripts/test-feed-api.ts
```

Expected: Should return success and show feed items (if any exist)

### 4. Test SSE Connection
```bash
npx tsx scripts/test-sse-connection.ts
```

Expected: Should connect and wait for real-time updates

### 5. Check in Browser
1. Open http://localhost:4433
2. Open DevTools → Network tab
3. Look for:
   - `/api/feed` request (should succeed)
   - `/api/live-feed` EventStream (should stay open)
4. Check Console for any errors

## Current Status

The live feed UI is now connected but needs:
- Day 2: Content flow modifications (Terry micro-commentary)
- Day 2: Real-time update handling  
- Day 3: Testing and optimization

## Next Steps (Day 2 Morning)

- Step 2.1: Skip Briefing Generation
- Step 2.2: Create Micro-Commentary Generator
- Step 2.3: Handle Real-Time Updates
- Step 2.4: Update Feed Item Display

## Troubleshooting

### "Module not found" errors
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript compilation: `npm run type-check`

### SSE not connecting
- Verify dev server is running on port 4433
- Check `/api/live-feed/route.ts` exists
- Look for errors in server console

### No feed items showing
- Run briefing generation: `npm run briefing:generate`
- Check database: `npx prisma studio`
- Verify feed items exist in database

---

**The Terry says:** "Right, we've wired up the live feed like connecting a defibrillator to Frankenstein. Now we just need to flip the switch and see if this monster comes to life."