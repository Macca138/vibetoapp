'use client';

import { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { WorkflowStep as WorkflowStepType, WorkflowResponse } from '@/lib/workflow/types';
import { fadeInUp, containerVariants } from '@/lib/animations';
import { useAutoSave } from '@/hooks/useAutoSave';
import WorkflowField from './WorkflowField';
import AutoSaveIndicator from './AutoSaveIndicator';
import AnimatedButton from '@/components/animations/AnimatedButton';
import Step1ArticulateIdea from './steps/Step1ArticulateIdea';
import Step2FleshingOut from './steps/Step2FleshingOut';
import Step3IdentifyTargetUsers from './steps/Step3IdentifyTargetUsers';
import Step4FeatureDiscovery from './steps/Step4FeatureDiscovery';
import Step5UserFlowMapping from './steps/Step5UserFlowMapping';
import Step6TechnicalArchitecture from './steps/Step6TechnicalArchitecture';
import Step7RevenueModel from './steps/Step7RevenueModel';
import Step8MVPDefinition from './steps/Step8MVPDefinition';
import Step9ExportExecute from './steps/Step9ExportExecute';

interface WorkflowStepProps {
  step: WorkflowStepType;
  projectId: string;
  response?: WorkflowResponse;
  onSave: (responses: Record<string, any>, isComplete: boolean) => Promise<void>;
  onNext?: () => void;
  onPrevious?: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLoading?: boolean;
}

export default function WorkflowStep({
  step,
  projectId,
  response,
  onSave,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  isLoading = false
}: WorkflowStepProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save functionality
  const autoSave = useAutoSave(formData, {
    onSave: async (data) => {
      await fetch(`/api/projects/${projectId}/save`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: step.id,
          responses: data,
          completed: false, // Auto-save doesn't mark as complete
        }),
      });
    },
    delay: 3000, // 3 second delay
    enabled: Object.keys(formData).length > 0, // Only enable if form has data
  });

  // Initialize form data from existing response
  useEffect(() => {
    if (response?.responses) {
      setFormData(response.responses);
    } else {
      // Initialize with default values
      const defaultData: Record<string, any> = {};
      step.fields.forEach(field => {
        switch (field.type) {
          case 'multiselect':
            defaultData[field.id] = [];
            break;
          case 'checkbox':
            defaultData[field.id] = false;
            break;
          case 'number':
            defaultData[field.id] = 0;
            break;
          default:
            defaultData[field.id] = '';
        }
      });
      setFormData(defaultData);
    }
  }, [step, response]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    step.fields.forEach(field => {
      const value = formData[field.id];
      
      if (field.required) {
        if (field.type === 'multiselect' && (!value || (value as string[]).length === 0)) {
          newErrors[field.id] = `${field.label} is required`;
        } else if (field.type === 'checkbox' && !value) {
          newErrors[field.id] = `${field.label} is required`;
        } else if (!value || (typeof value === 'string' && value.trim() === '')) {
          newErrors[field.id] = `${field.label} is required`;
        }
      }
      
      if (field.minLength && typeof value === 'string' && value.length < field.minLength) {
        newErrors[field.id] = `${field.label} must be at least ${field.minLength} characters`;
      }
      
      if (field.maxLength && typeof value === 'string' && value.length > field.maxLength) {
        newErrors[field.id] = `${field.label} must be no more than ${field.maxLength} characters`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const handleSave = async (isComplete: boolean = false) => {
    if (isComplete && !validateForm()) {
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(formData, isComplete);
    } catch (error) {
      console.error('Failed to save step:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (validateForm()) {
      await handleSave(true);
      onNext?.();
    }
  };


  // Use custom step components
  if (step.id === 1) {
    return (
      <Step1ArticulateIdea
        projectId={projectId}
        initialData={response?.responses}
        onComplete={async (data) => {
          await onSave(data, true);
        }}
        onNext={onNext || (() => {})}
      />
    );
  }

  if (step.id === 2) {
    return (
      <Step2FleshingOut
        projectId={projectId}
        initialData={response?.responses}
        onComplete={async (data) => {
          await onSave(data, true);
        }}
        onNext={onNext || (() => {})}
      />
    );
  }

  if (step.id === 3) {
    return (
      <Step3IdentifyTargetUsers
        projectId={projectId}
        initialData={response?.responses}
        onComplete={async (data) => {
          await onSave(data, true);
        }}
        onNext={onNext || (() => {})}
      />
    );
  }

  if (step.id === 4) {
    return (
      <Step4FeatureDiscovery
        projectId={projectId}
        initialData={response?.responses}
        onComplete={async (data) => {
          await onSave(data, true);
        }}
        onNext={onNext || (() => {})}
      />
    );
  }

  if (step.id === 5) {
    return (
      <Step5UserFlowMapping
        projectId={projectId}
        initialData={response?.responses}
        onComplete={async (data) => {
          await onSave(data, true);
        }}
        onNext={onNext || (() => {})}
      />
    );
  }

  if (step.id === 6) {
    return (
      <Step6TechnicalArchitecture
        projectId={projectId}
        initialData={response?.responses}
        onComplete={async (data) => {
          await onSave(data, true);
        }}
        onNext={onNext || (() => {})}
      />
    );
  }

  if (step.id === 7) {
    return (
      <Step7RevenueModel
        projectId={projectId}
        initialData={response?.responses}
        onComplete={async (data) => {
          await onSave(data, true);
        }}
        onNext={onNext || (() => {})}
      />
    );
  }

  if (step.id === 8) {
    return (
      <Step8MVPDefinition
        projectId={projectId}
        initialData={response?.responses}
        onComplete={async (data) => {
          await onSave(data, true);
        }}
        onNext={onNext || (() => {})}
      />
    );
  }

  if (step.id === 9) {
    return (
      <Step9ExportExecute
        projectId={projectId}
        initialData={response?.responses}
        onComplete={async (data) => {
          await onSave(data, true);
        }}
        onNext={onNext || (() => {})}
      />
    );
  }

  return (
    <m.div
      className="max-w-4xl mx-auto"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Step Header */}
      <m.div className="text-center mb-8" variants={fadeInUp}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {step.title}
        </h1>
        <p className="text-lg text-gray-800 mb-4">
          {step.description}
        </p>
        <div className="max-w-2xl mx-auto">
          <p className="text-base text-gray-900 bg-indigo-100 rounded-lg p-4 border border-indigo-200">
            {step.prompt}
          </p>
        </div>
      </m.div>

      {/* Form Fields */}
      <m.div className="space-y-6 mb-8" variants={fadeInUp}>
        {step.fields.map((field) => (
          <WorkflowField
            key={field.id}
            field={field}
            value={formData[field.id]}
            onChange={(value) => handleFieldChange(field.id, value)}
            error={errors[field.id]}
          />
        ))}
      </m.div>

      {/* AI Suggestions */}
      {response?.aiSuggestions && (
        <m.div
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8"
          variants={fadeInUp}
        >
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            AI Suggestions
          </h3>
          <p className="text-sm text-blue-700">
            {response.aiSuggestions}
          </p>
        </m.div>
      )}

      {/* Action Buttons */}
      <m.div
        className="flex flex-col sm:flex-row gap-4 justify-between items-center"
        variants={fadeInUp}
      >
        <div className="flex gap-3">
          {canGoPrevious && (
            <AnimatedButton
              onClick={onPrevious}
              variant="secondary"
              disabled={isLoading || isSaving}
              className="px-6 py-3"
            >
              ← Previous
            </AnimatedButton>
          )}
          
          <AnimatedButton
            onClick={() => handleSave(false)}
            variant="ghost"
            disabled={isLoading || isSaving}
            className="px-6 py-3"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </AnimatedButton>
        </div>

        <div className="flex gap-3">
          <AnimatedButton
            onClick={handleNext}
            disabled={isLoading || isSaving || !canGoNext}
            className="px-8 py-3"
          >
            {step.id === 9 ? 'Complete Workflow' : 'Next Step →'}
          </AnimatedButton>
        </div>
      </m.div>

      {/* Auto-save indicator */}
      <m.div
        className="fixed bottom-4 right-4 bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-lg"
        variants={fadeInUp}
      >
        <AutoSaveIndicator
          status={autoSave.status}
          error={autoSave.error}
          lastSaved={autoSave.lastSaved}
        />
      </m.div>
    </m.div>
  );
}