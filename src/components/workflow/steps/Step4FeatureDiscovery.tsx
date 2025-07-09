'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Lightbulb, Zap, Star, Clock, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';

interface Step4Data {
  mustHaveFeatures: string;
  niceToHaveFeatures: string;
  advancedFeatures: string;
  integrations: string;
}

interface Feature {
  name: string;
  description: string;
  userValue: string;
  businessValue: string;
  complexity: string;
  estimatedEffort: string;
  dependencies?: string[];
  successMetrics?: string[];
  innovationPotential?: string;
}

interface PriorityItem {
  feature: string;
  impact: string;
  effort: string;
  recommendation: string;
}

interface AIAnalysis {
  featureAnalysis: {
    coreUserJourneys: Array<{
      journeyName: string;
      description: string;
      currentPainPoints: string[];
      requiredFeatures: string[];
    }>;
    personaFeatureMapping: Array<{
      personaName: string;
      priorityFeatures: string[];
      uniqueNeeds: string[];
      featureUsagePatterns: string;
    }>;
  };
  featureCategories: {
    mustHave: Feature[];
    shouldHave: Feature[];
    couldHave: Feature[];
    wontHave: Array<{
      name: string;
      reason: string;
      futureConsideration: string;
    }>;
  };
  prioritizationMatrix: {
    highImpactLowEffort: PriorityItem[];
    highImpactHighEffort: PriorityItem[];
    quickWins: string[];
    majorBets: string[];
  };
  implementationStrategy: {
    mvpFeatureSet: {
      coreFeatures: string[];
      timeline: string;
      validationApproach: string;
      successCriteria: string;
    };
    developmentPhases: Array<{
      phase: string;
      duration: string;
      features: string[];
      goals: string[];
      risks: string[];
      mitigations: string[];
    }>;
    technicalConsiderations: {
      architectureRequirements: string[];
      scalabilityFactors: string[];
      integrationNeeds: string[];
      securityConsiderations: string[];
    };
  };
  validationRecommendations: {
    featureTesting: Array<{
      feature: string;
      testingMethod: string;
      successMetrics: string[];
      timeline: string;
    }>;
    prototypeRecommendations: string[];
    userFeedbackPlan: string;
  };
}

interface Step4Props {
  projectId: string;
  initialData?: Step4Data;
  onComplete: (data: any) => void;
  onNext: () => void;
}

