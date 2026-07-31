const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const BASE_URL = 'https://stockai-rose.vercel.app';

async function verify() {
  console.log('--- STARTING PRODUCTION VERIFICATION ---');
  const testUser = 'test_prod_' + Date.now() + '@example.com';
  
  // 1. HEALTH
  const healthRes = await fetch(BASE_URL + '/api/health');
  console.log('Health Status:', healthRes.status);
  
  // 2. SIGNUP
  console.log('\n[TEST] Signup...');
  const signupRes = await fetch(BASE_URL + '/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Prod Test', email: testUser, password: 'Password123!', confirmPassword: 'Password123!', termsAccepted: true })
  });
  const signupData = await signupRes.json();
  console.log('Signup Response:', signupRes.status);
  
  // 3. LOGIN
  console.log('\n[TEST] Login...');
  const loginRes = await fetch(BASE_URL + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testUser, password: 'Password123!' })
  });
  const loginData = await loginRes.json();
  console.log('Login Response:', loginRes.status);
  
  if (loginData.token) {
    console.log('✅ JWT Received:', loginData.token.substring(0, 20) + '...');
  } else {
    console.error('❌ Failed to get JWT:', loginData);
  }

  // 4. TEST METADATA GENERATION (Using Admin Login)
  console.log('\n[TEST] Admin Login (to test metadata bypass)...');
  const adminLoginRes = await fetch(BASE_URL + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'adobeicon99@gmail.com', password: 'admin123' })
  });
  const adminLoginData = await adminLoginRes.json();
  
  if (!adminLoginData.token) {
    return console.error('❌ Failed Admin Login:', adminLoginData);
  }
  
  const adminToken = adminLoginData.token;
  console.log('✅ Admin JWT Received:', adminToken.substring(0, 20) + '...');

  console.log('\n[TEST] Generate Metadata (Checking providers with Admin token)...');
  const metaRes = await fetch(BASE_URL + '/api/generate-metadata', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + adminToken
    },
    body: JSON.stringify({
       fileName: "test_image.jpg",
       fileType: "image/jpeg",
       settings: { targetPlatform: "general" }
    })
  });
  const metaData = await metaRes.json();
  console.log('Metadata Response:', metaRes.status);
  if (metaRes.ok) {
     console.log('✅ Success! Generated titles/keywords.');
     console.log('Provider:', metaData.provider);
     console.log('Title:', metaData.title);
  } else {
     console.log('❌ Failed:', metaData);
  }
}
verify().catch(console.error);
