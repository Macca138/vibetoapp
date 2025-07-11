#!/usr/bin/env node

const axios = require('axios');

async function testAPI() {
  console.log('Testing API routes...\n');
  
  const routes = [
    '/api/auth/providers',
    '/api/auth/session',
    '/api/auth/csrf',
    '/api/waitlist'
  ];
  
  for (const route of routes) {
    try {
      const response = await axios.get(`http://localhost:3000${route}`, {
        timeout: 5000,
        validateStatus: () => true
      });
      console.log(`${route}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`${route}: Error - ${error.message}`);
    }
  }
}

testAPI();