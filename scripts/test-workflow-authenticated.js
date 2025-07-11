#!/usr/bin/env node

/**
 * End-to-end workflow test with authentication
 * Uses test user credentials to authenticate and test the complete workflow
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'testuser@example.com',
  password: 'testpassword123'
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
  projectId: null,
  steps: {}
};

class AuthenticatedWorkflowTester {
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

  async authenticate() {
    logStep('Authenticating with Test User');
    
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
        log(`🤖 AI Analysis Preview: ${response.data.analysis.substring(0, 200)}...`, 'info');
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
    logStep('Starting Complete Authenticated Workflow Test');
    
    // Step 1: Authenticate
    const authSuccess = await this.authenticate();
    if (!authSuccess) {
      log('❌ Authentication failed - cannot proceed', 'error');
      return false;
    }

    // Step 2: Create project
    const projectCreated = await this.createProject();
    if (!projectCreated) {
      log('❌ Project creation failed - cannot proceed', 'error');
      return false;
    }

    let allStepsSuccessful = true;
    let completedSteps = 0;
    
    // Step 3: Test each workflow step
    for (let step = 1; step <= 9; step++) {
      const result = await this.testWorkflowStep(step);
      
      if (result) {
        completedSteps++;
        
        // Test clarification for first 3 steps
        if (step <= 3) {
          await this.testClarificationStep(step);
        }
        
        // Add delay between steps to not overwhelm the AI
        if (step < 9) {
          log(`⏳ Waiting 2 seconds before next step...`, 'info');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } else {
        allStepsSuccessful = false;
        log(`❌ Step ${step} failed, continuing with next steps...`, 'warning');
      }
    }
    
    // Save results to file
    const resultsPath = path.join(process.cwd(), 'scripts', 'workflow-test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(workflowResults, null, 2));
    
    logStep('Workflow Test Summary');
    log(`👤 Test User: ${TEST_USER.email}`, 'info');
    log(`📁 Project ID: ${this.projectId}`, 'info');
    log(`📊 Steps completed: ${completedSteps}/9`, 'info');
    log(`⏱️  Total test duration: ${this.calculateTotalDuration()}`, 'info');
    log(`💾 Results saved to: ${resultsPath}`, 'info');
    
    if (allStepsSuccessful && completedSteps === 9) {
      log('🎉 All workflow steps completed successfully with AI interactions!', 'success');
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
  console.log(`${colors.bright}${colors.blue}VIBETOAPP AUTHENTICATED WORKFLOW TEST${colors.reset}`);
  console.log(`${colors.blue}Testing complete workflow with AI interactions using test user account${colors.reset}\n`);
  
  const tester = new AuthenticatedWorkflowTester();
  const success = await tester.runCompleteWorkflow();
  
  process.exit(success ? 0 : 1);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch(console.error);