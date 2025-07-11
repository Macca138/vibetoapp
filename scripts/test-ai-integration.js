#!/usr/bin/env node

/**
 * Direct AI Integration Test
 * Tests the Gemini AI integration directly to verify prompts and responses work
 */

const { generateText, generateWorkflowResponse, testGeminiConnection } = require('../src/lib/gemini');
const fs = require('fs');
const path = require('path');

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
  workflowSteps: {}
};

class AIIntegrationTester {
  constructor() {
    this.startTime = Date.now();
  }

  async testConnection() {
    logStep('Testing Gemini AI Connection');
    
    try {
      const result = await testGeminiConnection();
      
      if (result.success) {
        log('✅ Gemini AI connection successful', 'success');
        testResults.connectionTest = true;
        return true;
      } else {
        log(`❌ Gemini AI connection failed: ${result.error}`, 'error');
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
      const prompt = "Please explain what a task management application is in 2-3 sentences.";
      
      log(`📤 Prompt: ${prompt}`, 'info');
      
      const startTime = Date.now();
      const result = await generateText(prompt);
      const duration = Date.now() - startTime;
      
      if (result.text && result.text.length > 10) {
        log(`✅ Text generation successful in ${duration}ms`, 'success');
        log(`🤖 Response: ${result.text}`, 'info');
        testResults.simpleTextTest = true;
        return true;
      } else {
        log('❌ Text generation failed - no response', 'error');
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
      const previousStepsData = this.getPreviousStepsData(stepNumber);
      
      log(`📤 Testing ${stepName} with AI`, 'info');
      log(`📋 User Input: ${JSON.stringify(userInput, null, 2)}`, 'info');
      
      const startTime = Date.now();
      const result = await generateWorkflowResponse({
        stepNumber,
        userInput,
        previousStepsData,
        systemPrompt
      });
      const duration = Date.now() - startTime;
      
      if (result.text && result.text.length > 50) {
        log(`✅ Step ${stepNumber} AI response successful in ${duration}ms`, 'success');
        log(`🤖 Response Preview: ${result.text.substring(0, 300)}...`, 'info');
        
        testResults.workflowSteps[stepNumber] = {
          stepName,
          userInput,
          response: result.text,
          duration,
          success: true
        };
        
        return true;
      } else {
        log(`❌ Step ${stepNumber} AI response failed - insufficient response`, 'error');
        testResults.workflowSteps[stepNumber] = {
          stepName,
          userInput,
          response: result.text || 'No response',
          duration,
          success: false
        };
        return false;
      }
    } catch (error) {
      log(`❌ Step ${stepNumber} AI error: ${error.message}`, 'error');
      testResults.workflowSteps[stepNumber] = {
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
          additionalRequirements: "Real-time collaboration features, mobile offline support, push notifications"
        };
      
      case 3:
        return {
          ...baseInput,
          technicalPreferences: "React, Node.js, PostgreSQL, AWS cloud deployment, microservices architecture"
        };
      
      default:
        return baseInput;
    }
  }

  getPreviousStepsData(stepNumber) {
    const previousSteps = {};
    
    for (let i = 1; i < stepNumber; i++) {
      if (testResults.workflowSteps[i] && testResults.workflowSteps[i].success) {
        previousSteps[i] = {
          response: testResults.workflowSteps[i].response.substring(0, 500) + '...' // Truncate for context
        };
      }
    }
    
    return previousSteps;
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

    // Test 3: Workflow steps (first 3 steps)
    const workflowSteps = [
      { number: 1, name: 'Articulate Idea', prompt: 'You are a skilled product manager helping to refine and articulate app ideas.' },
      { number: 2, name: 'Fleshing Out', prompt: 'You are an expert business analyst helping to expand on app concepts.' },
      { number: 3, name: 'Technical Architecture', prompt: 'You are a senior software architect helping to design technical solutions.' }
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
        log('⏳ Waiting 2 seconds before next step...', 'info');
        await new Promise(resolve => setTimeout(resolve, 2000));
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
  
  const tester = new AIIntegrationTester();
  const success = await tester.runAllTests();
  
  if (success) {
    console.log(`\n${colors.bright}${colors.green}🎉 SUCCESS! AI Integration is working perfectly!${colors.reset}`);
    console.log(`${colors.green}✅ Gemini AI Connection: Working${colors.reset}`);
    console.log(`${colors.green}✅ Text Generation: Working${colors.reset}`);
    console.log(`${colors.green}✅ Workflow AI Responses: Working${colors.reset}`);
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