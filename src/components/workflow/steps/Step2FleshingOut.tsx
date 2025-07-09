'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Target, Users, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';

interface Step2Data {
  valueProp: string;
  uniqueness: string;
  coreFeatures: string;
}

interface BusinessConcept {
  elevatorPitch: string;
  problemStatement: string;
  targetMarket: string;
  uniqueSellingProposition: string;
}

interface PersonaData {
  description: string;
  demographics: string;
  painPoints: string[];
  motivations: string[];
  behaviorPatterns: string;
}

interface AIAnalysis {
  businessConcept: BusinessConcept;
  audienceAnalysis: {
    primaryPersona: PersonaData;
    secondaryPersona: {
      description: string;
      demographics: string;
      relationshipToPrimary: string;
    };
  };
  marketAnalysis: {
    marketSize: string;
    competitorLandscape: string;
    competitiveAdvantage: string[];
    marketTrends: string;
  };
  businessStrategy: {
    revenueStreams: string[];
    marketingStrategy: string;
    keyMetrics: string[];
    riskFactors: string[];
    mitigationStrategies: string[];
  };
  nextSteps: {
    validationQuestions: string[];
    researchRecommendations: string[];
    mvpSuggestions: string[];
  };
}

interface Step2Props {
  projectId: string;
  initialData?: Step2Data;
  onComplete: (data: any) => void;
  onNext: () => void;
}

export default function Step2FleshingOut({ 
  projectId, 
  initialData, 
  onComplete, 
  onNext 
}: Step2Props) {
  const [formData, setFormData] = useState<Step2Data>({
    valueProp: initialData?.valueProp || '',
    uniqueness: initialData?.uniqueness || '',
    coreFeatures: initialData?.coreFeatures || ''
  });

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof Step2Data, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.valueProp.trim() || !formData.uniqueness.trim() || !formData.coreFeatures.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.valueProp.length < 20 || formData.uniqueness.length < 20 || formData.coreFeatures.length < 20) {
      setError('Each field must be at least 20 characters');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/workflow/step2', {
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

  const isFormValid = formData.valueProp.length >= 20 && formData.uniqueness.length >= 20 && formData.coreFeatures.length >= 20;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Define Your Core Purpose</h1>
        <p className="text-lg text-gray-600 mt-2">
          Let&apos;s clarify what makes your app unique and valuable to users
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Refine Your Value Proposition
          </CardTitle>
          <CardDescription>
            Building on your initial idea, let&apos;s define what makes your app compelling and different from existing solutions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="valueProp" className="text-base font-medium">
              What is your app&apos;s main value proposition? *
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              In one clear sentence, what makes your app valuable?
            </p>
            <Textarea
              id="valueProp"
              placeholder="My app provides unique value by..."
              value={formData.valueProp}
              onChange={(e) => handleInputChange('valueProp', e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={300}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.valueProp.length}/300 characters (minimum 20)
            </div>
          </div>

          <div>
            <Label htmlFor="uniqueness" className="text-base font-medium">
              What makes your app different from existing solutions? *
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Focus on your competitive advantages
            </p>
            <Textarea
              id="uniqueness"
              placeholder="Unlike other apps, mine will..."
              value={formData.uniqueness}
              onChange={(e) => handleInputChange('uniqueness', e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.uniqueness.length}/500 characters (minimum 20)
            </div>
          </div>

          <div>
            <Label htmlFor="coreFeatures" className="text-base font-medium">
              What are the 3 most important features? *
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              List the essential features that deliver your core value
            </p>
            <Textarea
              id="coreFeatures"
              placeholder="1. Feature one&#10;2. Feature two&#10;3. Feature three"
              value={formData.coreFeatures}
              onChange={(e) => handleInputChange('coreFeatures', e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={400}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.coreFeatures.length}/400 characters (minimum 20)
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
                AI is building your business concept...
              </>
            ) : (
              'Generate Business Concept with AI'
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
          {/* Business Concept */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Your Business Concept
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Elevator Pitch</h4>
                <p className="text-gray-700 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  {aiAnalysis.businessConcept.elevatorPitch}
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Problem Statement</h4>
                  <p className="text-gray-600 text-sm">{aiAnalysis.businessConcept.problemStatement}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Target Market</h4>
                  <p className="text-gray-600 text-sm">{aiAnalysis.businessConcept.targetMarket}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Unique Selling Proposition</h4>
                <p className="text-gray-600 text-sm">{aiAnalysis.businessConcept.uniqueSellingProposition}</p>
              </div>
            </CardContent>
          </Card>

          {/* Audience Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                Target Audience Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Primary Persona</h4>
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-gray-800">Description</h5>
                      <p className="text-gray-600 text-sm">{aiAnalysis.audienceAnalysis.primaryPersona.description}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800">Demographics</h5>
                      <p className="text-gray-600 text-sm">{aiAnalysis.audienceAnalysis.primaryPersona.demographics}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800">Pain Points</h5>
                      <ul className="text-gray-600 text-sm list-disc list-inside">
                        {aiAnalysis.audienceAnalysis.primaryPersona.painPoints.map((point, index) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Secondary Persona</h4>
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-gray-800">Description</h5>
                      <p className="text-gray-600 text-sm">{aiAnalysis.audienceAnalysis.secondaryPersona.description}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800">Demographics</h5>
                      <p className="text-gray-600 text-sm">{aiAnalysis.audienceAnalysis.secondaryPersona.demographics}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800">Relationship to Primary</h5>
                      <p className="text-gray-600 text-sm">{aiAnalysis.audienceAnalysis.secondaryPersona.relationshipToPrimary}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market & Business Strategy */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  Market Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h5 className="font-medium text-gray-800">Market Size</h5>
                  <p className="text-gray-600 text-sm">{aiAnalysis.marketAnalysis.marketSize}</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-800">Competitive Advantages</h5>
                  <ul className="text-gray-600 text-sm list-disc list-inside">
                    {aiAnalysis.marketAnalysis.competitiveAdvantage.map((advantage, index) => (
                      <li key={index}>{advantage}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-gray-800">Market Trends</h5>
                  <p className="text-gray-600 text-sm">{aiAnalysis.marketAnalysis.marketTrends}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Business Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h5 className="font-medium text-gray-800">Revenue Streams</h5>
                  <ul className="text-gray-600 text-sm list-disc list-inside">
                    {aiAnalysis.businessStrategy.revenueStreams.map((stream, index) => (
                      <li key={index}>{stream}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-gray-800">Key Metrics</h5>
                  <ul className="text-gray-600 text-sm list-disc list-inside">
                    {aiAnalysis.businessStrategy.keyMetrics.map((metric, index) => (
                      <li key={index}>{metric}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-gray-800">Marketing Strategy</h5>
                  <p className="text-gray-600 text-sm">{aiAnalysis.businessStrategy.marketingStrategy}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-orange-500" />
                Recommended Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Validation Questions</h5>
                  <ul className="space-y-1">
                    {aiAnalysis.nextSteps.validationQuestions.map((question, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">Research Recommendations</h5>
                  <ul className="space-y-1">
                    {aiAnalysis.nextSteps.researchRecommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-800 mb-2">MVP Suggestions</h5>
                  <ul className="space-y-1">
                    {aiAnalysis.nextSteps.mvpSuggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">{suggestion}</span>
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
              Continue to Step 3: Target Users
            </Button>
          </div>
        </m.div>
      )}
    </div>
  );
}