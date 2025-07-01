import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { STEP5_SYSTEM_PROMPT } from '@/lib/prompts/step5Prompts';
import { z } from 'zod';

const Step5InputSchema = z.object({
  projectId: z.string(),
  userJourney: z.string().min(30, 'User journey description must be at least 30 characters').max(800),
  onboardingFlow: z.string().min(20, 'Onboarding flow must be at least 20 characters').max(500),
  navigationStructure: z.string().min(10, 'Navigation structure must be at least 10 characters').max(400),
  keyInteractions: z.string().max(500),
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
    const validatedData = Step5InputSchema.parse(body);

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
    const [step1Data, step2Data, step3Data, step4Data] = await Promise.all([
      prisma.workflowStep.findFirst({
        where: { projectId: validatedData.projectId, stepNumber: 1 }
      }),
      prisma.workflowStep.findFirst({
        where: { projectId: validatedData.projectId, stepNumber: 2 }
      }),
      prisma.workflowStep.findFirst({
        where: { projectId: validatedData.projectId, stepNumber: 3 }
      }),
      prisma.workflowStep.findFirst({
        where: { projectId: validatedData.projectId, stepNumber: 4 }
      })
    ]);

    // Prepare context from previous steps
    const previousStepsData = {
      step1: step1Data?.data || null,
      step2: step2Data?.data || null,
      step3: step3Data?.data || null,
      step4: step4Data?.data || null
    };

    // Generate AI response with previous steps context
    const aiResponse = await generateWorkflowResponse({
      stepNumber: 5,
      userInput: {
        userJourney: validatedData.userJourney,
        onboardingFlow: validatedData.onboardingFlow,
        navigationStructure: validatedData.navigationStructure,
        keyInteractions: validatedData.keyInteractions
      },
      previousStepsData,
      systemPrompt: STEP5_SYSTEM_PROMPT
    });

    // Parse AI response as JSON
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiResponse.text);
    } catch {
      // If JSON parsing fails, create a structured fallback
      aiAnalysis = {
        userJourneyAnalysis: {
          primaryJourneys: [
            {
              journeyName: "Main User Flow",
              persona: "Primary User",
              trigger: "User journey analysis needed",
              goals: ["Goal analysis needed"],
              frequency: "Frequency analysis needed",
              criticalSuccessFactors: ["Success factor analysis needed"]
            }
          ],
          supportingJourneys: [
            {
              journeyName: "Supporting flow analysis needed",
              purpose: "Purpose analysis needed",
              triggerPoints: ["Trigger analysis needed"],
              connectionToMain: "Connection analysis needed"
            }
          ]
        },
        detailedFlows: {
          onboardingFlow: {
            overview: validatedData.onboardingFlow,
            steps: [
              {
                stepNumber: 1,
                screenName: "Welcome Screen",
                purpose: "Welcome and introduction",
                content: {
                  headline: "Welcome to the app",
                  description: "Get started with your journey",
                  ctaText: "Get Started",
                  additionalElements: ["Logo", "Skip option"]
                },
                interactions: ["Tap to continue"],
                transitions: "Smooth transition to next step",
                successCriteria: "User progresses to next step",
                potentialFriction: ["Complex signup process"],
                designNotes: "Keep it simple and welcoming"
              }
            ],
            alternativePaths: ["Skip onboarding", "Social login"],
            dropOffPrevention: ["Progress indicators", "Clear value proposition"],
            personalization: "Customization based on user type"
          },
          coreUserFlow: {
            flowName: "Primary User Journey",
            description: validatedData.userJourney,
            steps: [
              {
                stepNumber: 1,
                screenName: "Main Screen",
                purpose: "Primary functionality",
                content: {
                  mainElements: ["Navigation", "Content area"],
                  navigation: validatedData.navigationStructure,
                  dataDisplayed: "User-relevant information"
                },
                interactions: validatedData.keyInteractions.split(',').map(i => i.trim()),
                businessValue: "Drives core app engagement",
                userValue: "Delivers primary user benefit"
              }
            ],
            errorStates: [
              {
                scenario: "Network error",
                handling: "Show friendly error message",
                recovery: "Retry mechanism"
              }
            ],
            optimizationOpportunities: ["Performance improvements", "UX enhancements"]
          }
        },
        navigationDesign: {
          informationArchitecture: {
            primaryNavigation: validatedData.navigationStructure.split(',').map((nav, index) => ({
              section: nav.trim(),
              purpose: "Navigation analysis needed",
              contains: ["Subsection analysis needed"],
              icon: "Icon recommendation needed",
              priority: index < 3 ? "High" : "Medium"
            })),
            secondaryNavigation: [
              {
                element: "Settings",
                placement: "User profile area",
                purpose: "User customization"
              }
            ],
            contentHierarchy: "Content hierarchy analysis needed"
          },
          navigationPatterns: {
            mobileNavigation: "Mobile navigation strategy needed",
            desktopNavigation: "Desktop navigation strategy needed",
            breadcrumbs: "Breadcrumb strategy needed",
            searchFunctionality: "Search strategy needed",
            filteringSorting: "Filter strategy needed"
          }
        },
        interactionDesign: {
          keyInteractions: validatedData.keyInteractions.split(',').map(interaction => ({
            interaction: interaction.trim(),
            context: "Context analysis needed",
            method: "Method analysis needed",
            feedback: "Feedback analysis needed",
            accessibility: "Accessibility analysis needed",
            responsiveConsiderations: "Responsive analysis needed"
          })),
          gestureStrategy: {
            primaryGestures: ["Tap", "Swipe"],
            customGestures: ["Custom gesture analysis needed"],
            gestureDiscovery: "Discovery strategy needed",
            fallbackMethods: ["Fallback method analysis needed"]
          },
          feedbackSystems: {
            visualFeedback: "Visual feedback strategy needed",
            loadingStates: "Loading state strategy needed",
            successStates: "Success state strategy needed",
            errorPrevention: "Error prevention strategy needed"
          }
        },
        conversionOptimization: {
          conversionFunnels: [
            {
              funnelName: "Primary conversion",
              stages: ["Awareness", "Interest", "Action"],
              dropOffPoints: ["Drop-off analysis needed"],
              optimizationStrategies: ["Optimization strategy needed"],
              successMetrics: ["Metrics definition needed"]
            }
          ],
          engagementMechanisms: {
            habitFormation: "Habit formation strategy needed",
            progressIndicators: "Progress strategy needed",
            achievementSystems: "Achievement strategy needed",
            socialElements: "Social strategy needed"
          },
          retentionStrategies: {
            returningUserFlow: "Returning user strategy needed",
            reEngagementTriggers: ["Re-engagement strategy needed"],
            valueReinforcement: "Value reinforcement strategy needed",
            contentStrategy: "Content strategy needed"
          }
        },
        implementationRecommendations: {
          priorityFlows: [
            {
              flow: "Onboarding flow",
              priority: "High",
              reasoning: "Critical for user adoption",
              dependencies: ["User authentication"],
              testingStrategy: "User testing with prototypes"
            }
          ],
          prototypeStrategy: {
            lowFidelityFocus: ["User flow wireframes"],
            highFidelityFocus: ["Key interaction prototypes"],
            userTestingPlan: "Prototype testing strategy needed",
            iterationStrategy: "Iteration strategy needed"
          },
          technicalConsiderations: {
            performanceRequirements: ["Fast loading", "Smooth animations"],
            dataRequirements: ["User data", "Content data"],
            platformSpecific: ["iOS guidelines", "Android guidelines", "Web standards"],
            analyticsIntegration: "User behavior tracking"
          }
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
          stepNumber: 5
        }
      },
      update: {
        data: workflowData,
        updatedAt: new Date()
      },
      create: {
        projectId: validatedData.projectId,
        stepNumber: 5,
        data: workflowData,
        status: 'completed'
      }
    });

    return NextResponse.json({
      success: true,
      data: aiAnalysis,
      message: 'Step 5 completed successfully'
    });

  } catch (error) {
    console.error('Step 5 API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process Step 5', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}