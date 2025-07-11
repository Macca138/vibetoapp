import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { getWorkflowResponseData } from '@/lib/workflow/types';

// Step 9 System Prompt - Exact prompt from workflow_step_prompts.md
const STEP9_SYSTEM_PROMPT = `<goal> You are an AI-engineer tasked with breaking down a complicated technical specification into detailed steps that retain a high-degree of granularity based on the original specifications.
Your goal is to generate a highly-detailed, step-wise task plan that leaves no detail un-addressed.
Assume single developer using AI coding assistants. Break tasks into discrete, AI-friendly chunks with clear file modification boundaries.
You should pass-back-through your output several times to ensure no data is left out. </goal>

<thinking> [Wrap your thought process in thinking tags before generating the plan] </thinking> 

<format> ## Implementation Plan Overview **Estimated Timeline:** [Based on task complexity analysis] **Development Approach:** Single developer with AI coding assistants **Task Complexity Legend:** - 🟢 Small (1-2 hours) - 🟡 Medium (4-8 hours) - 🔴 Large (1-2 days)

[Section N]
[ ] Step 1: [Brief title] 🟢/🟡/🔴
Task: [Detailed explanation of what needs to be implemented]
Files: [Maximum of 15 files, ideally less]
path/to/file1.ts: [Description of changes]
Step Dependencies: [List of prerequisite steps]
User Instructions: [Any manual steps required]
UX/UI Considerations: [Critical UX elements to consider during implementation]
Validation: [How to verify this step is complete]

[Section N + 1]
[Section N + 2]
[Repeat for all steps]

Quality Assurance Steps
[ ] Code Review Checklist
[ ] Testing Strategy
[ ] Performance Validation
[ ] Security Review
[ ] Accessibility Testing </format>

<validation-requirements> After generating the initial plan, perform these validations:
Completeness Check: Verify all components from the tech specification are addressed
Dependency Analysis: Ensure logical step ordering and clear dependencies
Screen State Coverage: Confirm all screen states from Step 6 have corresponding implementation tasks
UX/UI Integration: Validate that design system components are properly implemented
File Modification Limits: Ensure no step modifies more than 15 files
If any validation fails, update the plan accordingly. </validation-requirements>

<warnings-and-guidelines> - You ARE allowed to mix backend and frontend steps together if it makes sense - Each step must not modify more than 15 files in a single run. If it does, you need to break it down further. - Always start with project setup and critical-path configurations - Try to make each new step contained, so that the app can be built and functional between tasks - Mark dependencies between steps clearly - Include UX/UI considerations for each implementation step - Focus on creating AI-friendly, discrete tasks </warnings-and-guidelines>

VALIDATION PROMPTS
First Validation
Evaluate your plan against the original tech specification. Update your output based on:
How well did you account for all pieces of the tech stack?
How well did you consider dependencies between steps?
How well did you account for the different STATES of each screen?
Second Validation
Check and ensure that you have covered all steps as per the original plan and that it is full, complete and accurate. Provide the fully complete implementation plan considering all initial requirements plus your self-feedback.
Third Validation
Look at each step of your task list and evaluate based on UX/UI design:
How well did you specify the UX/UI considerations?
How well did you consider different screen/feature states and how they change?
First evaluate yourself, then pass back through EACH STEP and add/update the UX/UI section with critical considerations for each step.`;

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

    // Get ALL previous steps data for complete project context
    const previousStepsData = await prisma.workflowResponse.findMany({
      where: {
        workflowId: projectId,
        stepId: { in: [1, 2, 3, 4, 5, 6, 7, 8] }
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
    const step7ResponseData = getWorkflowResponseData(previousStepsData.find(step => step.stepId === 7)?.responses);
    const step8ResponseData = getWorkflowResponseData(previousStepsData.find(step => step.stepId === 8)?.responses);
    
    const step2Output = step2ResponseData?.stepOutput || {};
    const step7Output = step7ResponseData?.stepOutput || {};
    const step8Output = step8ResponseData?.stepOutput || {};
    
    const techSpecification = step7Output.technicalSpecification || {};
    const projectRules = step8Output.developmentRules || {};
    const coreAppIntent = step2Output.coreAppIntent || {};
    
    const fullPrompt = `${STEP9_SYSTEM_PROMPT}

<context>
<data-flow-note>
The INSERT HERE placeholders represent automatic data transfer from previous steps. The system will populate these sections with:
- User inputs from previous steps
- AI-generated outputs that have been user-validated
- Component data from Steps 2-8

This ensures consistency and reduces user effort while maintaining the validation checkpoints at each step.
</data-flow-note>

<tech-specification> ${JSON.stringify(techSpecification, null, 2)} </tech-specification> 

<project-rules> ${JSON.stringify(projectRules, null, 2)} </project-rules> 

<core-app-intent> ${JSON.stringify(coreAppIntent, null, 2)} </core-app-intent> 
</context>

CONVERSATION CONTEXT:
${conversationContext}

USER MESSAGE: ${message}

Break down the complicated technical specification into detailed steps that retain a high-degree of granularity. Generate a highly-detailed, step-wise task plan that leaves no detail un-addressed. Focus on discrete, AI-friendly chunks with clear file modification boundaries.`;

    // Generate AI response
    const aiResponse = await generateWorkflowResponse({
      stepNumber: 9,
      userInput: { message, conversationContext },
      systemPrompt: fullPrompt
    });

    // Check for completion - Step 9 looks for comprehensive implementation plan
    const hasStructuredOutput = aiResponse.text.includes('Implementation Plan Overview') && 
                               aiResponse.text.includes('Task Complexity Legend') && 
                               (aiResponse.text.includes('🟢') || aiResponse.text.includes('🟡') || aiResponse.text.includes('🔴'));
    
    const isComplete = hasStructuredOutput && (
      aiResponse.text.toLowerCase().includes('quality assurance steps') ||
      aiResponse.text.toLowerCase().includes('validation') ||
      aiResponse.text.toLowerCase().includes('ready to begin development') ||
      conversationContext.split('\n').length > 4 // After several rounds of conversation
    );
    
    let stepOutput = null;
    if (isComplete) {
      // Extract structured data according to agent-handoff-specification.md
      stepOutput = {
        implementationPlan: {
          taskBreakdown: [
            {
              phase: "Development phase extracted from conversation",
              tasks: ["Specific implementation tasks extracted from conversation"],
              estimatedTime: "Development time estimate extracted from conversation",
              dependencies: ["Task dependencies extracted from conversation"],
              skillsRequired: ["Technical skills needed extracted from conversation"]
            }
          ],
          timeline: "Realistic development schedule extracted from conversation",
          milestones: "Key project milestones extracted from conversation"
        },
        projectDocumentation: {
          finalSpecification: "Complete project specification from all previous steps",
          developerHandoff: "Developer-ready documentation extracted from conversation",
          businessDocuments: "Business planning documents from workflow",
          implementationGuide: "Step-by-step development guide extracted from conversation"
        },
        deliverables: {
          exportFormats: ["PDF", "Developer Docs", "Business Plan"],
          implementationGuide: "Granular development guide extracted from conversation"
        },
        conversationSummary: conversationContext + `\nuser: ${message}\nassistant: ${aiResponse.text}`,
        readyForNextStep: true,
        workflowCompleted: true
      };
    }

    // First, ensure ProjectWorkflow exists
    const projectWorkflow = await prisma.projectWorkflow.upsert({
      where: { projectId },
      update: {},
      create: {
        projectId,
        currentStep: 9,
        isCompleted: false
      }
    });

    // Save the conversation state
    await prisma.workflowResponse.upsert({
      where: {
        workflowId_stepId: {
          workflowId: projectWorkflow.id,
          stepId: 9
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
        stepId: 9,
        responses: {
          conversation: conversationContext + `\nuser: ${message}\nassistant: ${aiResponse.text}`,
          stepOutput: stepOutput
        },
        completed: isComplete
      }
    });

    // If Step 9 is complete, mark the entire workflow as completed
    if (isComplete) {
      await prisma.projectWorkflow.update({
        where: { id: projectWorkflow.id },
        data: {
          isCompleted: true,
          completedAt: new Date()
        }
      });
    }

    return NextResponse.json({
      message: aiResponse.text,
      stepComplete: isComplete,
      stepOutput: stepOutput,
      workflowCompleted: isComplete
    });

  } catch (error) {
    console.error('Step 9 chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}