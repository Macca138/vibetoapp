import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { z } from 'zod';

const Step9InputSchema = z.object({
  projectId: z.string(),
  documentFormat: z.array(z.string()).min(1, 'At least one document format is required'),
  nextSteps: z.array(z.string()).min(1, 'At least one next step is required'),
  additionalHelp: z.array(z.string()).optional(),
  timeline: z.string().min(1, 'Timeline is required'),
  budget: z.string().optional(),
  preferredApproach: z.string().min(1, 'Preferred approach is required'),
});

const STEP9_SYSTEM_PROMPT = `You are an expert project manager helping to create a comprehensive execution plan for a mobile/web application based on the completed workflow. Analyze the provided information and create actionable next steps.

Return your response as a JSON object with the following structure:
{
  "analysis": {
    "readinessLevel": "Assessment of project readiness for execution",
    "timelineRealism": "Evaluation of proposed timeline",
    "resourceRequirements": "Analysis of required resources and skills",
    "successProbability": "Likelihood of success based on current planning"
  },
  "executionPlan": {
    "immediateActions": ["Actions to take within the next 2 weeks"],
    "shortTermGoals": ["Goals for the next 1-3 months"],
    "longTermMilestones": ["Key milestones for the next 6-12 months"],
    "resourceAllocation": ["Recommended resource allocation and team structure"]
  },
  "recommendations": [
    "Specific recommendations for successful execution"
  ],
  "riskManagement": [
    "Potential risks and mitigation strategies"
  ],
  "supportResources": [
    "Recommended resources, tools, and services"
  ]
}`;

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
    const validatedData = Step9InputSchema.parse(body);

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        user: { email: session.user.email }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Generate AI response
    const aiResponse = await generateWorkflowResponse({
      stepNumber: 9,
      userInput: {
        documentFormat: validatedData.documentFormat,
        nextSteps: validatedData.nextSteps,
        additionalHelp: validatedData.additionalHelp,
        timeline: validatedData.timeline,
        budget: validatedData.budget,
        preferredApproach: validatedData.preferredApproach
      },
      systemPrompt: STEP9_SYSTEM_PROMPT
    });

    // Parse AI response as JSON
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiResponse.text);
    } catch {
      // If JSON parsing fails, create a structured fallback
      aiAnalysis = {
        analysis: {
          readinessLevel: "Good foundation established",
          timelineRealism: "Timeline appears achievable",
          resourceRequirements: "Standard development resources required",
          successProbability: "High with proper execution"
        },
        executionPlan: {
          immediateActions: [
            "Finalize project specifications",
            "Set up development environment",
            "Create project timeline"
          ],
          shortTermGoals: [
            "Complete MVP development",
            "Conduct user testing",
            "Iterate based on feedback"
          ],
          longTermMilestones: [
            "Public beta launch",
            "Market validation",
            "Scale and optimize"
          ],
          resourceAllocation: [
            "1-2 developers for MVP",
            "1 designer for UI/UX",
            "Project manager for coordination"
          ]
        },
        recommendations: [
          "Start with MVP features only",
          "Gather user feedback early and often",
          "Maintain focus on core value proposition",
          "Plan for iterative development"
        ],
        riskManagement: [
          "Technical complexity - start simple",
          "Market fit - validate early",
          "Resource constraints - prioritize ruthlessly"
        ],
        supportResources: [
          "Development frameworks and tools",
          "User testing platforms",
          "Project management software",
          "Analytics and monitoring tools"
        ],
        rawAiResponse: aiResponse.text
      };
    }

    // Save workflow step data
    const workflowData = {
      userInput: validatedData,
      aiAnalysis,
      completedAt: new Date(),
      status: 'completed' as const
    };

    // First, ensure ProjectWorkflow exists
    const projectWorkflow = await prisma.projectWorkflow.upsert({
      where: {
        projectId: validatedData.projectId
      },
      update: {
        currentStep: Math.max(9, 9),
        isCompleted: true,
        completedAt: new Date(),
        updatedAt: new Date()
      },
      create: {
        projectId: validatedData.projectId,
        currentStep: 9,
        isCompleted: true,
        completedAt: new Date(),
        startedAt: new Date()
      }
    });

    // Then upsert the WorkflowResponse
    await prisma.workflowResponse.upsert({
      where: {
        workflowId_stepId: {
          workflowId: projectWorkflow.id,
          stepId: 9
        }
      },
      update: {
        responses: workflowData,
        completed: true,
        aiSuggestions: JSON.stringify(aiAnalysis),
        updatedAt: new Date()
      },
      create: {
        workflowId: projectWorkflow.id,
        stepId: 9,
        responses: workflowData,
        completed: true,
        aiSuggestions: JSON.stringify(aiAnalysis)
      }
    });

    return NextResponse.json({
      success: true,
      data: aiAnalysis,
      message: 'Step 9 completed successfully - Workflow complete!'
    });

  } catch (error) {
    console.error('Step 9 API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process Step 9', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}