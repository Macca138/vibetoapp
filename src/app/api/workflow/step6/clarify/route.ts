import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { getWorkflowResponseData } from '@/lib/workflow/types';
import { z } from 'zod';

const Step6ClarifyInputSchema = z.object({
  projectId: z.string(),
  previousAnalysis: z.object({
    screenStatesSpecification: z.string(),
    components: z.any(),
    clarificationQuestions: z.array(z.any()),
    readyForNextStep: z.boolean(),
    confidenceScore: z.number().optional(),
    iterationNotes: z.array(z.string()).optional()
  }),
  userResponses: z.record(z.string()),
  originalInput: z.object({
    priorityFeatures: z.string(),
    userFlowDetails: z.string(),
    interactionPatterns: z.string(),
    responsiveRequirements: z.string()
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
    const validatedData = Step6ClarifyInputSchema.parse(body);

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
          where: { stepId: { in: [1, 2, 3, 4, 5] } }
        }
      }
    });

    const step1Data = projectWorkflow?.responses.find(r => r.stepId === 1);
    const step2Data = projectWorkflow?.responses.find(r => r.stepId === 2);
    const step3Data = projectWorkflow?.responses.find(r => r.stepId === 3);
    const step4Data = projectWorkflow?.responses.find(r => r.stepId === 4);
    const step5Data = projectWorkflow?.responses.find(r => r.stepId === 5);

    // Extract specific components for context
    const step2ResponseData = getWorkflowResponseData(step2Data?.responses);
    const step4ResponseData = getWorkflowResponseData(step4Data?.responses);
    const step5ResponseData = getWorkflowResponseData(step5Data?.responses);
    const step2Analysis = step2ResponseData?.stepOutput;
    const step4Analysis = step4ResponseData?.stepOutput;
    const step5Analysis = step5ResponseData?.stepOutput;
    
    const appOverview = step2Analysis?.components?.appDetails || 'App details to be defined';
    const featureList = step4Analysis?.featureStoriesAndFlows || 'Feature stories to be defined';
    const styleGuide = step5Analysis?.designSystemStyleGuide || 'Design system to be defined';

    // Format user responses for the prompt
    const responseText = Object.entries(validatedData.userResponses)
      .map(([questionId, response]) => `${questionId}: ${response}`)
      .join('\n');

    // Build the clarification system prompt
    const systemPrompt = `You are an industry-veteran SaaS product designer. You are refining screen states specification based on user clarifications.

PREVIOUS SCREEN STATES SPECIFICATION:
${validatedData.previousAnalysis.screenStatesSpecification}

USER CLARIFICATION RESPONSES:
${responseText}

INSTRUCTIONS:
1. Integrate the user's clarification responses into the screen states specification
2. Maintain the same markdown format as before with feature -> screen -> state hierarchy
3. Refine interaction patterns, animations, or responsive behaviors based on user feedback
4. Address any accessibility or error state requirements mentioned
5. Ensure all screen states are comprehensive and detailed
6. Generate 1-2 NEW clarification questions if critical design decisions still need input
7. Set readyForNextStep to true if the screen states specification is comprehensive enough

You must return your response in this EXACT format:

## Feature Name
### Screen X
#### Screen X State N
* description
* of
* UI & UX
* in detail
* including animations
* any anything else
* and colors based on the style-guide below

**Responsive Considerations**
Mobile (320-768px): [Key adaptations]
Tablet (768-1024px): [Layout changes]
Desktop (1024px+): [Enhanced features]

#### Screen X State N+1
[Repeat for as many states as needed based on the function]

### Screen Y
[Continue for all screens in the feature]

Design Guidelines to Follow:
- Bold simplicity with intuitive navigation creating frictionless experiences
- Breathable whitespace complemented by strategic color accents for visual hierarchy
- Strategic negative space calibrated for cognitive breathing room and content prioritization
- Systematic color theory applied through subtle gradients and purposeful accent placement
- Typography hierarchy utilizing weight variance and proportional scaling for information architecture
- Visual density optimization balancing information availability with cognitive load management
- Motion choreography implementing physics-based transitions for spatial continuity
- Accessibility-driven contrast ratios paired with intuitive navigation patterns ensuring universal usability
- Feedback responsiveness via state transitions communicating system status with minimal latency
- Content-first layouts prioritizing user objectives over decorative elements for task efficiency

CONTEXT:
<app-overview>${appOverview}</app-overview>
<feature-list>${featureList}</feature-list>
<style-guide>${styleGuide}</style-guide>`;

    const aiResponse = await generateWorkflowResponse({
      stepNumber: 6,
      userInput: {
        clarifications: validatedData.userResponses,
        previousScreenStates: validatedData.previousAnalysis.screenStatesSpecification
      },
      previousStepsData: {
        step1: step1Data?.responses || null,
        step2: step2Analysis || null,
        step3: step3Data?.responses || null,
        step4: step4Analysis || null,
        step5: step5Analysis || null
      },
      systemPrompt: systemPrompt
    });

    // Process the refined analysis
    const markdownText = aiResponse.text;
    
    // Extract helper functions (reused from main route)
    function extractFeatureSections(text: string): any {
      const features: any = {};
      const featureRegex = /## (.+?)\n([\s\S]*?)(?=\n## |$)/g;
      let match;
      
      while ((match = featureRegex.exec(text)) !== null) {
        const [, featureName, content] = match;
        features[featureName.trim()] = {
          screens: extractScreens(content),
          rawContent: content.trim()
        };
      }
      
      return features;
    }
    
    function extractScreens(content: string): any {
      const screens: any = {};
      const screenRegex = /### (.+?)\n([\s\S]*?)(?=\n### |$)/g;
      let match;
      
      while ((match = screenRegex.exec(content)) !== null) {
        const [, screenName, screenContent] = match;
        screens[screenName.trim()] = {
          states: extractStates(screenContent),
          rawContent: screenContent.trim()
        };
      }
      
      return screens;
    }
    
    function extractStates(content: string): any {
      const states: any = {};
      const stateRegex = /#### (.+?)\n([\s\S]*?)(?=\n#### |\n\*\*Responsive Considerations\*\*|$)/g;
      let match;
      
      while ((match = stateRegex.exec(content)) !== null) {
        const [, stateName, stateContent] = match;
        const responsiveMatch = content.match(/\*\*Responsive Considerations\*\*\n([\s\S]*?)(?=\n#### |$)/);
        
        states[stateName.trim()] = {
          description: stateContent.trim(),
          responsiveConsiderations: responsiveMatch ? responsiveMatch[1].trim() : ''
        };
      }
      
      return states;
    }

    // Generate new clarification questions
    const clarificationQuestions = [];
    
    // Check if specific design elements need refinement
    if (!markdownText.includes('loading') || markdownText.includes('skeleton')) {
      clarificationQuestions.push({
        id: 'loading-states',
        text: 'Should we add more detailed loading and skeleton states?',
        type: 'choice' as const,
        required: false,
        options: [
          'Yes, add comprehensive loading states',
          'Focus on skeleton screens',
          'Add progressive loading indicators',
          'Current loading states are sufficient'
        ]
      });
    }

    // Ask about advanced interactions if not detailed
    if (!markdownText.includes('gesture') || markdownText.split('animation')[1]?.length < 100) {
      clarificationQuestions.push({
        id: 'advanced-interactions',
        text: 'Should we add more advanced interaction patterns?',
        type: 'choice' as const,
        required: false,
        options: [
          'Add gesture-based interactions',
          'Enhanced keyboard navigation',
          'Advanced animation sequences',
          'Current interactions are sufficient'
        ]
      });
    }

    const readyForNextStep = clarificationQuestions.length === 0 || markdownText.length > 1500;

    const refinedAnalysis = {
      screenStatesSpecification: markdownText,
      components: {
        featureScreens: extractFeatureSections(markdownText),
        stateDefinitions: extractStates(markdownText),
        responsiveSpecs: markdownText.includes('Responsive Considerations'),
        interactionSpecs: markdownText.includes('animation') || markdownText.includes('transition')
      },
      clarificationQuestions,
      readyForNextStep,
      confidenceScore: readyForNextStep ? 0.9 : 0.75,
      iterationNotes: [
        'Screen states specification refined based on user clarifications',
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
            stepId: 6
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
          stepId: 6,
          responses: workflowData,
          completed: true,
          aiSuggestions: JSON.stringify(refinedAnalysis)
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: refinedAnalysis,
      message: 'Step 6 clarification completed successfully'
    });

  } catch (error) {
    console.error('Step 6 clarify API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process Step 6 clarification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}