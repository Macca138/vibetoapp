'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
// import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Cpu, Database, Shield, Zap, Server, Globe, Code, Gauge } from 'lucide-react';

interface Step6Data {
  platformChoice: string[];
  techPreferences: string;
  dataRequirements: string;
  scalabilityNeeds: string;
  specialRequirements: string;
}

interface TechRecommendation {
  technologyRecommendations: {
    platformChoices: {
      mobileDevelopment: {
        recommendedApproach: string;
        reasoning: string;
        frameworks: string[];
        pros: string[];
        cons: string[];
        developmentTime: string;
        skillRequirements: string[];
      };
      webDevelopment: {
        recommendedApproach: string;
        framework: string;
        reasoning: string;
        advantages: string[];
        considerations: string[];
      };
      desktopSupport: {
        needed: boolean;
        approach: string;
        reasoning: string;
      };
    };
    backendArchitecture: {
      serverFramework: {
        recommendation: string;
        specificFramework: string;
        reasoning: string;
        scalabilityFactors: string[];
        performanceCharacteristics: string;
      };
      databaseStrategy: {
        primaryDatabase: {
          type: string;
          reasoning: string;
          scalabilityPlan: string;
          backupStrategy: string;
        };
        cachingLayer: {
          recommendation: string;
          useCase: string;
          performanceImpact: string;
        };
        searchCapabilities: {
          needed: boolean;
          solution: string;
          reasoning: string;
        };
      };
      apiDesign: {
        architecture: string;
        reasoning: string;
        versioningStrategy: string;
        documentationApproach: string;
        rateLimiting: string;
      };
    };
  };
  systemArchitecture: {
    highLevelArchitecture: {
      architecturePattern: string;
      reasoning: string;
      coreServices: Array<{
        serviceName: string;
        responsibility: string;
        technology: string;
        scalingStrategy: string;
      }>;
      dataFlow: string;
      communicationPattern: string;
    };
    securityArchitecture: {
      authenticationStrategy: {
        approach: string;
        reasoning: string;
        implementation: string;
        socialLogins: string[];
        twoFactorAuth: string;
      };
      dataProtection: {
        encryptionStrategy: string;
        privacyCompliance: string;
        dataRetention: string;
        auditLogging: string;
      };
      apiSecurity: {
        rateLimiting: string;
        inputValidation: string;
        cors: string;
        ddosProtection: string;
      };
    };
    scalabilityPlanning: {
      loadEstimation: {
        initialLoad: string;
        growthProjections: string;
        peakLoadScenarios: string;
        bottleneckIdentification: string[];
      };
      scalingStrategy: {
        horizontalScaling: string;
        verticalScaling: string;
        databaseScaling: string;
        contentDelivery: string;
      };
    };
  };
  infrastructureRecommendations: {
    hostingPlatform: {
      recommendation: string;
      reasoning: string;
      costEstimation: string;
      migrationConsiderations: string;
      regionalConsiderations: string;
    };
    devOpsStrategy: {
      cicdPipeline: {
        tools: string;
        stages: string[];
        deploymentStrategy: string;
        environmentStrategy: string;
      };
      monitoringStack: {
        applicationMonitoring: string;
        loggingStrategy: string;
        alertingStrategy: string;
        performanceTracking: string;
      };
      backupStrategy: {
        dataBackup: string;
        disasterRecovery: string;
        testingStrategy: string;
      };
    };
    developmentEnvironment: {
      localSetup: string;
      dependencyManagement: string;
      environmentParity: string;
      collaborationTools: string;
    };
  };
  implementationRoadmap: {
    phasedDevelopment: Array<{
      phase: string;
      duration: string;
      technicalGoals: string[];
      infrastructure: string[];
      priorityServices: string[];
      successCriteria: string[];
      risks: string[];
      mitigations: string[];
    }>;
    criticalPath: {
      blockerTasks: string[];
      parallelTracks: string[];
      dependencyManagement: string;
    };
  };
  qualityAssurance: {
    testingStrategy: {
      unitTesting: {
        framework: string;
        coverage: string;
        strategy: string;
      };
      integrationTesting: {
        approach: string;
        tools: string;
        dataStrategy: string;
      };
      e2eTesting: {
        framework: string;
        scenarios: string[];
        automationStrategy: string;
      };
      performanceTesting: {
        tools: string;
        scenarios: string[];
        benchmarks: string;
      };
    };
    codeQuality: {
      linting: string;
      formatting: string;
      codeReview: string;
      documentation: string;
    };
  };
  costOptimization: {
    developmentCosts: {
      initialSetup: string;
      monthlyOperational: string;
      scalingCosts: string;
      optimizationOpportunities: string[];
    };
    resourcePlanning: {
      teamSize: string;
      timelineEstimate: string;
      skillGaps: string[];
      externalDependencies: string[];
    };
  };
}

