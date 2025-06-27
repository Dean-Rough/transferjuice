# Transfer Juice Implementation Roadmap - Detailed Step-by-Step Guide

**Version:** 2.0 - Granular Implementation Guide  
**Updated:** June 2025  
**Current State:** Briefing platform with hidden live feed infrastructure

---

## 🎯 Critical Decision Point

Before starting ANY work, you must decide:

### Option A: Complete Live Feed Pivot (Recommended)
- **What:** Activate the hidden `LiveFeedContainer.tsx` 
- **Effort:** 2-3 days
- **Result:** Real-time transfer feed matching original vision

### Option B: Enhance Current Briefings
- **What:** Keep magazine-style briefings, delete live feed code
- **Effort:** 1-2 weeks  
- **Result:** Better briefing system, simpler architecture

### Option C: Support Both Systems
- **What:** Toggle between briefings and live feed
- **Effort:** 3-4 weeks
- **Result:** Complex but flexible system

**This roadmap assumes Option A: Complete the live feed pivot**

---

## Phase 1: Activate Hidden Live Feed (2-3 Days)

### Day 1 Morning: Connect Live Feed UI

#### Step 1.1: Update Homepage (30 minutes) ✅

```bash
# Start development server
npm run dev
```

1. Open `/src/app/page.tsx`
2. Find the import for `ContinuousFeed`
3. Replace with:
   ```typescript
   // REMOVE THIS LINE:
   import ContinuousFeed from '@/components/briefings/ContinuousFeed'
   
   // ADD THIS LINE:
   import LiveFeedContainer from '@/components/feed/LiveFeedContainer'
   ```

4. In the JSX, find `<ContinuousFeed />` 
5. Replace with `<LiveFeedContainer />`

6. Test in browser - you should see the live feed UI (may show errors initially)

#### Step 1.2: Fix Import Errors (1 hour) ✅

The `LiveFeedContainer` likely has outdated imports. Fix each one:

1. Open `/src/components/feed/LiveFeedContainer.tsx`
2. Check each import at the top
3. Common fixes:
   ```typescript
   // If you see errors like "Module not found"
   
   // OLD: import { api } from '@/lib/api'
   // NEW: import { api } from '@/lib/api/client'
   
   // OLD: import { useFeedStore } from '@/stores/feedStore'  
   // NEW: import { useFeedStore } from '@/lib/stores/feedStore'
   ```

4. Run TypeScript check:
   ```bash
   npm run type-check
   ```

5. Fix any remaining type errors

#### Step 1.3: Connect Feed API (1 hour) ✅

1. Open `/src/components/feed/LiveFeedContainer.tsx`
2. Find the API endpoint constants
3. Update to match actual endpoints:
   ```typescript
   const FEED_API = '/api/feed'
   const SSE_API = '/api/live-feed'
   ```

4. Test the feed endpoint:
   ```bash
   curl http://localhost:4433/api/feed
   ```

5. If no data returns, check `/src/app/api/feed/route.ts`

### Day 1 Afternoon: Enable Real-Time Updates

#### Step 1.4: Test SSE Connection (30 minutes) ✅

1. Open browser DevTools → Network tab
2. Look for `/api/live-feed` connection
3. Should show "EventStream" type
4. If not connecting, check:
   ```typescript
   // In LiveFeedContainer.tsx
   useEffect(() => {
     const eventSource = new EventSource('/api/live-feed')
     console.log('SSE connecting...')
     
     eventSource.onopen = () => {
       console.log('SSE connected!')
     }
     
     eventSource.onerror = (error) => {
       console.error('SSE error:', error)
     }
   }, [])
   ```

#### Step 1.5: Update Monitoring Frequency (1 hour) ✅

Currently runs hourly. Change to every 5 minutes:

