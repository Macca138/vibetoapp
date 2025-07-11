import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { getWorkflowResponseData } from '@/lib/workflow/types';
import { z } from 'zod';

const Step7ClarifyInputSchema = z.object({
  projectId: z.string(),
  previousAnalysis: z.object({
    technicalSpecification: z.string(),
    components: z.any(),
    clarificationQuestions: z.array(z.any()),
    readyForNextStep: z.boolean(),
    confidenceScore: z.number().optional(),
    iterationNotes: z.array(z.string()).optional()
  }),
  userResponses: z.record(z.string()),
  originalInput: z.object({
    technicalRequirements: z.string(),
    architecturePreferences: z.string(),
    securityRequirements: z.string(),
    performanceNeeds: z.string(),
    integrationRequirements: z.string()
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
    const validatedData = Step7ClarifyInputSchema.parse(body);

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
          where: { stepId: { in: [1, 2, 3, 4, 5, 6] } }
        }
      }
    });

    const step1Data = projectWorkflow?.responses.find(r => r.stepId === 1);
    const step2Data = projectWorkflow?.responses.find(r => r.stepId === 2);
    const step3Data = projectWorkflow?.responses.find(r => r.stepId === 3);
    const step4Data = projectWorkflow?.responses.find(r => r.stepId === 4);
    const step5Data = projectWorkflow?.responses.find(r => r.stepId === 5);
    const step6Data = projectWorkflow?.responses.find(r => r.stepId === 6);

    // Extract specific components for context
    const step2ResponseData = getWorkflowResponseData(step2Data?.responses);
    const step3ResponseData = getWorkflowResponseData(step3Data?.responses);
    const step4ResponseData = getWorkflowResponseData(step4Data?.responses);
    const step5ResponseData = getWorkflowResponseData(step5Data?.responses);
    const step6ResponseData = getWorkflowResponseData(step6Data?.responses);
    const step2Analysis = step2ResponseData?.stepOutput;
    const step3Analysis = step3ResponseData?.stepOutput;
    const step4Analysis = step4ResponseData?.stepOutput;
    const step5Analysis = step5ResponseData?.stepOutput;
    const step6Analysis = step6ResponseData?.stepOutput;
    
    const projectRequest = step3Analysis?.systemArchitecture || 'Features list to be defined';
    const techStack = step2Analysis?.components?.techChoices || 'Tech stack to be defined';
    const appDesignSystem = step5Analysis?.designSystemStyleGuide || 'Design system to be defined';
    const appScreenStates = step6Analysis?.screenStatesSpecification || 'Screen states to be defined';

    // Format user responses for the prompt
    const responseText = Object.entries(validatedData.userResponses)
      .map(([questionId, response]) => `${questionId}: ${response}`)
      .join('\n');

    // Build the clarification system prompt
    const systemPrompt = `You are an expert software architect refining a comprehensive technical specification based on user clarifications.

PREVIOUS TECHNICAL SPECIFICATION:
${validatedData.previousAnalysis.technicalSpecification}

USER CLARIFICATION RESPONSES:
${responseText}

INSTRUCTIONS:
1. Integrate the user's clarification responses into the technical specification
2. Maintain the same markdown format as before with all required sections
3. Refine architecture, API specifications, security, or deployment details based on user feedback
4. Address any specific technical requirements or constraints mentioned
5. Ensure all sections are comprehensive and implementation-ready
6. Generate 1-2 NEW clarification questions if critical technical decisions still need input
7. Set readyForNextStep to true if the technical specification is comprehensive enough

You must return your response in this EXACT format:

# {Project Name} Technical Specification

## 1. Executive Summary
- Project overview and objectives
- Key technical decisions and rationale
- High-level architecture diagram
- Technology stack recommendations
- Estimated completion timeline: [Small/Medium/Large effort indicators]

## 2. System Architecture
### 2.1 Architecture Overview
- System components and their relationships
- Data flow diagrams
- Infrastructure requirements

### 2.2 Technology Stack
- Frontend technologies and frameworks
- Backend technologies and frameworks
- Database and storage solutions
- Third-party services and APIs

## 3. Feature Specifications
[Continue with detailed feature specifications...]

## 4. Data Architecture
[Continue with data models and storage...]

## 5. API Specifications
[Continue with internal and external APIs...]

## 6. Security & Privacy
[Continue with security and privacy measures...]

## 7. User Interface Specifications
[Continue with UI specifications...]

## 8. Infrastructure & Deployment
[Continue with infrastructure and deployment...]

## 9. Project Structure Guidelines
[Continue with project structure...]

Focus on implementation-ready details. Include specific API endpoints, data models, and component specifications. Avoid theoretical architecture discussions. Assume single developer using AI coding assistants.

CONTEXT:
<project_request>${projectRequest}</project_request>
<tech-stack>${techStack}</tech-stack>
<app-design-system>${appDesignSystem}</app-design-system>
<app-screen-states>${appScreenStates}</app-screen-states>`;

    const aiResponse = await generateWorkflowResponse({
      stepNumber: 7,
      userInput: {
        clarifications: validatedData.userResponses,
        previousTechnicalSpec: validatedData.previousAnalysis.technicalSpecification
      },
      previousStepsData: {
        step1: step1Data?.responses || null,
        step2: step2Analysis || null,
        step3: step3Analysis || null,
        step4: step4Analysis || null,
        step5: step5Analysis || null,
        step6: step6Analysis || null
      },
      systemPrompt: systemPrompt
    });

    // Process the refined analysis
    const markdownText = aiResponse.text;
    
    // Extract helper functions (reused from main route)
    function extractSection(text: string, sectionName: string) {
      const regex = new RegExp(`## ${sectionName}([\\s\\S]*?)(?=\\n## |$)`, 'i');
      const match = text.match(regex);
      return match ? match[1].trim() : '';
    }
    
    function extractSubsections(sectionText: string): any {
      const subsections: any = {};
      const subsectionRegex = /### ([\d\.\w\s]+)\n([\s\S]*?)(?=\n### |$)/g;
      let match;
      
      while ((match = subsectionRegex.exec(sectionText)) !== null) {
        const [, subsectionName, content] = match;
        subsections[subsectionName.trim()] = content.trim();
      }
      
      return subsections;
    }

    // Generate new clarification questions
    const clarificationQuestions = [];
    
    // Check if specific technical areas need refinement
    if (!markdownText.includes('testing') || markdownText.includes('Quality assurance')) {
      clarificationQuestions.push({
        id: 'testing-strategy',
        text: 'Should we add more detailed testing and quality assurance specifications?',
        type: 'choice' as const,
        required: false,
        options: [
          'Yes, add comprehensive testing strategy',
          'Focus on automated testing approaches',
          'Include performance testing requirements',
          'Current testing coverage is sufficient'
        ]
      });
    }

    // Ask about specific technology preferences if not detailed
    if (!markdownText.includes('monitoring') || markdownText.split('Infrastructure')[1]?.length < 200) {
      clarificationQuestions.push({
        id: 'monitoring-infrastructure',
        text: 'Should we add more detailed monitoring and infrastructure specifications?',
        type: 'choice' as const,
        required: false,
        options: [
          'Add comprehensive monitoring setup',
          'Focus on logging and alerting systems',
          'Include backup and disaster recovery',
          'Current infrastructure coverage is sufficient'
        ]
      });
    }

    const readyForNextStep = clarificationQuestions.length === 0 || markdownText.length > 2500;

    const refinedAnalysis = {
      technicalSpecification: markdownText,
      components: {
        systemArchitecture: extractSection(markdownText, '2. System Architecture'),
        featureSpecs: extractSection(markdownText, '3. Feature Specifications'),
        dataArchitecture: extractSection(markdownText, '4. Data Architecture'),
        apiSpecs: extractSection(markdownText, '5. API Specifications'),
        securitySpecs: extractSection(markdownText, '6. Security & Privacy'),
        deploymentSpecs: extractSection(markdownText, '8. Infrastructure & Deployment')
      },
      clarificationQuestions,
      readyForNextStep,
      confidenceScore: readyForNextStep ? 0.9 : 0.75,
      iterationNotes: [
        'Technical specification refined based on user clarifications',
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
            stepId: 7
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
          stepId: 7,
          responses: workflowData,
          completed: true,
          aiSuggestions: JSON.stringify(refinedAnalysis)
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: refinedAnalysis,
      message: 'Step 7 clarification completed successfully'
    });

  } catch (error) {
    console.error('Step 7 clarify API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process Step 7 clarification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}