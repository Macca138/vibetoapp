'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, User, MapPin, ArrowLeft, Layers } from 'lucide-react';
import QuestionResponseSection from '@/components/workflow/QuestionResponseSection';
import AnalysisEvolutionView from '@/components/workflow/AnalysisEvolutionView';
import { AnalysisIteration, Question } from '@/lib/workflow/types';

interface Step4Data {
  userPersonas: string;
  userJourneys: string;
  featurePriorities: string;
}

interface Step4Output {
  featureStoriesAndFlows: string;
  components: {
    userStories: any;
    uxFlows: any;
    technicalComplexity: any;
    featureValidation: any;
  };
  clarificationQuestions: Question[];
  readyForNextStep: boolean;
  confidenceScore?: number;
  iterationNotes?: string[];
}

// AnalysisIteration type is now imported from central types file

interface Step4Props {
  projectId: string;
  initialData?: Step4Data;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious?: () => void;
}

export default function Step4FeatureStoriesUXFlows({ 
  projectId, 
  initialData, 
  onComplete, 
  onNext,
  onPrevious
}: Step4Props) {
  const [formData, setFormData] = useState<Step4Data>({
    userPersonas: initialData?.userPersonas || '',
    userJourneys: initialData?.userJourneys || '',
    featurePriorities: initialData?.featurePriorities || ''
  });

  const [iterations, setIterations] = useState<AnalysisIteration[]>([]);
  const [currentIterationIndex, setCurrentIterationIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialSubmission, setIsInitialSubmission] = useState(true);
  
  const currentIteration = currentIterationIndex >= 0 ? iterations[currentIterationIndex] : null;
  const currentOutput = currentIteration?.analysis;

  const handleInputChange = (field: keyof Step4Data, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.userPersonas.trim()) {
      setError('Please describe your user personas');
      return;
    }

    if (formData.userPersonas.length < 20) {
      setError('User personas description must be at least 20 characters');
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
      
      // Create new iteration
      const newIteration: AnalysisIteration = {
        id: `iteration-${Date.now()}`,
        analysis: result.data,
        timestamp: new Date(),
        userInput: formData,
        questionsAsked: result.data.clarificationQuestions || [],
        changesFromPrevious: currentIteration ? ['Initial feature stories and UX flows completed'] : undefined
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
      const response = await fetch('/api/workflow/step4/clarify', {
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
        changesFromPrevious: result.data.iterationNotes || ['Feature stories refined based on your responses']
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

  const isFormValid = formData.userPersonas.length >= 20;

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
            <h1 className="text-3xl font-bold text-gray-900">Feature Stories & UX Flows</h1>
            <p className="text-lg text-gray-600 mt-2">
              Create detailed user stories and map out UX flows for your features
            </p>
          </div>
        </div>
      </div>

      {/* Input Form - Only show if no analysis yet */}
      {isInitialSubmission && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Define User Experience
            </CardTitle>
            <CardDescription>
              Help us understand your users and their journeys so we can create detailed user stories and UX flows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="userPersonas" className="text-base font-medium">
                Who are your primary user personas? *
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Describe the main types of users who will interact with your app
              </p>
              <Textarea
                id="userPersonas"
                placeholder="Persona 1: Small business owners who need to manage their inventory...&#10;Persona 2: Freelancers who want to track time..."
                value={formData.userPersonas}
                onChange={(e) => handleInputChange('userPersonas', e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={600}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.userPersonas.length}/600 characters (minimum 20)
              </div>
            </div>

            <div>
              <Label htmlFor="userJourneys" className="text-base font-medium">
                What are the key user journeys?
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Describe the main paths users will take through your app
              </p>
              <Textarea
                id="userJourneys"
                placeholder="Journey 1: New user signs up and creates their first project...&#10;Journey 2: Returning user checks progress and updates status..."
                value={formData.userJourneys}
                onChange={(e) => handleInputChange('userJourneys', e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={600}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.userJourneys.length}/600 characters
              </div>
            </div>

            <div>
              <Label htmlFor="featurePriorities" className="text-base font-medium">
                How would you prioritize the features?
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Which features are most important to which user personas?
              </p>
              <Textarea
                id="featurePriorities"
                placeholder="Small business owners need inventory management most...&#10;Freelancers prioritize time tracking and reporting..."
                value={formData.featurePriorities}
                onChange={(e) => handleInputChange('featurePriorities', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.featurePriorities.length}/500 characters
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
                  AI is creating feature stories and UX flows...
                </>
              ) : (
                'Generate Feature Stories & UX Flows with AI'
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

      {/* Feature Stories & UX Flows Results */}
      {currentOutput && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Feature Stories & UX Flows */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-500" />
                Your Feature Stories & UX Flows
              </CardTitle>
              <CardDescription>
                {currentOutput.readyForNextStep 
                  ? 'Your feature stories and UX flows are complete and ready for the next step!'
                  : 'We can refine these feature stories and flows further with additional details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div 
                  className="text-gray-700 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: currentOutput.featureStoriesAndFlows
                      .replace(/## (.*)/g, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
                      .replace(/### (.*)/g, '<h4 class="text-base font-medium text-gray-800 mt-3 mb-1">$1</h4>')
                      .replace(/#### (.*)/g, '<h5 class="text-sm font-medium text-gray-700 mt-2 mb-1">$1</h5>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/- \[(.*?)\]/g, '<li class="flex items-start gap-2"><span class="text-blue-500">\u2022</span><span>$1</span></li>')
                      .replace(/\* As a (.*?), I want to (.*?), so that (.*?)$/gm, '<div class="bg-blue-50 p-3 rounded-lg my-2 border-l-4 border-blue-400"><p class="text-sm"><strong>As a</strong> $1, <strong>I want to</strong> $2, <strong>so that</strong> $3</p></div>')
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
              title="Let's Refine Your Feature Stories & UX Flows"
              description="Answer these questions to improve the user stories and UX flow details"
              allowSkip={true}
            />
          )}

          {/* Next Step Actions */}
          {currentOutput.readyForNextStep && (
            <div className="flex justify-center pt-4">
              <Button onClick={onNext} size="lg" className="px-8">
                Continue to Step 5: Design System & Style Guide
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