import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const exportJobId = params.id;

    // Get export job
    const exportJob = await prisma.exportJob.findFirst({
      where: {
        id: exportJobId,
        userId: session.user.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!exportJob) {
      return NextResponse.json(
        { error: 'Export job not found or access denied' },
        { status: 404 }
      );
    }

    // Check if file has expired
    if (exportJob.expiresAt && exportJob.expiresAt < new Date()) {
      return NextResponse.json({
        id: exportJob.id,
        status: 'expired',
        format: exportJob.format,
        project: exportJob.project,
        errorMessage: 'Export file has expired and is no longer available for download',
        createdAt: exportJob.createdAt,
        expiresAt: exportJob.expiresAt,
      });
    }

    return NextResponse.json({
      id: exportJob.id,
      status: exportJob.status,
      format: exportJob.format,
      filename: exportJob.filename,
      fileUrl: exportJob.fileUrl,
      fileSize: exportJob.fileSize,
      errorMessage: exportJob.errorMessage,
      project: exportJob.project,
      createdAt: exportJob.createdAt,
      startedAt: exportJob.startedAt,
      completedAt: exportJob.completedAt,
      expiresAt: exportJob.expiresAt,
      progress: getProgressEstimate(exportJob),
    });

  } catch (error) {
    console.error('Error fetching export job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch export job' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const exportJobId = params.id;

    // Get export job
    const exportJob = await prisma.exportJob.findFirst({
      where: {
        id: exportJobId,
        userId: session.user.id,
      },
    });

    if (!exportJob) {
      return NextResponse.json(
        { error: 'Export job not found or access denied' },
        { status: 404 }
      );
    }

    // Can only cancel pending or processing jobs
    if (!['pending', 'processing'].includes(exportJob.status)) {
      return NextResponse.json(
        { error: 'Can only cancel pending or processing export jobs' },
        { status: 400 }
      );
    }

    // Update job status to cancelled
    await prisma.exportJob.update({
      where: { id: exportJobId },
      data: {
        status: 'failed',
        errorMessage: 'Cancelled by user',
        completedAt: new Date(),
      },
    });

    // TODO: Cancel the queue job if needed
    // This would require accessing the Bull queue and calling job.cancel()

    return NextResponse.json({
      success: true,
      message: 'Export job cancelled successfully',
    });

  } catch (error) {
    console.error('Error cancelling export job:', error);
    return NextResponse.json(
      { error: 'Failed to cancel export job' },
      { status: 500 }
    );
  }
}

function getProgressEstimate(exportJob: any): {
  percentage: number;
  estimatedTimeRemaining?: string;
} {
  const now = new Date();
  
  switch (exportJob.status) {
    case 'pending':
      return { percentage: 0 };
    
    case 'processing':
      if (exportJob.startedAt) {
        const elapsed = now.getTime() - new Date(exportJob.startedAt).getTime();
        const estimatedTotal = exportJob.format === 'pdf' ? 180000 : 60000; // 3 min for PDF, 1 min for Markdown
        const percentage = Math.min(90, Math.round((elapsed / estimatedTotal) * 100));
        
        const remaining = Math.max(0, estimatedTotal - elapsed);
        const remainingSeconds = Math.ceil(remaining / 1000);
        
        return {
          percentage,
          estimatedTimeRemaining: remainingSeconds > 60 
            ? `${Math.ceil(remainingSeconds / 60)} minute(s)` 
            : `${remainingSeconds} second(s)`,
        };
      }
      return { percentage: 10 };
    
    case 'completed':
      return { percentage: 100 };
    
    case 'failed':
      return { percentage: 0 };
    
    default:
      return { percentage: 0 };
  }
}