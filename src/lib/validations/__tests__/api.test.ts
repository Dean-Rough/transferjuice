import {
  ApiResponseSchema,
  ApiErrorSchema,
  HealthCheckSchema,
  SubscribeRequestSchema,
  ArticlesQuerySchema,
  GenerateContentRequestSchema,
  TrackEventRequestSchema,
} from '../api';

describe('API Validation Schemas', () => {
  describe('ApiResponseSchema', () => {
    it('should validate successful API response', () => {
      const dataSchema = { name: 'Test', id: '123' };
      const response = {
        success: true,
        data: dataSchema,
        message: 'Operation successful',
        meta: {
          timestamp: '2023-12-01T10:00:00.000Z',
          requestId: 'req_123',
          version: '1.0.0',
        },
      };

      const ResponseSchema = ApiResponseSchema(
        require('zod').object({
          name: require('zod').string(),
          id: require('zod').string(),
        })
      );

      expect(response).toBeValidZodSchema(ResponseSchema);
    });

    it('should validate response with pagination', () => {
      const dataSchema = [{ id: '1' }, { id: '2' }];
      const response = {
        success: true,
        data: dataSchema,
        meta: {
          timestamp: '2023-12-01T10:00:00.000Z',
          requestId: 'req_123',
          version: '1.0.0',
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            hasMore: false,
          },
        },
      };

      const ResponseSchema = ApiResponseSchema(
        require('zod').array(
          require('zod').object({
            id: require('zod').string(),
          })
        )
      );

      expect(response).toBeValidZodSchema(ResponseSchema);
    });

    it('should validate response with errors', () => {
      const response = {
        success: false,
        errors: [
          {
            field: 'email',
            message: 'Invalid email format',
            code: 'INVALID_EMAIL',
          },
        ],
        meta: {
          timestamp: '2023-12-01T10:00:00.000Z',
          requestId: 'req_123',
          version: '1.0.0',
        },
      };

      const ResponseSchema = ApiResponseSchema(require('zod').any());

      expect(response).toBeValidZodSchema(ResponseSchema);
    });
  });

  describe('ApiErrorSchema', () => {
    it('should validate API error response', () => {
      const error = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: {
            field: 'email',
            value: 'invalid-email',
          },
          field: 'email',
        },
        meta: {
          timestamp: '2023-12-01T10:00:00.000Z',
          requestId: 'req_123',
          version: '1.0.0',
        },
      };

      expect(error).toBeValidZodSchema(ApiErrorSchema);
    });

    it('should validate minimal error response', () => {
      const error = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred',
        },
        meta: {
          timestamp: '2023-12-01T10:00:00.000Z',
          requestId: 'req_123',
          version: '1.0.0',
        },
      };

      expect(error).toBeValidZodSchema(ApiErrorSchema);
    });

    it('should reject success: true in error schema', () => {
      const invalidError = {
        success: true, // Should be false for error schema
        error: {
          code: 'TEST_ERROR',
          message: 'Test error',
        },
        meta: {
          timestamp: '2023-12-01T10:00:00.000Z',
          requestId: 'req_123',
          version: '1.0.0',
        },
      };

      expect(invalidError).toHaveZodError(ApiErrorSchema);
    });
  });

  describe('HealthCheckSchema', () => {
    it('should validate healthy system status', () => {
      const healthCheck = {
        status: 'healthy',
        timestamp: '2023-12-01T10:00:00.000Z',
        version: '1.0.0',
        uptime: 86400,
        services: {
          database: {
            status: 'up',
            responseTime: 15,
            lastCheck: '2023-12-01T10:00:00.000Z',
          },
          twitter: {
            status: 'up',
            responseTime: 250,
            rateLimitRemaining: 500,
            lastCheck: '2023-12-01T10:00:00.000Z',
          },
          ai: {
            status: 'up',
            responseTime: 1200,
            lastCheck: '2023-12-01T10:00:00.000Z',
          },
          email: {
            status: 'up',
            responseTime: 180,
            lastCheck: '2023-12-01T10:00:00.000Z',
          },
        },
      };

      expect(healthCheck).toBeValidZodSchema(HealthCheckSchema);
    });

    it('should validate degraded system status', () => {
      const healthCheck = {
        status: 'degraded',
        timestamp: '2023-12-01T10:00:00.000Z',
        version: '1.0.0',
        uptime: 86400,
        services: {
          database: {
            status: 'up',
            responseTime: 15,
            lastCheck: '2023-12-01T10:00:00.000Z',
          },
          twitter: {
            status: 'degraded',
            responseTime: 5000,
            rateLimitRemaining: 10,
            lastCheck: '2023-12-01T10:00:00.000Z',
          },
          ai: {
            status: 'up',
            responseTime: 1200,
            lastCheck: '2023-12-01T10:00:00.000Z',
          },
          email: {
            status: 'down',
            lastCheck: '2023-12-01T09:55:00.000Z',
          },
        },
      };

      expect(healthCheck).toBeValidZodSchema(HealthCheckSchema);
    });

    it('should reject invalid status values', () => {
      const invalidHealthCheck = {
        status: 'invalid_status',
        timestamp: '2023-12-01T10:00:00.000Z',
        version: '1.0.0',
        uptime: 86400,
        services: {
          database: {
            status: 'up',
            lastCheck: '2023-12-01T10:00:00.000Z',
          },
          twitter: {
            status: 'up',
            lastCheck: '2023-12-01T10:00:00.000Z',
          },
          ai: {
            status: 'up',
            lastCheck: '2023-12-01T10:00:00.000Z',
          },
          email: {
            status: 'up',
            lastCheck: '2023-12-01T10:00:00.000Z',
          },
        },
      };

      expect(invalidHealthCheck).toHaveZodError(HealthCheckSchema);
    });

    it('should reject negative uptime', () => {
      const invalidHealthCheck = {
        status: 'healthy',
        timestamp: '2023-12-01T10:00:00.000Z',
        version: '1.0.0',
        uptime: -100,
        services: {
          database: {
            status: 'up',
            lastCheck: '2023-12-01T10:00:00.000Z',
          },
          twitter: {
            status: 'up',
            lastCheck: '2023-12-01T10:00:00.000Z',
          },
          ai: {
            status: 'up',
            lastCheck: '2023-12-01T10:00:00.000Z',
          },
          email: {
            status: 'up',
            lastCheck: '2023-12-01T10:00:00.000Z',
          },
        },
      };

      expect(invalidHealthCheck).toHaveZodError(HealthCheckSchema);
    });
  });

  describe('SubscribeRequestSchema', () => {
    it('should validate basic subscription request', () => {
      const request = {
        email: 'test@example.com',
        gdprConsent: true,
        subscriptionSource: 'website',
      };

      expect(request).toBeValidZodSchema(SubscribeRequestSchema);
    });

    it('should validate request with preferences', () => {
      const request = {
        email: 'test@example.com',
        preferences: {
          emailFrequency: 'daily',
          preferredTeams: ['arsenal', 'chelsea'],
          receiveBreakingNews: false,
        },
        gdprConsent: true,
        subscriptionSource: 'social_media',
        utmParameters: {
          source: 'twitter',
          medium: 'social',
          campaign: 'transfer_season',
        },
      };

      expect(request).toBeValidZodSchema(SubscribeRequestSchema);
    });

    it('should reject request without GDPR consent', () => {
      const request = {
        email: 'test@example.com',
        gdprConsent: false,
      };

      expect(request).toHaveZodError(
        SubscribeRequestSchema,
        'GDPR consent is required'
      );
    });

    it('should reject invalid email format', () => {
      const request = {
        email: 'invalid-email',
        gdprConsent: true,
      };

      expect(request).toHaveZodError(SubscribeRequestSchema);
    });

    it('should reject too many preferred teams', () => {
      const request = {
        email: 'test@example.com',
        preferences: {
          preferredTeams: [
            'arsenal',
            'chelsea',
            'tottenham',
            'liverpool',
            'manchester_city',
            'manchester_united',
          ],
        },
        gdprConsent: true,
      };

      expect(request).toHaveZodError(SubscribeRequestSchema);
    });
  });

  describe('ArticlesQuerySchema', () => {
    it('should validate basic articles query', () => {
      const query = {
        page: 1,
        limit: 10,
      };

      expect(query).toBeValidZodSchema(ArticlesQuerySchema);
    });

    it('should validate query with filters', () => {
      const query = {
        briefingType: 'morning',
        status: 'published',
        publishedAfter: '2023-12-01T00:00:00.000Z',
        publishedBefore: '2023-12-31T23:59:59.999Z',
        search: 'Haaland transfer',
        tags: 'manchester_city,transfers,confirmed',
        page: 1,
        limit: 20,
        sort: {
          field: 'publishedAt',
          order: 'desc',
        },
      };

      expect(query).toBeValidZodSchema(ArticlesQuerySchema);
    });

    it('should validate query with transformed tags', () => {
      const query = {
        tags: 'tag1, tag2, tag3',
        page: 1,
        limit: 10,
      };

      const result = ArticlesQuerySchema.parse(query);
      expect(result.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should reject invalid briefing type', () => {
      const query = {
        briefingType: 'invalid_type',
        page: 1,
        limit: 10,
      };

      expect(query).toHaveZodError(ArticlesQuerySchema);
    });

    it('should reject invalid pagination values', () => {
      const query = {
        page: 0, // Must be >= 1
        limit: 101, // Must be <= 100
      };

      expect(query).toHaveZodError(ArticlesQuerySchema);
    });

    it('should reject search query that is too short', () => {
      const query = {
        search: 'ab', // Must be >= 3 characters
        page: 1,
        limit: 10,
      };

      expect(query).toHaveZodError(ArticlesQuerySchema);
    });
  });

  describe('GenerateContentRequestSchema', () => {
    it('should validate content generation request', () => {
      const request = {
        briefingType: 'morning',
        sourceTweetIds: ['1234567890', '0987654321'],
        targetWordCount: 800,
        tone: 'witty',
        includeImages: true,
        customInstructions: 'Focus on Premier League transfers',
      };

      expect(request).toBeValidZodSchema(GenerateContentRequestSchema);
    });

    it('should validate minimal request with defaults', () => {
      const request = {
        briefingType: 'afternoon',
        sourceTweetIds: ['1234567890'],
      };

      const result = GenerateContentRequestSchema.parse(request);
      expect(result.targetWordCount).toBe(800);
      expect(result.tone).toBe('witty');
      expect(result.includeImages).toBe(true);
      expect(result.draftMode).toBe(false);
    });

    it('should reject empty source tweets array', () => {
      const request = {
        briefingType: 'evening',
        sourceTweetIds: [],
      };

      expect(request).toHaveZodError(GenerateContentRequestSchema);
    });

    it('should reject too many source tweets', () => {
      const request = {
        briefingType: 'morning',
        sourceTweetIds: Array.from({ length: 51 }, (_, i) => `tweet_${i}`),
      };

      expect(request).toHaveZodError(GenerateContentRequestSchema);
    });

    it('should reject invalid target word count', () => {
      const request = {
        briefingType: 'morning',
        sourceTweetIds: ['1234567890'],
        targetWordCount: 50, // Too low
      };

      expect(request).toHaveZodError(GenerateContentRequestSchema);
    });

    it('should reject invalid tone', () => {
      const request = {
        briefingType: 'morning',
        sourceTweetIds: ['1234567890'],
        tone: 'invalid_tone',
      };

      expect(request).toHaveZodError(GenerateContentRequestSchema);
    });

    it('should reject custom instructions that are too long', () => {
      const request = {
        briefingType: 'morning',
        sourceTweetIds: ['1234567890'],
        customInstructions: 'a'.repeat(1001), // Max is 1000
      };

      expect(request).toHaveZodError(GenerateContentRequestSchema);
    });
  });

  describe('TrackEventRequestSchema', () => {
    it('should validate page view event', () => {
      const request = {
        event: 'page_view',
        properties: {
          url: 'https://transferjuice.com/morning',
          articleId: 'article_123',
          briefingType: 'morning',
        },
        sessionId: 'session_123',
        userId: 'user_123',
        timestamp: '2023-12-01T10:00:00.000Z',
      };

      expect(request).toBeValidZodSchema(TrackEventRequestSchema);
    });

    it('should validate minimal event', () => {
      const request = {
        event: 'newsletter_signup',
        sessionId: 'session_123',
      };

      expect(request).toBeValidZodSchema(TrackEventRequestSchema);
    });

    it('should validate event with custom properties', () => {
      const request = {
        event: 'email_click',
        properties: {
          url: 'https://transferjuice.com/article/123',
          source: 'email_campaign',
          campaign: 'morning_briefing',
          customProperties: {
            emailId: 'email_456',
            linkPosition: 'header',
            clickCount: 1,
          },
        },
        sessionId: 'session_123',
        userId: 'user_123',
      };

      expect(request).toBeValidZodSchema(TrackEventRequestSchema);
    });

    it('should reject invalid event type', () => {
      const request = {
        event: 'invalid_event',
        sessionId: 'session_123',
      };

      expect(request).toHaveZodError(TrackEventRequestSchema);
    });

    it('should reject invalid URL in properties', () => {
      const request = {
        event: 'page_view',
        properties: {
          url: 'not-a-url',
        },
        sessionId: 'session_123',
      };

      expect(request).toHaveZodError(TrackEventRequestSchema);
    });

    it('should reject invalid briefing type in properties', () => {
      const request = {
        event: 'article_view',
        properties: {
          briefingType: 'invalid_type',
        },
        sessionId: 'session_123',
      };

      expect(request).toHaveZodError(TrackEventRequestSchema);
    });
  });
});
