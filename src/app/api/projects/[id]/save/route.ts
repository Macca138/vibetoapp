import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Schema for partial project updates
const projectUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

// Schema for partial workflow step updates
const stepUpdateSchema = z.object({
  stepId: z.number().min(1).max(9),
  responses: z.record(z.any()),
  completed: z.boolean().optional(),
  aiSuggestions: z.string().optional(),
});

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    const body = await request.json();

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
      include: {
        workflow: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Determine what type of update this is
    if ('stepId' in body) {
      // This is a workflow step update
      const validatedData = stepUpdateSchema.parse(body);
      
      if (!project.workflow) {
        return NextResponse.json(
          { error: 'Workflow not found for this project' },
          { status: 404 }
        );
      }

      // Update or create step response
      const stepResponse = await prisma.workflowResponse.upsert({
        where: {
          workflowId_stepId: {
            workflowId: project.workflow.id,
            stepId: validatedData.stepId,
          },
        },
        update: {
          responses: validatedData.responses,
          completed: validatedData.completed ?? undefined,
          aiSuggestions: validatedData.aiSuggestions,
          updatedAt: new Date(),
        },
        create: {
          workflowId: project.workflow.id,
          stepId: validatedData.stepId,
          responses: validatedData.responses,
          completed: validatedData.completed ?? false,
          aiSuggestions: validatedData.aiSuggestions,
        },
      });

      return NextResponse.json({
        message: 'Workflow step auto-saved successfully',
        stepResponse,
      });
    } else {
      // This is a project update
      const validatedData = projectUpdateSchema.parse(body);
      
      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: {
          ...validatedData,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        message: 'Project auto-saved successfully',
        project: updatedProject,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Auto-save error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-save' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  // PATCH method for smaller, more frequent updates
  return PUT(request, { params });
}