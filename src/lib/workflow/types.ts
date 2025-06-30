export interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  prompt: string;
  fields: WorkflowField[];
  validationRules?: ValidationRule[];
  aiPrompt?: string;
}

export interface WorkflowField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'number';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  maxLength?: number;
  minLength?: number;
  helpText?: string;
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'minLength' | 'maxLength' | 'pattern';
  value?: string | number;
  message: string;
}

export interface WorkflowResponse {
  stepId: number;
  responses: Record<string, string | string[] | boolean | number>;
  completed: boolean;
  aiSuggestions?: string;
  lastUpdated: Date;
}

export interface ProjectWorkflow {
  projectId: string;
  currentStep: number;
  responses: WorkflowResponse[];
  isCompleted: boolean;
  completedAt?: Date;
  startedAt: Date;
}

export interface WorkflowProgress {
  totalSteps: number;
  completedSteps: number;
  currentStep: number;
  percentComplete: number;
  estimatedTimeRemaining?: number;
}