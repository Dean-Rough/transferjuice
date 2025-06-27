This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

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