1. Create `/src/app/api/monitoring/realtime/route.ts`:
   ```typescript
   import { NextResponse } from 'next/server'
   import { monitorITKSources } from '@/lib/twitter/itk-monitor'
   import { broadcaster } from '@/lib/realtime/broadcaster'
   
   export async function POST() {
     try {
       // Fetch latest updates
       const updates = await monitorITKSources()
       
       // Broadcast to connected clients
       if (updates.length > 0) {
         broadcaster.broadcast({
           type: 'new_items',
           data: updates
         })
       }
       
       return NextResponse.json({ 
         success: true, 
         updates: updates.length 
       })
     } catch (error) {
       return NextResponse.json(
         { error: 'Monitoring failed' },
         { status: 500 }
       )
     }
   }
   ```

2. Update Vercel cron configuration in `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/monitoring/realtime",
       "schedule": "*/5 * * * *"
     }]
   }
   ```

### Day 2 Morning: Modify Content Flow

#### Step 2.1: Skip Briefing Generation (2 hours)

1. Open `/src/lib/twitter/itk-monitor.ts`
2. Find where tweets are saved for briefings
3. Change to save as live feed items:

   ```typescript
   // OLD FLOW:
   // Tweet → Save for briefing → Wait for generation
   
   // NEW FLOW:
   // Tweet → Generate micro-commentary → Broadcast immediately
   
   async function processTweet(tweet: Tweet) {
     // Generate quick Terry commentary
     const commentary = await generateMicroCommentary(tweet)
     
     // Save as feed item
     const feedItem = await prisma.feedItem.create({
       data: {
         content: tweet.text,
         terryCommentary: commentary,
         sourceId: tweet.author_id,
         timestamp: new Date(tweet.created_at),
         published: true // Immediately visible
       }
     })
     
     // Broadcast to live feed
     broadcaster.broadcast({
       type: 'new_item',
       data: feedItem
     })
     
     return feedItem
   }
   ```

#### Step 2.2: Create Micro-Commentary Generator (1 hour)

1. Create `/src/lib/ai/terryMicroCommentary.ts`:
   ```typescript
   import { openai } from '@/lib/openai'
   
   const MICRO_PROMPT = `
   You are Terry, providing instant reactions to transfer news.
   Keep it under 280 characters, sharp and witty.
   
   Examples:
   - "Another 'monitoring the situation' - football's 'it's complicated' relationship status"
   - "£80m for a left back? Games gone. Properly gone. Into the sea."
   - "BREAKING: Footballer wants more money. Hold the front page."
   
   Tweet: {tweet}
   
   Your reaction (max 280 chars):
   `
   
   export async function generateMicroCommentary(tweet: string) {
     const response = await openai.chat.completions.create({
       model: 'gpt-4',
       messages: [{
         role: 'user',
         content: MICRO_PROMPT.replace('{tweet}', tweet)
       }],
       max_tokens: 100,
       temperature: 0.8
     })
     
     return response.choices[0].message.content
   }
   ```

### Day 2 Afternoon: Frontend Integration

#### Step 2.3: Handle Real-Time Updates (1 hour)

1. Update `/src/components/feed/LiveFeedContainer.tsx`:
   ```typescript
   const LiveFeedContainer = () => {
     const [items, setItems] = useState<FeedItem[]>([])
     
     useEffect(() => {
       // Initial load
       fetch('/api/feed')
         .then(res => res.json())
         .then(data => setItems(data.items))
       
       // Real-time updates
       const eventSource = new EventSource('/api/live-feed')
       
       eventSource.onmessage = (event) => {
         const update = JSON.parse(event.data)
         
         if (update.type === 'new_item') {
           // Add new item to top of feed
           setItems(prev => [update.data, ...prev])
         }
       }
       
       return () => eventSource.close()
     }, [])
     
     return (
       <div className="feed-container">
         {items.map(item => (
           <FeedItem key={item.id} {...item} />
         ))}
       </div>
     )
   }
   ```

#### Step 2.4: Update Feed Item Display (1 hour)

1. Check `/src/components/feed/FeedItem.tsx`
2. Ensure it displays:
   - Original tweet content
   - Terry's micro-commentary  
   - Source info (name, handle, tier)
   - Timestamp (use relative time)
   - Clickable tags

