import { z } from 'zod';

/**
 * Subscriber and Email Management Schemas
 * Validates subscriber data and email campaign structures
 */

// Subscription status
export const SubscriptionStatusSchema = z.enum([
  'pending', // Waiting for email confirmation
  'active', // Confirmed and receiving emails
  'paused', // Temporarily paused by user
  'unsubscribed', // Permanently unsubscribed
  'bounced', // Email bounced
  'complained', // Marked as spam
]);

// Email frequency preferences
export const EmailFrequencySchema = z.enum([
  'all', // All briefings (3x daily)
  'daily', // Once daily (evening summary)
  'weekly', // Weekly digest
  'major_only', // Only major transfer news
]);

// Preferred teams (for personalization)
export const PreferredTeamSchema = z.enum([
  'arsenal',
  'aston_villa',
  'bournemouth',
  'brentford',
  'brighton',
  'burnley',
  'chelsea',
  'crystal_palace',
  'everton',
  'fulham',
  'liverpool',
  'luton',
  'manchester_city',
  'manchester_united',
  'newcastle',
  'nottingham_forest',
  'sheffield_united',
  'tottenham',
  'west_ham',
  'wolves',
]);

// Subscriber preferences
export const SubscriberPreferencesSchema = z.object({
  emailFrequency: EmailFrequencySchema.default('all'),
  preferredTeams: z.array(PreferredTeamSchema).max(5).default([]),
  receiveBreakingNews: z.boolean().default(true),
  emailFormat: z.enum(['html', 'text']).default('html'),
  timezone: z.string().default('Europe/London'),
  language: z.enum(['en']).default('en'), // Future expansion

  // Content preferences
  includeRumours: z.boolean().default(true),
  includeConfirmed: z.boolean().default(true),
  includeLoanDeals: z.boolean().default(true),
  includeYouthPlayers: z.boolean().default(false),

  // Communication preferences
  marketingEmails: z.boolean().default(false),
  surveyParticipation: z.boolean().default(false),
  feedbackRequests: z.boolean().default(true),
});

// Email validation with comprehensive checks
export const EmailSchema = z
  .string()
  .email({ message: 'Please enter a valid email address' })
  .min(5, { message: 'Email must be at least 5 characters long' })
  .max(254, { message: 'Email must be no more than 254 characters long' })
  .refine(
    (email) => {
      // Check for common invalid patterns
      const invalidPatterns = [
        /\.\./, // Double dots
        /^\./, // Starting with dot
        /\.$/, // Ending with dot
        /@.*@/, // Multiple @ symbols
        /\s/, // Whitespace
      ];
      return !invalidPatterns.some((pattern) => pattern.test(email));
    },
    { message: 'Email format is invalid' }
  )
  .refine(
    (email) => {
      // Check for valid domain structure
      const domainPart = email.split('@')[1];
      return (
        domainPart &&
        domainPart.includes('.') &&
        !domainPart.startsWith('.') &&
        !domainPart.endsWith('.')
      );
    },
    { message: 'Email domain is invalid' }
  );

// Main subscriber schema
export const SubscriberSchema = z.object({
  id: z.string(),
  email: EmailSchema,
  status: SubscriptionStatusSchema,
  preferences: SubscriberPreferencesSchema,

  // Subscription tracking
  subscribedAt: z.date(),
  confirmedAt: z.date().optional(),
  lastEmailSent: z.date().optional(),
  lastEngagement: z.date().optional(),

  // Source tracking
  subscriptionSource: z
    .enum([
      'website',
      'social_media',
      'referral',
      'organic',
      'paid_ad',
      'other',
    ])
    .default('website'),
  referrerUrl: z.string().url().optional(),
  utmParameters: z
    .object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
      term: z.string().optional(),
      content: z.string().optional(),
    })
    .optional(),

  // Engagement metrics
  emailsReceived: z.number().min(0).default(0),
  emailsOpened: z.number().min(0).default(0),
  linksClicked: z.number().min(0).default(0),
  lastOpenedAt: z.date().optional(),
  lastClickedAt: z.date().optional(),

  // Device and location info (anonymized)
  lastKnownLocation: z
    .object({
      country: z.string().length(2).optional(), // ISO country code
      region: z.string().optional(),
      city: z.string().optional(),
    })
    .optional(),
  deviceInfo: z
    .object({
      platform: z.enum(['mobile', 'tablet', 'desktop', 'unknown']).optional(),
      emailClient: z.string().optional(),
    })
    .optional(),

  // Unsubscribe tracking
  unsubscribedAt: z.date().optional(),
  unsubscribeReason: z
    .enum([
      'too_frequent',
      'not_relevant',
      'poor_quality',
      'changed_email',
      'privacy_concerns',
      'other',
    ])
    .optional(),
  unsubscribeFeedback: z.string().max(500).optional(),

  // Data compliance
  gdprConsent: z.boolean().default(false),
  consentDate: z.date().optional(),
  dataProcessingConsent: z.boolean().default(false),
  ipAddress: z.string().ip().optional(), // For audit trail

  // System fields
  createdAt: z.date(),
  updatedAt: z.date(),
  isTestAccount: z.boolean().default(false),
});

