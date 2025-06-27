#!/usr/bin/env tsx
/**
 * Clean Database Script
 * Removes all content for a fresh start
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Cleaning database for fresh start...\n');

  try {
    // Delete in correct order due to foreign keys
    console.log('Deleting briefings...');
    const briefings = await prisma.briefing.deleteMany();
    console.log(`  ✅ Deleted ${briefings.count} briefings`);

    console.log('Deleting feed items...');
    const feedItems = await prisma.feedItem.deleteMany();
    console.log(`  ✅ Deleted ${feedItems.count} feed items`);

    // Media is stored as JSON in feed items, not a separate model

    console.log('\n✨ Database cleaned successfully!');
    
    // Show remaining data
    const sources = await prisma.source.count();
    const tags = await prisma.tag.count();
    console.log('\n📊 Remaining data:');
    console.log(`   Sources: ${sources}`);
    console.log(`   Tags: ${tags}`);

  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();