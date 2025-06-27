#!/usr/bin/env tsx
/**
 * Publish latest briefing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function publishLatest() {
  try {
    const latest = await prisma.briefing.findFirst({
      orderBy: { createdAt: 'desc' },
      where: { isPublished: false }
    });

    if (!latest) {
      console.log('No unpublished briefings found');
      return;
    }

    const updated = await prisma.briefing.update({
      where: { id: latest.id },
      data: { 
        isPublished: true,
        publishedAt: new Date()
      }
    });

    console.log('✅ Published briefing:', updated.title);
    console.log('🔗 URL: http://localhost:4433/briefings/' + updated.slug);

  } catch (error) {
    console.error('Error publishing briefing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

publishLatest();