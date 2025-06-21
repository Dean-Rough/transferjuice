# Transfer Juice Development Workflow

## Overview

This document defines the development workflow for Transfer Juice, establishing consistent practices for feature development, code review, testing, and deployment. Our workflow emphasizes quality, collaboration, and efficient delivery while maintaining the highest standards for this automated Premier League transfer digest.

**App Strapline:** _"All of the ITK rumours, for people who swear they're not obsessed with transfers."_

---

## Git Workflow

### Branch Strategy

**Main Branches:**

- `main` - Production-ready code, auto-deploys to transferjuice.com
- `staging` - Integration testing, auto-deploys to staging environment
- `develop` - Integration branch for features

**Feature Branches:**

- `feature/brief-generation` - New feature development
- `fix/email-delivery-bug` - Bug fixes
- `refactor/twitter-api-client` - Code refactoring
- `docs/api-specification` - Documentation updates

### Branch Naming Conventions

```bash
# Feature development
feature/brief-automation
feature/search-functionality
feature/email-templates

# Bug fixes
fix/rate-limiting-issue
fix/mobile-responsive-header
fix/newsletter-signup-validation

# Hotfixes (urgent production fixes)
hotfix/email-delivery-failure
hotfix/api-timeout-handling

# Refactoring
refactor/database-queries
refactor/ai-processing-pipeline

# Documentation
docs/deployment-guide
docs/api-documentation
```

### Commit Message Format

**Conventional Commits:**

```bash
# Format: type(scope): description
feat(email): add dark mode newsletter templates
fix(api): resolve Twitter rate limiting issue
docs(readme): update installation instructions
test(units): add comprehensive article service tests
refactor(db): optimize query performance
style(ui): update header typography weights
perf(api): implement response caching
ci(deploy): add automated security scanning

# Breaking changes
feat(api)!: migrate to Twitter API v2
```

**Detailed Examples:**

```bash
feat(brief-generation): implement AI-powered morning brief creation

- Add GPT-4 integration for content generation
- Implement Joel Golby style prompts
- Add quality validation and fallback mechanisms
- Include comprehensive error handling and logging

Closes #123, #124
```

---

## Feature Development Process

### 1. Planning and Design

**Feature Planning Checklist:**

- [ ] Feature requirements documented in PRD
- [ ] Technical design reviewed and approved
- [ ] Database schema changes identified
- [ ] API changes documented
- [ ] Testing strategy defined
- [ ] Performance impact assessed

**Design Review Process:**

1. Create feature specification document
2. Review with team and stakeholders
3. Create technical design document
4. Estimate development effort
5. Plan implementation phases

### 2. Development Setup

**Starting New Feature:**

```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/newsletter-personalization

# Set up development environment
npm install
npx prisma generate
npm run db:reset

# Start development server
npm run dev
```

**Development Standards:**

- Write tests before implementation (TDD)
- Follow TypeScript strict mode requirements
- Use Zod schemas for data validation
- Implement proper error handling
- Add comprehensive logging

### 3. Implementation Guidelines

**Code Quality Standards:**

```typescript
// ✅ Good: Proper TypeScript with error handling
export async function createArticle(
  data: CreateArticleInput
): Promise<Article> {
  try {
    const validatedData = CreateArticleSchema.parse(data);

    const article = await prisma.article.create({
      data: {
        ...validatedData,
        published_at: new Date(),
      },
    });

    logger.info('Article created successfully', { articleId: article.id });
    return article;
  } catch (error) {
    logger.error('Failed to create article', { error, data });
    throw new Error('Article creation failed');
  }
}

// ❌ Bad: No validation, poor error handling
export async function createArticle(data: any) {
  const article = await prisma.article.create({ data });
  return article;
}
```

**Testing Requirements:**

