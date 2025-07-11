import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { getWorkflowResponseData } from '@/lib/workflow/types';
import { z } from 'zod';

const Step5ClarifyInputSchema = z.object({
  projectId: z.string(),
  previousAnalysis: z.object({
    designSystemStyleGuide: z.string(),
    components: z.any(),
    clarificationQuestions: z.array(z.any()),
    readyForNextStep: z.boolean(),
    confidenceScore: z.number().optional(),
    iterationNotes: z.array(z.string()).optional()
  }),
  userResponses: z.record(z.string()),
  originalInput: z.object({
    designInspiration: z.string(),
    colorPreferences: z.string(),
    brandPersonality: z.string(),
    platformTargets: z.string()
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
    const validatedData = Step5ClarifyInputSchema.parse(body);

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
          where: { stepId: { in: [1, 2, 3, 4] } }
        }
      }
    });

    const step1Data = projectWorkflow?.responses.find(r => r.stepId === 1);
    const step2Data = projectWorkflow?.responses.find(r => r.stepId === 2);
    const step3Data = projectWorkflow?.responses.find(r => r.stepId === 3);
    const step4Data = projectWorkflow?.responses.find(r => r.stepId === 4);

    // Extract specific components for context
    const step2ResponseData = getWorkflowResponseData(step2Data?.responses);
    const step4ResponseData = getWorkflowResponseData(step4Data?.responses);
    const step2Analysis = step2ResponseData?.stepOutput;
    const step4Analysis = step4ResponseData?.stepOutput;
    
    const appOverview = step2Analysis?.components?.appDetails || 'App details to be defined';
    const targetPlatform = step2Analysis?.components?.techChoices || validatedData.originalInput?.platformTargets || 'Web';
    const targetAudience = step2Analysis?.businessSpecification || 'Target audience to be defined';
    const featureStories = step4Analysis?.featureStoriesAndFlows || 'Feature stories to be defined';

    // Format user responses for the prompt
    const responseText = Object.entries(validatedData.userResponses)
      .map(([questionId, response]) => `${questionId}: ${response}`)
      .join('\n');

    // Build the clarification system prompt
    const systemPrompt = `You are an industry-veteran SaaS product designer. You are refining a design system and style guide based on user clarifications.

PREVIOUS DESIGN SYSTEM & STYLE GUIDE:
${validatedData.previousAnalysis.designSystemStyleGuide}

USER CLARIFICATION RESPONSES:
${responseText}

INSTRUCTIONS:
1. Integrate the user's clarification responses into the design system and style guide
2. Maintain the same markdown format as before with all required sections
3. Refine colors, typography, components, or spacing based on user feedback
4. Address any accessibility or icon style preferences mentioned
5. Ensure platform-specific adaptations are updated if needed
6. Generate 1-2 NEW clarification questions if critical design decisions still need input
7. Set readyForNextStep to true if the design system is comprehensive enough

You must return your response in this EXACT format with all sections:

## **Color Palette**

### Primary Colors
[Updated primary colors based on user feedback]

### Secondary Colors
[Updated secondary colors]

### Accent Colors
[Updated accent colors]

### Functional Colors
[Updated functional colors]

### Background Colors
[Updated background colors]

## **Typography**

### Font Family
[Updated font recommendations]

### Font Weights
[Updated weight specifications]

### Text Styles
[Updated text style definitions]

## **Component Styling**

### Buttons
[Updated button specifications]

### Cards
[Updated card specifications]

### Input Fields
[Updated input field specifications]

### Icons
[Updated icon specifications based on user preferences]

## **Spacing System**
[Updated spacing definitions]

## **Motion & Animation**
[Updated animation specifications]

## **Platform-Specific Adaptations**
[Updated platform considerations]

## **Dark Mode Variants (if applicable)**
[Updated dark mode adaptations]

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
<target-platform>${targetPlatform}</target-platform>
<target-audience>${targetAudience}</target-audience>
<feature-stories>${featureStories}</feature-stories>`;

    const aiResponse = await generateWorkflowResponse({
      stepNumber: 5,
      userInput: {
        clarifications: validatedData.userResponses,
        previousDesignSystem: validatedData.previousAnalysis.designSystemStyleGuide
      },
      previousStepsData: {
        step1: step1Data?.responses || null,
        step2: step2Analysis || null,
        step3: step3Data?.responses || null,
        step4: step4Analysis || null
      },
      systemPrompt: systemPrompt
    });

    // Process the refined analysis
    const markdownText = aiResponse.text;
    
    // Extract helper functions (reused from main route)
    function extractSection(text: string, sectionName: string) {
      const regex = new RegExp(`## \\*\\*${sectionName}\\*\\*\\s*([\\s\\S]*?)(?=\\n## |$)`, 'i');
      const match = text.match(regex);
      return match ? match[1].trim() : '';
    }

    function extractColorPalette(text: string): any {
      const colorSection = extractSection(text, 'Color Palette');
      const colors: any = {};
      
      // Extract color definitions like "Primary White - #F8F9FA (description)"
      const colorRegex = /([A-Za-z\s]+)\s*-\s*(#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3})\s*\(([^)]+)\)/g;
      let match;
      while ((match = colorRegex.exec(colorSection)) !== null) {
        const [, name, hex, description] = match;
        colors[name.trim()] = { hex: hex.trim(), description: description.trim() };
      }
      
      return colors;
    }

    // Generate new clarification questions
    const clarificationQuestions = [];
    
    // Check if specific design elements need refinement
    if (!markdownText.includes('Dark Mode') || markdownText.includes('Dark Mode Variants (if applicable)')) {
      clarificationQuestions.push({
        id: 'dark-mode-support',
        text: 'Should we develop a comprehensive dark mode for your app?',
        type: 'choice' as const,
        required: false,
        options: [
          'Yes, full dark mode support',
          'Optional dark mode (user preference)',
          'No dark mode needed',
          'Maybe in the future'
        ]
      });
    }

    // Ask about animation preferences if not detailed
    if (!markdownText.includes('animation') || markdownText.split('Motion & Animation')[1]?.length < 100) {
      clarificationQuestions.push({
        id: 'animation-preferences',
        text: 'What level of animation and motion would you prefer?',
        type: 'choice' as const,
        required: false,
        options: [
          'Minimal and subtle (professional feel)',
          'Moderate with smooth transitions',
          'Rich and engaging (modern feel)',
          'Let the designer decide'
        ]
      });
    }

    const readyForNextStep = clarificationQuestions.length === 0 || markdownText.length > 2000;

    const refinedAnalysis = {
      designSystemStyleGuide: markdownText,
      components: {
        colorPalette: extractColorPalette(markdownText),
        typography: extractSection(markdownText, 'Typography'),
        componentStyling: extractSection(markdownText, 'Component Styling'),
        spacingSystem: extractSection(markdownText, 'Spacing System'),
        motionAnimation: extractSection(markdownText, 'Motion & Animation')
      },
      clarificationQuestions,
      readyForNextStep,
      confidenceScore: readyForNextStep ? 0.9 : 0.75,
      iterationNotes: [
        'Design system refined based on user clarifications',
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
            stepId: 5
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
          stepId: 5,
          responses: workflowData,
          completed: true,
          aiSuggestions: JSON.stringify(refinedAnalysis)
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: refinedAnalysis,
      message: 'Step 5 clarification completed successfully'
    });

  } catch (error) {
    console.error('Step 5 clarify API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process Step 5 clarification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}