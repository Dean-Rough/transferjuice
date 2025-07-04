# TransferJuice - Simple Transfer News Aggregator

## What it does

- Scrapes 15 top ITK (In The Know) football transfer sources every 3 hours
- Generates Terry's witty commentary on each tweet (Joel Golby style)
- Creates briefings with embedded tweets and commentary
- Sends daily email summaries (8am)

## Architecture

```
ITK Sources (15 accounts) → Playwright Scraper → Database → Terry AI → Briefings → Web Display
                                                                     ↓
                                                            Daily Email Summary
```

## Setup

1. Clone the repo
2. Install dependencies: `npm install`
3. Set up PostgreSQL database
4. Copy `.env.example` to `.env` and fill in values
5. Run database migrations: `npx prisma db push`
6. Generate Prisma client: `npx prisma generate`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npx tsx scripts/generate-briefing.ts` - Generate a briefing manually

## Cron Jobs

Set up two cron jobs:

- Every 3 hours: Run briefing generation
- Daily at 8am: Send email summary

## Database Schema

- **Source**: ITK accounts we track (name, handle)
- **Tweet**: Raw tweets from sources
- **Story**: Tweet + Terry's commentary
- **Briefing**: Collection of stories
- **User**: Email subscribers

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - For Terry commentary
- `PLAYWRIGHT_HEADLESS` - Run browser in headless mode
- `CRON_SECRET` - Secure cron endpoints
- `SENDGRID_API_KEY` - For sending emails

## ITK Sources

The 15 accounts we track are defined in `src/lib/sources.ts`:

- Fabrizio Romano
- David Ornstein
- Sam Lee
- Paul Joyce
- Laurie Whitwell
- Rob Dawson
- Luke Edwards
- John Percy
- Craig Hope
- Dean Jones
- Sirayah Shiraz
- Mohamed Bouhafsi
- Gianluca Di Marzio
- Alfredo Pedulla
- Raphael Honigstein
