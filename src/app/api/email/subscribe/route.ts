/**
 * API Route: Email Newsletter Subscription
 * Handles email subscription and preference management
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { EmailFrequency } from '@prisma/client';
import crypto from 'crypto';

// Validation schemas
const SubscribeSchema = z.object({
  email: z.string().email(),
  frequency: z.nativeEnum(EmailFrequency).default('DAILY'),
  preferredTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .default('08:00'),
  timezone: z.string().default('Europe/London'),
  source: z.string().optional(),
});

const UnsubscribeSchema = z.object({
  email: z.string().email(),
  token: z.string().optional(), // For secure unsubscribe links
});

const UpdatePreferencesSchema = z.object({
  email: z.string().email(),
  frequency: z.nativeEnum(EmailFrequency).optional(),
  preferredTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  timezone: z.string().optional(),
});

// Helper function to generate unsubscribe token
function generateUnsubscribeToken(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || 'default-secret';
  return crypto
    .createHmac('sha256', secret)
    .update(email)
    .digest('hex')
    .substring(0, 16);
}

// Helper function to verify unsubscribe token
function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expectedToken = generateUnsubscribeToken(email);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
}

// GET - Check subscription status
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email parameter is required',
        },
        { status: 400 }
      );
    }

    // Find subscriber
    const subscriber = await prisma.emailSubscriber.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        isActive: true,
        isVerified: true,
        frequency: true,
        preferredTime: true,
        timezone: true,
        subscribedAt: true,
        lastEmailSent: true,
        totalEmailsSent: true,
        totalOpens: true,
        totalClicks: true,
      },
    });

    if (!subscriber) {
      return NextResponse.json({
        success: true,
        subscribed: false,
        message: 'Email not subscribed',
      });
    }

    return NextResponse.json({
      success: true,
      subscribed: true,
      data: subscriber,
    });
  } catch (error) {
    console.error('Failed to check subscription status:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check subscription status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = SubscribeSchema.parse(body);

    // Get IP and user agent for analytics
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check if already subscribed
    const existing = await prisma.emailSubscriber.findUnique({
      where: { email: validatedData.email },
    });

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email already subscribed',
            data: {
              isActive: existing.isActive,
              frequency: existing.frequency,
            },
          },
          { status: 409 }
        );
      } else {
        // Reactivate subscription
        const reactivated = await prisma.emailSubscriber.update({
          where: { email: validatedData.email },
          data: {
            isActive: true,
            frequency: validatedData.frequency,
            preferredTime: validatedData.preferredTime,
            timezone: validatedData.timezone,
            unsubscribedAt: null,
            updatedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          data: reactivated,
          message: 'Subscription reactivated successfully',
        });
      }
    }

    // Create new subscriber
    const subscriber = await prisma.emailSubscriber.create({
      data: {
        email: validatedData.email,
        frequency: validatedData.frequency,
        preferredTime: validatedData.preferredTime,
        timezone: validatedData.timezone,
        source: validatedData.source,
        ipAddress: ipAddress.substring(0, 45), // Limit IP length
        userAgent: userAgent.substring(0, 255), // Limit user agent length
        isActive: true,
        isVerified: false, // Will need email verification
      },
    });

    // TODO: Send verification email
    // await sendVerificationEmail(subscriber.email);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: subscriber.id,
          email: subscriber.email,
          frequency: subscriber.frequency,
          isVerified: subscriber.isVerified,
        },
        message:
          'Successfully subscribed! Please check your email to verify your subscription.',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid subscription data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Failed to subscribe:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process subscription',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT - Update subscription preferences
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = UpdatePreferencesSchema.parse(body);

    // Find subscriber
    const subscriber = await prisma.emailSubscriber.findUnique({
      where: { email: validatedData.email },
    });

    if (!subscriber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email not found',
        },
        { status: 404 }
      );
    }

    // Update preferences
    const updated = await prisma.emailSubscriber.update({
      where: { email: validatedData.email },
      data: {
        ...(validatedData.frequency && { frequency: validatedData.frequency }),
        ...(validatedData.preferredTime && {
          preferredTime: validatedData.preferredTime,
        }),
        ...(validatedData.timezone && { timezone: validatedData.timezone }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        email: updated.email,
        frequency: updated.frequency,
        preferredTime: updated.preferredTime,
        timezone: updated.timezone,
      },
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid preference data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Failed to update preferences:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update preferences',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE - Unsubscribe from newsletter
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const token = url.searchParams.get('token');

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email parameter is required',
        },
        { status: 400 }
      );
    }

    // Verify token if provided (for secure unsubscribe links)
    if (token && !verifyUnsubscribeToken(email, token)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid unsubscribe token',
        },
        { status: 401 }
      );
    }

    // Find subscriber
    const subscriber = await prisma.emailSubscriber.findUnique({
      where: { email },
    });

    if (!subscriber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email not found',
        },
        { status: 404 }
      );
    }

    // Mark as unsubscribed (soft delete)
    await prisma.emailSubscriber.update({
      where: { email },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from Transfer Juice newsletter',
    });
  } catch (error) {
    console.error('Failed to unsubscribe:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process unsubscribe',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
