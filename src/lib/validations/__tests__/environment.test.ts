import {
  EnvironmentSchema,
  validateEnvironment,
  getEnv,
  isProduction,
  isDevelopment,
  isTest,
  hasEmailService,
  hasAnalytics,
  hasErrorTracking,
} from '../environment';

// Mock process.env for testing
const originalEnv = process.env;

describe('Environment Validation', () => {
  beforeEach(() => {
    // Reset to clean test environment
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
      TWITTER_BEARER_TOKEN: 'AAAAAAAAAAAAAAAAAAAAAA_test_token',
      OPENAI_API_KEY: 'sk-test_key_123456789',
      EMAIL_PROVIDER: 'convertkit',
      CONVERTKIT_API_KEY: 'test_convertkit_key',
      CONVERTKIT_API_SECRET: 'test_convertkit_secret',
      APP_URL: 'http://localhost:3000',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('EnvironmentSchema', () => {
    it('should validate minimal test environment', () => {
      const env = {
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
        TWITTER_BEARER_TOKEN: 'AAAAAAAAAAAAAAAAAAAAAA_test_token',
        OPENAI_API_KEY: 'sk-test_key_123456789',
        EMAIL_PROVIDER: 'convertkit',
        CONVERTKIT_API_KEY: 'test_key',
        CONVERTKIT_API_SECRET: 'test_secret',
        APP_URL: 'http://localhost:3000',
      };

      expect(env).toBeValidZodSchema(EnvironmentSchema);
    });

    it('should validate development environment with defaults', () => {
      const env = {
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://dev:dev@localhost:5432/dev_db',
        TWITTER_BEARER_TOKEN: 'AAAAAAAAAAAAAAAAAAAAAA_dev_token',
        OPENAI_API_KEY: 'sk-dev_key_123456789',
        EMAIL_PROVIDER: 'convertkit',
        CONVERTKIT_API_KEY: 'dev_key',
        CONVERTKIT_API_SECRET: 'dev_secret',
        APP_URL: 'http://localhost:3000',
      };

      expect(env).toBeValidZodSchema(EnvironmentSchema);
    });

    it('should validate production environment with all required fields', () => {
      const env = {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://prod:prod@db.example.com:5432/prod_db',
        TWITTER_BEARER_TOKEN: 'AAAAAAAAAAAAAAAAAAAAAA_prod_token',
        OPENAI_API_KEY: 'sk-prod_key_123456789',
        EMAIL_PROVIDER: 'convertkit',
        CONVERTKIT_API_KEY: 'prod_key',
        CONVERTKIT_API_SECRET: 'prod_secret',
        APP_URL: 'https://transferjuice.com',
        JWT_SECRET: 'production_jwt_secret_32_characters_long',
        ENCRYPTION_KEY: 'production_encryption_key_32_chars_long',
        HEALTH_CHECK_TOKEN: 'production_health_check_token_32_chars',
        ENABLE_DEBUG_ROUTES: false,
        MOCK_EXTERNAL_APIS: false,
      };

      expect(env).toBeValidZodSchema(EnvironmentSchema);
    });

    it('should reject invalid database URL', () => {
      const env = {
        NODE_ENV: 'test',
        DATABASE_URL: 'not-a-url',
        TWITTER_BEARER_TOKEN: 'AAAAAAAAAAAAAAAAAAAAAA_test_token',
        OPENAI_API_KEY: 'sk-test_key_123456789',
        EMAIL_PROVIDER: 'convertkit',
        CONVERTKIT_API_KEY: 'test_key',
        CONVERTKIT_API_SECRET: 'test_secret',
      };

      expect(env).toHaveZodError(
        EnvironmentSchema,
        'DATABASE_URL must be a valid PostgreSQL connection URL'
      );
    });

    it('should reject non-PostgreSQL database URL', () => {
      const env = {
        NODE_ENV: 'test',
        DATABASE_URL: 'mysql://user:pass@localhost:3306/db',
        TWITTER_BEARER_TOKEN: 'AAAAAAAAAAAAAAAAAAAAAA_test_token',
        OPENAI_API_KEY: 'sk-test_key_123456789',
        EMAIL_PROVIDER: 'convertkit',
        CONVERTKIT_API_KEY: 'test_key',
        CONVERTKIT_API_SECRET: 'test_secret',
      };

      expect(env).toHaveZodError(
        EnvironmentSchema,
        'DATABASE_URL must be a PostgreSQL connection string'
      );
    });

    it('should reject invalid Twitter bearer token format', () => {
      const env = {
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
        TWITTER_BEARER_TOKEN: 'invalid_token_format',
        OPENAI_API_KEY: 'sk-test_key_123456789',
        EMAIL_PROVIDER: 'convertkit',
        CONVERTKIT_API_KEY: 'test_key',
        CONVERTKIT_API_SECRET: 'test_secret',
      };

      expect(env).toHaveZodError(
        EnvironmentSchema,
        'TWITTER_BEARER_TOKEN appears to be invalid format'
      );
    });

    it('should reject invalid OpenAI API key format', () => {
      const env = {
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
        TWITTER_BEARER_TOKEN: 'AAAAAAAAAAAAAAAAAAAAAA_test_token',
        OPENAI_API_KEY: 'invalid_key_format',
        EMAIL_PROVIDER: 'convertkit',
        CONVERTKIT_API_KEY: 'test_key',
        CONVERTKIT_API_SECRET: 'test_secret',
      };

      expect(env).toHaveZodError(
        EnvironmentSchema,
        'OPENAI_API_KEY must start with "sk-"'
      );
    });

    it('should reject missing ConvertKit credentials when EMAIL_PROVIDER is convertkit', () => {
      const env = {
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
        TWITTER_BEARER_TOKEN: 'AAAAAAAAAAAAAAAAAAAAAA_test_token',
        OPENAI_API_KEY: 'sk-test_key_123456789',
        EMAIL_PROVIDER: 'convertkit',
        // Missing CONVERTKIT_API_KEY and CONVERTKIT_API_SECRET
      };

      expect(env).toHaveZodError(
        EnvironmentSchema,
        'CONVERTKIT_API_KEY is required when EMAIL_PROVIDER is "convertkit"'
      );
    });

    it('should reject missing production security fields', () => {
      const env = {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://prod:prod@db.example.com:5432/prod_db',
        TWITTER_BEARER_TOKEN: 'AAAAAAAAAAAAAAAAAAAAAA_prod_token',
        OPENAI_API_KEY: 'sk-prod_key_123456789',
        EMAIL_PROVIDER: 'convertkit',
        CONVERTKIT_API_KEY: 'prod_key',
        CONVERTKIT_API_SECRET: 'prod_secret',
        APP_URL: 'https://transferjuice.com',
        // Missing JWT_SECRET, ENCRYPTION_KEY, HEALTH_CHECK_TOKEN
      };

      expect(env).toHaveZodError(
        EnvironmentSchema,
        'JWT_SECRET is required in production environment'
      );
    });

    it('should reject debug routes enabled in production', () => {
      const env = {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://prod:prod@db.example.com:5432/prod_db',
        TWITTER_BEARER_TOKEN: 'AAAAAAAAAAAAAAAAAAAAAA_prod_token',
        OPENAI_API_KEY: 'sk-prod_key_123456789',
        EMAIL_PROVIDER: 'convertkit',
        CONVERTKIT_API_KEY: 'prod_key',
        CONVERTKIT_API_SECRET: 'prod_secret',
        APP_URL: 'https://transferjuice.com',
        JWT_SECRET: 'production_jwt_secret_32_characters_long',
        ENCRYPTION_KEY: 'production_encryption_key_32_chars_long',
        HEALTH_CHECK_TOKEN: 'production_health_check_token_32_chars',
        ENABLE_DEBUG_ROUTES: 'true', // Should be false in production
      };

      expect(env).toHaveZodError(
        EnvironmentSchema,
        'ENABLE_DEBUG_ROUTES must be false in production'
      );
    });

    it('should validate MailerLite email provider configuration', () => {
      const env = {
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
        TWITTER_BEARER_TOKEN: 'AAAAAAAAAAAAAAAAAAAAAA_test_token',
        OPENAI_API_KEY: 'sk-test_key_123456789',
        EMAIL_PROVIDER: 'mailerlite',
        MAILERLITE_API_KEY: 'test_mailerlite_key',
        APP_URL: 'http://localhost:3000',
      };

      expect(env).toBeValidZodSchema(EnvironmentSchema);
    });

    it('should validate Postmark email provider configuration', () => {
      const env = {
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
        TWITTER_BEARER_TOKEN: 'AAAAAAAAAAAAAAAAAAAAAA_test_token',
        OPENAI_API_KEY: 'sk-test_key_123456789',
        EMAIL_PROVIDER: 'postmark',
        POSTMARK_API_KEY: 'test_postmark_key',
        POSTMARK_FROM_EMAIL: 'test@transferjuice.com',
        APP_URL: 'http://localhost:3000',
      };

      expect(env).toBeValidZodSchema(EnvironmentSchema);
    });

    it('should validate optional analytics configuration', () => {
      const env = {
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
        TWITTER_BEARER_TOKEN: 'AAAAAAAAAAAAAAAAAAAAAA_test_token',
        OPENAI_API_KEY: 'sk-test_key_123456789',
        EMAIL_PROVIDER: 'convertkit',
        CONVERTKIT_API_KEY: 'test_key',
        CONVERTKIT_API_SECRET: 'test_secret',
        APP_URL: 'http://localhost:3000',
        GOOGLE_ANALYTICS_ID: 'G-XXXXXXXXXX',
        SENTRY_DSN: 'https://abc123@sentry.io/123456',
        SENTRY_ENVIRONMENT: 'test',
      };

      expect(env).toBeValidZodSchema(EnvironmentSchema);
    });

    it('should reject invalid Google Analytics ID format', () => {
      const env = {
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
        TWITTER_BEARER_TOKEN: 'AAAAAAAAAAAAAAAAAAAAAA_test_token',
        OPENAI_API_KEY: 'sk-test_key_123456789',
        EMAIL_PROVIDER: 'convertkit',
        CONVERTKIT_API_KEY: 'test_key',
        CONVERTKIT_API_SECRET: 'test_secret',
        GOOGLE_ANALYTICS_ID: 'invalid_ga_id',
      };

      expect(env).toHaveZodError(
        EnvironmentSchema,
        'GOOGLE_ANALYTICS_ID must be in format G-XXXXXXXXXX'
      );
    });
  });

  describe('validateEnvironment', () => {
    it('should return validated environment object', () => {
      const env = validateEnvironment();
      expect(env).toBeDefined();
      expect(env.NODE_ENV).toBe('test');
      expect(env.DATABASE_URL).toBe(
        'postgresql://test:test@localhost:5432/test_db'
      );
    });

    it('should exit process on validation failure', () => {
      const originalExit = process.exit;
      const mockExit = jest.fn().mockImplementation(() => {
        throw new Error('process.exit was called');
      });
      process.exit = mockExit as (code?: number) => never;

      // Set invalid environment by removing required ConvertKit keys
      delete process.env.CONVERTKIT_API_KEY;
      delete process.env.CONVERTKIT_API_SECRET;

      expect(() => validateEnvironment()).toThrow('process.exit was called');
      expect(mockExit).toHaveBeenCalledWith(1);

      process.exit = originalExit;

      // Restore for other tests
      process.env.CONVERTKIT_API_KEY = 'test_convertkit_key';
      process.env.CONVERTKIT_API_SECRET = 'test_convertkit_secret';
    });
  });

  describe('getEnv', () => {
    it('should return specific environment variable', () => {
      const nodeEnv = getEnv('NODE_ENV');
      expect(nodeEnv).toBe('test');

      const dbUrl = getEnv('DATABASE_URL');
      expect(dbUrl).toBe('postgresql://test:test@localhost:5432/test_db');
    });
  });

  describe('Environment check functions', () => {
    it('should correctly identify test environment', () => {
      expect(isTest()).toBe(true);
      expect(isProduction()).toBe(false);
      expect(isDevelopment()).toBe(false);
    });

    it('should correctly identify production environment', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'production_jwt_secret_32_characters_long';
      process.env.ENCRYPTION_KEY = 'production_encryption_key_32_chars_long';
      process.env.HEALTH_CHECK_TOKEN = 'production_health_check_token_32_chars';

      expect(isProduction()).toBe(true);
      expect(isTest()).toBe(false);
      expect(isDevelopment()).toBe(false);
    });

    it('should correctly identify development environment', () => {
      process.env.NODE_ENV = 'development';

      expect(isDevelopment()).toBe(true);
      expect(isProduction()).toBe(false);
      expect(isTest()).toBe(false);
    });
  });

  describe('Service availability checks', () => {
    it('should detect email service availability for ConvertKit', () => {
      process.env.EMAIL_PROVIDER = 'convertkit';
      process.env.CONVERTKIT_API_KEY = 'test_key';
      process.env.CONVERTKIT_API_SECRET = 'test_secret';

      expect(hasEmailService()).toBe(true);
    });

    it('should detect email service unavailability when keys missing', () => {
      process.env.EMAIL_PROVIDER = 'convertkit';
      delete process.env.CONVERTKIT_API_KEY;

      expect(hasEmailService()).toBe(false);
    });

    it('should detect analytics availability', () => {
      process.env.GOOGLE_ANALYTICS_ID = 'G-XXXXXXXXXX';

      expect(hasAnalytics()).toBe(true);
    });

    it('should detect analytics unavailability', () => {
      delete process.env.GOOGLE_ANALYTICS_ID;
      delete process.env.PLAUSIBLE_DOMAIN;

      expect(hasAnalytics()).toBe(false);
    });

    it('should detect error tracking availability', () => {
      process.env.SENTRY_DSN = 'https://abc123@sentry.io/123456';

      expect(hasErrorTracking()).toBe(true);
    });

    it('should detect error tracking unavailability', () => {
      delete process.env.SENTRY_DSN;

      expect(hasErrorTracking()).toBe(false);
    });
  });
});