3. Example structure:
   ```typescript
   const FeedItem = ({ content, terryCommentary, source, timestamp, tags }) => {
     return (
       <div className="border-b border-gray-800 p-4">
         <div className="flex items-start gap-3">
           <img 
             src={source.avatar} 
             className="w-10 h-10 rounded-full"
           />
           <div className="flex-1">
             <div className="flex items-center gap-2 mb-1">
               <span className="font-bold">{source.name}</span>
               <span className="text-gray-500">@{source.handle}</span>
               <span className="text-gray-500">·</span>
               <time className="text-gray-500">
                 {formatRelativeTime(timestamp)}
               </time>
             </div>
             
             <p className="mb-2">{content}</p>
             
             {terryCommentary && (
               <div className="bg-gray-900 rounded p-3 mb-2">
                 <p className="text-sm italic">
                   💭 Terry: "{terryCommentary}"
                 </p>
               </div>
             )}
             
             <div className="flex gap-2">
               {tags.map(tag => (
                 <TagButton key={tag.id} {...tag} />
               ))}
             </div>
           </div>
         </div>
       </div>
     )
   }
   ```

### Day 3: Testing & Optimization

#### Step 3.1: Test Complete Flow (2 hours)

1. **Manual Testing Checklist:**
   - [ ] Homepage loads with live feed
   - [ ] Feed shows existing items
   - [ ] New items appear without refresh
   - [ ] Tags are clickable and filter works
   - [ ] Mobile responsive works
   - [ ] No console errors

2. **Create test tweet:**
   ```bash
   # Use the test endpoint
   curl -X POST http://localhost:4433/api/test/create-feed-item \
     -H "Content-Type: application/json" \
     -d '{
       "content": "BREAKING: Arsenal close to signing midfielder",
       "source": "FabrizioRomano"
     }'
   ```

3. **Monitor real-time update:**
   - Should appear in feed within 2-3 seconds
   - Terry commentary should be generated
   - No page refresh needed

#### Step 3.2: Performance Optimization (2 hours)

1. **Implement Virtual Scrolling:**
   ```typescript
   // Already in LiveFeedContainer! Just needs activation
   import { useVirtualizer } from '@tanstack/react-virtual'
   
   // Look for commented out virtualizer code
   // Uncomment and test with 1000+ items
   ```

2. **Test with load:**
   ```bash
   # Create many test items
   npm run script:generate-test-feed-items -- --count=1000
   ```

3. **Measure performance:**
   - Open Chrome DevTools → Performance
   - Record while scrolling
   - Should maintain 60fps

#### Step 3.3: Fix Edge Cases (1 hour)

Common issues to check:

1. **SSE Reconnection:**
   ```typescript
   // Add reconnection logic
   let reconnectTimeout: NodeJS.Timeout
   
   eventSource.onerror = () => {
     eventSource.close()
     reconnectTimeout = setTimeout(() => {
       // Reconnect after 5 seconds
       connectSSE()
     }, 5000)
   }
   ```

2. **Duplicate Prevention:**
   ```typescript
   // In feed update handler
   setItems(prev => {
     // Check if item already exists
     if (prev.find(item => item.id === update.data.id)) {
       return prev
     }
     return [update.data, ...prev]
   })
   ```

3. **Memory Leaks:**
   ```typescript
   // Cleanup on unmount
   useEffect(() => {
     const eventSource = new EventSource('/api/live-feed')
     
     return () => {
       eventSource.close()
       clearTimeout(reconnectTimeout)
     }
   }, [])
   ```

---

## Phase 2: Complete Missing Features (1 Week)

### Day 4: Terry's Breaking News

#### Step 4.1: Create Breaking News Generator (2 hours)

