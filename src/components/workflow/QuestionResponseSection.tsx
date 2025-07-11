'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { MessageSquare, ChevronRight, Loader2, CheckCircle } from 'lucide-react';

export interface Question {
  id: string;
  text: string;
  type: 'text' | 'choice' | 'number' | 'textarea';
  options?: string[]; // for choice type
  required: boolean;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
}

interface QuestionResponseSectionProps {
  questions: Question[];
  onResponsesSubmit: (responses: Record<string, string>) => void;
  onSkip?: () => void;
  isProcessing?: boolean;
  title?: string;
  description?: string;
  allowSkip?: boolean;
  className?: string;
}

export default function QuestionResponseSection({
  questions,
  onResponsesSubmit,
  onSkip,
  isProcessing = false,
  title = "Help Us Understand Better",
  description = "Answer these questions to get more personalized insights",
  allowSkip = true,
  className = ""
}: QuestionResponseSectionProps) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors(prev => ({ ...prev, [questionId]: '' }));
    }
  };

  const validateResponses = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    questions.forEach(question => {
      const response = responses[question.id]?.trim() || '';
      
      if (question.required && !response) {
        newErrors[question.id] = 'This field is required';
      } else if (question.minLength && response.length < question.minLength) {
        newErrors[question.id] = `Please provide at least ${question.minLength} characters`;
      } else if (question.maxLength && response.length > question.maxLength) {
        newErrors[question.id] = `Please keep under ${question.maxLength} characters`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateResponses()) {
      onResponsesSubmit(responses);
    }
  };

  const renderQuestionInput = (question: Question) => {
    const value = responses[question.id] || '';
    const error = errors[question.id];

    switch (question.type) {
      case 'textarea':
        return (
          <div className="space-y-2">
            <Textarea
              id={question.id}
              value={value}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
              placeholder={question.placeholder || "Type your response..."}
              className={`min-h-[100px] ${error ? 'border-red-500' : ''}`}
              disabled={isProcessing}
            />
            {question.minLength && (
              <p className="text-xs text-gray-500">
                {value.length}/{question.minLength}+ characters
              </p>
            )}
          </div>
        );

      case 'text':
        return (
          <Input
            id={question.id}
            type="text"
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder={question.placeholder || "Type your response..."}
            className={error ? 'border-red-500' : ''}
            disabled={isProcessing}
          />
        );

      case 'number':
        return (
          <Input
            id={question.id}
            type="number"
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder={question.placeholder || "Enter a number..."}
            className={error ? 'border-red-500' : ''}
            disabled={isProcessing}
          />
        );

      case 'choice':
        return (
          <RadioGroup
            value={value}
            onValueChange={(newValue) => handleResponseChange(question.id, newValue)}
            disabled={isProcessing}
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label 
                  htmlFor={`${question.id}-${index}`} 
                  className="text-sm font-normal cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      default:
        return null;
    }
  };

  const requiredQuestionCount = questions.filter(q => q.required).length;
  const answeredRequiredCount = questions.filter(q => 
    q.required && responses[q.id]?.trim()
  ).length;
  const isFormValid = answeredRequiredCount === requiredQuestionCount;

  if (questions.length === 0) {
    return null;
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            {title}
          </CardTitle>
          <CardDescription>
            {description}
            {requiredQuestionCount > 0 && (
              <span className="block mt-1 text-sm">
                <CheckCircle className="inline h-4 w-4 mr-1 text-green-500" />
                {answeredRequiredCount}/{requiredQuestionCount} required questions answered
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-3">
              <Label 
                htmlFor={question.id} 
                className="text-base font-medium text-gray-900 flex items-center gap-2"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                {question.text}
                {question.required && <span className="text-red-500">*</span>}
              </Label>
              
              {renderQuestionInput(question)}
              
              {errors[question.id] && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  {errors[question.id]}
                </p>
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isProcessing}
              className="flex-1"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing responses...
                </>
              ) : (
                <>
                  Refine My Analysis
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>

            {allowSkip && onSkip && (
              <Button
                onClick={onSkip}
                variant="outline"
                disabled={isProcessing}
                size="lg"
              >
                Skip for Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </m.div>
  );
}