import "@testing-library/jest-dom";
import "jest-extended";
import { TextEncoder, TextDecoder } from "util";

// Polyfills for testing environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock fetch for simple API testing
global.fetch = jest.fn();

// Note: MSW server setup is available in ./mocks/server.ts
// For advanced API mocking, use MSW with Node.js 18+ environment
// import { server } from "./mocks/server";

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock ResizeObserver for components that use it
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock window.matchMedia for responsive components
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock performance API for components that use it
Object.defineProperty(window, "performance", {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  },
});

// Suppress console.log/warn/error in tests unless explicitly needed
const originalConsole = { ...console };
beforeEach(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  Object.assign(console, originalConsole);
  jest.clearAllMocks();
  // server.resetHandlers(); // Uncomment when MSW is enabled
});

// MSW server setup (commented out due to Node.js polyfill issues)
// Uncomment when running integration tests or when Node.js 18+ is used
/*
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterAll(() => {
  server.close();
});
*/
