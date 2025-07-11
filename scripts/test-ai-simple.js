#!/usr/bin/env node

/**
 * Simple AI Integration Test
 * Tests the Gemini AI integration directly using the HTTPS API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key] = value.replace(/"/g, '');
    }
  });
}

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in environment variables');
  process.exit(1);
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash-exp";

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const color = type === 'error' ? colors.red : 
                type === 'success' ? colors.green : 
                type === 'warning' ? colors.yellow : 
                type === 'step' ? colors.blue : colors.reset;
  
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

function logStep(step) {
  console.log(`\n${colors.bright}${colors.blue}=== ${step} ===${colors.reset}`);
}

// Test data
const testProjectData = {
  name: "TaskMaster Pro",
  description: "A comprehensive task management and productivity application",
  appDescription: "TaskMaster Pro is a modern task management application that helps teams and individuals organize their work, track progress, and boost productivity. It features project management, team collaboration, time tracking, and advanced reporting capabilities.",
  targetAudience: "Small to medium businesses, freelancers, and project managers",
  platform: "Web and mobile",
  budget: "$50,000 - $100,000",
  timeline: "6 months"
};

let testResults = {
  connectionTest: false,
  simpleTextTest: false,
  workflowTests: {}
};

class SimpleAITester {
  constructor() {
    this.startTime = Date.now();
  }

  async callGeminiAPI(prompt) {
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

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
            reject(new Error(`Failed to parse Gemini response: ${error.message}`));
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

  async testConnection() {
    logStep('Testing Gemini AI Connection');
    
    try {
      const prompt = "Please respond with 'Connection successful' if you can read this message.";
      
      log(`📤 Testing connection with simple prompt`, 'info');
      
      const startTime = Date.now();
      const response = await this.callGeminiAPI(prompt);
      const duration = Date.now() - startTime;
      
      if (response && response.toLowerCase().includes('connection successful')) {
        log(`✅ Gemini AI connection successful in ${duration}ms`, 'success');
        log(`🤖 Response: ${response}`, 'info');
        testResults.connectionTest = true;
        return true;
      } else {
        log(`❌ Unexpected response: ${response}`, 'error');
        testResults.connectionTest = false;
        return false;
      }
    } catch (error) {
      log(`❌ Connection test error: ${error.message}`, 'error');
      testResults.connectionTest = false;
      return false;
    }
  }

  async testSimpleTextGeneration() {
    logStep('Testing Simple Text Generation');
    
    try {
      const prompt = "Explain what a task management application is in exactly 2-3 sentences.";
      
      log(`📤 Prompt: ${prompt}`, 'info');
      
      const startTime = Date.now();
      const response = await this.callGeminiAPI(prompt);
      const duration = Date.now() - startTime;
      
      if (response && response.length > 50) {
        log(`✅ Text generation successful in ${duration}ms`, 'success');
        log(`🤖 Response: ${response}`, 'info');
        testResults.simpleTextTest = true;
        return true;
      } else {
        log(`❌ Text generation failed - insufficient response: ${response}`, 'error');
        testResults.simpleTextTest = false;
        return false;
      }
    } catch (error) {
      log(`❌ Text generation error: ${error.message}`, 'error');
      testResults.simpleTextTest = false;
      return false;
    }
  }

  async testWorkflowStep(stepNumber, stepName, systemPrompt) {
    logStep(`Testing Workflow Step ${stepNumber}: ${stepName}`);
    
    try {
      const userInput = this.getStepUserInput(stepNumber);
      
      // Create a comprehensive prompt that mimics the workflow system
      const fullPrompt = `${systemPrompt}

You are helping a user develop their app idea through a structured workflow. This is step ${stepNumber} of 9.

Current step user input:
${JSON.stringify(userInput, null, 2)}

Please provide detailed, actionable feedback and suggestions to help refine and improve their app concept for this step. Focus on practical advice and specific recommendations.`;
      
      log(`📤 Testing ${stepName} with AI`, 'info');
      log(`📋 User Input: ${JSON.stringify(userInput, null, 2)}`, 'info');
      
      const startTime = Date.now();
      const response = await this.callGeminiAPI(fullPrompt);
      const duration = Date.now() - startTime;
      
      if (response && response.length > 100) {
        log(`✅ Step ${stepNumber} AI response successful in ${duration}ms`, 'success');
        log(`🤖 Response Preview: ${response.substring(0, 400)}...`, 'info');
        
        testResults.workflowTests[stepNumber] = {
          stepName,
          userInput,
          response,
          duration,
          success: true
        };
        
        return true;
      } else {
        log(`❌ Step ${stepNumber} AI response failed - insufficient response: ${response}`, 'error');
        testResults.workflowTests[stepNumber] = {
          stepName,
          userInput,
          response: response || 'No response',
          duration,
          success: false
        };
        return false;
      }
    } catch (error) {
      log(`❌ Step ${stepNumber} AI error: ${error.message}`, 'error');
      testResults.workflowTests[stepNumber] = {
        stepName,
        userInput: this.getStepUserInput(stepNumber),
        error: error.message,
        success: false
      };
      return false;
    }
  }

  getStepUserInput(stepNumber) {
    const baseInput = {
      projectId: 'test-project-id',
      appDescription: testProjectData.appDescription
    };

    switch (stepNumber) {
      case 1:
        return {
          ...baseInput,
          initialIdea: testProjectData.appDescription,
          targetAudience: testProjectData.targetAudience,
          platform: testProjectData.platform,
          budget: testProjectData.budget,
          timeline: testProjectData.timeline
        };
      
      case 2:
        return {
          ...baseInput,
          additionalRequirements: "Real-time collaboration features, mobile offline support, push notifications, analytics dashboard"
        };
      
      case 3:
        return {
          ...baseInput,
          technicalPreferences: "React, Node.js, PostgreSQL, AWS cloud deployment, microservices architecture, REST APIs"
        };
      
      case 4:
        return {
          ...baseInput,
          userStories: "As a user, I want to create tasks and assign them to team members so that work can be distributed effectively. As a manager, I want to track project progress and generate reports so that I can make informed decisions.",
          userFlows: "User registration → Dashboard → Create project → Add team members → Create tasks → Assign tasks → Track progress → Generate reports"
        };
      
      case 5:
        return {
          ...baseInput,
          designPreferences: "Modern, clean UI with dark mode support, accessibility compliance, mobile-first design",
          brandGuidelines: "Professional yet approachable, blue and green color palette, clean typography, consistent spacing"
        };
      
      case 6:
        return {
          ...baseInput,
          screenRequirements: "Dashboard, task list, project view, user profile, settings, reports, team management",
          interactionPatterns: "Drag-and-drop task management, real-time updates, contextual menus, keyboard shortcuts"
        };
      
      case 7:
        return {
          ...baseInput,
          technicalConstraints: "Must support 1000+ concurrent users, 99.9% uptime, GDPR compliance, mobile responsiveness",
          performanceRequirements: "Sub-second response times, offline capability, real-time synchronization"
        };
      
      case 8:
        return {
          ...baseInput,
          developmentRules: "Test-driven development, code reviews, CI/CD pipeline, automated testing",
          teamProcesses: "Agile methodology, daily standups, sprint planning, retrospectives"
        };
      
      case 9:
        return {
          ...baseInput,
          timelineConstraints: "6-month development timeline, 3-person team, agile methodology",
          resourceAllocation: "1 senior developer, 1 junior developer, 1 UI/UX designer, part-time project manager"
        };
      
      default:
        return baseInput;
    }
  }

  async runAllTests() {
    logStep('Starting AI Integration Tests');
    
    // Test 1: Connection
    const connectionOk = await this.testConnection();
    if (!connectionOk) {
      log('❌ Cannot proceed - AI connection failed', 'error');
      return false;
    }

    // Test 2: Simple text generation
    const textGenOk = await this.testSimpleTextGeneration();
    if (!textGenOk) {
      log('❌ Cannot proceed - simple text generation failed', 'error');
      return false;
    }

    // Test 3: ALL 9 Workflow steps
    const workflowSteps = [
      { 
        number: 1, 
        name: 'Articulate Idea', 
        prompt: 'You are a skilled product manager with expertise in helping entrepreneurs and businesses refine their app ideas. Your role is to help articulate and clarify the core concept, ensuring it addresses a real market need and has clear value propositions.' 
      },
      { 
        number: 2, 
        name: 'Fleshing Out', 
        prompt: 'You are an expert business analyst with deep experience in app development and market research. Your role is to help expand on the initial app concept by identifying key features, user requirements, and market opportunities.' 
      },
      { 
        number: 3, 
        name: 'Technical Architecture', 
        prompt: 'You are a senior software architect with extensive experience in building scalable web and mobile applications. Your role is to help design the technical foundation and architecture for the app.' 
      },
      { 
        number: 4, 
        name: 'Feature Stories & UX Flows', 
        prompt: 'You are a UX designer and product owner with expertise in creating user stories and designing intuitive user flows. Your role is to help define detailed feature requirements and optimal user experiences.' 
      },
      { 
        number: 5, 
        name: 'Design System & Style Guide', 
        prompt: 'You are a senior UI/UX designer with expertise in creating comprehensive design systems and style guides. Your role is to help establish visual design standards, component libraries, and brand consistency.' 
      },
      { 
        number: 6, 
        name: 'Screen States Specification', 
        prompt: 'You are a product designer specializing in detailed interface design and user interaction patterns. Your role is to help define comprehensive screen states, interactions, and UI specifications.' 
      },
      { 
        number: 7, 
        name: 'Comprehensive Technical Specification', 
        prompt: 'You are a technical lead with expertise in creating detailed technical specifications for complex applications. Your role is to help create comprehensive technical documentation and implementation guidelines.' 
      },
      { 
        number: 8, 
        name: 'Development Rules Integration', 
        prompt: 'You are a senior developer and team lead with expertise in establishing development workflows, coding standards, and team processes. Your role is to help integrate development best practices and team collaboration rules.' 
      },
      { 
        number: 9, 
        name: 'Implementation Planning', 
        prompt: 'You are a project manager and technical lead with expertise in software development planning and execution. Your role is to help create detailed implementation plans, timelines, and resource allocation strategies.' 
      }
    ];

    let allStepsSuccessful = true;
    let completedSteps = 0;

    for (const step of workflowSteps) {
      const success = await this.testWorkflowStep(step.number, step.name, step.prompt);
      if (success) {
        completedSteps++;
      } else {
        allStepsSuccessful = false;
      }
      
      // Add delay between steps
      if (step.number < workflowSteps.length) {
        log('⏳ Waiting 3 seconds before next step...', 'info');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Save results
    const resultsPath = path.join(process.cwd(), 'scripts', 'ai-integration-test-results.json');
    const finalResults = {
      ...testResults,
      testSummary: {
        totalDuration: Date.now() - this.startTime,
        completedSteps,
        totalSteps: workflowSteps.length,
        allSuccessful: allStepsSuccessful && connectionOk && textGenOk
      }
    };
    
    fs.writeFileSync(resultsPath, JSON.stringify(finalResults, null, 2));

    // Summary
    logStep('AI Integration Test Summary');
    log(`🔌 Connection Test: ${connectionOk ? 'PASS' : 'FAIL'}`, connectionOk ? 'success' : 'error');
    log(`📝 Simple Text Generation: ${textGenOk ? 'PASS' : 'FAIL'}`, textGenOk ? 'success' : 'error');
    log(`🔄 Workflow Steps: ${completedSteps}/${workflowSteps.length} successful`, completedSteps > 0 ? 'success' : 'error');
    log(`⏱️  Total Test Duration: ${((Date.now() - this.startTime) / 1000).toFixed(1)}s`, 'info');
    log(`💾 Results saved to: ${resultsPath}`, 'info');

    if (allStepsSuccessful && connectionOk && textGenOk) {
      log('🎉 All AI integration tests passed!', 'success');
      return true;
    } else {
      log('❌ Some AI integration tests failed', 'error');
      return false;
    }
  }
}

// Run the test
async function main() {
  console.log(`${colors.bright}${colors.blue}VIBETOAPP AI INTEGRATION TEST${colors.reset}`);
  console.log(`${colors.blue}Testing Gemini AI integration and workflow prompts${colors.reset}\n`);
  
  const tester = new SimpleAITester();
  const success = await tester.runAllTests();
  
  if (success) {
    console.log(`\n${colors.bright}${colors.green}🎉 SUCCESS! AI Integration is working perfectly!${colors.reset}`);
    console.log(`${colors.green}✅ Gemini AI Connection: Working${colors.reset}`);
    console.log(`${colors.green}✅ Text Generation: Working${colors.reset}`);
    console.log(`${colors.green}✅ Workflow AI Responses: Working${colors.reset}`);
    console.log(`${colors.green}✅ AI can understand and respond to complex prompts${colors.reset}`);
  } else {
    console.log(`\n${colors.bright}${colors.red}❌ AI Integration needs attention${colors.reset}`);
  }
  
  process.exit(success ? 0 : 1);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch(console.error);