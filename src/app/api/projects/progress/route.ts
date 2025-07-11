import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WORKFLOW_STEPS } from '@/lib/workflow/config';

interface ProjectProgressData {
  projectId: string;
  projectName: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  currentStep: number;
  completedSteps: number;
  totalSteps: number;
  isCompleted: boolean;
  completedAt?: Date;
  estimatedTimeRemaining?: number;
  lastActivity?: Date;
  stepStatuses: {
    stepId: number;
    title: string;
    completed: boolean;
    hasData: boolean;
  }[];
}

// Calculate estimated time remaining based on current progress
function calculateEstimatedTime(completedSteps: number, totalSteps: number, startedAt: Date): number | undefined {
  // Don't show estimates for projects that haven't made meaningful progress
  if (completedSteps < 2) {
    return undefined;
  }

  const now = new Date();
  const timeSpentInHours = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60);
  
  // Only calculate if significant time has passed (at least 30 minutes)
  if (timeSpentInHours < 0.5) {
    return undefined;
  }

  // Use a more conservative approach - assume 15-30 minutes per remaining step
  const remainingSteps = totalSteps - completedSteps;
  const estimatedMinutesPerStep = Math.max(15, Math.min(30, (timeSpentInHours / completedSteps) * 60));
  
  const estimate = remainingSteps * estimatedMinutesPerStep;
  
  // Don't show unrealistic estimates (over 3 hours)
  if (estimate > 180) {
    return undefined;
  }
  
  return estimate;
}

// Calculate progress for a single project
async function calculateProjectProgress(project: any): Promise<ProjectProgressData> {
  const totalSteps = WORKFLOW_STEPS.length;
  
  // Get workflow responses to determine completed steps
  const workflowResponses = project.workflow?.responses || [];
  const completedResponses = workflowResponses.filter((r: any) => r.completed);
  const completedSteps = completedResponses.length;

  // Create step statuses
  const stepStatuses = WORKFLOW_STEPS.map(step => {
    const response = workflowResponses.find((r: any) => r.stepId === step.id);
    return {
      stepId: step.id,
      title: step.title,
      completed: response?.completed || false,
      hasData: response ? Object.keys(response.responses || {}).length > 0 : false,
    };
  });

  // Determine last activity - only show if there's actual workflow activity
  const lastActivity = workflowResponses.length > 0
    ? new Date(Math.max(...workflowResponses.map((r: any) => new Date(r.updatedAt).getTime())))
    : undefined;

  // Calculate estimated time remaining
  const estimatedTimeRemaining = project.workflow && !project.workflow.isCompleted
    ? calculateEstimatedTime(completedSteps, totalSteps, project.workflow.startedAt)
    : undefined;

  return {
    projectId: project.id,
    projectName: project.name,
    description: project.description,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    currentStep: project.workflow?.currentStep || 1,
    completedSteps,
    totalSteps,
    isCompleted: project.workflow?.isCompleted || false,
    completedAt: project.workflow?.completedAt,
    estimatedTimeRemaining,
    lastActivity,
    stepStatuses,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all projects with their workflow data
    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        workflow: {
          include: {
            responses: {
              orderBy: { stepId: 'asc' },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Calculate progress for each project
    const projectsWithProgress = await Promise.all(
      projects.map(project => calculateProjectProgress(project))
    );

    // Calculate overall stats
    const totalProjects = projectsWithProgress.length;
    const completedProjects = projectsWithProgress.filter(p => p.isCompleted).length;
    const inProgressProjects = projectsWithProgress.filter(p => !p.isCompleted && p.completedSteps > 0).length;
    const notStartedProjects = projectsWithProgress.filter(p => p.completedSteps === 0).length;

    const overallStats = {
      total: totalProjects,
      completed: completedProjects,
      inProgress: inProgressProjects,
      notStarted: notStartedProjects,
      completionRate: totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0,
    };

    return NextResponse.json({
      projects: projectsWithProgress,
      stats: overallStats,
    });
  } catch (error) {
    console.error('Error fetching project progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project progress' },
      { status: 500 }
    );
  }
}

// Get progress for a specific project
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Fetch specific project with workflow data
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
      include: {
        workflow: {
          include: {
            responses: {
              orderBy: { stepId: 'asc' },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const projectProgress = await calculateProjectProgress(project);

    return NextResponse.json({
      project: projectProgress,
    });
  } catch (error) {
    console.error('Error fetching project progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project progress' },
      { status: 500 }
    );
  }
}