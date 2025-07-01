import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { STEP1_SYSTEM_PROMPT } from '@/lib/prompts/step1Prompts';
import { z } from 'zod';

const Step1InputSchema = z.object({
  projectId: z.string(),
  appIdea: z.string().min(50, 'App idea must be at least 50 characters').max(1000),
  inspiration: z.string().optional(),
  problemSolving: z.string().min(10, 'Problem description must be at least 10 characters').max(500),
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
        problemSolving: validatedData.problemSolving
      },
      systemPrompt: STEP1_SYSTEM_PROMPT
    });

    // Parse AI response as JSON
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiResponse.text);
    } catch {
      // If JSON parsing fails, create a structured fallback
      aiAnalysis = {
        analysis: {
          coreProblem: "Needs further clarification",
          targetAudience: "To be defined",
          uniqueValue: "Requires more detail",
          marketOpportunity: "Needs validation"
        },
        refinedConcept: {
          elevatorPitch: validatedData.appIdea,
          keyFeatures: ["Core functionality to be defined"],
          userBenefit: validatedData.problemSolving
        },
        recommendations: [
          "Consider defining your unique value proposition more clearly",
          "Think about your specific target audience",
          "Research existing solutions in this space"
        ],
        followUpQuestions: [
          "What makes your solution different from existing options?",
          "Who specifically would be your ideal user?",
          "What's the biggest pain point your app would solve?"
        ],
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

    await prisma.workflowStep.upsert({
      where: {
        projectId_stepNumber: {
          projectId: validatedData.projectId,
          stepNumber: 1
        }
      },
      update: {
        data: workflowData,
        updatedAt: new Date()
      },
      create: {
        projectId: validatedData.projectId,
        stepNumber: 1,
        data: workflowData,
        status: 'completed'
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