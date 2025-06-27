# Transfer Juice Environment Setup Guide

## Overview

This guide provides comprehensive instructions for setting up Transfer Juice development, staging, and production environments. Follow these steps to ensure consistent configuration across all deployment targets.

**App Strapline:** _"All of the ITK rumours, for people who swear they're not obsessed with transfers."_

---

## Prerequisites

### System Requirements

**Local Development:**

- **Node.js**: Version 18.x or higher (LTS recommended)
- **npm**: Version 8.x or higher (comes with Node.js)
- **Git**: Version 2.x or higher with SSH keys configured
- **VS Code**: Recommended IDE with suggested extensions

**Operating System Support:**

- macOS 10.15+ (Catalina or newer)
- Windows 10/11 with WSL2
- Ubuntu 20.04+ or similar Linux distribution

**Hardware Recommendations:**

- **RAM**: Minimum 8GB, 16GB recommended for optimal performance
- **Storage**: 5GB free space for dependencies and development database
- **CPU**: Multi-core processor for parallel test execution

### Required Accounts and Services

**Development Services:**

- **GitHub**: Access to Transfer Juice repository
- **Vercel**: Deployment platform (free tier sufficient for development)
- **Neon**: PostgreSQL database (free tier includes 0.5GB storage)

**API Service Accounts:**

- **Twitter Developer**: For Twitter API v2 access (Essential tier minimum)
- **OpenAI**: For AI content generation (pay-per-use pricing)
- **ConvertKit/MailerLite**: Email newsletter service

---

## Local Development Setup

### 1. Install Core Dependencies

**Node.js Installation:**

```bash
# Using Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc  # or ~/.zshrc

# Install and use Node 18
nvm install 18
nvm use 18
nvm alias default 18

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 8.x.x or higher
```

**Alternative Installation Methods:**

```bash
# macOS with Homebrew
brew install node@18

# Windows (download from nodejs.org)
# Download and run the Windows installer

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Clone and Setup Repository

**Initial Repository Setup:**

```bash
# Clone the repository
git clone git@github.com:yourusername/transfer-juice.git
cd transfer-juice

# Install dependencies
npm install

# Verify installation
npm run --silent lint --version
npx prisma --version
npx playwright --version
```

**Common Installation Issues:**

```bash
# If npm install fails with permission errors (macOS/Linux)
sudo chown -R $(whoami) ~/.npm
npm install

# If sharp installation fails (image optimization)
npm install --platform=darwin --arch=x64 sharp  # macOS Intel
npm install --platform=darwin --arch=arm64 sharp  # macOS Apple Silicon

# Clear cache if dependency conflicts occur
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 3. Environment Configuration

**Create Local Environment File:**

```bash
# Copy environment template
cp .env.example .env.local

# Open for editing
code .env.local  # VS Code
nano .env.local  # Terminal editor
```

**Complete .env.local Configuration:**

```bash
# Development Environment Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/transfer_juice_dev"
# For Neon database (recommended):
# DATABASE_URL="postgresql://user:pass@ep-cool-name-123456.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Twitter API v2 Configuration
TWITTER_BEARER_TOKEN="your_twitter_bearer_token_here"
TWITTER_API_KEY="your_twitter_api_key"
TWITTER_API_SECRET="your_twitter_api_secret"

# AI Content Generation
OPENAI_API_KEY="sk-your_openai_api_key_here"
ANTHROPIC_API_KEY="sk-ant-your_anthropic_key"  # Optional fallback

# Email Service (ConvertKit Example)
CONVERTKIT_API_KEY="your_convertkit_api_key"
CONVERTKIT_API_SECRET="your_convertkit_secret"
CONVERTKIT_FORM_ID="your_newsletter_form_id"

# NextAuth Configuration (for admin areas)
NEXTAUTH_SECRET="your_nextauth_secret_32_chars_min"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Development Features
DEBUG=true
LOG_LEVEL=debug
ENABLE_MOCK_DATA=true  # Use mock data when APIs are unavailable
```

### 4. Database Setup

**Option A: Using Neon (Recommended)**

```bash
# Create Neon account at neon.tech
# Create new project: "transfer-juice-dev"
# Copy connection string to .env.local

# Test connection
npx prisma db pull

# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma db push

# Seed development data
npx prisma db seed
```

