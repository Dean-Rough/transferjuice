# TransferJuice

Football transfer news aggregator with AI-powered commentary in the style of Joel Golby.

## Features

- 4x daily briefings (9am, 12pm, 4pm, 8pm GMT)
- Terry AI provides witty British commentary
- Manual tweet entry system for content management
- Dark theme UI with Geist fonts
- Email summaries (coming soon)

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Prisma + PostgreSQL (Neon)
- OpenAI GPT-4
- Tailwind CSS + shadcn/ui
- Vercel deployment

## Environment Variables

```env
DATABASE_URL=         # Neon PostgreSQL
OPENAI_API_KEY=      # GPT-4 access
ADMIN_API_KEY=       # Admin authentication
CRON_SECRET=         # Cron job security
SENDGRID_API_KEY=    # Email delivery (optional)
```

## Getting Started

First, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:4433](http://localhost:4433) with your browser to see the result.

## Development Commands

```bash
# Generate test briefing
npm run briefing:test

# Access admin panel
# http://localhost:4433/admin
```

## Deployment

See DEPLOYMENT_CHECKLIST.md for detailed instructions.

## Content Management

Use the admin panel at `/admin` to manually add tweets from ITK sources. Terry AI will automatically generate commentary for each story.

## Testing

This project includes comprehensive testing infrastructure:

### Unit & Integration Testing (Jest)

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### End-to-End Testing (Playwright)

```bash
# Run E2E tests headless
npm run test:e2e

# Run E2E tests with browser UI
npm run test:e2e:ui

# Run E2E tests in headed mode (visible browser)
npm run test:e2e:headed
```

### Testing Tools Available

- **Jest Extended**: Additional matchers for comprehensive testing
- **MSW (Mock Service Worker)**: API mocking for integration tests (Node.js 18+ required)
- **Why Did You Render**: React re-render debugging in development
- **Testing Library**: React component testing utilities

### Viewing Test Results

**Playwright Traces**: After running E2E tests, open the trace viewer:

```bash
npx playwright show-trace test-results/traces/trace.zip
```

**Coverage Reports**: After running `npm run test:coverage`, open:

```bash
open coverage/lcov-report/index.html
```

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
