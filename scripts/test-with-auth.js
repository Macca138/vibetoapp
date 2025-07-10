const https = require('http');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'testuser@example.com',
  password: 'testpassword123'
};

// Cookie jar to store session cookies
let cookies = [];

// Helper function to make HTTP requests with cookies
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Test Script)',
        ...headers
      }
    };

    // Add cookies to request
    if (cookies.length > 0) {
      options.headers['Cookie'] = cookies.join('; ');
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      // Store cookies from response
      const setCookieHeaders = res.headers['set-cookie'];
      if (setCookieHeaders) {
        setCookieHeaders.forEach(cookie => {
          const cookieName = cookie.split(';')[0];
          // Update or add cookie
          const existingIndex = cookies.findIndex(c => c.split('=')[0] === cookieName.split('=')[0]);
          if (existingIndex >= 0) {
            cookies[existingIndex] = cookieName;
          } else {
            cookies.push(cookieName);
          }
        });
      }

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testAuthentication() {
  console.log('🔐 Testing Authentication...');
  
  try {
    // Try to sign in with credentials
    const signInResponse = await makeRequest('POST', '/api/auth/signin/credentials', {
      email: TEST_USER.email,
      password: TEST_USER.password,
      redirect: false
    });
    
    console.log('Sign-in response:', signInResponse.status, signInResponse.data);
    
    // Check current session
    const sessionResponse = await makeRequest('GET', '/api/auth/session');
    console.log('Session response:', sessionResponse.status, sessionResponse.data);
    
    return sessionResponse.data && sessionResponse.data.user;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
}

async function testProjectCreation(authenticated) {
  if (!authenticated) {
    console.log('❌ Skipping project creation - not authenticated');
    return null;
  }
  
  console.log('📁 Testing Project Creation...');
  
  try {
    const projectData = {
      name: 'Test App Project',
      description: 'A test project for automated testing'
    };
    
    const response = await makeRequest('POST', '/api/projects', projectData);
    console.log('Project creation response:', response.status, response.data);
    
    if (response.status === 201 && response.data.project) {
      return response.data.project.id;
    }
    
    return null;
  } catch (error) {
    console.error('Project creation error:', error);
    return null;
  }
}

async function testWorkflowStep1(projectId) {
  if (!projectId) {
    console.log('❌ Skipping workflow step 1 - no project ID');
    return false;
  }
  
  console.log('🚀 Testing Workflow Step 1...');
  
  try {
    const stepData = {
      projectId: projectId,
      appIdea: 'I want to create a mobile app that helps people track their daily habits and build better routines. The app should be simple to use and provide motivation through gamification.',
      inspiration: 'I noticed that I struggle to maintain consistent habits and thought others might have the same problem.',
      problemSolving: 'This app will help people build better habits by making habit tracking fun and engaging through points, streaks, and achievements.'
    };
    
    const response = await makeRequest('POST', '/api/workflow/step1', stepData);
    console.log('Step 1 response:', response.status);
    
    if (response.data && response.data.data) {
      console.log('✅ AI Analysis received:', {
        coreProblem: response.data.data.analysis?.coreProblem || 'Generated',
        targetAudience: response.data.data.analysis?.targetAudience || 'Generated',
        recommendations: response.data.data.recommendations?.length || 0,
        followUpQuestions: response.data.data.followUpQuestions?.length || 0
      });
      return true;
    } else {
      console.log('❌ No AI data in response:', response.data);
      return false;
    }
  } catch (error) {
    console.error('Workflow step 1 error:', error);
    return false;
  }
}

async function testExportGeneration(projectId) {
  if (!projectId) {
    console.log('❌ Skipping export generation - no project ID');
    return false;
  }
  
  console.log('📄 Testing Export Generation...');
  
  try {
    const exportData = {
      projectId: projectId,
      formats: ['PDF', 'Markdown']
    };
    
    const response = await makeRequest('POST', '/api/export/generate', exportData);
    console.log('Export generation response:', response.status, response.data);
    
    return response.status === 200 && response.data.success;
  } catch (error) {
    console.error('Export generation error:', error);
    return false;
  }
}

async function testQueueSystem() {
  console.log('⚡ Testing Queue System...');
  
  try {
    const response = await makeRequest('GET', '/api/admin/queues');
    console.log('Queue status:', response.status);
    
    if (response.data && response.data.stats) {
      console.log('✅ Queue stats:', {
        exportQueue: response.data.stats.find(s => s.name === 'export'),
        emailQueue: response.data.stats.find(s => s.name === 'email'),
        healthy: response.data.health?.healthy
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Queue system error:', error);
    return false;
  }
}

// Main test execution
async function runFullTest() {
  console.log('🎯 Starting Full Application Test');
  console.log('================================');
  
  const results = {
    authentication: false,
    projectCreation: false,
    workflowStep1: false,
    exportGeneration: false,
    queueSystem: false
  };
  
  // Test authentication
  results.authentication = await testAuthentication();
  
  // Test project creation
  const projectId = await testProjectCreation(results.authentication);
  results.projectCreation = !!projectId;
  
  // Test workflow step 1
  results.workflowStep1 = await testWorkflowStep1(projectId);
  
  // Test export generation
  results.exportGeneration = await testExportGeneration(projectId);
  
  // Test queue system
  results.queueSystem = await testQueueSystem();
  
  // Summary
  console.log('\n🎯 FULL TEST RESULTS');
  console.log('====================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n📊 Overall: ${passedCount}/${totalCount} tests passed`);
  
  if (passedCount === totalCount) {
    console.log('🎉 ALL TESTS PASSED - Application is fully functional!');
  } else {
    console.log('⚠️  Some tests failed - needs investigation');
  }
}

// Run the test
runFullTest().catch(console.error);