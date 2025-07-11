'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, ListTodo, ArrowLeft, Clock, Target, Zap } from 'lucide-react';
import QuestionResponseSection, { Question } from '@/components/workflow/QuestionResponseSection';
import AnalysisEvolutionView from '@/components/workflow/AnalysisEvolutionView';

interface Step9Data {
  developmentApproach: string;
  timelinePreferences: string;
  taskGranularity: string;
  priorityFocus: string;
  implementationConstraints: string;
}

interface Step9Output {
  implementationPlan: string;
  components: {
    taskBreakdown: any;
    timeline: any;
    dependencies: any;
    qualityAssurance: any;
  };
  clarificationQuestions: Question[];
  readyForNextStep: boolean;
  confidenceScore?: number;
  iterationNotes?: string[];
}

interface AnalysisIteration {
  id: string;
  analysis: Step9Output;
  timestamp: Date;
  userInput?: Step9Data;
  questionsAsked?: Question[];
  responsesReceived?: Record<string, string>;
  changesFromPrevious?: string[];
}

interface Step9Props {
  projectId: string;
  initialData?: Step9Data;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious?: () => void;
}

export default function Step9ImplementationPlanning({ 
  projectId, 
  initialData, 
  onComplete, 
  onNext,
  onPrevious
}: Step9Props) {
  const [formData, setFormData] = useState<Step9Data>({
    developmentApproach: initialData?.developmentApproach || '',
    timelinePreferences: initialData?.timelinePreferences || '',
    taskGranularity: initialData?.taskGranularity || '',
    priorityFocus: initialData?.priorityFocus || '',
    implementationConstraints: initialData?.implementationConstraints || ''
  });

  const [iterations, setIterations] = useState<AnalysisIteration[]>([]);
  const [currentIterationIndex, setCurrentIterationIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialSubmission, setIsInitialSubmission] = useState(true);
  
  const currentIteration = currentIterationIndex >= 0 ? iterations[currentIterationIndex] : null;
  const currentOutput = currentIteration?.analysis;

  const handleInputChange = (field: keyof Step9Data, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/workflow/step9', {
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
        changesFromPrevious: currentIteration ? ['Implementation planning completed'] : undefined
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
      const response = await fetch('/api/workflow/step9/clarify', {
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
        changesFromPrevious: result.data.iterationNotes || ['Implementation plan refined based on your responses']
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
            <h1 className="text-3xl font-bold text-gray-900">Implementation Planning</h1>
            <p className="text-lg text-gray-600 mt-2">
              Break down the technical specification into detailed, actionable development tasks
            </p>
          </div>
        </div>
      </div>

      {/* Input Form - Only show if no analysis yet */}
      {isInitialSubmission && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-blue-500" />
              Implementation Planning Preferences
            </CardTitle>
            <CardDescription>
              Help us understand your development preferences to create the most suitable implementation plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="developmentApproach" className="text-base font-medium">
                Development approach preferences (optional)
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Any specific preferences for how you like to approach development
              </p>
              <Textarea
                id="developmentApproach"
                placeholder="I prefer to start with backend APIs first, like to see working features quickly, prefer smaller incremental steps..."
                value={formData.developmentApproach}
                onChange={(e) => handleInputChange('developmentApproach', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.developmentApproach.length}/500 characters
              </div>
            </div>

            <div>
              <Label htmlFor="timelinePreferences" className="text-base font-medium">
                Timeline and milestone preferences (optional)
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                How you prefer to structure development timelines and milestones
              </p>
              <Textarea
                id="timelinePreferences"
                placeholder="I prefer weekly milestones, like to have working demos every 2 weeks, need MVP in 3 months..."
                value={formData.timelinePreferences}
                onChange={(e) => handleInputChange('timelinePreferences', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.timelinePreferences.length}/500 characters
              </div>
            </div>

            <div>
              <Label htmlFor="taskGranularity" className="text-base font-medium">
                Task size and granularity preferences (optional)
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                How detailed and granular you want the implementation tasks to be
              </p>
              <Textarea
                id="taskGranularity"
                placeholder="I prefer very detailed tasks that take 1-2 hours each, like larger tasks I can break down myself, want clear file-by-file instructions..."
                value={formData.taskGranularity}
                onChange={(e) => handleInputChange('taskGranularity', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.taskGranularity.length}/500 characters
              </div>
            </div>

            <div>
              <Label htmlFor="priorityFocus" className="text-base font-medium">
                Priority and focus areas (optional)
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                What aspects of the implementation are most important to you
              </p>
              <Textarea
                id="priorityFocus"
                placeholder="Focus on user experience first, get core functionality working before polish, prioritize mobile responsiveness..."
                value={formData.priorityFocus}
                onChange={(e) => handleInputChange('priorityFocus', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.priorityFocus.length}/500 characters
              </div>
            </div>

            <div>
              <Label htmlFor="implementationConstraints" className="text-base font-medium">
                Implementation constraints (optional)
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Any constraints or limitations that should guide the implementation plan
              </p>
              <Textarea
                id="implementationConstraints"
                placeholder="Single developer with AI assistance, limited time on weekends, need to deploy frequently, specific deployment schedule..."
                value={formData.implementationConstraints}
                onChange={(e) => handleInputChange('implementationConstraints', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={600}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.implementationConstraints.length}/600 characters
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <div>
                  <h4 className="font-medium text-purple-900">Timeline</h4>
                  <p className="text-xs text-purple-700">Detailed milestones</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                <div>
                  <h4 className="font-medium text-purple-900">Tasks</h4>
                  <p className="text-xs text-purple-700">Granular breakdown</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                <div>
                  <h4 className="font-medium text-purple-900">AI-Friendly</h4>
                  <p className="text-xs text-purple-700">Clear boundaries</p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  AI is creating detailed implementation plan...
                </>
              ) : (
                'Generate Detailed Implementation Plan with AI'
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

      {/* Implementation Plan Results */}
      {currentOutput && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Implementation Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-purple-500" />
                Your Detailed Implementation Plan
              </CardTitle>
              <CardDescription>
                {currentOutput.readyForNextStep 
                  ? 'Your implementation plan is complete and ready for development!'
                  : 'We can refine this implementation plan further with additional details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div 
                  className="text-gray-700 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: currentOutput.implementationPlan
                      .replace(/## (.*)/g, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
                      .replace(/### (.*)/g, '<h4 class="text-base font-medium text-gray-800 mt-3 mb-1">$1</h4>')
                      .replace(/#### (.*)/g, '<h5 class="text-sm font-medium text-gray-700 mt-2 mb-1">$1</h5>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\`([^`]+)\`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
                      .replace(/🟢/g, '<span class="inline-flex items-center justify-center w-4 h-4 bg-green-500 text-white text-xs rounded-full">S</span>')
                      .replace(/🟡/g, '<span class="inline-flex items-center justify-center w-4 h-4 bg-yellow-500 text-white text-xs rounded-full">M</span>')
                      .replace(/🔴/g, '<span class="inline-flex items-center justify-center w-4 h-4 bg-red-500 text-white text-xs rounded-full">L</span>')
                      .replace(/\[ \]/g, '<input type="checkbox" class="mr-2" disabled>')
                      .replace(/- (.*)/g, '<li class="flex items-start gap-2 ml-4"><span class="text-purple-500 mt-1">•</span><span>$1</span></li>')
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
              title="Let's Refine Your Implementation Plan"
              description="Answer these questions to improve the implementation task breakdown"
              allowSkip={true}
            />
          )}

          {/* Completion Actions */}
          {currentOutput.readyForNextStep && (
            <div className="flex justify-center pt-4">
              <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                  <CardTitle className="text-green-600">🎉 Workflow Complete!</CardTitle>
                  <CardDescription>
                    Your comprehensive project specification is ready for development
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button onClick={onNext} size="lg" className="px-8">
                    Export & Execute Plan
                  </Button>
                </CardContent>
              </Card>
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