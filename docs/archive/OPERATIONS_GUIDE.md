# Transfer Juice Operations Guide

## Overview

This guide documents the exact processes and scripts used to run Transfer Juice in production. Follow these procedures exactly - no custom scripts or workarounds.

---

## Production Scripts & Endpoints

### 1. Hourly Feed Monitoring (Primary System)

**Endpoint**: `/api/cron/hourly`  
**Method**: `POST`  
**Purpose**: Monitors ITK Twitter accounts and generates live feed updates every hour

```bash
# Manually trigger hourly monitoring
curl -X POST http://localhost:4433/api/cron/hourly \
  -H "Authorization: Bearer ${CRON_SECRET}"

# Production URL (called by Vercel Cron)
curl -X POST https://transferjuice.com/api/cron/hourly \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**What it does:**

1. Checks all configured ITK Twitter accounts for new tweets
2. Generates Terry-style commentary on transfer news
3. Searches for relevant player images
4. Mixes in partner content during quiet periods
5. Broadcasts updates to live feed via WebSocket

**Schedule**: Every hour via Vercel Cron

### 2. Briefing Generation (Legacy System)

**Endpoint**: `/api/briefings/generate`  
**Method**: `POST`  
**Purpose**: Generates hourly briefings from collected feed items

```bash
# Generate a briefing for the current hour
curl -X POST http://localhost:4433/api/briefings/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${BRIEFING_GENERATION_API_KEY}" \
  -d '{"force": false, "testMode": false}'

# Force regenerate (overwrite existing)
curl -X POST http://localhost:4433/api/briefings/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${BRIEFING_GENERATION_API_KEY}" \
  -d '{"force": true, "testMode": false}'
```

**What it does:**

1. Syncs global ITK sources to database
2. Fetches tweets from the last hour
3. Generates Terry content using OpenAI
4. Creates polaroid timeline visuals
5. Mixes in partner content
6. Saves briefing to database

**Note**: This is the legacy briefing system. The live feed (/api/cron/hourly) is the primary system.

---

## Database Commands

### Essential Database Operations

```bash
# Generate Prisma client (after schema changes)
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Create and apply migrations (production)
npx prisma migrate dev --name description_of_change
npx prisma migrate deploy

# Open Prisma Studio (GUI for database)
npx prisma studio

# Reset database with seed data (CAUTION: deletes all data)
npx prisma migrate reset
```

### Database Seeding

```bash
# Run seed script
npx prisma db seed

# What the seed script does:
# 1. Creates ITK Twitter sources (Fabrizio Romano, etc.)
# 2. Adds initial tags for clubs and players
# 3. Creates sample feed items for testing
# 4. Sets up email subscriber test accounts
```

---

## Development Workflow

### Starting Development Server

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
# Server runs on http://localhost:4433
```

### Testing Endpoints Locally

```bash
# Test hourly monitor
npm run test:hourly

# Test briefing generation
npm run test:briefing

# Run all tests
npm test

# Run E2E tests
npm run test:e2e
```

---

## Production Deployment

### Vercel Deployment

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# Check deployment status
vercel ls
```

### Environment Variables (Production)

All production environment variables must be set in Vercel:

```
DATABASE_URL            # Neon PostgreSQL connection string
TWITTER_BEARER_TOKEN    # Twitter API v2 bearer token
OPENAI_API_KEY         # OpenAI API key for Terry content
CRON_SECRET            # Secret for cron job authentication
BRIEFING_GENERATION_API_KEY  # API key for briefing generation
```

### Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/hourly",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## Monitoring & Debugging

### Check System Health

```bash
# Health check endpoint
curl https://transferjuice.com/api/health

# Check recent briefings
curl https://transferjuice.com/api/briefings/archive

# Monitor feed items
curl https://transferjuice.com/api/feed
```

### View Logs

```bash
# Vercel logs (production)
vercel logs --follow

# Local development logs
# Check terminal running npm run dev
```

### Common Issues & Solutions

**Issue**: Twitter rate limits hit

```bash
# Solution: Wait 15 minutes, rates reset
# Check rate limit status in logs
```

**Issue**: Briefing generation fails

```bash
# Check OpenAI API key is valid
# Verify DATABASE_URL is correct
# Check for sufficient feed items
```

**Issue**: No new tweets found

```bash
# Verify Twitter bearer token is valid
# Check ITK sources are active
# May be quiet period - system will use partner content
```

---

## DO NOT CREATE CUSTOM SCRIPTS

**Important**: Always use the documented endpoints and commands above. Do not create custom scripts in the `/scripts` directory unless explicitly updating this operations guide.

**Approved Scripts Only**:

- `/api/cron/hourly` - Hourly feed monitoring
- `/api/briefings/generate` - Briefing generation
- Database commands via Prisma CLI
- Deployment via Vercel CLI

---

## Emergency Procedures

### System Down

1. Check Vercel status page
2. Verify database connectivity
3. Check API keys are valid
4. Review recent deployments
5. Rollback if necessary: `vercel rollback`

### Database Issues

```bash
# Emergency database reset (CAUTION)
npx prisma migrate reset --force

# Restore from backup
psql $DATABASE_URL < backup.sql
```

### API Key Rotation

1. Generate new key from provider
2. Update in Vercel environment variables
3. Redeploy: `vercel --prod`
4. Verify endpoints are working

---

## Contact & Escalation

- **Technical Issues**: Check logs first, then deployment history
- **API Limits**: Wait for reset, check provider dashboards
- **Database**: Use Prisma Studio for investigation
- **Deployment**: Use Vercel dashboard for rollbacks

Remember: This is a live feed system. The hourly cron job is the heartbeat of the application.
