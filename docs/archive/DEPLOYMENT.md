# Transfer Juice Deployment Guide

## Overview

This guide provides comprehensive deployment instructions for Transfer Juice across development, staging, and production environments. The system uses modern DevOps practices with automated CI/CD pipelines and infrastructure as code.

---

## Environment Setup

### Prerequisites

- Node.js 18+ with npm
- Git with SSH keys configured
- Vercel CLI installed globally
- Database access (Neon PostgreSQL)
- Required API keys and environment variables

### Required Environment Variables

```bash
# Database
DATABASE_URL="postgresql://username:password@host:5432/transfer_juice"

# Twitter API v2
TWITTER_BEARER_TOKEN="your_bearer_token_here"
TWITTER_API_KEY="your_api_key_here"
TWITTER_API_SECRET="your_api_secret_here"

# AI Services
OPENAI_API_KEY="sk-your_openai_key_here"
ANTHROPIC_API_KEY="sk-ant-your_anthropic_key"

# Email Service (ConvertKit example)
CONVERTKIT_API_KEY="your_convertkit_api_key"
CONVERTKIT_API_SECRET="your_convertkit_secret"
CONVERTKIT_FORM_ID="your_form_id"

# Next.js Configuration
NEXTAUTH_SECRET="your_nextauth_secret_for_admin"
NEXTAUTH_URL="https://transferjuice.com"

# Monitoring and Analytics
SENTRY_DSN="your_sentry_dsn_for_error_tracking"
GOOGLE_ANALYTICS_ID="GA4_measurement_id"

# Webhook Security
WEBHOOK_SECRET="secure_random_string_for_webhooks"

# CDN and Storage
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
```

---

## Local Development Deployment

### Initial Setup

```bash
# Clone repository
git clone https://github.com/yourusername/transfer-juice.git
cd transfer-juice

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Setup database
npx prisma generate
npx prisma db push
npx prisma db seed

# Start development server
npm run dev
```

### Development Commands

```bash
# Start development server with hot reload
npm run dev

# Run all tests
npm run test
npm run test:e2e

# Code quality checks
npm run lint
npm run type-check
npm run format

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push       # Push schema changes
npm run db:migrate    # Create and run migrations
npm run db:reset      # Reset database with fresh seed data
npm run db:studio     # Open Prisma Studio

# Build and preview
npm run build
npm run start
```

### Development Troubleshooting

**Common Issues:**

1. **Database Connection Errors**

   ```bash
   # Check database connectivity
   npx prisma db push --preview-feature

   # Reset if corrupted
   npm run db:reset
   ```

2. **Environment Variable Issues**

   ```bash
   # Validate environment variables
   npm run validate-env

   # Check if all required vars are set
   node -e "console.log(process.env.DATABASE_URL ? 'DB OK' : 'DB MISSING')"
   ```

3. **TypeScript Errors**
   ```bash
   # Clear TypeScript cache
   rm -rf .next
   npm run type-check
   ```

---

## Staging Deployment

### Vercel Staging Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project to Vercel
vercel link

# Setup staging environment
vercel env add STAGING
# Add all environment variables for staging
```

### Staging Environment Configuration

**Branch Strategy:**

- `main` → Production deployment
- `staging` → Staging deployment
- `feature/*` → Preview deployments

**Automatic Staging Deployment:**

```yaml
# .github/workflows/staging.yml
name: Staging Deployment

on:
  push:
    branches: [staging]
  pull_request:
    branches: [main]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: |
          npm run test
          npm run test:e2e

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          scope: staging
```

### Staging Validation

**Automated Tests:**

```bash
# Run full test suite against staging
npm run test:staging

# E2E tests against staging URL
STAGING_URL=https://staging-transferjuice.vercel.app npm run test:e2e

# Performance testing
npm run test:lighthouse -- --url=https://staging-transferjuice.vercel.app
```

**Manual Validation Checklist:**

- [ ] Newsletter signup works and sends confirmation
- [ ] All briefing types (morning/afternoon/evening) display correctly
- [ ] Search functionality returns relevant results
- [ ] Dark mode renders properly across all pages
- [ ] Mobile responsive design works on various devices
- [ ] Email templates render correctly in major clients
- [ ] API endpoints respond within SLA requirements
- [ ] Error pages display appropriately

---

## Production Deployment

### Pre-Production Checklist

**Code Quality:**

- [ ] All tests passing (unit, integration, E2E)
- [ ] Code coverage >95%
- [ ] ESLint and Prettier checks pass
- [ ] TypeScript compilation successful
- [ ] Security audit passes (npm audit)

**Performance:**

- [ ] Lighthouse scores >90 for all categories
- [ ] Bundle size within limits (<1MB initial load)
- [ ] Database query performance optimized
- [ ] CDN configuration verified

**Security:**

- [ ] Environment variables secured
- [ ] API rate limiting configured
- [ ] CORS policies properly set
- [ ] Security headers implemented
- [ ] Dependency vulnerabilities resolved

### Production Deployment Process

**Automated Production Deployment:**

```yaml
# .github/workflows/production.yml
name: Production Deployment

on:
  push:
    branches: [main]
    paths-ignore:
      - "docs/**"
      - "*.md"

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Quality Gates
        run: |
          npm run lint
          npm run type-check
          npm run test
          npm run build

      - name: Security Checks
        run: |
          npm audit --audit-level=moderate
          npm run security-scan

      - name: Database Migration
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: "--prod"

      - name: Post-Deployment Validation
        run: npm run test:production
        env:
          PRODUCTION_URL: https://transferjuice.com

      - name: Notify Team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: "#deployments"
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Production Environment Variables

**Vercel Production Configuration:**

```bash
# Set production environment variables via Vercel CLI
vercel env add DATABASE_URL production
vercel env add TWITTER_BEARER_TOKEN production
vercel env add OPENAI_API_KEY production
# ... continue for all production variables

# Or use Vercel dashboard for GUI management
```

**Environment Security:**

- Production variables stored in Vercel's encrypted environment
- Separate API keys for production vs staging
- Database credentials rotated monthly
- Webhook secrets use cryptographically strong random values

---

## Database Deployment

### Migration Strategy

**Zero-Downtime Migrations:**

```bash
# Generate migration
npx prisma migrate dev --name add_analytics_table

# Deploy to production
npx prisma migrate deploy

# Rollback if needed
npx prisma migrate reset --force
```

**Database Backup Strategy:**

```bash
# Automated daily backups (configured in Neon)
# Manual backup before major deployments
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore if needed
psql $DATABASE_URL < backup_file.sql
```

### Data Seeding

**Production Data Setup:**

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create initial ITK accounts
  const itkAccounts = [
    { handle: "FabrizioRomano", name: "Fabrizio Romano", verified: true },
    { handle: "David_Ornstein", name: "David Ornstein", verified: true },
    // ... other accounts
  ];

  for (const account of itkAccounts) {
    await prisma.itkAccount.upsert({
      where: { handle: account.handle },
      update: {},
      create: account,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Monitoring and Alerting

### Production Monitoring Setup

**Health Check Endpoints:**

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Database connectivity check
    await prisma.$queryRaw`SELECT 1`;

    // External API checks
    const twitterCheck = await fetch(
      "https://api.twitter.com/2/tweets/sample/stream",
      {
        method: "HEAD",
        headers: {
          Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        },
      },
    );

    return Response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      checks: {
        database: "ok",
        twitter_api: twitterCheck.ok ? "ok" : "error",
      },
    });
  } catch (error) {
    return Response.json(
      { status: "unhealthy", error: error.message },
      { status: 500 },
    );
  }
}
```

**Vercel Analytics Integration:**

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

**Error Tracking with Sentry:**

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Filter out sensitive data
    if (event.exception) {
      const exception = event.exception.values?.[0];
      if (exception?.value?.includes("API_KEY")) {
        return null;
      }
    }
    return event;
  },
});
```

### Alert Configuration

**Critical Alerts (Immediate Response):**

- Site down (>5 minutes)
- Database connectivity issues
- Email delivery failures >50%
- API rate limit exceeded

**Warning Alerts (Within 1 Hour):**

- Error rate >5%
- Response time >2 seconds
- Low disk space (<20%)
- Failed deployments

**Information Alerts (Daily Summary):**

- Performance metrics
- User engagement stats
- Resource usage reports
- Security scan results

---

## Rollback Procedures

### Automatic Rollback Triggers

**Performance Degradation:**

```yaml
# .github/workflows/rollback.yml
name: Automatic Rollback

on:
  schedule:
    - cron: "*/5 * * * *" # Check every 5 minutes

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check Site Health
        run: |
          RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://transferjuice.com/api/health)
          if [ $RESPONSE -ne 200 ]; then
            echo "Health check failed with status $RESPONSE"
            # Trigger rollback
            vercel rollback --token=${{ secrets.VERCEL_TOKEN }}
          fi
```

### Manual Rollback Process

**Emergency Rollback:**

```bash
# Quick rollback to previous deployment
vercel rollback --token=$VERCEL_TOKEN

# Rollback to specific deployment
vercel rollback dpl_deployment_id --token=$VERCEL_TOKEN

# Database rollback (if schema changes)
npx prisma migrate reset --force
npx prisma migrate deploy --skip-seed
```

**Rollback Validation:**

```bash
# Verify rollback success
curl -f https://transferjuice.com/api/health
npm run test:production
```

---

## Performance Optimization

### Build Optimization

**Bundle Analysis:**

```bash
# Analyze bundle size
ANALYZE=true npm run build

# Check for unused dependencies
npx depcheck

# Optimize images
npx next-optimized-images
```

**Performance Monitoring:**

```typescript
// next.config.js
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
      ],
    },
  ],
};

module.exports = nextConfig;
```

### Database Performance

**Query Optimization:**

```typescript
// lib/db/optimized-queries.ts
export async function getRecentArticles(limit = 10) {
  return prisma.article.findMany({
    take: limit,
    orderBy: { published_at: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      briefing_type: true,
      published_at: true,
      // Only select needed fields
    },
    where: {
      published: true,
    },
  });
}
```

**Connection Pooling:**

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

---

## Security Deployment

### Security Headers

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  );

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### Environment Security

**Production Secrets Management:**

```bash
# Use Vercel CLI for secure secret management
vercel env add API_KEY production <<< "actual_secret_value"

# Verify secrets are set correctly
vercel env ls
```

**API Security:**

```typescript
// lib/auth/api-security.ts
export function validateApiKey(request: Request) {
  const apiKey = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!apiKey || apiKey !== process.env.API_SECRET) {
    throw new Error("Invalid API key");
  }
}

export function rateLimitCheck(ip: string) {
  // Implement rate limiting logic
  // Return true if within limits, false otherwise
}
```

---

## Troubleshooting Deployment Issues

### Common Deployment Problems

**Build Failures:**

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build

# Check for TypeScript errors
npm run type-check

# Verify environment variables
node -e "console.log('Required vars:', Object.keys(process.env).filter(k => k.includes('API')))"
```

**Database Issues:**

```bash
# Check database connectivity
npx prisma db pull

# Reset database if corrupted
npx prisma migrate reset --force

# Verify schema is up to date
npx prisma generate
```

**API Integration Problems:**

```bash
# Test API connections
curl -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" \
  "https://api.twitter.com/2/users/by/username/FabrizioRomano"

# Check API rate limits
npm run test:api-limits
```

### Emergency Procedures

**Site Down Response:**

1. Check Vercel dashboard for deployment status
2. Verify database connectivity
3. Review recent commits for breaking changes
4. Execute rollback if necessary
5. Notify stakeholders via Slack/email

**Performance Degradation:**

1. Check Lighthouse scores and Core Web Vitals
2. Review database query performance
3. Analyze bundle size increases
4. Check CDN cache hit rates
5. Implement performance fixes and redeploy

---

This deployment guide provides comprehensive instructions for all environments and scenarios. Regular updates to deployment procedures should be committed to this document as the system evolves.