```typescript
// Write tests first, then implement
describe('ArticleService.createArticle', () => {
  it('creates article with valid data', async () => {
    const articleData = {
      title: 'Test Article',
      content: 'Test content',
      briefing_type: 'morning',
    };

    const article = await ArticleService.createArticle(articleData);

    expect(article.id).toBeDefined();
    expect(article.title).toBe(articleData.title);
  });

  it('throws error for invalid data', async () => {
    const invalidData = { title: '' }; // Missing required fields

    await expect(ArticleService.createArticle(invalidData)).rejects.toThrow(
      'Validation failed'
    );
  });
});
```

### 4. Code Review Process

**Pull Request Requirements:**

- [ ] All tests passing
- [ ] Code coverage ≥90%
- [ ] ESLint and Prettier checks pass
- [ ] TypeScript compilation successful
- [ ] Documentation updated
- [ ] Breaking changes documented

**PR Template:**

```markdown
## Description

Brief description of changes and motivation.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist

- [ ] My code follows the style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Screenshots

If applicable, add screenshots to help explain your changes.

## Additional Notes

Any additional information, deployment notes, or breaking changes.
```

---

## Development Environment

### Local Development Setup

**Environment Configuration:**

```bash
# .env.local (development environment)
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/transfer_juice_dev"

# API Keys (development/sandbox)
TWITTER_BEARER_TOKEN="dev_bearer_token"
OPENAI_API_KEY="sk-dev-openai-key"

# Email Service (test mode)
CONVERTKIT_API_KEY="dev_convertkit_key"
CONVERTKIT_FORM_ID="dev_form_id"

# Debugging
DEBUG=true
LOG_LEVEL=debug
```

**Development Scripts:**

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:debug": "NODE_OPTIONS='--inspect' next dev",
    "dev:turbo": "next dev --turbo",

    "db:studio": "npx prisma studio",
    "db:reset": "npx prisma migrate reset --force",
    "db:seed": "npx prisma db seed",

    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e:headed": "playwright test --headed",

    "lint:fix": "eslint . --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write ."
  }
}
```

### Development Tools

**VS Code Configuration:**

```json
// .vscode/settings.json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

**Recommended Extensions:**

```json
// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-playwright.playwright"
  ]
}
```

---

## Testing Workflow

### Test-Driven Development (TDD)

**TDD Cycle Implementation:**

```bash
# 1. Red: Write failing test
npm run test:watch -- --testNamePattern="should create article"

# 2. Green: Make test pass (minimal implementation)
# Implement just enough code to pass the test

# 3. Refactor: Improve code quality
# Clean up implementation while keeping tests green

# 4. Repeat for next requirement
```

**Testing Checklist:**

- [ ] Unit tests for all new functions/components
- [ ] Integration tests for API routes
- [ ] E2E tests for user workflows
- [ ] Performance tests for critical paths
- [ ] Security tests for sensitive operations

### Continuous Testing

**Pre-commit Testing:**

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint
npm run type-check
npm run test:ci
```

**CI Testing Pipeline:**

```yaml
# Automated testing on every PR
name: Test Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:coverage
      - run: npm run test:e2e
```

---

## Code Review Guidelines

### Review Checklist

**Technical Review:**

- [ ] Code follows project conventions and style guide
- [ ] Functions are properly typed with TypeScript
- [ ] Error handling is comprehensive and appropriate
- [ ] Performance considerations addressed
- [ ] Security implications reviewed
- [ ] Database queries optimized
- [ ] API endpoints properly validated

**Testing Review:**

- [ ] Adequate test coverage (≥90%)
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] Integration points tested
- [ ] Performance impact assessed

**Documentation Review:**

- [ ] Code is self-documenting with clear variable/function names
- [ ] Complex logic includes comments
- [ ] API changes documented
- [ ] README updated if needed

### Review Process

**Reviewer Assignment:**

- Frontend changes: UI/UX specialist + Senior developer
- Backend changes: Lead developer + DevOps engineer
- Database changes: Senior developer + Database specialist
- Security changes: Security specialist + Lead developer

**Review Timeline:**

- Minor changes (< 50 lines): 4 hours
- Standard changes (50-200 lines): 24 hours
- Major changes (> 200 lines): 48 hours
- Breaking changes: 72 hours + architecture review

---

## Database Development

### Schema Changes

**Migration Workflow:**

```bash
# 1. Make schema changes in prisma/schema.prisma
# 2. Generate migration
npx prisma migrate dev --name add_analytics_table

