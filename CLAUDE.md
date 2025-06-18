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
- OpenAI/Anthropic API for content processing
- Wikipedia Commons API for player images
- Email service API integration

**Data Storage:**
- Tweet content, timestamps, media URLs, and links
- Processed articles with embedded images
- Email subscriber management
- Delivery logs and error tracking

**Content Processing Logic:**
- Transfer keyword filtering ("signing", "fee", "medical", "contract")
- AI prompt engineering for editorial-style article generation
- Image context matching and embedding
- HTML email template generation

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

- >90% relevant tweet capture rate
- Email open rate >30% within 3 months
- <5% daily error rate in automation
- 3 polished briefings delivered daily

## Project Structure (To Be Implemented)

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