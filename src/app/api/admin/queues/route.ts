import { NextResponse } from 'next/server';
import { getAllQueueStats, getQueueHealth } from '@/lib/queues/monitor-simple';

export async function GET() {
  try {
    const [stats, health] = await Promise.all([
      getAllQueueStats(),
      getQueueHealth(),
    ]);

    return NextResponse.json({
      stats,
      health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Queue stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get queue stats' },
      { status: 500 }
    );
  }
}