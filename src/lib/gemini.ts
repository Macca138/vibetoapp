import https from 'https';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-1.5-flash";

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
 * Make direct API call to Gemini
 */
async function callGeminiAPI(prompt: string): Promise<string> {
  const postData = JSON.stringify({
    contents: [{
      parts: [{
        text: prompt
      }]
    }]
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.candidates) {
            const text = response.candidates[0]?.content?.parts[0]?.text || '';
            resolve(text);
          } else {
            reject(new Error(`Gemini API error: ${res.statusCode} - ${JSON.stringify(response)}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse Gemini response: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Gemini API request error: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
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

    const text = await callGeminiAPI(prompt);

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
    const text = await callGeminiAPI(prompt);

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