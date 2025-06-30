'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';
import { getWorkflowStep } from '@/lib/workflow/config';
import { getNavigationState, calculateProgress } from '@/lib/workflow/navigation';
import { ProjectWorkflow as ProjectWorkflowType } from '@/lib/workflow/types';
import WorkflowStep from './WorkflowStep';
import StepNavigation from './StepNavigation';
import ProgressBar from './ProgressBar';

interface ProjectWithWorkflow {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  workflow?: {
    id: string;
    currentStep: number;
    isCompleted: boolean;
    completedAt?: Date | null;
    startedAt: Date;
    responses: {
      id: string;
      stepId: number;
      responses: any;
      completed: boolean;
      aiSuggestions?: string | null;
      createdAt: Date;
      updatedAt: Date;
    }[];
  } | null;
}

interface WorkflowContainerProps {
  project: ProjectWithWorkflow;
}

export default function WorkflowContainer({ project }: WorkflowContainerProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [workflow, setWorkflow] = useState<ProjectWorkflowType | null>(null);

  // Initialize workflow data
  useEffect(() => {
    if (project.workflow) {
      const workflowData: ProjectWorkflowType = {
        projectId: project.id,
        currentStep: project.workflow.currentStep,
        isCompleted: project.workflow.isCompleted,
        completedAt: project.workflow.completedAt || undefined,
        startedAt: project.workflow.startedAt,
        responses: project.workflow.responses.map(r => ({
          stepId: r.stepId,
          responses: r.responses,
          completed: r.completed,
          aiSuggestions: r.aiSuggestions || undefined,
          lastUpdated: r.updatedAt,
        })),
      };
      setWorkflow(workflowData);
      setCurrentStep(project.workflow.currentStep);
    } else {
      // Initialize new workflow
      initializeWorkflow();
    }
  }, [project]);

  const initializeWorkflow = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        setWorkflow({
          projectId: project.id,
          currentStep: 1,
          isCompleted: false,
          startedAt: new Date(),
          responses: [],
        });
      }
    } catch (error) {
      console.error('Failed to initialize workflow:', error);
    }
  };

  const handleStepSave = async (responses: Record<string, any>, isComplete: boolean) => {
    if (!workflow) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${project.id}/workflow/steps/${currentStep}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          completed: isComplete,
        }),
      });

      if (response.ok) {
        
        // Update local workflow state
        setWorkflow(prev => {
          if (!prev) return null;
          
          const updatedResponses = prev.responses.filter(r => r.stepId !== currentStep);
          updatedResponses.push({
            stepId: currentStep,
            responses,
            completed: isComplete,
            lastUpdated: new Date(),
          });
          
          return {
            ...prev,
            responses: updatedResponses,
            currentStep: isComplete ? Math.min(currentStep + 1, 9) : prev.currentStep,
          };
        });
      }
    } catch (error) {
      console.error('Failed to save step:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepNavigation = (stepId: number) => {
    if (workflow && stepId >= 1 && stepId <= 9) {
      setCurrentStep(stepId);
    }
  };

  const handleNext = () => {
    if (currentStep < 9) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!workflow) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing workflow...</p>
        </div>
      </div>
    );
  }

  const currentStepData = getWorkflowStep(currentStep);
  const navigationState = getNavigationState(currentStep, workflow);
  const progress = calculateProgress(workflow);
  const currentStepResponse = workflow.responses.find(r => r.stepId === currentStep);

  if (!currentStepData) {
    return <div>Step not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div 
        className="bg-white shadow-sm border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
                <p className="text-sm text-gray-500">9-Step App Development Workflow</p>
              </div>
            </div>
            
            <div className="flex-1 max-w-md mx-8">
              <ProgressBar progress={progress} />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Step Navigation Sidebar */}
          <motion.div 
            className="lg:col-span-1 mb-8 lg:mb-0"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <div className="sticky top-8">
              <StepNavigation
                workflow={workflow}
                currentStep={currentStep}
                onStepClick={handleStepNavigation}
              />
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white shadow-sm rounded-lg p-6 lg:p-8">
              <WorkflowStep
                step={currentStepData}
                response={currentStepResponse}
                onSave={handleStepSave}
                onNext={handleNext}
                onPrevious={handlePrevious}
                canGoNext={navigationState.canGoNext}
                canGoPrevious={navigationState.canGoPrevious}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}