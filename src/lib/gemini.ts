import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize the Gemini 1.5 Flash model (higher quotas for development)
const model: GenerativeModel = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash" 
});

export interface GeminiResponse {
  text: string;
  usage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

export interface WorkflowPromptOptions {
  stepNumber: number;
  userInput: Record<string, any>;
  previousStepsData?: Record<string, any>;
  systemPrompt?: string;
}

/**
 * Generate AI response for workflow steps
 */
export async function generateWorkflowResponse(
  options: WorkflowPromptOptions
): Promise<GeminiResponse> {
  try {
    const { stepNumber, userInput, previousStepsData, systemPrompt } = options;

    // Build the complete prompt
    let prompt = '';
    
    if (systemPrompt) {
      prompt += `${systemPrompt}\n\n`;
    }

    prompt += `You are helping a user develop their app idea through a structured workflow. This is step ${stepNumber} of 9.\n\n`;

    if (previousStepsData && Object.keys(previousStepsData).length > 0) {
      prompt += `Previous steps context:\n${JSON.stringify(previousStepsData, null, 2)}\n\n`;
    }

    prompt += `Current step user input:\n${JSON.stringify(userInput, null, 2)}\n\n`;
    prompt += `Please provide detailed, actionable feedback and suggestions to help refine and improve their app concept for this step.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      text,
      usage: {
        promptTokens: 0, // Gemini doesn't expose token counts in the same way
        candidatesTokens: 0,
        totalTokens: 0
      }
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate simple text completion
 */
export async function generateText(prompt: string): Promise<GeminiResponse> {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      text,
      usage: {
        promptTokens: 0,
        candidatesTokens: 0,
        totalTokens: 0
      }
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test the Gemini connection
 */
export async function testGeminiConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await generateText('Hello, please respond with "Connection successful" if you can read this.');
    const success = result.text.toLowerCase().includes('connection successful');
    return { success };
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export { model as geminiModel };