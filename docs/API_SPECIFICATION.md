# Transfer Juice API Specification

Version: 1.0.0  
Last Updated: 2025-06-26

## Overview

The Transfer Juice API provides programmatic access to the latest Premier League transfer news, articles, newsletters, and analytics. This specification details the available endpoints, authentication scheme, data contracts, compliance measures, and integration examples.

**Base URL:** `https://api.transferjuice.com/v1`

---

## Authentication

The Transfer Juice API uses API keys for authentication. API keys should be included in the `Authorization` header of each request:

```
Authorization: Bearer <api_key>
```

### API Key Types

1. **Admin Keys** - Full CRUD access to all resources, analytics, and configuration. Carefully protect these keys and do not share them publicly.
2. **Public Keys** - Read-only access to published articles and limited search functionality. These keys can be shared with external parties.

To obtain an API key, please contact api@transferjuice.com.

---

## API Versioning

The Transfer Juice API uses URL path versioning with the `/v1/` prefix. This allows for future API evolution while maintaining backward compatibility.

**Current Version:** v1.0.0  
**Deprecation Policy:** Versions will be supported for a minimum of 12 months after deprecation notice.

---

## OpenAPI 3.0 Specification

```yaml
openapi: 3.0.0
info:
  title: Transfer Juice API
  version: 1.0.0
  description: The premier API for Premier League transfer news and analysis
  contact:
    name: Transfer Juice API Team
    email: api@transferjuice.com
    url: https://transferjuice.com/contact
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.transferjuice.com/v1
    description: Production server
  - url: https://staging-api.transferjuice.com/v1
    description: Staging server

paths:
  /articles:
    get:
      summary: List articles
      description: Retrieve a paginated list of published articles
      tags:
        - Articles
      parameters:
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
        - in: query
          name: briefing_type
          schema:
            type: string
            enum: [morning, afternoon, evening]
          description: Filter by briefing type
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ArticleList'
              example:
                data:
                  - id: 'd8ba3490-0f3d-4852-ba1c-5a06de6623ca'
                    title: "Transfer Roundup: Kane's Next Move"
                    content: "The latest on Harry Kane's potential transfer..."
                    author: 'Transfer Juice'
                    briefing_type: 'morning'
                    published_at: '2025-06-26T08:00:00.000Z'
                nextCursor: 'eyJpZCI6Im5leHRfaWQifQ'

  /articles/{articleId}:
    get:
      summary: Get article by ID
      description: Retrieve a specific article by its unique identifier
      tags:
        - Articles
      parameters:
        - $ref: '#/components/parameters/ArticleId'
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Article'
        '404':
          $ref: '#/components/responses/NotFoundError'

  /search:
    get:
      summary: Search articles
      description: Full-text search across article content with relevance scoring
      tags:
        - Search
      parameters:
        - in: query
          name: q
          required: true
          schema:
            type: string
            minLength: 3
            maxLength: 100
          description: Search query
          example: 'Kane transfer Liverpool'
        - $ref: '#/components/parameters/Cursor'
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SearchResults'
        '400':
          description: Invalid search query

  /subscribe:
    post:
      summary: Subscribe to newsletter
      description: Subscribe an email address to the Transfer Juice newsletter
      tags:
        - Newsletter
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SubscribeRequest'
            example:
              email: 'fan@example.com'
      responses:
        '200':
          description: Successfully subscribed
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: 'Successfully subscribed to Transfer Juice newsletter'
        '400':
          description: Invalid email or already subscribed
        '429':
          description: Rate limit exceeded

  /unsubscribe:
    post:
      summary: Unsubscribe from newsletter
      description: Remove an email address from the newsletter subscription
      tags:
        - Newsletter
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UnsubscribeRequest'
      responses:
        '200':
          description: Successfully unsubscribed
        '400':
          description: Invalid email or not subscribed

  /preferences/{email}:
    get:
      summary: Get newsletter preferences
      description: Retrieve newsletter preferences for a subscriber
      tags:
        - Newsletter
      parameters:
        - in: path
          name: email
          required: true
          schema:
            type: string
            format: email
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Preferences'
        '404':
          description: Subscriber not found
    put:
      summary: Update newsletter preferences
      description: Update newsletter preferences for a subscriber
      tags:
        - Newsletter
      parameters:
        - in: path
          name: email
          required: true
          schema:
            type: string
            format: email
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Preferences'
      responses:
        '200':
          description: Preferences updated successfully
        '400':
          description: Invalid preferences data
        '404':
          description: Subscriber not found

  /admin/articles:
    post:
      summary: Create article
      description: Create a new article (admin only)
      tags:
        - Admin
      security:
        - adminAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateArticle'
      responses:
        '201':
          description: Article created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Article'
        '400':
          description: Invalid article data
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /admin/articles/{articleId}:
    put:
      summary: Update article
      description: Update an existing article (admin only)
      tags:
        - Admin
      security:
        - adminAuth: []
      parameters:
        - $ref: '#/components/parameters/ArticleId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateArticle'
      responses:
        '200':
          description: Article updated successfully
        '404':
          $ref: '#/components/responses/NotFoundError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
    delete:
      summary: Delete article
      description: Delete an article (admin only)
      tags:
        - Admin
      security:
        - adminAuth: []
      parameters:
        - $ref: '#/components/parameters/ArticleId'
      responses:
        '204':
          description: Article deleted successfully
        '404':
          $ref: '#/components/responses/NotFoundError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /admin/analytics:
    get:
      summary: Get analytics data
      description: Retrieve comprehensive analytics and performance metrics
      tags:
        - Admin
      security:
        - adminAuth: []
      parameters:
        - in: query
          name: timeframe
          schema:
            type: string
            enum: [day, week, month, year]
          description: Analytics timeframe
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Analytics'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /admin/pipeline/status:
    get:
      summary: Get content pipeline status
      description: Check the status of the automated content generation pipeline
      tags:
        - Admin
      security:
        - adminAuth: []
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PipelineStatus'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /admin/pipeline/trigger:
    post:
      summary: Trigger pipeline run
      description: Manually trigger the content generation pipeline
      tags:
        - Admin
      security:
        - adminAuth: []
      requestBody:
        required: false
        content:
          application/json:
            schema:
              type: object
              properties:
                briefing_type:
                  type: string
                  enum: [morning, afternoon, evening]
                force:
                  type: boolean
                  description: Force pipeline run even if recently executed
      responses:
        '200':
          description: Pipeline triggered successfully
        '409':
          description: Pipeline already running
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /admin/config:
    get:
      summary: Get system configuration
      description: Retrieve current system configuration settings
      tags:
        - Admin
      security:
        - adminAuth: []
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SystemConfig'
    put:
      summary: Update system configuration
      description: Update system configuration settings
      tags:
        - Admin
      security:
        - adminAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SystemConfig'
      responses:
        '200':
          description: Configuration updated successfully
        '400':
          description: Invalid configuration data

  /health:
    get:
      summary: Health check
      description: Check API and dependent service health
      tags:
        - Monitoring
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthCheck'
        '503':
          description: Service unhealthy

  /metrics:
    get:
      summary: Get service metrics
      description: Retrieve Prometheus-compatible metrics
      tags:
        - Monitoring
      responses:
        '200':
          description: Successful response
          content:
            text/plain:
              schema:
                type: string
              example: |
                # HELP api_requests_total Total API requests
                # TYPE api_requests_total counter
                api_requests_total{method="GET",endpoint="/articles"} 1234

  /cron/briefings:
    post:
      summary: Trigger briefing generation
      description: Cron endpoint to trigger scheduled briefing generation
      tags:
        - Cron
      security:
        - cronAuth: []
      responses:
        '200':
          description: Briefing generation triggered
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /cron/tweets:
    post:
      summary: Trigger tweet fetching
      description: Cron endpoint to fetch latest tweets from ITK sources
      tags:
        - Cron
      security:
        - cronAuth: []
      responses:
        '200':
          description: Tweet fetching triggered
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /webhooks/email:
    post:
      summary: Email service webhook
      description: Webhook endpoint for email delivery notifications
      tags:
        - Webhooks
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EmailEvent'
      responses:
        '200':
          description: Event processed successfully
        '400':
          description: Invalid webhook payload

  /webhooks/external:
    post:
      summary: External service webhook
      description: General webhook endpoint for external service integrations
      tags:
        - Webhooks
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ExternalEvent'
      responses:
        '200':
          description: Event processed successfully
        '400':
          description: Invalid webhook payload

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      description: API key for public endpoints
    adminAuth:
      type: http
      scheme: bearer
      description: Admin API key for privileged operations
    cronAuth:
      type: http
      scheme: bearer
      description: Cron API key for scheduled operations

  parameters:
    ArticleId:
      in: path
      name: articleId
      required: true
      schema:
        type: string
        format: uuid
      description: Unique article identifier
      example: 'd8ba3490-0f3d-4852-ba1c-5a06de6623ca'

    Cursor:
      in: query
      name: cursor
      schema:
        type: string
      description: Pagination cursor for next page
      example: 'eyJpZCI6Im5leHRfaWQifQ'

    Limit:
      in: query
      name: limit
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 20
      description: Number of items to return

  schemas:
    Article:
      type: object
      required:
        - id
        - title
        - content
        - author
        - briefing_type
        - published_at
      properties:
        id:
          type: string
          format: uuid
          description: Unique article identifier
        title:
          type: string
          minLength: 1
          maxLength: 200
          description: Article title
        content:
          type: string
          minLength: 1
          description: Full article content in HTML format
        author:
          type: string
          description: Article author
        briefing_type:
          type: string
          enum: [morning, afternoon, evening]
          description: Type of briefing
        published_at:
          type: string
          format: date-time
          description: Publication timestamp in ISO 8601 format
        tags:
          type: array
          items:
            type: string
          description: Article tags for categorization
        view_count:
          type: integer
          minimum: 0
          description: Number of times article has been viewed
        created_at:
          type: string
          format: date-time
          description: Creation timestamp
        updated_at:
          type: string
          format: date-time
          description: Last update timestamp

    ArticleList:
      type: object
      required:
        - data
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/Article'
        nextCursor:
          type: string
          nullable: true
          description: Cursor for next page (null if no more pages)
        total:
          type: integer
          description: Total number of articles (optional)

    CreateArticle:
      type: object
      required:
        - title
        - content
        - author
        - briefing_type
      properties:
        title:
          type: string
          minLength: 1
          maxLength: 200
        content:
          type: string
          minLength: 1
        author:
          type: string
          minLength: 1
          maxLength: 100
        briefing_type:
          type: string
          enum: [morning, afternoon, evening]
        tags:
          type: array
          items:
            type: string
        published_at:
          type: string
          format: date-time
          description: Scheduled publication time (defaults to now)

    UpdateArticle:
      type: object
      properties:
        title:
          type: string
          minLength: 1
          maxLength: 200
        content:
          type: string
          minLength: 1
        tags:
          type: array
          items:
            type: string

    SearchResults:
      type: object
      required:
        - data
        - query
      properties:
        data:
          type: array
          items:
            allOf:
              - $ref: '#/components/schemas/Article'
              - type: object
                properties:
                  relevance_score:
                    type: number
                    minimum: 0
                    maximum: 1
                    description: Search relevance score
        query:
          type: string
          description: Original search query
        nextCursor:
          type: string
          nullable: true
        total:
          type: integer
          description: Total number of search results

    SubscribeRequest:
      type: object
      required:
        - email
      properties:
        email:
          type: string
          format: email
          description: Subscriber email address
        preferences:
          $ref: '#/components/schemas/SubscriptionPreferences'

    UnsubscribeRequest:
      type: object
      required:
        - email
      properties:
        email:
          type: string
          format: email
          description: Email address to unsubscribe

    Preferences:
      type: object
      properties:
        email_frequency:
          type: string
          enum: [daily, weekly]
          default: daily
          description: Email frequency preference
        teams:
          type: array
          items:
            type: string
          description: Preferred teams for personalized content
        topics:
          type: array
          items:
            type: string
            enum: [transfers, rumors, contracts, loans, medical]
          description: Preferred content topics

    SubscriptionPreferences:
      type: object
      properties:
        email_frequency:
          type: string
          enum: [daily, weekly]
          default: daily
        teams:
          type: array
          items:
            type: string

    Analytics:
      type: object
      properties:
        subscribers:
          type: object
          properties:
            total:
              type: integer
              description: Total number of subscribers
            new_this_period:
              type: integer
              description: New subscribers in selected timeframe
            churn_rate:
              type: number
              description: Churn rate as a percentage
        engagement:
          type: object
          properties:
            open_rate:
              type: number
              minimum: 0
              maximum: 1
              description: Email open rate
            click_rate:
              type: number
              minimum: 0
              maximum: 1
              description: Email click-through rate
            unsubscribe_rate:
              type: number
              minimum: 0
              maximum: 1
              description: Unsubscribe rate
        content:
          type: object
          properties:
            articles_published:
              type: integer
              description: Number of articles published in timeframe
            average_views_per_article:
              type: number
              description: Average views per article
            top_performing_articles:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: string
                    format: uuid
                  title:
                    type: string
                  views:
                    type: integer

    PipelineStatus:
      type: object
      properties:
        running:
          type: boolean
          description: Whether the pipeline is currently running
        last_run_at:
          type: string
          format: date-time
          description: Timestamp of last pipeline execution
        last_run_status:
          type: string
          enum: [success, failure, running]
          description: Status of last pipeline run
        last_run_duration:
          type: integer
          description: Duration of last run in seconds
        next_scheduled_run:
          type: string
          format: date-time
          description: Next scheduled pipeline execution
        current_stage:
          type: string
          description: Current pipeline stage if running
        error_message:
          type: string
          nullable: true
          description: Error message if last run failed

    SystemConfig:
      type: object
      properties:
        itk_accounts:
          type: array
          items:
            type: object
            properties:
              handle:
                type: string
                description: Twitter handle without @
              priority:
                type: integer
                minimum: 1
                maximum: 10
                description: Source priority (1 = highest)
              verified:
                type: boolean
                description: Whether the account is verified
        keywords:
          type: object
          properties:
            transfer_keywords:
              type: array
              items:
                type: string
              description: Keywords for transfer relevance filtering
            exclusion_keywords:
              type: array
              items:
                type: string
              description: Keywords to exclude from processing
        ai_settings:
          type: object
          properties:
            model:
              type: string
              enum: [gpt-4, gpt-4.5, claude-3-opus]
              description: AI model to use for content generation
            temperature:
              type: number
              minimum: 0
              maximum: 1
              description: AI temperature setting
            max_tokens:
              type: integer
              minimum: 1
              description: Maximum tokens for AI generation

    HealthCheck:
      type: object
      properties:
        status:
          type: string
          enum: [healthy, degraded, unhealthy]
          description: Overall service health status
        timestamp:
          type: string
          format: date-time
          description: Health check timestamp
        services:
          type: object
          properties:
            database:
              $ref: '#/components/schemas/ServiceStatus'
            twitter_api:
              $ref: '#/components/schemas/ServiceStatus'
            ai_service:
              $ref: '#/components/schemas/ServiceStatus'
            email_service:
              $ref: '#/components/schemas/ServiceStatus'
        version:
          type: string
          description: API version

    ServiceStatus:
      type: object
      properties:
        status:
          type: string
          enum: [healthy, degraded, unhealthy]
        response_time:
          type: number
          description: Service response time in milliseconds
        error:
          type: string
          nullable: true
          description: Error message if unhealthy

    EmailEvent:
      type: object
      required:
        - type
        - recipient
        - timestamp
      properties:
        type:
          type: string
          enum: [delivered, opened, clicked, bounced, complained]
          description: Type of email event
        recipient:
          type: string
          format: email
          description: Email recipient
        timestamp:
          type: string
          format: date-time
          description: Event timestamp
        message_id:
          type: string
          description: Unique message identifier
        campaign_id:
          type: string
          description: Campaign identifier
        url:
          type: string
          format: uri
          description: Clicked URL (for click events)

    ExternalEvent:
      type: object
      required:
        - type
        - source
        - timestamp
      properties:
        type:
          type: string
          description: Event type
        source:
          type: string
          description: Source system
        timestamp:
          type: string
          format: date-time
          description: Event timestamp
        data:
          type: object
          description: Event-specific data

    Error:
      type: object
      required:
        - error
        - message
      properties:
        error:
          type: string
          description: Error code
        message:
          type: string
          description: Human-readable error message
        details:
          type: object
          description: Additional error details
        timestamp:
          type: string
          format: date-time
          description: Error timestamp

  responses:
    UnauthorizedError:
      description: API key is missing or invalid
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: 'UNAUTHORIZED'
            message: 'Invalid or missing API key'
            timestamp: '2025-06-26T10:30:00.000Z'

    NotFoundError:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: 'NOT_FOUND'
            message: 'The requested resource was not found'
            timestamp: '2025-06-26T10:30:00.000Z'

    RateLimitError:
      description: Rate limit exceeded
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: 'RATE_LIMIT_EXCEEDED'
            message: 'Too many requests. Please try again later.'
            timestamp: '2025-06-26T10:30:00.000Z'

security:
  - bearerAuth: []
```

