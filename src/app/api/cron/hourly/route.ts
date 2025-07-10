import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  // Verify this is actually from Vercel Cron
  const authHeader = headers().get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('Unauthorized cron attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log(`🚀 Hourly RSS processing started at ${new Date().toISOString()}`);
  
  try {
    // Execute the hourly RSS processor
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    // Run the hourly script
    const { stdout, stderr } = await execAsync('npx tsx scripts/hourly-all.ts', {
      cwd: process.cwd(),
      env: process.env,
    });
    
    console.log('Hourly RSS processor output:', stdout);
    if (stderr) console.error('Hourly RSS processor errors:', stderr);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Hourly RSS processing completed',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Hourly cron error:', error);
    return NextResponse.json({ 
      error: 'Failed to process RSS feed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes