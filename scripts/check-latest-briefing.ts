#!/usr/bin/env tsx
/**
 * Check latest briefing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBriefings() {
  try {
    const briefings = await prisma.briefing.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        slug: true,
        title: true,
        timestamp: true,
        isPublished: true,
        createdAt: true,
      }
    });

    console.log('📰 Latest Briefings:');
    console.log('==================');
    
    if (briefings.length === 0) {
      console.log('No briefings found in database');
    } else {
      briefings.forEach((briefing, index) => {
        console.log(`\n${index + 1}. ${briefing.title}`);
        console.log(`   ID: ${briefing.id}`);
        console.log(`   Slug: ${briefing.slug}`);
        console.log(`   Published: ${briefing.isPublished}`);
        console.log(`   Created: ${briefing.createdAt.toLocaleString()}`);
      });
    }

    const total = await prisma.briefing.count();
    console.log(`\n📊 Total briefings: ${total}`);

  } catch (error) {
    console.error('Error checking briefings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBriefings();