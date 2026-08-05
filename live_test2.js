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
  console.log('Login successful! User details:');
  console.log(JSON.stringify(loginData.user, null, 2));

}

runTest().catch(console.error);
