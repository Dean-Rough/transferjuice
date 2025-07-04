# Transfer Juice Production Pipeline

## Overview

Transfer Juice uses a **2-hour aggregation pipeline** to generate magazine-style briefings from ITK (In The Know) Twitter sources.

**THE Production Script**: `run-briefing-generator.ts`

## Pipeline Flow

```
1. ITK Twitter Monitoring (Every Hour)
   ↓
2. Tweet Aggregation (2 hours of data)
   ↓
3. Briefing Generation (Terry AI Commentary)
   ↓
4. Homepage Display (ContinuousFeed)
```

## Production Setup

### Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# AI - Required for Terry commentary
OPENAI_API_KEY=sk-...

# Twitter Scraping (Optional - falls back to Playwright)
X_BEARER_TOKEN=...
USE_REAL_TWITTER_API=true
```

### Cron Configuration

Add to crontab for 2-hour generation:

```bash
# Generate briefings every 2 hours
0 */2 * * * cd /path/to/transferjuice && npm run briefing:generate >> /var/log/transferjuice/briefing.log 2>&1
```

### Running Production Script

```bash
# Standard production run
npm run briefing:generate

# Test mode with mock data
npm run briefing:generate -- --test

# Specific timestamp
npm run briefing:generate -- --timestamp="2025-01-15T14:00:00Z"
```

## Exit Codes

- `0` = Success - Briefing generated and published
- `1` = Hard failure - Critical error, check logs
- `2` = Skipped - No new content or briefing already exists

## Monitoring

### Health Checks

```bash
# Check last briefing generation
curl http://localhost:4433/api/health/pipeline

# Check scraping health
curl http://localhost:4433/api/health/scraping
```

### Log Locations

- Briefing logs: `/var/log/transferjuice/briefing.log`
- Scraping logs: Check console output for metrics

## Troubleshooting

### No Tweets Found

1. Check Twitter credentials
2. Verify ITK sources are active
3. Check Playwright is working: `npx playwright test`

### Terry Commentary Fails

1. Verify `OPENAI_API_KEY` is set
2. Check OpenAI API limits
3. Enable debug mode in generator

### Duplicate Briefings

- The system prevents duplicates automatically
- Exit code 2 = already exists (not an error)

## Architecture Notes

### What's Active

- **Briefing System**: Magazine-style 3x daily briefings
- **Terry AI**: Joel Golby style commentary
- **Inline Images**: All images embedded in content
- **Playwright Scraping**: Fallback for Twitter

### What's Archived

All files in `/scripts/archive/` and `/src/components/archive/` are legacy:

- `briefing-pipeline-alternative.ts` - Alternative approach
- `generate-real-briefing-demo.ts` - Uses hardcoded data
- `generate-mock-briefing.ts` - Test script
- `LiveFeedContainer.tsx` - Unused real-time feed
- `live-feed` API - SSE endpoint not connected

### NO POLAROIDS

The system previously used a polaroid timeline feature. This has been completely removed:

- No `visualTimeline` in briefings
- No `PolaroidFrame` components
- All images are inline within content sections

## Common Commands

```bash
# Development
npm run dev                    # Start dev server

# Database
npx prisma studio             # View database
npx prisma db push           # Update schema

# Testing
npm run briefing:test         # Test generation with mock data

# Production
npm run briefing:generate     # Generate real briefing
```

## Support

For issues, check:

1. This README
2. Error logs with exit codes
3. `/docs/CLAUDE.md` for AI assistant context
4. Database for existing briefings

---

_Last updated: January 2025_
_Primary maintainer: The Terry_
