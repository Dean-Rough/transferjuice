/**
 * Email Service Mock Implementation
 * Provides realistic mock responses for email service providers
 */

import {
  EmailCampaign,
  Subscriber,
  SubscribeRequest,
  EmailOpenEvent,
  EmailClickEvent,
} from '@/lib/validations/subscriber';

// Mock email delivery responses
export const mockEmailDeliveryResponse = {
  success: {
    messageId: 'msg_abc123def456',
    status: 'sent',
    recipientEmail: 'user@example.com',
    sentAt: new Date().toISOString(),
    provider: 'convertkit',
  },
  bounce: {
    messageId: 'msg_bounce123',
    status: 'bounced',
    recipientEmail: 'bounced@invalid-domain.com',
    bounceReason: 'Invalid recipient address',
    sentAt: new Date().toISOString(),
    provider: 'convertkit',
  },
  complaint: {
    messageId: 'msg_complaint456',
    status: 'complained',
    recipientEmail: 'complainer@example.com',
    complaintType: 'abuse',
    sentAt: new Date().toISOString(),
    provider: 'convertkit',
  },
};

// Mock campaign metrics
export const mockCampaignMetrics = {
  high_performance: {
    recipientCount: 10000,
    deliveredCount: 9850,
    bouncedCount: 150,
    openedCount: 3500,
    clickedCount: 850,
    unsubscribedCount: 25,
    complainedCount: 5,
    deliveryRate: 0.985,
    openRate: 0.355,
    clickRate: 0.243,
    unsubscribeRate: 0.0025,
    complaintRate: 0.0005,
  },
  medium_performance: {
    recipientCount: 5000,
    deliveredCount: 4900,
    bouncedCount: 100,
    openedCount: 1200,
    clickedCount: 240,
    unsubscribedCount: 15,
    complainedCount: 2,
    deliveryRate: 0.98,
    openRate: 0.245,
    clickRate: 0.2,
    unsubscribeRate: 0.003,
    complaintRate: 0.0004,
  },
  low_performance: {
    recipientCount: 1000,
    deliveredCount: 950,
    bouncedCount: 50,
    openedCount: 150,
    clickedCount: 20,
    unsubscribedCount: 8,
    complainedCount: 3,
    deliveryRate: 0.95,
    openRate: 0.158,
    clickRate: 0.133,
    unsubscribeRate: 0.008,
    complaintRate: 0.003,
  },
};

