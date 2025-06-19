# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Transfer Juice is a fully automated Premier League transfer newsletter and web digest. The system monitors ITK (In The Know) sources on X/Twitter, processes content with AI, and delivers polished briefings 3x daily via email and web archive.

## Architecture & Data Flow

**Core Pipeline:**

1. **Source Monitoring** → X API v2 queries 10-15 ITK accounts every 3-4 hours
2. **Content Processing** → Filter for transfer relevance, AI summarization into editorial articles
3. **Image Integration** → Pull from tweet media or Wikipedia Commons API
4. **Distribution** → Email delivery + web archive update
5. **Scheduling** → Cron jobs at 08:00, 14:00, 20:00 BST

**Key Components:**

- Next.js web app with TailwindCSS for public archive (/morning, /afternoon, /evening)
- Email service integration (ConvertKit/MailerLite/Postmark)
- X API v2 integration for tweet monitoring
- AI processing (GPT-4/Claude) for content summarization
- Wikipedia Commons API for contextual images
- Automated cron job system

## Development Setup

Since this is a fresh project, you'll need to set up the Next.js foundation:

```bash
# Initialize Next.js project with TypeScript and TailwindCSS
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Development commands
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking (add to package.json)

# Testing (once configured)
npm test             # Run unit tests
npm run test:e2e     # End-to-end tests
```

## Key Technical Requirements

**API Integrations:**

- X API v2 Bearer Token authentication for tweet fetching
- OpenAI/Anthropic API for Terry-style content processing
- Wikipedia Commons API for player images
- Email service API integration

**Data Storage:**

- Tweet content, timestamps, media URLs, and links
- Processed articles with embedded images and Terry's magnificent chaos
- Email subscriber management
- Delivery logs and error tracking

**Content Processing Logic (The Terry System):**

- Transfer keyword filtering ("signing", "fee", "medical", "contract")
- AI prompt engineering for Terry's acerbic editorial style
- Voice quality assessment (snark level, specificity score, emotional intelligence)
- Image context matching with Terry-style captions
- HTML email template generation with weaponised irritation

**Automation Requirements:**

- Cron job scheduling for 3x daily execution
- Error handling with <5% daily failure rate
- Logging system for debugging and monitoring
- Backup and recovery procedures

## Brand Assets

Brand assets are located in `/brand/` directory:

- Logo variants: black, white, cream versions (PDF, SVG, PNG)
- Transfer icon in multiple formats
- Colour palette reference

Use these consistently across email templates and web interface.

## Success Metrics

- > 90% relevant tweet capture rate
- Email open rate >30% within 3 months
- <5% daily error rate in automation
- 3 polished briefings delivered daily

## Current Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Homepage
├── lib/
│   └── validations/       # Zod schemas and type safety
│       ├── analytics.ts   # Analytics data validation
│       ├── api.ts         # API request/response validation
│       ├── article.ts     # Article content validation
│       ├── environment.ts # Environment variable validation
│       ├── subscriber.ts  # Email subscriber validation
│       ├── twitter.ts     # Twitter API response validation
│       ├── utils.ts       # Utility validation functions
│       └── index.ts       # Schema exports
└── test/
    ├── __tests__/
    │   └── integration/   # Integration test suites
    ├── factories/         # Test data factories
    ├── mocks/            # Mock implementations
    └── setup.ts          # Jest test setup

tests/                     # Playwright E2E tests
├── basic.spec.ts         # Basic functionality tests

Configuration Files:
├── .eslintrc.json        # ESLint configuration
├── .prettierrc           # Prettier formatting
├── jest.config.js        # Jest testing configuration
├── playwright.config.ts  # Playwright E2E configuration
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Project Structure (Future Implementation)

```
src/
├── app/                    # Next.js app router
│   ├── (briefs)/          # Route group for brief pages
│   │   ├── morning/
│   │   ├── afternoon/
│   │   └── evening/
│   └── api/               # API routes
├── components/
│   ├── EmailTemplate/     # HTML email generation
│   ├── BriefDisplay/      # Web article display
│   └── NewsletterSignup/  # Email subscription
├── lib/
│   ├── twitter-client.ts  # X API integration
│   ├── ai-processor.ts    # Content summarization
│   ├── image-fetcher.ts   # Wikipedia/media handling
│   ├── email-service.ts   # Email delivery
│   └── scheduler.ts       # Cron job management
└── types/
    └── index.ts           # TypeScript definitions
```

