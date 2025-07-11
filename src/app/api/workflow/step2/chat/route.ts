import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { getWorkflowResponseData } from '@/lib/workflow/types';

// Step 2 System Prompt - Exact prompt from workflow_step_prompts.md
const STEP2_SYSTEM_PROMPT = `<goal> You're an experienced SaaS Founder that obsesses about product and solving peoples problems. You take a real focus on the PROBLEM, and then think through interesting ways of solving those problems. Your job is to take the app idea, and take on a collaborative / consultative role to turn this idea into a detailed project specification.

The app idea and initial MVP thoughts are in the context section below, listed as [IDEA] and [MVP].

Each time the user responds back to you, you integrate their responses into the overall plan, and then repeat back the entire plan, per the format below, which incorporates the clarifications.

If you detect insufficient detail in user responses, ask 2-3 specific follow-up questions before proceeding with generation. </goal>

<format> ## Elevator Pitch
Problem Statement
Target Audience
USP
Target Platforms

Features List
Feature Priority
Must-Have (MVP)
[ ] Core features for launch
Should-Have (Version 2)
[ ] Important but not critical
Could-Have (Future)
[ ] Nice to have features

Feature Category
[] [Requirement, ideally as a User Story]
[] [Sub-requirement or acceptance requirement]

UX/UI Considerations
[] [Screen or Interaction]
[] [Description of different "states" of that screen]
[] [How it handles state changes visually]
[] [Animations, information architecture, progressive disclosure, visual hierarchy, etc]

Initial tech suggested choices
[] [frontend]
[] [backend]
[] [hosting]
[] [other tools/APIs etc.]

Non-Functional Requirements
[] [Performance]
[] [Scalability]
[] [Security]
[] [Accessibility]

Scale Expectations
Expected user base (hundreds, thousands, millions)
Geographic distribution (local, national, global)
Peak usage patterns (steady, seasonal spikes, viral potential)

Monetization
[How will the app make money?]

Critical Questions or Clarifications
</format> 

<component-definitions> 
For subsequent steps, components are defined as: 
- "App Details" = Elevator Pitch + Problem Statement + Target Audience + USP 
- "Tech Choices" = Frontend + Backend + Hosting + APIs (selections only, not rationale) 
- "Features List" = All features from Priority sections with user stories and acceptance criteria 
- "App Overview" = App Details + UX/UI Considerations 
- "Core App Intent" = Problem Statement + Target Audience + Monetization + Scale Expectations 
</component-definitions> 

<warnings-and-guidance> 
Ask for clarifications if there are any ambiguities 
Give suggestions for new features 
Consider inter-connectedness of different features 
Make sure any mission-critical decisions are not skipped over 
Emphasize that more detail and information in user inputs leads to better outputs 
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

    // First, get or create ProjectWorkflow
    const projectWorkflow = await prisma.projectWorkflow.upsert({
      where: { projectId },
      update: {},
      create: {
        projectId,
        currentStep: 2,
        isCompleted: false
      }
    });

    // Get Step 1 data for context
    const step1Data = await prisma.workflowResponse.findFirst({
      where: {
        workflowId: projectWorkflow.id,
        stepId: 1
      }
    });

    // Build conversation context
    const conversationContext = previousMessages
      .filter((msg: any) => msg.role !== 'system')
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join('\n');

    // Create context following the INSERT HERE pattern from workflow_step_prompts.md
    const step1ResponseData = getWorkflowResponseData(step1Data?.responses);
    const step1ProjectOutline = step1ResponseData?.stepOutput?.projectOutline || {};
    const step1Summary = step1ResponseData?.conversationSummary || 'No previous step data available';
    
    const fullPrompt = `${STEP2_SYSTEM_PROMPT}

<context>
<data-flow-note>
The INSERT HERE placeholders represent automatic data transfer from previous steps. The system will populate these sections with:
- User inputs from Step 1
- AI-generated outputs that have been user-validated
- Initial app idea and concept data from Step 1

This ensures consistency and reduces user effort while maintaining the validation checkpoints at each step.
</data-flow-note>

[IDEA] ${JSON.stringify(step1ProjectOutline, null, 2)}

[MVP] ${step1ProjectOutline.keyFeatures ? step1ProjectOutline.keyFeatures.join(', ') : 'Core features to be defined based on conversation'}
</context>

CONVERSATION CONTEXT:
${conversationContext}

USER MESSAGE: ${message}

Based on the app idea from Step 1, work collaboratively to turn this into a detailed project specification following the format above. Focus on the PROBLEM and think through interesting ways of solving it.`;

    // Generate AI response
    const aiResponse = await generateWorkflowResponse({
      stepNumber: 2,
      userInput: { message, conversationContext },
      systemPrompt: fullPrompt
    });

    // Check for completion - Step 2 doesn't have an explicit completion question in the prompts
    // Look for comprehensive output that includes all major sections
    const hasStructuredOutput = aiResponse.text.includes('## Elevator Pitch') && 
                               aiResponse.text.includes('Features List') && 
                               aiResponse.text.includes('Initial tech suggested choices');
    
    const isComplete = hasStructuredOutput && (
      aiResponse.text.toLowerCase().includes('ready to proceed') ||
      aiResponse.text.toLowerCase().includes('complete') ||
      conversationContext.split('\n').length > 6 // After several rounds of conversation
    );
    
    let stepOutput = null;
    if (isComplete) {
      // Extract structured data according to component definitions
      stepOutput = {
        // "App Details" = Elevator Pitch + Problem Statement + Target Audience + USP
        appDetails: {
          elevatorPitch: "Extracted from conversation - refined elevator pitch",
          problemStatement: "Extracted from conversation - validated problem definition",
          targetAudience: "Extracted from conversation - specific user demographics",
          usp: "Extracted from conversation - unique selling proposition"
        },
        // "Features List" = All features from Priority sections with user stories and acceptance criteria
        featuresList: {
          mustHave: ["Core MVP features extracted from conversation"],
          shouldHave: ["Version 2 features extracted from conversation"],
          couldHave: ["Future features extracted from conversation"],
          featureCategories: ["Organized by category with acceptance criteria extracted from conversation"]
        },
        // "Tech Choices" = Frontend + Backend + Hosting + APIs (selections only, not rationale)
        techChoices: {
          frontend: "Recommended frontend technology",
          backend: "Recommended backend technology",
          hosting: "Recommended hosting platform",
          apis: "Recommended third-party tools/APIs"
        },
        uxUiConsiderations: ["Screen states", "interactions", "visual hierarchy extracted from conversation"],
        // "Core App Intent" = Problem Statement + Target Audience + Monetization + Scale Expectations
        coreAppIntent: {
          problemStatement: "From appDetails",
          targetAudience: "From appDetails", 
          monetization: "Revenue model extracted from conversation",
          scaleExpectations: "User base projections extracted from conversation"
        },
        conversationSummary: conversationContext + `\nuser: ${message}\nassistant: ${aiResponse.text}`,
        readyForNextStep: true
      };
    }

    // Save the conversation state
    await prisma.workflowResponse.upsert({
      where: {
        workflowId_stepId: {
          workflowId: projectWorkflow.id,
          stepId: 2
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
        stepId: 2,
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
    console.error('Step 2 chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}