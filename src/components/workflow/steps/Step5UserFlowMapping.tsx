'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Route, Smartphone, Navigation, MousePointer, ArrowRight, Users, Zap } from 'lucide-react';

interface Step5Data {
  userJourney: string;
  onboardingFlow: string;
  navigationStructure: string;
  keyInteractions: string;
}

interface FlowStep {
  stepNumber: number;
  screenName: string;
  purpose: string;
  content: {
    headline?: string;
    description?: string;
    ctaText?: string;
    additionalElements?: string[];
    mainElements?: string[];
    navigation?: string;
    dataDisplayed?: string;
  };
  interactions: string[];
  transitions?: string;
  successCriteria?: string;
  potentialFriction?: string[];
  designNotes?: string;
  businessValue?: string;
  userValue?: string;
}

interface AIAnalysis {
  userJourneyAnalysis: {
    primaryJourneys: Array<{
      journeyName: string;
      persona: string;
      trigger: string;
      goals: string[];
      frequency: string;
      criticalSuccessFactors: string[];
    }>;
    supportingJourneys: Array<{
      journeyName: string;
      purpose: string;
      triggerPoints: string[];
      connectionToMain: string;
    }>;
  };
  detailedFlows: {
    onboardingFlow: {
      overview: string;
      steps: FlowStep[];
      alternativePaths: string[];
      dropOffPrevention: string[];
      personalization: string;
    };
    coreUserFlow: {
      flowName: string;
      description: string;
      steps: FlowStep[];
      errorStates: Array<{
        scenario: string;
        handling: string;
        recovery: string;
      }>;
      optimizationOpportunities: string[];
    };
  };
  navigationDesign: {
    informationArchitecture: {
      primaryNavigation: Array<{
        section: string;
        purpose: string;
        contains: string[];
        icon: string;
        priority: string;
      }>;
      secondaryNavigation: Array<{
        element: string;
        placement: string;
        purpose: string;
      }>;
      contentHierarchy: string;
    };
    navigationPatterns: {
      mobileNavigation: string;
      desktopNavigation: string;
      breadcrumbs: string;
      searchFunctionality: string;
      filteringSorting: string;
    };
  };
  interactionDesign: {
    keyInteractions: Array<{
      interaction: string;
      context: string;
      method: string;
      feedback: string;
      accessibility: string;
      responsiveConsiderations: string;
    }>;
    gestureStrategy: {
      primaryGestures: string[];
      customGestures: string[];
      gestureDiscovery: string;
      fallbackMethods: string[];
    };
    feedbackSystems: {
      visualFeedback: string;
      loadingStates: string;
      successStates: string;
      errorPrevention: string;
    };
  };
  conversionOptimization: {
    conversionFunnels: Array<{
      funnelName: string;
      stages: string[];
      dropOffPoints: string[];
      optimizationStrategies: string[];
      successMetrics: string[];
    }>;
    engagementMechanisms: {
      habitFormation: string;
      progressIndicators: string;
      achievementSystems: string;
      socialElements: string;
    };
    retentionStrategies: {
      returningUserFlow: string;
      reEngagementTriggers: string[];
      valueReinforcement: string;
      contentStrategy: string;
    };
  };
  implementationRecommendations: {
    priorityFlows: Array<{
      flow: string;
      priority: string;
      reasoning: string;
      dependencies: string[];
      testingStrategy: string;
    }>;
    prototypeStrategy: {
      lowFidelityFocus: string[];
      highFidelityFocus: string[];
      userTestingPlan: string;
      iterationStrategy: string;
    };
    technicalConsiderations: {
      performanceRequirements: string[];
      dataRequirements: string[];
      platformSpecific: string[];
      analyticsIntegration: string;
    };
  };
}

interface Step5Props {
  projectId: string;
  initialData?: Step5Data;
  onComplete: (data: any) => void;
  onNext: () => void;
}