1. Create `/src/lib/breaking-news/generator.ts`:
   ```typescript
   interface BreakingNewsConfig {
     maxPerMonth: number
     requiresContext: boolean
     style: 'comedy_soundbite'
   }
   
   const CONFIG: BreakingNewsConfig = {
     maxPerMonth: 3,
     requiresContext: true,
     style: 'comedy_soundbite'
   }
   
   export async function maybeGenerateBreakingNews(
     recentEvents: FeedItem[]
   ): Promise<string | null> {
     // Check if we've already done too many this month
     const thisMonth = await getBreakingNewsCount()
     if (thisMonth >= CONFIG.maxPerMonth) return null
     
     // Check if there's genuine drama
     const drama = detectGenuineDrama(recentEvents)
     if (!drama) return null
     
     // Generate comedy soundbite
     return await generateSoundbite(drama)
   }
   ```

2. Create comedy templates:
   ```typescript
   const TEMPLATES = [
     "Pep Guardiola's press conference enters {hour}th hour; UN considering intervention",
     "{club}'s title hopes last seen entering {location} for emergency {procedure}",
     "BREAKING: {player} spotted {action}, {club} fans {reaction}",
     "{manager} claims {excuse} for {result}; Terry calls bullshit"
   ]
   ```

#### Step 4.2: Integrate with Feed (1 hour)

1. Update monitoring to check for breaking news:
   ```typescript
   // In monitoring route
   const breakingNews = await maybeGenerateBreakingNews(recentItems)
   
   if (breakingNews) {
     broadcaster.broadcast({
       type: 'breaking_news',
       data: {
         content: breakingNews,
         timestamp: new Date()
       }
     })
   }
   ```

2. Handle in frontend:
   ```typescript
   // In LiveFeedContainer
   if (update.type === 'breaking_news') {
     // Show special breaking news banner
     setBreakingNews(update.data)
     
     // Auto-hide after 30 seconds
     setTimeout(() => setBreakingNews(null), 30000)
   }
   ```

### Day 5: Smart Content Mixing

#### Step 5.1: Detect Quiet Periods (2 hours)

1. Create `/src/lib/content/quietDetector.ts`:
   ```typescript
   export async function isQuietPeriod(): Promise<boolean> {
     // Check last 2 hours of activity
     const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
     
     const recentItems = await prisma.feedItem.count({
       where: {
         timestamp: { gte: twoHoursAgo },
         type: 'itk_update'
       }
     })
     
     // Less than 3 updates = quiet period
     return recentItems < 3
   }
   ```

2. Create content mixer:
   ```typescript
   export async function mixInPartnerContent() {
     if (!await isQuietPeriod()) return
     
     // Fetch partner content
     const partnerStory = await fetchPartnerContent()
     
     // Generate Terry intro
     const intro = await generateTerryIntro(partnerStory)
     
     // Create feed item
     const mixedContent = {
       type: 'partner_content',
       content: partnerStory.summary,
       terryCommentary: intro,
       source: {
         name: partnerStory.source,
         attribution: `The brilliant lads at ${partnerStory.source}`
       },
       link: partnerStory.url
     }
     
     // Broadcast to feed
     broadcaster.broadcast({
       type: 'new_item',
       data: mixedContent
     })
   }
   ```

#### Step 5.2: Partner Content Sources (2 hours)

1. Create `/src/lib/partnerships/sources.ts`:
   ```typescript
   export const PARTNER_SOURCES = {
     theUpshot: {
       name: 'The Upshot',
       url: 'https://theupshot.com/feed.xml',
       categories: ['player-antics', 'off-pitch-drama'],
       attribution: 'The brilliant minds at The Upshot spotted this gem...'
     },
     fourFourTwo: {
       name: 'FourFourTwo',
       url: 'https://fourfourtwo.com/feed',
       categories: ['historical-chaos', 'transfer-retrospectives'],
       attribution: 'FourFourTwo dug this out of the archives...'
     },
     footballRamble: {
       name: 'The Football Ramble',  
       url: 'https://footballramble.com/feed',
       categories: ['weekly-mishaps', 'manager-meltdowns'],
       attribution: 'The Football Ramble lads covered this perfectly...'
     }
   }
   ```

