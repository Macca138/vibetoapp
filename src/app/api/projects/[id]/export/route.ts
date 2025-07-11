import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasProjectAccess } from '@/lib/subscription';
import { z } from 'zod';

const exportRequestSchema = z.object({
  format: z.enum(['pdf', 'markdown']),
  emailNotification: z.boolean().optional().default(true),
});

export async function POST(
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

    const projectId = params.id;
    const body = await req.json();
    const validationResult = exportRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { format, emailNotification } = validationResult.data;

    // Check if user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
      include: {
        workflow: {
          include: {
            responses: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Check if user has access to export functionality
    const hasAccess = await hasProjectAccess(session.user.id, projectId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Export functionality requires project access. Please upgrade or unlock this project.' },
        { status: 403 }
      );
    }

    // Check if there's already a pending export for this project
    const existingExport = await prisma.exportJob.findFirst({
      where: {
        userId: session.user.id,
        projectId,
        format,
        status: {
          in: ['pending', 'processing'],
        },
      },
    });

    if (existingExport) {
      return NextResponse.json(
        { 
          error: 'An export job is already in progress for this project and format',
          existingJobId: existingExport.id,
          status: existingExport.status,
        },
        { status: 409 }
      );
    }

    // Create export job record
    const exportJob = await prisma.exportJob.create({
      data: {
        userId: session.user.id,
        projectId,
        format,
        status: 'pending',
      },
    });

    // Update export job with queue job ID
    await prisma.exportJob.update({
      where: { id: exportJob.id },
      data: { jobId: "disabled" },
    });

    return NextResponse.json({
      exportJobId: exportJob.id,
      queueJobId: "disabled",
      status: 'pending',
      format,
      estimatedDuration: format === 'pdf' ? '2-3 minutes' : '30-60 seconds',
      message: `Export job queued successfully. You can check the status using the export job ID.`,
    });

  } catch (error) {
    console.error('Error creating export job:', error);
    return NextResponse.json(
      { error: 'Failed to create export job' },
      { status: 500 }
    );
  }
}

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

    const projectId = params.id;

    // Check if user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Get all export jobs for this project
    const exportJobs = await prisma.exportJob.findMany({
      where: {
        userId: session.user.id,
        projectId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Limit to last 10 exports
    });

    return NextResponse.json({
      exportJobs: exportJobs.map(job => ({
        id: job.id,
        format: job.format,
        status: job.status,
        filename: job.filename,
        fileUrl: job.fileUrl,
        fileSize: job.fileSize,
        errorMessage: job.errorMessage,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        expiresAt: job.expiresAt,
      })),
    });

  } catch (error) {
    console.error('Error fetching export jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch export jobs' },
      { status: 500 }
    );
  }
}