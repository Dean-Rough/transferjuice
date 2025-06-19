/**
 * Database Mock Implementation
 * Provides test database utilities and mock implementations
 */

import { Article } from '@/lib/validations/article';
import { Subscriber } from '@/lib/validations/subscriber';
import { ProcessedTweet } from '@/lib/validations/twitter';

// Mock database records
export const mockDatabaseRecords = {
  articles: [
    {
      id: 'article_001',
      title: 'Arsenal Close In On Rice Deal',
      subtitle: 'Brighton midfielder set for medical this week',
      briefingType: 'morning' as const,
      status: 'published' as const,
      sections: [
        {
          id: 'intro_001',
          type: 'intro' as const,
          content:
            'Arsenal are reportedly close to finalizing their move for Brighton midfielder Declan Rice...',
          sourceTweets: [
            {
              tweetId: 'tweet_001',
              authorHandle: 'FabrizioRomano',
              relevanceScore: 0.95,
              usedInSections: ['intro_001'],
              quotedDirectly: true,
            },
          ],
          order: 0,
          wordCount: 156,
        },
      ],
      summary:
        'Arsenal are in advanced talks to sign Declan Rice from Brighton for a fee that could reach £105m.',
      publishedAt: new Date('2024-01-15T08:00:00.000Z'),
      lastModified: new Date('2024-01-15T07:45:00.000Z'),
      quality: {
        grammarScore: 95,
        readabilityScore: 88,
        brandVoiceScore: 92,
        factualAccuracy: 85,
        engagementPotential: 90,
        overallScore: 90,
        flags: [],
        humanReviewRequired: false,
      },
      sourceTweets: ['tweet_001', 'tweet_002'],
      totalSourceTweets: 2,
      slug: 'arsenal-close-in-on-rice-deal',
      metaDescription:
        'Arsenal are reportedly close to finalizing their move for Brighton midfielder Declan Rice in a deal worth up to £105m.',
      tags: ['Arsenal', 'Declan Rice', 'Brighton', 'Transfer'],
      estimatedReadTime: 2,
      wordCount: 156,
      sentToSubscribers: true,
      sentAt: new Date('2024-01-15T08:00:00.000Z'),
    } as Article,
  ],
  subscribers: [
    {
      id: 'sub_001',
      email: 'test.user@example.com',
      status: 'active' as const,
      preferences: {
        emailFrequency: 'all' as const,
        preferredTeams: ['arsenal'],
        receiveBreakingNews: true,
        emailFormat: 'html' as const,
        timezone: 'Europe/London',
        language: 'en' as const,
        includeRumours: true,
        includeConfirmed: true,
        includeLoanDeals: true,
        includeYouthPlayers: false,
        marketingEmails: false,
        surveyParticipation: true,
        feedbackRequests: true,
      },
      subscribedAt: new Date('2024-01-01T10:00:00.000Z'),
      confirmedAt: new Date('2024-01-01T10:15:00.000Z'),
      subscriptionSource: 'website' as const,
      emailsReceived: 45,
      emailsOpened: 38,
      linksClicked: 12,
      gdprConsent: true,
      consentDate: new Date('2024-01-01T10:00:00.000Z'),
      dataProcessingConsent: true,
      createdAt: new Date('2024-01-01T10:00:00.000Z'),
      updatedAt: new Date('2024-01-15T08:00:00.000Z'),
      isTestAccount: true,
    } as Subscriber,
  ],
  tweets: [
    {
      id: 'processed_tweet_001',
      originalTweet: {
        id: 'tweet_001',
        text: '🚨 EXCLUSIVE: Arsenal are in advanced talks with Brighton for Declan Rice. Fee could reach £105m with add-ons. Here we go! ⚪🔴 #Arsenal #TransferNews',
        author_id: '123456789',
        created_at: '2024-01-15T14:30:00.000Z',
        conversation_id: 'tweet_001',
        public_metrics: {
          retweet_count: 2500,
          reply_count: 850,
          like_count: 15000,
          quote_count: 500,
          bookmark_count: 1200,
        },
      },
      author: {
        id: '123456789',
        username: 'FabrizioRomano',
        name: 'Fabrizio Romano',
        verified: true,
      },
      processedAt: new Date('2024-01-15T14:35:00.000Z'),
      relevance: {
        isTransferRelated: true,
        confidence: 0.95,
        keywords: ['exclusive', 'talks', 'fee', 'here we go'],
        entities: {
          players: ['Declan Rice'],
          clubs: ['Arsenal', 'Brighton'],
          agents: [],
          journalists: ['Fabrizio Romano'],
        },
        transferType: 'confirmed' as const,
        priority: 'high' as const,
      },
      content: {
        cleanText:
          'EXCLUSIVE: Arsenal are in advanced talks with Brighton for Declan Rice. Fee could reach £105m with add-ons. Here we go!',
        mentions: [],
        hashtags: ['Arsenal', 'TransferNews'],
        urls: [],
        mediaUrls: [],
      },
      metadata: {
        wordCount: 20,
        readabilityScore: 85,
        sentimentScore: 0.7,
        spamScore: 0.1,
      },
    } as ProcessedTweet,
  ],
};

