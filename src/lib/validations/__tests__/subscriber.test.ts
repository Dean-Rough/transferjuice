import {
  EmailSchema,
  SubscriberSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
  UpdatePreferencesSchema,
  EmailCampaignSchema,
} from '../subscriber';

describe('Subscriber Validation Schemas', () => {
  describe('EmailSchema', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'test123@sub.domain.com',
        'a@b.co',
      ];

      validEmails.forEach((email) => {
        expect(email).toBeValidZodSchema(EmailSchema);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@domain.com',
        'user@',
        'user..name@domain.com', // Double dots
        '.user@domain.com', // Starting with dot
        'user.@domain.com', // Ending with dot
        'user@domain@com', // Multiple @ symbols
        'user @domain.com', // Whitespace
        'user@domain.', // Domain ending with dot
        'user@.domain.com', // Domain starting with dot
        '', // Empty string
        'a@b', // No TLD
      ];

      invalidEmails.forEach((email) => {
        expect(email).toHaveZodError(EmailSchema);
      });
    });

    it('should reject emails that are too short or too long', () => {
      const tooShort = 'a@b';
      const tooLong = 'a'.repeat(250) + '@example.com';

      expect(tooShort).toHaveZodError(EmailSchema);
      expect(tooLong).toHaveZodError(EmailSchema);
    });
  });

  describe('SubscriberSchema', () => {
    it('should validate a complete subscriber object', () => {
      const validSubscriber = testUtils.createMockSubscriber();
      expect(validSubscriber).toBeValidZodSchema(SubscriberSchema);
    });

    it('should validate subscriber with minimal required fields', () => {
      const minimalSubscriber = {
        id: 'sub_123',
        email: 'test@example.com',
        status: 'active',
        preferences: {
          emailFrequency: 'all',
          preferredTeams: [],
          receiveBreakingNews: true,
          emailFormat: 'html',
          timezone: 'Europe/London',
          language: 'en',
          includeRumours: true,
          includeConfirmed: true,
          includeLoanDeals: true,
          includeYouthPlayers: false,
          marketingEmails: false,
          surveyParticipation: false,
          feedbackRequests: true,
        },
        subscribedAt: new Date(),
        subscriptionSource: 'website',
        emailsReceived: 0,
        emailsOpened: 0,
        linksClicked: 0,
        gdprConsent: true,
        dataProcessingConsent: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        isTestAccount: false,
      };
      expect(minimalSubscriber).toBeValidZodSchema(SubscriberSchema);
    });

    it('should reject invalid email in subscriber', () => {
      const invalidSubscriber = testUtils.createMockSubscriber({
        email: 'invalid-email',
      });
      expect(invalidSubscriber).toHaveZodError(SubscriberSchema);
    });

    it('should reject invalid subscription status', () => {
      const invalidSubscriber = testUtils.createMockSubscriber({
        status: 'invalid_status',
      });
      expect(invalidSubscriber).toHaveZodError(SubscriberSchema);
    });

    it('should reject negative engagement metrics', () => {
      const invalidSubscriber = testUtils.createMockSubscriber({
        emailsReceived: -1,
      });
      expect(invalidSubscriber).toHaveZodError(SubscriberSchema);
    });

    it('should reject too many preferred teams', () => {
      const invalidSubscriber = testUtils.createMockSubscriber({
        preferences: {
          ...testUtils.createMockSubscriber().preferences,
          preferredTeams: [
            'arsenal',
            'chelsea',
            'tottenham',
            'liverpool',
            'manchester_city',
            'manchester_united',
          ], // 6 teams, max is 5
        },
      });
      expect(invalidSubscriber).toHaveZodError(SubscriberSchema);
    });

    it('should reject invalid IP address format', () => {
      const invalidSubscriber = testUtils.createMockSubscriber({
        ipAddress: '999.999.999.999',
      });
      expect(invalidSubscriber).toHaveZodError(SubscriberSchema);
    });

    it('should accept valid IP addresses', () => {
      const validIPv4 = testUtils.createMockSubscriber({
        ipAddress: '192.168.1.1',
      });
      const validIPv6 = testUtils.createMockSubscriber({
        ipAddress: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      });

      expect(validIPv4).toBeValidZodSchema(SubscriberSchema);
      expect(validIPv6).toBeValidZodSchema(SubscriberSchema);
    });
  });

  describe('SubscribeRequestSchema', () => {
    it('should validate valid subscription request', () => {
      const validRequest = {
        email: 'test@example.com',
        gdprConsent: true,
        subscriptionSource: 'website',
      };
      expect(validRequest).toBeValidZodSchema(SubscribeRequestSchema);
    });

    it('should validate request with preferences', () => {
      const requestWithPreferences = {
        email: 'test@example.com',
        preferences: {
          emailFrequency: 'daily',
          preferredTeams: ['arsenal', 'chelsea'],
          receiveBreakingNews: false,
        },
        gdprConsent: true,
        subscriptionSource: 'social_media',
      };
      expect(requestWithPreferences).toBeValidZodSchema(SubscribeRequestSchema);
    });

    it('should validate request with UTM parameters', () => {
      const requestWithUTM = {
        email: 'test@example.com',
        gdprConsent: true,
        subscriptionSource: 'paid_ad',
        utmParameters: {
          source: 'google',
          medium: 'cpc',
          campaign: 'summer_transfers',
          term: 'transfer news',
          content: 'homepage_cta',
        },
      };
      expect(requestWithUTM).toBeValidZodSchema(SubscribeRequestSchema);
    });

    it('should reject request without GDPR consent', () => {
      const invalidRequest = {
        email: 'test@example.com',
        gdprConsent: false,
      };
      expect(invalidRequest).toHaveZodError(
        SubscribeRequestSchema,
        'GDPR consent is required'
      );
    });

    it('should reject request with invalid email', () => {
      const invalidRequest = {
        email: 'invalid-email',
        gdprConsent: true,
      };
      expect(invalidRequest).toHaveZodError(SubscribeRequestSchema);
    });

    it('should reject invalid subscription source', () => {
      const invalidRequest = {
        email: 'test@example.com',
        gdprConsent: true,
        subscriptionSource: 'invalid_source',
      };
      expect(invalidRequest).toHaveZodError(SubscribeRequestSchema);
    });
  });

  describe('UpdatePreferencesSchema', () => {
    it('should validate partial preference updates', () => {
      const validUpdate = {
        emailFrequency: 'weekly',
        receiveBreakingNews: false,
      };
      expect(validUpdate).toBeValidZodSchema(UpdatePreferencesSchema);
    });

    it('should validate empty preference update', () => {
      const emptyUpdate = {};
      expect(emptyUpdate).toBeValidZodSchema(UpdatePreferencesSchema);
    });

    it('should validate preference update with teams', () => {
      const updateWithTeams = {
        preferredTeams: ['liverpool', 'manchester_city'],
        includeRumours: false,
      };
      expect(updateWithTeams).toBeValidZodSchema(UpdatePreferencesSchema);
    });

    it('should reject too many preferred teams', () => {
      const invalidUpdate = {
        preferredTeams: [
          'arsenal',
          'chelsea',
          'tottenham',
          'liverpool',
          'manchester_city',
          'manchester_united',
        ],
      };
      expect(invalidUpdate).toHaveZodError(UpdatePreferencesSchema);
    });
  });

  describe('UnsubscribeRequestSchema', () => {
    it('should validate unsubscribe request with reason', () => {
      const validRequest = {
        email: 'test@example.com',
        reason: 'too_frequent',
        feedback: 'Receiving too many emails per day',
      };
      expect(validRequest).toBeValidZodSchema(UnsubscribeRequestSchema);
    });

    it('should validate unsubscribe request without reason', () => {
      const validRequest = {
        email: 'test@example.com',
      };
      expect(validRequest).toBeValidZodSchema(UnsubscribeRequestSchema);
    });

    it('should reject invalid email', () => {
      const invalidRequest = {
        email: 'invalid-email',
        reason: 'not_relevant',
      };
      expect(invalidRequest).toHaveZodError(UnsubscribeRequestSchema);
    });

    it('should reject invalid reason', () => {
      const invalidRequest = {
        email: 'test@example.com',
        reason: 'invalid_reason',
      };
      expect(invalidRequest).toHaveZodError(UnsubscribeRequestSchema);
    });

    it('should reject feedback that is too long', () => {
      const invalidRequest = {
        email: 'test@example.com',
        reason: 'other',
        feedback: 'a'.repeat(501), // Max is 500
      };
      expect(invalidRequest).toHaveZodError(UnsubscribeRequestSchema);
    });
  });

  describe('EmailCampaignSchema', () => {
    it('should validate complete email campaign', () => {
      const validCampaign = {
        id: 'campaign_123',
        name: 'Morning Briefing - Dec 1',
        type: 'briefing',
        subject: 'Your Morning Transfer Update',
        preheader: 'Latest transfer news from the Premier League',
        htmlContent:
          '<html><body>This is a comprehensive campaign content that meets the minimum length requirement for HTML email content with proper formatting and structure to ensure good delivery and engagement rates.</body></html>',
        textContent:
          'This is a comprehensive campaign content that meets the minimum length requirement for plain text email content with proper formatting and structure to ensure good delivery and engagement rates.',
        targetAudience: {
          includeStatuses: ['active'],
          excludeStatuses: ['unsubscribed', 'bounced'],
        },
        status: 'draft',
        metrics: {
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
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user_123',
      };
      expect(validCampaign).toBeValidZodSchema(EmailCampaignSchema);
    });

    it('should validate campaign with scheduling', () => {
      const scheduledCampaign = {
        id: 'campaign_123',
        name: 'Morning Briefing - Dec 1',
        type: 'briefing',
        subject: 'Your Morning Transfer Update',
        htmlContent:
          '<html><body>This is a comprehensive campaign content that meets the minimum length requirement for HTML email content with proper formatting and structure to ensure good delivery and engagement rates.</body></html>',
        textContent:
          'This is a comprehensive campaign content that meets the minimum length requirement for plain text email content with proper formatting and structure to ensure good delivery and engagement rates.',
        targetAudience: {
          includeStatuses: ['active'],
          excludeStatuses: ['unsubscribed'],
        },
        scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user_123',
      };
      expect(scheduledCampaign).toBeValidZodSchema(EmailCampaignSchema);
    });

    it('should validate campaign with team targeting', () => {
      const targetedCampaign = {
        id: 'campaign_123',
        name: 'Arsenal Transfer Special',
        type: 'breaking_news',
        subject: 'Arsenal Complete Major Signing!',
        htmlContent:
          '<html><body><h1>Arsenal Complete Major Signing!</h1><p>Arsenal have completed the signing of a major player in this transfer window. This is fantastic news for Arsenal fans everywhere as the club continues to strengthen their squad for the upcoming season.</p></body></html>',
        textContent:
          'Arsenal Complete Major Signing! Arsenal have completed the signing of a major player in this transfer window. This is fantastic news for Arsenal fans everywhere as the club continues to strengthen their squad for the upcoming season.',
        targetAudience: {
          includeStatuses: ['active'],
          excludeStatuses: ['unsubscribed'],
          preferredTeams: ['arsenal'],
          emailFrequency: ['all', 'daily'],
        },
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user_123',
      };
      expect(targetedCampaign).toBeValidZodSchema(EmailCampaignSchema);
    });

    it('should reject campaign with invalid subject length', () => {
      const invalidCampaign = {
        id: 'campaign_123',
        name: 'Test Campaign',
        type: 'briefing',
        subject: 'a'.repeat(101), // Too long
        htmlContent: '<html><body>Content</body></html>',
        textContent: 'Content',
        targetAudience: {
          includeStatuses: ['active'],
          excludeStatuses: ['unsubscribed'],
        },
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user_123',
      };
      expect(invalidCampaign).toHaveZodError(EmailCampaignSchema);
    });

    it('should reject campaign with insufficient content', () => {
      const invalidCampaign = {
        id: 'campaign_123',
        name: 'Test Campaign',
        type: 'briefing',
        subject: 'Valid Subject',
        htmlContent: 'short', // Too short
        textContent: 'short', // Too short
        targetAudience: {
          includeStatuses: ['active'],
          excludeStatuses: ['unsubscribed'],
        },
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user_123',
      };
      expect(invalidCampaign).toHaveZodError(EmailCampaignSchema);
    });

    it('should reject invalid campaign metrics', () => {
      const invalidCampaign = {
        id: 'campaign_123',
        name: 'Test Campaign',
        type: 'briefing',
        subject: 'Valid Subject',
        htmlContent: '<html><body>Valid content here</body></html>',
        textContent: 'Valid content here in plain text format',
        targetAudience: {
          includeStatuses: ['active'],
          excludeStatuses: ['unsubscribed'],
        },
        status: 'sent',
        metrics: {
          recipientCount: 100,
          deliveredCount: 95,
          bouncedCount: 5,
          openedCount: 50,
          clickedCount: 10,
          unsubscribedCount: 2,
          complainedCount: 1,
          deliveryRate: 1.5, // Invalid: > 1
          openRate: 0.5,
          clickRate: 0.1,
          unsubscribeRate: 0.02,
          complaintRate: 0.01,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'user_123',
      };
      expect(invalidCampaign).toHaveZodError(EmailCampaignSchema);
    });
  });
});
