# Transfer Juice System Architecture

## Overview

Transfer Juice is a fully automated Premier League transfer news digest that converts the chaos of "ITK" Twitter into polished, entertaining content. The system architecture is designed for scalability, performance, and maintainability.

**High-level system diagram:**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Twitter API   │───▶│  Tweet Pipeline  │───▶│  AI Processing  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Email Services  │◀───│ Neon PostgreSQL │◀───│ Article Storage │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                        │
         ▼                       ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Newsletter List │    │ Next.js Web App  │    │ Web Archive     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

**Core Components:**

- Next.js web app (transferjuice.com)
- Prisma/Neon PostgreSQL database
- Twitter API integration and tweet processing pipeline
- AI content generation microservices
- Newsletter distribution system
- Automation and job scheduling

## Next.js App Architecture

The web frontend is built with Next.js 14+ using the App Router and organized by feature:

```
src/
├── app/                    # Next.js app router
│   ├── (briefs)/          # Route group for brief pages
│   │   ├── morning/
│   │   ├── afternoon/
│   │   └── evening/
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout with Geist fonts
│   └── page.tsx           # Home page
├── components/
│   ├── shared/            # Reusable UI components (Button, Modal)
│   ├── layout/            # Page layout components (Header, Footer)
│   ├── morning/           # Morning briefing specific UI
│   ├── afternoon/         # Afternoon briefing specific UI
│   └── evening/           # Evening briefing specific UI
├── lib/
│   ├── twitter/           # Twitter API integration
│   ├── ai/                # AI content generation
│   ├── email/             # Newsletter distribution
│   └── utils/             # Utility functions
└── types/
    └── index.ts           # TypeScript definitions
```

**Key Implementation Practices:**

- TypeScript with `strict` mode enabled for maximum type safety
- React Server Components for optimal performance and SEO
- Proper data fetching strategies: SWR for CSR, Server Components for SSR
- Code splitting with dynamic imports and React.lazy()
- Selective hydration for improved initial page load
- Zod schema validation for all API endpoints

```typescript
// src/lib/api/validation.ts
import { z } from "zod";

export const TweetSchema = z.object({
  id: z.string(),
  text: z.string(),
  author: z.string(),
  created_at: z.string(),
  media_urls: z.array(z.string()).optional(),
  metrics: z.object({
    retweet_count: z.number(),
    like_count: z.number(),
  }),
});

export const ArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  briefing_type: z.enum(["morning", "afternoon", "evening"]),
  published_at: z.date(),
});

export type Tweet = z.infer<typeof TweetSchema>;
export type Article = z.infer<typeof ArticleSchema>;
```

## Database Architecture

Transfer Juice uses Prisma ORM with a Neon PostgreSQL database, optimized for high-performance queries and scalability.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Tweet {
  id          String   @id @default(cuid())
  twitter_id  String   @unique
  text        String
  author      String
  author_id   String
  created_at  DateTime
  media_urls  String[]
  metrics     Json
  processed   Boolean  @default(false)
  relevant    Boolean?

  // Relations
  articles    ArticleTweet[]

  @@index([author, created_at])
  @@index([processed, relevant])
  @@map("tweets")
}

model Article {
  id            String        @id @default(cuid())
  title         String
  content       String
  briefing_type BriefingType
  published_at  DateTime      @default(now())
  email_sent    Boolean       @default(false)

  // Relations
  tweets        ArticleTweet[]
  analytics     ArticleAnalytics[]

  @@index([briefing_type, published_at])
  @@map("articles")
}

model ArticleTweet {
  article_id String
  tweet_id   String

  article    Article @relation(fields: [article_id], references: [id])
  tweet      Tweet   @relation(fields: [tweet_id], references: [id])

  @@id([article_id, tweet_id])
  @@map("article_tweets")
}

model Subscriber {
  id            String    @id @default(cuid())
  email         String    @unique
  active        Boolean   @default(true)
  subscribed_at DateTime  @default(now())

  @@map("subscribers")
}

model ArticleAnalytics {
  id         String   @id @default(cuid())
  article_id String
  page_views Int      @default(0)
  read_time  Int?     // in seconds
  created_at DateTime @default(now())

  article    Article  @relation(fields: [article_id], references: [id])

  @@map("article_analytics")
}