---

## Data Contracts

All request and response payloads conform to strict data contracts defined with Zod schemas:

```typescript
// schemas/article.ts
import { z } from 'zod';

export const ArticleSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  author: z.string().min(1).max(100),
  briefing_type: z.enum(['morning', 'afternoon', 'evening']),
  published_at: z.string().datetime(),
  tags: z.array(z.string()).optional(),
  view_count: z.number().int().min(0).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const CreateArticleSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  author: z.string().min(1).max(100),
  briefing_type: z.enum(['morning', 'afternoon', 'evening']),
  tags: z.array(z.string()).optional(),
  published_at: z.string().datetime().optional(),
});

export const UpdateArticleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
});

export type Article = z.infer<typeof ArticleSchema>;
export type CreateArticle = z.infer<typeof CreateArticleSchema>;
export type UpdateArticle = z.infer<typeof UpdateArticleSchema>;
```

```typescript
// schemas/newsletter.ts
import { z } from 'zod';

export const SubscribeRequestSchema = z.object({
  email: z.string().email(),
  preferences: z
    .object({
      email_frequency: z.enum(['daily', 'weekly']).default('daily'),
      teams: z.array(z.string()).optional(),
    })
    .optional(),
});

export const PreferencesSchema = z.object({
  email_frequency: z.enum(['daily', 'weekly']),
  teams: z.array(z.string()),
  topics: z
    .array(z.enum(['transfers', 'rumors', 'contracts', 'loans', 'medical']))
    .optional(),
});

export type SubscribeRequest = z.infer<typeof SubscribeRequestSchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;
```

### API Route Implementation Example

```typescript
// app/api/v1/articles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ArticleSchema, CreateArticleSchema } from '@/schemas/article';
import { withAuth } from '@/lib/middleware/auth';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');
    const briefingType = searchParams.get('briefing_type');

    const articles = await prisma.article.findMany({
      where: briefingType ? { briefing_type: briefingType } : undefined,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { published_at: 'desc' },
    });

    const hasNextPage = articles.length > limit;
    const data = hasNextPage ? articles.slice(0, -1) : articles;
    const nextCursor = hasNextPage ? articles[limit].id : null;

    return NextResponse.json({
      data: data.map((article) => ArticleSchema.parse(article)),
      nextCursor,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(
  withRateLimit(async (request: NextRequest) => {
    try {
      const body = await request.json();
      const articleData = CreateArticleSchema.parse(body);

      const article = await prisma.article.create({
        data: {
          ...articleData,
          published_at: articleData.published_at || new Date().toISOString(),
        },
      });

      return NextResponse.json(ArticleSchema.parse(article), { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: 'Invalid article data',
            details: error.errors,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Failed to create article' },
        { status: 500 }
      );
    }
  }),
  { requiredRole: 'admin' }
);
```

---

## Rate Limiting

API requests are subject to rate limits based on the API key type:

