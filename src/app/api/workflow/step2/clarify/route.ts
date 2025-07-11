import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { getWorkflowResponseData } from '@/lib/workflow/types';
import { z } from 'zod';

const Step2ClarifyInputSchema = z.object({
  projectId: z.string(),
  previousAnalysis: z.object({
    businessSpecification: z.string(),
    components: z.any(),
    clarificationQuestions: z.array(z.any()),
    readyForNextStep: z.boolean(),
    confidenceScore: z.number().optional(),
    iterationNotes: z.array(z.string()).optional()
  }),
  userResponses: z.record(z.string()),
  originalInput: z.object({
    valueProp: z.string(),
    uniqueness: z.string(),
    coreFeatures: z.string()
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
    const validatedData = Step2ClarifyInputSchema.parse(body);

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

    // Get Step 1 data for context
    const projectWorkflow = await prisma.projectWorkflow.findFirst({
      where: {
        projectId: validatedData.projectId
      },
      include: {
        responses: {
          where: {
            stepId: 1
          }
        }
      }
    });

    // Extract Step 1 outputs for data handoff
    const step1Data = getWorkflowResponseData(projectWorkflow?.responses[0]?.responses);
    const step1StepOutput = step1Data?.stepOutput;
    const projectOutline = step1StepOutput?.projectOutline;
    const refinedPrompt = step1StepOutput?.refinedPrompt;

    // Use the refined prompt from Step 1 if available
    const baseSystemPrompt = refinedPrompt?.system || 
      "You're an experienced SaaS Founder that obsesses about product and solving peoples problems. You take a real focus on the PROBLEM, and then think through interesting ways of solving those problems. Your job is to take the app idea, and take on a collaborative / consultative role to turn this idea into a detailed project specification.";

    // Extract context from Step 1
    const appIdea = projectOutline?.problemStatement || projectOutline?.coreSolution || 'App idea to be defined';
    const keyFeatures = projectOutline?.keyFeatures || [];
    const targetAudience = projectOutline?.targetAudience || 'Target audience to be defined';
    const uniqueValue = projectOutline?.uniqueValue || 'Unique value proposition to be defined';

    // Format user responses for the prompt
    const responseText = Object.entries(validatedData.userResponses)
      .map(([questionId, response]) => `${questionId}: ${response}`)
      .join('\n');

    // Build the clarification system prompt
    const systemPrompt = `${baseSystemPrompt}

You are refining a business specification based on user clarifications. Review the previous analysis and user responses, then generate an improved version.

PREVIOUS BUSINESS SPECIFICATION:
${validatedData.previousAnalysis.businessSpecification}

USER CLARIFICATION RESPONSES:
${responseText}

INSTRUCTIONS:
1. Integrate the user's clarification responses into the business specification
2. Maintain the same markdown format as before
3. Improve sections that the user provided clarification for
4. Add more detail and specificity based on the user's responses
5. Generate 1-2 NEW clarification questions if critical details are still missing
6. Set readyForNextStep to true if the specification is comprehensive enough

You must return your response in this EXACT markdown format:

## Elevator Pitch
[Updated elevator pitch incorporating user clarifications]

## Problem Statement
[Enhanced problem statement based on user input]

## Target Audience
[More detailed target audience description]

## USP
[Refined unique selling proposition]

## Target Platforms
[Specified platforms based on clarifications]

## Features List
[Updated comprehensive list of features]

## Feature Priority

### Must-Have (MVP)
- [ ] [Updated core features for launch]
- [ ] [Essential functionality based on clarifications]

### Should-Have (Version 2)
- [ ] [Important but not critical features]

### Could-Have (Future)
- [ ] [Nice to have features]

## Feature Category
- [ ] [Updated requirements as User Stories]
- [ ] [Sub-requirements or acceptance criteria]

## UX/UI Considerations
- [ ] [Updated screen or interaction details]
- [ ] [State management based on clarifications]
- [ ] [Visual hierarchy and user flow improvements]

## Initial tech suggested choices
- [ ] [Updated frontend recommendations]
- [ ] [Backend technology choices]
- [ ] [Hosting and infrastructure]
- [ ] [APIs and integrations needed]

## Non-Functional Requirements
- [ ] [Performance requirements based on scale]
- [ ] [Scalability considerations]
- [ ] [Security requirements]
- [ ] [Accessibility standards]

## Scale Expectations
**Expected user base:** [Updated based on user input]
**Geographic distribution:** [Refined geographic scope]
**Peak usage patterns:** [Updated usage patterns]

## Monetization
[Detailed monetization strategy based on user clarifications]

## Critical Questions or Clarifications
[List 1-2 remaining questions if any critical details are still missing]

CONTEXT FROM STEP 1:
- App Idea: "${appIdea}"
- Target Audience: "${targetAudience}"
- Unique Value: "${uniqueValue}"
- Key Features: ${JSON.stringify(keyFeatures)}

${refinedPrompt?.context ? `Additional Context: ${refinedPrompt.context}` : ''}
${refinedPrompt?.instructions ? `Additional Instructions: ${refinedPrompt.instructions}` : ''}`;

    const aiResponse = await generateWorkflowResponse({
      stepNumber: 2,
      userInput: {
        clarifications: validatedData.userResponses,
        previousAnalysis: validatedData.previousAnalysis.businessSpecification
      },
      previousStepsData: {
        step1: {
          projectOutline: projectOutline,
          refinedPrompt: refinedPrompt,
          appIdea: appIdea,
          keyFeatures: keyFeatures,
          targetAudience: targetAudience,
          uniqueValue: uniqueValue
        }
      },
      systemPrompt: systemPrompt
    });

    // Process the refined analysis
    const markdownText = aiResponse.text;
    
    // Extract helper functions (reused from main route)
    function extractSection(text: string, sectionName: string) {
      const regex = new RegExp(`## ${sectionName}\\s*([\\s\\S]*?)(?=\\n## |$)`, 'i');
      const match = text.match(regex);
      return match ? match[1].trim() : '';
    }

    function extractListItems(text: string): string[] {
      if (!text) return [];
      const lines = text.split('\n');
      const items = lines
        .filter(line => line.trim().match(/^[-*•]\s+|^\d+\.\s+/))
        .map(line => line.replace(/^[-*•]\s+|^\d+\.\s+/, '').trim())
        .filter(item => item.length > 0);
      
      return items.length > 0 ? items : [text.trim()];
    }

    function extractAppDetails(text: string) {
      const elevatorPitch = extractSection(text, 'Elevator Pitch');
      const problemStatement = extractSection(text, 'Problem Statement');
      const targetAudience = extractSection(text, 'Target Audience');
      const usp = extractSection(text, 'USP');
      
      return {
        elevatorPitch,
        problemStatement,
        targetAudience,
        usp
      };
    }

    function extractTechChoices(text: string) {
      const techSection = extractSection(text, 'Initial tech suggested choices');
      return techSection || 'Technology choices to be defined';
    }

    function extractFeaturesList(text: string) {
      const featuresSection = extractSection(text, 'Features List');
      const prioritySection = extractSection(text, 'Feature Priority');
      return {
        features: featuresSection,
        priority: prioritySection
      };
    }

    function extractScaleExpectations(text: string) {
      return extractSection(text, 'Scale Expectations');
    }

    // Generate new clarification questions
    const clarificationQuestions = [];
    
    const criticalQuestions = extractListItems(extractSection(markdownText, 'Critical Questions or Clarifications'));
    if (criticalQuestions.length > 0) {
      criticalQuestions.slice(0, 2).forEach((question, index) => {
        clarificationQuestions.push({
          id: `refined-clarification-${index + 1}`,
          text: question,
          type: 'textarea' as const,
          required: false,
          placeholder: 'Please provide more details...',
          minLength: 10
        });
      });
    }

    const readyForNextStep = clarificationQuestions.length === 0 || markdownText.length > 1500;

    const refinedAnalysis = {
      businessSpecification: markdownText,
      components: {
        appDetails: extractAppDetails(markdownText),
        techChoices: extractTechChoices(markdownText),
        featuresList: extractFeaturesList(markdownText),
        scaleExpectations: extractScaleExpectations(markdownText)
      },
      clarificationQuestions,
      readyForNextStep,
      confidenceScore: readyForNextStep ? 0.9 : 0.75,
      iterationNotes: [
        'Specification refined based on user clarifications',
        ...Object.keys(validatedData.userResponses).map(key => `Added details for: ${key}`)
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

    // Update the workflow response
    const projectWorkflowRecord = await prisma.projectWorkflow.findFirst({
      where: { projectId: validatedData.projectId }
    });

    if (projectWorkflowRecord) {
      await prisma.workflowResponse.upsert({
        where: {
          workflowId_stepId: {
            workflowId: projectWorkflowRecord.id,
            stepId: 2
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
          stepId: 2,
          responses: workflowData,
          completed: true,
          aiSuggestions: JSON.stringify(refinedAnalysis)
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: refinedAnalysis,
      message: 'Step 2 clarification completed successfully'
    });

  } catch (error) {
    console.error('Step 2 clarify API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process Step 2 clarification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}