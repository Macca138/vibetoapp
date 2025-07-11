// Import Question type from QuestionResponseSection
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

// Unified AnalysisIteration type for all workflow steps
export interface AnalysisIteration {
  id: string;
  analysis?: any; // The AI analysis object (used by most steps)
  output?: any; // Alternative output structure (used by Step1)
  timestamp: Date;
  userInput?: any; // The user input data that led to this iteration
  confidenceScore?: number;
  changesFromPrevious?: string[];
  questionsAsked?: Question[]; // Using Question type instead of string[]
  responsesReceived?: Record<string, string>;
}

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

// Types for workflow response data structure (stored in Prisma Json field)
export interface WorkflowResponseData {
  conversation?: string;
  stepOutput?: WorkflowStepOutput;
  conversationSummary?: string;
  readyForNextStep?: boolean;
  [key: string]: any; // Allow additional properties
}

export interface WorkflowStepOutput {
  // Step 1 specific outputs
  projectOutline?: {
    problemStatement?: string;
    targetAudience?: string;
    coreSolution?: string;
    uniqueValue?: string;
    keyFeatures?: string[];
    successMetrics?: string;
  };
  clarificationQuestions?: string[];

  // Step 2 specific outputs  
  appDetails?: {
    elevatorPitch?: string;
    problemStatement?: string;
    targetAudience?: string;
    usp?: string;
  };
  featuresList?: {
    mustHave?: string[];
    shouldHave?: string[];
    couldHave?: string[];
    featureCategories?: string[];
  };
  techChoices?: {
    frontend?: string;
    backend?: string;
    hosting?: string;
    apis?: string;
  };
  uxUiConsiderations?: string[];
  coreAppIntent?: {
    problemStatement?: string;
    targetAudience?: string;
    monetization?: string;
    scaleExpectations?: string;
  };

  // Step 3 specific outputs
  technicalArchitecture?: {
    systemDiagram?: string;
    componentBreakdown?: string;
    dataFlow?: string;
    scalabilityPlan?: string;
  };
  refinedTechChoices?: {
    frontend?: string;
    backend?: string;
    database?: string;
    hosting?: string;
    apis?: string;
  };
  nonFunctionalRequirements?: {
    performance?: string;
    scalability?: string;
    security?: string;
  };

  // Step 4 specific outputs
  detailedUserStories?: Array<{
    feature?: string;
    userStory?: string;
    acceptanceCriteria?: string[];
    technicalComplexity?: string;
    priority?: string;
  }>;
  uxFlows?: {
    mainUserJourney?: string;
    onboarding?: string;
    keyInteractions?: string;
  };
  screenStates?: any;

  // Additional step outputs can be added here as needed
  [key: string]: any;
}

// Type guard to safely cast JsonValue to WorkflowResponseData
export function isWorkflowResponseData(value: any): value is WorkflowResponseData {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Utility function to safely extract WorkflowResponseData from Prisma JsonValue
export function getWorkflowResponseData(jsonValue: any): WorkflowResponseData {
  if (isWorkflowResponseData(jsonValue)) {
    return jsonValue;
  }
  return {};
}