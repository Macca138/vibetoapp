#!/usr/bin/env node

/**
 * Complete workflow test with user registration and authentication
 * Creates a test user, authenticates, and tests the complete 9-step workflow
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3000';

// Generate unique test user to avoid conflicts
const TEST_USER = {
  email: `test.${crypto.randomUUID().slice(0, 8)}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User'
};

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

// Dummy project data for testing
const dummyProjectData = {
  name: "TaskMaster Pro",
  description: "A comprehensive task management and productivity application for teams and individuals",
  appDescription: "TaskMaster Pro is a modern task management application that helps teams and individuals organize their work, track progress, and boost productivity. It features project management, team collaboration, time tracking, and advanced reporting capabilities.",
  targetAudience: "Small to medium businesses, freelancers, and project managers",
  platform: "Web and mobile",
  budget: "$50,000 - $100,000",
  timeline: "6 months"
};

// Store workflow results
let workflowResults = {
  testUser: TEST_USER,
  projectId: null,
  steps: {}
};

class CompleteWorkflowTester {
  constructor() {
    this.cookies = '';
    this.projectId = null;
    this.authenticated = false;
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    try {
      const config = {
        method: method.toLowerCase(),
        url: `${BASE_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Cookie': this.cookies,
          ...headers
        },
        timeout: 120000, // 2 minutes for AI requests
        validateStatus: function (status) {
          return status < 500;
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      
      // Store cookies for session management
      if (response.headers['set-cookie']) {
        this.cookies = response.headers['set-cookie'].join('; ');
      }

      return {
        status: response.status,
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
      return {
        status: error.response?.status || 500,
        error: error.message,
        data: error.response?.data || null
      };
    }
  }

  async registerUser() {
    logStep('Registering Test User');
    
    const userData = {
      name: TEST_USER.name,
      email: TEST_USER.email,
      password: TEST_USER.password
    };

    const response = await this.makeRequest('POST', '/api/auth/register', userData);
    
    if (response.status === 200) {
      log(`✅ Successfully registered user: ${TEST_USER.email}`, 'success');
      return true;
    } else if (response.status === 400 && response.data.error && response.data.error.includes('already exists')) {
      log(`ℹ️  User already exists: ${TEST_USER.email}`, 'warning');
      return true; // Continue with existing user
    } else {
      log(`❌ Failed to register user: ${response.status} - ${JSON.stringify(response.data)}`, 'error');
      return false;
    }
  }

  async authenticate() {
    logStep('Authenticating Test User');
    
    // Step 1: Get CSRF token
    const csrfResponse = await this.makeRequest('GET', '/api/auth/csrf');
    if (csrfResponse.status !== 200) {
      log('❌ Failed to get CSRF token', 'error');
      return false;
    }

    const csrfToken = csrfResponse.data.csrfToken;
    log(`✅ Got CSRF token: ${csrfToken.substring(0, 20)}...`, 'success');

    // Step 2: Sign in with credentials
    const signInData = {
      email: TEST_USER.email,
      password: TEST_USER.password,
      csrfToken: csrfToken,
      callbackUrl: '/dashboard',
      json: true
    };

    const signInResponse = await this.makeRequest('POST', '/api/auth/callback/credentials', signInData);
    
    if (signInResponse.status === 200 && signInResponse.data.url) {
      log(`✅ Successfully authenticated as ${TEST_USER.email}`, 'success');
      this.authenticated = true;
      return true;
    } else {
      log(`❌ Authentication failed: ${signInResponse.status} - ${JSON.stringify(signInResponse.data)}`, 'error');
      return false;
    }
  }

  async createProject() {
    logStep('Creating Test Project');
    
    const projectData = {
      name: dummyProjectData.name,
      description: dummyProjectData.description,
      appDescription: dummyProjectData.appDescription,
      targetAudience: dummyProjectData.targetAudience,
      platform: dummyProjectData.platform,
      budget: dummyProjectData.budget,
      timeline: dummyProjectData.timeline
    };

    const response = await this.makeRequest('POST', '/api/projects', projectData);
    
    if (response.status === 201 || response.status === 200) {
      this.projectId = response.data.id;
      workflowResults.projectId = this.projectId;
      log(`✅ Project created successfully: ${this.projectId}`, 'success');
      return true;
    } else {
      log(`❌ Failed to create project: ${response.status} - ${JSON.stringify(response.data)}`, 'error');
      return false;
    }
  }

  async testWorkflowStep(stepNumber) {
    logStep(`Testing Step ${stepNumber}: ${this.getStepName(stepNumber)}`);
    
    const stepData = this.getStepData(stepNumber);
    const endpoint = `/api/workflow/step${stepNumber}`;
    
    log(`📤 Sending request to ${endpoint}`, 'info');
    log(`📋 Request data: ${JSON.stringify(stepData, null, 2)}`, 'info');
    
    const startTime = Date.now();
    const response = await this.makeRequest('POST', endpoint, stepData);
    const duration = Date.now() - startTime;
    
    if (response.status === 200) {
      log(`✅ Step ${stepNumber} completed successfully in ${duration}ms`, 'success');
      
      // Parse and display AI response
      if (response.data && response.data.analysis) {
        log(`🤖 AI Analysis Preview: ${response.data.analysis.substring(0, 300)}...`, 'info');
      }
      
      // Store results
      workflowResults.steps[stepNumber] = {
        request: stepData,
        response: response.data,
        timestamp: new Date().toISOString(),
        duration: duration
      };
      
      return response.data;
    } else {
      log(`❌ Step ${stepNumber} failed: ${response.status} - ${JSON.stringify(response.data)}`, 'error');
      return null;
    }
  }

  getStepName(stepNumber) {
    const stepNames = {
      1: 'Articulate Idea',
      2: 'Fleshing Out',
      3: 'Technical Architecture',
      4: 'Feature Stories & UX Flows',
      5: 'Design System & Style Guide',
      6: 'Screen States Specification',
      7: 'Comprehensive Technical Specification',
      8: 'Development Rules Integration',
      9: 'Implementation Planning'
    };
    return stepNames[stepNumber] || `Step ${stepNumber}`;
  }

  getStepData(stepNumber) {
    const baseData = {
      projectId: this.projectId,
      appDescription: dummyProjectData.appDescription
    };

    // Add step-specific data based on workflow requirements
    switch (stepNumber) {
      case 1:
        return {
          ...baseData,
          initialIdea: dummyProjectData.appDescription,
          targetAudience: dummyProjectData.targetAudience,
          platform: dummyProjectData.platform,
          budget: dummyProjectData.budget,
          timeline: dummyProjectData.timeline
        };
      
      case 2:
        return {
          ...baseData,
          previousStepData: workflowResults.steps[1]?.response || {},
          additionalRequirements: "Real-time collaboration features, mobile offline support, push notifications"
        };
      
      case 3:
        return {
          ...baseData,
          previousStepData: workflowResults.steps[2]?.response || {},
          technicalPreferences: "React, Node.js, PostgreSQL, AWS cloud deployment, microservices architecture"
        };
      
      case 4:
        return {
          ...baseData,
          previousStepData: workflowResults.steps[3]?.response || {},
          userStories: "As a user, I want to create tasks and assign them to team members. As a manager, I want to track project progress and generate reports."
        };
      
      case 5:
        return {
          ...baseData,
          previousStepData: workflowResults.steps[4]?.response || {},
          designPreferences: "Modern, clean UI with dark mode support, accessibility compliance, mobile-first design"
        };
      
      case 6:
        return {
          ...baseData,
          previousStepData: workflowResults.steps[5]?.response || {},
          screenRequirements: "Dashboard, task list, project view, user profile, settings, reports, team management"
        };
      
      case 7:
        return {
          ...baseData,
          previousStepData: workflowResults.steps[6]?.response || {},
          technicalConstraints: "Must support 1000+ concurrent users, 99.9% uptime, GDPR compliance"
        };
      
      case 8:
        return {
          ...baseData,
          previousStepData: workflowResults.steps[7]?.response || {},
          developmentRules: "Test-driven development, code reviews, CI/CD pipeline, automated testing"
        };
      
      case 9:
        return {
          ...baseData,
          previousStepData: workflowResults.steps[8]?.response || {},
          timelineConstraints: "6-month development timeline, 3-person team, agile methodology"
        };
      
      default:
        return baseData;
    }
  }

  async testClarificationStep(stepNumber) {
    logStep(`Testing Step ${stepNumber} Clarification`);
    
    const clarificationData = {
      projectId: this.projectId,
      question: `Can you provide more details about the ${this.getStepName(stepNumber).toLowerCase()} requirements?`,
      previousResponse: workflowResults.steps[stepNumber]?.response || {}
    };
    
    const endpoint = `/api/workflow/step${stepNumber}/clarify`;
    
    log(`📤 Sending clarification request to ${endpoint}`, 'info');
    
    const response = await this.makeRequest('POST', endpoint, clarificationData);
    
    if (response.status === 200) {
      log(`✅ Step ${stepNumber} clarification completed successfully`, 'success');
      if (response.data && response.data.clarification) {
        log(`🤖 AI Clarification Preview: ${response.data.clarification.substring(0, 200)}...`, 'info');
      }
      return response.data;
    } else {
      log(`❌ Step ${stepNumber} clarification failed: ${response.status} - ${JSON.stringify(response.data)}`, 'error');
      return null;
    }
  }

  async runCompleteWorkflow() {
    logStep('Starting Complete Workflow Test');
    
    // Step 1: Register test user
    const userRegistered = await this.registerUser();
    if (!userRegistered) {
      log('❌ User registration failed - cannot proceed', 'error');
      return false;
    }

    // Step 2: Authenticate
    const authSuccess = await this.authenticate();
    if (!authSuccess) {
      log('❌ Authentication failed - cannot proceed', 'error');
      return false;
    }

    // Step 3: Create project
    const projectCreated = await this.createProject();
    if (!projectCreated) {
      log('❌ Project creation failed - cannot proceed', 'error');
      return false;
    }

    let allStepsSuccessful = true;
    let completedSteps = 0;
    
    // Step 4: Test each workflow step
    for (let step = 1; step <= 9; step++) {
      const result = await this.testWorkflowStep(step);
      
      if (result) {
        completedSteps++;
        
        // Test clarification for first 2 steps
        if (step <= 2) {
          await this.testClarificationStep(step);
        }
        
        // Add delay between steps to not overwhelm the AI
        if (step < 9) {
          log(`⏳ Waiting 3 seconds before next step...`, 'info');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } else {
        allStepsSuccessful = false;
        log(`❌ Step ${step} failed, continuing with next steps...`, 'warning');
      }
    }
    
    // Save results to file
    const resultsPath = path.join(process.cwd(), 'scripts', 'workflow-test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(workflowResults, null, 2));
    
    logStep('Complete Workflow Test Summary');
    log(`👤 Test User: ${TEST_USER.email}`, 'info');
    log(`📁 Project ID: ${this.projectId}`, 'info');
    log(`📊 Steps completed: ${completedSteps}/9`, 'info');
    log(`⏱️  Total AI processing time: ${this.calculateTotalDuration()}`, 'info');
    log(`💾 Results saved to: ${resultsPath}`, 'info');
    
    if (allStepsSuccessful && completedSteps === 9) {
      log('🎉 All workflow steps completed successfully with AI interactions!', 'success');
      log('✅ The AI integration and workflow system is working perfectly!', 'success');
    } else if (completedSteps > 0) {
      log(`⚠️  ${completedSteps} out of 9 steps completed successfully`, 'warning');
    } else {
      log('❌ No workflow steps completed successfully', 'error');
    }
    
    return allStepsSuccessful && completedSteps === 9;
  }

  calculateTotalDuration() {
    const durations = Object.values(workflowResults.steps).map(step => step.duration || 0);
    const totalMs = durations.reduce((sum, duration) => sum + duration, 0);
    return `${(totalMs / 1000).toFixed(1)}s`;
  }
}

// Run the test
async function main() {
  console.log(`${colors.bright}${colors.blue}VIBETOAPP COMPLETE WORKFLOW TEST${colors.reset}`);
  console.log(`${colors.blue}Testing end-to-end workflow with user registration, authentication, and AI interactions${colors.reset}\n`);
  
  const tester = new CompleteWorkflowTester();
  const success = await tester.runCompleteWorkflow();
  
  if (success) {
    console.log(`\n${colors.bright}${colors.green}🎉 SUCCESS! The complete workflow system is working perfectly!${colors.reset}`);
    console.log(`${colors.green}✅ User registration: Working${colors.reset}`);
    console.log(`${colors.green}✅ Authentication: Working${colors.reset}`);
    console.log(`${colors.green}✅ Project creation: Working${colors.reset}`);
    console.log(`${colors.green}✅ AI integration: Working${colors.reset}`);
    console.log(`${colors.green}✅ All 9 workflow steps: Working${colors.reset}`);
  } else {
    console.log(`\n${colors.bright}${colors.red}❌ Some components need attention${colors.reset}`);
  }
  
  process.exit(success ? 0 : 1);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch(console.error);