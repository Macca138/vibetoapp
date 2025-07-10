import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { z } from 'zod';

const Step7InputSchema = z.object({
  projectId: z.string(),
  revenueModel: z.string().min(1, 'Revenue model is required'),
  pricingStrategy: z.string().min(1, 'Pricing strategy is required'),
  targetRevenue: z.string().min(1, 'Target revenue is required'),
  monetizationTimeline: z.string().min(1, 'Monetization timeline is required'),
  competitorAnalysis: z.string().optional(),
  valueProposition: z.string().optional(),
});

const STEP7_SYSTEM_PROMPT = `You are an expert business strategist helping to develop a comprehensive revenue model for a mobile/web application. Analyze the provided revenue model information and provide detailed insights.

Return your response as a JSON object with the following structure:
{
  "analysis": {
    "revenueModelViability": "Assessment of the chosen revenue model",
    "pricingStrategyAlignment": "How well the pricing aligns with the model",
    "marketFit": "Analysis of market fit for the revenue approach",
    "scalabilityFactor": "How scalable this revenue model is"
  },
  "refinedStrategy": {
    "optimizedPricing": "Refined pricing recommendations",
    "revenueStreams": ["List of potential revenue streams"],
    "monetizationMilestones": ["Key milestones for monetization"],
    "riskMitigation": ["Strategies to mitigate revenue risks"]
  },
  "recommendations": [
    "Specific recommendations for revenue optimization"
  ],
  "nextSteps": [
    "Action items for implementing the revenue model"
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
    const validatedData = Step7InputSchema.parse(body);

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
          where: { stepId: { in: [1, 2, 3, 4, 5, 6] } }
        }
      }
    });

    const step1Data = projectWorkflow?.responses.find(r => r.stepId === 1);
    const step2Data = projectWorkflow?.responses.find(r => r.stepId === 2);
    const step3Data = projectWorkflow?.responses.find(r => r.stepId === 3);
    const step4Data = projectWorkflow?.responses.find(r => r.stepId === 4);
    const step5Data = projectWorkflow?.responses.find(r => r.stepId === 5);
    const step6Data = projectWorkflow?.responses.find(r => r.stepId === 6);

    // Prepare context from previous steps
    const previousStepsData = {
      step1: step1Data?.responses || null,
      step2: step2Data?.responses || null,
      step3: step3Data?.responses || null,
      step4: step4Data?.responses || null,
      step5: step5Data?.responses || null,
      step6: step6Data?.responses || null
    };

    // Generate AI response with previous steps context
    const aiResponse = await generateWorkflowResponse({
      stepNumber: 7,
      userInput: {
        revenueModel: validatedData.revenueModel,
        pricingStrategy: validatedData.pricingStrategy,
        targetRevenue: validatedData.targetRevenue,
        monetizationTimeline: validatedData.monetizationTimeline,
        competitorAnalysis: validatedData.competitorAnalysis,
        valueProposition: validatedData.valueProposition
      },
      previousStepsData,
      systemPrompt: STEP7_SYSTEM_PROMPT
    });

    // Parse AI response as JSON
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiResponse.text);
    } catch {
      // If JSON parsing fails, create a structured fallback
      aiAnalysis = {
        analysis: {
          revenueModelViability: "Requires further analysis",
          pricingStrategyAlignment: "Needs refinement",
          marketFit: "To be validated",
          scalabilityFactor: "Moderate potential"
        },
        refinedStrategy: {
          optimizedPricing: validatedData.pricingStrategy,
          revenueStreams: [validatedData.revenueModel],
          monetizationMilestones: ["Launch", "Break-even", "Scale"],
          riskMitigation: ["Market validation", "Flexible pricing", "Multiple revenue streams"]
        },
        recommendations: [
          "Validate pricing with target customers",
          "Consider multiple revenue streams",
          "Monitor competitor pricing strategies"
        ],
        nextSteps: [
          "Conduct market pricing research",
          "Develop detailed financial projections",
          "Create monetization roadmap"
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
        currentStep: Math.max(7, 7),
        updatedAt: new Date()
      },
      create: {
        projectId: validatedData.projectId,
        currentStep: 7,
        startedAt: new Date()
      }
    });

    // Then upsert the WorkflowResponse
    await prisma.workflowResponse.upsert({
      where: {
        workflowId_stepId: {
          workflowId: projectWorkflow.id,
          stepId: 7
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
        stepId: 7,
        responses: workflowData,
        completed: true,
        aiSuggestions: JSON.stringify(aiAnalysis)
      }
    });

    return NextResponse.json({
      success: true,
      data: aiAnalysis,
      message: 'Step 7 completed successfully'
    });

  } catch (error) {
    console.error('Step 7 API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process Step 7', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}