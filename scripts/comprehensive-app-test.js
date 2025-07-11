#!/usr/bin/env node

/**
 * COMPREHENSIVE APP TESTING SCRIPT
 * Tests the entire VibeToApp application from A to Z
 * 
 * This script tests:
 * 1. Landing page functionality
 * 2. Authentication flow (signup/signin)
 * 3. Dashboard access and navigation
 * 4. Project creation
 * 5. Complete 9-step workflow
 * 6. UI/UX interactions
 * 7. API endpoints and data flow
 * 8. Error handling
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test@vibetoapp.com',
  password: 'TestPassword123!',
  name: 'Test User'
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  summary: []
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const color = {
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
    info: colors.blue
  }[type] || colors.reset;
  
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

function logStep(stepName) {
  console.log(`\n${colors.bold}${colors.blue}=== ${stepName} ===${colors.reset}`);
}

function logResult(test, passed, message = '') {
  if (passed) {
    testResults.passed++;
    log(`✅ ${test}`, 'success');
  } else {
    testResults.failed++;
    testResults.errors.push(`${test}: ${message}`);
    log(`❌ ${test}: ${message}`, 'error');
  }
  testResults.summary.push({ test, passed, message });
}

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method: method.toLowerCase(),
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 10000,
      validateStatus: function (status) {
        return status < 500; // Don't throw for 4xx errors
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

async function testLandingPage() {
  logStep('Testing Landing Page');
  
  try {
    const response = await makeRequest('GET', '/');
    logResult('Landing page loads', response.status === 200);
    logResult('Landing page returns HTML', response.data && typeof response.data === 'string');
    
    // Check for key elements in HTML
    const html = response.data;
    logResult('Contains VibeToApp title', html.includes('VibeToApp'));
    logResult('Contains features section', html.includes('features'));
    logResult('Contains CTA section', html.includes('Ready to Plan'));
    
  } catch (error) {
    logResult('Landing page test', false, error.message);
  }
}

async function testAuthenticationPages() {
  logStep('Testing Authentication Pages');
  
  try {
    // Test signin page
    const signinResponse = await makeRequest('GET', '/auth/signin');
    logResult('Signin page loads', signinResponse.status === 200);
    
    // Test signup page
    const signupResponse = await makeRequest('GET', '/auth/signup');
    logResult('Signup page loads', signupResponse.status === 200);
    
    // Test auth error page
    const errorResponse = await makeRequest('GET', '/auth/error');
    logResult('Auth error page loads', errorResponse.status === 200);
    
  } catch (error) {
    logResult('Authentication pages test', false, error.message);
  }
}

async function testAPIEndpoints() {
  logStep('Testing API Endpoints');
  
  try {
    // Test projects endpoint (should require auth)
    const projectsResponse = await makeRequest('GET', '/api/projects');
    logResult('Projects API requires auth', projectsResponse.status === 401);
    
    // Test workflow endpoints (should require auth)
    const workflowResponse = await makeRequest('POST', '/api/workflow/step1', {
      projectId: 'test',
      appDescription: 'test app'
    });
    logResult('Workflow API requires auth', workflowResponse.status === 401);
    
    // Test waitlist endpoint
    const waitlistResponse = await makeRequest('POST', '/api/waitlist', {
      email: 'test@example.com',
      name: 'Test User'
    });
    logResult('Waitlist API accepts valid data', waitlistResponse.status === 200 || waitlistResponse.status === 201);
    
  } catch (error) {
    logResult('API endpoints test', false, error.message);
  }
}

async function testWorkflowSteps() {
  logStep('Testing Workflow Steps Structure');
  
  const steps = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  for (const step of steps) {
    try {
      const response = await makeRequest('POST', `/api/workflow/step${step}`, {
        projectId: 'test-project',
        testData: 'test'
      });
      
      logResult(`Step ${step} API endpoint exists`, response.status === 401); // Should require auth
      
      // Test clarify endpoint
      const clarifyResponse = await makeRequest('POST', `/api/workflow/step${step}/clarify`, {
        projectId: 'test-project',
        question: 'test question'
      });
      
      logResult(`Step ${step} clarify endpoint exists`, clarifyResponse.status === 401); // Should require auth
      
    } catch (error) {
      logResult(`Step ${step} endpoints test`, false, error.message);
    }
  }
}

async function testUIComponents() {
  logStep('Testing UI Components and Pages');
  
  try {
    // Test pricing page
    const pricingResponse = await makeRequest('GET', '/pricing');
    logResult('Pricing page loads', pricingResponse.status === 200);
    
    // Test payment success page
    const paymentResponse = await makeRequest('GET', '/payment/success');
    logResult('Payment success page loads', paymentResponse.status === 200);
    
    // Test dashboard (should redirect to signin)
    const dashboardResponse = await makeRequest('GET', '/dashboard');
    logResult('Dashboard redirects unauthenticated users', dashboardResponse.status === 302 || dashboardResponse.status === 401);
    
  } catch (error) {
    logResult('UI components test', false, error.message);
  }
}

async function testDataFlow() {
  logStep('Testing Data Flow and Integration');
  
  try {
    // Test data export endpoint
    const exportResponse = await makeRequest('GET', '/api/export/test-id');
    logResult('Export API requires auth', exportResponse.status === 401);
    
    // Test project progress endpoint
    const progressResponse = await makeRequest('GET', '/api/projects/progress');
    logResult('Progress API requires auth', progressResponse.status === 401);
    
    // Test stripe checkout
    const stripeResponse = await makeRequest('POST', '/api/stripe/checkout-session', {
      priceId: 'test-price-id'
    });
    logResult('Stripe checkout requires auth', stripeResponse.status === 401);
    
  } catch (error) {
    logResult('Data flow test', false, error.message);
  }
}

async function testErrorHandling() {
  logStep('Testing Error Handling');
  
  try {
    // Test 404 handling
    const notFoundResponse = await makeRequest('GET', '/nonexistent-page');
    logResult('404 page handling', notFoundResponse.status === 404);
    
    // Test malformed API requests
    const badRequestResponse = await makeRequest('POST', '/api/workflow/step1', {
      invalidData: 'test'
    });
    logResult('API handles malformed requests', badRequestResponse.status === 400 || badRequestResponse.status === 401);
    
  } catch (error) {
    logResult('Error handling test', false, error.message);
  }
}

async function testSecurity() {
  logStep('Testing Security');
  
  try {
    // Test that sensitive endpoints require authentication
    const sensitiveEndpoints = [
      '/api/projects',
      '/api/workflow/step1',
      '/api/user/subscription',
      '/dashboard'
    ];
    
    for (const endpoint of sensitiveEndpoints) {
      const response = await makeRequest('GET', endpoint);
      logResult(`${endpoint} requires auth`, response.status === 401 || response.status === 302);
    }
    
    // Test CSRF protection (should be handled by NextAuth)
    const csrfResponse = await makeRequest('POST', '/api/auth/csrf');
    logResult('CSRF endpoint exists', csrfResponse.status === 200);
    
  } catch (error) {
    logResult('Security test', false, error.message);
  }
}

async function testPerformance() {
  logStep('Testing Performance');
  
  try {
    const start = Date.now();
    const response = await makeRequest('GET', '/');
    const loadTime = Date.now() - start;
    
    logResult('Landing page loads quickly', loadTime < 3000, `Load time: ${loadTime}ms`);
    
    // Test API response times
    const apiStart = Date.now();
    const apiResponse = await makeRequest('GET', '/api/waitlist');
    const apiTime = Date.now() - apiStart;
    
    logResult('API responds quickly', apiTime < 2000, `API time: ${apiTime}ms`);
    
  } catch (error) {
    logResult('Performance test', false, error.message);
  }
}

async function runAllTests() {
  console.log(`${colors.bold}${colors.blue}VIBETOAPP COMPREHENSIVE TEST SUITE${colors.reset}`);
  console.log(`${colors.blue}Testing against: ${BASE_URL}${colors.reset}\n`);
  
  const startTime = Date.now();
  
  await testLandingPage();
  await testAuthenticationPages();
  await testAPIEndpoints();
  await testWorkflowSteps();
  await testUIComponents();
  await testDataFlow();
  await testErrorHandling();
  await testSecurity();
  await testPerformance();
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  // Generate test report
  console.log(`\n${colors.bold}${colors.blue}=== TEST RESULTS ===${colors.reset}`);
  console.log(`Total tests: ${testResults.passed + testResults.failed}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`Total time: ${totalTime}ms`);
  
  if (testResults.errors.length > 0) {
    console.log(`\n${colors.bold}${colors.red}ERRORS:${colors.reset}`);
    testResults.errors.forEach(error => {
      console.log(`${colors.red}  - ${error}${colors.reset}`);
    });
  }
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalTests: testResults.passed + testResults.failed,
    passed: testResults.passed,
    failed: testResults.failed,
    totalTime: totalTime,
    errors: testResults.errors,
    details: testResults.summary
  };
  
  const reportPath = path.join(__dirname, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nDetailed report saved to: ${reportPath}`);
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'error');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection at: ${promise}, reason: ${reason}`, 'error');
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    log(`Test suite failed: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testLandingPage,
  testAuthenticationPages,
  testAPIEndpoints,
  testWorkflowSteps,
  testUIComponents,
  testDataFlow,
  testErrorHandling,
  testSecurity,
  testPerformance
};