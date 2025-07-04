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

    // Verify user owns the export job
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

    // Get email logs for this export job
    const emailLogs = await prisma.emailLog.findMany({
      where: {
        exportJobId,
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      emailLogs: emailLogs.map(log => ({
        id: log.id,
        recipientEmail: log.recipientEmail,
        emailType: log.emailType,
        subject: log.subject,
        status: log.status,
        errorMessage: log.errorMessage,
        sentAt: log.sentAt,
        deliveredAt: log.deliveredAt,
        openedAt: log.openedAt,
        clickedAt: log.clickedAt,
        createdAt: log.createdAt,
      })),
    });

  } catch (error) {
    console.error('Error fetching email logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email logs' },
      { status: 500 }
    );
  }
}