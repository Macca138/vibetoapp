import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { getWorkflowResponseData } from '@/lib/workflow/types';

// Step 6 System Prompt - Exact prompt from workflow_step_prompts.md
const STEP6_SYSTEM_PROMPT = `<goal> You are an industry-veteran SaaS product designer. You've built high-touch UIs for FANG-style companies.
Your goal is to take the context below, the guidelines, the practicalities, the style guide, and turn it into a "State" Brief, or snapshots of different features at different points in time in the user's journey. </goal>

<guidelines> 
<aesthetics> - Bold simplicity with intuitive navigation creating frictionless experiences - Breathable whitespace complemented by strategic color accents for visual hierarchy - Strategic negative space calibrated for cognitive breathing room and content prioritization - Systematic color theory applied through subtle gradients and purposeful accent placement - Typography hierarchy utilizing weight variance and proportional scaling for information architecture - Visual density optimization balancing information availability with cognitive load management - Motion choreography implementing physics-based transitions for spatial continuity - Accessibility-driven contrast ratios paired with intuitive navigation patterns ensuring universal usability - Feedback responsiveness via state transitions communicating system status with minimal latency - Content-first layouts prioritizing user objectives over decorative elements for task efficiency </aesthetics> 
</guidelines> 

<task> Your goal here is to go feature-by-feature and think like a designer. Consider:
User goals and tasks - Understanding what users need to accomplish and designing to make those primary tasks seamless and efficient Information architecture - Organizing content and features in a logical hierarchy that matches users' mental models Progressive disclosure - Revealing complexity gradually to avoid overwhelming users while still providing access to advanced features Visual hierarchy - Using size, color, contrast, and positioning to guide attention to the most important elements first Affordances and signifiers - Making interactive elements clearly identifiable through visual cues that indicate how they work Consistency - Maintaining uniform patterns, components, and interactions across screens to reduce cognitive load Accessibility - Ensuring the design works for users of all abilities (color contrast, screen readers, keyboard navigation) Error prevention - Designing to help users avoid mistakes before they happen rather than just handling errors after they occur Feedback - Providing clear signals when actions succeed or fail, and communicating system status at all times Performance considerations - Accounting for loading times and designing appropriate loading states Mobile vs. desktop considerations - Adapting layouts and interactions for different device capabilities and contexts Responsive design - Ensuring the interface works well across various screen sizes and orientations User testing feedback loops - Incorporating iterative testing to validate assumptions and improve the design Platform conventions - Following established patterns from iOS/Android/Web to meet user expectations Microcopy and content strategy - Crafting clear, concise text that guides users through the experience Aesthetic appeal - Creating a visually pleasing design that aligns with brand identity while prioritizing usability Animations - Crafting beautiful yet subtle animations and transitions that make the app feel professional

I need you to take EACH FEATURE below, and give me a cohesive Design Brief. Here's how I want it formatted:
<format> ## Feature Name ### Screen X #### Screen X State N * description * of * UI & UX * in detail * including animations * any anything else * and colors based on the style-guide below

Responsive Considerations
Mobile (320-768px): [Key adaptations]
Tablet (768-1024px): [Layout changes]
Desktop (1024px+): [Enhanced features]

Screen X State N+1
[Repeat for as many states as needed based on the function]

Screen Y
[Continue for all screens in the feature] </format> </task>`;

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
        stepId: { in: [1, 2, 3, 4, 5] }
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
    const step4ResponseData = getWorkflowResponseData(previousStepsData.find(step => step.stepId === 4)?.responses);
    const step5ResponseData = getWorkflowResponseData(previousStepsData.find(step => step.stepId === 5)?.responses);
    
    const step2Output = step2ResponseData?.stepOutput || {};
    const step4Output = step4ResponseData?.stepOutput || {};
    const step5Output = step5ResponseData?.stepOutput || {};
    
    const appOverview = step2Output.appDetails || {};
    const featuresListFromStep4 = step4Output.detailedUserStories || [];
    const styleGuideFromStep5 = step5Output.designSystem || {};
    
    const fullPrompt = `${STEP6_SYSTEM_PROMPT}

<context>
<data-flow-note>
The INSERT HERE placeholders represent automatic data transfer from previous steps. The system will populate these sections with:
- User inputs from previous steps
- AI-generated outputs that have been user-validated
- Component data from Steps 2-5

This ensures consistency and reduces user effort while maintaining the validation checkpoints at each step.
</data-flow-note>

<app-overview> ${JSON.stringify(appOverview, null, 2)} </app-overview> 

<feature-list> ${JSON.stringify(featuresListFromStep4, null, 2)} </feature-list> 

<style-guide> ${JSON.stringify(styleGuideFromStep5, null, 2)} </style-guide> 
</context>

CONVERSATION CONTEXT:
${conversationContext}

USER MESSAGE: ${message}

Go feature-by-feature and think like a designer to create State Briefs - snapshots of different features at different points in time in the user's journey. Use the format specified above.`;

    // Generate AI response
    const aiResponse = await generateWorkflowResponse({
      stepNumber: 6,
      userInput: { message, conversationContext },
      systemPrompt: fullPrompt
    });

    // Check for completion - Step 6 looks for feature-by-feature screen states
    const hasStructuredOutput = aiResponse.text.includes('## Feature') && 
                               aiResponse.text.includes('### Screen') && 
                               aiResponse.text.includes('Responsive Considerations');
    
    const isComplete = hasStructuredOutput && (
      aiResponse.text.toLowerCase().includes('mobile (320-768px)') ||
      aiResponse.text.toLowerCase().includes('desktop (1024px+)') ||
      aiResponse.text.toLowerCase().includes('ready to proceed') ||
      conversationContext.split('\n').length > 4 // After several rounds of conversation
    );
    
    let stepOutput = null;
    if (isComplete) {
      // Extract structured data according to agent-handoff-specification.md
      stepOutput = {
        screenSpecifications: {
          featureScreens: [
            {
              feature: "Feature name extracted from conversation",
              screens: ["Screen layouts extracted from conversation"],
              states: ["Screen states extracted from conversation"],
              interactions: ["User interaction patterns extracted from conversation"],
              animations: ["Micro-interaction specs extracted from conversation"]
            }
          ],
          responsiveStates: "Mobile/tablet/desktop variations extracted from conversation",
          navigationPatterns: "Menu and navigation design extracted from conversation"
        },
        prototypingSpecs: {
          wireframes: "Layout specifications extracted from conversation",
          interactionFlows: "Clickable prototype flows extracted from conversation",
          animationSpecs: "Motion design specifications extracted from conversation"
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
        currentStep: 6,
        isCompleted: false
      }
    });

    // Save the conversation state
    await prisma.workflowResponse.upsert({
      where: {
        workflowId_stepId: {
          workflowId: projectWorkflow.id,
          stepId: 6
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
        stepId: 6,
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
    console.error('Step 6 chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}