enum BriefingType {
  MORNING
  AFTERNOON
  EVENING
}
```

**Database Best Practices:**

- Use Neon's pooled connections with optimized timeout settings
- Connection string configuration for serverless compatibility:

```typescript
// prisma/schema.prisma datasource configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // Pooled connection string
}

// .env configuration
DATABASE_URL="postgresql://user:password@host.neon.tech/db?connect_timeout=10&pool_timeout=10"
```

- Leverage Neon's serverless driver for HTTP connections in serverless functions
- Apply proper indexing for query optimization
- Use PgBouncer connection pooling (built into Neon)
- Schema migrations via pooled connections (Prisma 5.7+)

## Twitter Integration and Tweet Processing Pipeline

The system fetches tweets from Twitter API v2 every 3-4 hours using Bearer Token authentication, filters for transfer relevance, and queues them for AI processing.

**Data Flow:**

```
Twitter API → Keyword Filter → Relevance Scoring → DB Storage → AI Processing Queue
     ↓              ↓               ↓                ↓              ↓
Rate Limiting  Transfer Terms  ML Classification  Deduplication  Content Generation
```

```typescript
// src/lib/twitter/client.ts
import { Client } from "twitter-api-sdk";

const TRANSFER_KEYWORDS = [
  "transfer",
  "signing",
  "medical",
  "contract",
  "bid",
  "fee",
  "deal",
  "negotiations",
  "clause",
  "terms",
  "agreement",
  "move",
  "join",
];

const ITK_ACCOUNTS = [
  "FabrizioRomano", // Official handle confirmed
  "David_Ornstein", // BBC Sport journalist
  "SamLee", // Verified via X profile
  "_pauljoyce", // The Times journalist
  "lauriewhitwell", // The Athletic journalist
  "RobDawsonESPN", // ESPN journalist
  "LukeEdwardsTele", // Telegraph journalist
  "JPercyTelegraph", // Telegraph journalist
  "CraigHope_DM", // Daily Mail journalist
  "DeanJonesSoccer", // Football journalist
];

export class TwitterClient {
  private client: Client;

  constructor() {
    this.client = new Client(process.env.TWITTER_BEARER_TOKEN!);
  }

  async fetchRecentTweets(): Promise<Tweet[]> {
    const query = `(${TRANSFER_KEYWORDS.join(" OR ")}) (from:${ITK_ACCOUNTS.join(" OR from:")}) -is:retweet`;

    try {
      const tweets = await this.client.tweets.tweetsRecentSearch({
        query,
        max_results: 100,
        "tweet.fields": [
          "created_at",
          "author_id",
          "public_metrics",
          "attachments",
        ],
        "user.fields": ["username"],
        "media.fields": ["url", "preview_image_url"],
        expansions: ["author_id", "attachments.media_keys"],
      });

      return this.processTweetResponse(tweets);
    } catch (error) {
      throw new TwitterAPIError(`Failed to fetch tweets: ${error.message}`);
    }
  }

  private async processTweetResponse(response: any): Promise<Tweet[]> {
    // Process and validate tweet data
    return (
      response.data?.map((tweet) => ({
        twitter_id: tweet.id,
        text: tweet.text,
        author: this.getUsernameById(tweet.author_id, response.includes?.users),
        author_id: tweet.author_id,
        created_at: new Date(tweet.created_at),
        media_urls: this.extractMediaUrls(tweet, response.includes?.media),
        metrics: tweet.public_metrics,
      })) || []
    );
  }
}
```

**Relevance Filtering:**

```typescript
// src/lib/processing/relevanceFilter.ts
export class RelevanceFilter {
  private static TRANSFER_INDICATORS = {
    high: ["here we go", "medical", "signed", "confirmed", "official"],
    medium: ["agreement", "bid accepted", "personal terms", "fee agreed"],
    low: ["interested", "monitoring", "considering", "exploring"],
  };

  static scoreRelevance(tweet: Tweet): number {
    const text = tweet.text.toLowerCase();
    let score = 0;

    // Score based on keyword presence and strength
    Object.entries(this.TRANSFER_INDICATORS).forEach(([weight, keywords]) => {
      keywords.forEach((keyword) => {
        if (text.includes(keyword)) {
          score += weight === "high" ? 10 : weight === "medium" ? 5 : 2;
        }
      });
    });

    // Boost score for reliable sources
    if (["FabrizioRomano", "David_Ornstein"].includes(tweet.author)) {
      score *= 1.5;
    }

    return Math.min(score, 100); // Cap at 100
  }
}
```

## AI Content Generation Microservices

Modular microservices handle AI content generation, powered by GPT-4/Claude with custom prompts for consistent editorial voice.

**Content Generation Flow:**

```
Relevant Tweets → Context Building → Editorial Generation → Quality Check → Article Storage
      ↓              ↓                    ↓                  ↓              ↓
  Deduplication  Transfer Context    Joel Golby Style   Fact Validation  Version Control
