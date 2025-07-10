import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { STEP2_SYSTEM_PROMPT } from '@/lib/prompts/step2Prompts';
import { z } from 'zod';

const Step2InputSchema = z.object({
  projectId: z.string(),
  valueProp: z.string().min(20, 'Value proposition must be at least 20 characters').max(300),
  uniqueness: z.string().min(20, 'Uniqueness description must be at least 20 characters').max(500),
  coreFeatures: z.string().min(20, 'Core features must be at least 20 characters').max(400),
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
    const validatedData = Step2InputSchema.parse(body);

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

    // Get Step 1 data for context
    const projectWorkflow = await prisma.projectWorkflow.findFirst({
      where: {
        projectId: validatedData.projectId
      },
      include: {
        responses: {
          where: {
            stepId: 1
          }
        }
      }
    });

    // Prepare context from previous steps
    const previousStepsData = {
      step1: projectWorkflow?.responses[0]?.responses || null
    };

    // Generate AI response with Step 1 context
    const aiResponse = await generateWorkflowResponse({
      stepNumber: 2,
      userInput: {
        valueProp: validatedData.valueProp,
        uniqueness: validatedData.uniqueness,
        coreFeatures: validatedData.coreFeatures
      },
      previousStepsData,
      systemPrompt: STEP2_SYSTEM_PROMPT
    });

    // Parse AI response as JSON
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiResponse.text);
    } catch {
      // If JSON parsing fails, create a structured fallback
      aiAnalysis = {
        businessConcept: {
          elevatorPitch: `Enhanced version: ${validatedData.valueProp}`,
          problemStatement: "Needs further market validation and problem definition",
          targetMarket: "Target market analysis required",
          uniqueSellingProposition: validatedData.uniqueness
        },
        audienceAnalysis: {
          primaryPersona: {
            description: "Primary user persona needs detailed definition",
            demographics: "Demographics analysis required",
            painPoints: ["Pain point analysis needed"],
            motivations: ["User motivation analysis needed"],
            behaviorPatterns: "Current behavior patterns need research"
          },
          secondaryPersona: {
            description: "Secondary persona analysis needed",
            demographics: "Secondary demographics undefined",
            relationshipToPrimary: "Relationship analysis required"
          }
        },
        marketAnalysis: {
          marketSize: "Market size research needed",
          competitorLandscape: "Competitive analysis required",
          competitiveAdvantage: [validatedData.uniqueness],
          marketTrends: "Market trend analysis needed"
        },
        businessStrategy: {
          revenueStreams: ["Revenue model needs definition"],
          marketingStrategy: "Marketing strategy requires development",
          keyMetrics: ["Key metrics need identification"],
          riskFactors: ["Risk analysis required"],
          mitigationStrategies: ["Mitigation strategies needed"]
        },
        nextSteps: {
          validationQuestions: [
            "How will you validate market demand for this solution?",
            "What evidence supports your unique value proposition?",
            "How will you measure success in the early stages?"
          ],
          researchRecommendations: [
            "Conduct user interviews with target audience",
            "Analyze competitor solutions and pricing",
            "Research market size and growth trends"
          ],
          mvpSuggestions: [
            "Create a simple landing page to test interest",
            "Build a basic prototype to validate core features"
          ]
        },
        rawAiResponse: aiResponse.text
      };
    }

    // Save or update workflow step data
    const workflowData = {
      userInput: validatedData,
      aiAnalysis,
      completedAt: new Date(),
      status: 'completed' as const
    };

    // First, ensure ProjectWorkflow exists
    const projectWorkflowRecord = await prisma.projectWorkflow.upsert({
      where: {
        projectId: validatedData.projectId
      },
      update: {
        currentStep: Math.max(2, 2), // Keep current step at least at 2
        updatedAt: new Date()
      },
      create: {
        projectId: validatedData.projectId,
        currentStep: 2,
        startedAt: new Date()
      }
    });

    // Then upsert the WorkflowResponse
    await prisma.workflowResponse.upsert({
      where: {
        workflowId_stepId: {
          workflowId: projectWorkflowRecord.id,
          stepId: 2
        }
      },
      update: {
        responses: workflowData,
        completed: true,
        aiSuggestions: JSON.stringify(aiAnalysis),
        updatedAt: new Date()
      },
      create: {
        workflowId: projectWorkflowRecord.id,
        stepId: 2,
        responses: workflowData,
        completed: true,
        aiSuggestions: JSON.stringify(aiAnalysis)
      }
    });

    return NextResponse.json({
      success: true,
      data: aiAnalysis,
      message: 'Step 2 completed successfully'
    });

  } catch (error) {
    console.error('Step 2 API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process Step 2', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}