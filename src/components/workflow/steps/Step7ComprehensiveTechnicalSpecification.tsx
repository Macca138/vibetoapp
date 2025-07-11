'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, ArrowLeft, Settings, Database, Shield } from 'lucide-react';
import QuestionResponseSection, { Question } from '@/components/workflow/QuestionResponseSection';
import AnalysisEvolutionView from '@/components/workflow/AnalysisEvolutionView';

interface Step7Data {
  technicalRequirements: string;
  architecturePreferences: string;
  securityRequirements: string;
  performanceNeeds: string;
  integrationRequirements: string;
}

interface Step7Output {
  technicalSpecification: string;
  components: {
    systemArchitecture: any;
    featureSpecs: any;
    dataArchitecture: any;
    apiSpecs: any;
    securitySpecs: any;
    deploymentSpecs: any;
  };
  clarificationQuestions: Question[];
  readyForNextStep: boolean;
  confidenceScore?: number;
  iterationNotes?: string[];
}

interface AnalysisIteration {
  id: string;
  analysis: Step7Output;
  timestamp: Date;
  userInput?: Step7Data;
  questionsAsked?: Question[];
  responsesReceived?: Record<string, string>;
  changesFromPrevious?: string[];
}

interface Step7Props {
  projectId: string;
  initialData?: Step7Data;
  onComplete: (data: any) => void;
  onNext: () => void;
  onPrevious?: () => void;
}

