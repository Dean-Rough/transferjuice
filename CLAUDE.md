# CLAUDE.md - COMPREHENSIVE REALITY CHECK v2.0

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

⚠️ **UPDATED: June 2025 - Complete documentation rebuild completed**

---

## Project Status Summary

Transfer Juice is a **football transfer briefing platform** that has been caught in transition between two visions:

1. **CURRENT REALITY**: Magazine-style briefings published 3x daily (9am, 2pm, 9pm)
2. **HIDDEN CAPABILITY**: Complete live feed infrastructure ready but not connected
3. **ORIGINAL VISION**: Real-time transfer feed like Sky Sports Transfer Centre

**Critical Decision Needed**: Complete the pivot to live feed OR fully commit to briefings. See MIGRATION_GUIDE.md for instructions.

---

## Quick Navigation for Developers

- **Current Architecture**: See `CURRENT_ARCHITECTURE.md` for dual-system details
- **Hidden Features**: See `HIDDEN_FEATURES.md` for built but unused capabilities
- **Migration Guide**: See `MIGRATION_GUIDE.md` to activate live feed
- **API Reference**: See `API_SPECIFICATION.md` for actual endpoints (20 total)
- **Product Vision**: See `PRD.md` for current reality vs `PIVOT_DOCUMENT.md` for intended vision

---

## What Actually Works

### ✅ **PRODUCTION-READY FEATURES**

1. **Briefing Generation System**

   - Location: `src/briefing-generator/orchestrator.ts` (NEW system)
   - 9-step orchestration pipeline
   - Generates at 9am, 2pm, 9pm daily
   - Terry AI commentary fully integrated

2. **Global ITK Monitoring**

   - 52 sources across 7 regions (UK, IT, DE, FR, ES, BR, GLOBAL)
   - Hourly data collection via cron
   - Twitter API with Apify/Playwright fallbacks

3. **Terry AI Integration**

   - OpenAI GPT-4 for Joel Golby style commentary
   - Quality validation and consistency checks
   - Integrated into briefing pipeline

4. **Web Interface**

   - Homepage with magazine-style briefings
   - 70/30 layout with sidebar
   - Tag and league filtering
   - Continuous scroll through briefings

5. **Database & Storage**
   - PostgreSQL with Prisma ORM
   - Complete schema for briefings and feed items
   - Over-engineered but stable

---

## Hidden But Complete Features

### 🔄 **BUILT BUT NOT CONNECTED**

1. **Live Feed System** (Primary Hidden Asset)

   - `LiveFeedContainer.tsx` - 508 lines of complete implementation
   - Real-time SSE updates ready
   - Infinite scroll with virtualization
   - Tag-based filtering
   - Just needs to be connected to homepage

2. **Real-time Infrastructure**

   - SSE broadcasting system (`RealTimeBroadcaster`)
   - `/api/live-feed` endpoint working
   - Heartbeat mechanism implemented
   - No frontend connections

3. **Performance Features**
   - Memory optimization hooks
   - Virtual scrolling
   - Smart caching in feed store
   - All built but inactive

**See `HIDDEN_FEATURES.md` for complete list**

---

## What Doesn't Exist

### ❌ **NOT IMPLEMENTED**

1. **Email Delivery**

   - Config variables exist
   - Database schema ready
   - NO sending implementation
   - Signup forms don't work

2. **Content Partnerships**

   - Data structures exist
   - NO RSS parsing
   - NO partner integration
   - Manual content only

3. **WebSocket Support**

   - Docs claim WebSocket
   - Reality is SSE only
   - Mock WebSocket hook

4. **Monetization**
   - No AdSense integration
   - No payment processing
   - No premium features

---

## Critical Architecture Issues

### ⚠️ **DUAL SYSTEM CONFLICT**

The codebase has TWO parallel architectures:

```
ACTIVE SYSTEM (Briefings)          HIDDEN SYSTEM (Live Feed)
├── ContinuousFeed.tsx            ├── LiveFeedContainer.tsx
├── BriefingCard.tsx              ├── FeedItem.tsx
├── Magazine layout               ├── Real-time updates
└── 3x daily updates              └── Infinite scroll
```

### ⚠️ **BROKEN LEGACY SCRIPTS**

