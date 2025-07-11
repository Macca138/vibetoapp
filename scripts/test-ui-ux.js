#!/usr/bin/env node

/**
 * Comprehensive UI/UX Test
 * Tests all major pages and components for errors and usability issues
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

let testResults = {
  pages: {},
  components: {},
  errors: [],
  warnings: [],
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

class UIUXTester {
  constructor() {
    this.startTime = Date.now();
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
        timeout: 10000,
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

  logResult(test, passed, message = '') {
    testResults.summary.totalTests++;
    if (passed) {
      testResults.summary.passed++;
      log(`✅ ${test}`, 'success');
    } else {
      testResults.summary.failed++;
      testResults.errors.push(`${test}: ${message}`);
      log(`❌ ${test}: ${message}`, 'error');
    }
  }

  logWarning(test, message = '') {
    testResults.summary.warnings++;
    testResults.warnings.push(`${test}: ${message}`);
    log(`⚠️ ${test}: ${message}`, 'warning');
  }

  async testPage(pageName, endpoint, expectedElements = []) {
    logStep(`Testing ${pageName} Page`);
    
    try {
      const response = await this.makeRequest('GET', endpoint);
      
      // Test basic page loading
      this.logResult(`${pageName} page loads`, response.status === 200);
      
      if (response.status === 200 && response.data) {
        const html = response.data;
        
        // Test for HTML structure
        this.logResult(`${pageName} returns HTML`, html.includes('<!DOCTYPE html>'));
        
        // Test for no server errors in HTML
        this.logResult(`${pageName} no server errors`, !html.includes('Application error'));
        
        // Test for basic React hydration
        this.logResult(`${pageName} React hydration`, html.includes('__next'));
        
        // Test for CSS loading
        this.logResult(`${pageName} CSS loading`, html.includes('/_next/static/css/'));
        
        // Test for JavaScript loading
        this.logResult(`${pageName} JavaScript loading`, html.includes('/_next/static/chunks/'));
        
        // Test for expected elements
        expectedElements.forEach(element => {
          this.logResult(`${pageName} contains ${element}`, html.includes(element));
        });
        
        // Test for actual server errors (not just the string "500")
        if (html.includes('500 Internal Server Error') || html.includes('Application error') || html.includes('error 500')) {
          this.logResult(`${pageName} no 500 errors`, false, 'Contains 500 error');
        } else {
          this.logResult(`${pageName} no 500 errors`, true);
        }
        
        // Test for console errors (basic check)
        if (html.includes('console.error') || html.includes('TypeError')) {
          this.logWarning(`${pageName} potential console errors`, 'May contain console errors');
        }
        
        // Store page data
        testResults.pages[pageName] = {
          endpoint,
          status: response.status,
          hasHTML: html.includes('<!DOCTYPE html>'),
          hasReact: html.includes('__next'),
          hasCSS: html.includes('/_next/static/css/'),
          hasJS: html.includes('/_next/static/chunks/'),
          timestamp: new Date().toISOString()
        };
        
      } else {
        this.logResult(`${pageName} valid response`, false, `Got ${response.status}`);
      }
      
    } catch (error) {
      this.logResult(`${pageName} page test`, false, error.message);
    }
  }

  async testAuthPages() {
    logStep('Testing Authentication Pages');
    
    await this.testPage('Sign In', '/auth/signin', [
      'Sign in to your account',
      'email',
      'password',
      'Continue with Google',
      'Continue with GitHub'
    ]);
    
    await this.testPage('Sign Up', '/auth/signup', [
      'Create your account',
      'email',
      'password',
      'name'
    ]);
    
    await this.testPage('Auth Error', '/auth/error', [
      'Authentication Error',
      'error occurred'
    ]);
  }

  async testMainPages() {
    logStep('Testing Main Application Pages');
    
    await this.testPage('Landing Page', '/', [
      'VibeToApp',
      'Transform Your App Ideas',
      'Features'
    ]);
    
    await this.testPage('Pricing', '/pricing', [
      'Pricing',
      'Project Unlock',
      'Monthly Subscription',
      'Yearly Subscription'
    ]);
    
    await this.testPage('Payment Success', '/payment/success', [
      'Processing your payment',
      'Please wait'
    ]);
  }

  async testAPIHealthCheck() {
    logStep('Testing API Health');
    
    try {
      // Test NextAuth providers
      const authResponse = await this.makeRequest('GET', '/api/auth/providers');
      this.logResult('NextAuth providers API', authResponse.status === 200);
      
      // Test waitlist API
      const waitlistResponse = await this.makeRequest('GET', '/api/waitlist');
      this.logResult('Waitlist API', waitlistResponse.status === 200);
      
      // Test CSRF endpoint
      const csrfResponse = await this.makeRequest('GET', '/api/auth/csrf');
      this.logResult('CSRF endpoint', csrfResponse.status === 200);
      
    } catch (error) {
      this.logResult('API health check', false, error.message);
    }
  }

  async testStaticAssets() {
    logStep('Testing Static Assets');
    
    try {
      const faviconResponse = await this.makeRequest('GET', '/favicon.ico');
      this.logResult('Favicon loads', faviconResponse.status === 200);
      
      // Test if CSS files are accessible (we'll try to find one from the landing page)
      const landingResponse = await this.makeRequest('GET', '/');
      if (landingResponse.status === 200) {
        const cssMatch = landingResponse.data.match(/\/_next\/static\/css\/[^"]+/);
        if (cssMatch) {
          const cssResponse = await this.makeRequest('GET', cssMatch[0]);
          this.logResult('CSS files accessible', cssResponse.status === 200);
        } else {
          this.logWarning('CSS file detection', 'Could not find CSS file in HTML');
        }
      }
      
    } catch (error) {
      this.logResult('Static assets test', false, error.message);
    }
  }

  async testResponsiveness() {
    logStep('Testing Mobile Responsiveness');
    
    try {
      // Test with mobile user agent
      const mobileHeaders = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
      };
      
      const mobileResponse = await this.makeRequest('GET', '/', null, mobileHeaders);
      this.logResult('Mobile user agent response', mobileResponse.status === 200);
      
      if (mobileResponse.status === 200) {
        const html = mobileResponse.data;
        this.logResult('Mobile viewport meta tag', html.includes('viewport'));
        // Check for responsive design indicators
        this.logResult('Mobile responsive CSS', 
          html.includes('responsive') || 
          html.includes('mobile') || 
          html.includes('max-w-') || 
          html.includes('sm:') || 
          html.includes('md:') || 
          html.includes('lg:')
        );
      }
      
    } catch (error) {
      this.logResult('Mobile responsiveness test', false, error.message);
    }
  }

  async testAccessibility() {
    logStep('Testing Basic Accessibility');
    
    try {
      const response = await this.makeRequest('GET', '/');
      
      if (response.status === 200) {
        const html = response.data;
        
        // Basic accessibility checks
        this.logResult('Has lang attribute', html.includes('lang="'));
        this.logResult('Has page title', html.includes('<title>'));
        this.logResult('Has meta description', html.includes('meta name="description"'));
        
        // Check for semantic HTML
        this.logResult('Uses semantic HTML', 
          html.includes('<main') || 
          html.includes('<nav') || 
          html.includes('<header') || 
          html.includes('<footer')
        );
        
        // Check for alt text consideration
        if (html.includes('<img')) {
          this.logResult('Images have alt consideration', html.includes('alt='));
        } else {
          this.logResult('Images have alt consideration', true, 'No images found');
        }
        
      }
      
    } catch (error) {
      this.logResult('Accessibility test', false, error.message);
    }
  }

  async testErrorHandling() {
    logStep('Testing Error Handling');
    
    try {
      // Test 404 page
      const notFoundResponse = await this.makeRequest('GET', '/nonexistent-page-12345');
      this.logResult('404 page handling', notFoundResponse.status === 404);
      
      // Test malformed API requests
      const malformedResponse = await this.makeRequest('POST', '/api/waitlist', 'invalid json');
      this.logResult('Malformed API request handling', malformedResponse.status === 400);
      
    } catch (error) {
      this.logResult('Error handling test', false, error.message);
    }
  }

  async runAllTests() {
    logStep('Starting Comprehensive UI/UX Tests');
    
    // Test all main pages
    await this.testMainPages();
    
    // Test authentication pages
    await this.testAuthPages();
    
    // Test API health
    await this.testAPIHealthCheck();
    
    // Test static assets
    await this.testStaticAssets();
    
    // Test responsiveness
    await this.testResponsiveness();
    
    // Test accessibility
    await this.testAccessibility();
    
    // Test error handling
    await this.testErrorHandling();
    
    // Generate summary
    const duration = Date.now() - this.startTime;
    testResults.summary.duration = duration;
    testResults.summary.timestamp = new Date().toISOString();
    
    // Save detailed results
    const resultsPath = path.join(process.cwd(), 'scripts', 'ui-ux-test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    
    // Display summary
    logStep('UI/UX Test Summary');
    log(`📊 Total Tests: ${testResults.summary.totalTests}`, 'info');
    log(`✅ Passed: ${testResults.summary.passed}`, 'success');
    log(`❌ Failed: ${testResults.summary.failed}`, 'error');
    log(`⚠️ Warnings: ${testResults.summary.warnings}`, 'warning');
    log(`⏱️ Duration: ${(duration / 1000).toFixed(1)}s`, 'info');
    log(`💾 Results saved to: ${resultsPath}`, 'info');
    
    if (testResults.errors.length > 0) {
      console.log(`\n${colors.bright}${colors.red}ERRORS:${colors.reset}`);
      testResults.errors.forEach(error => {
        console.log(`${colors.red}  - ${error}${colors.reset}`);
      });
    }
    
    if (testResults.warnings.length > 0) {
      console.log(`\n${colors.bright}${colors.yellow}WARNINGS:${colors.reset}`);
      testResults.warnings.forEach(warning => {
        console.log(`${colors.yellow}  - ${warning}${colors.reset}`);
      });
    }
    
    const successRate = (testResults.summary.passed / testResults.summary.totalTests * 100).toFixed(1);
    
    if (testResults.summary.failed === 0) {
      console.log(`\n${colors.bright}${colors.green}🎉 SUCCESS! All UI/UX tests passed (${successRate}% success rate)${colors.reset}`);
    } else if (successRate >= 90) {
      console.log(`\n${colors.bright}${colors.yellow}✨ MOSTLY SUCCESSFUL! ${successRate}% success rate${colors.reset}`);
    } else {
      console.log(`\n${colors.bright}${colors.red}❌ ISSUES FOUND! ${successRate}% success rate${colors.reset}`);
    }
    
    return testResults.summary.failed === 0;
  }
}

// Run the test
async function main() {
  console.log(`${colors.bright}${colors.blue}VIBETOAPP UI/UX COMPREHENSIVE TEST${colors.reset}`);
  console.log(`${colors.blue}Testing all pages, components, and user experience elements${colors.reset}\n`);
  
  const tester = new UIUXTester();
  const success = await tester.runAllTests();
  
  process.exit(success ? 0 : 1);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch(console.error);