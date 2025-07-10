import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { z } from 'zod';

const Step8InputSchema = z.object({
  projectId: z.string(),
  coreFeatures: z.array(z.string()).min(1, 'At least one core feature is required'),
  niceToHaveFeatures: z.array(z.string()).optional(),
  technicalConstraints: z.string().optional(),
  timelinePreference: z.string().min(1, 'Timeline preference is required'),
  budgetRange: z.string().optional(),
  successMetrics: z.array(z.string()).min(1, 'At least one success metric is required'),
  launchStrategy: z.string().min(1, 'Launch strategy is required'),
});

const STEP8_SYSTEM_PROMPT = `You are an expert product manager helping to define an MVP (Minimum Viable Product) for a mobile/web application. Analyze the provided information and create a comprehensive MVP definition.

Return your response as a JSON object with the following structure:
{
  "analysis": {
    "featurePrioritization": "Analysis of feature prioritization",
    "timelineRealism": "Assessment of timeline feasibility",
    "resourceRequirements": "Analysis of required resources",
    "successMetricsViability": "Evaluation of proposed success metrics"
  },
  "mvpDefinition": {
    "coreFeatureSet": ["Refined list of essential features for MVP"],
    "userStories": ["Key user stories for the MVP"],
    "technicalRequirements": ["Technical requirements and constraints"],
    "developmentMilestones": ["Key development milestones"]
  },
  "roadmap": {
    "phase1": "MVP features and timeline",
    "phase2": "Post-MVP features and timeline",
    "phase3": "Advanced features and scaling"
  },
  "recommendations": [
    "Specific recommendations for MVP development"
  ],
  "riskFactors": [
    "Potential risks and mitigation strategies"
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
    const validatedData = Step8InputSchema.parse(body);

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

    // Get previous steps data for context
    const projectWorkflow = await prisma.projectWorkflow.findFirst({
      where: { projectId: validatedData.projectId },
      include: {
        responses: {
          where: { stepId: { in: [1, 2, 3, 4, 5, 6, 7] } }
        }
      }
    });

    const step1Data = projectWorkflow?.responses.find(r => r.stepId === 1);
    const step2Data = projectWorkflow?.responses.find(r => r.stepId === 2);
    const step3Data = projectWorkflow?.responses.find(r => r.stepId === 3);
    const step4Data = projectWorkflow?.responses.find(r => r.stepId === 4);
    const step5Data = projectWorkflow?.responses.find(r => r.stepId === 5);
    const step6Data = projectWorkflow?.responses.find(r => r.stepId === 6);
    const step7Data = projectWorkflow?.responses.find(r => r.stepId === 7);

    // Prepare context from previous steps
    const previousStepsData = {
      step1: step1Data?.responses || null,
      step2: step2Data?.responses || null,
      step3: step3Data?.responses || null,
      step4: step4Data?.responses || null,
      step5: step5Data?.responses || null,
      step6: step6Data?.responses || null,
      step7: step7Data?.responses || null
    };

    // Generate AI response with previous steps context
    const aiResponse = await generateWorkflowResponse({
      stepNumber: 8,
      userInput: {
        coreFeatures: validatedData.coreFeatures,
        niceToHaveFeatures: validatedData.niceToHaveFeatures,
        technicalConstraints: validatedData.technicalConstraints,
        timelinePreference: validatedData.timelinePreference,
        budgetRange: validatedData.budgetRange,
        successMetrics: validatedData.successMetrics,
        launchStrategy: validatedData.launchStrategy
      },
      previousStepsData,
      systemPrompt: STEP8_SYSTEM_PROMPT
    });

    // Parse AI response as JSON
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiResponse.text);
    } catch {
      // If JSON parsing fails, create a structured fallback
      aiAnalysis = {
        analysis: {
          featurePrioritization: "Features need further prioritization",
          timelineRealism: "Timeline appears achievable",
          resourceRequirements: "Standard development resources required",
          successMetricsViability: "Metrics are measurable and relevant"
        },
        mvpDefinition: {
          coreFeatureSet: validatedData.coreFeatures,
          userStories: validatedData.coreFeatures.map(feature => `As a user, I want ${feature.toLowerCase()}`),
          technicalRequirements: [validatedData.technicalConstraints || "Standard web/mobile development"],
          developmentMilestones: ["Design", "Development", "Testing", "Launch"]
        },
        roadmap: {
          phase1: `MVP with core features: ${validatedData.coreFeatures.join(', ')}`,
          phase2: `Enhanced features: ${validatedData.niceToHaveFeatures?.join(', ') || 'Additional features'}`,
          phase3: "Advanced features and scaling based on user feedback"
        },
        recommendations: [
          "Start with core features only",
          "Gather user feedback early",
          "Iterate based on data",
          "Plan for scalability"
        ],
        riskFactors: [
          "Feature creep during development",
          "Technical complexity underestimation",
          "Market validation assumptions"
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
        currentStep: Math.max(8, 8),
        updatedAt: new Date()
      },
      create: {
        projectId: validatedData.projectId,
        currentStep: 8,
        startedAt: new Date()
      }
    });

    // Then upsert the WorkflowResponse
    await prisma.workflowResponse.upsert({
      where: {
        workflowId_stepId: {
          workflowId: projectWorkflow.id,
          stepId: 8
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
        stepId: 8,
        responses: workflowData,
        completed: true,
        aiSuggestions: JSON.stringify(aiAnalysis)
      }
    });

    return NextResponse.json({
      success: true,
      data: aiAnalysis,
      message: 'Step 8 completed successfully'
    });

  } catch (error) {
    console.error('Step 8 API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process Step 8', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}