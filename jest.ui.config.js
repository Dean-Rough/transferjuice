/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',

  // Test file patterns - only UI components
  testMatch: [
    '**/src/components/**/__tests__/**/*.(ts|tsx)',
    '**/src/components/**/*.(test|spec).(ts|tsx)',
  ],

  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/test/ui-setup.ts'],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    '!src/components/**/__tests__/**/*',
    '!src/components/**/*.stories.*',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage-ui',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          isolatedModules: true,
        },
      },
    ],
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],

  // Test environment options
  testEnvironmentOptions: {
    customExportConditions: [''],
  },

  // Performance optimizations
  maxWorkers: '50%',
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,
};

module.exports = config;