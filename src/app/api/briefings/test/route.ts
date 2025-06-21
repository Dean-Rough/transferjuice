/**
 * Test briefing generation endpoint
 * Creates a sample briefing for development
 */

import { NextResponse } from 'next/server';
import { generateBriefing } from '@/lib/briefings/generator';

export async function GET() {
  try {
    // Generate a test briefing for the current hour
    const now = new Date();
    now.setMinutes(0, 0, 0); // Round to current hour
    
    const briefing = await generateBriefing({
      timestamp: now,
      testMode: true,
      forceRegenerate: true,
    });
    
    return NextResponse.json({
      success: true,
      briefing,
      url: `/briefings/${briefing.slug}`,
    });
  } catch (error) {
    console.error('Test briefing generation failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate test briefing' 
      },
      { status: 500 }
    );
  }
}