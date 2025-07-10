import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { STEP3_SYSTEM_PROMPT } from '@/lib/prompts/step3Prompts';
import { z } from 'zod';

const Step3InputSchema = z.object({
  projectId: z.string(),
  primaryAudience: z.string().min(20, 'Primary audience description must be at least 20 characters').max(300),
  userProblems: z.string().min(20, 'User problems description must be at least 20 characters').max(500),
  userBehavior: z.string().max(400),
  demographics: z.string().max(300),
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
    const validatedData = Step3InputSchema.parse(body);

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

    // Prepare context from previous steps
    const step1Data = projectWorkflow?.responses.find(r => r.stepId === 1);
    const step2Data = projectWorkflow?.responses.find(r => r.stepId === 2);
    const previousStepsData = {
      step1: step1Data?.responses || null,
      step2: step2Data?.responses || null
    };

    // Generate AI response with previous steps context
    const aiResponse = await generateWorkflowResponse({
      stepNumber: 3,
      userInput: {
        primaryAudience: validatedData.primaryAudience,
        userProblems: validatedData.userProblems,
        userBehavior: validatedData.userBehavior,
        demographics: validatedData.demographics
      },
      previousStepsData,
      systemPrompt: STEP3_SYSTEM_PROMPT
    });

    // Parse AI response as JSON
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiResponse.text);
    } catch {
      // If JSON parsing fails, create a structured fallback
      aiAnalysis = {
        userPersonas: [
          {
            name: "Primary User",
            demographic: {
              age: "Age analysis needed",
              occupation: "Occupation analysis needed", 
              income: "Income analysis needed",
              location: "Location analysis needed",
              techComfort: "Medium"
            },
            psychographics: {
              values: ["Value analysis needed"],
              lifestyle: "Lifestyle analysis needed",
              personalityTraits: ["Trait analysis needed"],
              socialBehavior: "Social behavior analysis needed"
            },
            painPoints: [
              validatedData.userProblems,
              "Additional pain points need research"
            ],
            goals: [
              "Primary goal analysis needed",
              "Secondary goal analysis needed"
            ],
            behaviors: {
              currentSolutions: validatedData.userBehavior || "Current behavior analysis needed",
              decisionFactors: ["Decision factor analysis needed"],
              informationSources: "Information source analysis needed",
              purchasePatterns: "Purchase pattern analysis needed"
            },
            appUsage: {
              useFrequency: "Frequency analysis needed",
              primaryUseCase: "Use case analysis needed",
              featurePriorities: ["Feature priority analysis needed"],
              adoptionBarriers: ["Barrier analysis needed"]
            },
            marketingInsights: {
              reachChannels: ["Channel analysis needed"],
              messagingThatResonates: "Messaging analysis needed",
              priceSensitivity: "Medium",
              referralLikelihood: "Medium"
            }
          }
        ],
        userJourneyInsights: {
          commonJourneySteps: [
            "Journey analysis needed"
          ],
          criticalMoments: [
            "Critical moment analysis needed"
          ],
          dropOffPoints: [
            "Drop-off analysis needed"
          ],
          engagementTriggers: [
            "Engagement trigger analysis needed"
          ]
        },
        segmentationStrategy: {
          primarySegment: {
            name: validatedData.primaryAudience,
            size: "Segment size analysis needed",
            acquisitionStrategy: "Acquisition strategy analysis needed",
            retentionStrategy: "Retention strategy analysis needed"
          },
          secondarySegments: [
            {
              name: "Secondary segment analysis needed",
              opportunity: "Opportunity analysis needed",
              approach: "Approach analysis needed"
            }
          ]
        },
        researchRecommendations: {
          validationMethods: [
            "Conduct user interviews with target audience",
            "Survey existing users of similar apps",
            "Observe user behavior in natural settings"
          ],
          recruitmentStrategies: [
            "Social media targeting based on interests",
            "Partner with relevant communities",
            "Incentivize with early access or rewards"
          ],
          keyQuestionsToValidate: [
            "Do users actually experience the pain points we identified?",
            "Would our proposed solution address their needs effectively?",
            "What would motivate them to switch from current solutions?"
          ]
        },
        rawAiResponse: aiResponse.text
      };
    }

    // Save or update workflow step data
    const workflowData = {
      userInput: validatedData,
      aiAnalysis,
      completedAt: new Date(),
      status: 'completed' as const
    };

    // First, ensure ProjectWorkflow exists
    const projectWorkflowRecord = await prisma.projectWorkflow.upsert({
      where: {
        projectId: validatedData.projectId
      },
      update: {
        currentStep: Math.max(3, 3), // Keep current step at least at 3
        updatedAt: new Date()
      },
      create: {
        projectId: validatedData.projectId,
        currentStep: 3,
        startedAt: new Date()
      }
    });

    // Then upsert the WorkflowResponse
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
        aiSuggestions: JSON.stringify(aiAnalysis),
        updatedAt: new Date()
      },
      create: {
        workflowId: projectWorkflowRecord.id,
        stepId: 3,
        responses: workflowData,
        completed: true,
        aiSuggestions: JSON.stringify(aiAnalysis)
      }
    });

    return NextResponse.json({
      success: true,
      data: aiAnalysis,
      message: 'Step 3 completed successfully'
    });

  } catch (error) {
    console.error('Step 3 API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process Step 3', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}