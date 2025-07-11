import { WorkflowProgress, ProjectWorkflow } from './types';
import { getTotalSteps } from './config';

export function calculateProgress(workflow: ProjectWorkflow): WorkflowProgress {
  const totalSteps = getTotalSteps();
  const completedSteps = workflow.responses.filter(r => r.completed).length;
  const currentStep = workflow.currentStep;
  const percentComplete = Math.round((completedSteps / totalSteps) * 100);
  
  // Estimate time remaining based on average time per step (5 minutes)
  const avgMinutesPerStep = 5;
  const remainingSteps = totalSteps - completedSteps;
  const estimatedTimeRemaining = remainingSteps * avgMinutesPerStep;

  return {
    totalSteps,
    completedSteps,
    currentStep,
    percentComplete,
    estimatedTimeRemaining: estimatedTimeRemaining > 0 ? estimatedTimeRemaining : undefined,
  };
}

export function canNavigateToStep(
  targetStep: number, 
  workflow: ProjectWorkflow
): boolean {
  // Can always go to step 1
  if (targetStep === 1) return true;
  
  // Can always go to any completed step
  const targetStepResponse = workflow.responses.find(r => r.stepId === targetStep);
  if (targetStepResponse?.completed) return true;
  
  // Can't go to steps beyond the current allowed step
  if (targetStep > workflow.currentStep + 1) return false;
  
  // Can go to any previous step or the next step if current is completed
  const currentStepResponse = workflow.responses.find(r => r.stepId === workflow.currentStep);
  if (targetStep <= workflow.currentStep) return true;
  
  // Can go to next step if current step is completed
  return currentStepResponse?.completed === true;
}

export function getNavigationState(
  currentStep: number,
  workflow: ProjectWorkflow
) {
  const totalSteps = getTotalSteps();
  const progress = calculateProgress(workflow);
  
  return {
    canGoPrevious: currentStep > 1,
    canGoNext: canNavigateToStep(currentStep + 1, workflow),
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === totalSteps,
    progress,
  };
}

export function getStepStatus(
  stepId: number,
  workflow: ProjectWorkflow
): 'completed' | 'current' | 'locked' | 'available' {
  const stepResponse = workflow.responses.find(r => r.stepId === stepId);
  
  if (stepResponse?.completed) return 'completed';
  if (stepId === workflow.currentStep) return 'current';
  if (!canNavigateToStep(stepId, workflow)) return 'locked';
  return 'available';
}