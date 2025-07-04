import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredExports } from '@/lib/queues/processors/export.processor';

export async function GET(req: NextRequest) {
  try {
    // Basic security check - in production you'd want proper auth or use Vercel Cron
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting export cleanup job...');
    await cleanupExpiredExports();
    console.log('Export cleanup completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Export cleanup completed successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Export cleanup failed:', error);
    return NextResponse.json(
      { error: 'Export cleanup failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Support both GET and POST for flexibility with different cron services
  return GET(req);
}