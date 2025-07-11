import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { getWorkflowResponseData } from '@/lib/workflow/types';
import { z } from 'zod';

const Step8ClarifyInputSchema = z.object({
  projectId: z.string(),
  previousAnalysis: z.object({
    developmentRulesSpecification: z.string(),
    components: z.any(),
    clarificationQuestions: z.array(z.any()),
    readyForNextStep: z.boolean(),
    confidenceScore: z.number().optional(),
    iterationNotes: z.array(z.string()).optional()
  }),
  userResponses: z.record(z.string()),
  originalInput: z.object({
    useAutomaticRules: z.boolean(),
    customDevelopmentStandards: z.string(),
    additionalRequirements: z.string(),
    codingStandards: z.string(),
    testingRequirements: z.string()
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
    const validatedData = Step8ClarifyInputSchema.parse(body);

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
          where: { stepId: { in: [1, 2, 3, 4, 5, 6, 7] } }
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

    // Extract specific components for context
    const step2ResponseData = getWorkflowResponseData(step2Data?.responses);
    const step7ResponseData = getWorkflowResponseData(step7Data?.responses);
    const step2Analysis = step2ResponseData?.stepOutput;
    const step7Analysis = step7ResponseData?.stepOutput;
    
    const techStack = step2Analysis?.components?.techChoices || 'Tech stack to be defined';
    const technicalSpecification = step7Analysis?.technicalSpecification || 'Technical specification to be defined';

    // Format user responses for the prompt
    const responseText = Object.entries(validatedData.userResponses)
      .map(([questionId, response]) => `${questionId}: ${response}`)
      .join('\n');

    // Build the clarification system prompt
    const systemPrompt = `You are a senior software development consultant refining development rules and standards based on user clarifications.

PREVIOUS DEVELOPMENT RULES & STANDARDS:
${validatedData.previousAnalysis.developmentRulesSpecification}

USER CLARIFICATION RESPONSES:
${responseText}

INSTRUCTIONS:
1. Integrate the user's clarification responses into the development rules and standards
2. Maintain the same markdown format as before with all required sections
3. Refine testing standards, CI/CD procedures, or code quality tools based on user feedback
4. Address any specific development workflow or tooling requirements mentioned
5. Ensure all development standards are comprehensive and actionable
6. Generate 1-2 NEW clarification questions if critical development decisions still need input
7. Set readyForNextStep to true if the development rules are comprehensive enough

You must return your response in this EXACT format:

## Development Rules & Standards Integration

### Tech Stack Best Practices
[Updated best practices for the chosen tech stack]

### Coding Standards
- File naming conventions
- Code organization patterns
- Variable and function naming
- Comment and documentation standards
- Code formatting rules

### Project Structure Guidelines
- Directory structure
- Feature-based vs layer-based organization
- Shared code organization
- Configuration file placement

### Testing Standards
- Unit testing requirements
- Integration testing approach
- End-to-end testing strategy
- Code coverage targets
- Testing file organization

### Code Quality & Linting
- ESLint/TSLint configuration
- Prettier formatting rules
- Pre-commit hooks
- Code review checklist

### Development Workflow
- Git workflow and branching strategy
- Commit message conventions
- Pull request guidelines
- Code review process

### Build & Deployment Standards
- Build script organization
- Environment configuration
- CI/CD pipeline requirements
- Deployment procedures

### Documentation Requirements
- README structure
- API documentation standards
- Code documentation requirements
- Architecture decision records

### Security Standards
- Security linting rules
- Environment variable handling
- Dependency security scanning
- Authentication best practices

### Performance Standards
- Performance monitoring setup
- Bundle size limitations
- Loading time targets
- Optimization guidelines

### Conflict Resolution
[Updated conflict resolution if any new conflicts arise]

Focus on actionable, technology-specific development standards that can be immediately implemented.

CONTEXT:
<tech-stack>${techStack}</tech-stack>
<technical-specification>${technicalSpecification}</technical-specification>`;

    const aiResponse = await generateWorkflowResponse({
      stepNumber: 8,
      userInput: {
        clarifications: validatedData.userResponses,
        previousDevelopmentRules: validatedData.previousAnalysis.developmentRulesSpecification
      },
      previousStepsData: {
        step1: step1Data?.responses || null,
        step2: step2Analysis || null,
        step3: step3Data?.responses || null,
        step4: step4Data?.responses || null,
        step5: step5Data?.responses || null,
        step6: step6Data?.responses || null,
        step7: step7Analysis || null
      },
      systemPrompt: systemPrompt
    });

    // Process the refined analysis
    const markdownText = aiResponse.text;
    
    // Extract helper functions (reused from main route)
    function extractSection(text: string, sectionName: string) {
      const regex = new RegExp(`### ${sectionName}([\\s\\S]*?)(?=\\n### |$)`, 'i');
      const match = text.match(regex);
      return match ? match[1].trim() : '';
    }

    // Generate new clarification questions
    const clarificationQuestions = [];
    
    // Check if specific development areas need refinement
    if (!markdownText.includes('documentation') || markdownText.includes('Documentation Requirements')) {
      clarificationQuestions.push({
        id: 'documentation-standards',
        text: 'Should we add more specific documentation standards and requirements?',
        type: 'choice' as const,
        required: false,
        options: [
          'Yes, add comprehensive documentation requirements',
          'Focus on API documentation standards',
          'Include code comment guidelines',
          'Current documentation standards are sufficient'
        ]
      });
    }

    // Ask about performance monitoring if not detailed
    if (!markdownText.includes('monitoring') || markdownText.split('Performance')[1]?.length < 100) {
      clarificationQuestions.push({
        id: 'performance-monitoring',
        text: 'Should we add more detailed performance monitoring and optimization standards?',
        type: 'choice' as const,
        required: false,
        options: [
          'Add comprehensive performance monitoring setup',
          'Focus on bundle size and optimization rules',
          'Include performance testing in CI/CD',
          'Current performance standards are sufficient'
        ]
      });
    }

    const readyForNextStep = clarificationQuestions.length === 0 || markdownText.length > 1500;

    const refinedAnalysis = {
      developmentRulesSpecification: markdownText,
      components: {
        techStackRules: extractSection(markdownText, 'Tech Stack Best Practices'),
        codingStandards: extractSection(markdownText, 'Coding Standards'),
        testingStandards: extractSection(markdownText, 'Testing Standards'),
        projectStructure: extractSection(markdownText, 'Project Structure Guidelines')
      },
      clarificationQuestions,
      readyForNextStep,
      confidenceScore: readyForNextStep ? 0.9 : 0.75,
      iterationNotes: [
        'Development rules and standards refined based on user clarifications',
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
            stepId: 8
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
          stepId: 8,
          responses: workflowData,
          completed: true,
          aiSuggestions: JSON.stringify(refinedAnalysis)
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: refinedAnalysis,
      message: 'Step 8 clarification completed successfully'
    });

  } catch (error) {
    console.error('Step 8 clarify API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process Step 8 clarification', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}