# 3. Review generated migration
cat prisma/migrations/*/migration.sql

# 4. Test migration locally
npm run db:reset
npm run test:integration

# 5. Update seed data if needed
npm run db:seed
```

**Migration Best Practices:**

- Always review generated SQL before committing
- Test migrations with production-like data
- Plan rollback strategy for breaking changes
- Document complex migrations
- Use descriptive migration names

### Data Modeling

**Schema Design Guidelines:**

```prisma
// ✅ Good: Descriptive names, proper types, indexes
model Article {
  id           String   @id @default(cuid())
  title        String   @db.VarChar(255)
  content      String   @db.Text
  briefingType BriefingType
  publishedAt  DateTime @default(now()) @map("published_at")

  // Relationships
  tweets       Tweet[]

  // Indexes for performance
  @@index([publishedAt])
  @@index([briefingType, publishedAt])
  @@map("articles")
}

enum BriefingType {
  morning
  afternoon
  evening

  @@map("briefing_type")
}
```

---

## API Development

### API Design Standards

**RESTful Conventions:**

```typescript
// ✅ Good: RESTful design with proper status codes
// GET /api/articles - List articles
// GET /api/articles/[id] - Get specific article
// POST /api/articles - Create article
// PATCH /api/articles/[id] - Update article
// DELETE /api/articles/[id] - Delete article

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 10;

    const articles = await ArticleService.getRecent(limit);

    return NextResponse.json({
      articles,
      pagination: {
        limit,
        hasMore: articles.length === limit,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch articles', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Validation and Error Handling:**

```typescript
// Input validation with Zod
const CreateArticleSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  briefingType: z.enum(['morning', 'afternoon', 'evening']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateArticleSchema.parse(body);

    const article = await ArticleService.create(validatedData);

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to create article', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Performance Optimization

### Development Performance

**Bundle Analysis:**

```bash
# Analyze bundle size regularly
ANALYZE=true npm run build

# Check for unnecessary dependencies
npx depcheck

# Optimize images
npx @next/bundle-analyzer
```

**Database Optimization:**

```typescript
// ✅ Good: Optimized query with proper selection
export async function getRecentArticles(limit: number = 10) {
  return prisma.article.findMany({
    take: limit,
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      title: true,
      briefingType: true,
      publishedAt: true,
      // Only select needed fields
    },
    where: {
      published: true,
    },
  });
}

// ❌ Bad: Fetches all fields
export async function getRecentArticles(limit: number = 10) {
  return prisma.article.findMany({
    take: limit,
    orderBy: { publishedAt: 'desc' },
  });
}
```

### Monitoring and Profiling

**Performance Monitoring:**

```typescript
// lib/performance.ts
export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = performance.now();

    try {
      const result = await fn();
      const end = performance.now();

      logger.info('Performance measurement', {
        operation: name,
        duration: end - start,
      });

      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

// Usage
const articles = await measurePerformance('fetch-recent-articles', () =>
  ArticleService.getRecent(10)
);
```

---

## Security Development

### Security Guidelines

**Input Validation:**

```typescript
// ✅ Always validate and sanitize inputs
export function sanitizeHtml(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
    ALLOWED_ATTR: ['href'],
  });
}

// ✅ Use parameterized queries (Prisma handles this)
const articles = await prisma.article.findMany({
  where: {
    title: {
      contains: searchTerm, // Safe with Prisma
    },
  },
});
```

**Authentication and Authorization:**

```typescript
// API route protection
export async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing authorization header');
  }

  const token = authHeader.substring(7);

  // Validate token (implement your auth logic)
  const user = await validateToken(token);

  if (!user) {
    throw new Error('Invalid token');
  }

  return user;
}
```

### Security Testing

**Security Test Examples:**

```typescript
// Test for XSS protection
test('prevents XSS in article content', async () => {
  const maliciousContent = '<script>alert("XSS")</script>';

  const sanitized = sanitizeHtml(maliciousContent);

  expect(sanitized).not.toContain('<script>');
  expect(sanitized).not.toContain('alert');
});

// Test for SQL injection (though Prisma protects against this)
test('handles malicious search terms safely', async () => {
  const maliciousSearch = "'; DROP TABLE articles; --";

  const articles = await ArticleService.search(maliciousSearch);

  // Should return empty results, not throw error
  expect(articles).toEqual([]);
});
```

---

## Documentation Standards

### Code Documentation

**TSDoc Comments:**

````typescript
/**
 * Creates a new article with AI-generated content
 *
 * @param tweets - Source tweets for content generation
 * @param briefingType - Type of briefing (morning/afternoon/evening)
 * @param options - Additional configuration options
 * @returns Promise resolving to created article
 *
 * @throws {ValidationError} When input data is invalid
 * @throws {AIServiceError} When content generation fails
 *
 * @example
 * ```typescript
 * const article = await generateArticle(tweets, 'morning', {
 *   style: 'joel-golby',
 *   maxLength: 1000
 * });
 * ```
 */
