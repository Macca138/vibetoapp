// Test NextAuth signin endpoint directly
const http = require('http');
const querystring = require('querystring');

async function testNextAuthSignin() {
  console.log('🔐 Testing NextAuth Signin Endpoint');
  console.log('===================================');

  // First, get CSRF token
  const csrfResponse = await makeRequest('GET', '/api/auth/csrf');
  console.log('CSRF Response:', csrfResponse.status);
  
  if (csrfResponse.status !== 200) {
    console.log('❌ Failed to get CSRF token');
    return;
  }

  let csrfToken;
  try {
    csrfToken = JSON.parse(csrfResponse.data).csrfToken;
    console.log('✅ Got CSRF token');
  } catch (e) {
    console.log('❌ Failed to parse CSRF token');
    return;
  }

  // Now try to sign in
  const formData = querystring.stringify({
    email: 'testuser@example.com',
    password: 'testpassword123',
    csrfToken: csrfToken,
    callbackUrl: 'http://localhost:3000/dashboard',
    json: 'true'
  });

  const signinResponse = await makeRequest(
    'POST', 
    '/api/auth/signin/credentials',
    formData,
    {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(formData)
    }
  );

  console.log('Signin Response:', signinResponse.status);
  console.log('Signin Data:', signinResponse.data);

  if (signinResponse.status === 200) {
    console.log('✅ Signin endpoint working');
  } else {
    console.log('❌ Signin failed');
  }
}

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'User-Agent': 'Test Script',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

testNextAuthSignin().catch(console.error);