| Key Type | Requests/15min | Requests/Day | Burst Limit |
| -------- | -------------- | ------------ | ----------- |
| Public   | 100            | 2,400        | 10          |
| Admin    | 1,000          | 24,000       | 50          |
| Cron     | Unlimited      | Unlimited    | N/A         |

Rate limiting headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Implementation

```typescript
// lib/middleware/rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: { windowMs?: number; max?: number } = {}
) {
  return async (req: NextRequest) => {
    const { windowMs = 15 * 60 * 1000, max = 100 } = options;

    const apiKey = req.headers.get('authorization')?.replace('Bearer ', '');
    const identifier = apiKey || req.ip || 'anonymous';

    const window = Math.floor(Date.now() / windowMs);
    const key = `rate_limit:${identifier}:${window}`;

    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, Math.ceil(windowMs / 1000));
    }

    const remaining = Math.max(0, max - current);
    const resetTime = (window + 1) * windowMs;

    if (current > max) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          timestamp: new Date().toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.floor(resetTime / 1000).toString(),
          },
        }
      );
    }

    const response = await handler(req);

    response.headers.set('X-RateLimit-Limit', max.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set(
      'X-RateLimit-Reset',
      Math.floor(resetTime / 1000).toString()
    );

    return response;
  };
}
```