export default function Step4FeatureDiscovery({ 
  projectId, 
  initialData, 
  onComplete, 
  onNext 
}: Step4Props) {
  const [formData, setFormData] = useState<Step4Data>({
    mustHaveFeatures: initialData?.mustHaveFeatures || '',
    niceToHaveFeatures: initialData?.niceToHaveFeatures || '',
    advancedFeatures: initialData?.advancedFeatures || '',
    integrations: initialData?.integrations || ''
  });

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof Step4Data, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.mustHaveFeatures.trim()) {
      setError('Please define at least the must-have features');
      return;
    }

    if (formData.mustHaveFeatures.length < 20) {
      setError('Must-have features must be at least 20 characters');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/workflow/step4', {
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

  const getComplexityColor = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getComplexityIcon = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case 'low': return <CheckCircle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const isFormValid = formData.mustHaveFeatures.length >= 20;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Feature Discovery</h1>
        <p className="text-lg text-gray-600 mt-2">
          Brainstorm and prioritize features that deliver maximum value to your users
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Define Your Feature Set
          </CardTitle>
          <CardDescription>
            Let&apos;s explore all the features your app could have and prioritize them based on user value and implementation complexity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="mustHaveFeatures" className="text-base font-medium">
              Must-have features (MVP) *
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Essential features for your minimum viable product
            </p>
            <Textarea
              id="mustHaveFeatures"
              placeholder="• Feature 1&#10;• Feature 2&#10;• Feature 3"
              value={formData.mustHaveFeatures}
              onChange={(e) => handleInputChange('mustHaveFeatures', e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={600}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.mustHaveFeatures.length}/600 characters (minimum 20)
            </div>
          </div>

          <div>
            <Label htmlFor="niceToHaveFeatures" className="text-base font-medium">
              Nice-to-have features
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Features to add after your MVP is successful
            </p>
            <Textarea
              id="niceToHaveFeatures"
              placeholder="• Additional feature 1&#10;• Additional feature 2"
              value={formData.niceToHaveFeatures}
              onChange={(e) => handleInputChange('niceToHaveFeatures', e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={600}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.niceToHaveFeatures.length}/600 characters
            </div>
          </div>

          <div>
            <Label htmlFor="advancedFeatures" className="text-base font-medium">
              Advanced/future features
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Long-term vision features
            </p>
            <Textarea
              id="advancedFeatures"
              placeholder="• Advanced feature 1&#10;• Future enhancement"
              value={formData.advancedFeatures}
              onChange={(e) => handleInputChange('advancedFeatures', e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={600}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.advancedFeatures.length}/600 characters
            </div>
          </div>

          <div>
            <Label htmlFor="integrations" className="text-base font-medium">
              What integrations do you need?
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Third-party services your app should connect with
            </p>
            <Textarea
              id="integrations"
              placeholder="Social media, payment processors, APIs..."
              value={formData.integrations}
              onChange={(e) => handleInputChange('integrations', e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={400}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.integrations.length}/400 characters
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
                AI is analyzing and prioritizing features...
              </>
            ) : (
              'Generate Feature Strategy with AI'
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
          {/* Feature Categories */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500" />
              Feature Prioritization
            </h2>
            
            <div className="grid gap-6">
              {/* Must-Have Features */}
              <Card className="border-l-4 border-l-green-400">
                <CardHeader>
                  <CardTitle className="text-green-700 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Must-Have Features (MVP)
                  </CardTitle>
                  <CardDescription>Essential features for your minimum viable product</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {aiAnalysis.featureCategories.mustHave.map((feature, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-green-50">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{feature.name}</h4>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getComplexityColor(feature.complexity)}`}>
                            {getComplexityIcon(feature.complexity)}
                            {feature.complexity}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{feature.description}</p>
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-800">User Value:</span>
                            <p className="text-gray-600">{feature.userValue}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-800">Business Value:</span>
                            <p className="text-gray-600">{feature.businessValue}</p>
                          </div>
                        </div>
                        {feature.estimatedEffort && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium text-gray-800">Estimated Effort:</span>
                            <span className="text-gray-600 ml-1">{feature.estimatedEffort}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Should-Have Features */}
              {aiAnalysis.featureCategories.shouldHave.length > 0 && (
                <Card className="border-l-4 border-l-yellow-400">
                  <CardHeader>
                    <CardTitle className="text-yellow-700 flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Should-Have Features (V2)
                    </CardTitle>
                    <CardDescription>Important features that enhance user experience significantly</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {aiAnalysis.featureCategories.shouldHave.map((feature, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-yellow-50">
                          <div className="flex items-start justify-between mb-1">
                            <h5 className="font-medium text-gray-900">{feature.name}</h5>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getComplexityColor(feature.complexity)}`}>
                              {getComplexityIcon(feature.complexity)}
                              {feature.complexity}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm">{feature.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Could-Have Features */}
              {aiAnalysis.featureCategories.couldHave.length > 0 && (
                <Card className="border-l-4 border-l-blue-400">
                  <CardHeader>
                    <CardTitle className="text-blue-700 flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Could-Have Features (V3+)
                    </CardTitle>
                    <CardDescription>Innovation opportunities and advanced features</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {aiAnalysis.featureCategories.couldHave.map((feature, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-blue-50">
                          <div className="flex items-start justify-between mb-1">
                            <h5 className="font-medium text-gray-900">{feature.name}</h5>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getComplexityColor(feature.complexity)}`}>
                              {getComplexityIcon(feature.complexity)}
                              {feature.complexity}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-1">{feature.description}</p>
                          {feature.innovationPotential && (
                            <p className="text-blue-600 text-sm font-medium">
                              💡 {feature.innovationPotential}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Prioritization Matrix */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-500" />
                  Quick Wins
                </CardTitle>
                <CardDescription>High impact, low effort features</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiAnalysis.prioritizationMatrix.quickWins.map((win, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{win}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-purple-500" />
                  Major Bets
                </CardTitle>
                <CardDescription>High impact, high effort features</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiAnalysis.prioritizationMatrix.majorBets.map((bet, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Star className="w-4 h-4 text-purple-500 mt-1 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{bet}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Implementation Strategy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-blue-500" />
                Implementation Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                <h4 className="font-semibold text-blue-800 mb-2">MVP Feature Set</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-800">Core Features:</span>
                    <ul className="list-disc list-inside text-gray-600 ml-4">
                      {aiAnalysis.implementationStrategy.mvpFeatureSet.coreFeatures.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">Timeline:</span>
                    <span className="text-gray-600 ml-1">{aiAnalysis.implementationStrategy.mvpFeatureSet.timeline}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">Success Criteria:</span>
                    <span className="text-gray-600 ml-1">{aiAnalysis.implementationStrategy.mvpFeatureSet.successCriteria}</span>
                  </div>
                </div>
              </div>

              {aiAnalysis.implementationStrategy.developmentPhases.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Development Phases</h4>
                  <div className="space-y-3">
                    {aiAnalysis.implementationStrategy.developmentPhases.map((phase, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{phase.phase}</h5>
                          <span className="text-sm text-gray-500">{phase.duration}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p><strong>Goals:</strong> {phase.goals.join(', ')}</p>
                          <p><strong>Key Features:</strong> {phase.features.join(', ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validation Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-orange-500" />
                Validation Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">Prototype Recommendations</h5>
                  <ul className="space-y-1">
                    {aiAnalysis.validationRecommendations.prototypeRecommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">User Feedback Strategy</h5>
                  <p className="text-gray-600 text-sm">{aiAnalysis.validationRecommendations.userFeedbackPlan}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Step Button */}
          <div className="flex justify-center pt-4">
            <Button onClick={onNext} size="lg" className="px-8">
              Continue to Step 5: User Flow Mapping
            </Button>
          </div>
        </m.div>
      )}
    </div>
  );
}