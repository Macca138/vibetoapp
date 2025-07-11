'use client';

import { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Lightbulb, Target, CheckCircle } from 'lucide-react';
import { useAutoSave } from '@/hooks/useAutoSave';
import AutoSaveIndicator from '../AutoSaveIndicator';
import QuestionResponseSection from '../QuestionResponseSection';
import AnalysisEvolutionView from '../AnalysisEvolutionView';
import { AnalysisIteration, Question } from '@/lib/workflow/types';

interface Step1Data {
  appDescription: string;
}

interface Step1Output {
  projectOutline: {
    problemStatement: string;
    targetAudience: string;
    coreSolution: string;
    uniqueValue: string;
    keyFeatures: string[];
    successMetrics: string;
  };
  refinedPrompt: {
    system: string;
    context: string;
    instructions: string;
  };
  clarificationQuestions: string[];
  readyForNextStep: boolean;
}

// AnalysisIteration type is now imported from central types file

interface Step1Props {
  projectId: string;
  initialData?: Step1Data;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious?: () => void;
}

export default function Step1ArticulateIdea({ 
  projectId, 
  initialData, 
  onComplete, 
  onNext,
  onPrevious
}: Step1Props) {
  const [formData, setFormData] = useState<Step1Data>({
    appDescription: initialData?.appDescription || 
                   initialData?.appIdea || 
                   initialData?.userInput?.appIdea || 
                   initialData?.userInput?.appDescription || 
                   '',
  });

  // Interactive session state
  const [analysisIterations, setAnalysisIterations] = useState<AnalysisIteration[]>([]);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Current output is the latest iteration
  const currentOutput = analysisIterations[currentIteration]?.output || null;

  // Update form data when initialData changes
  useEffect(() => {
    console.log('Step1 initialData:', initialData);
    if (initialData) {
      // Try different possible data structures
      const description = 
        initialData.appDescription || 
        initialData.appIdea || 
        initialData.userInput?.appIdea || 
        initialData.userInput?.appDescription || 
        '';
      console.log('Setting appDescription to:', description);
      setFormData({
        appDescription: description,
      });
    }
  }, [initialData]);

  // Auto-save functionality
  const autoSave = useAutoSave(formData, {
    onSave: async (data) => {
      await fetch(`/api/projects/${projectId}/save`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: 1,
          responses: data,
          completed: false,
        }),
      });
    },
    delay: 3000,
    enabled: !!formData.appDescription,
  });

  const handleInputChange = (field: keyof Step1Data, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const convertClarificationToQuestions = (clarificationQuestions: string[]): Question[] => {
    return clarificationQuestions.map((question, index) => ({
      id: `clarification_${index}`,
      text: question,
      type: 'textarea' as const,
      required: false,
      minLength: 10,
      placeholder: "Share your thoughts..."
    }));
  };

  const handleInitialSubmit = async () => {
    if (!formData.appDescription.trim()) {
      setError('Please describe your app idea');
      return;
    }

    if (formData.appDescription.length < 100) {
      setError('Please provide at least 100 characters describing your app idea, problem it solves, and basic features');
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
          appIdea: formData.appDescription,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process step');
      }

      const result = await response.json();
      const output = result.data;
      
      // Create first iteration
      const firstIteration: AnalysisIteration = {
        id: `iteration_${Date.now()}`,
        output,
        timestamp: new Date(),
      };

      setAnalysisIterations([firstIteration]);
      setCurrentIteration(0);

      // Convert clarification questions to interactive questions if not ready for next step
      if (!output.readyForNextStep && output.clarificationQuestions && output.clarificationQuestions.length > 0) {
        const questions = convertClarificationToQuestions(output.clarificationQuestions);
        setCurrentQuestions(questions);
        setIsAwaitingResponse(true);
      } else {
        // Ready for next step
        setCurrentQuestions([]);
        setIsAwaitingResponse(false);
      }

      onComplete(output);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuestionResponses = async (responses: Record<string, string>) => {
    setIsProcessing(true);
    setError(null);

    try {
      // TODO: This will be replaced with the iterative API endpoint
      const response = await fetch('/api/workflow/step1/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          sessionId,
          responses,
          previousOutput: analysisIterations[currentIteration].output
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process clarification');
      }

      const result = await response.json();
      const refinedOutput = result.data;

      // Create new iteration
      const newIteration: AnalysisIteration = {
        id: `iteration_${Date.now()}`,
        output: refinedOutput,
        timestamp: new Date(),
        changesFromPrevious: result.changes || [],
        questionsAsked: currentQuestions,
        responsesReceived: responses
      };

      const newIterations = [...analysisIterations, newIteration];
      setAnalysisIterations(newIterations);
      setCurrentIteration(newIterations.length - 1);

      // Check if more questions are needed
      if (!refinedOutput.readyForNextStep && refinedOutput.clarificationQuestions && refinedOutput.clarificationQuestions.length > 0) {
        const questions = convertClarificationToQuestions(refinedOutput.clarificationQuestions);
        setCurrentQuestions(questions);
        setIsAwaitingResponse(true);
      } else {
        setCurrentQuestions([]);
        setIsAwaitingResponse(false);
      }

      onComplete(refinedOutput);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipQuestions = () => {
    setCurrentQuestions([]);
    setIsAwaitingResponse(false);
  };

  const isFormValid = formData.appDescription.length >= 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Describe Your App Idea</h1>
        <p className="text-lg text-gray-800 mt-2">
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
            <Label htmlFor="appDescription" className="text-base font-medium text-gray-900">
              Describe your app idea and what problem it solves. Include 3-4 basic features you envision. *
            </Label>
            <p className="text-sm text-gray-700 mb-2">
              Share your complete app concept - the problem it addresses, who it&apos;s for, and the key features you envision.
            </p>
            <Textarea
              id="appDescription"
              placeholder="I want to create an app that solves [problem] for [target users] by providing [solution]. The main features would include: 1) [feature], 2) [feature], 3) [feature], 4) [feature]..."
              value={formData.appDescription}
              onChange={(e) => handleInputChange('appDescription', e.target.value)}
              className="min-h-[200px] resize-none"
              maxLength={2000}
            />
            <div className="text-sm text-gray-600 mt-1">
              {formData.appDescription.length}/2000 characters (minimum 100)
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <Button
            onClick={handleInitialSubmit}
            disabled={!isFormValid || isProcessing || analysisIterations.length > 0}
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

      {/* Project Outline Results */}
      {currentOutput && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          {/* Project Outline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Your Project Outline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Problem Statement</h4>
                <p className="text-gray-700 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                  {currentOutput.projectOutline.problemStatement}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Target Audience</h4>
                  <p className="text-gray-600">{currentOutput.projectOutline.targetAudience}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Core Solution</h4>
                  <p className="text-gray-600">{currentOutput.projectOutline.coreSolution}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Unique Value</h4>
                  <p className="text-gray-600">{currentOutput.projectOutline.uniqueValue}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Success Metrics</h4>
                  <p className="text-gray-600">{currentOutput.projectOutline.successMetrics}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Key Features</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  {currentOutput.projectOutline.keyFeatures.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Readiness Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentOutput.readyForNextStep ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Target className="h-5 w-5 text-yellow-500" />
                )}
                Project Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentOutput.readyForNextStep ? (
                <div className="text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="font-medium">✅ Ready for detailed planning!</p>
                  <p className="text-sm mt-1">Your project outline is complete and ready for Step 2.</p>
                </div>
              ) : (
                <div className="text-yellow-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="font-medium">⚡ Additional clarification needed</p>
                  <p className="text-sm mt-1">Please answer the questions below to complete your project outline.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Evolution View */}
          {analysisIterations.length > 1 && (
            <AnalysisEvolutionView
              iterations={analysisIterations}
              currentIteration={currentIteration}
              onViewIteration={setCurrentIteration}
              className="mt-6"
            />
          )}

          {/* Interactive Question Response Section */}
          {isAwaitingResponse && currentQuestions.length > 0 && (
            <QuestionResponseSection
              questions={currentQuestions}
              onResponsesSubmit={handleQuestionResponses}
              onSkip={handleSkipQuestions}
              isProcessing={isProcessing}
              title="Help Us Refine Your Analysis"
              description="Answer these questions to get more specific and personalized insights about your app idea."
              allowSkip={true}
              className="mt-6"
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4">
            <div>
              {onPrevious && (
                <Button 
                  onClick={onPrevious}
                  variant="outline"
                  size="lg"
                  className="px-6"
                >
                  ← Back to Dashboard
                </Button>
              )}
            </div>
            <Button 
              onClick={onNext} 
              size="lg" 
              className="px-8"
              disabled={!currentOutput.readyForNextStep || (isAwaitingResponse && currentQuestions.length > 0)}
            >
              {!currentOutput.readyForNextStep ? 
                'Complete clarification to continue' : 
                isAwaitingResponse ? 
                  'Answer questions above to continue' : 
                  'Continue to Step 2: Detailed Planning'
              }
            </Button>
          </div>
        </m.div>
      )}

      {/* Auto-save indicator */}
      <div className="fixed bottom-4 right-4 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-lg">
        <AutoSaveIndicator
          status={autoSave.status}
          error={autoSave.error}
          lastSaved={autoSave.lastSaved}
        />
      </div>
    </div>
  );
}