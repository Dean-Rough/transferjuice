import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateBriefing } from '@/lib/briefings/generator';
import { verifyApiAuth } from '@/lib/auth/apiAuth';

// Request body schema for manual generation
const generateRequestSchema = z.object({
  force: z.boolean().optional().default(false),
  testMode: z.boolean().optional().default(false),
});

// API authentication check
const isAuthorized = (request: NextRequest): boolean => {
  // TODO: Implement proper API authentication
  // For now, check for a secret header or API key
  const authHeader = request.headers.get('Authorization');
  const apiKey = request.headers.get('X-API-Key');
  
  // In production, verify against environment variable
  const validApiKey = process.env.BRIEFING_GENERATION_API_KEY;
  
  if (validApiKey && apiKey === validApiKey) {
    return true;
  }
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // TODO: Verify JWT or other token mechanism
    return token === process.env.BRIEFING_GENERATION_TOKEN;
  }
  
  return false;
};

export async function POST(request: NextRequest) {
  try {
    // Verify authentication for production security
    if (process.env.NODE_ENV === 'production' && !isAuthorized(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { force, testMode } = generateRequestSchema.parse(body);
    
    // Check if a briefing was already generated for this hour
    const now = new Date();
    const currentHour = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours()
    );
    
    const timestamp = [
      currentHour.getFullYear(),
      String(currentHour.getMonth() + 1).padStart(2, '0'),
      String(currentHour.getDate()).padStart(2, '0'),
      String(currentHour.getHours()).padStart(2, '0'),
    ].join('-');
    
    // TODO: Check if briefing already exists
    // const existingBriefing = await prisma.briefing.findUnique({
    //   where: { slug: timestamp },
    // });
    
    // if (existingBriefing && !force) {
    //   return NextResponse.json(
    //     {
    //       error: 'Briefing already exists for this hour',
    //       briefingId: existingBriefing.id,
    //       timestamp,
    //     },
    //     { status: 409 }
    //   );
    // }
    
    // Generate the briefing
    console.log(`Starting briefing generation for ${timestamp}`);
    
    try {
      const briefing = await generateBriefing({
        timestamp,
        testMode,
      });
      
      console.log(`Briefing generated successfully: ${briefing.id}`);
      
      // Return generated briefing metadata
      return NextResponse.json(
        {
          success: true,
          briefing: {
            id: briefing.id,
            slug: briefing.slug,
            timestamp: briefing.timestamp,
            title: briefing.title,
            metadata: {
              wordCount: briefing.metadata.wordCount,
              estimatedReadTime: briefing.metadata.estimatedReadTime,
              terryScore: briefing.metadata.terryScore,
              sectionsCount: briefing.sections.length,
              playerMentions: briefing.sections.flatMap(s => s.playerMentions || []).length,
            },
          },
          generatedAt: new Date().toISOString(),
        },
        { status: 201 }
      );
    } catch (generationError) {
      console.error('Briefing generation failed:', generationError);
      
      // Log detailed error for monitoring
      const errorDetails = {
        timestamp,
        error: generationError instanceof Error ? generationError.message : 'Unknown error',
        stack: generationError instanceof Error ? generationError.stack : undefined,
        testMode,
      };
      
      // TODO: Send to monitoring service
      // await logToMonitoring('briefing.generation.failed', errorDetails);
      
      return NextResponse.json(
        {
          error: 'Briefing generation failed',
          details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    console.error('Unexpected error in briefing generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for checking generation status
export async function GET(request: NextRequest) {
  try {
    // Check authorization
    if (process.env.NODE_ENV === 'production' && !isAuthorized(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get recent generation history
    // TODO: Replace with actual database query
    // const recentGenerations = await prisma.briefing.findMany({
    //   orderBy: { createdAt: 'desc' },
    //   take: 24, // Last 24 hours
    //   select: {
    //     id: true,
    //     slug: true,
    //     timestamp: true,
    //     createdAt: true,
    //     status: true,
    //     metadata: {
    //       select: {
    //         terryScore: true,
    //         wordCount: true,
    //       },
    //     },
    //   },
    // });
    
    const mockHistory = Array.from({ length: 24 }, (_, i) => {
      const date = new Date();
      date.setHours(date.getHours() - i);
      
      const timestamp = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
        String(date.getHours()).padStart(2, '0'),
      ].join('-');
      
      return {
        id: `briefing-${timestamp}`,
        slug: timestamp,
        timestamp: date.toISOString(),
        createdAt: date.toISOString(),
        status: i === 0 ? 'generating' : 'published',
        metadata: {
          terryScore: 85 + Math.floor(Math.random() * 15),
          wordCount: 1200 + Math.floor(Math.random() * 300),
        },
      };
    });
    
    return NextResponse.json({
      generationHistory: mockHistory,
      nextGenerationTime: new Date(new Date().setHours(new Date().getHours() + 1, 0, 0, 0)).toISOString(),
      systemStatus: 'operational',
    });
  } catch (error) {
    console.error('Error checking generation status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}