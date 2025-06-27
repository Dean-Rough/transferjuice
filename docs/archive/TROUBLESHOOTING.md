# Transfer Juice Troubleshooting Guide

## Overview

This guide provides comprehensive troubleshooting solutions for common issues encountered while developing, deploying, and maintaining Transfer Juice. Issues are organized by category with step-by-step resolution procedures.

**Quick Reference:** For urgent production issues, jump to [Emergency Procedures](#emergency-procedures)

---

## Development Environment Issues

### Node.js and Dependencies

**Problem: `npm install` fails with package conflicts**

```bash
Error: peer dep missing: @types/react@^18.0.0
```

**Solution:**

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall with legacy peer deps
npm install --legacy-peer-deps

# If still failing, check Node.js version
node --version  # Should be 18.x or higher
nvm use 18      # If using nvm
```

**Problem: TypeScript compilation errors after dependency updates**

```bash
Error: Module '"@prisma/client"' has no exported member 'PrismaClient'
```

**Solution:**

```bash
# Regenerate Prisma client
npx prisma generate

# Clear TypeScript cache
rm -rf .next
rm -rf node_modules/.cache

# Restart TypeScript server in VS Code
# Cmd+Shift+P -> "TypeScript: Restart TS Server"

# Rebuild project
npm run build
```

### Database Issues

**Problem: Database connection failures**

```bash
Error: Can't reach database server at `localhost:5432`
```

**Solution:**

```bash
# Check database connection string
echo $DATABASE_URL

# Verify database is running (local development)
pg_isready -h localhost -p 5432

# For Neon database, check connection pooling
# Ensure connection string includes `?pgbouncer=true`

# Test connection manually
npx prisma db pull

# Reset local database if corrupted
npx prisma migrate reset --force
npx prisma db seed
```

**Problem: Migration failures**

```bash
Error: Migration failed to apply cleanly to the shadow database
```

**Solution:**

```bash
# Check migration status
npx prisma migrate status

# Resolve shadow database issues
npx prisma migrate reset --force

# Apply migrations manually
npx prisma migrate deploy

# If still failing, check for schema conflicts
npx prisma db pull
# Compare with your schema.prisma file

# For production, ensure migrations are idempotent
```

### Environment Variables

**Problem: Missing or incorrect environment variables**

```bash
Error: Environment variable "TWITTER_BEARER_TOKEN" is not defined
```

**Solution:**

```bash
# Check if .env.local exists
ls -la .env*

# Copy from example if missing
cp .env.example .env.local

# Validate environment variables
node -e "
const required = ['DATABASE_URL', 'TWITTER_BEARER_TOKEN', 'OPENAI_API_KEY'];
required.forEach(key => {
  if (!process.env[key]) {
    console.error(\`Missing: \${key}\`);
  } else {
    console.log(\`✓ \${key}\`);
  }
});
"

# For Vercel deployment, check environment variables
vercel env ls
```

---

## Build and Deployment Issues

### Next.js Build Failures

**Problem: Build fails with memory issues**

```bash
Error: JavaScript heap out of memory
```

**Solution:**

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# For Vercel deployment, add to package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}

# Analyze bundle size to identify large dependencies
ANALYZE=true npm run build
```

**Problem: TypeScript errors in build**

```bash
Error: Type 'string | undefined' is not assignable to type 'string'
```

**Solution:**

```bash
# Enable strict type checking in development
npm run type-check

# Fix common type issues
// ❌ Problematic
const apiKey = process.env.API_KEY;

// ✅ Fixed
const apiKey = process.env.API_KEY!; // If you're certain it exists
// OR
const apiKey = process.env.API_KEY || 'default_value';
// OR
if (!process.env.API_KEY) {
  throw new Error('API_KEY is required');
}
const apiKey = process.env.API_KEY;

# For environment variables, use validation
npm install zod
```

### Vercel Deployment Issues

**Problem: Deployment timeouts**

```bash
Error: Function exceeded the timeout limit
```

**Solution:**

```bash
# Check function execution time
# For Pro accounts, functions can run up to 60 seconds
# For Hobby accounts, limit is 10 seconds

# Optimize long-running operations
// ❌ Synchronous processing
const articles = await processAllTweets(tweets);

// ✅ Background processing
const job = await queue.add('process-tweets', { tweets });
return { jobId: job.id };

# Configure serverless functions properly
// vercel.json
{
  "functions": {
    "app/api/*/route.ts": {
      "maxDuration": 30
    }
  }
}
```

**Problem: Environment variable not found in production**

```bash
Error: Configuration error
```

**Solution:**

```bash
# Set environment variables via Vercel CLI
vercel env add TWITTER_BEARER_TOKEN production

# Or use Vercel dashboard
# Project Settings > Environment Variables

# Verify variables are set
vercel env ls

# Check variable names match exactly (case-sensitive)
# Redeploy after adding environment variables
vercel --prod
```

---

## API Integration Issues

### Twitter API Problems

**Problem: Rate limiting errors**

```bash
Error: Too Many Requests (429)
```

**Solution:**

```typescript
// Implement proper rate limiting
class TwitterClient {
  private lastRequest = 0;
  private readonly RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_REQUESTS = 300;
  private requestCount = 0;

  async makeRequest(url: string) {
    const now = Date.now();

    // Reset counter if window has passed
    if (now - this.lastRequest > this.RATE_LIMIT_WINDOW) {
      this.requestCount = 0;
      this.lastRequest = now;
    }

    // Check if we're at the limit
    if (this.requestCount >= this.MAX_REQUESTS) {
      const waitTime = this.RATE_LIMIT_WINDOW - (now - this.lastRequest);
      throw new Error(`Rate limited. Wait ${waitTime}ms`);
    }

    this.requestCount++;
    return fetch(url);
  }
}

// Add retry logic with exponential backoff
async function retryRequest(fn: () => Promise<Response>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fn();
      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const delay = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.pow(2, i) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000),
      );
    }
  }
}
```

**Problem: Authentication failures**

```bash
Error: Unauthorized (401)
```

**Solution:**

```bash
# Verify bearer token is correct
curl -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" \
  "https://api.twitter.com/2/users/by/username/FabrizioRomano"

# Check if token has expired or been revoked
# Generate new bearer token from Twitter Developer Portal

# Ensure token is properly formatted in environment
TWITTER_BEARER_TOKEN="AAAAAAAAAAAAAAAAAAAAAA..."  # Should start with "AA"

# Test with minimal request
node -e "
fetch('https://api.twitter.com/2/users/by/username/FabrizioRomano', {
  headers: { Authorization: 'Bearer $TWITTER_BEARER_TOKEN' }
}).then(r => r.json()).then(console.log).catch(console.error);
"
```

### AI Service Issues

**Problem: OpenAI API failures**

```bash
Error: The model `gpt-4` does not exist
```

**Solution:**

```typescript
// Check available models and use fallbacks
const AVAILABLE_MODELS = ["gpt-4.1", "gpt-4", "gpt-4o-16k", "gpt-4o"];

async function generateContent(prompt: string) {
  for (const model of AVAILABLE_MODELS) {
    try {
      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.warn(`Model ${model} failed:`, error.message);
      continue;
    }
  }
  throw new Error("All AI models failed");
}

// Implement proper error handling
try {
  const content = await generateContent(prompt);
} catch (error) {
  // Fallback to cached content or manual placeholder
  return {
    content: "Content generation temporarily unavailable",
    isGenerated: false,
  };
}
```

**Problem: Content quality issues**

```bash
Generated content doesn't match Joel Golby style
```

**Solution:**

```typescript
// Improve prompts with specific examples
const JOEL_GOLBY_PROMPT = `
You are writing for Transfer Juice in the style of Joel Golby. Key characteristics:

1. Ascerbic wit and dry humor
2. Skeptical of football journalism and ITK culture
3. Conversational, informal tone
4. British humor with middle-class observations
5. Entertaining commentary that makes chaos readable

Example opening: "Right, so apparently Kane to Bayern is 'happening' according to someone who definitely knows someone who works in football..."

Transform these tweets into an entertaining brief that captures the absurdity:
`;

// Add content validation
function validateContent(content: string): boolean {
  const qualityChecks = [
    content.length > 200, // Sufficient length
    /\b(apparently|supposedly|allegedly)\b/i.test(content), // Skeptical language
    /[.!?]{1,3}$/.test(content.trim()), // Proper ending
    !/\b(amazing|incredible|fantastic)\b/i.test(content), // Avoid overwrought language
  ];

  return qualityChecks.every((check) => check === true);
}
```

---

## Email System Issues

### Email Delivery Problems

**Problem: Emails not being delivered**

```bash
Email service reports success but subscribers don't receive emails
```

**Solution:**

```typescript
// Check email service configuration
const emailConfig = {
  provider: "convertkit", // or 'mailerlite', 'postmark'
  apiKey: process.env.CONVERTKIT_API_KEY,
  fromEmail: "dean@transferjuice.com",
  fromName: "Transfer Juice",
};

// Verify API credentials
async function testEmailService() {
  try {
    const response = await fetch("https://api.convertkit.com/v3/account", {
      headers: {
        Authorization: `Bearer ${emailConfig.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API test failed: ${response.status}`);
    }

    console.log("✓ Email service credentials valid");
  } catch (error) {
    console.error("✗ Email service test failed:", error);
  }
}

// Check spam scores and deliverability
// Use tools like mail-tester.com
// Verify SPF, DKIM, DMARC records
```

**Problem: High bounce rate**

```bash
Many emails bouncing or going to spam
```

**Solution:**

```bash
# Check DNS records for domain authentication
dig TXT transferjuice.com | grep -E "(spf|dkim|dmarc)"

# SPF record should exist:
# v=spf1 include:_spf.convertkit.com ~all

# DMARC record:
# v=DMARC1; p=none; rua=mailto:dmarc@transferjuice.com

# Test email deliverability
# Send test emails to:
# - Gmail
# - Outlook
# - Yahoo
# - Apple Mail

# Monitor bounce rates and adjust content
# Avoid spam trigger words
# Include plain text version
# Use consistent sending domain
```

### Template Rendering Issues

**Problem: Email templates look broken in different clients**

```bash
Email appears correctly in Gmail but broken in Outlook
```

**Solution:**

```html
<!-- Use email-safe HTML -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!--[if !mso]><!-->
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <!--<![endif]-->
    <title>Transfer Juice</title>
    <style>
      /* Inline styles for maximum compatibility */
      .container {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          font-family: Arial, sans-serif;
      }
      /* Outlook-specific styles */
      /*[if mso]>
      <style>
          .container { width: 600px !important; }
    </style>
    <![endif]*/
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0A0808;">
    <table
      role="presentation"
      cellspacing="0"
      cellpadding="0"
      border="0"
      width="100%"
    >
      <tr>
        <td style="background-color: #0A0808; padding: 20px;">
          <div class="container">
            <!-- Content here -->
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>
```

```typescript
// Test templates across email clients
const emailTestingClients = [
  "gmail",
  "outlook",
  "apple-mail",
  "yahoo",
  "android",
  "ios",
];

// Use services like Litmus or Email on Acid for testing
```

---

## Performance Issues

### Database Performance

**Problem: Slow query performance**

```bash
Query execution time >2 seconds
```

**Solution:**

```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM articles
WHERE briefing_type = 'morning'
AND published_at > NOW() - INTERVAL '7 days'
ORDER BY published_at DESC;

-- Add missing indexes
CREATE INDEX idx_articles_briefing_published
ON articles(briefing_type, published_at DESC);

-- Optimize queries with Prisma
```

```typescript
// ❌ Inefficient query
const articles = await prisma.article.findMany({
  include: {
    tweets: {
      include: {
        author: true,
      },
    },
  },
});

// ✅ Optimized query
const articles = await prisma.article.findMany({
  select: {
    id: true,
    title: true,
    briefingType: true,
    publishedAt: true,
    tweets: {
      select: {
        id: true,
        text: true,
        author: {
          select: {
            handle: true,
            name: true,
          },
        },
      },
      take: 5, // Limit related data
    },
  },
  take: 10,
  orderBy: { publishedAt: "desc" },
});
```

**Problem: Database connection pool exhaustion**

```bash
Error: Too many connections
```

**Solution:**

```typescript
// Configure connection pooling in Prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Implement connection pool management
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Always close connections in serverless functions
export default async function handler(req, res) {
  try {
    // Your database operations
    const result = await prisma.article.findMany();
    res.json(result);
  } finally {
    await prisma.$disconnect();
  }
}
```

### Frontend Performance

**Problem: Large bundle size affecting load times**

```bash
Initial bundle size >1MB
```

**Solution:**

```typescript
// Implement code splitting
import dynamic from 'next/dynamic';

// Lazy load heavy components
const HeavyChart = dynamic(() => import('../components/HeavyChart'), {
  loading: () => <div>Loading chart...</div>
});

// Split by routes
const AdminPanel = dynamic(() => import('../components/AdminPanel'), {
  ssr: false // Client-side only
});

// Optimize images
import Image from 'next/image';

export function ArticleImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={600}
      height={400}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      loading="lazy"
    />
  );
}

