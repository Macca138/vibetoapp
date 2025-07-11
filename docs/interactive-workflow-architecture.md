# Interactive Workflow Architecture Design

## Overview
Transform the linear workflow into an interactive, AI-guided conversation where the AI asks clarifying questions and integrates user responses to refine the analysis.

## Current State vs Target State

### Current (Linear):
```
User Input → AI Analysis → Results Display → Next Step
```

### Target (Interactive):
```
User Input → AI Analysis → Results + Questions → User Responses → Refined Analysis → Repeat Until Complete → Next Step
```

## Component Architecture

### 1. State Management
```typescript
interface InteractiveStepState {
  // Current analysis from AI
  currentAnalysis: AIAnalysis | null;
  
  // History of iterations
  analysisHistory: AIAnalysis[];
  
  // Current follow-up questions
  pendingQuestions: Question[];
  
  // User responses to questions
  questionResponses: Record<string, string>;
  
  // Interaction state
  isWaitingForResponse: boolean;
  iterationCount: number;
  maxIterations: number;
}

interface Question {
  id: string;
  text: string;
  type: 'text' | 'choice' | 'number';
  options?: string[]; // for choice type
  required: boolean;
}
```

### 2. UI Components

#### QuestionResponseSection
- Displays follow-up questions in an engaging format
- Captures user responses
- Validates responses before submission

#### AnalysisEvolutionView  
- Shows how the analysis has evolved through iterations
- Highlights changes between versions
- Allows comparison view

#### InteractionProgress
- Shows iteration progress (e.g., "2 of 5 clarifications")
- Indicates analysis confidence level
- Option to proceed early if user is satisfied

### 3. Backend Architecture

#### Enhanced API Endpoints
```typescript
// Current: /api/workflow/step1 (single call)
// New: Multiple endpoints for iterative flow

POST /api/workflow/step1/initial
- Takes initial user input
- Returns analysis + follow-up questions
- Creates conversation session

POST /api/workflow/step1/clarify
- Takes question responses
- Integrates with previous analysis
- Returns refined analysis + new questions (if needed)

POST /api/workflow/step1/finalize
- Finalizes the analysis for the step
- Marks step as complete
- Prepares data for next step
```

#### Conversation Management
```typescript
interface ConversationSession {
  stepId: number;
  projectId: string;
  userId: string;
  iterations: ConversationIteration[];
  currentStatus: 'collecting_input' | 'analyzing' | 'awaiting_response' | 'complete';
  createdAt: Date;
  updatedAt: Date;
}

interface ConversationIteration {
  id: string;
  userInput: Record<string, any>;
  aiAnalysis: AIAnalysis;
  questionsAsked: Question[];
  userResponses: Record<string, string>;
  timestamp: Date;
  confidenceScore: number; // AI's confidence in the analysis
}
```

## Implementation Phases

### Phase 1: Question Response UI
1. Create QuestionResponseSection component
2. Add state management for question/response flow
3. Update existing Step components to support iterative mode

### Phase 2: Backend Iterative Logic  
1. Create conversation session management
2. Update AI prompts to integrate previous responses
3. Add confidence scoring and stopping criteria

### Phase 3: Enhanced UX
1. Add analysis evolution visualization
2. Implement smart stopping criteria
3. Add user control over iteration depth

## User Experience Flow

### Step 1 Example:
1. User describes app idea: "A meditation app"
2. AI analyzes and asks: "Who specifically is your target audience?", "What makes this different from Headspace?", "What specific meditation techniques will you focus on?"
3. User responds: "Busy professionals", "Focus on micro-meditations during work breaks", "Breathing exercises and quick mindfulness"
4. AI refines analysis with specific audience, unique positioning, and feature focus
5. User can either continue clarifying or proceed to Step 2

### Stopping Criteria:
- AI determines sufficient detail has been gathered
- User manually chooses to proceed
- Maximum iterations reached (e.g., 3-5 rounds)
- Confidence score threshold met

## Benefits
1. **Higher Quality Output**: More detailed, specific analysis
2. **User Engagement**: Interactive conversation vs. form filling
3. **Educational**: Users learn to think more deeply about their idea
4. **Personalized**: Analysis becomes truly tailored to their specific vision
5. **Confidence Building**: Users feel heard and understood

## Technical Considerations
1. **Performance**: Cache AI responses, optimize for quick iterations
2. **Cost Management**: Implement smart stopping to control AI usage
3. **Context Management**: Maintain conversation context across iterations
4. **Error Handling**: Handle AI failures gracefully, allow manual progression
5. **Accessibility**: Ensure interactive elements work with screen readers