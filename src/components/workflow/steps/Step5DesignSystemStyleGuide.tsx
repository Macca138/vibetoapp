'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Palette, Image, ArrowLeft, Eye } from 'lucide-react';
import QuestionResponseSection from '@/components/workflow/QuestionResponseSection';
import AnalysisEvolutionView from '@/components/workflow/AnalysisEvolutionView';
import { AnalysisIteration, Question } from '@/lib/workflow/types';

interface Step5Data {
  designInspiration: string;
  colorPreferences: string;
  brandPersonality: string;
  platformTargets: string;
}

interface Step5Output {
  designSystemStyleGuide: string;
  components: {
    colorPalette: any;
    typography: any;
    componentStyling: any;
    spacingSystem: any;
    motionAnimation: any;
  };
  clarificationQuestions: Question[];
  readyForNextStep: boolean;
  confidenceScore?: number;
  iterationNotes?: string[];
}

// AnalysisIteration type is now imported from central types file

interface Step5Props {
  projectId: string;
  initialData?: Step5Data;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious?: () => void;
}

export default function Step5DesignSystemStyleGuide({ 
  projectId, 
  initialData, 
  onComplete, 
  onNext,
  onPrevious
}: Step5Props) {
  const [formData, setFormData] = useState<Step5Data>({
    designInspiration: initialData?.designInspiration || '',
    colorPreferences: initialData?.colorPreferences || '',
    brandPersonality: initialData?.brandPersonality || '',
    platformTargets: initialData?.platformTargets || ''
  });

  const [iterations, setIterations] = useState<AnalysisIteration[]>([]);
  const [currentIterationIndex, setCurrentIterationIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialSubmission, setIsInitialSubmission] = useState(true);
  
  const currentIteration = currentIterationIndex >= 0 ? iterations[currentIterationIndex] : null;
  const currentOutput = currentIteration?.analysis;

  const handleInputChange = (field: keyof Step5Data, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.designInspiration.trim() && !formData.colorPreferences.trim() && !formData.brandPersonality.trim()) {
      setError('Please provide at least some design guidance (inspiration, colors, or brand personality)');
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
      
      // Create new iteration
      const newIteration: AnalysisIteration = {
        id: `iteration-${Date.now()}`,
        analysis: result.data,
        timestamp: new Date(),
        userInput: formData,
        questionsAsked: result.data.clarificationQuestions || [],
        changesFromPrevious: currentIteration ? ['Initial design system and style guide completed'] : undefined
      };
      
      setIterations(prev => [...prev, newIteration]);
      setCurrentIterationIndex(iterations.length);
      setIsInitialSubmission(false);
      
      if (result.data.readyForNextStep) {
        onComplete(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleClarificationResponse = async (responses: Record<string, string>) => {
    if (!currentIteration) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/workflow/step5/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          previousAnalysis: currentIteration.analysis,
          userResponses: responses,
          originalInput: currentIteration.userInput
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process clarification');
      }
      
      const result = await response.json();
      
      // Create new iteration with clarification
      const newIteration: AnalysisIteration = {
        id: `iteration-${Date.now()}`,
        analysis: result.data,
        timestamp: new Date(),
        userInput: currentIteration.userInput,
        questionsAsked: result.data.clarificationQuestions || [],
        responsesReceived: responses,
        changesFromPrevious: result.data.iterationNotes || ['Design system refined based on your responses']
      };
      
      setIterations(prev => [...prev, newIteration]);
      setCurrentIterationIndex(iterations.length);
      
      if (result.data.readyForNextStep) {
        onComplete(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSkipClarification = () => {
    if (currentOutput) {
      onComplete(currentOutput);
    }
  };

  const isFormValid = formData.designInspiration.trim() || formData.colorPreferences.trim() || formData.brandPersonality.trim();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          {onPrevious && (
            <Button
              variant="outline"
              onClick={onPrevious}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous Step
            </Button>
          )}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Design System & Style Guide</h1>
            <p className="text-lg text-gray-600 mt-2">
              Create a comprehensive visual identity and design system for your app
            </p>
          </div>
        </div>
      </div>

      {/* Input Form - Only show if no analysis yet */}
      {isInitialSubmission && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-blue-500" />
              Design & Visual Identity
            </CardTitle>
            <CardDescription>
              Help us understand your visual preferences and brand direction to create a cohesive design system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="designInspiration" className="text-base font-medium">
                Design inspiration or visual references
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Describe apps, websites, or design styles you admire. You can also mention specific brands or visual aesthetics.
              </p>
              <Textarea
                id="designInspiration"
                placeholder="I like the clean, minimal design of apps like Notion and Linear. I'm inspired by modern SaaS tools with lots of white space..."
                value={formData.designInspiration}
                onChange={(e) => handleInputChange('designInspiration', e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={600}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.designInspiration.length}/600 characters
              </div>
            </div>

            <div>
              <Label htmlFor="colorPreferences" className="text-base font-medium">
                Color preferences and brand colors
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Any specific colors you want to use? Think about your brand personality and target audience.
              </p>
              <Textarea
                id="colorPreferences"
                placeholder="I prefer blues and greens for a professional, trustworthy feel. Maybe a deep blue primary color with lighter accent colors..."
                value={formData.colorPreferences}
                onChange={(e) => handleInputChange('colorPreferences', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={400}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.colorPreferences.length}/400 characters
              </div>
            </div>

            <div>
              <Label htmlFor="brandPersonality" className="text-base font-medium">
                Brand personality and tone
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                How should your app feel? Professional, playful, modern, friendly, sophisticated?
              </p>
              <Textarea
                id="brandPersonality"
                placeholder="Professional but approachable, modern and clean, trustworthy and reliable. Should feel like a premium tool that's easy to use..."
                value={formData.brandPersonality}
                onChange={(e) => handleInputChange('brandPersonality', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={400}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.brandPersonality.length}/400 characters
              </div>
            </div>

            <div>
              <Label htmlFor="platformTargets" className="text-base font-medium">
                Target platforms and devices
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Which platforms will your app run on? Any specific design considerations?
              </p>
              <Textarea
                id="platformTargets"
                placeholder="Primarily web-based, but should work well on mobile browsers. May build native mobile apps later..."
                value={formData.platformTargets}
                onChange={(e) => handleInputChange('platformTargets', e.target.value)}
                className="min-h-[60px] resize-none"
                maxLength={300}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.platformTargets.length}/300 characters
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="flex items-start gap-3">
                <Image className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Visual Inspiration (Optional)</h4>
                  <p className="text-sm text-blue-700">
                    If you have specific visual references, design examples, or mood boards, describe them in the design inspiration field above. 
                    This helps create a more targeted design system.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  AI is creating your design system...
                </>
              ) : (
                'Generate Design System & Style Guide with AI'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Analysis Evolution View */}
      {iterations.length > 1 && (
        <AnalysisEvolutionView
          iterations={iterations}
          currentIteration={currentIterationIndex}
          onViewIteration={setCurrentIterationIndex}
        />
      )}

      {/* Design System & Style Guide Results */}
      {currentOutput && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Design System & Style Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                Your Design System & Style Guide
              </CardTitle>
              <CardDescription>
                {currentOutput.readyForNextStep 
                  ? 'Your design system and style guide are complete and ready for the next step!'
                  : 'We can refine this design system further with additional details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div 
                  className="text-gray-700 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: currentOutput.designSystemStyleGuide
                      .replace(/## (.*)/g, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
                      .replace(/### (.*)/g, '<h4 class="text-base font-medium text-gray-800 mt-3 mb-1">$1</h4>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g, '<span class="inline-flex items-center gap-2"><span class="w-4 h-4 rounded border" style="background-color: $&"></span><code class="text-sm bg-gray-100 px-1 rounded">$&</code></span>')
                      .replace(/(\d+px|\d+dp)/g, '<code class="text-sm bg-gray-100 px-1 rounded">$1</code>')
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Clarification Questions */}
          {currentOutput.clarificationQuestions && currentOutput.clarificationQuestions.length > 0 && (
            <QuestionResponseSection
              questions={currentOutput.clarificationQuestions}
              onResponsesSubmit={handleClarificationResponse}
              onSkip={handleSkipClarification}
              isProcessing={isProcessing}
              title="Let's Refine Your Design System"
              description="Answer these questions to improve your design system and style guide"
              allowSkip={true}
            />
          )}

          {/* Next Step Actions */}
          {currentOutput.readyForNextStep && (
            <div className="flex justify-center pt-4">
              <Button onClick={onNext} size="lg" className="px-8">
                Continue to Step 6: Screen States Specification
              </Button>
            </div>
          )}
        </m.div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}