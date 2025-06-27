# Automated Scheduling for Transfer Juice

## Overview

Transfer Juice needs to run two main scripts automatically:
1. **ITK Monitoring** - Every hour
2. **Briefing Generation** - 3 times daily (9am, 2pm, 9pm)

## Option 1: Cron Jobs (Linux/Mac)

### Setup on Local Mac/Linux

```bash
# Open crontab editor
crontab -e

# Add these lines:
# ITK Monitoring - Every hour
0 * * * * cd /path/to/transferjuice && /usr/local/bin/npx tsx scripts/hourly-itk-monitor.ts >> /tmp/transferjuice-monitor.log 2>&1

# Briefing Generation - 9am, 2pm, 9pm
0 9,14,21 * * * cd /path/to/transferjuice && /usr/local/bin/npm run briefing:generate >> /tmp/transferjuice-briefing.log 2>&1

# Daily cleanup at 3am
0 3 * * * cd /path/to/transferjuice && /usr/local/bin/npx tsx scripts/clear-briefings.ts --keep-days=7 >> /tmp/transferjuice-cleanup.log 2>&1
```

### Verify Cron is Working

```bash
# List current cron jobs
crontab -l

# Check logs
tail -f /tmp/transferjuice-monitor.log
tail -f /tmp/transferjuice-briefing.log
```

## Option 2: Vercel Cron Jobs (Production)

### vercel.json Configuration

```json
{
  "crons": [
    {
      "path": "/api/cron/hourly",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/briefing",
      "schedule": "0 9,14,21 * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 3 * * *"
    }
  ]
}
```

### API Routes for Vercel

Create these API routes:

#### /api/cron/hourly/route.ts
```typescript
import { NextResponse } from 'next/server';
import { monitorITKSources } from '@/lib/twitter/itk-monitor';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await monitorITKSources();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Hourly cron failed:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

## Option 3: GitHub Actions (Free Alternative)

### .github/workflows/scheduled-tasks.yml

```yaml
name: Scheduled Tasks

on:
  schedule:
    # ITK Monitoring - Every hour
    - cron: '0 * * * *'
    # Briefing Generation - 9am, 2pm, 9pm UTC
    - cron: '0 9,14,21 * * *'
    # Cleanup - 3am UTC
    - cron: '0 3 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  run-scheduled-task:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run ITK Monitoring
      if: github.event.schedule == '0 * * * *'
      run: npx tsx scripts/hourly-itk-monitor.ts
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
        X_BEARER_TOKEN: ${{ secrets.X_BEARER_TOKEN }}
        
    - name: Run Briefing Generation
      if: github.event.schedule == '0 9,14,21 * * *'
      run: npm run briefing:generate
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        
    - name: Run Cleanup
      if: github.event.schedule == '0 3 * * *'
      run: npx tsx scripts/clear-briefings.ts --keep-days=7
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Option 4: External Cron Services

### Using Render.com Cron Jobs

1. Create a Render account
2. Add a new "Cron Job" service
3. Configure:
   - **Command**: `npm run briefing:generate`
   - **Schedule**: `0 9,14,21 * * *`
   - **Environment**: Add all required env vars

### Using Railway.app Cron

```toml
# railway.toml
[deploy]
cronSchedule = "0 * * * *"
startCommand = "npx tsx scripts/hourly-itk-monitor.ts"
```

### Using Easycron.com (Free Tier)

1. Sign up at easycron.com
2. Add cron job:
   - URL: `https://yourdomain.com/api/cron/hourly`
   - Schedule: Every hour
   - Method: GET
   - Add auth header

## Option 5: Process Manager (PM2)

### pm2-cron.json

```json
{
  "apps": [
    {
      "name": "transferjuice-web",
      "script": "npm",
      "args": "start",
      "env": {
        "NODE_ENV": "production"
      }
    },
    {
      "name": "itk-monitor",
      "script": "./scripts/hourly-itk-monitor.ts",
      "interpreter": "tsx",
      "cron_restart": "0 * * * *",
      "autorestart": false
    },
    {
      "name": "briefing-generator",
      "script": "./scripts/run-briefing-generator.ts",
      "interpreter": "tsx",
      "cron_restart": "0 9,14,21 * * *",
      "autorestart": false
    }
  ]
}
```

Run with:
```bash
pm2 start pm2-cron.json
pm2 save
pm2 startup
```

## Testing Cron Patterns

Use [crontab.guru](https://crontab.guru) to verify your cron expressions:
- `0 * * * *` = Every hour at minute 0
- `0 9,14,21 * * *` = At 9:00 AM, 2:00 PM, and 9:00 PM
- `0 3 * * *` = At 3:00 AM every day

## Monitoring & Alerts

### Add Health Checks

```typescript
// /api/health/cron/route.ts
export async function GET() {
  const lastRun = await getLastCronRun();
  const isHealthy = Date.now() - lastRun < 3600000; // 1 hour
  
  return NextResponse.json({
    healthy: isHealthy,
    lastRun: new Date(lastRun).toISOString()
  });
}
```

### Use UptimeRobot or BetterUptime

1. Monitor `/api/health/cron`
2. Alert if unhealthy
3. Check every 30 minutes

## Recommended Setup

For production, I recommend:

1. **Vercel/Netlify**: Use built-in cron if deploying there
2. **VPS/Dedicated**: Use system cron + PM2 for reliability
3. **Budget**: GitHub Actions (free 2000 minutes/month)
4. **Enterprise**: Kubernetes CronJob or AWS EventBridge

## Quick Start (Local Development)

```bash
# 1. Create a simple test cron (runs every minute)
crontab -e

# Add this line:
* * * * * cd /Users/yourusername/Documents/TransferJuice && echo "Cron test at $(date)" >> /tmp/tj-cron-test.log

# 2. Verify it's working
tail -f /tmp/tj-cron-test.log

# 3. Replace with production crons once confirmed
```

---

*Remember to set appropriate timezone in your cron configuration to match your target audience!*