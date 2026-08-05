import fetch from 'node-fetch';

async function runTest() {
  console.log('1. Logging in to live site...');
  const loginRes = await fetch('https://stockai-v3-one.vercel.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'fahadhussain0282@gmail.com', password: 'admin123' })
  });

  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error('Login failed:', loginData);
    return;
  }
  const token = loginData.token;
  console.log('Login successful! Token acquired.');

  console.log('\n2. Calling /api/debug-keys?provider=openai...');
  
  const genStart = Date.now();
  const genRes = await fetch('https://stockai-v3-one.vercel.app/api/debug-keys?provider=openai', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const genTime = Date.now() - genStart;
  const genStatus = genRes.status;
  const genData = await genRes.text();

  console.log(`Response Status: ${genStatus}`);
  console.log(`Response Time: ${genTime}ms`);
  
  try {
    const parsed = JSON.parse(genData);
    console.log('\nResponse Data:\n', JSON.stringify(parsed, null, 2));
  } catch(e) {
    console.log('\nRaw Response Data:\n', genData);
  }
}

runTest().catch(console.error);
