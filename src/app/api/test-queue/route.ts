import { NextResponse } from 'next/server';
import { sendWaitlistWelcomeJob } from '@/lib/queues/processors/email.processor';
import { generateAppIdeaJob } from '@/lib/queues/processors/ai.processor';

export async function POST(request: Request) {
  try {
    const { type } = await request.json();

    switch (type) {
      case 'email':
        const emailJob = await sendWaitlistWelcomeJob({
          to: 'test@example.com',
          name: 'Test User',
          position: 42,
        });
        
        return NextResponse.json({
          success: true,
          message: 'Email job queued successfully',
          jobId: emailJob.id,
        });

      case 'ai':
        const aiJob = await generateAppIdeaJob({
          userId: 'test-user',
          projectId: 'test-project',
          prompt: 'Create a social media app for pet owners',
          step: 1,
        });
        
        return NextResponse.json({
          success: true,
          message: 'AI job queued successfully',
          jobId: aiJob.id,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid job type. Use "email" or "ai"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Test queue error:', error);
    return NextResponse.json(
      { error: 'Failed to queue test job' },
      { status: 500 }
    );
  }
}