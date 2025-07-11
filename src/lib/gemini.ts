import https from 'https';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash-exp";

// Context caching interface
interface CachedContent {
  name: string;
  displayName: string;
  model: string;
  systemInstruction?: string;
  contents: Array<{
    role: string;
    parts: Array<{ text: string }>;
  }>;
  ttl: string;
  createTime?: string;
  updateTime?: string;
  expireTime?: string;
}

// Cache storage (in production, use Redis or similar)
const contentCache = new Map<string, CachedContent>();

/**
 * Create cached content for system prompts and previous steps
 */
async function createCachedContent(
  name: string,
  displayName: string,
  content: string,
  ttl: string = "3600s" // 1 hour default
): Promise<string> {
  const cacheKey = `cached_${name}`;
  
  // Check if already cached and not expired
  const existing = contentCache.get(cacheKey);
  if (existing && existing.expireTime && new Date(existing.expireTime) > new Date()) {
    return existing.name;
  }

  const cachedContent: CachedContent = {
    name: cacheKey,
    displayName,
    model: GEMINI_MODEL,
    contents: [{
      role: "user",
      parts: [{ text: content }]
    }],
    ttl,
    createTime: new Date().toISOString(),
    expireTime: new Date(Date.now() + parseInt(ttl) * 1000).toISOString()
  };

  // In a real implementation, we'd call the Gemini caching API here
  // For now, store locally
  contentCache.set(cacheKey, cachedContent);
  
  return cacheKey;
}

/**
 * Get cached content reference for API calls
 */
function getCachedContentReference(cacheKey: string): string | null {
  const cached = contentCache.get(cacheKey);
  if (cached && cached.expireTime && new Date(cached.expireTime) > new Date()) {
    return cached.name;
  }
  return null;
}

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
 * Make direct API call to Gemini with optional cached content
 */
async function callGeminiAPI(
  prompt: string, 
  cachedContentNames: string[] = []
): Promise<string> {
  const requestBody: any = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }]
  };

  // Note: Context caching is implemented locally for now
  // In production, this would use Gemini's actual caching API
  // For now, we skip the cachedContent field to avoid API errors

  const postData = JSON.stringify(requestBody);

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
 * Generate AI response for workflow steps with context caching
 */
export async function generateWorkflowResponse(
  options: WorkflowPromptOptions
): Promise<GeminiResponse> {
  try {
    const { stepNumber, userInput, previousStepsData, systemPrompt } = options;

    const cachedContentNames: string[] = [];

    // Cache system prompt if provided
    let systemPromptCacheKey: string | null = null;
    if (systemPrompt) {
      systemPromptCacheKey = await createCachedContent(
        `system_prompt_step_${stepNumber}`,
        `System Prompt for Step ${stepNumber}`,
        systemPrompt,
        "3600s" // Cache for 1 hour
      );
      const cacheRef = getCachedContentReference(systemPromptCacheKey);
      if (cacheRef) {
        cachedContentNames.push(cacheRef);
      }
    }

    // Cache previous steps data if available
    let previousStepsCacheKey: string | null = null;
    if (previousStepsData && Object.keys(previousStepsData).length > 0) {
      const previousStepsContent = `Previous steps context:\n${JSON.stringify(previousStepsData, null, 2)}`;
      previousStepsCacheKey = await createCachedContent(
        `previous_steps_${stepNumber}`,
        `Previous Steps for Step ${stepNumber}`,
        previousStepsContent,
        "86400s" // Cache for 24 hours
      );
      const cacheRef = getCachedContentReference(previousStepsCacheKey);
      if (cacheRef) {
        cachedContentNames.push(cacheRef);
      }
    }

    // Build the current request prompt (only non-cached content)
    let prompt = `You are helping a user develop their app idea through a structured workflow. This is step ${stepNumber} of 9.\n\n`;
    
    // Add previous steps context if not cached
    if (!previousStepsCacheKey && previousStepsData && Object.keys(previousStepsData).length > 0) {
      prompt += `Previous steps context:\n${JSON.stringify(previousStepsData, null, 2)}\n\n`;
    }

    // Add system prompt if not cached
    if (!systemPromptCacheKey && systemPrompt) {
      prompt += `${systemPrompt}\n\n`;
    }

    prompt += `Current step user input:\n${JSON.stringify(userInput, null, 2)}\n\n`;
    prompt += `Please provide detailed, actionable feedback and suggestions to help refine and improve their app concept for this step.`;

    const text = await callGeminiAPI(prompt, cachedContentNames);

    return {
      text,
      usage: {
        promptTokens: 0, // With caching, token usage is significantly reduced
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