# Product Requirements Document (PRD)

**Project Name:** Transfer Juice — Football Transfer Briefings Platform

**Website:** transferjuice.com

**Owner:** Dean

**Date:** June 2025 (Reality-Checked Version)

**Document Status:** ⚠️ **TRANSITIONAL** - System caught between two visions

---

## Executive Summary

Transfer Juice is currently a **magazine-style briefing platform** that transforms global football transfer news into AI-generated briefings with Terry's ascerbic commentary. The system generates briefings three times daily (9am, 2pm, 9pm) and displays them in a continuous scroll format.

**Critical Note:** The codebase contains a complete but **hidden live feed infrastructure** that matches the original vision of a real-time transfer feed. This PRD documents the current reality while acknowledging the transition state.

---

## Current Reality vs Original Vision

### What Users Currently Experience

- **Magazine-style briefings** published 3x daily
- **Continuous scroll** through past briefings  
- **Global transfer coverage** with Terry's AI commentary
- **Tag filtering** by club, player, and source
- **Dark mode interface** with clean typography

### What's Built But Hidden

- **Complete live feed system** (`LiveFeedContainer.tsx` - 508 lines)
- **Real-time SSE infrastructure** for instant updates
- **Individual feed item display** components
- **WebSocket-style broadcasting** system
- **Infinite scroll** with performance optimization

### Original Vision (Not Yet Implemented)

- Sky Sports Transfer Centre style live feed
- Hourly micro-updates in real-time
- Individual transfer items as they happen
- True infinite scroll experience
- Web-first with email as secondary

---

## System Architecture (Current State)

### Dual System Reality

```
┌─────────────────────┐
│   ACTIVE SYSTEM     │
│ Briefing Generator  │ ──> Magazine-style articles
│ (3x daily)          │     displayed on homepage
└─────────────────────┘
        
┌─────────────────────┐
│   HIDDEN SYSTEM     │
│ Live Feed Infra     │ ──> Complete but disconnected
│ (Real-time ready)   │     from user experience  
└─────────────────────┘
```

### Active Features

1. **Global ITK Monitoring**
   - 52 sources across 7 regions (UK, IT, DE, FR, ES, BR, GLOBAL)
   - Leagues: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, more
   - Hourly data collection feeding into briefings

2. **Terry AI Commentary System**
   - OpenAI GPT-4 integration
   - Joel Golby style voice consistency
   - Quality validation and tone checking
   - Integrated into briefing generation

3. **Briefing Generation Pipeline**
   - 9-step orchestration process
   - Scheduled generation (9am, 2pm, 9pm)
   - Smart content aggregation
   - Breaking news integration

4. **Web Interface**
   - Homepage with 70/30 layout (content/sidebar)
   - Continuous scroll through briefings
   - Tag and league filtering
   - Responsive dark mode design

---

## Technical Implementation

### Database Schema

```
Models:
- Briefing (published articles with Terry commentary)
- FeedItem (individual transfer updates)  
- Source (52 global ITK accounts)
- Tag (clubs, players, sources)
- Subscriber (email list - not actively used)
```

### API Endpoints (Actual)

```
/api/briefings/generate      # Generate new briefing
/api/briefings/archive       # Get past briefings
/api/briefings/[timestamp]   # Individual briefing
/api/cron/hourly            # Hourly monitoring
/api/feed                   # Feed items (supports live feed)
/api/live-feed              # SSE endpoint (built, not used)
/api/tags                   # Tag management
```

### Technology Stack

- **Frontend:** Next.js 14 with App Router, TypeScript, TailwindCSS
- **Backend:** Node.js API routes, Prisma ORM
- **Database:** PostgreSQL (Neon)
- **AI:** OpenAI GPT-4 for Terry commentary
- **Real-time:** SSE infrastructure (not WebSocket)
- **Deployment:** Vercel

---

## Content Strategy (Current Implementation)

### Terry's Voice

