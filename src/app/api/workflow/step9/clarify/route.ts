import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { getWorkflowResponseData } from '@/lib/workflow/types';
import { z } from 'zod';

const Step9ClarifyInputSchema = z.object({
  projectId: z.string(),
  previousAnalysis: z.object({
    implementationPlan: z.string(),
    components: z.any(),
    clarificationQuestions: z.array(z.any()),
    readyForNextStep: z.boolean(),
    confidenceScore: z.number().optional(),
    iterationNotes: z.array(z.string()).optional()
  }),
  userResponses: z.record(z.string()),
  originalInput: z.object({
    developmentApproach: z.string(),
    timelinePreferences: z.string(),
    taskGranularity: z.string(),
    priorityFocus: z.string(),
    implementationConstraints: z.string()
  }).optional()
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
    const validatedData = Step9ClarifyInputSchema.parse(body);

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

    // Get previous steps data for context
    const projectWorkflow = await prisma.projectWorkflow.findFirst({
      where: { projectId: validatedData.projectId },
      include: {
        responses: {
          where: { stepId: { in: [1, 2, 3, 4, 5, 6, 7, 8] } }
        }
      }
    });

    const step1Data = projectWorkflow?.responses.find(r => r.stepId === 1);
    const step2Data = projectWorkflow?.responses.find(r => r.stepId === 2);
    const step3Data = projectWorkflow?.responses.find(r => r.stepId === 3);
    const step4Data = projectWorkflow?.responses.find(r => r.stepId === 4);
    const step5Data = projectWorkflow?.responses.find(r => r.stepId === 5);
    const step6Data = projectWorkflow?.responses.find(r => r.stepId === 6);
    const step7Data = projectWorkflow?.responses.find(r => r.stepId === 7);
    const step8Data = projectWorkflow?.responses.find(r => r.stepId === 8);

    // Extract all previous steps data for comprehensive context
    const step2ResponseData = getWorkflowResponseData(step2Data?.responses);
    const step3ResponseData = getWorkflowResponseData(step3Data?.responses);
    const step4ResponseData = getWorkflowResponseData(step4Data?.responses);
    const step5ResponseData = getWorkflowResponseData(step5Data?.responses);
    const step6ResponseData = getWorkflowResponseData(step6Data?.responses);
    const step7ResponseData = getWorkflowResponseData(step7Data?.responses);
    const step8ResponseData = getWorkflowResponseData(step8Data?.responses);
    const step2Analysis = step2ResponseData?.stepOutput;
    const step3Analysis = step3ResponseData?.stepOutput;
    const step4Analysis = step4ResponseData?.stepOutput;
    const step5Analysis = step5ResponseData?.stepOutput;
    const step6Analysis = step6ResponseData?.stepOutput;
    const step7Analysis = step7ResponseData?.stepOutput;
    const step8Analysis = step8ResponseData?.stepOutput;

    // Format user responses for the prompt
    const responseText = Object.entries(validatedData.userResponses)
      .map(([questionId, response]) => `${questionId}: ${response}`)
      .join('\n');

    // Build the clarification system prompt
    const systemPrompt = `You are an AI-engineer refining a detailed implementation plan based on user clarifications.

PREVIOUS IMPLEMENTATION PLAN:
${validatedData.previousAnalysis.implementationPlan}

USER CLARIFICATION RESPONSES:
${responseText}

INSTRUCTIONS:
1. Integrate the user's clarification responses into the implementation plan
2. Maintain the same markdown format as before with phases, steps, and task complexity
3. Refine task granularity, testing approach, or implementation ordering based on user feedback
4. Address any specific development preferences or constraints mentioned
5. Ensure all tasks remain AI-friendly with clear file modification boundaries
6. Generate 1-2 NEW clarification questions if critical implementation decisions still need input
7. Set readyForNextStep to true (this is the final step)

You must return your response in this EXACT format:

## Implementation Plan Overview
**Estimated Timeline:** [Updated based on task complexity analysis]
**Development Approach:** Single developer with AI coding assistants
**Task Complexity Legend:**
- 🟢 Small (1-2 hours)
- 🟡 Medium (4-8 hours) 
- 🔴 Large (1-2 days)

## Phase 1: Project Setup & Foundation
### [ ] Step 1: [Brief title] 🟢/🟡/🔴
**Task:** [Updated detailed explanation of what needs to be implemented]
**Files:** [Maximum of 15 files, ideally less]
- path/to/file1.ts: [Description of changes]
**Step Dependencies:** [List of prerequisite steps]
**User Instructions:** [Any manual steps required]
**UX/UI Considerations:** [Critical UX elements to consider during implementation]
**Validation:** [How to verify this step is complete]

[Continue with all phases and steps...]

## Quality Assurance Steps
### [ ] Code Review Checklist
[Updated based on user feedback]

### [ ] Testing Strategy
[Updated based on user feedback]

### [ ] Performance Validation
[Updated validation steps]

### [ ] Security Review
[Updated security review steps]

### [ ] Accessibility Testing
[Updated accessibility testing steps]

Guidelines:
- Focus on creating AI-friendly, discrete tasks
- Ensure no step modifies more than 15 files
- Include clear dependencies between steps
- Address user feedback on task granularity and approach

CONTEXT:
<technical-specification>${step7Analysis?.technicalSpecification || 'Technical specification to be defined'}</technical-specification>
<development-rules>${step8Analysis?.developmentRulesSpecification || 'Development rules to be defined'}</development-rules>
<screen-states>${step6Analysis?.screenStatesSpecification || 'Screen states to be defined'}</screen-states>
<design-system>${step5Analysis?.designSystemStyleGuide || 'Design system to be defined'}</design-system>
<feature-stories>${step4Analysis?.featureStoriesAndFlows || 'Feature stories to be defined'}</feature-stories>`;

    const aiResponse = await generateWorkflowResponse({
      stepNumber: 9,
      userInput: {
        clarifications: validatedData.userResponses,
        previousImplementationPlan: validatedData.previousAnalysis.implementationPlan
      },
      previousStepsData: {
        step1: step1Data?.responses || null,
        step2: step2Analysis || null,
        step3: step3Analysis || null,
        step4: step4Analysis || null,
        step5: step5Analysis || null,
        step6: step6Analysis || null,
        step7: step7Analysis || null,
        step8: step8Analysis || null
      },
      systemPrompt: systemPrompt
    });

    // Process the refined analysis
    const markdownText = aiResponse.text;
    
    // Extract helper functions (reused from main route)
    function extractPhases(text: string): any {
      const phases: any = {};
      const phaseRegex = /## (Phase \d+:.*?)\n([\s\S]*?)(?=\n## |$)/g;
      let match;
      
      while ((match = phaseRegex.exec(text)) !== null) {
        const [, phaseName, content] = match;
        phases[phaseName.trim()] = {
          steps: extractSteps(content),
          rawContent: content.trim()
        };
      }
      
      return phases;
    }
    
    function extractSteps(content: string): any {
      const steps: any = {};
      const stepRegex = /### \[ \] (.+?)\n([\s\S]*?)(?=\n### |\n## |$)/g;
      let match;
      
      while ((match = stepRegex.exec(content)) !== null) {
        const [, stepTitle, stepContent] = match;
        const complexityMatch = stepTitle.match(/(🟢|🟡|🔴)/);
        const complexity = complexityMatch ? complexityMatch[1] : '🟡';
        
        steps[stepTitle.trim()] = {
          content: stepContent.trim(),
          complexity: complexity,
          files: extractFiles(stepContent),
          dependencies: extractDependencies(stepContent)
        };
      }
      
      return steps;
    }
    
    function extractFiles(content: string): string[] {
      const fileMatches = content.match(/- ([^:]+\.\w+):/g);
      return fileMatches ? fileMatches.map(match => match.replace(/^- /, '').replace(/:$/, '')) : [];
    }
    
    function extractDependencies(content: string): string[] {
      const depMatch = content.match(/\*\*Step Dependencies:\*\* (.+)/i);
      return depMatch ? depMatch[1].split(',').map(dep => dep.trim()) : [];
    }

    // Generate new clarification questions (minimal as this is final step)
    const clarificationQuestions = [];
    
    // Only ask if major refinements are still needed
    if (markdownText.length < 2000) {
      clarificationQuestions.push({
        id: 'plan-completeness',
        text: 'Should we add more detail to any specific phases of the implementation plan?',
        type: 'choice' as const,
        required: false,
        options: [
          'Add more detail to project setup phase',
          'Expand testing and quality assurance steps',
          'Include more deployment and DevOps tasks',
          'Current level of detail is sufficient'
        ]
      });
    }

    const readyForNextStep = true; // Always ready as this is the final step

    const refinedAnalysis = {
      implementationPlan: markdownText,
      components: {
        taskBreakdown: extractPhases(markdownText),
        timeline: markdownText.includes('Timeline:') ? markdownText.match(/\*\*Estimated Timeline:\*\* (.+)/)?.[1] : 'To be determined',
        dependencies: extractDependencies(markdownText),
        qualityAssurance: markdownText.includes('Quality Assurance')
      },
      clarificationQuestions,
      readyForNextStep,
      confidenceScore: 0.95,
      iterationNotes: [
        'Implementation plan refined based on user clarifications',
        ...Object.keys(validatedData.userResponses).map(key => `Enhanced: ${key}`)
      ]
    };

    // Save the refined data
    const workflowData = {
      userInput: validatedData.originalInput,
      stepOutput: refinedAnalysis,
      clarificationResponses: validatedData.userResponses,
      completedAt: new Date(),
      status: 'completed' as const
    };

    // Update the workflow response and mark as completed
    const projectWorkflowRecord = await prisma.projectWorkflow.findFirst({
      where: { projectId: validatedData.projectId }
    });

    if (projectWorkflowRecord) {
      // Update the workflow as completed
      await prisma.projectWorkflow.update({
        where: { id: projectWorkflowRecord.id },
        data: {
          currentStep: 9,
          isCompleted: true,
          completedAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Update the step response
      await prisma.workflowResponse.upsert({
        where: {
          workflowId_stepId: {
            workflowId: projectWorkflowRecord.id,
            stepId: 9
          }
        },
        update: {
          responses: workflowData,
          completed: true,
          aiSuggestions: JSON.stringify(refinedAnalysis),
          updatedAt: new Date()
        },
        create: {
          workflowId: projectWorkflowRecord.id,
          stepId: 9,
          responses: workflowData,
          completed: true,
          aiSuggestions: JSON.stringify(refinedAnalysis)
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: refinedAnalysis,
      message: 'Step 9 clarification completed successfully - Workflow fully complete!'
    });

  } catch (error) {
    console.error('Step 9 clarify API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process Step 9 clarification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}