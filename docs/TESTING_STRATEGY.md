# Transfer Juice Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for Transfer Juice, ensuring reliability, performance, and quality across all system components. Our testing approach follows Test-Driven Development (TDD) principles with 100% coverage requirements for critical paths.

**Testing Philosophy:**

- Test-first development for all new features
- Comprehensive coverage across unit, integration, and E2E levels
- Performance testing integrated into CI/CD pipeline
- AI-assisted test generation and maintenance

---

## Testing Pyramid

```
                    E2E Tests
                 ┌─────────────────┐
                 │   User Flows    │  ← 10% of tests
                 │   Performance   │
                 └─────────────────┘
              ┌─────────────────────────┐
              │   Integration Tests     │  ← 20% of tests
              │   API Routes           │
              │   Database Operations  │
              └─────────────────────────┘
          ┌─────────────────────────────────┐
          │        Unit Tests               │  ← 70% of tests
          │   Components, Functions         │
          │   Business Logic               │
          └─────────────────────────────────┘
```

### Testing Distribution

- **Unit Tests (70%)**: Fast, isolated tests for individual components and functions
- **Integration Tests (20%)**: Test interactions between system components
- **End-to-End Tests (10%)**: Full user workflow validation

---

## Unit Testing

### Framework Setup

**Jest Configuration:**

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/*.tsx', // App router pages
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

**Test Setup:**

```typescript
// jest.setup.js
import '@testing-library/jest-dom';
import { server } from './src/mocks/server';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
    };
  },
}));

// Setup MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Component Testing

**React Component Tests:**

```typescript
// src/components/__tests__/ArticleCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ArticleCard } from '../ArticleCard';
import { mockArticle } from '@/mocks/data';

describe('ArticleCard', () => {
  it('renders article information correctly', () => {
    render(<ArticleCard article={mockArticle} />);

    expect(screen.getByText(mockArticle.title)).toBeInTheDocument();
    expect(screen.getByText(/morning brief/i)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      `/articles/${mockArticle.id}`
    );
  });

  it('displays publication date in correct format', () => {
    render(<ArticleCard article={mockArticle} />);

    const dateElement = screen.getByText(/june 26, 2025/i);
    expect(dateElement).toBeInTheDocument();
  });

  it('handles missing image gracefully', () => {
    const articleWithoutImage = { ...mockArticle, image_url: null };
    render(<ArticleCard article={articleWithoutImage} />);

    expect(screen.getByText('No image available')).toBeInTheDocument();
  });
});
```

**Utility Function Tests:**

```typescript
// src/lib/__tests__/twitter-utils.test.ts
import { filterRelevantTweets, extractTransferInfo } from '../twitter-utils';
import { mockTweets } from '@/mocks/data';

describe('Twitter Utils', () => {
  describe('filterRelevantTweets', () => {
    it('filters tweets containing transfer keywords', () => {
      const tweets = [
        { text: 'Great goal by Kane!' },
        { text: 'Kane to Bayern Munich - Here we go!' },
        { text: 'Weather is nice today' },
      ];

      const filtered = filterRelevantTweets(tweets);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].text).toContain('Bayern Munich');
    });

    it('prioritizes verified ITK accounts', () => {
      const tweets = [
        { text: 'Transfer news', author: 'random_user', verified: false },
        {
          text: 'Transfer confirmed',
          author: 'FabrizioRomano',
          verified: true,
        },
      ];

      const filtered = filterRelevantTweets(tweets);

      expect(filtered[0].author).toBe('FabrizioRomano');
    });
  });

  describe('extractTransferInfo', () => {
    it('extracts player, club, and fee information', () => {
      const tweet = {
        text: 'EXCLUSIVE: Kane to Bayern Munich for £100m. Here we go! 🔴⚪️',
      };

      const info = extractTransferInfo(tweet);

      expect(info.player).toBe('Kane');
      expect(info.club).toBe('Bayern Munich');
      expect(info.fee).toBe('£100m');
    });
  });
});
```

### Mock Data Management

**Centralized Mock Data:**

```typescript
// src/mocks/data.ts
export const mockArticle = {
  id: 'test-article-1',
  title: "Transfer Roundup: Kane's Bavarian Adventure",
  content: "The latest on Harry Kane's move to Bayern Munich...",
  briefing_type: 'morning' as const,
  published_at: new Date('2025-06-26T08:00:00Z'),
  image_url: 'https://example.com/kane.jpg',
};

export const mockTweets = [
  {
    id: 'tweet-1',
    text: 'Kane to Bayern Munich - Here we go! 🔴⚪️',
    author: 'FabrizioRomano',
    created_at: '2025-06-26T07:30:00Z',
    metrics: { retweet_count: 1500, like_count: 5000 },
  },
  // ... more mock tweets
];

export const mockSubscriber = {
  id: 'sub-1',
  email: 'test@example.com',
  subscribed_at: new Date('2025-06-26T08:00:00Z'),
  verified: true,
};
```

---

## Integration Testing

### API Route Testing

**Next.js API Route Tests:**

```typescript
// src/app/api/__tests__/articles.test.ts
import { GET, POST } from '../articles/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    article: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('/api/articles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/articles', () => {
    it('returns paginated articles', async () => {
      const mockArticles = [mockArticle];
      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      const request = new NextRequest('http://localhost/api/articles?limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.articles).toEqual(mockArticles);
      expect(prisma.article.findMany).toHaveBeenCalledWith({
        take: 10,
        orderBy: { published_at: 'desc' },
      });
    });

    it('filters by briefing type', async () => {
      const request = new NextRequest(
        'http://localhost/api/articles?briefing_type=morning'
      );
      await GET(request);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { briefing_type: 'morning' },
        })
      );
    });
  });

  describe('POST /api/articles', () => {
    it('creates new article with valid data', async () => {
      const articleData = {
        title: 'Test Article',
        content: 'Test content',
        briefing_type: 'morning',
      };

      (prisma.article.create as jest.Mock).mockResolvedValue({
        id: 'new-article',
        ...articleData,
      });

      const request = new NextRequest('http://localhost/api/articles', {
        method: 'POST',
        body: JSON.stringify(articleData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.article.id).toBe('new-article');
    });

    it('validates required fields', async () => {
      const invalidData = { title: 'Test' }; // Missing required fields

      const request = new NextRequest('http://localhost/api/articles', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
```

### Database Integration Tests

**Prisma Integration Tests:**

```typescript
// src/lib/__tests__/article-service.test.ts
import { ArticleService } from '../article-service';
import { prisma } from '@/lib/prisma';
import { mockArticle } from '@/mocks/data';

describe('ArticleService', () => {
  beforeEach(async () => {
    // Clean test database
    await prisma.article.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('createArticle', () => {
    it('creates article with all required fields', async () => {
      const articleData = {
        title: 'Test Article',
        content: 'Test content',
        briefing_type: 'morning' as const,
      };

      const article = await ArticleService.create(articleData);

      expect(article.id).toBeDefined();
      expect(article.title).toBe(articleData.title);
      expect(article.published_at).toBeInstanceOf(Date);

      // Verify in database
      const dbArticle = await prisma.article.findUnique({
        where: { id: article.id },
      });
      expect(dbArticle).toBeTruthy();
    });

    it('throws error for duplicate titles', async () => {
      const articleData = { title: 'Duplicate Title', content: 'Content' };

      await ArticleService.create(articleData);

      await expect(ArticleService.create(articleData)).rejects.toThrow(
        'Article with this title already exists'
      );
    });
  });

  describe('getRecentArticles', () => {
    it('returns articles in descending order by publication date', async () => {
      // Create test articles with different dates
      const articles = await Promise.all([
        ArticleService.create({
          title: 'Older Article',
          content: 'Content',
          published_at: new Date('2025-06-25'),
        }),
        ArticleService.create({
          title: 'Newer Article',
          content: 'Content',
          published_at: new Date('2025-06-26'),
        }),
      ]);

      const recent = await ArticleService.getRecent(10);

      expect(recent[0].title).toBe('Newer Article');
      expect(recent[1].title).toBe('Older Article');
    });
  });
});
```

### External API Integration

**Twitter API Integration Tests:**

```typescript
// src/lib/__tests__/twitter-client.test.ts
import { TwitterClient } from '../twitter-client';
import { server } from '@/mocks/server';
import { rest } from 'msw';

describe('TwitterClient', () => {
  const client = new TwitterClient(process.env.TWITTER_BEARER_TOKEN);

  describe('fetchUserTweets', () => {
    it('fetches tweets for specified user', async () => {
      server.use(
        rest.get(
          'https://api.twitter.com/2/users/:id/tweets',
          (req, res, ctx) => {
            return res(
              ctx.json({
                data: [
                  {
                    id: '1',
                    text: 'Kane to Bayern Munich!',
                    created_at: '2025-06-26T08:00:00.000Z',
                  },
                ],
              })
            );
          }
        )
      );

      const tweets = await client.fetchUserTweets('FabrizioRomano');

      expect(tweets).toHaveLength(1);
      expect(tweets[0].text).toContain('Kane');
    });

    it('handles rate limiting gracefully', async () => {
      server.use(
        rest.get(
          'https://api.twitter.com/2/users/:id/tweets',
          (req, res, ctx) => {
            return res(
              ctx.status(429),
              ctx.json({ error: 'Rate limit exceeded' })
            );
          }
        )
      );

      await expect(client.fetchUserTweets('FabrizioRomano')).rejects.toThrow(
        'Rate limit exceeded'
      );
    });
  });
});
```

---

## End-to-End Testing

### Playwright Configuration

**E2E Test Setup:**

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['junit', { outputFile: 'test-results/junit.xml' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### User Journey Tests

**Newsletter Subscription Flow:**

```typescript
// tests/e2e/newsletter-subscription.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Newsletter Subscription', () => {
  test('user can subscribe to newsletter', async ({ page }) => {
    await page.goto('/');

    // Find and fill newsletter signup form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.click('[data-testid="subscribe-button"]');

    // Check for success message
    await expect(
      page.locator('[data-testid="subscription-success"]')
    ).toBeVisible();

    // Verify confirmation email sent (mock email service)
    await expect(page.locator('text=Please check your email')).toBeVisible();
  });

  test('prevents invalid email addresses', async ({ page }) => {
    await page.goto('/');

    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.click('[data-testid="subscribe-button"]');

    await expect(page.locator('[data-testid="email-error"]')).toContainText(
      'Please enter a valid email'
    );
  });

  test('handles duplicate subscriptions gracefully', async ({ page }) => {
    await page.goto('/');

    // First subscription
    await page.fill('[data-testid="email-input"]', 'existing@example.com');
    await page.click('[data-testid="subscribe-button"]');

    // Wait for success, then try again
    await expect(
      page.locator('[data-testid="subscription-success"]')
    ).toBeVisible();

    // Second attempt with same email
    await page.fill('[data-testid="email-input"]', 'existing@example.com');
    await page.click('[data-testid="subscribe-button"]');

    await expect(page.locator('text=You are already subscribed')).toBeVisible();
  });
});
```

**Article Browsing Tests:**

```typescript
// tests/e2e/article-browsing.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Article Browsing', () => {
  test('user can browse morning briefings', async ({ page }) => {
    await page.goto('/morning');

    // Check page title and content
    await expect(page).toHaveTitle(/Morning Brief/);
    await expect(page.locator('h1')).toContainText('Morning Briefings');

    // Verify article cards are present
    const articleCards = page.locator('[data-testid="article-card"]');
    await expect(articleCards).toHaveCount.atLeast(1);

    // Check article card content
    const firstCard = articleCards.first();
    await expect(firstCard.locator('h2')).toBeVisible();
    await expect(
      firstCard.locator('[data-testid="publish-date"]')
    ).toBeVisible();
    await expect(firstCard.locator('a')).toHaveAttribute(
      'href',
      /\/articles\//
    );
  });

  test('user can read full article', async ({ page }) => {
    await page.goto('/morning');

    // Click on first article
    await page.click('[data-testid="article-card"] a');

    // Verify article page loads
    await expect(page.locator('article')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('[data-testid="article-content"]')).toBeVisible();

    // Check for social sharing buttons
    await expect(page.locator('[data-testid="share-twitter"]')).toBeVisible();

    // Verify back navigation works
    await page.goBack();
    await expect(page.locator('h1')).toContainText('Morning Briefings');
  });

  test('search functionality works correctly', async ({ page }) => {
    await page.goto('/');

    // Use search feature
    await page.fill('[data-testid="search-input"]', 'Kane');
    await page.press('[data-testid="search-input"]', 'Enter');

    // Verify search results
    await expect(page).toHaveURL(/\/search\?q=Kane/);
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();

    // Check that results contain search term
    const searchResults = page.locator('[data-testid="search-result"]');
    await expect(searchResults).toHaveCount.atLeast(1);

    const firstResult = searchResults.first();
    await expect(firstResult).toContainText('Kane', { ignoreCase: true });
  });
});
```

### Performance Tests

**Core Web Vitals Testing:**

```typescript
// tests/e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('homepage meets Core Web Vitals thresholds', async ({ page }) => {
    // Navigate and measure performance
    const response = await page.goto('/', { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);

    // Measure Largest Contentful Paint (LCP)
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            resolve(entries[entries.length - 1].startTime);
          }
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });

    expect(lcp).toBeLessThan(2500); // LCP should be < 2.5s

    // Check for layout shifts
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          resolve(clsValue);
        });
        observer.observe({ entryTypes: ['layout-shift'] });

        setTimeout(() => resolve(clsValue), 5000);
      });
    });

    expect(cls).toBeLessThan(0.1); // CLS should be < 0.1
  });

  test('article pages load quickly', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/articles/test-article');
    await page.waitForSelector('article');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Page should load in < 3s
  });
});
```

---

## Performance Testing

### Load Testing with Artillery

**Load Test Configuration:**

```yaml
# artillery-config.yml
config:
  target: 'https://transferjuice.com'
  phases:
    - duration: 60
      arrivalRate: 10
      name: 'Warm up'
    - duration: 120
      arrivalRate: 50
      name: 'Ramp up load'
    - duration: 300
      arrivalRate: 100
      name: 'Sustained load'
  defaults:
    headers:
      User-Agent: 'Transfer Juice Load Test'

scenarios:
  - name: 'Homepage and article browsing'
    weight: 70
    flow:
      - get:
          url: '/'
      - think: 3
      - get:
          url: '/morning'
      - think: 5
      - get:
          url: '/api/articles?limit=10'

  - name: 'Newsletter subscription'
    weight: 20
    flow:
      - post:
          url: '/api/subscribe'
          json:
            email: 'test-{{ $randomString() }}@example.com'

  - name: 'Search functionality'
    weight: 10
    flow:
      - get:
          url: '/api/search?q=Kane'
      - think: 2
      - get:
          url: '/api/search?q=transfer'
```

**Performance Monitoring:**

```typescript
// src/lib/performance-monitor.ts
export class PerformanceMonitor {
  static logMetrics(name: string, startTime: number) {
    const duration = performance.now() - startTime;

    console.log({
      metric: name,
      duration,
      timestamp: new Date().toISOString(),
    });

    // Send to analytics if in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(name, duration);
    }
  }

  private static sendToAnalytics(name: string, duration: number) {
    // Implementation for sending metrics to monitoring service
  }
}
```

---

## Security Testing

### Security Test Cases

**API Security Tests:**

```typescript
// tests/security/api-security.test.ts
import { test, expect } from '@playwright/test';

test.describe('API Security', () => {
  test('API endpoints require authentication', async ({ request }) => {
    const response = await request.post('/api/articles', {
      data: {
        title: 'Unauthorized Article',
        content: 'Should not be created',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('API validates input data', async ({ request }) => {
    // Attempt SQL injection
    const maliciousData = {
      title: "'; DROP TABLE articles; --",
      content: 'Malicious content',
    };

    const response = await request.post('/api/articles', {
      data: maliciousData,
      headers: {
        Authorization: 'Bearer valid-token',
      },
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toContain('Invalid input');
  });

  test('API implements rate limiting', async ({ request }) => {
    // Make multiple rapid requests
    const requests = Array(100)
      .fill(null)
      .map(() => request.get('/api/articles'));

    const responses = await Promise.all(requests);

    // At least some should be rate limited
    const rateLimited = responses.filter((r) => r.status() === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

### XSS Protection Tests

**Cross-Site Scripting Prevention:**

```typescript
// tests/security/xss-protection.test.ts
import { test, expect } from '@playwright/test';

test.describe('XSS Protection', () => {
  test('user input is properly sanitized', async ({ page }) => {
    await page.goto('/');

    // Attempt to inject script in search
    const maliciousScript = '<script>alert("XSS")</script>';
    await page.fill('[data-testid="search-input"]', maliciousScript);
    await page.press('[data-testid="search-input"]', 'Enter');

    // Verify script is not executed
    let alertFired = false;
    page.on('dialog', async (dialog) => {
      alertFired = true;
      await dialog.accept();
    });

    await page.waitForTimeout(1000);
    expect(alertFired).toBe(false);

    // Verify content is escaped
    const searchResults = page.locator('[data-testid="search-query"]');
    await expect(searchResults).toContainText('&lt;script&gt;');
  });
});
```

---

## Visual Regression Testing

### Percy Integration

**Visual Testing Setup:**

```typescript
// tests/visual/visual-regression.spec.ts
import { test } from '@playwright/test';
import { percySnapshot } from '@percy/playwright';

test.describe('Visual Regression Tests', () => {
  test('homepage renders correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'Homepage - Desktop');
  });

  test('dark mode article page', async ({ page }) => {
    await page.goto('/articles/sample-article');
    await page.waitForLoadState('networkidle');

    await percySnapshot(page, 'Article Page - Dark Mode');
  });

  test('mobile newsletter signup', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await percySnapshot(page, 'Newsletter Signup - Mobile');
  });
});
```

---

## AI-Assisted Test Generation

### Test Generation Prompts

**Unit Test Generation:**

```typescript
// AI prompt for generating unit tests
const generateUnitTestPrompt = `
Generate comprehensive unit tests for the following TypeScript function:

${functionCode}

Requirements:
- Use Jest and React Testing Library
- Test all code paths and edge cases
- Include error scenarios
- Mock external dependencies
- Follow AAA pattern (Arrange, Act, Assert)
- Achieve 100% code coverage

Output format: Complete test file with proper imports and setup.
`;
```

**Integration Test Generation:**

```typescript
// AI prompt for integration tests
const generateIntegrationTestPrompt = `
Generate integration tests for the following API endpoint:

${apiEndpointCode}

Requirements:
- Test database interactions
- Validate request/response schemas
- Test error handling and edge cases
- Mock external API calls
- Include authentication testing
- Test rate limiting if applicable

Database: PostgreSQL with Prisma ORM
Framework: Next.js App Router
`;
```

---

## Continuous Integration Testing

### GitHub Actions CI

**Test Pipeline Configuration:**

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: |
          npx prisma migrate deploy
          npx prisma db seed
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test Data Management

### Test Database Setup

**Database Seeding for Tests:**

```typescript
// prisma/test-seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedTestData() {
  // Clean existing data
  await prisma.article.deleteMany();
  await prisma.tweet.deleteMany();
  await prisma.subscriber.deleteMany();

  // Create test articles
  const articles = await Promise.all([
    prisma.article.create({
      data: {
        title: 'Morning Transfer Roundup',
        content: 'Test content for morning briefing...',
        briefing_type: 'morning',
        published_at: new Date('2025-06-26T08:00:00Z'),
      },
    }),
    prisma.article.create({
      data: {
        title: 'Afternoon Update',
        content: 'Test content for afternoon briefing...',
        briefing_type: 'afternoon',
        published_at: new Date('2025-06-26T14:00:00Z'),
      },
    }),
  ]);

  // Create test subscribers
  await prisma.subscriber.create({
    data: {
      email: 'test@example.com',
      verified: true,
      subscribed_at: new Date(),
    },
  });

  return { articles };
}

// Auto-run when executed directly
if (require.main === module) {
  seedTestData()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
```

### Test Environment Management

**Environment-Specific Test Configuration:**

```typescript
// src/config/test-config.ts
export const testConfig = {
  database: {
    url:
      process.env.TEST_DATABASE_URL ||
      'postgresql://postgres:test@localhost:5432/test_db',
  },
  apis: {
    twitter: {
      bearerToken: 'test_bearer_token',
      baseUrl: 'http://localhost:3001', // Mock server
    },
    openai: {
      apiKey: 'test_openai_key',
      baseUrl: 'http://localhost:3002', // Mock server
    },
  },
  email: {
    provider: 'mock',
    apiKey: 'test_email_key',
  },
};
```

---

## Test Reporting and Metrics

### Coverage Reporting

**Coverage Configuration:**

```json
{
  "scripts": {
    "test:coverage": "jest --coverage --watchAll=false",
    "test:coverage:watch": "jest --coverage --watch",
    "test:coverage:threshold": "jest --coverage --coverageThreshold='{\"global\":{\"branches\":90,\"functions\":90,\"lines\":90,\"statements\":90}}'"
  }
}
```

### Quality Gates

**Test Quality Requirements:**

- Unit test coverage: ≥90%
- Integration test coverage: ≥85%
- E2E test success rate: 100%
- Performance tests: Pass all thresholds
- Security tests: Zero critical findings
- Visual regression: Zero unexpected changes

### Metrics Dashboard

**Key Testing Metrics:**

- Test execution time trends
- Flaky test identification
- Coverage trends over time
- Bug escape rate
- Test maintenance overhead
- Performance benchmark trends

---

This comprehensive testing strategy ensures Transfer Juice maintains high quality, performance, and reliability standards throughout development and production deployment.
