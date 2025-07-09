'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Users, UserCheck, MapPin, Lightbulb, Search, Target } from 'lucide-react';

interface Step3Data {
  primaryAudience: string;
  userProblems: string;
  userBehavior: string;
  demographics: string;
}

interface UserPersona {
  name: string;
  demographic: {
    age: string;
    occupation: string;
    income: string;
    location: string;
    techComfort: string;
  };
  psychographics: {
    values: string[];
    lifestyle: string;
    personalityTraits: string[];
    socialBehavior: string;
  };
  painPoints: string[];
  goals: string[];
  behaviors: {
    currentSolutions: string;
    decisionFactors: string[];
    informationSources: string;
    purchasePatterns: string;
  };
  appUsage: {
    useFrequency: string;
    primaryUseCase: string;
    featurePriorities: string[];
    adoptionBarriers: string[];
  };
  marketingInsights: {
    reachChannels: string[];
    messagingThatResonates: string;
    priceSensitivity: string;
    referralLikelihood: string;
  };
}

interface AIAnalysis {
  userPersonas: UserPersona[];
  userJourneyInsights: {
    commonJourneySteps: string[];
    criticalMoments: string[];
    dropOffPoints: string[];
    engagementTriggers: string[];
  };
  segmentationStrategy: {
    primarySegment: {
      name: string;
      size: string;
      acquisitionStrategy: string;
      retentionStrategy: string;
    };
    secondarySegments: Array<{
      name: string;
      opportunity: string;
      approach: string;
    }>;
  };
  researchRecommendations: {
    validationMethods: string[];
    recruitmentStrategies: string[];
    keyQuestionsToValidate: string[];
  };
}

interface Step3Props {
  projectId: string;
  initialData?: Step3Data;
  onComplete: (data: any) => void;
  onNext: () => void;
}

