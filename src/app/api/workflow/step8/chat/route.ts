import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { getWorkflowResponseData } from '@/lib/workflow/types';

// Step 8 System Prompt - Exact prompt from workflow_step_prompts.md
const STEP8_SYSTEM_PROMPT = `To ensure your project follows best practices for your chosen technology stack, you'll need to integrate development rules specific to your tech stack.

Option A (Recommended): We'll automatically apply the appropriate development rules for your tech stack: [display selected tech stack]
Option B: If you have custom development standards, you can input them manually below.

Backend Process:
Maintain a database of pre-scraped development rules for common tech stacks
Update monthly via automated scraping
For missing stacks, apply generic best practices template
Validate that rules integrate properly with the existing specification

Validation Prompt: "Review tech stack rules against the specification. Flag any conflicts and propose resolutions."`;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { projectId, message, previousMessages, stepId } = await request.json();

    // Verify user owns the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        user: { email: session.user.email }
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Get ALL previous steps data for complete context
    const previousStepsData = await prisma.workflowResponse.findMany({
      where: {
        workflowId: projectId,
        stepId: { in: [1, 2, 3, 4, 5, 6, 7] }
      },
      orderBy: { stepId: 'asc' }
    });

    // Build conversation context
    const conversationContext = previousMessages
      .filter((msg: any) => msg.role !== 'system')
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join('\n');

    // Get tech stack from Step 2 for development rules integration
    const step2ResponseData = getWorkflowResponseData(previousStepsData.find(step => step.stepId === 2)?.responses);
    const step7ResponseData = getWorkflowResponseData(previousStepsData.find(step => step.stepId === 7)?.responses);
    
    const step2Output = step2ResponseData?.stepOutput || {};
    const step7Output = step7ResponseData?.stepOutput || {};
    
    const techStack = step2Output.techChoices || {};
    const technicalSpecification = step7Output.technicalSpecification || {};
    
    const fullPrompt = `${STEP8_SYSTEM_PROMPT}

CURRENT TECH STACK: ${JSON.stringify(techStack, null, 2)}

TECHNICAL SPECIFICATION TO VALIDATE: ${JSON.stringify(technicalSpecification, null, 2)}

CONVERSATION CONTEXT:
${conversationContext}

USER MESSAGE: ${message}

Review the tech stack rules against the specification. Flag any conflicts and propose resolutions. Integrate development rules and best practices for the chosen technology stack to ensure successful implementation.`;

    // Generate AI response
    const aiResponse = await generateWorkflowResponse({
      stepNumber: 8,
      userInput: { message, conversationContext },
      systemPrompt: fullPrompt
    });

    // Check for completion - Step 8 focuses on development rules integration
    const hasValidationContent = aiResponse.text.toLowerCase().includes('development rules') || 
                                 aiResponse.text.toLowerCase().includes('best practices') ||
                                 aiResponse.text.toLowerCase().includes('conflicts') ||
                                 aiResponse.text.toLowerCase().includes('standards');
    
    const isComplete = hasValidationContent && (
      aiResponse.text.toLowerCase().includes('integration complete') ||
      aiResponse.text.toLowerCase().includes('ready to proceed') ||
      conversationContext.split('\n').length > 3 // After few rounds of conversation
    );
    
    let stepOutput = null;
    if (isComplete) {
      // Extract structured data according to agent-handoff-specification.md
      stepOutput = {
        developmentRules: {
          codingStandards: "Style guides and conventions for tech stack",
          testingStrategy: "Testing approach and tools for tech stack",
          qualityGates: "Code review and quality checks",
          cicdPipeline: "Deployment automation pipeline"
        },
        teamProcess: {
          developmentWorkflow: "Agile methodology and sprint planning",
          toolingSetup: "Development environment and tools",
          collaborationRules: "Team communication patterns"
        },
        architectureValidation: {
          patternCompliance: "Architecture pattern validation against tech stack",
          performanceValidation: "Performance requirement checks"
        },
        conversationSummary: conversationContext + `\nuser: ${message}\nassistant: ${aiResponse.text}`,
        readyForNextStep: true
      };
    }

    // First, ensure ProjectWorkflow exists
    const projectWorkflow = await prisma.projectWorkflow.upsert({
      where: { projectId },
      update: {},
      create: {
        projectId,
        currentStep: 8,
        isCompleted: false
      }
    });

    // Save the conversation state
    await prisma.workflowResponse.upsert({
      where: {
        workflowId_stepId: {
          workflowId: projectWorkflow.id,
          stepId: 8
        }
      },
      update: {
        responses: {
          conversation: conversationContext + `\nuser: ${message}\nassistant: ${aiResponse.text}`,
          stepOutput: stepOutput
        },
        completed: isComplete,
        updatedAt: new Date()
      },
      create: {
        workflowId: projectWorkflow.id,
        stepId: 8,
        responses: {
          conversation: conversationContext + `\nuser: ${message}\nassistant: ${aiResponse.text}`,
          stepOutput: stepOutput
        },
        completed: isComplete
      }
    });

    return NextResponse.json({
      message: aiResponse.text,
      stepComplete: isComplete,
      stepOutput: stepOutput
    });

  } catch (error) {
    console.error('Step 8 chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}