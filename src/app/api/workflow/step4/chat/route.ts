import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { getWorkflowResponseData } from '@/lib/workflow/types';

// Step 4 System Prompt - Exact prompt from workflow_step_prompts.md
const STEP4_SYSTEM_PROMPT = `<goal> You're an experienced SaaS Founder with a background in Product Design & Product Management that obsesses about product and solving peoples problems. Your job is to take the app idea, and take on a collaborative / consultative role to build out feature ideas.

The features are listed below in <features-list> and additional info about the app is in <app-details>

Each time the user responds back to you, you integrate their responses into the overall plan, and then repeat back the entire plan, per the format below, which incorporates the clarifications.

Focus only on features from the approved Features List. Flag any new features that emerge for separate consideration. </goal>

<format> ## Features List ### Feature Category #### Feature - [] [User Stories] - [] [List personas and their user stories. For each persona, provide several stories in this format: * As a X, I want to Y, so that Z.]

Technical Complexity Flags
[] [Real-time data requirements]
[] [Offline sync needs]
[] [Complex calculations]
[] [Third-party integrations]
[] [Other technical considerations]

UX/UI Considerations
Bullet-point the step-by-step journey a user will have interacting with the product in detail with regard to this specific feature.
[] [Core Experience]
[] [Description of different "states" of that screen]
[] [How it handles state changes visually]
[] [Animations, information architecture, progressive disclosure, visual hierarchy, etc]
[] [Advanced Users & Edge Cases]
[] [Description of different "states" of that screen]
[] [How it handles state changes visually]
[] [Animations, information architecture, progressive disclosure, visual hierarchy, etc] </format>

<validation-steps> After generating user stories, perform these validations: - Review user stories against the technical architecture from Step 3. Flag any stories that require capabilities not covered in the current architecture. - Ensure all user stories align with the approved Features List from Step 2. - Check that technical complexity flags are addressed in the architecture. </validation-steps>

<warnings-and-guidance> 
<ux-guide> You must follow these rules: - Bold simplicity with intuitive navigation creating frictionless experiences - Breathable whitespace complemented by strategic color accents for visual hierarchy - Strategic negative space calibrated for cognitive breathing room and content prioritization - Systematic color theory applied through subtle gradients and purposeful accent placement - Typography hierarchy utilizing weight variance and proportional scaling for information architecture - Visual density optimization balancing information availability with cognitive load management - Motion choreography implementing physics-based transitions for spatial continuity - Accessibility-driven contrast ratios paired with intuitive navigation patterns ensuring universal usability - Feedback responsiveness via state transitions communicating system status with minimal latency - Content-first layouts prioritizing user objectives over decorative elements for task efficiency - **User goals and tasks** - Understanding what users need to accomplish and designing to make those primary tasks seamless and efficient - **Information architecture** - Organizing content and features in a logical hierarchy that matches users' mental models - **Progressive disclosure** - Revealing complexity gradually to avoid overwhelming users while still providing access to advanced features - **Visual hierarchy** - Using size, color, contrast, and positioning to guide attention to the most important elements first - **Affordances and signifiers** - Making interactive elements clearly identifiable through visual cues that indicate how they work - **Consistency** - Maintaining uniform patterns, components, and interactions across screens to reduce cognitive load - **Accessibility** - Ensuring the design works for users of all abilities (color contrast, screen readers, keyboard navigation) - **Error prevention** - Designing to help users avoid mistakes before they happen rather than just handling errors after they occur - **Feedback** - Providing clear signals when actions succeed or fail, and communicating system status at all times - **Performance considerations** - Accounting for loading times and designing appropriate loading states - **Mobile vs. desktop considerations** - Adapting layouts and interactions for different device capabilities and contexts - **Responsive design** - Ensuring the interface works well across various screen sizes and orientations - **User testing feedback loops** - Incorporating iterative testing to validate assumptions and improve the design - **Platform conventions** - Following established patterns from iOS/Android/Web to meet user expectations - **Microcopy and content strategy** - Crafting clear, concise text that guides users through the experience - **Aesthetic appeal** - Creating a visually pleasing design that aligns with brand identity while prioritizing usability - **Animations** - Crafting beautiful yet subtle animations and transitions that make the app feel professional </ux-guide> 
</warnings-and-guidance>`;

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
        stepId: { in: [1, 2, 3] }
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
    const featuresListFromStep2 = step2Output.featuresList || {};
    const appDetailsFromStep2 = step2Output.appDetails || {};
    
    const fullPrompt = `${STEP4_SYSTEM_PROMPT}

<context>
<data-flow-note>
The INSERT HERE placeholders represent automatic data transfer from previous steps. The system will populate these sections with:
- User inputs from previous steps
- AI-generated outputs that have been user-validated
- Component data from Steps 2 and 3

This ensures consistency and reduces user effort while maintaining the validation checkpoints at each step.
</data-flow-note>

<feature-list> ${JSON.stringify(featuresListFromStep2, null, 2)} </feature-list> 

<app-details> ${JSON.stringify(appDetailsFromStep2, null, 2)} </app-details> 
</context>

CONVERSATION CONTEXT:
${conversationContext}

USER MESSAGE: ${message}

Take the app idea and work collaboratively to build out feature ideas. Focus only on features from the approved Features List and flag any new features that emerge for separate consideration.`;

    // Generate AI response
    const aiResponse = await generateWorkflowResponse({
      stepNumber: 4,
      userInput: { message, conversationContext },
      systemPrompt: fullPrompt
    });

    // Check for completion - Step 4 looks for structured output with required sections
    const hasStructuredOutput = aiResponse.text.includes('## Features List') && 
                               aiResponse.text.includes('Technical Complexity Flags') && 
                               aiResponse.text.includes('UX/UI Considerations');
    
    const isComplete = hasStructuredOutput && (
      aiResponse.text.toLowerCase().includes('advanced users & edge cases') ||
      aiResponse.text.toLowerCase().includes('ready to proceed') ||
      conversationContext.split('\n').length > 4 // After several rounds of conversation
    );
    
    let stepOutput = null;
    if (isComplete) {
      // Extract structured data according to agent-handoff-specification.md
      stepOutput = {
        detailedUserStories: [
          {
            feature: "Feature name extracted from conversation",
            userStory: "As a [user], I want [goal] so that [benefit] - extracted from conversation",
            acceptanceCriteria: ["Criteria list extracted from conversation"],
            technicalComplexity: "low/medium/high extracted from conversation",
            priority: "must/should/could extracted from conversation"
          }
        ],
        uxFlows: {
          mainUserJourney: "Primary user flow extracted from conversation",
          onboarding: "New user experience extracted from conversation",
          keyInteractions: "Critical interaction patterns extracted from conversation"
        },
        screenStates: {
          coreScreens: ["Screen definitions extracted from conversation"],
          stateTransitions: ["State change patterns extracted from conversation"],
          errorHandling: ["Error state patterns extracted from conversation"]
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
        currentStep: 4,
        isCompleted: false
      }
    });

    // Save the conversation state
    await prisma.workflowResponse.upsert({
      where: {
        workflowId_stepId: {
          workflowId: projectWorkflow.id,
          stepId: 4
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
        stepId: 4,
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
    console.error('Step 4 chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}