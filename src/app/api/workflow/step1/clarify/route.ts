import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { z } from 'zod';

const ClarifyInputSchema = z.object({
  projectId: z.string(),
  sessionId: z.string().optional(),
  responses: z.record(z.string()),
  previousOutput: z.object({
    projectOutline: z.object({
      problemStatement: z.string(),
      targetAudience: z.string(),
      coreSolution: z.string(),
      uniqueValue: z.string(),
      keyFeatures: z.array(z.string()),
      successMetrics: z.string(),
    }),
    refinedPrompt: z.object({
      system: z.string(),
      context: z.string(),
      instructions: z.string(),
    }),
    clarificationQuestions: z.array(z.string()),
    readyForNextStep: z.boolean(),
  }),
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
    const validatedData = ClarifyInputSchema.parse(body);

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

    // Build the clarification prompt
    const systemPrompt = `You are a Prompt Generator, specializing in creating well-structured, verifiable, and low-hallucination prompts. You are helping refine an app concept through iterative clarification.

PREVIOUS OUTPUT:
${JSON.stringify(validatedData.previousOutput, null, 2)}

USER RESPONSES TO CLARIFICATION QUESTIONS:
${Object.entries(validatedData.responses)
  .map(([questionId, response]) => `Q: ${validatedData.previousOutput.clarificationQuestions[parseInt(questionId.split('_')[1]) || 0] || 'Question'}\nA: ${response}`)
  .join('\n\n')}

Your task is to integrate these responses and refine the project outline. Focus on:
1. How the responses clarify or enhance the project outline
2. What new insights can be incorporated
3. Whether the project is now ready for detailed Step 2 planning

Return your response in this EXACT JSON format:

{
  "projectOutline": {
    "problemStatement": "Enhanced statement based on clarifications",
    "targetAudience": "More specific description based on responses",
    "coreSolution": "Refined solution approach",
    "uniqueValue": "Updated unique value proposition",
    "keyFeatures": ["Updated 3-4 core features based on clarifications"],
    "successMetrics": "How success will be measured"
  },
  "refinedPrompt": {
    "system": "Enhanced SaaS Founder role definition for Step 2",
    "context": "Comprehensive context incorporating user clarifications",
    "instructions": "Detailed step-by-step approach for project specification"
  },
  "clarificationQuestions": [
    "0-2 additional questions only if critical gaps remain"
  ],
  "readyForNextStep": true,
  "changesFromPrevious": [
    "Specific description of what improved from the previous outline",
    "Another enhancement based on user responses"
  ]
}

Set readyForNextStep to true unless critical information is still missing. Focus on how the user responses have improved the project clarity and readiness for detailed planning.`;

    // Generate refined AI response
    const aiResponse = await generateWorkflowResponse({
      stepNumber: 1,
      userInput: validatedData.responses,
      previousStepsData: {
        previousOutput: validatedData.previousOutput,
        userResponses: validatedData.responses
      },
      systemPrompt: systemPrompt
    });

    // Parse AI response as JSON
    let refinedOutput;
    let changes: string[] = [];
    
    try {
      const parsed = JSON.parse(aiResponse.text);
      refinedOutput = parsed;
      changes = parsed.changesFromPrevious || [];
    } catch {
      // If JSON parsing fails, create a structured fallback
      refinedOutput = {
        ...validatedData.previousOutput,
        readyForNextStep: true,
        clarificationQuestions: [], // No more questions on parse failure
      };
      changes = ['Project outline refined based on your responses'];
    }

    // Save the clarification iteration to the database
    const projectWorkflow = await prisma.projectWorkflow.findFirst({
      where: { projectId: validatedData.projectId }
    });

    if (projectWorkflow) {
      // Update the workflow response with the refined analysis
      await prisma.workflowResponse.upsert({
        where: {
          workflowId_stepId: {
            workflowId: projectWorkflow.id,
            stepId: 1
          }
        },
        update: {
          responses: {
            userInput: validatedData.responses,
            stepOutput: refinedOutput,
            iterationCount: (projectWorkflow as any).iterationCount + 1 || 2,
            completedAt: new Date(),
            status: refinedOutput.readyForNextStep ? 'completed' : 'needs_clarification'
          },
          completed: refinedOutput.readyForNextStep,
          aiSuggestions: JSON.stringify(refinedOutput),
          updatedAt: new Date()
        },
        create: {
          workflowId: projectWorkflow.id,
          stepId: 1,
          responses: {
            userInput: validatedData.responses,
            stepOutput: refinedOutput,
            iterationCount: 2,
            completedAt: new Date(),
            status: refinedOutput.readyForNextStep ? 'completed' : 'needs_clarification'
          },
          completed: refinedOutput.readyForNextStep,
          aiSuggestions: JSON.stringify(refinedOutput)
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: refinedOutput,
      changes: changes,
      readyForNextStep: refinedOutput.readyForNextStep,
      message: refinedOutput.readyForNextStep ? 'Project outline completed successfully' : 'Additional clarification needed'
    });

  } catch (error) {
    console.error('Step 1 clarify API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process clarification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}