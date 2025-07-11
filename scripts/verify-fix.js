#!/usr/bin/env node

/**
 * Verify that the server fix worked
 */

const axios = require('axios');

async function verifyFix() {
  console.log('🔍 Verifying server fix...\n');
  
  let allGood = true;
  
  // Test 1: Landing page
  try {
    const response = await axios.get('http://localhost:3000', {
      timeout: 5000,
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      console.log('✅ Landing page loads correctly');
    } else {
      console.log(`❌ Landing page returns: ${response.status}`);
      allGood = false;
    }
  } catch (error) {
    console.log(`❌ Landing page failed: ${error.message}`);
    allGood = false;
  }
  
  // Test 2: NextAuth
  try {
    const authResponse = await axios.get('http://localhost:3000/api/auth/providers', {
      timeout: 5000,
      validateStatus: () => true
    });
    
    if (authResponse.status === 200) {
      console.log('✅ NextAuth works correctly');
    } else {
      console.log(`❌ NextAuth returns: ${authResponse.status}`);
      allGood = false;
    }
  } catch (error) {
    console.log(`❌ NextAuth failed: ${error.message}`);
    allGood = false;
  }
  
  // Test 3: Static files
  try {
    const staticResponse = await axios.get('http://localhost:3000/favicon.ico', {
      timeout: 5000,
      validateStatus: () => true
    });
    
    if (staticResponse.status === 200) {
      console.log('✅ Static files serve correctly');
    } else {
      console.log(`❌ Static files return: ${staticResponse.status}`);
      allGood = false;
    }
  } catch (error) {
    console.log(`❌ Static files failed: ${error.message}`);
    allGood = false;
  }
  
  // Test 4: API routes
  try {
    const apiResponse = await axios.post('http://localhost:3000/api/waitlist', {
      email: 'test@example.com',
      name: 'Test User'
    }, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    if (apiResponse.status === 200 || apiResponse.status === 201) {
      console.log('✅ API routes work correctly');
    } else {
      console.log(`❌ API routes return: ${apiResponse.status}`);
      allGood = false;
    }
  } catch (error) {
    console.log(`❌ API routes failed: ${error.message}`);
    allGood = false;
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allGood) {
    console.log('🎉 SUCCESS! Server is working correctly.');
    console.log('✅ Ready to run comprehensive tests.');
    console.log('\nRun: node scripts/comprehensive-app-test.js');
  } else {
    console.log('❌ Some issues remain. Please check:');
    console.log('   1. Did you restart the dev server?');
    console.log('   2. Did you clear .next cache?');
    console.log('   3. Are all environment variables set?');
    console.log('   4. Check terminal for specific error messages');
  }
}

verifyFix().catch(console.error);