---

## Security

### Authentication Implementation

```typescript
// lib/middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

interface AuthOptions {
  requiredRole?: 'admin' | 'cron';
  allowPublic?: boolean;
}

export function withAuth(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: AuthOptions = {}
) {
  return async (req: NextRequest) => {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (options.allowPublic) {
        return handler(req);
      }

      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);

    try {
      const payload = verify(token, process.env.JWT_SECRET!) as any;

      if (options.requiredRole && payload.role !== options.requiredRole) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Add user context to request
      (req as any).user = payload;

      return handler(req);
    } catch (error) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  };
}
```

### CORS Configuration

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://transferjuice.com',
  'https://www.transferjuice.com',
  'https://admin.transferjuice.com',
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin || '')
          ? origin!
          : 'null',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const response = NextResponse.next();

  if (ALLOWED_ORIGINS.includes(origin || '')) {
    response.headers.set('Access-Control-Allow-Origin', origin!);
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

### Webhook Security

```typescript
// lib/webhook-security.ts
import crypto from 'crypto';

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
}

// Webhook handler example
export async function handleWebhook(req: NextRequest) {
  const signature = req.headers.get('tj-signature');
  const payload = await req.text();

  if (
    !signature ||
    !verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET!)
  ) {
    return NextResponse.json(
      {
        error: 'INVALID_SIGNATURE',
        message: 'Webhook signature verification failed',
      },
      { status: 401 }
    );
  }

  // Process webhook...
  return NextResponse.json({ received: true });
}
```

---

## Webhooks

Transfer Juice supports real-time event notifications via webhooks with HMAC signature verification.

### Supported Events

| Event                | Description                             |
| -------------------- | --------------------------------------- |
| `article.published`  | New article published                   |
| `article.updated`    | Article content updated                 |
| `article.deleted`    | Article deleted                         |
| `newsletter.sent`    | Newsletter successfully delivered       |
| `newsletter.failed`  | Newsletter delivery failed              |
| `subscriber.added`   | New subscriber joined                   |
| `subscriber.removed` | Subscriber unsubscribed                 |
| `pipeline.completed` | Content pipeline completed successfully |
| `pipeline.failed`    | Content pipeline encountered an error   |

### Event Payload Structure

```json
{
  "id": "webhook_event_uuid",
  "event": "article.published",
  "timestamp": "2025-06-26T10:30:00.000Z",
  "data": {
    "id": "article_uuid",
    "title": "Breaking: Transfer News Update",
    "author": "Transfer Juice",
    "briefing_type": "morning",
    "published_at": "2025-06-26T08:00:00.000Z"
  }
}
```

### Webhook Verification

```typescript
// Your webhook handler
app.post('/webhooks/transfer-juice', (req, res) => {
  const signature = req.headers['tj-signature'];
  const payload = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac('sha256', process.env.TJ_WEBHOOK_SECRET)
    .update(payload, 'utf8')
    .digest('hex');

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  ) {
    return res.status(401).send('Invalid signature');
  }

  // Process the webhook event
  console.log('Received event:', req.body.event);
  res.status(200).send('OK');
});
```

---

## Compliance

### GDPR Compliance

**Data Subject Rights Implementation:**

```typescript
// app/api/v1/gdpr/data-request/route.ts
export async function POST(request: NextRequest) {
  const { email, request_type } = await request.json();

  switch (request_type) {
    case 'access':
      return handleDataAccess(email);
    case 'deletion':
      return handleDataDeletion(email);
    case 'portability':
      return handleDataPortability(email);
    default:
      return NextResponse.json(
        { error: 'INVALID_REQUEST_TYPE' },
        { status: 400 }
      );
  }
}

async function handleDataDeletion(email: string) {
  // Remove from newsletter
  await prisma.subscriber.deleteMany({ where: { email } });

  // Anonymize analytics data
  await prisma.emailEvent.updateMany({
    where: { recipient: email },
    data: { recipient: 'deleted-user@example.com' },
  });

  // Log the deletion for audit purposes
  await prisma.auditLog.create({
    data: {
      action: 'DATA_DELETION',
      subject: email,
      timestamp: new Date(),
    },
  });

  return NextResponse.json({
    message: 'Personal data deleted successfully',
    request_id: crypto.randomUUID(),
  });
}
```

### CCPA Compliance

**Do Not Sell Implementation:**

```typescript
// app/api/v1/ccpa/opt-out/route.ts
export async function POST(request: NextRequest) {
  const { email } = await request.json();

  await prisma.subscriber.upsert({
    where: { email },
    update: {
      ccpa_opt_out: true,
      updated_at: new Date(),
    },
    create: {
      email,
      ccpa_opt_out: true,
      active: false,
    },
  });

  return NextResponse.json({
    message: 'Successfully opted out of data sales',
  });
}
```

### CAN-SPAM Compliance

**Unsubscribe Implementation:**

```typescript
// Every email includes unsubscribe link:
// https://api.transferjuice.com/v1/unsubscribe?email=user@example.com&token=secure_token

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  // Verify unsubscribe token
  if (!verifyUnsubscribeToken(email, token)) {
    return NextResponse.json(
      { error: 'INVALID_UNSUBSCRIBE_TOKEN' },
      { status: 400 }
    );
  }

  // Process unsubscribe
  await prisma.subscriber.update({
    where: { email },
    data: {
      active: false,
      unsubscribed_at: new Date(),
    },
  });

  // Return confirmation page
  return new NextResponse(
    `
    <html>
      <body>
        <h1>Successfully Unsubscribed</h1>
        <p>You have been removed from the Transfer Juice newsletter.</p>
      </body>
    </html>
  `,
    {
      headers: { 'Content-Type': 'text/html' },
    }
  );
}
```

---

## Integration Examples

### Next.js Frontend Integration

```tsx
// lib/transfer-juice-client.ts
class TransferJuiceClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://api.transferjuice.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async getArticles(
    params: {
      cursor?: string;
      limit?: number;
      briefing_type?: 'morning' | 'afternoon' | 'evening';
    } = {}
  ) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, value.toString());
      }
    });

    return this.request<ArticleList>(`/articles?${searchParams}`);
  }

  async getArticle(id: string) {
    return this.request<Article>(`/articles/${id}`);
  }

  async searchArticles(
    query: string,
    params: { cursor?: string; limit?: number } = {}
  ) {
    const searchParams = new URLSearchParams({ q: query, ...params });
    return this.request<SearchResults>(`/search?${searchParams}`);
  }

  async subscribe(email: string, preferences?: SubscriptionPreferences) {
    return this.request('/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email, preferences }),
    });
  }
}

// React hooks for Transfer Juice API
// hooks/use-transfer-juice.ts
import { useState, useEffect } from 'react';

export function useArticles(briefingType?: string) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = new TransferJuiceClient(process.env.NEXT_PUBLIC_TJ_API_KEY!);

    client
      .getArticles({ briefing_type: briefingType as any })
      .then((response) => {
        setArticles(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [briefingType]);

  return { articles, loading, error };
}

// Component example
// components/ArticleList.tsx
export function ArticleList({ briefingType }: { briefingType?: string }) {
  const { articles, loading, error } = useArticles(briefingType);

  if (loading) return <div>Loading articles...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className='space-y-6'>
      {articles.map((article) => (
        <article key={article.id} className='bg-gray-800 p-6 rounded-lg'>
          <h2 className='text-xl font-bold text-white mb-2'>{article.title}</h2>
          <p className='text-gray-300 mb-4'>
            {article.content.substring(0, 200)}...
          </p>
          <div className='flex justify-between text-sm text-gray-400'>
            <span>{article.author}</span>
            <span>{new Date(article.published_at).toLocaleDateString()}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
```

### Python SDK

```python
# transfer_juice_sdk.py
import requests
from typing import Optional, Dict, List, Any
from datetime import datetime

class TransferJuiceClient:
    def __init__(self, api_key: str, base_url: str = "https://api.transferjuice.com/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        })

    def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(method, url, **kwargs)
        response.raise_for_status()
        return response.json()

    def get_articles(self,
                    cursor: Optional[str] = None,
                    limit: int = 20,
                    briefing_type: Optional[str] = None) -> Dict[str, Any]:
        """Retrieve a list of articles."""
        params = {"limit": limit}
        if cursor:
            params["cursor"] = cursor
        if briefing_type:
            params["briefing_type"] = briefing_type

        return self._request("GET", "/articles", params=params)

    def get_article(self, article_id: str) -> Dict[str, Any]:
        """Retrieve a specific article by ID."""
        return self._request("GET", f"/articles/{article_id}")

    def search_articles(self,
                       query: str,
                       cursor: Optional[str] = None,
                       limit: int = 20) -> Dict[str, Any]:
        """Search articles by query."""
        params = {"q": query, "limit": limit}
        if cursor:
            params["cursor"] = cursor

        return self._request("GET", "/search", params=params)

    def subscribe(self, email: str, preferences: Optional[Dict] = None) -> Dict[str, Any]:
        """Subscribe to newsletter."""
        data = {"email": email}
        if preferences:
            data["preferences"] = preferences

        return self._request("POST", "/subscribe", json=data)

    def get_analytics(self, timeframe: str = "week") -> Dict[str, Any]:
        """Get analytics data (admin only)."""
        params = {"timeframe": timeframe}
        return self._request("GET", "/admin/analytics", params=params)

# Usage example
client = TransferJuiceClient("your_api_key")

# Get latest articles
articles = client.get_articles(limit=10)
for article in articles["data"]:
    print(f"{article['title']} - {article['published_at']}")

# Search for specific content
results = client.search_articles("Kane transfer")
print(f"Found {len(results['data'])} articles about Kane transfers")

# Subscribe to newsletter
client.subscribe("fan@example.com", {
    "email_frequency": "daily",
    "teams": ["Manchester United", "Liverpool"]
})
```

### cURL Examples

```bash
# Get all articles
curl -H "Authorization: Bearer your_api_key" \
     "https://api.transferjuice.com/v1/articles"

# Get specific article
curl -H "Authorization: Bearer your_api_key" \
     "https://api.transferjuice.com/v1/articles/article-uuid"

# Search articles
curl -H "Authorization: Bearer your_api_key" \
     "https://api.transferjuice.com/v1/search?q=Kane+transfer"

# Subscribe to newsletter
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"email":"fan@example.com"}' \
     "https://api.transferjuice.com/v1/subscribe"

# Create article (admin)
curl -X POST \
     -H "Authorization: Bearer admin_api_key" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Transfer Update",
       "content": "Latest transfer news...",
       "author": "Transfer Juice",
       "briefing_type": "morning"
     }' \
     "https://api.transferjuice.com/v1/admin/articles"

# Get analytics (admin)
curl -H "Authorization: Bearer admin_api_key" \
     "https://api.transferjuice.com/v1/admin/analytics?timeframe=week"

# Trigger pipeline (admin)
curl -X POST \
     -H "Authorization: Bearer admin_api_key" \
     "https://api.transferjuice.com/v1/admin/pipeline/trigger"
```

---

## Documentation

### Swagger UI Integration

```typescript
// app/docs/page.tsx
'use client';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-[#0A0808]">
      <SwaggerUI
        url="/api/openapi.json"
        deepLinking={true}
        displayOperationId={false}
        defaultModelsExpandDepth={2}
        defaultModelExpandDepth={2}
        docExpansion="list"
        filter={true}
        showExtensions={true}
        showCommonExtensions={true}
        theme={{
          palette: {
            type: 'dark',
            primary: {
              main: '#F2491F',
            },
            background: {
              default: '#0A0808',
              paper: '#1A1A1A',
            },
          },
        }}
      />
    </div>
  );
}
```

### ReDoc Integration

```typescript
// app/redoc/page.tsx
'use client';
import { RedocStandalone } from 'redoc';

export default function RedocPage() {
  return (
    <RedocStandalone
      specUrl="/api/openapi.json"
      options={{
        theme: {
          colors: {
            primary: {
              main: '#F2491F',
            },
            background: {
              main: '#0A0808',
            },
          },
          typography: {
            fontSize: '14px',
            fontFamily: 'Geist, sans-serif',
            code: {
              fontFamily: 'Geist Mono, monospace',
            },
          },
        },
        hideDownloadButton: false,
        disableSearch: false,
        menuToggle: true,
        nativeScrollbars: false,
      }}
    />
  );
}
```

### Postman Collection

```json
{
  "info": {
    "name": "Transfer Juice API",
    "description": "Official Postman collection for Transfer Juice API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{api_key}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "https://api.transferjuice.com/v1",
      "type": "string"
    },
    {
      "key": "api_key",
      "value": "your_api_key_here",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Articles",
      "item": [
        {
          "name": "Get Articles",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/articles?limit=10",
              "host": ["{{base_url}}"],
              "path": ["articles"],
              "query": [
                {
                  "key": "limit",
                  "value": "10"
                }
              ]
            }
          }
        }
      ]
    }
  ]
}
```

---

## Testing

### Unit Testing

```typescript
// __tests__/api/articles.test.ts
import { GET, POST } from '@/app/api/v1/articles/route';
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

describe('/api/v1/articles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('returns paginated articles', async () => {
      const mockArticles = [
        {
          id: 'uuid-1',
          title: 'Test Article',
          content: 'Test content',
          author: 'Test Author',
          briefing_type: 'morning',
          published_at: '2025-06-26T08:00:00.000Z',
        },
      ];

      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      const request = new NextRequest(
        'http://localhost/api/v1/articles?limit=10'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].title).toBe('Test Article');
    });

    it('filters by briefing type', async () => {
      const request = new NextRequest(
        'http://localhost/api/v1/articles?briefing_type=morning'
      );
      await GET(request);

      expect(prisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { briefing_type: 'morning' },
        })
      );
    });
  });

  describe('POST', () => {
    it('creates a new article', async () => {
      const mockArticle = {
        id: 'uuid-1',
        title: 'New Article',
        content: 'New content',
        author: 'Author',
        briefing_type: 'morning',
        published_at: '2025-06-26T08:00:00.000Z',
      };

      (prisma.article.create as jest.Mock).mockResolvedValue(mockArticle);

      const request = new NextRequest('http://localhost/api/v1/articles', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Article',
          content: 'New content',
          author: 'Author',
          briefing_type: 'morning',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe('New Article');
    });
  });
});
```

### Integration Testing

```typescript
// __tests__/integration/api.test.ts
import { testClient } from '@/lib/test-utils';

describe('API Integration Tests', () => {
  it('complete article workflow', async () => {
    // Create article
    const createResponse = await testClient
      .post('/api/v1/admin/articles')
      .send({
        title: 'Integration Test Article',
        content: 'Test content for integration',
        author: 'Test Author',
        briefing_type: 'morning',
      })
      .expect(201);

    const articleId = createResponse.body.id;

    // Get article
    const getResponse = await testClient
      .get(`/api/v1/articles/${articleId}`)
      .expect(200);

    expect(getResponse.body.title).toBe('Integration Test Article');

    // Update article
    await testClient
      .put(`/api/v1/admin/articles/${articleId}`)
      .send({
        title: 'Updated Article Title',
      })
      .expect(200);

    // Verify update
    const updatedResponse = await testClient
      .get(`/api/v1/articles/${articleId}`)
      .expect(200);

    expect(updatedResponse.body.title).toBe('Updated Article Title');

    // Delete article
    await testClient.delete(`/api/v1/admin/articles/${articleId}`).expect(204);

    // Verify deletion
    await testClient.get(`/api/v1/articles/${articleId}`).expect(404);
  });
});
```

### Load Testing

```javascript
// load-test.js (k6)
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 },
    { duration: '5m', target: 10 },
    { duration: '2m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '10m', target: 0 },
  ],
};

const BASE_URL = 'https://api.transferjuice.com/v1';
const API_KEY = 'test_api_key';

export default function () {
  const headers = {
    Authorization: `Bearer ${API_KEY}`,
  };

  // Test getting articles
  let response = http.get(`${BASE_URL}/articles`, { headers });
  check(response, {
    'articles status is 200': (r) => r.status === 200,
    'articles response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test search
  response = http.get(`${BASE_URL}/search?q=transfer`, { headers });
  check(response, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
```

---

## Performance Optimization

### Caching Strategy

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  // Try to get from cache
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached as string);
  }

  // Fetch fresh data
  const data = await fetcher();

  // Cache the result
  await redis.setex(key, ttl, JSON.stringify(data));

  return data;
}