export default function Step3IdentifyTargetUsers({ 
  projectId, 
  initialData, 
  onComplete, 
  onNext 
}: Step3Props) {
  const [formData, setFormData] = useState<Step3Data>({
    primaryAudience: initialData?.primaryAudience || '',
    userProblems: initialData?.userProblems || '',
    userBehavior: initialData?.userBehavior || '',
    demographics: initialData?.demographics || ''
  });

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof Step3Data, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.primaryAudience.trim() || !formData.userProblems.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.primaryAudience.length < 20 || formData.userProblems.length < 20) {
      setError('Required fields must be at least 20 characters');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/workflow/step3', {
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

  const isFormValid = formData.primaryAudience.length >= 20 && formData.userProblems.length >= 20;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Identify Your Target Users</h1>
        <p className="text-lg text-gray-600 mt-2">
          Discover and define your ideal users with AI-powered persona generation
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            Define Your User Base
          </CardTitle>
          <CardDescription>
            Help us understand who will use your app so we can create detailed user personas and insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="primaryAudience" className="text-base font-medium">
              Who is your primary target audience? *
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Describe your ideal user in detail
            </p>
            <Textarea
              id="primaryAudience"
              placeholder="My main users are..."
              value={formData.primaryAudience}
              onChange={(e) => handleInputChange('primaryAudience', e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={300}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.primaryAudience.length}/300 characters (minimum 20)
            </div>
          </div>

          <div>
            <Label htmlFor="userProblems" className="text-base font-medium">
              What problems do they currently face? *
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              What pain points does your audience experience?
            </p>
            <Textarea
              id="userProblems"
              placeholder="These users struggle with..."
              value={formData.userProblems}
              onChange={(e) => handleInputChange('userProblems', e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.userProblems.length}/500 characters (minimum 20)
            </div>
          </div>

          <div>
            <Label htmlFor="userBehavior" className="text-base font-medium">
              How do they currently solve these problems?
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              What alternatives do they use today?
            </p>
            <Textarea
              id="userBehavior"
              placeholder="Right now, they use..."
              value={formData.userBehavior}
              onChange={(e) => handleInputChange('userBehavior', e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={400}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.userBehavior.length}/400 characters
            </div>
          </div>

          <div>
            <Label htmlFor="demographics" className="text-base font-medium">
              What are their key demographics?
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Age, profession, technical skills, etc.
            </p>
            <Textarea
              id="demographics"
              placeholder="Age range, occupation, tech-savviness..."
              value={formData.demographics}
              onChange={(e) => handleInputChange('demographics', e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={300}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.demographics.length}/300 characters
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
                AI is creating detailed user personas...
              </>
            ) : (
              'Generate User Personas with AI'
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
          {/* User Personas */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-purple-500" />
              User Personas
            </h2>
            <div className="grid gap-6">
              {aiAnalysis.userPersonas.map((persona, index) => (
                <Card key={index} className="border-l-4 border-l-purple-400">
                  <CardHeader>
                    <CardTitle className="text-xl text-purple-700">{persona.name}</CardTitle>
                    <CardDescription className="text-base">
                      {persona.demographic.age} • {persona.demographic.occupation} • {persona.demographic.income}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-semibold text-gray-800 mb-2">Demographics & Tech</h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Location:</strong> {persona.demographic.location}</p>
                          <p><strong>Tech Comfort:</strong> {persona.demographic.techComfort}</p>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-800 mb-2">Lifestyle & Values</h5>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Lifestyle:</strong> {persona.psychographics.lifestyle}</p>
                          <p><strong>Values:</strong> {persona.psychographics.values.join(', ')}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <h5 className="font-semibold text-gray-800 mb-2">Pain Points</h5>
                        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                          {persona.painPoints.map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-800 mb-2">Goals</h5>
                        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                          {persona.goals.map((goal, i) => (
                            <li key={i}>{goal}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-800 mb-2">Feature Priorities</h5>
                        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                          {persona.appUsage.featurePriorities.map((feature, i) => (
                            <li key={i}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-gray-800 mb-2">App Usage Insights</h5>
                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>Use Frequency:</strong> {persona.appUsage.useFrequency}</p>
                          <p><strong>Primary Use Case:</strong> {persona.appUsage.primaryUseCase}</p>
                        </div>
                        <div>
                          <p><strong>Price Sensitivity:</strong> {persona.marketingInsights.priceSensitivity}</p>
                          <p><strong>Referral Likelihood:</strong> {persona.marketingInsights.referralLikelihood}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* User Journey & Segmentation */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  User Journey Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">Critical Moments</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {aiAnalysis.userJourneyInsights.criticalMoments.map((moment, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{moment}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">Engagement Triggers</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {aiAnalysis.userJourneyInsights.engagementTriggers.map((trigger, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{trigger}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">Common Drop-off Points</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {aiAnalysis.userJourneyInsights.dropOffPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  Segmentation Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">Primary Segment</h5>
                  <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                    <p className="font-medium text-green-800">{aiAnalysis.segmentationStrategy.primarySegment.name}</p>
                    <p className="text-sm text-green-600 mt-1">Size: {aiAnalysis.segmentationStrategy.primarySegment.size}</p>
                    <p className="text-sm text-gray-600 mt-2">{aiAnalysis.segmentationStrategy.primarySegment.acquisitionStrategy}</p>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">Secondary Segments</h5>
                  <div className="space-y-2">
                    {aiAnalysis.segmentationStrategy.secondarySegments.map((segment, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium text-gray-800">{segment.name}</p>
                        <p className="text-sm text-gray-600">{segment.opportunity}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Research Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-orange-500" />
                Research Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">Validation Methods</h5>
                  <ul className="space-y-1">
                    {aiAnalysis.researchRecommendations.validationMethods.map((method, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-orange-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">{method}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">Recruitment Strategies</h5>
                  <ul className="space-y-1">
                    {aiAnalysis.researchRecommendations.recruitmentStrategies.map((strategy, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Users className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-semibold text-gray-800 mb-2">Key Questions to Validate</h5>
                  <ul className="space-y-1">
                    {aiAnalysis.researchRecommendations.keyQuestionsToValidate.map((question, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Step Button */}
          <div className="flex justify-center pt-4">
            <Button onClick={onNext} size="lg" className="px-8">
              Continue to Step 4: Feature Discovery
            </Button>
          </div>
        </m.div>
      )}
    </div>
  );
}