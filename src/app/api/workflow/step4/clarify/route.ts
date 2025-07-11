import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { getWorkflowResponseData } from '@/lib/workflow/types';
import { z } from 'zod';

const Step4ClarifyInputSchema = z.object({
  projectId: z.string(),
  previousAnalysis: z.object({
    featureStoriesAndFlows: z.string(),
    components: z.any(),
    clarificationQuestions: z.array(z.any()),
    readyForNextStep: z.boolean(),
    confidenceScore: z.number().optional(),
    iterationNotes: z.array(z.string()).optional()
  }),
  userResponses: z.record(z.string()),
  originalInput: z.object({
    userPersonas: z.string(),
    userJourneys: z.string(),
    featurePriorities: z.string()
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
    const validatedData = Step4ClarifyInputSchema.parse(body);

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
          where: { stepId: { in: [1, 2, 3] } }
        }
      }
    });

    const step1Data = projectWorkflow?.responses.find(r => r.stepId === 1);
    const step2Data = projectWorkflow?.responses.find(r => r.stepId === 2);
    const step3Data = projectWorkflow?.responses.find(r => r.stepId === 3);

    // Extract specific components for context
    const step2ResponseData = getWorkflowResponseData(step2Data?.responses);
    const step3ResponseData = getWorkflowResponseData(step3Data?.responses);
    const step2Analysis = step2ResponseData?.stepOutput;
    const step3Analysis = step3ResponseData?.stepOutput;
    
    const featuresList = step3Analysis?.components?.mvpFeatures || step2Analysis?.components?.featuresList || 'Features to be defined';
    const appDetails = step2Analysis?.components?.appDetails || 'App details to be defined';
    const technicalArchitecture = step3Analysis?.technicalArchitecture || 'Technical architecture to be defined';

    // Format user responses for the prompt
    const responseText = Object.entries(validatedData.userResponses)
      .map(([questionId, response]) => `${questionId}: ${response}`)
      .join('\n');

    // Build the clarification system prompt
    const systemPrompt = `You're an experienced SaaS Founder with a background in Product Design & Product Management that obsesses about product and solving peoples problems. You are refining feature stories and UX flows based on user clarifications.

PREVIOUS FEATURE STORIES & UX FLOWS:
${validatedData.previousAnalysis.featureStoriesAndFlows}

USER CLARIFICATION RESPONSES:
${responseText}

INSTRUCTIONS:
1. Integrate the user's clarification responses into the feature stories and UX flows
2. Maintain the same markdown format as before
3. Enhance user stories with more detail based on user responses
4. Improve UX flow descriptions with specific user interactions
5. Address any technical complexity considerations mentioned
6. Generate 1-2 NEW clarification questions if critical UX details still need input
7. Set readyForNextStep to true if the feature stories and flows are comprehensive enough

You must return your response in this EXACT markdown format:

## Features List

### Feature Category

#### Feature
- [] [User Stories]
- [] [List personas and their user stories. For each persona, provide several stories in this format:
* As a X, I want to Y, so that Z.]

**Technical Complexity Flags**
[] [Real-time data requirements]
[] [Offline sync needs] 
[] [Complex calculations]
[] [Third-party integrations]
[] [Other technical considerations]

**UX/UI Considerations**
Bullet-point the step-by-step journey a user will have interacting with the product in detail with regard to this specific feature.
[] [Core Experience]
[] [Description of different "states" of that screen]
[] [How it handles state changes visually]
[] [Animations, information architecture, progressive disclosure, visual hierarchy, etc]
[] [Advanced Users & Edge Cases]
[] [Description of different "states" of that screen]
[] [How it handles state changes visually]
[] [Animations, information architecture, progressive disclosure, visual hierarchy, etc]

**Validation Steps**
After generating user stories, perform these validations:
- Review user stories against the technical architecture from Step 3. Flag any stories that require capabilities not covered in the current architecture.
- Ensure all user stories align with the approved Features List from Step 2.
- Check that technical complexity flags are addressed in the architecture.

Follow these UX design principles:
- Bold simplicity with intuitive navigation creating frictionless experiences
- Breathable whitespace complemented by strategic color accents for visual hierarchy
- Strategic negative space calibrated for cognitive breathing room and content prioritization
- Content-first layouts prioritizing user objectives over decorative elements for task efficiency

CONTEXT:
<features-list>${featuresList}</features-list>
<app-details>${appDetails}</app-details>
<technical-architecture>${technicalArchitecture}</technical-architecture>`;

    const aiResponse = await generateWorkflowResponse({
      stepNumber: 4,
      userInput: {
        clarifications: validatedData.userResponses,
        previousFeatureStories: validatedData.previousAnalysis.featureStoriesAndFlows
      },
      previousStepsData: {
        step1: step1Data?.responses || null,
        step2: step2Analysis || null,
        step3: step3Analysis || null
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

    // Generate new clarification questions
    const clarificationQuestions = [];
    
    // Check if we need more specific UX details
    const userStoriesCount = (markdownText.match(/\* As a/g) || []).length;
    if (userStoriesCount < 5) {
      clarificationQuestions.push({
        id: 'more-user-stories',
        text: 'Can you provide additional user stories for edge cases or advanced user scenarios?',
        type: 'textarea' as const,
        required: false,
        placeholder: 'As a [persona], I want to [action], so that [benefit]...',
        minLength: 30
      });
    }

    // Ask about specific interaction patterns if needed
    if (!markdownText.includes('interaction') && !markdownText.includes('gesture') && !markdownText.includes('animation')) {
      clarificationQuestions.push({
        id: 'interaction-patterns',
        text: 'Are there any specific interaction patterns or micro-interactions that are important for user experience?',
        type: 'textarea' as const,
        required: false,
        placeholder: 'Describe specific gestures, animations, transitions, or interactive elements...',
        minLength: 20
      });
    }

    const readyForNextStep = clarificationQuestions.length === 0 || markdownText.length > 1500;

    const refinedAnalysis = {
      featureStoriesAndFlows: markdownText,
      components: {
        userStories: extractSection(markdownText, 'Features List'),
        uxFlows: extractSection(markdownText, 'UX/UI Considerations'),
        technicalComplexity: extractSection(markdownText, 'Technical Complexity Flags'),
        featureValidation: extractSection(markdownText, 'Validation Steps')
      },
      clarificationQuestions,
      readyForNextStep,
      confidenceScore: readyForNextStep ? 0.9 : 0.75,
      iterationNotes: [
        'Feature stories and UX flows refined based on user clarifications',
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

    // Update the workflow response
    const projectWorkflowRecord = await prisma.projectWorkflow.findFirst({
      where: { projectId: validatedData.projectId }
    });

    if (projectWorkflowRecord) {
      await prisma.workflowResponse.upsert({
        where: {
          workflowId_stepId: {
            workflowId: projectWorkflowRecord.id,
            stepId: 4
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
          stepId: 4,
          responses: workflowData,
          completed: true,
          aiSuggestions: JSON.stringify(refinedAnalysis)
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: refinedAnalysis,
      message: 'Step 4 clarification completed successfully'
    });

  } catch (error) {
    console.error('Step 4 clarify API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process Step 4 clarification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}