**DON'T USE THESE** (they reference old briefing system):

- `scripts/generate-test-briefing.ts`
- `scripts/test-briefing-generation.ts`
- `scripts/generate-production-briefing.ts`
- `scripts/create-briefing-from-fresh-data.ts`
- `scripts/test-enhanced-briefing.ts`
- `scripts/test-briefing-mock.ts`

**USE THESE INSTEAD**:

- `npm run briefing:generate`
- `npm run briefing:test`

---

## API Reality Check

**20 actual endpoints** vs 2-3 previously documented:

```
/api/briefings/*        # Briefing management
/api/feed              # Feed data (supports live feed)
/api/live-feed         # SSE streaming (built, not used)
/api/cron/hourly       # Monitoring trigger
/api/tags              # Tag system
/api/breaking-news     # Terry's ticker
/api/health/pipeline   # System health
```

**See `API_SPECIFICATION.md` for complete documentation**

---

## Development Commands

### Working Commands

```bash
# Development
npm run dev              # Start on port 4433
npm run build           # Production build
npm run lint            # Lint (0 errors!)
npm run type-check      # TypeScript checks

# Briefing Operations
npm run briefing:generate    # Generate new briefing
npm run briefing:test       # Test generation

# Database
npx prisma studio          # Database GUI
npx prisma db push        # Update schema
npx prisma generate       # Generate client
```

### Environment Setup

```env
# Required
DATABASE_URL=           # PostgreSQL connection
OPENAI_API_KEY=        # For Terry commentary
X_BEARER_TOKEN=        # Twitter API (optional)

# Optional
USE_REAL_TWITTER_API=true  # Enable real Twitter
ENABLE_LIVE_FEED=false     # Not yet connected
```

---

## Decision Tree for Developers

### If You Want Live Feed:

1. Read `MIGRATION_GUIDE.md`
2. Connect `LiveFeedContainer` to homepage
3. Enable real-time monitoring
4. 2-3 days effort

### If You Want Better Briefings:

1. Keep current system
2. Delete live feed code
3. Enhance briefing frequency
4. Add email delivery

### If You Want Both:

1. Add toggle for users
2. Maintain dual systems
3. Higher complexity
4. Consider carefully

---

## Code Quality Status

- **Lint Errors**: 0 ✅
- **TypeScript**: Strict mode ✅
- **Test Coverage**: Comprehensive infrastructure ✅
- **Documentation**: Now reality-based ✅
- **Architecture**: Confused but functional ⚠️

---

## Session Handover

### Documentation Rebuild Complete (June 2025)

**What Was Done**:

1. ✅ Created reality-based PRD.md
2. ✅ Documented dual architecture in CURRENT_ARCHITECTURE.md
3. ✅ Created step-by-step MIGRATION_GUIDE.md
4. ✅ Documented all 20 actual API endpoints
5. ✅ Cataloged hidden features in HIDDEN_FEATURES.md
6. ✅ Updated this CLAUDE.md with comprehensive reality check

**Next Steps**:

1. **DECIDE**: Live feed vs briefings vs both
2. **EXECUTE**: Follow MIGRATION_GUIDE.md if choosing live feed
3. **CLEAN UP**: Remove unused system after decision
4. **IMPLEMENT**: Missing features (email, RSS, etc.)

**Key Insight**: The live feed vision from PIVOT_DOCUMENT.md is 90% built - it just needs to be connected to the UI.

---

## Summary for AI Assistants

When working on TransferJuice:

1. **Check Reality First**: This codebase has significant gaps between documentation and implementation
2. **Two Systems Exist**: Briefings (active) and Live Feed (hidden but complete)
3. **Use New Scripts**: Avoid the 6 broken legacy scripts
4. **SSE Not WebSocket**: Real-time uses Server-Sent Events
5. **Email Doesn't Work**: Signup forms are decorative
6. **Hidden Gold**: LiveFeedContainer.tsx could transform the entire product

**The Terry's Final Word**: "Documentation's been more fictional than a transfer deadline day Sky Sports exclusive. But at least now we know what's real and what's just Jim White in a yellow tie shouting about medical reports."

---

_Updated June 2025 - Complete reality audit and documentation rebuild completed_
_Previous versions contained significant aspirational content - this version reflects actual implementation_
