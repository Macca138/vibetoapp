#!/usr/bin/env node

/**
 * End-to-end workflow test with AI interactions
 * Tests the complete 9-step workflow with dummy project data
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

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

class WorkflowTester {
  constructor() {
    this.session = null;
    this.projectId = null;
    this.currentStep = 0;
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    try {
      const config = {
        method: method.toLowerCase(),
        url: `${BASE_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: 60000, // 60 seconds for AI requests
        validateStatus: function (status) {
          return status < 500;
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
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
    
    const response = await this.makeRequest('POST', endpoint, stepData);
    
    if (response.status === 200) {
      log(`✅ Step ${stepNumber} completed successfully`, 'success');
      log(`📊 Response: ${JSON.stringify(response.data, null, 2)}`, 'info');
      
      // Store results
      workflowResults.steps[stepNumber] = {
        request: stepData,
        response: response.data,
        timestamp: new Date().toISOString()
      };
      
      return response.data;
    } else if (response.status === 401) {
      log(`❌ Step ${stepNumber} failed: Authentication required`, 'error');
      return null;
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
          platform: dummyProjectData.platform
        };
      
      case 2:
        return {
          ...baseData,
          previousStepData: workflowResults.steps[1]?.response || {},
          additionalRequirements: "Real-time collaboration features, mobile offline support"
        };
      
      case 3:
        return {
          ...baseData,
          previousStepData: workflowResults.steps[2]?.response || {},
          technicalPreferences: "React, Node.js, PostgreSQL, cloud deployment"
        };
      
      case 4:
        return {
          ...baseData,
          previousStepData: workflowResults.steps[3]?.response || {},
          userStories: "As a user, I want to create tasks, assign them to team members, and track progress"
        };
      
      case 5:
        return {
          ...baseData,
          previousStepData: workflowResults.steps[4]?.response || {},
          designPreferences: "Modern, clean UI with dark mode support"
        };
      
      case 6:
        return {
          ...baseData,
          previousStepData: workflowResults.steps[5]?.response || {},
          screenRequirements: "Dashboard, task list, project view, user profile"
        };
      
      case 7:
        return {
          ...baseData,
          previousStepData: workflowResults.steps[6]?.response || {},
          technicalConstraints: "Must support 1000+ concurrent users, 99.9% uptime"
        };
      
      case 8:
        return {
          ...baseData,
          previousStepData: workflowResults.steps[7]?.response || {},
          developmentRules: "Test-driven development, code reviews, CI/CD pipeline"
        };
      
      case 9:
        return {
          ...baseData,
          previousStepData: workflowResults.steps[8]?.response || {},
          timelineConstraints: "6-month development timeline, 3-person team"
        };
      
      default:
        return baseData;
    }
  }

  async testClarificationStep(stepNumber) {
    logStep(`Testing Step ${stepNumber} Clarification`);
    
    const clarificationData = {
      projectId: this.projectId,
      question: "Can you provide more details about the user authentication system?",
      previousResponse: workflowResults.steps[stepNumber]?.response || {}
    };
    
    const endpoint = `/api/workflow/step${stepNumber}/clarify`;
    
    log(`📤 Sending clarification request to ${endpoint}`, 'info');
    
    const response = await this.makeRequest('POST', endpoint, clarificationData);
    
    if (response.status === 200) {
      log(`✅ Step ${stepNumber} clarification completed successfully`, 'success');
      log(`📊 Clarification response: ${JSON.stringify(response.data, null, 2)}`, 'info');
      return response.data;
    } else {
      log(`❌ Step ${stepNumber} clarification failed: ${response.status} - ${JSON.stringify(response.data)}`, 'error');
      return null;
    }
  }

  async runCompleteWorkflow() {
    logStep('Starting Complete Workflow Test');
    
    // First, try to create a project (this will require authentication)
    const projectCreated = await this.createProject();
    
    if (!projectCreated) {
      log('❌ Cannot proceed without authentication. Please ensure you are logged in.', 'error');
      log('ℹ️  This test requires authentication to work properly.', 'warning');
      return false;
    }

    let allStepsSuccessful = true;
    
    // Test each workflow step
    for (let step = 1; step <= 9; step++) {
      const result = await this.testWorkflowStep(step);
      
      if (!result) {
        allStepsSuccessful = false;
        log(`❌ Step ${step} failed, but continuing with next steps...`, 'warning');
        continue;
      }
      
      // Test clarification for some steps
      if (step <= 3) {
        await this.testClarificationStep(step);
      }
      
      // Add a small delay between steps
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Save results to file
    const resultsPath = path.join(process.cwd(), 'scripts', 'workflow-test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(workflowResults, null, 2));
    
    logStep('Workflow Test Summary');
    log(`📁 Project ID: ${this.projectId}`, 'info');
    log(`📊 Steps completed: ${Object.keys(workflowResults.steps).length}/9`, 'info');
    log(`💾 Results saved to: ${resultsPath}`, 'info');
    
    if (allStepsSuccessful) {
      log('🎉 All workflow steps completed successfully!', 'success');
    } else {
      log('⚠️  Some steps failed (likely due to authentication)', 'warning');
    }
    
    return allStepsSuccessful;
  }
}

// Run the test
async function main() {
  console.log(`${colors.bright}${colors.blue}VIBETOAPP WORKFLOW E2E TEST${colors.reset}`);
  console.log(`${colors.blue}Testing complete workflow with AI interactions${colors.reset}\n`);
  
  const tester = new WorkflowTester();
  const success = await tester.runCompleteWorkflow();
  
  process.exit(success ? 0 : 1);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch(console.error);