// Usage in API route
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const briefingType = searchParams.get('briefing_type');

  const cacheKey = `articles:${briefingType || 'all'}`;

  const articles = await getCached(
    cacheKey,
    () =>
      prisma.article.findMany({
        where: briefingType ? { briefing_type: briefingType } : undefined,
        take: 20,
        orderBy: { published_at: 'desc' },
      }),
    300 // Cache for 5 minutes
  );

  return NextResponse.json({ data: articles });
}
```

### Database Optimization

```sql
-- Database indexes for optimal query performance
CREATE INDEX CONCURRENTLY idx_articles_published_at ON articles (published_at DESC);
CREATE INDEX CONCURRENTLY idx_articles_briefing_type ON articles (briefing_type);
CREATE INDEX CONCURRENTLY idx_articles_author ON articles (author);
CREATE INDEX CONCURRENTLY idx_articles_search ON articles USING gin(to_tsvector('english', title || ' ' || content));

-- Subscriber indexes
CREATE INDEX CONCURRENTLY idx_subscribers_email ON subscribers (email);
CREATE INDEX CONCURRENTLY idx_subscribers_active ON subscribers (active) WHERE active = true;

-- Analytics indexes
CREATE INDEX CONCURRENTLY idx_email_events_recipient ON email_events (recipient);
CREATE INDEX CONCURRENTLY idx_email_events_timestamp ON email_events (timestamp DESC);
```

---

## Monitoring and Observability

### Prometheus Metrics

```typescript
// lib/metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';