- **Ascerbic British humor** in Joel Golby style
- **Football-obsessed** but pretending not to be
- **Sharp observations** about transfer madness
- **Contextual awareness** of football culture

### Content Sources

1. **Primary:** 52 global ITK Twitter accounts
2. **Secondary:** Partner content (structure exists, not implemented)
3. **Planned:** RSS feeds from football sites (not implemented)

### Briefing Schedule

- **9am:** Morning briefing - overnight transfer chaos
- **2pm:** Afternoon update - European lunch revelations  
- **9pm:** Evening roundup - day's complete madness

---

## Critical Decisions Needed

### 1. Complete the Pivot or Embrace Briefings?

**Option A: Complete Live Feed Transition**
- Connect `LiveFeedContainer` to homepage
- Enable real-time SSE updates
- Switch to hourly micro-updates
- Match original pivot vision

**Option B: Enhance Briefing System**
- Keep magazine-style format
- Add more frequent briefings
- Improve content depth
- Abandon live feed code

### 2. Fix the Dual System Confusion

- Two briefing generation systems exist
- 6 legacy scripts use old system (broken)
- Need to consolidate to one approach

### 3. Implement Missing Features

**Currently Missing:**
- Email delivery system (structure only)
- RSS feed parsing (planned, not built)
- Partner content integration
- Monetization (AdSense planned)

---

## User Journey (Current)

1. User discovers Transfer Juice via social/search
2. Lands on homepage showing latest briefings
3. Scrolls through Terry's commentary on transfers
4. Filters by favorite club/player tags
5. Returns 3x daily for new briefings
6. (Email subscription exists but doesn't send)

---

## Success Metrics

### Currently Measurable

- **Content Generation:** 3 briefings generated daily
- **Source Coverage:** 52 global sources monitored
- **System Reliability:** Automated pipeline working
- **Code Quality:** 0 lint errors, comprehensive tests

### Not Yet Measurable

- Email engagement (no delivery system)
- Real-time engagement (feed not active)
- User retention (no analytics)
- Revenue (no monetization)

---

## Development Priorities

### Immediate (Fix Current System)

1. **Choose architecture direction** (live feed vs briefings)
2. **Fix broken legacy scripts** using new system
3. **Document hidden features** for developers
4. **Implement email delivery** or remove from UI

### Short-term (Complete Vision)

1. **If Live Feed:** Connect `LiveFeedContainer` to homepage
2. **If Briefings:** Remove live feed code, enhance briefings
3. **Add missing integrations** (email, RSS, partners)
4. **Implement analytics** to measure success

### Long-term (Scale)

1. **Monetization** via AdSense/sponsorships
2. **Mobile optimization** or PWA
3. **Additional languages** for global audience
4. **API for third-party access**

---

## Risk Assessment

### Technical Debt

- **Dual systems** creating confusion
- **Hidden infrastructure** not being used
- **Broken scripts** referencing old system
- **Incomplete integrations** (email, RSS)

### Operational Risks

- **Twitter API limits** (15 requests/15 min on free tier)
- **No backup** if Twitter access fails
- **Manual intervention** needed for some tasks
- **No monitoring** of system health

### Mitigation Required

1. **Consolidate to single architecture**
2. **Implement Twitter scraping fallbacks**
3. **Add system monitoring and alerts**
4. **Complete missing integrations**

---

## Conclusion

Transfer Juice is a working briefing platform with hidden live feed capabilities. The system successfully generates AI-powered transfer briefings with Terry's commentary but hasn't achieved the real-time vision described in planning documents.

**The Terry's verdict:** "Classic case of building two things when you needed one. Like signing two strikers and playing them both as defensive midfielders. Pick a system and commit, lads."

---

*This PRD reflects the actual state of Transfer Juice as of June 2025. For the aspirational vision, see PIVOT_DOCUMENT.md. For migration guidance, see MIGRATION_GUIDE.md.*