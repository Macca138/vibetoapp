'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Lightbulb, Target } from 'lucide-react';

interface Step1Data {
  appIdea: string;
  inspiration: string;
  problemSolving: string;
}

interface AIAnalysis {
  analysis: {
    coreProblem: string;
    targetAudience: string;
    uniqueValue: string;
    marketOpportunity: string;
  };
  refinedConcept: {
    elevatorPitch: string;
    keyFeatures: string[];
    userBenefit: string;
  };
  recommendations: string[];
  followUpQuestions: string[];
}

interface Step1Props {
  projectId: string;
  initialData?: Step1Data;
  onComplete: (data: any) => void;
  onNext: () => void;
}

export default function Step1ArticulateIdea({ 
  projectId, 
  initialData, 
  onComplete, 
  onNext 
}: Step1Props) {
  const [formData, setFormData] = useState<Step1Data>({
    appIdea: initialData?.appIdea || '',
    inspiration: initialData?.inspiration || '',
    problemSolving: initialData?.problemSolving || ''
  });

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof Step1Data, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.appIdea.trim() || !formData.problemSolving.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.appIdea.length < 50) {
      setError('App idea must be at least 50 characters');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/workflow/step1', {
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

  const isFormValid = formData.appIdea.length >= 50 && formData.problemSolving.length >= 10;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Describe Your App Idea</h1>
        <p className="text-lg text-gray-600 mt-2">
          Start with your vision - no matter how rough or incomplete it might be
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Tell Us About Your Idea
          </CardTitle>
          <CardDescription>
            Share your app concept and the problem it solves. Our AI will help refine and clarify your vision.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="appIdea" className="text-base font-medium">
              Describe your app idea *
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Don&apos;t worry about being perfect - just describe what you have in mind!
            </p>
            <Textarea
              id="appIdea"
              placeholder="I want to create an app that..."
              value={formData.appIdea}
              onChange={(e) => handleInputChange('appIdea', e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={1000}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.appIdea.length}/1000 characters (minimum 50)
            </div>
          </div>

          <div>
            <Label htmlFor="inspiration" className="text-base font-medium">
              What inspired this idea?
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Share the story behind your idea
            </p>
            <Textarea
              id="inspiration"
              placeholder="I noticed this problem when..."
              value={formData.inspiration}
              onChange={(e) => handleInputChange('inspiration', e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.inspiration.length}/500 characters
            </div>
          </div>

          <div>
            <Label htmlFor="problemSolving" className="text-base font-medium">
              What problem does it solve? *
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              Focus on the main problem your app addresses
            </p>
            <Textarea
              id="problemSolving"
              placeholder="This app will help people..."
              value={formData.problemSolving}
              onChange={(e) => handleInputChange('problemSolving', e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <div className="text-sm text-gray-400 mt-1">
              {formData.problemSolving.length}/500 characters
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
                AI is analyzing your idea...
              </>
            ) : (
              'Analyze My Idea with AI'
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
          className="space-y-4"
        >
          {/* Analysis Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                AI Analysis of Your Idea
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Core Problem</h4>
                  <p className="text-gray-600">{aiAnalysis.analysis.coreProblem}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Target Audience</h4>
                  <p className="text-gray-600">{aiAnalysis.analysis.targetAudience}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Unique Value</h4>
                  <p className="text-gray-600">{aiAnalysis.analysis.uniqueValue}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Market Opportunity</h4>
                  <p className="text-gray-600">{aiAnalysis.analysis.marketOpportunity}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Refined Concept */}
          <Card>
            <CardHeader>
              <CardTitle>Refined Concept</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Elevator Pitch</h4>
                <p className="text-gray-700 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                  {aiAnalysis.refinedConcept.elevatorPitch}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Key Features</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  {aiAnalysis.refinedConcept.keyFeatures.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Primary User Benefit</h4>
                <p className="text-gray-600">{aiAnalysis.refinedConcept.userBenefit}</p>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations & Questions */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-600">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consider These Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiAnalysis.followUpQuestions.map((question, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-gray-600">{question}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Next Step Button */}
          <div className="flex justify-center pt-4">
            <Button onClick={onNext} size="lg" className="px-8">
              Continue to Next Step
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}