2. Implement RSS parsing:
   ```typescript
   import Parser from 'rss-parser'
   
   const parser = new Parser()
   
   export async function fetchPartnerContent() {
     const feeds = await Promise.all(
       Object.values(PARTNER_SOURCES).map(source => 
         parser.parseURL(source.url)
       )
     )
     
     // Find relevant recent content
     const relevant = feeds
       .flatMap(feed => feed.items)
       .filter(item => isRelevantToTransfers(item))
       .sort((a, b) => b.pubDate - a.pubDate)
     
     return relevant[0] // Most recent relevant story
   }
   ```

### Day 6-7: Email Integration

#### Step 6.1: Choose Email Provider (1 hour)

1. Evaluate options:
   - **Resend**: Modern, developer-friendly, good for transactional
   - **SendGrid**: Reliable, good deliverability, complex
   - **Postmark**: Excellent deliverability, simple API

2. For TransferJuice, recommend **Resend**:
   ```bash
   npm install resend
   ```

3. Get API key from https://resend.com

#### Step 6.2: Create Email Templates (3 hours)

1. Create `/src/lib/email/templates/dailySummary.tsx`:
   ```typescript
   import { 
     Html, 
     Head, 
     Body, 
     Container, 
     Text, 
     Link 
   } from '@react-email/components'
   
   export function DailySummaryEmail({ 
     stories, 
     date 
   }: { 
     stories: FeedItem[], 
     date: string 
   }) {
     return (
       <Html>
         <Head />
         <Body style={{ backgroundColor: '#0A0808' }}>
           <Container>
             <Text style={{ 
               color: '#F9F2DF',
               fontSize: '24px',
               fontWeight: 'bold'
             }}>
               Yesterday's chaos while you pretended to have a life
             </Text>
             
             {stories.map(story => (
               <div key={story.id}>
                 <Text style={{ color: '#FFFFFF' }}>
                   {story.content}
                 </Text>
                 <Text style={{ 
                   color: '#F9F2DF',
                   fontStyle: 'italic'
                 }}>
                   Terry says: "{story.terryCommentary}"
                 </Text>
               </div>
             ))}
             
             <Link 
               href="https://transferjuice.com"
               style={{ color: '#FF8E21' }}
             >
               Read more chaos on the live feed →
             </Link>
           </Container>
         </Body>
       </Html>
     )
   }
   ```

#### Step 6.3: Implement Send Logic (2 hours)

1. Create `/src/lib/email/sender.ts`:
   ```typescript
   import { Resend } from 'resend'
   import { DailySummaryEmail } from './templates/dailySummary'
   
   const resend = new Resend(process.env.RESEND_API_KEY)
   
   export async function sendDailySummary() {
     // Get yesterday's best content
     const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
     
     const topStories = await prisma.feedItem.findMany({
       where: {
         timestamp: { gte: yesterday },
         // Sort by engagement or Terry score
       },
       take: 10,
       orderBy: { terryScore: 'desc' }
     })
     
     // Get all active subscribers
     const subscribers = await prisma.subscriber.findMany({
       where: { active: true }
     })
     
     // Send in batches
     for (const batch of chunk(subscribers, 100)) {
       await resend.emails.send({
         from: 'Terry <terry@transferjuice.com>',
         to: batch.map(s => s.email),
         subject: generateSubjectLine(topStories),
         react: DailySummaryEmail({ 
           stories: topStories,
           date: yesterday.toDateString()
         })
       })
     }
   }
   ```

2. Create cron job:
   ```typescript
   // /src/app/api/email/send-daily/route.ts
   export async function POST() {
     try {
       await sendDailySummary()
       return NextResponse.json({ success: true })
     } catch (error) {
       return NextResponse.json(
         { error: 'Failed to send emails' },
         { status: 500 }
       )
     }
   }
   ```

---

## Phase 3: Performance & Polish (3-4 Days)

### Day 8: Performance Optimization

#### Step 8.1: Implement Full Virtualization (2 hours)

