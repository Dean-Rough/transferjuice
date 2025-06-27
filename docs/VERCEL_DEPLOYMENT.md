# Transfer Juice - Vercel Deployment Guide

## Overview

This guide documents the process of deploying Transfer Juice to Vercel, including environment configuration, cron job setup, and production verification.

## Deployment Status

**Production URL**: https://transferjuice-dean-roughs-projects.vercel.app

**Latest Deployment**: Successfully deployed on June 27, 2025

## Prerequisites

1. Vercel CLI installed: `npm install -g vercel`
2. Vercel account created at [vercel.com](https://vercel.com)
3. Environment variables ready (see below)
4. Clean git working directory

## Step 1: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate with your Vercel account.

## Step 2: Required Environment Variables

### Core Required Variables

```bash
# Database (required)
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# AI Services (required) 
OPENAI_API_KEY="sk-proj-..."

# Security (required)
CRON_SECRET="your-secure-random-string"
JWT_SECRET="your-secure-random-string"
ENCRYPTION_KEY="your-secure-random-string"
HEALTH_CHECK_TOKEN="your-secure-random-string"
```

### Twitter Integration Variables

```bash
# Twitter API (required for full functionality)
TWITTER_BEARER_TOKEN="AAAA..."
TWITTER_API_KEY="..."
TWITTER_API_SECRET="..."
TWITTER_ACCESS_TOKEN="..."
TWITTER_ACCESS_TOKEN_SECRET="..."

# Twitter Scraper (optional)
TWITTER_SCRAPER_USERNAME="..."
TWITTER_SCRAPER_PASSWORD="..."
USE_HYBRID_TWITTER="true"
```

### Scraping Services

```bash
# Apify (required for fallback scraping)
APIFY_API_TOKEN="apify_api_..."
```

## Step 3: Set Environment Variables

### Option A: Automated Setup Script (Recommended)

```bash
# Navigate to your project
cd /path/to/transferjuice

# Run the automated setup script
./scripts/setup-vercel-env.sh
```

This script will:
- Configure all required environment variables
- Generate secure tokens for CRON_SECRET, JWT_SECRET, etc.
- Validate the configuration

### Option B: Manual CLI Setup

```bash
# Set each variable individually
vercel env add DATABASE_URL production
vercel env add OPENAI_API_KEY production
vercel env add CRON_SECRET production
vercel env add JWT_SECRET production
vercel env add ENCRYPTION_KEY production
vercel env add HEALTH_CHECK_TOKEN production
vercel env add TWITTER_BEARER_TOKEN production
vercel env add APIFY_API_TOKEN production
```

### Option C: Via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable manually

### Generating Secure Tokens

```bash
# Generate secure random strings for tokens
openssl rand -base64 32
```

## Step 4: Configure Build Settings

Ensure your `package.json` has the correct build script:

```json
{
  "scripts": {
    "build": "prisma generate && next build"
  }
}
```

This ensures Prisma client is generated during the build process on Vercel.

## Step 5: Deploy

```bash
# Link to existing project (if not already linked)
vercel link

# Deploy to production
vercel --prod
```

Expected output:
```
🔍 Inspect: https://vercel.com/[team]/transferjuice/[deployment-id]
✅ Production: https://transferjuice-[id].vercel.app [3m]
```

## Step 6: Verify Deployment

### Check the Application
1. Visit your Vercel URL (provided after deployment)
2. Verify the homepage loads
3. Check that briefings are displayed

### Test Public Health Endpoint

```bash
curl https://your-app.vercel.app/api/health/pipeline
```

Expected response:
```json
{
  "timestamp": "2025-06-27T19:32:54.602Z",
  "status": "healthy",
  "overallScore": 100,
  "pipeline": { ... }
}
```

### Note on Cron Endpoints

Cron endpoints are protected by Vercel authentication and will show an authentication page when accessed directly. This is expected behavior. Vercel handles the authentication internally when executing scheduled cron jobs.

## Step 7: Verify Cron Jobs

1. Go to Vercel Dashboard → Your Project → Functions
2. Check that cron functions are listed
3. Monitor logs for automatic executions

### Configured Cron Jobs

The following cron jobs are configured in `vercel.json`:

1. **ITK Monitoring** (`/api/cron/monitoring`)
   - Schedule: Every hour (0 * * * *)
   - Function: Monitors ITK Twitter sources

2. **Briefing Generation** (`/api/cron/briefing`)
   - Schedule: 9am, 2pm, 9pm daily (0 9,14,21 * * *)
   - Function: Generates Terry-style briefings

3. **Cleanup** (`/api/cron/cleanup`)
   - Schedule: 3am daily (0 3 * * *)
   - Function: Database maintenance

## Database Setup for Production

### Option A: Vercel PostgreSQL (Recommended)

```bash
# Add Vercel PostgreSQL
vercel postgres create

# Link to your project
vercel postgres connect
```

### Option B: External Database (Neon, Supabase, etc.)

```bash
# Create database on your provider
# Update DATABASE_URL in Vercel environment variables
vercel env add DATABASE_URL production
```

### Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Push schema to production database
npx prisma db push

# Seed initial data
npx tsx scripts/seed-database.ts
```

## Custom Domain (Optional)

```bash
# Add custom domain
vercel domains add yourdomain.com

# Update environment variable
vercel env add NEXT_PUBLIC_APP_URL production
# Set to: https://yourdomain.com
```

## Monitoring & Logs

### View Deployment Logs
```bash
vercel logs
```

### Monitor Cron Jobs
1. Vercel Dashboard → Your Project → Functions
2. Click on any cron function to see logs
3. Monitor for errors or failures

### Health Check
```bash
curl https://your-app.vercel.app/api/health
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Fails
```bash
# Check DATABASE_URL format
postgresql://username:password@host:port/database?sslmode=require

# Test connection locally
npx prisma db execute --stdin <<< "SELECT 1;"
```

#### 2. TypeScript Build Errors
- Ensure all TypeScript types are properly aligned
- Run `npm run type-check` locally before deployment
- Common issues: interface mismatches, missing properties

#### 3. Missing Prisma Client
```bash
# Ensure build script includes prisma generate
"build": "prisma generate && next build"
```

#### 4. Cron Jobs Not Running
- Verify `vercel.json` is in project root
- Check all security tokens are set (CRON_SECRET, JWT_SECRET, etc.)
- Ensure function timeout is sufficient (600s)
- Note: Cron endpoints will show authentication page when accessed directly

#### 5. Build Fails
```bash
# Check build locally
npm run build

# Clear Vercel cache
vercel --force
```

#### 6. Environment Variables Not Loading
```bash
# List all environment variables
vercel env ls

# Pull environment variables locally for testing
vercel env pull .env.local
```

## Production Checklist

- [ ] All environment variables set
- [ ] Database connected and migrations run
- [ ] Initial data seeded
- [ ] Homepage loads correctly
- [ ] Cron endpoints respond with 200
- [ ] First briefing generated successfully
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring/alerts set up

## Deployment Commands Quick Reference

```bash
# Initial setup
vercel login
vercel                    # First deployment
vercel env add VAR_NAME   # Add environment variable

# Regular deployment
vercel --prod             # Deploy to production

# Management
vercel logs              # View logs
vercel env ls            # List environment variables
vercel domains ls        # List domains
vercel --force           # Force rebuild (clears cache)
```

## Next Steps After Deployment

1. **Monitor First Week**: Check cron logs daily
2. **Set Up Alerts**: Use Vercel's monitoring or external services
3. **Backup Strategy**: Database backups for production data
4. **Performance**: Monitor function execution times
5. **Scale**: Consider upgrading Vercel plan if needed

## Security Considerations

1. **Authentication**: All sensitive endpoints require authentication
2. **CRON_SECRET**: Automatically handled by Vercel for scheduled jobs
3. **Environment Variables**: Encrypted at rest in Vercel
4. **Public Endpoints**: Have rate limiting applied

## Rollback Procedure

If issues arise after deployment:

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

---

*Last updated: June 27, 2025*

*Your Transfer Juice application will now run automatically with cron jobs handling ITK monitoring, briefing generation, and cleanup!*