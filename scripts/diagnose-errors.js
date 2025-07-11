#!/usr/bin/env node

/**
 * Diagnose specific errors in the application
 */

const axios = require('axios');

async function diagnoseErrors() {
  console.log('🔍 Diagnosing application errors...\n');
  
  // Test 1: Check if server is responding at all
  try {
    console.log('1. Testing server response...');
    const response = await axios.get('http://localhost:3000', {
      timeout: 10000,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Test Bot)'
      }
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response type: ${typeof response.data}`);
    console.log(`   Content length: ${response.data ? response.data.length : 0}`);
    
    if (response.status === 500) {
      console.log('   ❌ Server is returning 500 Internal Server Error');
      console.log('   💡 This suggests a runtime error in the application');
      
      // Try to get more details from the response
      if (response.data && typeof response.data === 'string') {
        console.log(`   Response content: ${response.data.substring(0, 200)}...`);
      }
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   💡 Server is not running. Start with: npm run dev');
      return;
    }
  }
  
  // Test 2: Check Next.js API routes
  console.log('\n2. Testing Next.js API health...');
  try {
    const apiResponse = await axios.get('http://localhost:3000/api/auth/providers', {
      timeout: 5000,
      validateStatus: () => true
    });
    
    console.log(`   /api/auth/providers: ${apiResponse.status}`);
    
    if (apiResponse.status === 500) {
      console.log('   ❌ NextAuth is failing');
      console.log('   💡 Possible causes:');
      console.log('      - Database connection issues');
      console.log('      - Environment variables missing');
      console.log('      - Version compatibility issues');
      console.log('      - Prisma adapter issues');
    }
    
  } catch (error) {
    console.log(`   ❌ API test failed: ${error.message}`);
  }
  
  // Test 3: Check static files
  console.log('\n3. Testing static file serving...');
  try {
    const staticResponse = await axios.get('http://localhost:3000/favicon.ico', {
      timeout: 5000,
      validateStatus: () => true
    });
    
    console.log(`   /favicon.ico: ${staticResponse.status}`);
    
    if (staticResponse.status === 200) {
      console.log('   ✅ Static file serving works');
    } else {
      console.log('   ❌ Static file serving issues');
    }
    
  } catch (error) {
    console.log(`   ❌ Static file test failed: ${error.message}`);
  }
  
  // Test 4: Check database connection
  console.log('\n4. Testing database connection...');
  try {
    const { execSync } = require('child_process');
    const result = execSync('npx prisma db push --accept-data-loss', {
      cwd: process.cwd(),
      encoding: 'utf8',
      timeout: 10000
    });
    
    console.log('   ✅ Database connection works');
    
  } catch (error) {
    console.log(`   ❌ Database connection failed: ${error.message}`);
    console.log('   💡 Check PostgreSQL service and credentials');
  }
  
  console.log('\n🎯 Recommendations:');
  console.log('1. Check the terminal running "npm run dev" for specific error messages');
  console.log('2. Try restarting the dev server');
  console.log('3. Check if all environment variables are set correctly');
  console.log('4. Verify PostgreSQL is running and accessible');
  console.log('5. Consider downgrading React to a stable version (18.x)');
}

diagnoseErrors().catch(console.error);