1. Install dependencies:
   ```bash
   npm install @tanstack/react-virtual
   ```

2. Update LiveFeedContainer:
   ```typescript
   import { useVirtualizer } from '@tanstack/react-virtual'
   
   const LiveFeedContainer = () => {
     const parentRef = useRef<HTMLDivElement>(null)
     
     const virtualizer = useVirtualizer({
       count: items.length,
       getScrollElement: () => parentRef.current,
       estimateSize: () => 150, // Estimated item height
       overscan: 5 // Render 5 items outside viewport
     })
     
     return (
       <div ref={parentRef} className="h-screen overflow-auto">
         <div
           style={{
             height: `${virtualizer.getTotalSize()}px`,
             position: 'relative'
           }}
         >
           {virtualizer.getVirtualItems().map(virtualItem => (
             <div
               key={virtualItem.key}
               style={{
                 position: 'absolute',
                 top: 0,
                 left: 0,
                 width: '100%',
                 transform: `translateY(${virtualItem.start}px)`
               }}
             >
               <FeedItem {...items[virtualItem.index]} />
             </div>
           ))}
         </div>
       </div>
     )
   }
   ```

#### Step 8.2: Add Memory Management (1 hour)

1. Use the existing memory optimization hook:
   ```typescript
   import { useMemoryOptimization } from '@/hooks/useMemoryOptimization'
   
   const LiveFeedContainer = () => {
     const memoryStats = useMemoryOptimization(items)
     
     // Auto-cleanup old items when memory pressure
     useEffect(() => {
       if (memoryStats.pressure === 'high' && items.length > 1000) {
         // Keep only last 500 items
         setItems(prev => prev.slice(0, 500))
       }
     }, [memoryStats.pressure])
   }
   ```

### Day 9: SEO & Social Sharing

#### Step 9.1: Implement Dynamic Meta Tags (2 hours)

1. Create shareable filtered URLs:
   ```typescript
   // Update URL when filters change
   const updateURL = (filters: FilterState) => {
     const params = new URLSearchParams()
     
     if (filters.tags.length) {
       params.set('tags', filters.tags.join(','))
     }
     if (filters.league) {
       params.set('league', filters.league)
     }
     
     router.push(`/?${params.toString()}`, { shallow: true })
   }
   ```

