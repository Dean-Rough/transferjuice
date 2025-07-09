import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  // Verify this is actually from Vercel Cron
  const authHeader = headers().get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('Unauthorized cron attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🚀 Daily story generation started via Vercel Cron');
  
  try {
    // Execute the daily RSS processor
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    // Run the daily script
    const { stdout, stderr } = await execAsync('npm run daily', {
      cwd: process.cwd(),
      env: process.env,
    });
    
    console.log('Daily RSS processor output:', stdout);
    if (stderr) console.error('Daily RSS processor errors:', stderr);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Daily story generation completed',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Daily cron error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate stories',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max