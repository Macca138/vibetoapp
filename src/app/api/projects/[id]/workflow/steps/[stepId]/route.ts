import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string; stepId: string }>;
}

const stepUpdateSchema = z.object({
  responses: z.record(z.any()),
  completed: z.boolean(),
  aiSuggestions: z.string().optional(),
});

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    const stepId = parseInt(resolvedParams.stepId);

    if (isNaN(stepId) || stepId < 1 || stepId > 9) {
      return NextResponse.json({ error: 'Invalid step ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = stepUpdateSchema.parse(body);

    // Verify project ownership and get workflow
    const workflow = await prisma.projectWorkflow.findFirst({
      where: {
        projectId,
        project: {
          userId: session.user.id,
        },
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Update or create step response
    const stepResponse = await prisma.workflowResponse.upsert({
      where: {
        workflowId_stepId: {
          workflowId: workflow.id,
          stepId,
        },
      },
      update: {
        responses: validatedData.responses,
        completed: validatedData.completed,
        aiSuggestions: validatedData.aiSuggestions,
        updatedAt: new Date(),
      },
      create: {
        workflowId: workflow.id,
        stepId,
        responses: validatedData.responses,
        completed: validatedData.completed,
        aiSuggestions: validatedData.aiSuggestions,
      },
    });

    // Update workflow current step if this step is completed and it's the current step
    if (validatedData.completed && stepId === workflow.currentStep && stepId < 9) {
      await prisma.projectWorkflow.update({
        where: { id: workflow.id },
        data: {
          currentStep: stepId + 1,
          updatedAt: new Date(),
        },
      });
    }

    // Check if workflow is completed (all 9 steps completed)
    if (validatedData.completed && stepId === 9) {
      await prisma.projectWorkflow.update({
        where: { id: workflow.id },
        data: {
          isCompleted: true,
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json(stepResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Step update error:', error);
    return NextResponse.json(
      { error: 'Failed to update step' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.id;
    const stepId = parseInt(resolvedParams.stepId);

    if (isNaN(stepId) || stepId < 1 || stepId > 9) {
      return NextResponse.json({ error: 'Invalid step ID' }, { status: 400 });
    }

    // Get step response
    const stepResponse = await prisma.workflowResponse.findFirst({
      where: {
        stepId,
        workflow: {
          projectId,
          project: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!stepResponse) {
      return NextResponse.json({ error: 'Step response not found' }, { status: 404 });
    }

    return NextResponse.json(stepResponse);
  } catch (error) {
    console.error('Step fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch step' },
      { status: 500 }
    );
  }
}