2. Generate dynamic meta tags:
   ```typescript
   // In app/layout.tsx
   export async function generateMetadata({ 
     searchParams 
   }): Promise<Metadata> {
     const tags = searchParams.tags?.split(',') || []
     
     if (tags.length) {
       return {
         title: `${tags.join(' & ')} Transfer News | Transfer Juice`,
         description: `Latest ${tags.join(' and ')} transfer updates with Terry's commentary`,
         openGraph: {
           title: `${tags.join(' & ')} Transfer Chaos`,
           description: `Terry's covering all the ${tags.join(' and ')} madness`,
           images: [generateOGImage(tags)]
         }
       }
     }
     
     return defaultMetadata
   }
   ```

#### Step 9.2: Add Share Functionality (1 hour)

1. Update ShareButton component:
   ```typescript
   const ShareButton = ({ 
     url, 
     title, 
     tags 
   }: ShareButtonProps) => {
     const share = async () => {
       if (navigator.share) {
         // Native sharing
         await navigator.share({
           title,
           text: `${title} - Terry's got opinions`,
           url
         })
       } else {
         // Fallback to Twitter
         window.open(
           `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
           '_blank'
         )
       }
     }
     
     return (
       <button 
         onClick={share}
         className="flex items-center gap-1 text-sm"
       >
         <ShareIcon className="w-4 h-4" />
         Share
       </button>
     )
   }
   ```

### Day 10: Final Testing & Launch Prep

#### Step 10.1: Comprehensive Testing (4 hours)

1. **Load Testing:**
   ```bash
   # Install artillery for load testing
   npm install -D artillery
   
   # Create test script
   echo 'config:
     target: "http://localhost:4433"
     phases:
       - duration: 60
         arrivalRate: 10
   scenarios:
     - name: "Browse Feed"
       flow:
         - get:
             url: "/api/feed"
         - think: 5
         - get:
             url: "/api/live-feed"' > load-test.yml
   
   # Run load test
   npx artillery run load-test.yml
   ```

2. **Cross-browser Testing:**
   - Chrome, Firefox, Safari, Edge
   - Mobile: iOS Safari, Chrome Android
   - Test infinite scroll on all
   - Verify SSE works on all browsers

3. **Accessibility Audit:**
   ```bash
   # Run Lighthouse
   npm run lighthouse
   
   # Check for issues:
   # - Keyboard navigation through feed
   # - Screen reader announcements for new items
   # - Color contrast in dark mode
   # - Focus indicators on interactive elements
   ```

#### Step 10.2: Production Configuration (2 hours)

1. **Environment Variables:**
   ```env
   # .env.production
   DATABASE_URL=your-production-db
   OPENAI_API_KEY=your-api-key
   X_BEARER_TOKEN=your-twitter-token
   RESEND_API_KEY=your-email-key
   NEXT_PUBLIC_API_URL=https://transferjuice.com
   ```

2. **Monitoring Setup:**
   ```typescript
   // Add to layout.tsx
   import { Analytics } from '@vercel/analytics/react'
   import { SpeedInsights } from '@vercel/speed-insights/next'
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Analytics />
           <SpeedInsights />
         </body>
       </html>
     )
   }
   ```

3. **Error Tracking:**
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

#### Step 10.3: Deployment (1 hour)

1. **Deploy to Vercel:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Post-deployment Checklist:**
   - [ ] Live feed loads properly
   - [ ] SSE connections work
   - [ ] Cron jobs are scheduled
   - [ ] Email sending works
   - [ ] Monitoring is active
   - [ ] Error tracking captures issues

---

## Success Metrics & Monitoring

### Week 1 Targets

- [ ] Live feed active and updating
- [ ] 100+ feed items displayed smoothly
- [ ] <3s page load time
- [ ] 0 console errors
- [ ] 5+ test users confirmed working

### Week 2 Targets  

- [ ] 500+ daily active users
- [ ] >5 min average session time
- [ ] <1% error rate
- [ ] 50+ email subscribers
- [ ] 10+ shared filtered URLs daily

### Month 1 Targets

- [ ] 5,000+ daily active users
- [ ] >60% return visitor rate
- [ ] 1,000+ email subscribers
- [ ] Partner content integrated
- [ ] Revenue experiments started

---

## Troubleshooting Guide

### Common Issues & Solutions

#### "Feed not updating"
1. Check SSE connection in Network tab
2. Verify cron job is running: `curl -X POST https://yourdomain.com/api/monitoring/realtime`
3. Check broadcaster has clients: Add logging to `broadcaster.ts`

#### "Memory issues with many items"
1. Ensure virtualization is active
2. Check memory optimization hook is running
3. Reduce item retention to 500 max
4. Implement pagination for initial load

#### "Terry commentary not generating"
1. Check OpenAI API key is set
2. Verify rate limits not exceeded
3. Test with direct API call
4. Check for content filtering issues

#### "Email not sending"
1. Verify Resend API key
2. Check subscriber exists in database
3. Test with single email first
4. Check spam folders

---

## Next Steps After Launch

### Week 3-4: Optimization

1. **A/B Testing:**
   - Test different commentary styles
   - Optimize feed item layouts
   - Experiment with update frequencies

2. **Feature Additions:**
   - User accounts for personalization
   - Push notifications for breaking news
   - Advanced filtering options
   - Bookmarking functionality

3. **Monetization:**
   - Native advertising in feed
   - Premium tier for ad-free
   - Sponsored club/player alerts
   - Partner content revenue share

---

**The Terry says:** "Right, that's your step-by-step then. Follow it like Mourinho follows a grudge - obsessively and without deviation. Get building."