export default function Step5UserFlowMapping({ 
  projectId, 
  initialData, 
  onComplete, 
  onNext 
}: Step5Props) {
  const [formData, setFormData] = useState<Step5Data>({
    userJourney: initialData?.userJourney || '',
    onboardingFlow: initialData?.onboardingFlow || '',
    navigationStructure: initialData?.navigationStructure || '',
    keyInteractions: initialData?.keyInteractions || ''
  });

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof Step5Data, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.userJourney.trim() || !formData.onboardingFlow.trim() || !formData.navigationStructure.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.userJourney.length < 30 || formData.onboardingFlow.length < 20 || formData.navigationStructure.length < 10) {
      setError('Please provide more detailed descriptions for required fields');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/workflow/step5', {
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
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const isFormValid = formData.userJourney.length >= 30 && formData.onboardingFlow.length >= 20 && formData.navigationStructure.length >= 10;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">User Flow Mapping</h1>
        <p className="text-lg text-gray-600 mt-2">
          Create intuitive user journeys and interaction flows for seamless experiences
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-blue-500" />
            Design Your User Experience
          </CardTitle>
          <CardDescription>
            Let&apos;s map out how users will navigate through your app and accomplish their goals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="userJourney" className="text-base font-medium">
              Describe the main user journey *
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Step-by-step flow from app open to goal completion
            </p>
            <Textarea
              id="userJourney"
              placeholder="1. User opens app&#10;2. User signs up&#10;3. User completes onboarding&#10;4. User..."
              value={formData.userJourney}
              onChange={(e) => handleInputChange('userJourney', e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={800}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.userJourney.length}/800 characters (minimum 30)
            </div>
          </div>

          <div>
            <Label htmlFor="onboardingFlow" className="text-base font-medium">
              How will you onboard new users? *
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              How will first-time users learn to use your app?
            </p>
            <Textarea
              id="onboardingFlow"
              placeholder="Welcome screen → tutorial → profile setup → first action..."
              value={formData.onboardingFlow}
              onChange={(e) => handleInputChange('onboardingFlow', e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.onboardingFlow.length}/500 characters (minimum 20)
            </div>
          </div>

          <div>
            <Label htmlFor="navigationStructure" className="text-base font-medium">
              What will your main navigation look like? *
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Main menu items and app structure
            </p>
            <Textarea
              id="navigationStructure"
              placeholder="Home, Dashboard, Profile, Settings..."
              value={formData.navigationStructure}
              onChange={(e) => handleInputChange('navigationStructure', e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={400}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.navigationStructure.length}/400 characters (minimum 10)
            </div>
          </div>

          <div>
            <Label htmlFor="keyInteractions" className="text-base font-medium">
              What are the key user interactions?
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Important gestures and interactions
            </p>
            <Textarea
              id="keyInteractions"
              placeholder="Tap to select, swipe to navigate, long press for options..."
              value={formData.keyInteractions}
              onChange={(e) => handleInputChange('keyInteractions', e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.keyInteractions.length}/500 characters
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
                AI is designing your user flows...
              </>
            ) : (
              'Generate User Flow Design with AI'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* AI Analysis Results */}
      {aiAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* User Journey Analysis */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-purple-500" />
              User Journey Analysis
            </h2>
            
            <div className="grid gap-4">
              {aiAnalysis.userJourneyAnalysis.primaryJourneys.map((journey, index) => (
                <Card key={index} className="border-l-4 border-l-purple-400">
                  <CardHeader>
                    <CardTitle className="text-purple-700">{journey.journeyName}</CardTitle>
                    <CardDescription>Persona: {journey.persona}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-800">Trigger:</span>
                        <p className="text-gray-600">{journey.trigger}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">Frequency:</span>
                        <p className="text-gray-600">{journey.frequency}</p>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">Goals:</span>
                      <ul className="text-gray-600 text-sm list-disc list-inside">
                        {journey.goals.map((goal, i) => (
                          <li key={i}>{goal}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">Critical Success Factors:</span>
                      <ul className="text-gray-600 text-sm list-disc list-inside">
                        {journey.criticalSuccessFactors.map((factor, i) => (
                          <li key={i}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Detailed Flows */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ArrowRight className="h-6 w-6 text-blue-500" />
              Detailed User Flows
            </h2>

            {/* Onboarding Flow */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-green-500" />
                  Onboarding Flow
                </CardTitle>
                <CardDescription>{aiAnalysis.detailedFlows.onboardingFlow.overview}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {aiAnalysis.detailedFlows.onboardingFlow.steps.map((step, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-green-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">
                          Step {step.stepNumber}: {step.screenName}
                        </h4>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{step.purpose}</p>
                      
                      {step.content.headline && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-800">Headline:</span>
                          <span className="text-gray-600 ml-1">{step.content.headline}</span>
                        </div>
                      )}
                      
                      {step.interactions.length > 0 && (
                        <div className="text-sm mt-2">
                          <span className="font-medium text-gray-800">Interactions:</span>
                          <ul className="text-gray-600 list-disc list-inside ml-4">
                            {step.interactions.map((interaction, i) => (
                              <li key={i}>{interaction}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {step.potentialFriction && step.potentialFriction.length > 0 && (
                        <div className="text-sm mt-2">
                          <span className="font-medium text-red-600">Potential Friction:</span>
                          <ul className="text-red-600 list-disc list-inside ml-4">
                            {step.potentialFriction.map((friction, i) => (
                              <li key={i}>{friction}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Drop-off Prevention</h5>
                    <ul className="text-gray-600 list-disc list-inside">
                      {aiAnalysis.detailedFlows.onboardingFlow.dropOffPrevention.map((prevention, i) => (
                        <li key={i}>{prevention}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Alternative Paths</h5>
                    <ul className="text-gray-600 list-disc list-inside">
                      {aiAnalysis.detailedFlows.onboardingFlow.alternativePaths.map((path, i) => (
                        <li key={i}>{path}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Core User Flow */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5 text-blue-500" />
                  {aiAnalysis.detailedFlows.coreUserFlow.flowName}
                </CardTitle>
                <CardDescription>{aiAnalysis.detailedFlows.coreUserFlow.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {aiAnalysis.detailedFlows.coreUserFlow.steps.map((step, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-blue-50">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {step.screenName}
                      </h4>
                      <p className="text-gray-600 text-sm mb-2">{step.purpose}</p>
                      
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        {step.userValue && (
                          <div>
                            <span className="font-medium text-gray-800">User Value:</span>
                            <p className="text-gray-600">{step.userValue}</p>
                          </div>
                        )}
                        {step.businessValue && (
                          <div>
                            <span className="font-medium text-gray-800">Business Value:</span>
                            <p className="text-gray-600">{step.businessValue}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {aiAnalysis.detailedFlows.coreUserFlow.optimizationOpportunities.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">Optimization Opportunities</h5>
                    <ul className="text-gray-600 text-sm list-disc list-inside">
                      {aiAnalysis.detailedFlows.coreUserFlow.optimizationOpportunities.map((opportunity, i) => (
                        <li key={i}>{opportunity}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Navigation Design */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-indigo-500" />
                Navigation Design
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Primary Navigation</h4>
                <div className="grid gap-3">
                  {aiAnalysis.navigationDesign.informationArchitecture.primaryNavigation.map((nav, index) => (
                    <div key={index} className={`border rounded-lg p-3 ${getPriorityColor(nav.priority)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-medium">{nav.section}</h5>
                        <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                          {nav.priority} Priority
                        </span>
                      </div>
                      <p className="text-sm opacity-80">{nav.purpose}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Mobile Navigation</h5>
                  <p className="text-gray-600">{aiAnalysis.navigationDesign.navigationPatterns.mobileNavigation}</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Desktop Navigation</h5>
                  <p className="text-gray-600">{aiAnalysis.navigationDesign.navigationPatterns.desktopNavigation}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interaction Design */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-5 w-5 text-orange-500" />
                Interaction Design
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Key Interactions</h4>
                <div className="space-y-3">
                  {aiAnalysis.interactionDesign.keyInteractions.map((interaction, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-orange-50">
                      <h5 className="font-medium text-gray-900">{interaction.interaction}</h5>
                      <div className="grid md:grid-cols-2 gap-3 text-sm mt-2">
                        <div>
                          <span className="font-medium text-gray-800">Context:</span>
                          <p className="text-gray-600">{interaction.context}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">Method:</span>
                          <p className="text-gray-600">{interaction.method}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Primary Gestures</h5>
                  <ul className="text-gray-600 list-disc list-inside">
                    {aiAnalysis.interactionDesign.gestureStrategy.primaryGestures.map((gesture, i) => (
                      <li key={i}>{gesture}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Feedback Systems</h5>
                  <p className="text-gray-600">{aiAnalysis.interactionDesign.feedbackSystems.visualFeedback}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Implementation Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Implementation Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Priority Flows</h4>
                <div className="space-y-3">
                  {aiAnalysis.implementationRecommendations.priorityFlows.map((flow, index) => (
                    <div key={index} className={`border rounded-lg p-3 ${getPriorityColor(flow.priority)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{flow.flow}</h5>
                        <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                          {flow.priority} Priority
                        </span>
                      </div>
                      <p className="text-sm opacity-80 mb-2">{flow.reasoning}</p>
                      <div className="text-xs">
                        <span className="font-medium">Testing:</span> {flow.testingStrategy}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Low Fidelity Focus</h5>
                  <ul className="text-gray-600 list-disc list-inside">
                    {aiAnalysis.implementationRecommendations.prototypeStrategy.lowFidelityFocus.map((focus, i) => (
                      <li key={i}>{focus}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">High Fidelity Focus</h5>
                  <ul className="text-gray-600 list-disc list-inside">
                    {aiAnalysis.implementationRecommendations.prototypeStrategy.highFidelityFocus.map((focus, i) => (
                      <li key={i}>{focus}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Step Button */}
          <div className="flex justify-center pt-4">
            <Button onClick={onNext} size="lg" className="px-8">
              Continue to Step 6: Technical Architecture
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}