**Option B: Local PostgreSQL**

```bash
# Install PostgreSQL locally
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create development database
createdb transfer_juice_dev

# Update DATABASE_URL in .env.local
DATABASE_URL="postgresql://postgres:password@localhost:5432/transfer_juice_dev"

# Setup database schema
npx prisma db push
npx prisma db seed
```

### 5. API Service Configuration

**Twitter API Setup:**

1. **Apply for Twitter Developer Account**

   - Visit: https://developer.twitter.com/
   - Apply for Essential access (free tier)
   - Create new project: "Transfer Juice Development"

2. **Generate API Credentials**

   ```bash
   # In Twitter Developer Portal:
   # 1. Create new App within your project
   # 2. Go to "Keys and tokens" tab
   # 3. Generate Bearer Token
   # 4. Copy API Key and API Secret
   ```

3. **Test API Access**
   ```bash
   # Test Twitter API connection
   curl -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" \
     "https://api.twitter.com/2/users/by/username/FabrizioRomano"
   ```

**OpenAI API Setup:**

1. **Create OpenAI Account**

   - Visit: https://platform.openai.com/
   - Add payment method (required for API access)
   - Generate API key in API section

2. **Test API Access**
   ```bash
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Test"}]}' \
     https://api.openai.com/v1/chat/completions
   ```

**Email Service Setup (ConvertKit):**

1. **Create ConvertKit Account**

   - Visit: https://convertkit.com/
   - Create account and verify email
   - Go to Account Settings > API Keys

2. **Create Newsletter Form**
   ```bash
   # In ConvertKit dashboard:
   # 1. Create new form for newsletter signup
   # 2. Note the Form ID from the form settings
   # 3. Copy API Key and API Secret
   ```

### 6. Development Environment Verification

**Run Full System Check:**

```bash
# Start development server
npm run dev

# In another terminal, run health checks
curl http://localhost:3000/api/health

# Check database connectivity
npx prisma studio  # Opens database browser

# Run test suite
npm run test

# Verify code quality tools
npm run lint
npm run type-check
```

**Environment Validation Script:**

```bash
# Create validation script
cat > scripts/validate-env.js << 'EOF'
const requiredEnvVars = [
  'DATABASE_URL',
  'TWITTER_BEARER_TOKEN',
  'OPENAI_API_KEY',
  'CONVERTKIT_API_KEY',
  'NEXTAUTH_SECRET'
];

console.log('🔍 Validating environment variables...\n');

let allValid = true;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: Missing`);
    allValid = false;
  } else if (value.includes('your_') || value.includes('replace_')) {
    console.log(`⚠️  ${varName}: Placeholder value detected`);
    allValid = false;
  } else {
    console.log(`✅ ${varName}: Set`);
  }
});

if (allValid) {
  console.log('\n🎉 All environment variables are properly configured!');
} else {
  console.log('\n⚠️  Please fix the environment variables above');
  process.exit(1);
}
EOF

# Run validation
node scripts/validate-env.js
```

---

## IDE and Tooling Setup

### VS Code Configuration

**Install Recommended Extensions:**

```bash
# Install VS Code extensions via command line
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension bradlc.vscode-tailwindcss
code --install-extension prisma.prisma
code --install-extension ms-playwright.playwright
code --install-extension ms-vscode.vscode-typescript-next
```

**Workspace Settings:**

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["className\\s*=\\s*['\"`]([^'\"`]*)['\"`]"]
  ],
  "prisma.showPrismaDataPlatformNotification": false,
  "typescript.inlayHints.parameterNames.enabled": "all",
  "typescript.inlayHints.variableTypes.enabled": true
}
```

**Debugging Configuration:**

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "env": {
        "NODE_OPTIONS": "--inspect"
      },
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Git Configuration

**Git Hooks Setup:**

```bash
# Install husky for git hooks
npm install --save-dev husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run type-check"

# Add commit message validation
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

**Git Configuration:**

```bash
# Configure Git (if not already done)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set up SSH key for GitHub (if not already done)
ssh-keygen -t ed25519 -C "your.email@example.com"
cat ~/.ssh/id_ed25519.pub  # Add to GitHub SSH keys

# Test SSH connection
ssh -T git@github.com
```

---

## Staging Environment

### Vercel Staging Setup

**Install Vercel CLI:**

