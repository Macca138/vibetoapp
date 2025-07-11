import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { STEP1_SYSTEM_PROMPT } from '@/lib/prompts/step1Prompts';
import { z } from 'zod';

const Step1InputSchema = z.object({
  projectId: z.string(),
  appIdea: z.string().min(50, 'App idea must be at least 50 characters').max(2000),
  inspiration: z.string().optional(),
  problemSolving: z.string().min(10, 'Problem description must be at least 10 characters').max(2000).optional(),
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
    const validatedData = Step1InputSchema.parse(body);

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
      stepNumber: 1,
      userInput: {
        appIdea: validatedData.appIdea,
        inspiration: validatedData.inspiration,
        problemSolving: validatedData.problemSolving || validatedData.appIdea
      },
      systemPrompt: STEP1_SYSTEM_PROMPT
    });

    // Parse AI response as JSON and transform to expected frontend structure
    let aiAnalysis;
    try {
      const rawAiResponse = JSON.parse(aiResponse.text);
      // Transform to expected frontend structure
      aiAnalysis = {
        projectOutline: {
          problemStatement: rawAiResponse.analysis?.coreProblem || "Needs further clarification",
          targetAudience: rawAiResponse.analysis?.targetAudience || "To be defined",
          coreSolution: rawAiResponse.refinedConcept?.elevatorPitch || validatedData.appIdea,
          uniqueValue: rawAiResponse.analysis?.uniqueValue || "Requires more detail",
          keyFeatures: rawAiResponse.refinedConcept?.keyFeatures || ["Core functionality to be defined"],
          successMetrics: rawAiResponse.analysis?.marketOpportunity || "Needs validation"
        },
        refinedPrompt: {
          system: "You are helping refine an app idea",
          context: validatedData.appIdea,
          instructions: "Focus on clarifying the core value proposition"
        },
        clarificationQuestions: rawAiResponse.followUpQuestions || [
          "What makes your solution different from existing options?",
          "Who specifically would be your ideal user?",
          "What's the biggest pain point your app would solve?"
        ],
        readyForNextStep: rawAiResponse.readyForNextStep || false,
        rawAiResponse: aiResponse.text
      };
    } catch {
      // If JSON parsing fails, create a structured fallback
      aiAnalysis = {
        projectOutline: {
          problemStatement: "Needs further clarification",
          targetAudience: "To be defined",
          coreSolution: validatedData.appIdea,
          uniqueValue: "Requires more detail",
          keyFeatures: ["Core functionality to be defined"],
          successMetrics: "Needs validation"
        },
        refinedPrompt: {
          system: "You are helping refine an app idea",
          context: validatedData.appIdea,
          instructions: "Focus on clarifying the core value proposition"
        },
        clarificationQuestions: [
          "What makes your solution different from existing options?",
          "Who specifically would be your ideal user?",
          "What's the biggest pain point your app would solve?"
        ],
        readyForNextStep: false,
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
    const projectWorkflow = await prisma.projectWorkflow.upsert({
      where: {
        projectId: validatedData.projectId
      },
      update: {
        currentStep: Math.max(1, 1), // Keep current step at least at 1
        updatedAt: new Date()
      },
      create: {
        projectId: validatedData.projectId,
        currentStep: 1,
        startedAt: new Date()
      }
    });

    // Then upsert the WorkflowResponse
    await prisma.workflowResponse.upsert({
      where: {
        workflowId_stepId: {
          workflowId: projectWorkflow.id,
          stepId: 1
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
        stepId: 1,
        responses: workflowData,
        completed: true,
        aiSuggestions: JSON.stringify(aiAnalysis)
      }
    });

    return NextResponse.json({
      success: true,
      data: aiAnalysis,
      message: 'Step 1 completed successfully'
    });

  } catch (error) {
    console.error('Step 1 API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process Step 1', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}