// Mock subscriber data
export const mockSubscribers: Subscriber[] = [
  {
    id: 'sub_001',
    email: 'arsenal.fan@gmail.com',
    status: 'active',
    preferences: {
      emailFrequency: 'all',
      preferredTeams: ['arsenal'],
      receiveBreakingNews: true,
      emailFormat: 'html',
      timezone: 'Europe/London',
      language: 'en',
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
    lastEmailSent: new Date('2024-01-15T08:00:00.000Z'),
    lastEngagement: new Date('2024-01-15T08:05:00.000Z'),
    subscriptionSource: 'website',
    emailsReceived: 45,
    emailsOpened: 38,
    linksClicked: 12,
    lastOpenedAt: new Date('2024-01-15T08:05:00.000Z'),
    lastClickedAt: new Date('2024-01-14T14:30:00.000Z'),
    gdprConsent: true,
    consentDate: new Date('2024-01-01T10:00:00.000Z'),
    dataProcessingConsent: true,
    createdAt: new Date('2024-01-01T10:00:00.000Z'),
    updatedAt: new Date('2024-01-15T08:00:00.000Z'),
    isTestAccount: false,
  },
  {
    id: 'sub_002',
    email: 'chelsea.supporter@outlook.com',
    status: 'active',
    preferences: {
      emailFrequency: 'daily',
      preferredTeams: ['chelsea', 'manchester_city'],
      receiveBreakingNews: true,
      emailFormat: 'html',
      timezone: 'Europe/London',
      language: 'en',
      includeRumours: false,
      includeConfirmed: true,
      includeLoanDeals: true,
      includeYouthPlayers: true,
      marketingEmails: true,
      surveyParticipation: false,
      feedbackRequests: true,
    },
    subscribedAt: new Date('2024-01-05T14:30:00.000Z'),
    confirmedAt: new Date('2024-01-05T14:45:00.000Z'),
    lastEmailSent: new Date('2024-01-15T20:00:00.000Z'),
    subscriptionSource: 'social_media',
    emailsReceived: 10,
    emailsOpened: 8,
    linksClicked: 3,
    lastOpenedAt: new Date('2024-01-15T20:15:00.000Z'),
    gdprConsent: true,
    consentDate: new Date('2024-01-05T14:30:00.000Z'),
    dataProcessingConsent: true,
    createdAt: new Date('2024-01-05T14:30:00.000Z'),
    updatedAt: new Date('2024-01-15T20:00:00.000Z'),
    isTestAccount: false,
  },
];

// Mock email events
export const mockEmailEvents = {
  opens: [
    {
      subscriberId: 'sub_001',
      campaignId: 'campaign_morning_001',
      openedAt: new Date('2024-01-15T08:05:00.000Z'),
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      location: {
        country: 'GB',
        region: 'England',
        city: 'London',
      },
    } as EmailOpenEvent,
  ],
  clicks: [
    {
      subscriberId: 'sub_001',
      campaignId: 'campaign_morning_001',
      clickedAt: new Date('2024-01-15T08:07:00.000Z'),
      url: 'https://transferjuice.com/morning/arsenal-rice-update',
      linkText: 'Read more about the Arsenal deal',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    } as EmailClickEvent,
  ],
};

// Mock email service implementations
export class MockEmailService {
  private shouldThrowError = false;
  private deliverySuccess = true;
  private responseDelay = 0;
  private provider: 'convertkit' | 'mailerlite' | 'postmark' = 'convertkit';

  constructor() {
    this.reset();
  }

  reset() {
    this.shouldThrowError = false;
    this.deliverySuccess = true;
    this.responseDelay = 0;
    this.provider = 'convertkit';
  }

  setError(enabled: boolean) {
    this.shouldThrowError = enabled;
  }

  setDeliverySuccess(success: boolean) {
    this.deliverySuccess = success;
  }

  setResponseDelay(ms: number) {
    this.responseDelay = ms;
  }

  setProvider(provider: 'convertkit' | 'mailerlite' | 'postmark') {
    this.provider = provider;
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    textContent?: string
  ): Promise<typeof mockEmailDeliveryResponse.success> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error(`${this.provider} API error`);
    }

    if (!this.deliverySuccess) {
      if (to.includes('bounced')) {
        return { ...mockEmailDeliveryResponse.bounce, provider: this.provider };
      } else if (to.includes('complaint')) {
        return {
          ...mockEmailDeliveryResponse.complaint,
          provider: this.provider,
        };
      }
    }

    return {
      ...mockEmailDeliveryResponse.success,
      recipientEmail: to,
      provider: this.provider,
      sentAt: new Date().toISOString(),
    };
  }

  async sendCampaign(campaign: EmailCampaign): Promise<{
    campaignId: string;
    recipientCount: number;
    estimatedDeliveryTime: string;
  }> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error(`${this.provider} API error`);
    }

    return {
      campaignId: campaign.id,
      recipientCount: campaign.metrics?.recipientCount || 0,
      estimatedDeliveryTime: '10-15 minutes',
    };
  }

  async subscribeUser(
    request: SubscribeRequest
  ): Promise<{ subscriberId: string; confirmationEmailSent: boolean }> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error(`${this.provider} API error`);
    }

    return {
      subscriberId: `sub_${Date.now()}`,
      confirmationEmailSent: true,
    };
  }

  async unsubscribeUser(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error(`${this.provider} API error`);
    }

    return {
      success: true,
      message: 'User successfully unsubscribed',
    };
  }

  async getCampaignMetrics(
    campaignId: string
  ): Promise<typeof mockCampaignMetrics.high_performance> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error(`${this.provider} API error`);
    }

    // Return different metrics based on campaign ID for testing
    if (campaignId.includes('high')) {
      return mockCampaignMetrics.high_performance;
    } else if (campaignId.includes('medium')) {
      return mockCampaignMetrics.medium_performance;
    } else {
      return mockCampaignMetrics.low_performance;
    }
  }

  async getSubscriberList(): Promise<Subscriber[]> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error(`${this.provider} API error`);
    }

    return mockSubscribers;
  }

  async getEmailEvents(campaignId: string): Promise<{
    opens: EmailOpenEvent[];
    clicks: EmailClickEvent[];
  }> {
    if (this.responseDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.responseDelay));
    }

    if (this.shouldThrowError) {
      throw new Error(`${this.provider} API error`);
    }

    return mockEmailEvents;
  }
}

// Test email templates
export const mockEmailTemplates = {
  morning_brief: {
    subject: '🌅 Transfer Juice Morning Brief - {{date}}',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transfer Juice Morning Brief</title>
        </head>
        <body>
          <h1>Good Morning, Transfer Addicts! ☕</h1>
          <p>Here's what's cooking in the transfer world this morning...</p>
          {{content}}
          <footer>
            <p>You're receiving this because you subscribed to Transfer Juice.</p>
            <a href="{{unsubscribe_url}}">Unsubscribe</a>
          </footer>
        </body>
      </html>
    `,
    text: `
      Transfer Juice Morning Brief - {{date}}
      
      Good Morning, Transfer Addicts!
      
      Here's what's cooking in the transfer world this morning...
      
      {{content}}
      
      ---
      You're receiving this because you subscribed to Transfer Juice.
      Unsubscribe: {{unsubscribe_url}}
    `,
  },
  breaking_news: {
    subject: '🚨 BREAKING: {{headline}}',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transfer Juice Breaking News</title>
        </head>
        <body>
          <h1 style="color: #d32f2f;">🚨 BREAKING NEWS 🚨</h1>
          <h2>{{headline}}</h2>
          {{content}}
          <footer>
            <p>You're receiving this because you subscribed to Transfer Juice breaking news.</p>
            <a href="{{unsubscribe_url}}">Unsubscribe</a>
          </footer>
        </body>
      </html>
    `,
    text: `
      🚨 BREAKING NEWS 🚨
      
      {{headline}}
      
      {{content}}
      
      ---
      You're receiving this because you subscribed to Transfer Juice breaking news.
      Unsubscribe: {{unsubscribe_url}}
    `,
  },
};

export const mockEmailService = new MockEmailService();