---

## Development Handover

### Phase 1 Status: ✅ COMPLETED

**Testing Infrastructure Setup** has been fully implemented and validated:

#### 1.1 ESLint & Prettier Configuration ✅

- **Location**: `.eslintrc.json`, `.prettierrc`, `.prettierignore`
- **Features**: Strict TypeScript rules, Next.js optimized, security linting
- **Scripts**: `npm run lint`, `npm run format`, `npm run lint:check`, `npm run format:check`
- **Husky Integration**: Pre-commit hooks enforce code quality

#### 1.2 Zod Runtime Type Safety ✅

- **Location**: `src/lib/validations/`
- **Coverage**: Complete schemas for all data structures
- **Environment Validation**: Comprehensive startup validation with clear error messages
- **Test Coverage**: 88% coverage with 26 passing tests
- **Key Files**:
  - `environment.ts` - Environment variable validation
  - `twitter.ts` - Twitter API response validation
  - `api.ts` - API request/response contracts
  - `subscriber.ts` - Email subscriber validation

#### 1.3 Jest Unit Testing ✅

- **Configuration**: `jest.config.js` with comprehensive coverage thresholds
- **Coverage Targets**: 90% global, 95% for validations, 85% for mocks
- **Test Structure**: Proper test organization with factories and mocks
- **Scripts**: `npm test`, `npm run test:watch`, `npm run test:coverage`
- **Performance**: Parallel execution, sub-30 second runtime

#### 1.4 Playwright E2E Testing ✅

- **Configuration**: `playwright.config.ts` with multi-browser support
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome/Safari
- **Features**: Visual regression, performance budgets, CI/CD integration
- **Scripts**: `npm run test:e2e`, `npm run test:e2e:ui`, `npm run test:e2e:headed`
- **Reporting**: HTML reports, JSON/JUnit for CI, screenshot on failure

### Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Lint and auto-fix
npm run lint:check      # Lint without fixing
npm run format          # Format all files
npm run format:check    # Check formatting
npm run type-check      # TypeScript type checking

# Testing
npm test                # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage
npm run test:e2e        # Run E2E tests
npm run test:e2e:ui     # Run E2E with UI
npm run test:e2e:headed # Run E2E in headed mode
```

### Current Test Coverage

- **Environment Validation**: 88.15% coverage, 26 tests passing
- **Integration Tests**: Content pipeline and Twitter service tests
- **Mock Framework**: Comprehensive mocks for AI, database, email, Twitter services
- **E2E Tests**: Basic functionality tests configured

### Next Steps (Phase 2: Core Data Pipeline)

1. **Database Schema Design with Prisma**

   - Implement comprehensive schema for tweets, articles, subscribers
   - Set up Neon PostgreSQL database
   - Configure migrations and seeding

2. **Twitter API Integration**

   - Bearer token authentication with rate limiting
   - ITK account monitoring and tweet fetching
   - Transfer relevance filtering

3. **AI Content Processing Pipeline**

   - GPT-4/Claude integration for article generation
   - Content quality validation and scoring
   - Joel Golby style voice implementation

4. **Data Integrity Testing**
   - End-to-end pipeline validation
   - Performance benchmarking
   - Error handling and recovery

### Key Files to Review

- `docs/ROADMAP.md` - Complete implementation roadmap
- `src/lib/validations/` - All Zod schemas and validation logic
- `src/test/` - Test infrastructure and examples
- `jest.config.js` - Jest configuration with coverage thresholds
- `playwright.config.ts` - E2E testing configuration

### Notes for Next Developer

- All linting rules are strict but auto-fixable where possible
- Test coverage thresholds are set to 90%+ - maintain this standard
- Environment validation is comprehensive - use existing patterns
- Zod schemas provide full TypeScript inference - leverage this
- Mock framework is extensible - follow existing patterns for new services

The foundation is solid and ready for Phase 2 implementation. All quality gates are in place.
