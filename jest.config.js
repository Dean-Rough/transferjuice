/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",

  // Test file patterns - expanded to include integration tests
  testMatch: [
    "**/__tests__/**/*.(ts|tsx|js)",
    "**/*.(test|spec).(ts|tsx|js)",
    "**/test/**/__tests__/**/*.(ts|tsx|js)",
  ],

  // Module resolution
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts", "jest-extended/all"],

  // Coverage configuration - enhanced
  collectCoverage: true,
  collectCoverageFrom: [
    "src/components/**/*.{ts,tsx}",
    "src/lib/**/*.{ts,tsx}",
    "src/app/**/*.{ts,tsx}",
    "src/test/mocks/**/*.{ts,tsx}",
    "src/test/factories/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/test/setup.ts",
    "!src/**/__tests__/**/*",
    "!src/**/*.stories.*",
    "!src/app/layout.tsx",
    "!src/app/globals.css",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html", "json-summary"],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Specific thresholds for critical modules
    "src/lib/validations/": {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    "src/test/mocks/": {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },

  // Performance optimizations
  maxWorkers: "50%", // Use half of available CPU cores
  testTimeout: 10000,
  slowTestThreshold: 5, // Warn about tests taking longer than 5 seconds

  // Verbose output for debugging
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Error handling
  errorOnDeprecated: true,

  // Test environment options
  testEnvironmentOptions: {
    // Node.js specific options
  },

  // Transform configuration
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": [
      "babel-jest",
      {
        presets: [
          "@babel/preset-env",
          ["@babel/preset-react", { runtime: "automatic" }],
          "@babel/preset-typescript",
        ],
      },
    ],
  },

  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  // Test organization
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/build/",
    "/.next/",
    "/tests/", // Exclude Playwright tests directory
  ],

  // Watch mode configuration (for development)
  watchPathIgnorePatterns: ["/node_modules/", "/coverage/", "/.next/"],

  // Test result processors
  reporters: ["default"],

  // Parallel execution
  maxConcurrency: 5,

  // Cache configuration
  cacheDirectory: "<rootDir>/.jest-cache",

  // Snapshot configuration
  updateSnapshot: false,
};

module.exports = config;
