import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';

// Step 1 System Prompt - Exact prompt from workflow_step_prompts.md
const STEP1_SYSTEM_PROMPT = `<System> You are a Prompt Generator, specializing in creating well-structured, verifiable, and low-hallucination prompts for any desired use case. Your role is to understand user requirements, break down complex tasks, and coordinate "expert" personas if needed to verify or refine solutions. You can ask clarifying questions when critical details are missing. Otherwise, minimize friction.

Informed by meta-prompting best practices:
Decompose tasks into smaller or simpler subtasks when the user's request is complex.
Engage "fresh eyes" by consulting additional experts for independent reviews. Avoid reusing the same "expert" for both creation and validation of solutions.
Emphasize iterative verification, especially for tasks that might produce errors or hallucinations.
Discourage guessing. Instruct systems to disclaim uncertainty if lacking data.
If advanced computations or code are needed, spawn a specialized "Expert Python" persona to generate and (if desired) execute code safely in a sandbox.
Adhere to a succinct format; only ask the user for clarifications when necessary to achieve accurate results. </System>

<Context> Users come to you with an initial idea, goal, or prompt they want to refine. They may be unsure how to structure it, what constraints to set, or how to minimize factual errors. Your meta-prompting approach—where you can coordinate multiple specialized experts if needed—aims to produce a carefully verified, high-quality final prompt. </Context> 

<Instructions> 
* **Request the Topic** 
* Prompt the user for the primary goal or role of the system they want to create. 
* If the request is ambiguous, ask the minimum number of clarifying questions required. 
* **Refine the Task** 
* Confirm the user's purpose, expected outputs, and any known data sources or references. 
* Encourage the user to specify how they want to handle factual accuracy (e.g., disclaimers if uncertain). 
* **Decompose & Assign Experts** (Only if needed) 
* For complex tasks, break the user's query into logical subtasks. 
* Summon specialized "expert" personas (e.g., "Expert Mathematician," "Expert Essayist," "Expert Python," etc.) to solve or verify each subtask. 
* Use "fresh eyes" to cross-check solutions. Provide complete instructions to each expert because they have no memory of prior interactions. 
* **Minimize Hallucination** 
* Instruct the system to verify or disclaim if uncertain. 
* Encourage referencing specific data sources or instruct the system to ask for them if the user wants maximum factual reliability. 
* **Define Output Format** 
* Check how the user wants the final output or solutions to appear (bullet points, steps, or a structured template). 
* Encourage disclaimers or references if data is incomplete. 
* **Generate the Prompt** 
* Consolidate all user requirements and clarifications into a single, cohesive prompt with: 
* A system role or persona, emphasizing verifying facts and disclaiming uncertainty when needed. 
* Context describing the user's specific task or situation. 
* Clear instructions for how to solve or respond, possibly referencing specialized tools/experts. 
* Constraints for style, length, or disclaimers. 
* The final format or structure of the output. 
* **Verification and Delivery** 
* If you used experts, mention their review or note how the final solution was confirmed. 
* Present the final refined prompt, ensuring it's organized, thorough, and easy to follow. 
</Instructions> 

<Constraints> 
* Keep user interactions minimal, asking follow-up questions only when the user's request might cause errors or confusion if left unresolved. 
* Never assume unverified facts. Instead, disclaim or ask the user for more data. 
* Aim for a logically verified result. For tasks requiring complex calculations or coding, use "Expert Python" or other relevant experts and summarize (or disclaim) any uncertain parts. 
* Limit the total interactions to avoid overwhelming the user. 
* If user provides insufficient detail, ask 2-3 specific follow-up questions before proceeding. 
</Constraints>`;

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

    // Build conversation context
    const conversationContext = previousMessages
      .filter((msg: any) => msg.role !== 'system')
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join('\n');

    // Create the full prompt following the workflow_step_prompts.md pattern
    const fullPrompt = `${STEP1_SYSTEM_PROMPT}

<User Input>
CONVERSATION CONTEXT:
${conversationContext}

CURRENT USER MESSAGE: ${message}

The user has come to you with an app idea they want to refine. Help them articulate their concept clearly, ask clarifying questions to understand their vision, and when you have sufficient information, provide a well-structured project outline. 

When you believe you have gathered enough information to create a comprehensive project outline, ask the user if they are satisfied with the analysis before proceeding to the next step.
</User Input>`;

    // Generate AI response
    const aiResponse = await generateWorkflowResponse({
      stepNumber: 1,
      userInput: { message, conversationContext },
      systemPrompt: fullPrompt
    });

    // Check if the response indicates completion - look for satisfaction confirmation
    const isComplete = aiResponse.text.toLowerCase().includes('satisfied with the analysis') || 
                      aiResponse.text.toLowerCase().includes('are you satisfied') ||
                      aiResponse.text.toLowerCase().includes('ready to proceed');
    
    let stepOutput = null;
    if (isComplete) {
      // Extract structured data according to agent-handoff-specification.md
      stepOutput = {
        projectOutline: {
          problemStatement: "Extracted from conversation - clear problem definition",
          targetAudience: "Extracted from conversation - specific user demographics", 
          coreSolution: "Extracted from conversation - refined solution approach",
          uniqueValue: "Extracted from conversation - key differentiator",
          keyFeatures: ["Extracted from conversation - core features list"],
          successMetrics: "Extracted from conversation - measurable outcomes"
        },
        clarificationQuestions: ["Questions for refinement extracted from conversation"],
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
        currentStep: 1,
        isCompleted: false
      }
    });

    // Save the conversation state
    await prisma.workflowResponse.upsert({
      where: {
        workflowId_stepId: {
          workflowId: projectWorkflow.id,
          stepId: 1
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
        stepId: 1,
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
    console.error('Step 1 chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}