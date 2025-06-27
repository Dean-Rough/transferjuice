# Transfer Juice Production Process

## Overview

Transfer Juice is a football transfer briefing platform that generates magazine-style briefings 3 times daily (9am, 2pm, 9pm) with real-time monitoring of global ITK sources.

## Production Scripts

### Active Scripts (in `/scripts/`)

1. **`run-briefing-generator.ts`** - Main briefing generation script
   - Usage: `npm run briefing:generate`
   - Options: `--test` for test mode, `--timestamp=YYYY-MM-DD HH:MM` for specific time

2. **`hourly-itk-monitor.ts`** - Monitors 52 global ITK sources
   - Usage: `npx tsx scripts/hourly-itk-monitor.ts`
   - Run via cron every hour

3. **`seed-database.ts`** - Initialize database with sources
   - Usage: `npx tsx scripts/seed-database.ts`

4. **`clear-briefings.ts`** - Clean up old briefings
   - Usage: `npx tsx scripts/clear-briefings.ts`

5. **`clean-and-regenerate.sh`** - Full system reset
   - Usage: `./scripts/clean-and-regenerate.sh`

### NPM Scripts

```bash
# Development
npm run dev                    # Start dev server on port 4433

# Briefing Operations
npm run briefing:generate      # Generate production briefing
npm run briefing:test         # Generate test briefing

# Testing
npm run test                  # Run unit tests
npm run test:e2e             # Run Playwright tests
npm run lint                 # Check linting
npm run type-check           # TypeScript validation
```

## Content Pipeline

### 1. Data Collection (Hourly)
- **Script**: `hourly-itk-monitor.ts`
- **Sources**: 52 ITK accounts across 7 regions
- **Methods**: 
  - Twitter API (if available)
  - Apify scraping (fallback)
  - Playwright (last resort)

### 2. RSS Feed Integration
- **Partner sources**: ESPN, Sky Sports, BBC Sport, The Athletic
- **Integration**: Automatic during briefing generation
- **Mixing**: Smart content mixing for quiet periods

### 3. Briefing Generation (3x Daily)
- **Script**: `run-briefing-generator.ts`
- **Schedule**: 9am, 2pm, 9pm
- **Steps**:
  1. Collect recent feed items
  2. Cluster into stories
  3. Generate Terry commentary
  4. Enhance with media (images, tweets)
  5. Create visual timeline
  6. Publish to database

### 4. Media Enhancement
- **Wikimedia API**: Player images and club badges
- **YouTube**: Curated shithousery videos
- **Twitter Embeds**: Real tweets from sources
- **Fallbacks**: SVG placeholders when APIs fail

## Environment Variables

Required in `.env.local`:
```env
# Database
DATABASE_URL=postgresql://...

# AI
OPENAI_API_KEY=sk-...

# Twitter (optional)
X_BEARER_TOKEN=...
USE_REAL_TWITTER_API=true

# Monitoring
ENABLE_MONITORING=true
```

## Production Deployment

### Daily Operations

1. **Hourly Monitoring** (Every hour)
   ```bash
   npx tsx scripts/hourly-itk-monitor.ts
   ```

2. **Briefing Generation** (9am, 2pm, 9pm)
   ```bash
   npm run briefing:generate
   ```

3. **Cleanup** (Daily at 3am)
   ```bash
   npx tsx scripts/clear-briefings.ts --keep-days=7
   ```

### Automation Options

#### 1. Local/VPS Cron (Recommended for self-hosting)
```bash
# Run the setup script
./scripts/setup-cron.sh
```

#### 2. Vercel Cron (Recommended for Vercel deployment)
- `vercel.json` is configured with cron schedules
- Set `CRON_SECRET` environment variable
- Endpoints: `/api/cron/monitoring`, `/api/cron/briefing`, `/api/cron/cleanup`

#### 3. External Webhook Cron Services
- EasyCron, Render Cron, Railway Cron
- Point to: `https://yourdomain.com/api/cron/[endpoint]`
- Add `Authorization: Bearer YOUR_CRON_SECRET` header

#### 4. GitHub Actions (Free option)
- See `docs/AUTOMATED_SCHEDULING.md` for full setup

## Monitoring & Debugging

### Health Checks
- `/api/health/pipeline` - Pipeline status
- `/api/monitoring/dashboard` - Real-time metrics

### Logs
- Development: Console output
- Production: Check deployment platform logs

### Common Issues

1. **No Twitter Data**
   - Check session validity
   - Fallback to Apify scraping
   - Last resort: Playwright

2. **Missing Images**
   - Wikimedia API failures → SVG placeholders
   - Check API rate limits

3. **Empty Briefings**
   - Verify ITK monitoring is running
   - Check RSS feed connectivity
   - Review OpenAI API status

## Quality Assurance

### Pre-Production Checklist
- [ ] Run `npm run lint`
- [ ] Run `npm run type-check`
- [ ] Run `npm run test`
- [ ] Test briefing generation locally
- [ ] Verify all media sources work

### Post-Deployment Verification
- [ ] Check latest briefing renders correctly
- [ ] Verify Terry commentary is generated
- [ ] Test image loading
- [ ] Confirm RSS mixing works
- [ ] Check performance metrics

## Archive Structure

All non-production scripts have been archived in `/scripts/archive/`:
- `demos/` - Demo and example scripts
- `testing/` - Test scripts
- `twitter-scrapers/` - Legacy Twitter scrapers
- `old-briefing-generators/` - Previous briefing systems
- `utilities/` - Debugging and utility scripts

## Future Enhancements

1. **Email Delivery** - Currently not implemented
2. **Live Feed** - Built but not connected (see `MIGRATION_GUIDE.md`)
3. **Monetization** - Ad integration pending
4. **Advanced Analytics** - User engagement tracking

---

*Last Updated: December 2024*
*Version: 2.0 - Post RSS Integration*