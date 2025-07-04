import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DataFlowEngine } from '@/lib/dataFlowEngine';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if workflow already exists
    const existingWorkflow = await prisma.projectWorkflow.findUnique({
      where: { projectId },
    });

    if (existingWorkflow) {
      return NextResponse.json({ error: 'Workflow already exists' }, { status: 400 });
    }

    // Create new workflow
    const workflow = await prisma.projectWorkflow.create({
      data: {
        projectId,
        currentStep: 1,
        isCompleted: false,
        startedAt: new Date(),
      },
      include: {
        responses: true,
      },
    });

    // Create default data flow relationships for the project
    await DataFlowEngine.createDefaultDataFlows(projectId);

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Workflow creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
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

    // Get workflow with responses
    const workflow = await prisma.projectWorkflow.findFirst({
      where: {
        projectId,
        project: {
          userId: session.user.id,
        },
      },
      include: {
        responses: {
          orderBy: { stepId: 'asc' },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Workflow fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}