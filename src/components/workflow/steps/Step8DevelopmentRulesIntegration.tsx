'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Settings, ArrowLeft, CheckCircle, Code } from 'lucide-react';
import QuestionResponseSection, { Question } from '@/components/workflow/QuestionResponseSection';
import AnalysisEvolutionView from '@/components/workflow/AnalysisEvolutionView';

interface Step8Data {
  useAutomaticRules: boolean;
  customDevelopmentStandards: string;
  additionalRequirements: string;
  codingStandards: string;
  testingRequirements: string;
}

interface Step8Output {
  developmentRulesSpecification: string;
  components: {
    techStackRules: any;
    codingStandards: any;
    testingStandards: any;
    projectStructure: any;
  };
  clarificationQuestions: Question[];
  readyForNextStep: boolean;
  confidenceScore?: number;
  iterationNotes?: string[];
}

interface AnalysisIteration {
  id: string;
  analysis: Step8Output;
  timestamp: Date;
  userInput?: Step8Data;
  questionsAsked?: Question[];
  responsesReceived?: Record<string, string>;
  changesFromPrevious?: string[];
}

interface Step8Props {
  projectId: string;
  initialData?: Step8Data;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious?: () => void;
}

export default function Step8DevelopmentRulesIntegration({ 
  projectId, 
  initialData, 
  onComplete, 
  onNext,
  onPrevious
}: Step8Props) {
  const [formData, setFormData] = useState<Step8Data>({
    useAutomaticRules: initialData?.useAutomaticRules ?? true,
    customDevelopmentStandards: initialData?.customDevelopmentStandards || '',
    additionalRequirements: initialData?.additionalRequirements || '',
    codingStandards: initialData?.codingStandards || '',
    testingRequirements: initialData?.testingRequirements || ''
  });

  const [iterations, setIterations] = useState<AnalysisIteration[]>([]);
  const [currentIterationIndex, setCurrentIterationIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialSubmission, setIsInitialSubmission] = useState(true);
  
  const currentIteration = currentIterationIndex >= 0 ? iterations[currentIterationIndex] : null;
  const currentOutput = currentIteration?.analysis;

  const handleInputChange = (field: keyof Step8Data, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.useAutomaticRules && !formData.customDevelopmentStandards.trim()) {
      setError('Please either use automatic rules or provide custom development standards');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/workflow/step8', {
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
        changesFromPrevious: currentIteration ? ['Development rules integration completed'] : undefined
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
      const response = await fetch('/api/workflow/step8/clarify', {
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
        changesFromPrevious: result.data.iterationNotes || ['Development rules refined based on your responses']
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

  const isFormValid = formData.useAutomaticRules || formData.customDevelopmentStandards.trim().length > 0;

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
            <h1 className="text-3xl font-bold text-gray-900">Development Rules Integration</h1>
            <p className="text-lg text-gray-600 mt-2">
              Apply best practices and development standards for your tech stack
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
              Development Standards Configuration
            </CardTitle>
            <CardDescription>
              Choose how to apply development standards and best practices to your project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="useAutomaticRules"
                  checked={formData.useAutomaticRules}
                  onCheckedChange={(checked) => handleInputChange('useAutomaticRules', checked as boolean)}
                  disabled={isProcessing}
                />
                <div className="space-y-1">
                  <Label htmlFor="useAutomaticRules" className="text-base font-medium cursor-pointer">
                    Option A (Recommended): Apply automatic tech stack best practices
                  </Label>
                  <p className="text-sm text-gray-500">
                    We'll automatically apply development rules and best practices specific to your chosen technology stack.
                  </p>
                </div>
              </div>

              {!formData.useAutomaticRules && (
                <div className="pl-6 border-l-2 border-gray-200 space-y-4">
                  <div>
                    <Label htmlFor="customDevelopmentStandards" className="text-base font-medium">
                      Option B: Custom development standards
                    </Label>
                    <p className="text-sm text-gray-500 mb-2">
                      Define your own development standards, coding conventions, and best practices
                    </p>
                    <Textarea
                      id="customDevelopmentStandards"
                      placeholder="ESLint configuration with specific rules, file naming conventions, code organization patterns, git workflow standards..."
                      value={formData.customDevelopmentStandards}
                      onChange={(e) => handleInputChange('customDevelopmentStandards', e.target.value)}
                      className="min-h-[120px] resize-none"
                      maxLength={1000}
                      disabled={isProcessing}
                    />
                    <div className="text-sm text-gray-400 mt-1">
                      {formData.customDevelopmentStandards.length}/1000 characters
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="additionalRequirements" className="text-base font-medium">
                Additional development requirements (optional)
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Any specific requirements or modifications to the standard development practices
              </p>
              <Textarea
                id="additionalRequirements"
                placeholder="Specific testing frameworks, deployment requirements, documentation standards, code review processes..."
                value={formData.additionalRequirements}
                onChange={(e) => handleInputChange('additionalRequirements', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={600}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.additionalRequirements.length}/600 characters
              </div>
            </div>

            <div>
              <Label htmlFor="codingStandards" className="text-base font-medium">
                Coding standards preferences (optional)
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Specific coding style preferences, naming conventions, or code organization patterns
              </p>
              <Textarea
                id="codingStandards"
                placeholder="Prefer functional programming patterns, specific variable naming conventions, component organization preferences..."
                value={formData.codingStandards}
                onChange={(e) => handleInputChange('codingStandards', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.codingStandards.length}/500 characters
              </div>
            </div>

            <div>
              <Label htmlFor="testingRequirements" className="text-base font-medium">
                Testing requirements (optional)
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Specific testing requirements, coverage targets, or testing methodologies
              </p>
              <Textarea
                id="testingRequirements"
                placeholder="80% code coverage required, unit tests for all business logic, integration tests for APIs, e2e tests for critical user flows..."
                value={formData.testingRequirements}
                onChange={(e) => handleInputChange('testingRequirements', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.testingRequirements.length}/500 characters
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <h4 className="font-medium text-green-900">Best Practices</h4>
                  <p className="text-xs text-green-700">Industry standards applied</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-green-500" />
                <div>
                  <h4 className="font-medium text-green-900">Code Quality</h4>
                  <p className="text-xs text-green-700">Linting & formatting</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-500" />
                <div>
                  <h4 className="font-medium text-green-900">Project Setup</h4>
                  <p className="text-xs text-green-700">Configuration & structure</p>
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
                  AI is integrating development rules...
                </>
              ) : (
                'Apply Development Rules & Standards with AI'
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

      {/* Development Rules Results */}
      {currentOutput && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Development Rules Specification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Your Development Rules & Standards
              </CardTitle>
              <CardDescription>
                {currentOutput.readyForNextStep 
                  ? 'Your development rules are integrated and ready for the next step!'
                  : 'We can refine these development rules further with additional details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div 
                  className="text-gray-700 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: currentOutput.developmentRulesSpecification
                      .replace(/## (.*)/g, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
                      .replace(/### (.*)/g, '<h4 class="text-base font-medium text-gray-800 mt-3 mb-1">$1</h4>')
                      .replace(/#### (.*)/g, '<h5 class="text-sm font-medium text-gray-700 mt-2 mb-1">$1</h5>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\`([^`]+)\`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
                      .replace(/- (.*)/g, '<li class="flex items-start gap-2 ml-4"><span class="text-green-500 mt-1">•</span><span>$1</span></li>')
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
              title="Let's Refine Your Development Standards"
              description="Answer these questions to improve the development rules and standards"
              allowSkip={true}
            />
          )}

          {/* Next Step Actions */}
          {currentOutput.readyForNextStep && (
            <div className="flex justify-center pt-4">
              <Button onClick={onNext} size="lg" className="px-8">
                Continue to Step 9: Implementation Planning
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