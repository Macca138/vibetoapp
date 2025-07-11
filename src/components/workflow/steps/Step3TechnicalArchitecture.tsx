'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Settings, Code, Database, ArrowLeft } from 'lucide-react';
import QuestionResponseSection from '@/components/workflow/QuestionResponseSection';
import AnalysisEvolutionView from '@/components/workflow/AnalysisEvolutionView';
import { AnalysisIteration, Question } from '@/lib/workflow/types';

interface Step3Data {
  technicalRequirements: string;
  scalabilityNeeds: string;
  performanceExpectations: string;
}

interface Step3Output {
  technicalArchitecture: string;
  systemDiagram: string;
  components: {
    mvpFeatures: any;
    techStack: any;
    scalabilityConsiderations: any;
    architectureDecisions: any;
  };
  clarificationQuestions: Question[];
  readyForNextStep: boolean;
  confidenceScore?: number;
  iterationNotes?: string[];
}

// AnalysisIteration type is now imported from central types file

interface Step3Props {
  projectId: string;
  initialData?: Step3Data;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious?: () => void;
}

export default function Step3TechnicalArchitecture({ 
  projectId, 
  initialData, 
  onComplete, 
  onNext,
  onPrevious
}: Step3Props) {
  const [formData, setFormData] = useState<Step3Data>({
    technicalRequirements: initialData?.technicalRequirements || '',
    scalabilityNeeds: initialData?.scalabilityNeeds || '',
    performanceExpectations: initialData?.performanceExpectations || ''
  });

  const [iterations, setIterations] = useState<AnalysisIteration[]>([]);
  const [currentIterationIndex, setCurrentIterationIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialSubmission, setIsInitialSubmission] = useState(true);
  
  const currentIteration = currentIterationIndex >= 0 ? iterations[currentIterationIndex] : null;
  const currentOutput = currentIteration?.analysis;

  const handleInputChange = (field: keyof Step3Data, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.technicalRequirements.trim()) {
      setError('Please describe your technical requirements');
      return;
    }

    if (formData.technicalRequirements.length < 20) {
      setError('Technical requirements must be at least 20 characters');
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
      
      // Create new iteration
      const newIteration: AnalysisIteration = {
        id: `iteration-${Date.now()}`,
        analysis: result.data,
        timestamp: new Date(),
        userInput: formData,
        questionsAsked: result.data.clarificationQuestions || [],
        changesFromPrevious: currentIteration ? ['Initial technical architecture completed'] : undefined
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
      const response = await fetch('/api/workflow/step3/clarify', {
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
        changesFromPrevious: result.data.iterationNotes || ['Architecture refined based on your responses']
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

  const isFormValid = formData.technicalRequirements.length >= 20;

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
            <h1 className="text-3xl font-bold text-gray-900">High Level Technical Architecture</h1>
            <p className="text-lg text-gray-600 mt-2">
              Define the technical foundation for your application
            </p>
          </div>
        </div>
      </div>

      {/* Input Form - Only show if no analysis yet */}
      {isInitialSubmission && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-500" />
              Technical Requirements
            </CardTitle>
            <CardDescription>
              Help us understand your technical needs so we can design the right architecture for your app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="technicalRequirements" className="text-base font-medium">
                What are your key technical requirements? *
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Describe specific technical needs, integrations, or capabilities your app requires
              </p>
              <Textarea
                id="technicalRequirements"
                placeholder="My app needs to handle real-time data, integrate with payment systems, support mobile access..."
                value={formData.technicalRequirements}
                onChange={(e) => handleInputChange('technicalRequirements', e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={600}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.technicalRequirements.length}/600 characters (minimum 20)
              </div>
            </div>

            <div>
              <Label htmlFor="scalabilityNeeds" className="text-base font-medium">
                What are your scalability expectations?
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                How do you expect your app to grow? Any specific performance requirements?
              </p>
              <Textarea
                id="scalabilityNeeds"
                placeholder="I expect to start with hundreds of users and scale to thousands within the first year..."
                value={formData.scalabilityNeeds}
                onChange={(e) => handleInputChange('scalabilityNeeds', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={400}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.scalabilityNeeds.length}/400 characters
              </div>
            </div>

            <div>
              <Label htmlFor="performanceExpectations" className="text-base font-medium">
                Any specific performance expectations?
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Response times, uptime requirements, geographic considerations, etc.
              </p>
              <Textarea
                id="performanceExpectations"
                placeholder="The app should load within 2 seconds, support users globally, 99.9% uptime..."
                value={formData.performanceExpectations}
                onChange={(e) => handleInputChange('performanceExpectations', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={400}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.performanceExpectations.length}/400 characters
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
                  AI is designing your technical architecture...
                </>
              ) : (
                'Generate Technical Architecture with AI'
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

      {/* Technical Architecture Results */}
      {currentOutput && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Technical Architecture */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-blue-500" />
                Your Technical Architecture
              </CardTitle>
              <CardDescription>
                {currentOutput.readyForNextStep 
                  ? 'Your technical architecture is complete and ready for the next step!'
                  : 'We can refine this architecture further with additional details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div 
                  className="text-gray-700 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: currentOutput.technicalArchitecture
                      .replace(/## (.*)/g, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
                      .replace(/### (.*)/g, '<h4 class="text-base font-medium text-gray-800 mt-3 mb-1">$1</h4>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/- (.*)/g, '<li class="flex items-start gap-2"><span class="text-blue-500">\u2022</span><span>$1</span></li>')
                  }}
                />
              </div>
              
              {/* System Diagram */}
              {currentOutput.systemDiagram && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    System Architecture Diagram
                  </h4>
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap font-mono">
                    {currentOutput.systemDiagram}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clarification Questions */}
          {currentOutput.clarificationQuestions && currentOutput.clarificationQuestions.length > 0 && (
            <QuestionResponseSection
              questions={currentOutput.clarificationQuestions}
              onResponsesSubmit={handleClarificationResponse}
              onSkip={handleSkipClarification}
              isProcessing={isProcessing}
              title="Let's Refine Your Technical Architecture"
              description="Answer these questions to improve the technical architecture for your application"
              allowSkip={true}
            />
          )}

          {/* Next Step Actions */}
          {currentOutput.readyForNextStep && (
            <div className="flex justify-center pt-4">
              <Button onClick={onNext} size="lg" className="px-8">
                Continue to Step 4: Feature Stories & UX Flows
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