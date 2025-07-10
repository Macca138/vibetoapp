import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ExportGenerateSchema = z.object({
  projectId: z.string(),
  formats: z.array(z.enum(['PDF', 'Markdown', 'Word', 'JSON'])),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = ExportGenerateSchema.parse(body);

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        user: { email: session.user.email }
      },
      include: {
        workflow: {
          include: {
            responses: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Check if project workflow is complete enough for export
    if (!project.workflow || project.workflow.responses.length < 3) {
      return NextResponse.json(
        { error: 'Project needs to have at least 3 completed steps before export' },
        { status: 400 }
      );
    }

    const completed: string[] = [];
    const failed: string[] = [];
    const downloadLinks: Record<string, string> = {};

    // Process each requested format
    for (const format of validatedData.formats) {
      try {
        // Create export job for this format
        const exportJob = await prisma.exportJob.create({
          data: {
            userId: session.user.id!,
            projectId: validatedData.projectId,
            format: format.toLowerCase(),
            status: 'pending',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          }
        });

        // For now, we'll use the existing export API endpoint
        // In a real implementation, you might want to queue these jobs
        const exportResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/projects/${validatedData.projectId}/export`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            format: format.toLowerCase(),
            emailNotification: true
          })
        });

        if (exportResponse.ok) {
          const result = await exportResponse.json();
          completed.push(format);
          
          // If we have a download link, add it
          if (result.downloadUrl) {
            downloadLinks[format] = result.downloadUrl;
          } else {
            // Create a status check link
            downloadLinks[format] = `/api/export/${exportJob.id}`;
          }
        } else {
          failed.push(format);
        }
      } catch (error) {
        console.error(`Failed to generate ${format} export:`, error);
        failed.push(format);
      }
    }

    return NextResponse.json({
      success: true,
      completed,
      failed,
      downloadLinks,
      message: `Export initiated for ${completed.length} format(s). ${failed.length > 0 ? `Failed: ${failed.join(', ')}` : ''}`
    });

  } catch (error) {
    console.error('Export generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate exports', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}