export async function generateArticle(
  tweets: Tweet[],
  briefingType: BriefingType,
  options: GenerationOptions = {}
): Promise<Article> {
  // Implementation...
}
````

### API Documentation

**Automatic OpenAPI Generation:**

```typescript
// Using Zod schemas for automatic API docs
export const ArticleResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  briefingType: z.enum(['morning', 'afternoon', 'evening']),
  publishedAt: z.date(),
});

// Generate OpenAPI spec automatically
export const openApiSpec = generateOpenApiSpec({
  paths: {
    '/api/articles': {
      get: {
        responses: {
          200: {
            schema: z.object({
              articles: z.array(ArticleResponseSchema),
            }),
          },
        },
      },
    },
  },
});
```

---

## Deployment Workflow

### Feature Deployment

**Deployment Pipeline:**

```bash
# 1. Feature complete and tested
git checkout feature/new-feature
npm run test:all
npm run build

# 2. Create pull request
git push origin feature/new-feature
# Open PR via GitHub interface

# 3. Code review and approval
# Reviews by designated team members

# 4. Merge to staging
git checkout staging
git merge feature/new-feature
git push origin staging
# Auto-deploys to staging environment

# 5. Staging validation
npm run test:staging
# Manual QA testing

# 6. Production deployment
git checkout main
git merge staging
git push origin main
# Auto-deploys to production
```

### Hotfix Workflow

**Emergency Production Fixes:**

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# 2. Implement minimal fix
# Make only necessary changes
npm run test:all

# 3. Deploy to staging first
git push origin hotfix/critical-bug-fix
# Create PR to staging, expedited review

# 4. Test on staging
npm run test:staging

# 5. Deploy to production
# Create PR to main, immediate review and merge
```

---

## Quality Assurance

### Definition of Done

**Feature Completion Checklist:**

- [ ] Functionality implemented according to requirements
- [ ] Unit tests written and passing (≥90% coverage)
- [ ] Integration tests written and passing
- [ ] E2E tests updated if needed
- [ ] Code review completed and approved
- [ ] Documentation updated
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Browser compatibility tested
- [ ] Mobile responsiveness verified

### Quality Gates

**Automated Quality Checks:**

- ESLint: Zero errors, warnings reviewed
- TypeScript: Strict mode, zero compilation errors
- Tests: ≥90% coverage, all tests passing
- Performance: Lighthouse score ≥90
- Security: No critical vulnerabilities
- Bundle size: Within defined limits

**Manual Quality Checks:**

- User experience review
- Cross-browser testing
- Mobile device testing
- Content quality review
- Accessibility testing

---

This development workflow ensures consistent, high-quality development practices for Transfer Juice while maintaining our brand voice and technical excellence standards.
