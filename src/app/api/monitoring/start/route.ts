/**
 * API Route: Start ITK Monitoring
 * Initializes and starts the global ITK monitoring system
 */

import { NextRequest, NextResponse } from 'next/server';
import { itkMonitor } from '@/lib/twitter/itk-monitor';
import { validateEnvironment } from '@/lib/validations/environment';

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    const env = validateEnvironment();

    // Check if we have required API keys
    if (!env.TWITTER_BEARER_TOKEN) {
      return NextResponse.json(
        { error: 'Twitter API credentials not configured' },
        { status: 500 }
      );
    }

    if (!env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API credentials not configured' },
        { status: 500 }
      );
    }

    console.log('🚀 Starting ITK monitoring system...');

    // Initialize ITK monitor
    await itkMonitor.initialize();

    // Start monitoring all accounts
    const results = await itkMonitor.monitorAllAccounts();

    const stats = itkMonitor.getMonitoringStats();

    return NextResponse.json({
      success: true,
      message: 'ITK monitoring started successfully',
      status: {
        processedTweets: results.length,
        stats: stats,
        startedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to start ITK monitoring:', error);

    return NextResponse.json(
      {
        error: 'Failed to start monitoring system',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = itkMonitor.getMonitoringStats();

    return NextResponse.json({
      status: {
        stats: stats,
        rateLimit: itkMonitor.getRateLimitStatus(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get monitoring status' },
      { status: 500 }
    );
  }
}
