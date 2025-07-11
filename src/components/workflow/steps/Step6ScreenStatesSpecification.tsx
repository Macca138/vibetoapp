'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Monitor, ArrowLeft, Smartphone, Tablet } from 'lucide-react';
import QuestionResponseSection from '@/components/workflow/QuestionResponseSection';
import AnalysisEvolutionView from '@/components/workflow/AnalysisEvolutionView';
import { AnalysisIteration, Question } from '@/lib/workflow/types';

interface Step6Data {
  priorityFeatures: string;
  userFlowDetails: string;
  interactionPatterns: string;
  responsiveRequirements: string;
}

interface Step6Output {
  screenStatesSpecification: string;
  components: {
    featureScreens: any;
    stateDefinitions: any;
    responsiveSpecs: any;
    interactionSpecs: any;
  };
  clarificationQuestions: Question[];
  readyForNextStep: boolean;
  confidenceScore?: number;
  iterationNotes?: string[];
}

// AnalysisIteration type is now imported from central types file

interface Step6Props {
  projectId: string;
  initialData?: Step6Data;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious?: () => void;
}

export default function Step6ScreenStatesSpecification({ 
  projectId, 
  initialData, 
  onComplete, 
  onNext,
  onPrevious
}: Step6Props) {
  const [formData, setFormData] = useState<Step6Data>({
    priorityFeatures: initialData?.priorityFeatures || '',
    userFlowDetails: initialData?.userFlowDetails || '',
    interactionPatterns: initialData?.interactionPatterns || '',
    responsiveRequirements: initialData?.responsiveRequirements || ''
  });

  const [iterations, setIterations] = useState<AnalysisIteration[]>([]);
  const [currentIterationIndex, setCurrentIterationIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialSubmission, setIsInitialSubmission] = useState(true);
  
  const currentIteration = currentIterationIndex >= 0 ? iterations[currentIterationIndex] : null;
  const currentOutput = currentIteration?.analysis;

  const handleInputChange = (field: keyof Step6Data, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.priorityFeatures.trim()) {
      setError('Please specify which features to focus on for screen states');
      return;
    }

    if (formData.priorityFeatures.length < 20) {
      setError('Priority features description must be at least 20 characters');
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
      
      // Create new iteration
      const newIteration: AnalysisIteration = {
        id: `iteration-${Date.now()}`,
        analysis: result.data,
        timestamp: new Date(),
        userInput: formData,
        questionsAsked: result.data.clarificationQuestions || [],
        changesFromPrevious: currentIteration ? ['Initial screen states specification completed'] : undefined
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
      const response = await fetch('/api/workflow/step6/clarify', {
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
        changesFromPrevious: result.data.iterationNotes || ['Screen states refined based on your responses']
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

  const isFormValid = formData.priorityFeatures.length >= 20;

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
            <h1 className="text-3xl font-bold text-gray-900">Screen States Specification</h1>
            <p className="text-lg text-gray-600 mt-2">
              Define detailed screen layouts and states for each feature
            </p>
          </div>
        </div>
      </div>

      {/* Input Form - Only show if no analysis yet */}
      {isInitialSubmission && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-500" />
              Screen Design Requirements
            </CardTitle>
            <CardDescription>
              Help us understand your screen design priorities so we can create detailed layouts and state specifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="priorityFeatures" className="text-base font-medium">
                Which features should we prioritize for detailed screen design? *
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                List the most important features that need detailed screen layouts and states
              </p>
              <Textarea
                id="priorityFeatures"
                placeholder="Dashboard feature with data visualization, User profile management, Settings screens, Main workflow feature..."
                value={formData.priorityFeatures}
                onChange={(e) => handleInputChange('priorityFeatures', e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={600}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.priorityFeatures.length}/600 characters (minimum 20)
              </div>
            </div>

            <div>
              <Label htmlFor="userFlowDetails" className="text-base font-medium">
                Are there specific user flow details we should focus on?
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Describe key user interactions or flow transitions that are critical to get right
              </p>
              <Textarea
                id="userFlowDetails"
                placeholder="The onboarding flow needs to be seamless, Data entry forms should be efficient, Navigation between sections should be intuitive..."
                value={formData.userFlowDetails}
                onChange={(e) => handleInputChange('userFlowDetails', e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={600}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.userFlowDetails.length}/600 characters
              </div>
            </div>

            <div>
              <Label htmlFor="interactionPatterns" className="text-base font-medium">
                Any specific interaction patterns or behaviors?
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Describe specific interactions, gestures, or UI behaviors you want
              </p>
              <Textarea
                id="interactionPatterns"
                placeholder="Drag and drop for organizing items, Quick actions with right-click context menus, Smooth animations for state changes..."
                value={formData.interactionPatterns}
                onChange={(e) => handleInputChange('interactionPatterns', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.interactionPatterns.length}/500 characters
              </div>
            </div>

            <div>
              <Label htmlFor="responsiveRequirements" className="text-base font-medium">
                Responsive design considerations
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                How should the design adapt across different screen sizes?
              </p>
              <Textarea
                id="responsiveRequirements"
                placeholder="Mobile-first approach, Sidebar collapses on tablet, Desktop gets additional panels, Touch-friendly buttons on mobile..."
                value={formData.responsiveRequirements}
                onChange={(e) => handleInputChange('responsiveRequirements', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={400}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.responsiveRequirements.length}/400 characters
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-blue-500" />
                <div>
                  <h4 className="font-medium text-blue-900">Mobile</h4>
                  <p className="text-xs text-blue-700">320-768px</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tablet className="h-5 w-5 text-blue-500" />
                <div>
                  <h4 className="font-medium text-blue-900">Tablet</h4>
                  <p className="text-xs text-blue-700">768-1024px</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-500" />
                <div>
                  <h4 className="font-medium text-blue-900">Desktop</h4>
                  <p className="text-xs text-blue-700">1024px+</p>
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
                  AI is creating detailed screen specifications...
                </>
              ) : (
                'Generate Screen States Specification with AI'
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

      {/* Screen States Specification Results */}
      {currentOutput && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Screen States Specification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-500" />
                Your Screen States Specification
              </CardTitle>
              <CardDescription>
                {currentOutput.readyForNextStep 
                  ? 'Your screen states specification is complete and ready for the next step!'
                  : 'We can refine these screen specifications further with additional details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div 
                  className="text-gray-700 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: currentOutput.screenStatesSpecification
                      .replace(/## (.*)/g, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
                      .replace(/### (.*)/g, '<h4 class="text-base font-medium text-gray-800 mt-3 mb-1">$1</h4>')
                      .replace(/#### (.*)/g, '<h5 class="text-sm font-medium text-gray-700 mt-2 mb-1">$5</h5>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/Mobile \((\d+-\d+px)\):/g, '<div class="bg-green-50 p-2 rounded border-l-4 border-green-400 my-2"><strong class="text-green-800">📱 Mobile ($1):</strong>')
                      .replace(/Tablet \((\d+-\d+px)\):/g, '</div><div class="bg-blue-50 p-2 rounded border-l-4 border-blue-400 my-2"><strong class="text-blue-800">📱 Tablet ($1):</strong>')
                      .replace(/Desktop \((\d+px\+)\):/g, '</div><div class="bg-purple-50 p-2 rounded border-l-4 border-purple-400 my-2"><strong class="text-purple-800">🖥️ Desktop ($1):</strong>')
                      .replace(/- (.*)/g, '<li class="flex items-start gap-2 ml-4"><span class="text-blue-500 mt-1">•</span><span>$1</span></li>')
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
              title="Let's Refine Your Screen States"
              description="Answer these questions to improve the screen layouts and interaction details"
              allowSkip={true}
            />
          )}

          {/* Next Step Actions */}
          {currentOutput.readyForNextStep && (
            <div className="flex justify-center pt-4">
              <Button onClick={onNext} size="lg" className="px-8">
                Continue to Step 7: Comprehensive Technical Specification
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