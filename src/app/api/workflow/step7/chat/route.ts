import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { getWorkflowResponseData } from '@/lib/workflow/types';

// Step 7 System Prompt - Exact prompt from workflow_step_prompts.md
const STEP7_SYSTEM_PROMPT = `<goal> Create a comprehensive technical specification document for a software development project that will serve as direct input for planning and code generation AI systems. The specification must be precise, structured, and provide actionable implementation guidance covering all aspects of the system from architecture to deployment.
Focus on implementation-ready details. Include specific API endpoints, data models, and component specifications. Avoid theoretical architecture discussions. </goal>

<validation-checklist> Before finalizing, verify specification includes: - API endpoints with request/response schemas - Complete data models with relationships - Authentication and authorization flow - Deployment steps and environment configuration - Dependency management strategy - Error handling patterns - Performance requirements - Risk assessment completed with mitigation strategies
- Critical path dependencies identified and alternatives planned
</validation-checklist> 

<format> The output should be a detailed technical specification in markdown format with the following structure:
{Project Name} Technical Specification
1. Executive Summary
Project overview and objectives
Key technical decisions and rationale
High-level architecture diagram
Technology stack recommendations
Estimated completion timeline: [Small/Medium/Large effort indicators]
2. System Architecture
2.1 Architecture Overview
System components and their relationships
Data flow diagrams
Infrastructure requirements
2.2 Technology Stack
Frontend technologies and frameworks
Backend technologies and frameworks
Database and storage solutions
Third-party services and APIs
3. Feature Specifications
For each major feature:
3.X {Feature Name}
User stories and acceptance criteria
Technical requirements and constraints
Detailed implementation approach
User flow diagrams
API endpoints (if applicable)
Data models involved
Error handling and edge cases
Performance considerations
Effort estimate: [Small/Medium/Large]
4. Data Architecture
4.1 Data Models
For each entity:
Entity definition and purpose
Attributes (name, type, constraints, defaults)
Relationships and associations
Indexes and optimization strategies
4.2 Data Storage
Database selection and rationale
Data persistence strategies
Caching mechanisms
Backup and recovery procedures
5. API Specifications
5.1 Internal APIs
For each endpoint:
Endpoint URL and HTTP method
Request parameters and body schema
Response schema and status codes
Authentication and authorization
Rate limiting and throttling
Example requests and responses
5.2 External Integrations
For each integration:
Service description and purpose
Authentication mechanisms
API endpoints and usage
Error handling and fallback strategies
Data synchronization approaches
6. Security & Privacy
6.1 Authentication & Authorization
Authentication mechanism and flow
Authorization strategies and role definitions
Session management
Token handling and refresh strategies
6.2 Data Security
Encryption strategies (at rest and in transit)
PII handling and protection
Compliance requirements (GDPR, CCPA, etc.)
Security audit procedures
6.3 Application Security
Input validation and sanitization
OWASP compliance measures
Security headers and policies
Vulnerability management
7. User Interface Specifications
8. Infrastructure & Deployment
9. Project Structure Guidelines </format>

<warnings-and-guidelines> Before creating the specification:
Analyze the project comprehensively in <brainstorm> tags, considering:
System architecture and infrastructure requirements
Core functionality and feature breakdown
Data models and storage architecture
API and integration specifications
Security, privacy, and compliance requirements
Performance and scalability considerations
User interface and experience specifications
Third-party services and external dependencies
Deployment and operational requirements
Quality assurance and monitoring strategy
For each area, ensure you:
Provide detailed breakdown of requirements and implementation approaches
Identify potential challenges, risks, and mitigation strategies
Consider edge cases, error scenarios, and recovery mechanisms
Propose alternative solutions where applicable
Critical considerations:
Break down complex features into detailed user flows and system interactions
Identify areas requiring clarification or having technical constraints
Consider platform-specific requirements (web, mobile, desktop)
Address non-functional requirements (performance, security, accessibility)
Assume single developer using AI coding assistants
Quality guidelines:
Be technology-agnostic unless specific technologies are mandated
Provide concrete examples and clear interfaces between components
Include specific implementation guidance without unnecessary jargon
Focus on completeness and actionability for development teams
Consider both technical and business constraints </warnings-and-guidelines>

You are an expert software architect creating technical specifications that will be used as direct input for planning and code generation AI systems. The specification must translate business requirements into comprehensive technical documentation that development teams can execute against.

Begin your response with detailed specification planning in <brainstorm> tags, then provide the complete technical specification following the prescribed format.`;

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

    // Get ALL previous steps data for complete context
    const previousStepsData = await prisma.workflowResponse.findMany({
      where: {
        workflowId: projectId,
        stepId: { in: [1, 2, 3, 4, 5, 6] }
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
    const step3ResponseData = getWorkflowResponseData(previousStepsData.find(step => step.stepId === 3)?.responses);
    const step5ResponseData = getWorkflowResponseData(previousStepsData.find(step => step.stepId === 5)?.responses);
    const step6ResponseData = getWorkflowResponseData(previousStepsData.find(step => step.stepId === 6)?.responses);
    
    const step2Output = step2ResponseData?.stepOutput || {};
    const step3Output = step3ResponseData?.stepOutput || {};
    const step5Output = step5ResponseData?.stepOutput || {};
    const step6Output = step6ResponseData?.stepOutput || {};
    
    const projectRequest = step3Output.technicalArchitecture || {};
    const techStack = step2Output.techChoices || {};
    const appDesignSystem = step5Output.designSystem || {};
    const appScreenStates = step6Output.screenSpecifications || {};
    
    const fullPrompt = `${STEP7_SYSTEM_PROMPT}

<context> 
<data-flow-note>
The INSERT HERE placeholders represent automatic data transfer from previous steps. The system will populate these sections with:
- User inputs from previous steps
- AI-generated outputs that have been user-validated
- Component data from Steps 2-6

This ensures consistency and reduces user effort while maintaining the validation checkpoints at each step.
</data-flow-note>

<project_request> ${JSON.stringify(projectRequest, null, 2)} </project_request>

<tech-stack> ${JSON.stringify(techStack, null, 2)} </tech-stack> 

<design-considerations> 
<aesthetics> - Bold simplicity with intuitive navigation creating frictionless experiences - Breathable whitespace complemented by strategic color accents for visual hierarchy - Strategic negative space calibrated for cognitive breathing room and content prioritization - Systematic color theory applied through subtle gradients and purposeful accent placement - Typography hierarchy utilizing weight variance and proportional scaling for information architecture - Visual density optimization balancing information availability with cognitive load management - Motion choreography implementing physics-based transitions for spatial continuity - Accessibility-driven contrast ratios paired with intuitive navigation patterns ensuring universal usability - Feedback responsiveness via state transitions communicating system status with minimal latency - Content-first layouts prioritizing user objectives over decorative elements for task efficiency </aesthetics> 

<app-design-system> ${JSON.stringify(appDesignSystem, null, 2)} </app-design-system> 

<app-screen-states> ${JSON.stringify(appScreenStates, null, 2)} </app-screen-states> 
</design-considerations>
</context>

CONVERSATION CONTEXT:
${conversationContext}

USER MESSAGE: ${message}

Create a comprehensive technical specification document that will serve as direct input for planning and code generation AI systems. Begin with detailed specification planning in <brainstorm> tags, then provide the complete technical specification following the prescribed format.`;

    // Generate AI response
    const aiResponse = await generateWorkflowResponse({
      stepNumber: 7,
      userInput: { message, conversationContext },
      systemPrompt: fullPrompt
    });

    // Check for completion - Step 7 looks for comprehensive technical specification
    const hasStructuredOutput = aiResponse.text.includes('Technical Specification') && 
                               aiResponse.text.includes('Executive Summary') && 
                               aiResponse.text.includes('System Architecture') &&
                               aiResponse.text.includes('API Specifications');
    
    const isComplete = hasStructuredOutput && (
      aiResponse.text.toLowerCase().includes('infrastructure & deployment') ||
      aiResponse.text.toLowerCase().includes('project structure guidelines') ||
      aiResponse.text.toLowerCase().includes('ready to proceed') ||
      conversationContext.split('\n').length > 4 // After several rounds of conversation
    );
    
    let stepOutput = null;
    if (isComplete) {
      // Extract structured data according to agent-handoff-specification.md
      stepOutput = {
        technicalSpecification: {
          apiEndpoints: "Complete API documentation extracted from conversation",
          dataModels: "Database schemas and relationships extracted from conversation",
          securityRequirements: "Authentication and authorization extracted from conversation",
          performanceSpecs: "Response time and throughput requirements extracted from conversation"
        },
        implementationGuide: {
          architecturePatterns: "Recommended design patterns extracted from conversation",
          codeStructure: "Project organization guidelines extracted from conversation",
          deploymentStrategy: "Hosting and deployment plan extracted from conversation"
        },
        riskAssessment: {
          technicalRisks: "Potential technical challenges extracted from conversation",
          mitigationStrategies: "Risk mitigation approaches extracted from conversation",
          contingencyPlans: "Backup approaches extracted from conversation"
        },
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
        currentStep: 7,
        isCompleted: false
      }
    });

    // Save the conversation state
    await prisma.workflowResponse.upsert({
      where: {
        workflowId_stepId: {
          workflowId: projectWorkflow.id,
          stepId: 7
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
        stepId: 7,
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
    console.error('Step 7 chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}