```bash
# Install globally
npm install -g vercel

# Login to Vercel
vercel login

# Link project to Vercel
vercel link
```

**Configure Staging Environment:**

```bash
# Set up staging environment variables
vercel env add DATABASE_URL staging
vercel env add TWITTER_BEARER_TOKEN staging
vercel env add OPENAI_API_KEY staging
vercel env add CONVERTKIT_API_KEY staging
vercel env add NEXTAUTH_SECRET staging

# Create staging branch
git checkout -b staging
git push origin staging

# Configure automatic staging deployments
# This is done through Vercel dashboard or vercel.json
```

**Staging Environment Variables:**

```bash
# Use separate API keys and database for staging
DATABASE_URL="postgresql://user:pass@staging-db.neon.tech/neondb"
TWITTER_BEARER_TOKEN="staging_twitter_bearer_token"
OPENAI_API_KEY="sk-staging_openai_key"
CONVERTKIT_API_KEY="staging_convertkit_key"
NEXTAUTH_SECRET="staging_nextauth_secret_different_from_prod"
NEXT_PUBLIC_APP_URL="https://staging-transferjuice.vercel.app"
```

### Staging Database Setup

**Create Staging Database:**

```bash
# Create separate Neon database for staging
# 1. Login to Neon dashboard
# 2. Create new branch: "staging"
# 3. Copy connection string
# 4. Add to Vercel staging environment

# Apply schema to staging database
DATABASE_URL="staging_db_url" npx prisma db push

# Seed staging data
DATABASE_URL="staging_db_url" npx prisma db seed
```

---

## Production Environment

### Production Infrastructure

**Domain and DNS Configuration:**

```bash
# Configure custom domain in Vercel
# 1. Add domain: transferjuice.com
# 2. Configure DNS records:

# A record: @ -> 76.76.19.61 (Vercel IP)
# CNAME record: www -> cname.vercel-dns.com

# Verify domain configuration
dig transferjuice.com
dig www.transferjuice.com
```

**SSL Certificate:**

```bash
# Vercel automatically provisions SSL certificates
# Verify SSL is working
curl -I https://transferjuice.com
```

### Production Environment Variables

**Secure Production Configuration:**

```bash
# Production environment variables (set via Vercel dashboard)
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://transferjuice.com

# Production database (separate from staging)
DATABASE_URL="postgresql://user:secure_pass@prod-db.neon.tech/neondb"

# Production API keys (separate from development)
TWITTER_BEARER_TOKEN="prod_twitter_bearer_token"
OPENAI_API_KEY="sk-prod_openai_key"
CONVERTKIT_API_KEY="prod_convertkit_key"

# Strong production secrets
NEXTAUTH_SECRET="production_secret_32_chars_minimum_length"
WEBHOOK_SECRET="webhook_secret_for_api_validation"

# Monitoring and analytics
SENTRY_DSN="https://your_sentry_dsn@sentry.io/project"
GOOGLE_ANALYTICS_ID="GA4_measurement_id"

# Email configuration
SMTP_HOST="smtp.convertkit.com"
SMTP_PORT=587
FROM_EMAIL="dean@transferjuice.com"
REPLY_TO_EMAIL="noreply@transferjuice.com"
```

### Production Database

**Production Database Setup:**

```bash
# Create production Neon database
# 1. Create new Neon project: "transfer-juice-production"
# 2. Enable connection pooling
# 3. Configure backup retention (7 days minimum)
# 4. Set up monitoring and alerts

# Apply production schema
DATABASE_URL="prod_db_url" npx prisma migrate deploy

# Production data seeding (minimal)
DATABASE_URL="prod_db_url" npx prisma db seed --production
```

**Database Security:**

```bash
# Configure database security
# 1. Enable SSL/TLS encryption
# 2. Restrict IP access if possible
# 3. Use strong, unique passwords
# 4. Enable audit logging
# 5. Configure automated backups

# Connection string should include SSL
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require&pgbouncer=true"
```

---

## Environment-Specific Configuration

### Next.js Configuration

