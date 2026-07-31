const fs = require('fs');

async function logReq(name, url, options = {}) {
  console.log(`\n========================================================`);
  console.log(`[${name}] -> ${options.method || 'GET'} ${url}`);
  try {
    const res = await fetch(url, options);
    console.log(`STATUS: ${res.status} ${res.statusText}`);
    
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      console.log(`RESPONSE JSON:`);
      console.log(JSON.stringify(data, null, 2));
      return { status: res.status, data };
    } else {
      const text = await res.text();
      console.log(`RESPONSE TEXT: ${text.substring(0, 200)}...`);
      return { status: res.status, text };
    }
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
    return { status: 500, error: err.message };
  }
}

async function run() {
  const BASE_URL = 'https://stockai-rose.vercel.app';
  
  // LOGIN
  const ts = Date.now();
  const testEmail = `tester_${ts}@example.com`;
  
  const signupRes = await logReq('Signup', `${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'Password123!', confirmPassword: 'Password123!', termsAccepted: true })
  });

  const token = signupRes.data?.token;

  // TEST GEMINI (Dummy key)
  await logReq('Test Gemini Key (BYOK Frontend Route)', `${BASE_URL}/api/test-key`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'google-gemini', apiKey: 'invalid_gemini_key', model: 'gemini-1.5-flash' })
  });

  // TEST MISTRAL (Dummy key)
  await logReq('Test Mistral Key (BYOK Frontend Route)', `${BASE_URL}/api/test-key`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'mistral', apiKey: 'invalid_mistral_key' })
  });
  
  // TEST DEEPSEEK (Dummy key)
  await logReq('Test DeepSeek Key (BYOK Frontend Route)', `${BASE_URL}/api/test-key`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'deepseek', apiKey: 'invalid_deepseek_key' })
  });
}

run();