```

```typescript
// src/lib/ai/contentGenerator.ts
import OpenAI from "openai";

export class ContentGenerator {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateArticle(
    tweets: Tweet[],
    briefingType: BriefingType,
  ): Promise<string> {
    const context = this.buildTransferContext(tweets);
    const prompt = this.createEditorialPrompt(context, briefingType);

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4.5",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(),
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      return response.choices[0].message.content!;
    } catch (error) {
      throw new AIGenerationError(
        `Failed to generate article: ${error.message}`,
      );
    }
  }

  private getSystemPrompt(): string {
    return `
      You are a witty football transfer journalist writing for Transfer Juice.
      Your writing style is:
      - Ascerbic and entertaining like Joel Golby
      - Sharp observations about transfer market absurdity
      - Engaging conversational tone with British humor
      - Editorial flow that makes sense of Twitter chaos
      - Professional yet irreverent
      
      NEVER write bullet points. Always write flowing prose that reads like a proper article.
      Include hyperlinks to original tweets when referencing specific information.
      Maintain skeptical but entertaining perspective on transfer rumors.
    `;
  }

  private createEditorialPrompt(
    context: TransferContext,
    briefingType: BriefingType,
  ): string {
    const timeOfDay = briefingType.toLowerCase();

    return `
      Write a ${timeOfDay} transfer briefing article based on these ITK developments:
      
      ${context.formattedTweets}
      
      Requirements:
      - 500-800 words
      - Entertaining editorial style with wit and skepticism
      - Smooth narrative flow connecting different stories
      - Include relevant tweet links: ${context.tweetLinks.join(", ")}
      - ${
        timeOfDay === "morning"
          ? "Recap overnight developments"
          : timeOfDay === "afternoon"
            ? "Cover midday developments and build excitement"
            : "End-of-day roundup with weekend preview"
      }
      
      Make the transfer circus entertaining and readable.
    `;
  }
}
```

**Image Integration:**

```typescript
// src/lib/content/imageProcessor.ts
export class ImageProcessor {
  async enrichArticleWithImages(
    article: Article,
    tweets: Tweet[],
  ): Promise<Article> {
    const images = await this.gatherRelevantImages(tweets);
    const enrichedContent = this.embedImagesInContent(article.content, images);

    return {
      ...article,
      content: enrichedContent,
    };
  }

  private async gatherRelevantImages(tweets: Tweet[]): Promise<ContentImage[]> {
    const images: ContentImage[] = [];

    // Extract tweet media
    for (const tweet of tweets) {
      if (tweet.media_urls?.length) {
        images.push(
          ...tweet.media_urls.map((url) => ({
            url,
            source: "twitter",
            alt: `Media from ${tweet.author}'s tweet`,
            tweet_id: tweet.twitter_id,
          })),
        );
      }
    }

    // Fetch Wikipedia images for mentioned players/clubs
    const entities = this.extractEntities(tweets);
    for (const entity of entities) {
      const wikiImage = await this.fetchWikipediaImage(entity);
      if (wikiImage) images.push(wikiImage);
    }

    return images;
  }