// Request metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

// Business metrics
export const articlesGenerated = new Counter({
  name: 'articles_generated_total',
  help: 'Total number of articles generated',
  labelNames: ['briefing_type'],
});

export const newslettersSent = new Counter({
  name: 'newsletters_sent_total',
  help: 'Total number of newsletters sent',
});

export const activeSubscribers = new Gauge({
  name: 'active_subscribers',
  help: 'Current number of active subscribers',
});

// Register metrics
register.clear();
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);
register.registerMetric(articlesGenerated);
register.registerMetric(newslettersSent);
register.registerMetric(activeSubscribers);

// Middleware to collect metrics
export function withMetrics(handler: Function) {
  return async (req: NextRequest) => {
    const start = Date.now();
    const route = req.nextUrl.pathname;
    const method = req.method;

    try {
      const response = await handler(req);
      const duration = (Date.now() - start) / 1000;

      httpRequestsTotal.inc({ method, route, status_code: response.status });
      httpRequestDuration.observe({ method, route }, duration);

      return response;
    } catch (error) {
      const duration = (Date.now() - start) / 1000;
      httpRequestsTotal.inc({ method, route, status_code: 500 });
      httpRequestDuration.observe({ method, route }, duration);
      throw error;
    }
  };
}
```

### Health Checks

```typescript
// app/api/v1/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {},
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    healthCheck.services.database = {
      status: 'healthy',
      response_time: Date.now(),
    };
  } catch (error) {
    healthCheck.services.database = {
      status: 'unhealthy',
      error: error.message,
    };
    healthCheck.status = 'unhealthy';
  }

  // Check Twitter API
  try {
    const response = await fetch(
      'https://api.twitter.com/2/tweets/search/recent?query=test&max_results=1',
      {
        headers: {
          Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        },
      }
    );

    healthCheck.services.twitter_api = {
      status: response.ok ? 'healthy' : 'degraded',
      response_time: Date.now(),
    };

    if (!response.ok && healthCheck.status === 'healthy') {
      healthCheck.status = 'degraded';
    }
  } catch (error) {
    healthCheck.services.twitter_api = {
      status: 'unhealthy',
      error: error.message,
    };
    healthCheck.status = 'unhealthy';
  }

  const status = healthCheck.status === 'healthy' ? 200 : 503;
  return NextResponse.json(healthCheck, { status });
}
```

---

This comprehensive API specification provides everything needed to implement the Transfer Juice API with production-grade quality, security, and compliance. The specification includes complete OpenAPI documentation, implementation examples, testing strategies, and operational considerations for a scalable, maintainable API service.
