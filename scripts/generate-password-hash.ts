#!/usr/bin/env tsx
/**
 * Generate a password hash for the dashboard
 * Usage: npm run generate-password-hash <password>
 */

import crypto from 'crypto';

const password = process.argv[2];

if (!password) {
  console.error('Please provide a password as an argument');
  console.error('Usage: npm run generate-password-hash <password>');
  process.exit(1);
}

const hash = crypto.createHash('sha256').update(password).digest('hex');

console.log('\n🔐 Dashboard Password Hash Generated\n');
console.log('Add this to your .env file:');
console.log(`DASHBOARD_PASSWORD_HASH=${hash}`);
console.log('\nThen restart your development server.');