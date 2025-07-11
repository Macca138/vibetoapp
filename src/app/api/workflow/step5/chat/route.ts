import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { getWorkflowResponseData } from '@/lib/workflow/types';

// Step 5 System Prompt - Exact prompt from workflow_step_prompts.md
const STEP5_SYSTEM_PROMPT = `<goal> You are an industry-veteran SaaS product designer. You've built high-touch UIs for FANG-style companies.
Your goal is to take the context below, the guidelines, and the user inspiration, and turn it into a functional UX/UI style-guide.
If no inspiration is provided, use design patterns appropriate for [Target Platform] and [Target Audience] defaults. </goal>

<inspirations> The attached images serve as the user's inspiration (if any). If images are low-quality or off-brand, prompt user for better examples or proceed with platform defaults. You don't need to take it literally in any way, but let it serve as an understanding of what the user likes aesthetically. </inspirations> 

<guidelines> 
<aesthetics> - Bold simplicity with intuitive navigation creating frictionless experiences - Breathable whitespace complemented by strategic color accents for visual hierarchy - Strategic negative space calibrated for cognitive breathing room and content prioritization - Systematic color theory applied through subtle gradients and purposeful accent placement - Typography hierarchy utilizing weight variance and proportional scaling for information architecture - Visual density optimization balancing information availability with cognitive load management - Motion choreography implementing physics-based transitions for spatial continuity - Accessibility-driven contrast ratios paired with intuitive navigation patterns ensuring universal usability - Feedback responsiveness via state transitions communicating system status with minimal latency - Content-first layouts prioritizing user objectives over decorative elements for task efficiency </aesthetics> 
</guidelines> 

<platform-considerations> Adapt design system for [Target Platform from Step 2]. Include platform-specific considerations: - iOS: Follow Human Interface Guidelines - Android: Follow Material Design principles - Web: Focus on accessibility and responsive design </platform-considerations>

<task> Your goal here is to think like a designer and build a "style guide" for the app as a whole. Take into account the following:
Primary colors Secondary colors Accent colors Functional colors Background colors Font families Font weights Font styles Button styling Card styling Input styling Icons App spacing Motion & animation

I need you to take this all into account, and give me a cohesive Design Brief. Use the comprehensive format with all design system components including color palette, typography, component styling, icons, spacing system, and motion & animation guidelines. </task>`;

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

    // Get previous steps data for context
    const previousStepsData = await prisma.workflowResponse.findMany({
      where: {
        workflowId: projectId,
        stepId: { in: [1, 2, 3, 4] }
      },
      orderBy: { stepId: 'asc' }
    });

    // Build conversation context
    const conversationContext = previousMessages
      .filter((msg: any) => msg.role !== 'system')
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join('\n');

    // Create context following the INSERT HERE pattern from workflow_step_prompts.md
    const step2ResponseData = getWorkflowResponseData(previousStepsData.find(step => step.stepId === 2)?.responses);
    const step2Output = step2ResponseData?.stepOutput || {};
    const appOverview = {
      ...step2Output.appDetails,
      uxUiConsiderations: step2Output.uxUiConsiderations || []
    };
    
    const fullPrompt = `${STEP5_SYSTEM_PROMPT}

<context>
<data-flow-note>
The INSERT HERE placeholders represent automatic data transfer from previous steps. The system will populate these sections with:
- User inputs from previous steps
- AI-generated outputs that have been user-validated
- Component data from Steps 2-4

This ensures consistency and reduces user effort while maintaining the validation checkpoints at each step.
</data-flow-note>

<app-overview> ${JSON.stringify(appOverview, null, 2)}

ENSURE THAT USER IS ASKED TO UPLOAD ANY VISUAL INSPIRATION OR ATTACH AND CODE FILES FROM OTHER EXAMPLES THEY LIKE </app-overview> 
</context>

CONVERSATION CONTEXT:
${conversationContext}

USER MESSAGE: ${message}

Think like a designer and build a "style guide" for the app as a whole. Take into account all design elements and create a cohesive Design Brief using the comprehensive format.`;

    // Generate AI response
    const aiResponse = await generateWorkflowResponse({
      stepNumber: 5,
      userInput: { message, conversationContext },
      systemPrompt: fullPrompt
    });

    // Check for completion - Step 5 looks for comprehensive design system output
    const hasStructuredOutput = aiResponse.text.includes('Color Palette') && 
                               aiResponse.text.includes('Typography') && 
                               aiResponse.text.includes('Component') &&
                               aiResponse.text.includes('Spacing');
    
    const isComplete = hasStructuredOutput && (
      aiResponse.text.toLowerCase().includes('motion & animation') ||
      aiResponse.text.toLowerCase().includes('ready to proceed') ||
      conversationContext.split('\n').length > 4 // After several rounds of conversation
    );
    
    let stepOutput = null;
    if (isComplete) {
      // Extract structured data according to agent-handoff-specification.md
      stepOutput = {
        designSystem: {
          colorPalette: "Brand colors with usage guidelines extracted from conversation",
          typography: "Font hierarchy and styling extracted from conversation",
          componentLibrary: "Reusable UI components extracted from conversation",
          iconSet: "Icon system and guidelines extracted from conversation",
          spacing: "Layout and spacing system extracted from conversation"
        },
        appOverview: {
          appDetails: "From Step 2 appDetails",
          uxUiConsiderations: "Design patterns and interactions extracted from conversation",
          visualHierarchy: "Information prioritization extracted from conversation",
          brandPersonality: "Design mood and feeling extracted from conversation"
        },
        platformAdaptations: {
          responsive: "Breakpoint specifications extracted from conversation",
          mobileFirst: "Mobile-specific patterns extracted from conversation",
          accessibility: "Inclusive design guidelines extracted from conversation"
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
        currentStep: 5,
        isCompleted: false
      }
    });

    // Save the conversation state
    await prisma.workflowResponse.upsert({
      where: {
        workflowId_stepId: {
          workflowId: projectWorkflow.id,
          stepId: 5
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
        stepId: 5,
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
    console.error('Step 5 chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}