**Environment-Aware Config:**

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },

  // Environment-specific settings
  ...(process.env.NODE_ENV === "production" && {
    swcMinify: true,
    output: "standalone",
    poweredByHeader: false,
  }),

  // Image optimization
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [
      "pbs.twimg.com", // Twitter images
      "upload.wikimedia.org", // Wikipedia images
    ],
  },

  // Security headers
  async headers() {
    return [
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
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/newsletter",
        destination: "/#newsletter",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
```

### Database Configuration

**Prisma Environment Configuration:**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL") // For staging
}

// Development-specific models (optional)
model DevLog {
  id        String   @id @default(cuid())
  message   String
  level     String
  createdAt DateTime @default(now())

  @@map("dev_logs")
  // Only include in development schema
}
```

**Connection Pool Configuration:**

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    ...(process.env.NODE_ENV === "development" && {
      log: ["query", "info", "warn", "error"],
    }),
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

---

## Monitoring and Observability

### Error Tracking Setup

**Sentry Configuration:**

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  beforeSend(event) {
    // Filter out sensitive information
    if (event.exception) {
      const exception = event.exception.values?.[0];
      if (exception?.value?.includes("API_KEY")) {
        return null;
      }
    }
    return event;
  },
});

// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
```

### Analytics Setup

**Google Analytics Configuration:**

```typescript
// lib/analytics.ts
export const GA_TRACKING_ID = process.env.GOOGLE_ANALYTICS_ID;

export const pageview = (url: string) => {
  if (typeof window !== "undefined" && GA_TRACKING_ID) {
    window.gtag("config", GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== "undefined" && GA_TRACKING_ID) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
```

---

## Environment Validation

### Automated Environment Testing

**Environment Test Suite:**

```typescript
// scripts/test-environment.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testEnvironment() {
  console.log("🧪 Testing environment configuration...\n");

  const tests = [
    testDatabaseConnection,
    testTwitterAPI,
    testOpenAIAPI,
    testEmailService,
  ];

  for (const test of tests) {
    try {
      await test();
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
      process.exit(1);
    }
  }

  console.log("\n✅ All environment tests passed!");
}

async function testDatabaseConnection() {
  await prisma.$queryRaw`SELECT 1`;
  console.log("✅ Database connection working");
}

async function testTwitterAPI() {
  const response = await fetch(
    "https://api.twitter.com/2/users/by/username/FabrizioRomano",
    {
      headers: {
        Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Twitter API failed: ${response.status}`);
  }

  console.log("✅ Twitter API connection working");
}

async function testOpenAIAPI() {
  const response = await fetch("https://api.openai.com/v1/models", {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`OpenAI API failed: ${response.status}`);
  }

  console.log("✅ OpenAI API connection working");
}

async function testEmailService() {
  // Test ConvertKit API
  const response = await fetch("https://api.convertkit.com/v3/account", {
    headers: {
      Authorization: `Bearer ${process.env.CONVERTKIT_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Email service failed: ${response.status}`);
  }

  console.log("✅ Email service connection working");
}

testEnvironment().finally(() => prisma.$disconnect());
```

**Run Environment Tests:**

```bash
# Add to package.json scripts
{
  "scripts": {
    "test:env": "tsx scripts/test-environment.ts",
    "validate:env": "node scripts/validate-env.js"
  }
}

# Run tests
npm run test:env
npm run validate:env
```

---

## Backup and Recovery

### Backup Strategy

**Database Backups:**

```bash
# Automated daily backups (Neon handles this)
# Manual backup before major changes
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Store backups securely
# - Encrypted cloud storage
# - Retention policy: 30 days
# - Geographic distribution
```

**Environment Configuration Backup:**

```bash
# Export environment variables (sanitized)
cat > backup/env-template.txt << 'EOF'
# Transfer Juice Environment Variables
DATABASE_URL="postgresql://..."
TWITTER_BEARER_TOKEN="..."
OPENAI_API_KEY="sk-..."
CONVERTKIT_API_KEY="..."
NEXTAUTH_SECRET="..."
EOF

# Store in secure location (1Password, etc.)
```

### Recovery Procedures

**Environment Recovery:**

```bash
# 1. Restore from backup
# 2. Validate all environment variables
npm run validate:env

# 3. Test all integrations
npm run test:env

# 4. Run health checks
curl -f https://transferjuice.com/api/health

# 5. Monitor for issues
tail -f /var/log/application.log
```

---

This comprehensive environment setup guide ensures consistent, secure, and maintainable environments across all stages of Transfer Juice development and deployment.
