#!/usr/bin/env node

const axios = require('axios');

async function debugServer() {
  console.log('🔍 Debugging server issues...\n');
  
  try {
    // Test basic connectivity
    console.log('1. Testing basic connectivity...');
    const response = await axios.get('http://localhost:3000', {
      timeout: 5000,
      validateStatus: function (status) {
        return status < 600; // Accept all status codes
      }
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Headers: ${JSON.stringify(response.headers, null, 2)}`);
    
    if (response.status === 500) {
      console.log(`   Response: ${response.data}`);
    }
    
  } catch (error) {
    console.log(`   Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   ❌ Server is not running on port 3000');
      console.log('   💡 Make sure to run: npm run dev');
    } else {
      console.log(`   ❌ Connection error: ${error.code}`);
    }
  }
}

debugServer().catch(console.error);