// Mock database operations
export class MockDatabase {
  private data: typeof mockDatabaseRecords = JSON.parse(
    JSON.stringify(mockDatabaseRecords)
  );
  private shouldThrowError = false;
  private responseDelay = 0;
  private transactionMode = false;

  constructor() {
    this.reset();
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(mockDatabaseRecords));
    this.shouldThrowError = false;
    this.responseDelay = 0;
    this.transactionMode = false;
  }

  setError(enabled: boolean) {
    this.shouldThrowError = enabled;
  }

  setResponseDelay(ms: number) {
    this.responseDelay = ms;
  }

  async beginTransaction() {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error('Database connection failed');
    }

    this.transactionMode = true;
    return {
      commit: this.commit.bind(this),
      rollback: this.rollback.bind(this),
    };
  }

  async commit() {
    this.transactionMode = false;
  }

  async rollback() {
    this.reset();
    this.transactionMode = false;
  }

  // Article operations
  async createArticle(article: Omit<Article, 'id'>): Promise<Article> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error('Database error: Failed to create article');
    }

    const newArticle: Article = {
      ...article,
      id: `article_${Date.now()}`,
    };

    this.data.articles.push(newArticle);
    return newArticle;
  }

  async getArticleById(id: string): Promise<Article | null> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error('Database error: Failed to fetch article');
    }

    return this.data.articles.find((article) => article.id === id) || null;
  }

  async getArticlesByBriefingType(
    briefingType: Article['briefingType']
  ): Promise<Article[]> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error('Database error: Failed to fetch articles');
    }

    return this.data.articles.filter(
      (article) => article.briefingType === briefingType
    );
  }

  async updateArticle(
    id: string,
    updates: Partial<Article>
  ): Promise<Article | null> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error('Database error: Failed to update article');
    }

    const articleIndex = this.data.articles.findIndex(
      (article) => article.id === id
    );
    if (articleIndex === -1) return null;

    this.data.articles[articleIndex] = {
      ...this.data.articles[articleIndex],
      ...updates,
      lastModified: new Date(),
    };

    return this.data.articles[articleIndex];
  }

  async deleteArticle(id: string): Promise<boolean> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error('Database error: Failed to delete article');
    }

    const initialLength = this.data.articles.length;
    this.data.articles = this.data.articles.filter(
      (article) => article.id !== id
    );
    return this.data.articles.length < initialLength;
  }

  // Subscriber operations
  async createSubscriber(
    subscriber: Omit<Subscriber, 'id'>
  ): Promise<Subscriber> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error('Database error: Failed to create subscriber');
    }

    const newSubscriber: Subscriber = {
      ...subscriber,
      id: `sub_${Date.now()}`,
    };

    this.data.subscribers.push(newSubscriber);
    return newSubscriber;
  }

  async getSubscriberByEmail(email: string): Promise<Subscriber | null> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error('Database error: Failed to fetch subscriber');
    }

    return (
      this.data.subscribers.find((subscriber) => subscriber.email === email) ||
      null
    );
  }

  async updateSubscriber(
    id: string,
    updates: Partial<Subscriber>
  ): Promise<Subscriber | null> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error('Database error: Failed to update subscriber');
    }

    const subscriberIndex = this.data.subscribers.findIndex(
      (subscriber) => subscriber.id === id
    );
    if (subscriberIndex === -1) return null;

    this.data.subscribers[subscriberIndex] = {
      ...this.data.subscribers[subscriberIndex],
      ...updates,
      updatedAt: new Date(),
    };

    return this.data.subscribers[subscriberIndex];
  }

  async getActiveSubscribers(): Promise<Subscriber[]> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error('Database error: Failed to fetch subscribers');
    }

    return this.data.subscribers.filter(
      (subscriber) => subscriber.status === 'active'
    );
  }

  // Tweet operations
  async createProcessedTweet(
    tweet: Omit<ProcessedTweet, 'id'>
  ): Promise<ProcessedTweet> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error('Database error: Failed to create processed tweet');
    }

    const newTweet: ProcessedTweet = {
      ...tweet,
      id: `processed_tweet_${Date.now()}`,
    };

    this.data.tweets.push(newTweet);
    return newTweet;
  }

  async getProcessedTweetsByRelevance(
    minConfidence: number
  ): Promise<ProcessedTweet[]> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error('Database error: Failed to fetch tweets');
    }

    return this.data.tweets.filter(
      (tweet) =>
        tweet.relevance.confidence >= minConfidence &&
        tweet.relevance.isTransferRelated
    );
  }

  async getRecentProcessedTweets(hours: number): Promise<ProcessedTweet[]> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error('Database error: Failed to fetch tweets');
    }

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.data.tweets.filter((tweet) => tweet.processedAt >= cutoff);
  }

  // Utility methods for testing
  getData() {
    return JSON.parse(JSON.stringify(this.data));
  }

  setData(newData: Partial<typeof mockDatabaseRecords>) {
    this.data = { ...this.data, ...newData };
  }

  getTableRowCount(table: keyof typeof mockDatabaseRecords): number {
    return this.data[table].length;
  }

  clearTable(table: keyof typeof mockDatabaseRecords) {
    this.data[table] = [];
  }
}

