import '@testing-library/jest-dom';

// Mock Next.js components
jest.mock('next/link', () => {
  const MockedLink = ({ children, href, ...props }: any) => {
    const React = require('react');
    return React.createElement('a', { href, ...props }, children);
  };
  MockedLink.displayName = 'MockedLink';
  return MockedLink;
});

jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'mocked-inter',
    variable: '--font-inter',
  }),
}));

jest.mock('geist/font/sans', () => ({
  GeistSans: {
    className: 'mocked-geist-sans',
    variable: '--font-geist-sans',
  },
}));

jest.mock('geist/font/mono', () => ({
  GeistMono: {
    className: 'mocked-geist-mono',
    variable: '--font-geist-mono',
  },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
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

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};
