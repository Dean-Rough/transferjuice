/**
 * Hourly Cron Job Endpoint
 * 
 * Triggers the hourly monitoring system:
 * 1. Check all ITK accounts for new tweets
 * 2. Generate Terry-style updates
 * 3. Search for relevant images
 * 4. Mix in engaging stories if needed
 * 5. Broadcast live updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { runHourlyMonitor } from '@/lib/monitoring/hourlyMonitor';

export async function POST(request: NextRequest) {
  console.log('⏰ Hourly cron job triggered');
  
  try {
    // Verify cron secret if in production
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        console.warn('🚫 Unauthorized cron request');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    // Run the hourly monitoring
    const startTime = Date.now();
    const updates = await runHourlyMonitor();
    const duration = Date.now() - startTime;
    
    console.log(`✅ Hourly monitor completed in ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      message: 'Hourly monitoring completed',
      data: {
        updatesGenerated: updates.length,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        updates: updates.map(update => ({
          id: update.id,
          type: update.type,
          priority: update.priority,
          tags: update.tags?.length || 0,
          images: update.images?.length || 0
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Hourly cron job failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Hourly monitoring failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  // Health check endpoint
  return NextResponse.json({
    message: 'Hourly cron endpoint is healthy',
    timestamp: new Date().toISOString(),
    status: 'ready'
  });
}