// Bundle analysis
npm run build
npx @next/bundle-analyzer
```

---

## Security Issues

### Authentication Problems

**Problem: Unauthorized access to admin endpoints**

```bash
Admin endpoints accessible without authentication
```

**Solution:**

```typescript
// Implement proper middleware
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check if accessing admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const token = request.cookies.get("auth-token")?.value;

    if (!token || !isValidToken(token)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

// API route protection
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Protected logic here
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### XSS and Injection Vulnerabilities

**Problem: Potential XSS in user-generated content**

```bash
User input not properly sanitized
```

**Solution:**

```typescript
import DOMPurify from "isomorphic-dompurify";

// Sanitize HTML content
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "a"],
    ALLOWED_ATTR: ["href"],
    ALLOWED_URI_REGEXP: /^https?:\/\//,
  });
}

// Validate and sanitize API inputs
import { z } from "zod";

const CreateArticleSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(255)
    .refine(
      (title) => !/<script|javascript:/i.test(title),
      "Invalid characters in title",
    ),
  content: z.string().min(1).transform(sanitizeHtml),
});

// Use parameterized queries (Prisma handles this automatically)
const articles = await prisma.article.findMany({
  where: {
    title: {
      contains: searchTerm, // Safe with Prisma
    },
  },
});
```

---

## Emergency Procedures

### Site Down Response

**Immediate Actions (0-5 minutes):**

1. Check Vercel deployment status
2. Verify database connectivity
3. Check for recent commits that might have caused issues
4. Review error logs and monitoring dashboards

```bash
# Quick health checks
curl -f https://transferjuice.com/api/health
curl -f https://transferjuice.com

# Check Vercel deployment status
vercel ls
vercel logs

# Database connectivity
npx prisma db pull

# Recent commits
git log --oneline -5
```

**If Issue Confirmed (5-15 minutes):**

```bash
# Execute rollback
vercel rollback --token=$VERCEL_TOKEN

# Notify stakeholders
# Use predetermined communication channels
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚨 Transfer Juice is experiencing issues. Investigating and rolling back."}' \
  $SLACK_WEBHOOK_URL

# Monitor rollback success
curl -f https://transferjuice.com/api/health
```

### Database Emergency Recovery

**Database Connection Loss:**

```bash
# Check database status
pg_isready -h your-neon-host.neon.tech -p 5432

# If database is down, switch to backup
# Update DATABASE_URL to backup instance
vercel env add DATABASE_URL $BACKUP_DATABASE_URL production

# Redeploy with backup database
vercel --prod

# Monitor data sync when primary is restored
```

**Data Corruption:**

```bash
# Stop all write operations
# Comment out or disable cron jobs

# Restore from backup
pg_restore -d $DATABASE_URL backup_file.sql

# Verify data integrity
npx prisma db pull
npm run db:verify-integrity

# Resume operations gradually
```

### Performance Emergency

**High Response Times:**

```bash
# Check server metrics
# CPU, memory, database connections

# Implement emergency caching
# Add aggressive caching headers
# Enable CDN caching for all static content

# Scale database connections if needed
# Increase connection pool size temporarily

# Monitor improvements
npm run test:performance
```

---

## Monitoring and Logging

### Log Analysis

**Finding Issues in Logs:**

```bash
# Vercel logs
vercel logs --follow

# Filter by error level
vercel logs | grep ERROR

# Application-specific logs
grep "Transfer Juice" /var/log/application.log

# Database logs (if accessible)
tail -f /var/log/postgresql/postgresql.log
```

**Log Patterns to Watch:**

- High error rates (>1% of requests)
- Slow query warnings (>1 second)
- Rate limiting triggers
- Authentication failures
- Memory usage spikes

### Performance Monitoring

**Key Metrics:**

```typescript
// Track these metrics
const metrics = {
  responseTime: "p95 < 500ms",
  errorRate: "< 1%",
  throughput: "> 100 req/min",
  availability: "> 99.9%",
};

// Alert thresholds
const alerts = {
  critical: {
    responseTime: "p95 > 2000ms",
    errorRate: "> 5%",
    availability: "< 99%",
  },
  warning: {
    responseTime: "p95 > 1000ms",
    errorRate: "> 2%",
    availability: "< 99.5%",
  },
};
```

---

## Prevention Strategies

### Code Quality Gates

**Pre-commit Checks:**

```bash
# Install husky for git hooks
npm install --save-dev husky

# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint
npm run type-check
npm run test:quick
```

**CI/CD Quality Gates:**

```yaml
# Prevent problematic deployments
- name: Quality Gates
  run: |
    npm run lint
    npm run type-check
    npm run test:coverage
    npm run test:e2e
    npm run security-scan
```

### Monitoring Setup

**Early Warning System:**

```typescript
// Implement health checks
export async function checkSystemHealth() {
  const checks = {
    database: await checkDatabaseHealth(),
    twitter: await checkTwitterAPI(),
    email: await checkEmailService(),
    ai: await checkAIService(),
  };

  const failures = Object.entries(checks)
    .filter(([_, status]) => !status)
    .map(([service]) => service);

  if (failures.length > 0) {
    await alertTeam(`Services failing: ${failures.join(", ")}`);
  }

  return checks;
}
```

---

## Getting Help

### Internal Resources

- Check existing documentation in `/docs/`
- Review test files for usage examples
- Search GitHub issues for similar problems

### External Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **Twitter API Documentation**: https://developer.twitter.com/docs
- **Vercel Documentation**: https://vercel.com/docs

### Emergency Contacts

- **Development Team**: Slack #transfer-juice-dev
- **Infrastructure Issues**: Slack #infrastructure
- **Security Issues**: security@transferjuice.com
- **Critical Production Issues**: Phone escalation tree

---

Remember: When in doubt, check the logs, verify environment variables, and don't hesitate to roll back to a known good state.
