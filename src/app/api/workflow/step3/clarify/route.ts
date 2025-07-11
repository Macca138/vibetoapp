import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { getWorkflowResponseData } from '@/lib/workflow/types';
import { z } from 'zod';

const Step3ClarifyInputSchema = z.object({
  projectId: z.string(),
  previousAnalysis: z.object({
    technicalArchitecture: z.string(),
    systemDiagram: z.string().optional(),
    components: z.any(),
    clarificationQuestions: z.array(z.any()),
    readyForNextStep: z.boolean(),
    confidenceScore: z.number().optional(),
    iterationNotes: z.array(z.string()).optional()
  }),
  userResponses: z.record(z.string()),
  originalInput: z.object({
    technicalRequirements: z.string(),
    scalabilityNeeds: z.string(),
    performanceExpectations: z.string()
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
    const validatedData = Step3ClarifyInputSchema.parse(body);

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
      where: {
        projectId: validatedData.projectId
      },
      include: {
        responses: {
          where: {
            stepId: { in: [1, 2] }
          }
        }
      }
    });

    // Extract context from previous steps
    const step1Data = projectWorkflow?.responses.find(r => r.stepId === 1);
    const step2Data = projectWorkflow?.responses.find(r => r.stepId === 2);
    const step2ResponseData = getWorkflowResponseData(step2Data?.responses);
    const step2Analysis = step2ResponseData?.stepOutput;
    
    const featuresList = step2Analysis?.components?.featuresList || 'Features to be defined';
    const techChoices = step2Analysis?.components?.techChoices || 'Tech stack to be defined';
    const scaleExpectations = step2Analysis?.components?.scaleExpectations || 'Scale expectations to be defined';
    const appDetails = step2Analysis?.components?.appDetails || 'App details to be defined';

    // Format user responses for the prompt
    const responseText = Object.entries(validatedData.userResponses)
      .map(([questionId, response]) => `${questionId}: ${response}`)
      .join('\n');

    // Build the clarification system prompt
    const systemPrompt = `I'd like for you to help me refine the technical architecture of my application based on user clarifications. You should act like a Senior Software Engineer that has extensive experience developing, and building architecture for large scale web applications.

PREVIOUS TECHNICAL ARCHITECTURE:
${validatedData.previousAnalysis.technicalArchitecture}

USER CLARIFICATION RESPONSES:
${responseText}

INSTRUCTIONS:
1. Integrate the user's clarification responses into the technical architecture
2. Maintain the same markdown format as before
3. Enhance the architecture based on the user's responses
4. Update the system diagram if architectural changes are needed
5. Address any technical concerns raised in the clarifications
6. Generate 1-2 NEW clarification questions if critical architectural decisions still need input
7. Set readyForNextStep to true if the architecture is comprehensive enough

You must return your response in this EXACT markdown format:

## Features (MVP)

### Feature Name
2-3 sentence summary of what the feature is or does

**Tech Involved**
Main Technologies Involved w/ Feature

**Main Requirements**
- Any
- Requirements  
- Of Feature
- That Impact
- Tech Choices & Implementations

## System Diagram
\`\`\`mermaid
graph TB
    A[User Interface] --> B[API Gateway]
    B --> C[Authentication Service]
    B --> D[Core Application Logic]
    D --> E[Database]
    D --> F[External APIs]
\`\`\`

## Scalability Considerations
Based on the scale expectations from Step 2:
- [Performance requirements for expected user base]
- [Geographic distribution implications]  
- [Peak usage handling strategies]

## List of Technical/Architecture Consideration Questions
- [Architecture question 1]
- [Architecture question 2]
- [Architecture question 3]

Focus on implementation-ready architectural decisions. Consider both current MVP needs and future scalability. Ensure architecture aligns with chosen technology stack.

CONTEXT:
- Features List: ${featuresList}
- Current Tech Choices: ${techChoices}
- Scale Expectations: ${scaleExpectations}
- App Details: ${appDetails}`;

    const aiResponse = await generateWorkflowResponse({
      stepNumber: 3,
      userInput: {
        clarifications: validatedData.userResponses,
        previousArchitecture: validatedData.previousAnalysis.technicalArchitecture
      },
      previousStepsData: {
        step1: step1Data?.responses || null,
        step2: step2Analysis || null
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

    function extractMermaidDiagram(text: string): string {
      const mermaidRegex = /```mermaid([\s\S]*?)```/i;
      const match = text.match(mermaidRegex);
      return match ? match[1].trim() : '';
    }

    // Generate new clarification questions
    const clarificationQuestions = [];
    
    const architectureQuestions = extractListItems(extractSection(markdownText, 'List of Technical/Architecture Consideration Questions'));
    if (architectureQuestions.length > 0) {
      architectureQuestions.slice(0, 2).forEach((question, index) => {
        clarificationQuestions.push({
          id: `refined-architecture-${index + 1}`,
          text: question,
          type: 'textarea' as const,
          required: false,
          placeholder: 'Please provide more details...',
          minLength: 20
        });
      });
    }

    const readyForNextStep = clarificationQuestions.length === 0 || markdownText.length > 1500;

    const refinedAnalysis = {
      technicalArchitecture: markdownText,
      systemDiagram: extractMermaidDiagram(markdownText),
      components: {
        mvpFeatures: extractSection(markdownText, 'Features (MVP)'),
        techStack: techChoices,
        scalabilityConsiderations: extractSection(markdownText, 'Scalability Considerations'),
        architectureDecisions: extractSection(markdownText, 'List of Technical/Architecture Consideration Questions')
      },
      clarificationQuestions,
      readyForNextStep,
      confidenceScore: readyForNextStep ? 0.9 : 0.75,
      iterationNotes: [
        'Technical architecture refined based on user clarifications',
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
            stepId: 3
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
          stepId: 3,
          responses: workflowData,
          completed: true,
          aiSuggestions: JSON.stringify(refinedAnalysis)
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: refinedAnalysis,
      message: 'Step 3 clarification completed successfully'
    });

  } catch (error) {
    console.error('Step 3 clarify API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process Step 3 clarification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}