interface Step6Props {
  projectId: string;
  initialData?: Step6Data;
  onComplete: (data: any) => void;
  onNext: () => void;
}

const platformOptions = [
  { id: 'iOS', label: 'iOS App' },
  { id: 'Android', label: 'Android App' },
  { id: 'Web App', label: 'Web Application' },
  { id: 'Desktop', label: 'Desktop Application' },
  { id: 'PWA', label: 'Progressive Web App' }
];

const scalabilityOptions = [
  { value: 'small', label: 'Small Scale (1K-10K users)' },
  { value: 'medium', label: 'Medium Scale (10K-100K users)' },
  { value: 'large', label: 'Large Scale (100K-1M users)' },
  { value: 'enterprise', label: 'Enterprise Scale (1M+ users)' }
];

export default function Step6TechnicalArchitecture({ 
  projectId, 
  initialData, 
  onComplete, 
  onNext 
}: Step6Props) {
  const [formData, setFormData] = useState<Step6Data>({
    platformChoice: initialData?.platformChoice || [],
    techPreferences: initialData?.techPreferences || '',
    dataRequirements: initialData?.dataRequirements || '',
    scalabilityNeeds: initialData?.scalabilityNeeds || 'medium',
    specialRequirements: initialData?.specialRequirements || ''
  });

  const [aiAnalysis, setAiAnalysis] = useState<TechRecommendation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlatformChange = (platformId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      platformChoice: checked 
        ? [...prev.platformChoice, platformId]
        : prev.platformChoice.filter(p => p !== platformId)
    }));
    setError(null);
  };

  const handleInputChange = (field: keyof Omit<Step6Data, 'platformChoice'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (formData.platformChoice.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    if (!formData.dataRequirements.trim() || formData.dataRequirements.length < 20) {
      setError('Please provide detailed data requirements (minimum 20 characters)');
      return;
    }

    if (!formData.scalabilityNeeds) {
      setError('Please select your scalability needs');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/workflow/step6', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ...formData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process step');
      }

      const result = await response.json();
      setAiAnalysis(result.data);
      onComplete(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const isFormValid = formData.platformChoice.length > 0 && formData.dataRequirements.length >= 20 && formData.scalabilityNeeds;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Technical Architecture</h1>
        <p className="text-lg text-gray-600 mt-2">
          Design the technical foundation and infrastructure for your application
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-blue-500" />
            Define Your Technical Requirements
          </CardTitle>
          <CardDescription>
            Let&apos;s architect a robust, scalable technical solution for your app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium mb-3 block">
              Which platforms do you want to support? *
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {platformOptions.map(platform => (
                <div key={platform.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={platform.id}
                    checked={formData.platformChoice.includes(platform.id)}
                    onChange={(e) => 
                      handlePlatformChange(platform.id, e.target.checked)
                    }
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <Label htmlFor={platform.id} className="text-sm font-normal">
                    {platform.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="techPreferences" className="text-base font-medium">
              Do you have any technology preferences?
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Languages, frameworks, or tools you prefer (e.g., React, Node.js, Python)
            </p>
            <Textarea
              id="techPreferences"
              placeholder="React for frontend, Node.js for backend, PostgreSQL database..."
              value={formData.techPreferences}
              onChange={(e) => handleInputChange('techPreferences', e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={400}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.techPreferences.length}/400 characters
            </div>
          </div>

          <div>
            <Label htmlFor="dataRequirements" className="text-base font-medium">
              What are your data requirements? *
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Types of data you&apos;ll store, user data, content, analytics, etc.
            </p>
            <Textarea
              id="dataRequirements"
              placeholder="User profiles, authentication data, application content, user-generated content, analytics data, transaction records..."
              value={formData.dataRequirements}
              onChange={(e) => handleInputChange('dataRequirements', e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.dataRequirements.length}/500 characters (minimum 20)
            </div>
          </div>

          <div>
            <Label htmlFor="scalabilityNeeds" className="text-base font-medium">
              What are your scalability expectations? *
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Expected user volume and growth
            </p>
            <Select value={formData.scalabilityNeeds} onValueChange={(value) => handleInputChange('scalabilityNeeds', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select scalability needs" />
              </SelectTrigger>
              <SelectContent>
                {scalabilityOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="specialRequirements" className="text-base font-medium">
              Any special technical requirements?
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Real-time features, offline support, integrations, compliance needs, etc.
            </p>
            <Textarea
              id="specialRequirements"
              placeholder="Real-time messaging, offline functionality, payment processing, third-party integrations..."
              value={formData.specialRequirements}
              onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={400}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.specialRequirements.length}/400 characters
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI is designing your technical architecture...
              </>
            ) : (
              'Generate Technical Architecture with AI'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* AI Analysis Results */}
      {aiAnalysis && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Technology Recommendations */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Code className="h-6 w-6 text-blue-500" />
              Technology Recommendations
            </h2>
            
            <div className="grid gap-4">
              {/* Mobile Development */}
              <Card className="border-l-4 border-l-blue-400">
                <CardHeader>
                  <CardTitle className="text-blue-700">Mobile Development</CardTitle>
                  <CardDescription>
                    Recommended Approach: {aiAnalysis.technologyRecommendations.platformChoices.mobileDevelopment.recommendedApproach}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-600">{aiAnalysis.technologyRecommendations.platformChoices.mobileDevelopment.reasoning}</p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-800">Frameworks:</span>
                      <ul className="text-gray-600 list-disc list-inside">
                        {aiAnalysis.technologyRecommendations.platformChoices.mobileDevelopment.frameworks.map((framework, i) => (
                          <li key={i}>{framework}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">Development Time:</span>
                      <p className="text-gray-600">{aiAnalysis.technologyRecommendations.platformChoices.mobileDevelopment.developmentTime}</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-green-600">Pros:</span>
                      <ul className="text-gray-600 list-disc list-inside">
                        {aiAnalysis.technologyRecommendations.platformChoices.mobileDevelopment.pros.map((pro, i) => (
                          <li key={i}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium text-red-600">Cons:</span>
                      <ul className="text-gray-600 list-disc list-inside">
                        {aiAnalysis.technologyRecommendations.platformChoices.mobileDevelopment.cons.map((con, i) => (
                          <li key={i}>{con}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Backend Architecture */}
              <Card className="border-l-4 border-l-green-400">
                <CardHeader>
                  <CardTitle className="text-green-700">Backend Architecture</CardTitle>
                  <CardDescription>
                    {aiAnalysis.technologyRecommendations.backendArchitecture.serverFramework.recommendation} - {aiAnalysis.technologyRecommendations.backendArchitecture.serverFramework.specificFramework}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-600">{aiAnalysis.technologyRecommendations.backendArchitecture.serverFramework.reasoning}</p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-800">Database:</span>
                      <p className="text-gray-600">{aiAnalysis.technologyRecommendations.backendArchitecture.databaseStrategy.primaryDatabase.type}</p>
                      <p className="text-xs text-gray-500">{aiAnalysis.technologyRecommendations.backendArchitecture.databaseStrategy.primaryDatabase.reasoning}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">Caching:</span>
                      <p className="text-gray-600">{aiAnalysis.technologyRecommendations.backendArchitecture.databaseStrategy.cachingLayer.recommendation}</p>
                      <p className="text-xs text-gray-500">{aiAnalysis.technologyRecommendations.backendArchitecture.databaseStrategy.cachingLayer.performanceImpact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* System Architecture */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-purple-500" />
                System Architecture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Architecture Pattern</h4>
                <p className="text-gray-600">{aiAnalysis.systemArchitecture.highLevelArchitecture.architecturePattern}</p>
                <p className="text-sm text-gray-500">{aiAnalysis.systemArchitecture.highLevelArchitecture.reasoning}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Core Services</h4>
                <div className="space-y-3">
                  {aiAnalysis.systemArchitecture.highLevelArchitecture.coreServices.map((service, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-purple-50">
                      <h5 className="font-medium text-gray-900">{service.serviceName}</h5>
                      <p className="text-gray-600 text-sm">{service.responsibility}</p>
                      <div className="grid md:grid-cols-2 gap-2 text-xs mt-2">
                        <div>
                          <span className="font-medium text-gray-800">Technology:</span>
                          <span className="text-gray-600 ml-1">{service.technology}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">Scaling:</span>
                          <span className="text-gray-600 ml-1">{service.scalingStrategy}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Architecture */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                Security Architecture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Authentication</h4>
                  <p className="text-sm text-gray-600">{aiAnalysis.systemArchitecture.securityArchitecture.authenticationStrategy.approach}</p>
                  <p className="text-xs text-gray-500 mt-1">{aiAnalysis.systemArchitecture.securityArchitecture.authenticationStrategy.reasoning}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Data Protection</h4>
                  <p className="text-sm text-gray-600">{aiAnalysis.systemArchitecture.securityArchitecture.dataProtection.encryptionStrategy}</p>
                  <p className="text-xs text-gray-500 mt-1">{aiAnalysis.systemArchitecture.securityArchitecture.dataProtection.privacyCompliance}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Infrastructure Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-indigo-500" />
                Infrastructure & Hosting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Hosting Platform</h4>
                <p className="text-gray-600">{aiAnalysis.infrastructureRecommendations.hostingPlatform.recommendation}</p>
                <p className="text-sm text-gray-500">{aiAnalysis.infrastructureRecommendations.hostingPlatform.reasoning}</p>
                <div className="mt-2 text-sm">
                  <span className="font-medium text-gray-800">Cost Estimation:</span>
                  <span className="text-gray-600 ml-1">{aiAnalysis.infrastructureRecommendations.hostingPlatform.costEstimation}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">CI/CD Pipeline</h5>
                  <p className="text-gray-600">{aiAnalysis.infrastructureRecommendations.devOpsStrategy.cicdPipeline.tools}</p>
                  <p className="text-xs text-gray-500">{aiAnalysis.infrastructureRecommendations.devOpsStrategy.cicdPipeline.deploymentStrategy}</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Monitoring</h5>
                  <p className="text-gray-600">{aiAnalysis.infrastructureRecommendations.devOpsStrategy.monitoringStack.applicationMonitoring}</p>
                  <p className="text-xs text-gray-500">{aiAnalysis.infrastructureRecommendations.devOpsStrategy.monitoringStack.alertingStrategy}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Implementation Roadmap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-yellow-500" />
                Implementation Roadmap
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {aiAnalysis.implementationRoadmap.phasedDevelopment.map((phase, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-yellow-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{phase.phase}</h4>
                      <span className="text-sm text-gray-600">{phase.duration}</span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-800">Technical Goals:</span>
                        <ul className="text-gray-600 list-disc list-inside">
                          {phase.technicalGoals.map((goal, i) => (
                            <li key={i}>{goal}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">Success Criteria:</span>
                        <ul className="text-gray-600 list-disc list-inside">
                          {phase.successCriteria.map((criteria, i) => (
                            <li key={i}>{criteria}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    {phase.risks.length > 0 && (
                      <div className="mt-3 text-sm">
                        <span className="font-medium text-red-600">Risks:</span>
                        <ul className="text-red-600 list-disc list-inside">
                          {phase.risks.map((risk, i) => (
                            <li key={i}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quality Assurance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-500" />
                Quality Assurance & Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Unit Testing</h5>
                  <p className="text-gray-600">{aiAnalysis.qualityAssurance.testingStrategy.unitTesting.framework}</p>
                  <p className="text-xs text-gray-500">{aiAnalysis.qualityAssurance.testingStrategy.unitTesting.coverage}</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">E2E Testing</h5>
                  <p className="text-gray-600">{aiAnalysis.qualityAssurance.testingStrategy.e2eTesting.framework}</p>
                  <p className="text-xs text-gray-500">{aiAnalysis.qualityAssurance.testingStrategy.e2eTesting.automationStrategy}</p>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Performance Benchmarks</h5>
                <p className="text-gray-600 text-sm">{aiAnalysis.qualityAssurance.testingStrategy.performanceTesting.benchmarks}</p>
              </div>
            </CardContent>
          </Card>

          {/* Cost Optimization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-teal-500" />
                Cost & Resource Planning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Development Costs</h5>
                  <div className="space-y-1">
                    <p className="text-gray-600">Initial: {aiAnalysis.costOptimization.developmentCosts.initialSetup}</p>
                    <p className="text-gray-600">Monthly: {aiAnalysis.costOptimization.developmentCosts.monthlyOperational}</p>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Team Planning</h5>
                  <p className="text-gray-600">{aiAnalysis.costOptimization.resourcePlanning.teamSize}</p>
                  <p className="text-xs text-gray-500">{aiAnalysis.costOptimization.resourcePlanning.timelineEstimate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Step Button */}
          <div className="flex justify-center pt-4">
            <Button onClick={onNext} size="lg" className="px-8">
              Continue to Step 7: Revenue Model
            </Button>
          </div>
        </m.div>
      )}
    </div>
  );
}