import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { STEP4_SYSTEM_PROMPT } from '@/lib/prompts/step4Prompts';
import { z } from 'zod';

const Step4InputSchema = z.object({
  projectId: z.string(),
  mustHaveFeatures: z.string().min(20, 'Must-have features must be at least 20 characters').max(600),
  niceToHaveFeatures: z.string().max(600),
  advancedFeatures: z.string().max(600),
  integrations: z.string().max(400),
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
    const validatedData = Step4InputSchema.parse(body);

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
    const [step1Data, step2Data, step3Data] = await Promise.all([
      prisma.workflowStep.findFirst({
        where: { projectId: validatedData.projectId, stepNumber: 1 }
      }),
      prisma.workflowStep.findFirst({
        where: { projectId: validatedData.projectId, stepNumber: 2 }
      }),
      prisma.workflowStep.findFirst({
        where: { projectId: validatedData.projectId, stepNumber: 3 }
      })
    ]);

    // Prepare context from previous steps
    const previousStepsData = {
      step1: step1Data?.data || null,
      step2: step2Data?.data || null,
      step3: step3Data?.data || null
    };

    // Generate AI response with previous steps context
    const aiResponse = await generateWorkflowResponse({
      stepNumber: 4,
      userInput: {
        mustHaveFeatures: validatedData.mustHaveFeatures,
        niceToHaveFeatures: validatedData.niceToHaveFeatures,
        advancedFeatures: validatedData.advancedFeatures,
        integrations: validatedData.integrations
      },
      previousStepsData,
      systemPrompt: STEP4_SYSTEM_PROMPT
    });

    // Parse AI response as JSON
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiResponse.text);
    } catch {
      // If JSON parsing fails, create a structured fallback
      aiAnalysis = {
        featureAnalysis: {
          coreUserJourneys: [
            {
              journeyName: "Primary User Flow",
              description: "User journey analysis needed",
              currentPainPoints: ["Pain point analysis needed"],
              requiredFeatures: validatedData.mustHaveFeatures.split('\n').filter(f => f.trim())
            }
          ],
          personaFeatureMapping: [
            {
              personaName: "Primary User",
              priorityFeatures: validatedData.mustHaveFeatures.split('\n').slice(0, 3).filter(f => f.trim()),
              uniqueNeeds: ["Unique needs analysis needed"],
              featureUsagePatterns: "Usage patterns analysis needed"
            }
          ]
        },
        featureCategories: {
          mustHave: validatedData.mustHaveFeatures.split('\n').filter(f => f.trim()).map(feature => ({
            name: feature.replace(/^\d+\.\s*/, ''),
            description: "Feature description needed",
            userValue: "User value analysis needed",
            businessValue: "Business value analysis needed",
            complexity: "Medium",
            estimatedEffort: "Effort estimation needed",
            dependencies: [],
            successMetrics: ["Metrics definition needed"]
          })),
          shouldHave: validatedData.niceToHaveFeatures.split('\n').filter(f => f.trim()).map(feature => ({
            name: feature.replace(/^\d+\.\s*/, ''),
            description: "Feature description needed",
            userValue: "User value analysis needed",
            businessValue: "Business value analysis needed",
            complexity: "Medium",
            estimatedEffort: "Effort estimation needed",
            dependencies: [],
            successMetrics: ["Metrics definition needed"]
          })),
          couldHave: validatedData.advancedFeatures.split('\n').filter(f => f.trim()).map(feature => ({
            name: feature.replace(/^\d+\.\s*/, ''),
            description: "Feature description needed",
            userValue: "User value analysis needed",
            businessValue: "Business value analysis needed",
            complexity: "High",
            estimatedEffort: "Effort estimation needed",
            innovationPotential: "Innovation potential analysis needed"
          })),
          wontHave: [
            {
              name: "Feature analysis incomplete",
              reason: "AI analysis needed for feature categorization",
              futureConsideration: "Revisit after more detailed analysis"
            }
          ]
        },
        prioritizationMatrix: {
          highImpactLowEffort: [
            {
              feature: "Priority analysis needed",
              impact: "Impact analysis needed",
              effort: "Effort analysis needed",
              recommendation: "Further analysis required"
            }
          ],
          highImpactHighEffort: [
            {
              feature: "Complex feature analysis needed",
              impact: "Impact analysis needed",
              effort: "Effort analysis needed",
              recommendation: "Detailed planning required"
            }
          ],
          quickWins: ["Quick win analysis needed"],
          majorBets: ["Major bet analysis needed"]
        },
        implementationStrategy: {
          mvpFeatureSet: {
            coreFeatures: validatedData.mustHaveFeatures.split('\n').filter(f => f.trim()).slice(0, 3),
            timeline: "Timeline estimation needed",
            validationApproach: "Validation strategy needed",
            successCriteria: "Success criteria definition needed"
          },
          developmentPhases: [
            {
              phase: "Phase 1: MVP",
              duration: "Duration estimation needed",
              features: validatedData.mustHaveFeatures.split('\n').filter(f => f.trim()),
              goals: ["Goal definition needed"],
              risks: ["Risk analysis needed"],
              mitigations: ["Mitigation strategies needed"]
            }
          ],
          technicalConsiderations: {
            architectureRequirements: ["Architecture analysis needed"],
            scalabilityFactors: ["Scalability analysis needed"],
            integrationNeeds: validatedData.integrations.split(',').map(i => i.trim()).filter(i => i),
            securityConsiderations: ["Security analysis needed"]
          }
        },
        validationRecommendations: {
          featureTesting: [
            {
              feature: "Core features",
              testingMethod: "Testing method analysis needed",
              successMetrics: ["Metrics definition needed"],
              timeline: "Timeline analysis needed"
            }
          ],
          prototypeRecommendations: [
            "Prototype recommendations needed"
          ],
          userFeedbackPlan: "User feedback strategy needed"
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

    await prisma.workflowStep.upsert({
      where: {
        projectId_stepNumber: {
          projectId: validatedData.projectId,
          stepNumber: 4
        }
      },
      update: {
        data: workflowData,
        updatedAt: new Date()
      },
      create: {
        projectId: validatedData.projectId,
        stepNumber: 4,
        data: workflowData,
        status: 'completed'
      }
    });

    return NextResponse.json({
      success: true,
      data: aiAnalysis,
      message: 'Step 4 completed successfully'
    });

  } catch (error) {
    console.error('Step 4 API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process Step 4', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}