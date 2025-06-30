import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendWaitlistWelcomeJob } from '@/lib/queues/processors/email.processor';

const waitlistSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  source: z.string().optional(),
  referrer: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = waitlistSchema.parse(body);

    // Check if email already exists
    const existing = await prisma.waitlist.findUnique({
      where: { email: validatedData.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'This email is already on the waitlist' },
        { status: 400 }
      );
    }

    // Create new waitlist entry
    const entry = await prisma.waitlist.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        source: validatedData.source,
        referrer: validatedData.referrer,
      },
    });

    // Get waitlist position
    const position = await prisma.waitlist.count({
      where: {
        createdAt: {
          lte: entry.createdAt,
        },
      },
    });

    // Queue welcome email
    try {
      await sendWaitlistWelcomeJob({
        to: entry.email,
        name: entry.name || undefined,
        position,
      });
    } catch (emailError) {
      console.error('Failed to queue welcome email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the waitlist',
      id: entry.id,
      position,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Waitlist submission error:', error);
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get total count
    const count = await prisma.waitlist.count();
    
    return NextResponse.json({
      count,
      message: `${count} people on the waitlist`,
    });
  } catch (error) {
    console.error('Waitlist count error:', error);
    return NextResponse.json(
      { error: 'Failed to get waitlist count' },
      { status: 500 }
    );
  }
}