  private async fetchWikipediaImage(
    entity: string,
  ): Promise<ContentImage | null> {
    try {
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(entity)}`,
      );
      const data = await response.json();

      if (data.thumbnail?.source) {
        return {
          url: data.thumbnail.source,
          source: "wikipedia",
          alt: `${entity} - Wikipedia`,
          entity,
        };
      }
    } catch (error) {
      console.warn(`Failed to fetch Wikipedia image for ${entity}:`, error);
    }

    return null;
  }
}
```

## Newsletter Distribution System

Transfer Juice delivers tri-daily email briefings using dark mode HTML templates that match the web design aesthetic.

**Email Architecture:**

```
Article Storage → Template Engine → Email Service → Subscriber Delivery
       ↓               ↓              ↓              ↓
   Content Prep    Dark Mode HTML   ConvertKit API  Delivery Tracking
```

```typescript
// src/lib/email/newsletterService.ts
export class NewsletterService {
  private convertKit: ConvertKitAPI;
  private templateEngine: EmailTemplateEngine;

  async sendNewsletterBrief(article: Article): Promise<void> {
    const template = await this.templateEngine.generateTemplate(article);
    const subject = this.generateSubjectLine(article);

    try {
      await this.convertKit.broadcasts.create({
        subject,
        content: template.html,
        description: `${article.briefing_type} Brief - ${format(article.published_at, "MMM dd, yyyy")}`,
        public: false,
      });

      // Mark article as sent
      await prisma.article.update({
        where: { id: article.id },
        data: { email_sent: true },
      });
    } catch (error) {
      throw new NewsletterDeliveryError(
        `Failed to send newsletter: ${error.message}`,
      );
    }
  }

  private generateSubjectLine(article: Article): string {
    const timeEmoji = {
      MORNING: "🌅",
      AFTERNOON: "☀️",
      EVENING: "🌙",
    };

    const date = format(article.published_at, "MMM dd");
    return `${timeEmoji[article.briefing_type]} Transfer Juice ${article.briefing_type.toLowerCase()} brief - ${date}`;
  }
}
```

**Dark Mode Email Template:**

```typescript
// src/lib/email/templates/darkModeTemplate.ts
export class DarkModeEmailTemplate {
  static generate(article: Article): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${article.title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Geist:wght@100;400;900&display=swap');
            
            body {
              font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
              background-color: #0A0808;
              color: #FFFFFF;
              line-height: 1.6;
              margin: 0;
              padding: 20px;
            }
            
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #1A1A1A;
              border-radius: 8px;
              overflow: hidden;
            }
            
            .header {
              background: linear-gradient(135deg, #F2491F 0%, #FF8E21 100%);
              padding: 20px;
              text-align: center;
            }
            
            .logo {
              color: #FFFFFF;
              font-weight: 900;
              font-size: 24px;
            }
            
            .content {
              padding: 30px;
            }
            
            h1 {
              font-weight: 900;
              color: #F9F2DF;
              margin-bottom: 20px;
            }
            
            p {
              font-weight: 100;
              margin-bottom: 16px;
            }
            
            a {
              color: #F65617;
              text-decoration: none;
            }
            
            .footer {
              background-color: #0A0808;
              padding: 20px;
              text-align: center;
              font-size: 14px;
              color: #888;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Transfer Juice</div>
            </div>
            <div class="content">
              <h1>${article.title}</h1>
              ${article.content}
            </div>
            <div class="footer">
              <p>Transfer Juice - Making sense of transfer Twitter</p>
              <p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="https://transferjuice.com">transferjuice.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
```

## Automation and Job Scheduling

Cron jobs orchestrate the entire content pipeline, triggering three times daily at 08:00, 14:00, and 20:00 BST.

**Pipeline Orchestration:**

```
Cron Trigger → Tweet Fetch → Content Generation → Email Send → Web Update → Analytics
     ↓             ↓              ↓                ↓           ↓           ↓
Error Handling  Rate Limiting  Quality Check   Delivery     Cache Clear  Metrics
```

```typescript
// src/lib/automation/pipelineOrchestrator.ts
export class PipelineOrchestrator {
  private twitterClient: TwitterClient;
  private contentGenerator: ContentGenerator;
  private newsletterService: NewsletterService;
  private errorHandler: ErrorHandler;

  async executeBriefingPipeline(briefingType: BriefingType): Promise<void> {
    const pipelineId = `${briefingType}-${Date.now()}`;

    try {
      console.log(`[${pipelineId}] Starting ${briefingType} briefing pipeline`);

      // Step 1: Fetch and process tweets
      const tweets = await this.fetchAndFilterTweets();
      console.log(`[${pipelineId}] Processed ${tweets.length} relevant tweets`);

      // Step 2: Generate article content
      const article = await this.generateArticleContent(tweets, briefingType);
      console.log(`[${pipelineId}] Generated article: ${article.id}`);

      // Step 3: Distribute via email and web
      await Promise.all([
        this.publishToWeb(article),
        this.sendNewsletter(article),
      ]);

      // Step 4: Update analytics
      await this.trackPipelineSuccess(pipelineId, article);

      console.log(`[${pipelineId}] Pipeline completed successfully`);
    } catch (error) {
      await this.errorHandler.handlePipelineError(pipelineId, error);
      throw error;
    }
  }

  private async fetchAndFilterTweets(): Promise<Tweet[]> {
    const rawTweets = await this.twitterClient.fetchRecentTweets();

    // Filter for relevance and deduplicate
    const relevantTweets = rawTweets
      .filter((tweet) => RelevanceFilter.scoreRelevance(tweet) >= 5)
      .filter((tweet) => !this.isDuplicate(tweet));

    // Store in database
    await this.storeTweets(relevantTweets);

    return relevantTweets;
  }
}
```

**Cron Job Configuration:**

```typescript
// src/lib/automation/scheduler.ts
import { CronJob } from "cron";

export class BriefingScheduler {
  private jobs: CronJob[] = [];

  start(): void {
    // Morning brief: 08:00 BST (07:00 UTC in summer, 08:00 UTC in winter)
    this.jobs.push(
      new CronJob(
        "0 7 * * *",
        () => {
          this.orchestrator.executeBriefingPipeline("MORNING");
        },
        null,
        true,
        "Europe/London",
      ),
    );

    // Afternoon brief: 14:00 BST
    this.jobs.push(
      new CronJob(
        "0 13 * * *",
        () => {
          this.orchestrator.executeBriefingPipeline("AFTERNOON");
        },
        null,
        true,
        "Europe/London",
      ),
    );

    // Evening brief: 20:00 BST
    this.jobs.push(
      new CronJob(
        "0 19 * * *",
        () => {
          this.orchestrator.executeBriefingPipeline("EVENING");
        },
        null,
        true,
        "Europe/London",
      ),
    );

    console.log("Briefing scheduler started with 3 daily jobs");
  }

  stop(): void {
    this.jobs.forEach((job) => job.stop());
    this.jobs = [];
  }
}
```

**Error Handling and Alerting:**

```typescript
// src/lib/automation/errorHandler.ts
export class ErrorHandler {
  async handlePipelineError(pipelineId: string, error: Error): Promise<void> {
    // Log error with context
    console.error(`[${pipelineId}] Pipeline failed:`, error);

    // Send alert to monitoring system
    await this.sendAlert({
      type: "pipeline_failure",
      pipelineId,
      error: error.message,
      timestamp: new Date(),
      severity: this.determineSeverity(error),
    });

    // Attempt recovery if possible
    if (this.isRecoverable(error)) {
      console.log(`[${pipelineId}] Attempting recovery...`);
      await this.attemptRecovery(pipelineId, error);
    }
  }

  private determineSeverity(error: Error): "low" | "medium" | "high" {
    if (error instanceof TwitterAPIError) return "medium";
    if (error instanceof AIGenerationError) return "high";
    if (error instanceof NewsletterDeliveryError) return "high";
    return "low";
  }
}
```

## Security Considerations

**API Security:**

- All API secrets stored in environment variables, never committed to code
- Twitter Bearer Token, OpenAI API keys, and email service credentials secured
- Rate limiting on all API endpoints to prevent abuse
- Input validation and sanitization for all user inputs

**Authentication & Authorization:**

```typescript
// src/lib/auth/middleware.ts
export function requireAdminAuth(req: NextRequest): boolean {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token || token !== process.env.ADMIN_API_TOKEN) {
    throw new UnauthorizedError("Invalid or missing admin token");
  }

  return true;
}

// API route protection
export async function POST(request: NextRequest) {
  requireAdminAuth(request);
  // Protected admin functionality
}
```

**Data Privacy & GDPR Compliance:**

```typescript
// src/lib/privacy/gdprService.ts
export class GDPRService {
  async handleDataDeletionRequest(email: string): Promise<void> {
    // Remove subscriber data
    await prisma.subscriber.delete({
      where: { email },
    });

    // Log deletion for audit trail
    await this.logDataDeletion(email);
  }

  async exportUserData(email: string): Promise<UserDataExport> {
    const subscriber = await prisma.subscriber.findUnique({
      where: { email },
    });

    return {
      email: subscriber?.email,
      subscribed_at: subscriber?.subscribed_at,
      // Only include necessary data
    };
  }
}
```

**Content Safety:**

```typescript
// src/lib/safety/contentFilter.ts
export class ContentSafetyFilter {
  async validateContent(content: string): Promise<ContentValidation> {
    // Check for inappropriate content
    const moderationResponse = await this.openai.moderations.create({
      input: content,
    });

    if (moderationResponse.results[0].flagged) {
      throw new ContentSafetyError("Content flagged by moderation system");
    }

    return { safe: true, score: moderationResponse.results[0] };
  }
}
```

## Deployment Architecture

**Vercel Deployment:**

```yaml
# vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "regions": ["lhr1"],
  "functions": { "src/app/api/cron/**.ts": { "maxDuration": 300 } },
  "crons":
    [
      { "path": "/api/cron/morning-brief", "schedule": "0 7 * * *" },
      { "path": "/api/cron/afternoon-brief", "schedule": "0 13 * * *" },
      { "path": "/api/cron/evening-brief", "schedule": "0 19 * * *" },
    ],
}
```

**Environment Configuration:**

```bash
# .env.local (development)
# .env.production (Vercel production environment)

# Database
DATABASE_URL="postgresql://user:password@host.neon.tech/db?connect_timeout=10"

# External APIs
TWITTER_BEARER_TOKEN="AAAAxxx..."
OPENAI_API_KEY="sk-xxx..."
CONVERTKIT_API_KEY="xxx..."

# Security
ADMIN_API_TOKEN="secure-random-token"
NEXTAUTH_SECRET="another-secure-random-token"

# Application
NEXT_PUBLIC_APP_URL="https://transferjuice.com"
NEXT_PUBLIC_NEWSLETTER_SIGNUP_URL="https://transferjuice.com/subscribe"
```

**Infrastructure as Code:**

```typescript
// infrastructure/vercel.ts - Terraform configuration
import { VercelProject, VercelDeployment } from "@vercel/terraform";

export const transferJuiceProject = new VercelProject("transfer-juice", {
  name: "transfer-juice",
  framework: "nextjs",
  gitRepository: {
    type: "github",
    repo: "username/transfer-juice",
  },
  environmentVariables: [
    {
      key: "DATABASE_URL",
      value: neonDatabase.connectionString,
      target: ["production", "preview"],
    },
    // ... other environment variables
  ],
});
```

## Monitoring and Observability

**Performance SLAs:**

- 99.9% uptime for web application
- <200ms 90th percentile response times for web pages
- <500ms 90th percentile response times for API endpoints
- <0.1% error rates across all services
- 99.5% success rate for automated briefing pipeline
- 99.9% email delivery rate

**Monitoring Stack:**

```typescript
// src/lib/monitoring/metrics.ts
export class MetricsCollector {
  private static instance: MetricsCollector;

  async trackAPICall(
    endpoint: string,
    duration: number,
    status: number,
  ): Promise<void> {
    await this.sendMetric({
      name: "api_call_duration",
      value: duration,
      tags: { endpoint, status: status.toString() },
    });
  }

  async trackPipelineExecution(
    type: BriefingType,
    success: boolean,
    duration: number,
  ): Promise<void> {
    await this.sendMetric({
      name: "pipeline_execution",
      value: duration,
      tags: {
        type: type.toLowerCase(),
        success: success.toString(),
        timestamp: new Date().toISOString(),
      },
    });
  }

  async trackEmailDelivery(
    articleId: string,
    deliveryTime: number,
  ): Promise<void> {
    await this.sendMetric({
      name: "email_delivery_time",
      value: deliveryTime,
      tags: { article_id: articleId },
    });
  }
}
```

**Error Tracking with Sentry:**

```typescript
// src/lib/monitoring/sentry.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter out sensitive information
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes("Bearer")) {
        error.value = error.value.replace(/Bearer \w+/g, "Bearer [REDACTED]");
      }
    }
    return event;
  },
});
```

**Health Check Endpoints:**

```typescript
// src/app/api/health/route.ts
export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabaseHealth(),
      twitter: await checkTwitterAPIHealth(),
      ai: await checkAIServiceHealth(),
      email: await checkEmailServiceHealth(),
    },
  };

  const isHealthy = Object.values(health.services).every(
    (service) => service.status === "healthy",
  );

  return Response.json(health, {
    status: isHealthy ? 200 : 503,
  });
}

async function checkDatabaseHealth(): Promise<ServiceHealth> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "healthy", responseTime: Date.now() };
  } catch (error) {
    return { status: "unhealthy", error: error.message };
  }
}
```

## Extensibility and Future Enhancements

The modular architecture enables seamless addition of planned features:

**API-First Design:**

```typescript
// src/app/api/v1/articles/route.ts - Public API
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const briefingType = searchParams.get("type");
  const limit = parseInt(searchParams.get("limit") || "10");

  const articles = await prisma.article.findMany({
    where: briefingType ? { briefing_type: briefingType } : undefined,
    take: limit,
    orderBy: { published_at: "desc" },
  });

  return Response.json({
    articles: articles.map((article) => ({
      id: article.id,
      title: article.title,
      content: article.content,
      briefing_type: article.briefing_type,
      published_at: article.published_at,
    })),
  });
}
```

**Plugin Architecture for Features:**

```typescript
// src/lib/plugins/playerTracking.ts
export class PlayerTrackingPlugin {
  async trackPlayerMentions(article: Article): Promise<void> {
    const mentions = this.extractPlayerMentions(article.content);

    for (const player of mentions) {
      await this.updatePlayerTrendingScore(player);
    }
  }
}

// src/lib/plugins/audioGeneration.ts
export class AudioGenerationPlugin {
  async generateAudioVersion(article: Article): Promise<string> {
    // Generate audio narration using text-to-speech
    const audioUrl = await this.textToSpeech(article.content);
    return audioUrl;
  }
}
```

**Performance Optimization Roadmap:**

1. **Edge Caching:** Implement Vercel Edge Functions for global content delivery
2. **Database Optimization:** Add read replicas for improved query performance
3. **Content CDN:** Integrate with Cloudinary for optimized image delivery
4. **Progressive Web App:** Add offline reading capabilities
5. **Real-time Updates:** Implement WebSocket connections for live content updates

---

## Appendix A: API Documentation

### Public REST API Endpoints

```typescript
// GET /api/v1/articles
// Query Parameters:
// - type: 'morning' | 'afternoon' | 'evening' (optional)
// - limit: number (default: 10, max: 50)
// - offset: number (default: 0)

// Response:
{
  "articles": [
    {
      "id": "cuid",
      "title": "Transfer Briefing Title",
      "content": "Article content...",
      "briefing_type": "morning",
      "published_at": "2024-01-15T08:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 10,
    "offset": 0,
    "hasNext": true
  }
}

// GET /api/v1/articles/:id
// Response: Single article with full content

// POST /api/v1/subscribe
// Body: { "email": "user@example.com" }
// Response: { "success": true, "subscriber_id": "cuid" }

// DELETE /api/v1/subscribe
// Body: { "email": "user@example.com" }
// Response: { "success": true }
```

## Appendix B: Database Schema Diagrams

```mermaid
erDiagram
    TWEET {
        string id PK
        string twitter_id UK
        string text
        string author
        string author_id
        datetime created_at
        string[] media_urls
        json metrics
        boolean processed
        boolean relevant
    }

    ARTICLE {
        string id PK
        string title
        string content
        enum briefing_type
        datetime published_at
        boolean email_sent
    }

    ARTICLE_TWEET {
        string article_id FK
        string tweet_id FK
    }

    SUBSCRIBER {
        string id PK
        string email UK
        boolean active
        datetime subscribed_at
    }

    ARTICLE_ANALYTICS {
        string id PK
        string article_id FK
        int page_views
        int read_time
        datetime created_at
    }

    TWEET ||--o{ ARTICLE_TWEET : contains
    ARTICLE ||--o{ ARTICLE_TWEET : includes
    ARTICLE ||--o{ ARTICLE_ANALYTICS : tracks
```

## Appendix C: Infrastructure as Code Templates

**Terraform Configuration for Neon Database:**

```hcl
# infrastructure/neon.tf
resource "neon_project" "transfer_juice" {
  name = "transfer-juice"
  region_id = "aws-eu-west-1"

  default_endpoint_settings {
    autoscaling_limit_min_cu = 0.25
    autoscaling_limit_max_cu = 4
    suspend_timeout_seconds = 604800  # 1 week
  }
}

resource "neon_database" "main" {
  project_id = neon_project.transfer_juice.id
  name = "transfer_juice"
  owner_name = "neondb_owner"
}

resource "neon_branch" "staging" {
  project_id = neon_project.transfer_juice.id
  name = "staging"
  parent_id = neon_project.transfer_juice.default_branch_id
}
```

This comprehensive system architecture document provides the technical foundation for building Transfer Juice. The modular, scalable design ensures the platform can grow from a simple newsletter into a comprehensive transfer news ecosystem while maintaining performance, reliability, and the distinctive editorial voice that sets it apart.
