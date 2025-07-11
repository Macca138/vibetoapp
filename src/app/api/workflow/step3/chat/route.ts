import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { getWorkflowResponseData } from '@/lib/workflow/types';

// Step 3 System Prompt - Exact prompt from workflow_step_prompts.md
const STEP3_SYSTEM_PROMPT = `<goal> I'd like for you to help me brainstorm the overall technical structure of my application on a high level. You should act like a Senior Software Engineer that has extensive experience developing, and building architecture for large scale web applications. You should ask me follow up questions as we proceed if you think it's necessary to gather a fuller picture. Any time I answer questions, you re-integrate the responses and generate a fully new output that integrates everything.

Before finalizing, review the proposed architecture against the chosen tech stack and identify any mismatches, proposing alternatives where necessary. </goal>

<format> Return your format in Markdown, without pre-text or post-text descriptions.

Features (MVP)
Feature Name
2-3 sentence summary of what the feature is or does
Tech Involved
Main Technologies Involved w/ Feature
Main Requirements
Any
Requirements
Of Feature
That Impact
Tech Choices & Implementations

System Diagram
An image detailing a full system diagram of the MVP. Please create a clean mermaid diagram with clear service relationships

Scalability Considerations
Based on the scale expectations from Step 2:
[Performance requirements for expected user base]
[Geographic distribution implications]
[Peak usage handling strategies]

List of Technical/Architecture Consideration Questions
list
of
Architecture
questions </format>

<validation-prompts> 
- Review the proposed architecture against the chosen tech stack [insert tech choices]. Identify any mismatches and propose alternatives. 
- Ensure the architecture supports the scale expectations defined in Step 2. 
- Verify that all MVP features have corresponding architectural components. 
</validation-prompts> 

<warnings-or-guidance> 
Focus on implementation-ready architectural decisions 
Consider both current MVP needs and future scalability 
Ensure architecture aligns with chosen technology stack 
</warnings-or-guidance>`;

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
        stepId: { in: [1, 2] }
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
    const techChoicesFromStep2 = step2Output.techChoices || {};
    const scaleExpectationsFromStep2 = step2Output.coreAppIntent?.scaleExpectations || {};
    
    const fullPrompt = `${STEP3_SYSTEM_PROMPT}

<context>
<data-flow-note>
The INSERT HERE placeholders represent automatic data transfer from previous steps. The system will populate these sections with:
- User inputs from previous steps
- AI-generated outputs that have been user-validated
- Component data as defined in Step 2's component-definitions section

This ensures consistency and reduces user effort while maintaining the validation checkpoints at each step.
</data-flow-note>

<features-list> ${JSON.stringify(featuresListFromStep2, null, 2)} </features-list> 

<current-tech-choices> ${JSON.stringify(techChoicesFromStep2, null, 2)} </current-tech-choices> 

<scale-expectations> ${JSON.stringify(scaleExpectationsFromStep2, null, 2)} </scale-expectations> 
</context>

CONVERSATION CONTEXT:
${conversationContext}

USER MESSAGE: ${message}

Help me brainstorm the overall technical structure of my application. Focus on creating implementation-ready architectural decisions that align with the features, tech choices, and scale expectations above.`;

    // Generate AI response
    const aiResponse = await generateWorkflowResponse({
      stepNumber: 3,
      userInput: { message, conversationContext },
      systemPrompt: fullPrompt
    });

    // Check for completion - Step 3 looks for structured output with required sections
    const hasStructuredOutput = aiResponse.text.includes('Features (MVP)') && 
                               aiResponse.text.includes('System Diagram') && 
                               aiResponse.text.includes('Scalability Considerations');
    
    const isComplete = hasStructuredOutput && (
      aiResponse.text.toLowerCase().includes('architecture questions') ||
      aiResponse.text.toLowerCase().includes('ready to proceed') ||
      conversationContext.split('\n').length > 4 // After several rounds of conversation
    );
    
    let stepOutput = null;
    if (isComplete) {
      // Extract structured data according to agent-handoff-specification.md
      stepOutput = {
        technicalArchitecture: {
          systemDiagram: "Architecture overview extracted from conversation",
          componentBreakdown: "System components extracted from conversation",
          dataFlow: "Information flow patterns extracted from conversation",
          scalabilityPlan: "Growth handling strategy extracted from conversation"
        },
        refinedTechChoices: {
          frontend: "Validated frontend choice from conversation",
          backend: "Validated backend choice from conversation",
          database: "Data storage solution from conversation",
          hosting: "Deployment platform from conversation",
          apis: "Integration requirements from conversation"
        },
        nonFunctionalRequirements: {
          performance: "Response time requirements from conversation",
          scalability: "User capacity planning from conversation",
          security: "Protection requirements from conversation"
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
        currentStep: 3,
        isCompleted: false
      }
    });

    // Save the conversation state
    await prisma.workflowResponse.upsert({
      where: {
        workflowId_stepId: {
          workflowId: projectWorkflow.id,
          stepId: 3
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
        stepId: 3,
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
    console.error('Step 3 chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}