// Email campaign schemas
export const EmailCampaignSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  type: z.enum([
    'briefing',
    'breaking_news',
    'weekly_digest',
    'welcome',
    'reengagement',
  ]),

  // Content
  subject: z.string().min(5).max(100),
  preheader: z.string().min(10).max(200).optional(),
  htmlContent: z.string().min(100),
  textContent: z.string().min(100),

  // Targeting
  targetAudience: z.object({
    includeStatuses: z.array(SubscriptionStatusSchema).default(['active']),
    excludeStatuses: z
      .array(SubscriptionStatusSchema)
      .default(['unsubscribed', 'bounced', 'complained']),
    preferredTeams: z.array(PreferredTeamSchema).optional(),
    emailFrequency: z.array(EmailFrequencySchema).optional(),
    lastEngagementBefore: z.date().optional(),
    lastEngagementAfter: z.date().optional(),
  }),

  // Scheduling
  scheduledAt: z.date().optional(),
  sentAt: z.date().optional(),
  status: z.enum(['draft', 'scheduled', 'sending', 'sent', 'cancelled']),

  // Performance metrics
  metrics: z
    .object({
      recipientCount: z.number().min(0).default(0),
      deliveredCount: z.number().min(0).default(0),
      bouncedCount: z.number().min(0).default(0),
      openedCount: z.number().min(0).default(0),
      clickedCount: z.number().min(0).default(0),
      unsubscribedCount: z.number().min(0).default(0),
      complainedCount: z.number().min(0).default(0),

      // Calculated rates
      deliveryRate: z.number().min(0).max(1).default(0),
      openRate: z.number().min(0).max(1).default(0),
      clickRate: z.number().min(0).max(1).default(0),
      unsubscribeRate: z.number().min(0).max(1).default(0),
      complaintRate: z.number().min(0).max(1).default(0),
    })
    .default({
      recipientCount: 0,
      deliveredCount: 0,
      bouncedCount: 0,
      openedCount: 0,
      clickedCount: 0,
      unsubscribedCount: 0,
      complainedCount: 0,
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0,
      unsubscribeRate: 0,
      complaintRate: 0,
    })
    .optional(),

  // System fields
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
});

// Subscriber action schemas
export const SubscribeRequestSchema = z.object({
  email: EmailSchema,
  preferences: SubscriberPreferencesSchema.partial().optional(),
  gdprConsent: z.boolean().refine((val) => val === true, {
    message: 'GDPR consent is required',
  }),
  subscriptionSource: z
    .enum([
      'website',
      'social_media',
      'referral',
      'organic',
      'paid_ad',
      'other',
    ])
    .default('website'),
  referrerUrl: z.string().url().optional(),
  utmParameters: z
    .object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
      term: z.string().optional(),
      content: z.string().optional(),
    })
    .optional(),
});

export const UpdatePreferencesSchema = SubscriberPreferencesSchema.partial();

export const UnsubscribeRequestSchema = z.object({
  email: EmailSchema,
  reason: z
    .enum([
      'too_frequent',
      'not_relevant',
      'poor_quality',
      'changed_email',
      'privacy_concerns',
      'other',
    ])
    .optional(),
  feedback: z.string().max(500).optional(),
});

// Email tracking schemas
export const EmailOpenEventSchema = z.object({
  subscriberId: z.string(),
  campaignId: z.string(),
  openedAt: z.date(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  location: z
    .object({
      country: z.string().length(2).optional(),
      region: z.string().optional(),
      city: z.string().optional(),
    })
    .optional(),
});

export const EmailClickEventSchema = z.object({
  subscriberId: z.string(),
  campaignId: z.string(),
  clickedAt: z.date(),
  url: z.string().url(),
  linkText: z.string().optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
});

// Subscriber analytics query schema
export const SubscriberAnalyticsQuerySchema = z.object({
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  segmentBy: z.enum(['status', 'source', 'team', 'frequency']).optional(),
  metrics: z
    .array(z.enum(['growth', 'engagement', 'churn', 'ltv']))
    .default(['growth']),
});

// Export types
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;
export type EmailFrequency = z.infer<typeof EmailFrequencySchema>;
export type PreferredTeam = z.infer<typeof PreferredTeamSchema>;
export type SubscriberPreferences = z.infer<typeof SubscriberPreferencesSchema>;
export type Subscriber = z.infer<typeof SubscriberSchema>;
export type EmailCampaign = z.infer<typeof EmailCampaignSchema>;
export type SubscribeRequest = z.infer<typeof SubscribeRequestSchema>;
export type UpdatePreferences = z.infer<typeof UpdatePreferencesSchema>;
export type UnsubscribeRequest = z.infer<typeof UnsubscribeRequestSchema>;
export type EmailOpenEvent = z.infer<typeof EmailOpenEventSchema>;
export type EmailClickEvent = z.infer<typeof EmailClickEventSchema>;
export type SubscriberAnalyticsQuery = z.infer<
  typeof SubscriberAnalyticsQuerySchema
>;