// Database test utilities
export const createTestDatabase = () => new MockDatabase();

export const withTestTransaction = async <T>(
  db: MockDatabase,
  callback: (db: MockDatabase) => Promise<T>
): Promise<T> => {
  const transaction = await db.beginTransaction();
  try {
    const result = await callback(db);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const seedTestData = async (db: MockDatabase) => {
  // Reset to ensure clean state
  db.reset();

  // Add additional test data if needed
  const additionalArticle: Article = {
    id: 'article_test_002',
    title: 'Chelsea Complete Nkunku Signing',
    subtitle: 'French striker joins from RB Leipzig',
    briefingType: 'afternoon',
    status: 'published',
    sections: [
      {
        id: 'intro_002',
        type: 'intro',
        content:
          'Chelsea have completed the signing of Christopher Nkunku from RB Leipzig...',
        sourceTweets: [],
        order: 0,
        wordCount: 89,
      },
    ],
    summary:
      'Chelsea complete the signing of Christopher Nkunku from RB Leipzig for £52m.',
    publishedAt: new Date('2024-01-15T14:00:00.000Z'),
    lastModified: new Date('2024-01-15T13:45:00.000Z'),
    quality: {
      grammarScore: 92,
      readabilityScore: 85,
      brandVoiceScore: 88,
      factualAccuracy: 90,
      engagementPotential: 85,
      overallScore: 88,
      flags: [],
      humanReviewRequired: false,
    },
    sourceTweets: ['tweet_003'],
    totalSourceTweets: 1,
    slug: 'chelsea-complete-nkunku-signing',
    metaDescription:
      'Chelsea have completed the signing of Christopher Nkunku from RB Leipzig for £52m on a 5-year deal.',
    tags: ['Chelsea', 'Christopher Nkunku', 'RB Leipzig', 'Transfer'],
    estimatedReadTime: 1,
    wordCount: 89,
    sentToSubscribers: false,
  };

  await db.createArticle(additionalArticle);
};

export const mockDatabase = createTestDatabase();
