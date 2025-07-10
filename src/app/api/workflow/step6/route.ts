import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWorkflowResponse } from '@/lib/gemini';
import { STEP6_SYSTEM_PROMPT } from '@/lib/prompts/step6Prompts';
import { z } from 'zod';

const Step6InputSchema = z.object({
  projectId: z.string(),
  platformChoice: z.array(z.string()).min(1, 'At least one platform must be selected'),
  techPreferences: z.string().max(400),
  dataRequirements: z.string().min(20, 'Data requirements must be at least 20 characters').max(500),
  scalabilityNeeds: z.string().min(1, 'Scalability needs must be specified'),
  specialRequirements: z.string().max(400),
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
    const validatedData = Step6InputSchema.parse(body);

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

    // Prepare context from previous steps
    const previousStepsData = {
      step1: step1Data?.responses || null,
      step2: step2Data?.responses || null,
      step3: step3Data?.responses || null,
      step4: step4Data?.responses || null,
      step5: step5Data?.responses || null
    };

    // Generate AI response with previous steps context
    const aiResponse = await generateWorkflowResponse({
      stepNumber: 6,
      userInput: {
        platformChoice: validatedData.platformChoice,
        techPreferences: validatedData.techPreferences,
        dataRequirements: validatedData.dataRequirements,
        scalabilityNeeds: validatedData.scalabilityNeeds,
        specialRequirements: validatedData.specialRequirements
      },
      previousStepsData,
      systemPrompt: STEP6_SYSTEM_PROMPT
    });

    // Parse AI response as JSON
    let aiAnalysis;
    try {
      aiAnalysis = JSON.parse(aiResponse.text);
    } catch {
      // If JSON parsing fails, create a structured fallback
      aiAnalysis = {
        technologyRecommendations: {
          platformChoices: {
            mobileDevelopment: {
              recommendedApproach: validatedData.platformChoice.includes('iOS') && validatedData.platformChoice.includes('Android') ? "React Native" : "Native",
              reasoning: "Cross-platform development for efficiency",
              frameworks: ["React Native", "Flutter"],
              pros: ["Code reuse", "Faster development"],
              cons: ["Performance overhead", "Platform limitations"],
              developmentTime: "4-6 months for MVP",
              skillRequirements: ["React/React Native", "Mobile development"]
            },
            webDevelopment: {
              recommendedApproach: "SPA",
              framework: validatedData.techPreferences.includes('React') ? "React" : "Next.js",
              reasoning: "Modern web app with good performance",
              advantages: ["Fast user experience", "SEO friendly"],
              considerations: ["Initial load time", "SEO requirements"]
            },
            desktopSupport: {
              needed: false,
              approach: "PWA",
              reasoning: "Mobile-first approach recommended"
            }
          },
          backendArchitecture: {
            serverFramework: {
              recommendation: validatedData.techPreferences.includes('Node.js') ? "Node.js" : "Node.js",
              specificFramework: "Express.js",
              reasoning: "JavaScript ecosystem consistency",
              scalabilityFactors: ["Horizontal scaling", "Microservices"],
              performanceCharacteristics: "Good for I/O intensive operations"
            },
            databaseStrategy: {
              primaryDatabase: {
                type: "PostgreSQL",
                reasoning: "Relational data with JSON support",
                scalabilityPlan: "Read replicas and connection pooling",
                backupStrategy: "Automated daily backups with point-in-time recovery"
              },
              cachingLayer: {
                recommendation: "Redis",
                useCase: "Session storage and frequent queries",
                performanceImpact: "50-80% performance improvement for cached queries"
              },
              searchCapabilities: {
                needed: true,
                solution: "PostgreSQL full-text search",
                reasoning: "Built-in search capabilities sufficient for MVP"
              }
            },
            apiDesign: {
              architecture: "REST",
              reasoning: "Simple and well-understood",
              versioningStrategy: "URL versioning (/api/v1/)",
              documentationApproach: "OpenAPI/Swagger",
              rateLimiting: "Token bucket algorithm"
            }
          }
        },
        systemArchitecture: {
          highLevelArchitecture: {
            architecturePattern: "Modular Monolith",
            reasoning: "Appropriate for early stage with clear module boundaries",
            coreServices: [
              {
                serviceName: "User Management Service",
                responsibility: "Authentication, user profiles, preferences",
                technology: "Node.js + Express",
                scalingStrategy: "Horizontal scaling with load balancer"
              },
              {
                serviceName: "Core Business Logic Service",
                responsibility: "Main app functionality and business rules",
                technology: "Node.js + Express",
                scalingStrategy: "Horizontal scaling with caching"
              }
            ],
            dataFlow: "Client -> Load Balancer -> App Server -> Database",
            communicationPattern: "Synchronous REST APIs with async job processing"
          },
          securityArchitecture: {
            authenticationStrategy: {
              approach: "JWT",
              reasoning: "Stateless and scalable",
              implementation: "JWT tokens with refresh token rotation",
              socialLogins: ["Google", "Apple"],
              twoFactorAuth: "SMS/Email OTP for high-value actions"
            },
            dataProtection: {
              encryptionStrategy: "AES-256 for sensitive data, TLS for transport",
              privacyCompliance: "GDPR compliance with data deletion capabilities",
              dataRetention: "User data retained per privacy policy",
              auditLogging: "Security events logged with structured logging"
            },
            apiSecurity: {
              rateLimiting: "100 requests per minute per user",
              inputValidation: "Joi/Zod validation on all inputs",
              cors: "Configured for known origins only",
              ddosProtection: "Cloudflare or similar CDN protection"
            }
          },
          scalabilityPlanning: {
            loadEstimation: {
              initialLoad: "100-1000 concurrent users",
              growthProjections: "10K users in 6 months, 100K in 2 years",
              peakLoadScenarios: "3x normal load during peak hours",
              bottleneckIdentification: ["Database queries", "API response times"]
            },
            scalingStrategy: {
              horizontalScaling: "Load balanced app servers",
              verticalScaling: "Database server upgrades as needed",
              databaseScaling: "Read replicas and connection pooling",
              contentDelivery: "CDN for static assets"
            }
          }
        },
        infrastructureRecommendations: {
          hostingPlatform: {
            recommendation: "AWS",
            reasoning: "Comprehensive services and scaling options",
            costEstimation: "$200-500/month for MVP, $1000-3000/month at scale",
            migrationConsiderations: "Use containerization for portability",
            regionalConsiderations: "Deploy in user-local regions"
          },
          devOpsStrategy: {
            cicdPipeline: {
              tools: "GitHub Actions",
              stages: ["Lint", "Test", "Build", "Deploy"],
              deploymentStrategy: "Rolling deployment with health checks",
              environmentStrategy: "Dev/Staging/Production with environment parity"
            },
            monitoringStack: {
              applicationMonitoring: "New Relic or DataDog",
              loggingStrategy: "Structured JSON logging with centralized collection",
              alertingStrategy: "Alert on error rates >1%, response times >2s",
              performanceTracking: "Response times, error rates, user satisfaction"
            },
            backupStrategy: {
              dataBackup: "Automated daily backups with 30-day retention",
              disasterRecovery: "Multi-AZ deployment with failover",
              testingStrategy: "Monthly backup restoration tests"
            }
          },
          developmentEnvironment: {
            localSetup: "Docker Compose for local development",
            dependencyManagement: "npm/yarn with lock files",
            environmentParity: "Docker ensures dev/prod consistency",
            collaborationTools: "Git workflow with feature branches"
          }
        },
        implementationRoadmap: {
          phasedDevelopment: [
            {
              phase: "Phase 1: MVP Foundation",
              duration: "3-4 months",
              technicalGoals: ["Basic app infrastructure", "Core features", "User authentication"],
              infrastructure: ["Basic AWS setup", "Database", "CI/CD pipeline"],
              priorityServices: ["User management", "Core business logic"],
              successCriteria: ["App deployed and functional", "User registration working"],
              risks: ["Technical complexity", "Integration challenges"],
              mitigations: ["Start simple", "Incremental development", "Regular testing"]
            },
            {
              phase: "Phase 2: Scale & Optimize",
              duration: "2-3 months",
              technicalGoals: ["Performance optimization", "Advanced features", "Analytics"],
              scalingImprovements: ["Database optimization", "Caching layer"],
              newCapabilities: ["Advanced search", "Real-time features"]
            }
          ],
          criticalPath: {
            blockerTasks: ["Database design", "Authentication system", "Core API"],
            parallelTracks: ["Frontend development", "Backend development", "Infrastructure setup"],
            dependencyManagement: "Use feature flags for independent development"
          }
        },
        qualityAssurance: {
          testingStrategy: {
            unitTesting: {
              framework: "Jest",
              coverage: "80% code coverage target",
              strategy: "Test business logic and utilities"
            },
            integrationTesting: {
              approach: "API endpoint testing",
              tools: "Supertest for Node.js API testing",
              dataStrategy: "Test database with fixtures"
            },
            e2eTesting: {
              framework: "Cypress",
              scenarios: ["User registration", "Core user flow"],
              automationStrategy: "Run on each deployment"
            },
            performanceTesting: {
              tools: "k6",
              scenarios: ["Load testing", "Stress testing"],
              benchmarks: "API response time <200ms, 99th percentile <1s"
            }
          },
          codeQuality: {
            linting: "ESLint with TypeScript support",
            formatting: "Prettier for consistent formatting",
            codeReview: "Pull request reviews required",
            documentation: "JSDoc for functions, README for setup"
          }
        },
        costOptimization: {
          developmentCosts: {
            initialSetup: "$5,000-10,000 for initial development tools and infrastructure",
            monthlyOperational: "$200-500 for hosting and services",
            scalingCosts: "Costs scale linearly with user growth",
            optimizationOpportunities: ["Reserved instances", "Efficient database queries"]
          },
          resourcePlanning: {
            teamSize: "2-3 developers for MVP (full-stack + mobile/frontend)",
            timelineEstimate: "4-6 months for MVP, 8-12 months for full feature set",
            skillGaps: validatedData.techPreferences ? [] : ["Specific technology expertise"],
            externalDependencies: ["Third-party APIs", "Payment processing"]
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

    // First, ensure ProjectWorkflow exists
    const projectWorkflowRecord = await prisma.projectWorkflow.upsert({
      where: {
        projectId: validatedData.projectId
      },
      update: {
        currentStep: Math.max(6, 6),
        updatedAt: new Date()
      },
      create: {
        projectId: validatedData.projectId,
        currentStep: 6,
        startedAt: new Date()
      }
    });

    // Then upsert the WorkflowResponse
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
        aiSuggestions: JSON.stringify(aiAnalysis),
        updatedAt: new Date()
      },
      create: {
        workflowId: projectWorkflowRecord.id,
        stepId: 6,
        responses: workflowData,
        completed: true,
        aiSuggestions: JSON.stringify(aiAnalysis)
      }
    });

    return NextResponse.json({
      success: true,
      data: aiAnalysis,
      message: 'Step 6 completed successfully'
    });

  } catch (error) {
    console.error('Step 6 API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process Step 6', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}