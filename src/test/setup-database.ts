/**
 * Test Database Setup
 * Configures in-memory database for testing
 */

import { PrismaClient } from '@prisma/client';

// Create test Prisma client
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db',
    },
  },
  log: ['error'],
});

// Mock the database connection functions for testing
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await testPrisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Test database connection failed:', error);
    return false;
  }
}

export async function getDatabaseHealth() {
  try {
    const start = Date.now();
    await testPrisma.$queryRaw`SELECT 1`;
    const end = Date.now();

    return {
      status: 'healthy' as const,
      responseTime: end - start,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy' as const,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

// Setup function for tests
export async function setupTestDatabase() {
  // For SQLite file-based testing, we just need to ensure the client is ready
  await testPrisma.$connect();
}

// Cleanup function for tests
export async function cleanupTestDatabase() {
  await testPrisma.$disconnect();
}