export default function Step7ComprehensiveTechnicalSpecification({ 
  projectId, 
  initialData, 
  onComplete, 
  onNext,
  onPrevious
}: Step7Props) {
  const [formData, setFormData] = useState<Step7Data>({
    technicalRequirements: initialData?.technicalRequirements || '',
    architecturePreferences: initialData?.architecturePreferences || '',
    securityRequirements: initialData?.securityRequirements || '',
    performanceNeeds: initialData?.performanceNeeds || '',
    integrationRequirements: initialData?.integrationRequirements || ''
  });

  const [iterations, setIterations] = useState<AnalysisIteration[]>([]);
  const [currentIterationIndex, setCurrentIterationIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialSubmission, setIsInitialSubmission] = useState(true);
  
  const currentIteration = currentIterationIndex >= 0 ? iterations[currentIterationIndex] : null;
  const currentOutput = currentIteration?.analysis;

  const handleInputChange = (field: keyof Step7Data, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.technicalRequirements.trim()) {
      setError('Please specify the technical requirements for your project');
      return;
    }

    if (formData.technicalRequirements.length < 30) {
      setError('Technical requirements description must be at least 30 characters');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/workflow/step7', {
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
        changesFromPrevious: currentIteration ? ['Initial comprehensive technical specification completed'] : undefined
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
      const response = await fetch('/api/workflow/step7/clarify', {
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
        changesFromPrevious: result.data.iterationNotes || ['Technical specification refined based on your responses']
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

  const isFormValid = formData.technicalRequirements.length >= 30;

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
            <h1 className="text-3xl font-bold text-gray-900">Comprehensive Technical Specification</h1>
            <p className="text-lg text-gray-600 mt-2">
              Create a detailed technical specification document for development
            </p>
          </div>
        </div>
      </div>

      {/* Input Form - Only show if no analysis yet */}
      {isInitialSubmission && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Technical Specification Requirements
            </CardTitle>
            <CardDescription>
              Help us understand your technical requirements to create a comprehensive development specification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="technicalRequirements" className="text-base font-medium">
                Core technical requirements and constraints *
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Describe any specific technical requirements, constraints, or preferences for your project
              </p>
              <Textarea
                id="technicalRequirements"
                placeholder="Must be scalable to 10K users, requires real-time updates, needs to integrate with existing systems, mobile-responsive, GDPR compliant..."
                value={formData.technicalRequirements}
                onChange={(e) => handleInputChange('technicalRequirements', e.target.value)}
                className="min-h-[120px] resize-none"
                maxLength={800}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.technicalRequirements.length}/800 characters (minimum 30)
              </div>
            </div>

            <div>
              <Label htmlFor="architecturePreferences" className="text-base font-medium">
                Architecture and infrastructure preferences
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Any preferences for architecture patterns, hosting, or infrastructure approaches
              </p>
              <Textarea
                id="architecturePreferences"
                placeholder="Prefer microservices architecture, cloud-native deployment, use containers, serverless functions for certain features..."
                value={formData.architecturePreferences}
                onChange={(e) => handleInputChange('architecturePreferences', e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={600}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.architecturePreferences.length}/600 characters
              </div>
            </div>

            <div>
              <Label htmlFor="securityRequirements" className="text-base font-medium">
                Security and compliance requirements
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Specific security, privacy, or compliance requirements
              </p>
              <Textarea
                id="securityRequirements"
                placeholder="GDPR compliance required, SOC 2 certification needed, end-to-end encryption, multi-factor authentication..."
                value={formData.securityRequirements}
                onChange={(e) => handleInputChange('securityRequirements', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.securityRequirements.length}/500 characters
              </div>
            </div>

            <div>
              <Label htmlFor="performanceNeeds" className="text-base font-medium">
                Performance and scalability needs
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Expected load, performance requirements, and scalability considerations
              </p>
              <Textarea
                id="performanceNeeds"
                placeholder="Sub-200ms response times, support 1000 concurrent users, auto-scaling capabilities, 99.9% uptime..."
                value={formData.performanceNeeds}
                onChange={(e) => handleInputChange('performanceNeeds', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.performanceNeeds.length}/500 characters
              </div>
            </div>

            <div>
              <Label htmlFor="integrationRequirements" className="text-base font-medium">
                Third-party integrations and APIs
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                External services, APIs, or systems that need to be integrated
              </p>
              <Textarea
                id="integrationRequirements"
                placeholder="Payment processing (Stripe), email service (SendGrid), analytics (Google Analytics), CRM integration..."
                value={formData.integrationRequirements}
                onChange={(e) => handleInputChange('integrationRequirements', e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={600}
                disabled={isProcessing}
              />
              <div className="text-sm text-gray-400 mt-1">
                {formData.integrationRequirements.length}/600 characters
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                <div>
                  <h4 className="font-medium text-blue-900">Architecture</h4>
                  <p className="text-xs text-blue-700">System design & infrastructure</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                <div>
                  <h4 className="font-medium text-blue-900">Data & APIs</h4>
                  <p className="text-xs text-blue-700">Database & integration specs</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <div>
                  <h4 className="font-medium text-blue-900">Security</h4>
                  <p className="text-xs text-blue-700">Compliance & protection</p>
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
                  AI is creating comprehensive technical specification...
                </>
              ) : (
                'Generate Comprehensive Technical Specification with AI'
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

      {/* Technical Specification Results */}
      {currentOutput && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Technical Specification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Your Comprehensive Technical Specification
              </CardTitle>
              <CardDescription>
                {currentOutput.readyForNextStep 
                  ? 'Your technical specification is complete and ready for the next step!'
                  : 'We can refine this technical specification further with additional details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div 
                  className="text-gray-700 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: currentOutput.technicalSpecification
                      .replace(/# (.*)/g, '<h2 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h2>')
                      .replace(/## (.*)/g, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
                      .replace(/### (.*)/g, '<h4 class="text-base font-medium text-gray-800 mt-3 mb-1">$1</h4>')
                      .replace(/#### (.*)/g, '<h5 class="text-sm font-medium text-gray-700 mt-2 mb-1">$1</h5>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\`([^`]+)\`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
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
              title="Let's Refine Your Technical Specification"
              description="Answer these questions to improve the technical specification details"
              allowSkip={true}
            />
          )}

          {/* Next Step Actions */}
          {currentOutput.readyForNextStep && (
            <div className="flex justify-center pt-4">
              <Button onClick={onNext} size="lg" className="px-8">
                Continue to Step 8: Development Rules Integration
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