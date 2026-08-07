import fetch from 'node-fetch';

async function runTest() {
  console.log('1. Logging in to live site...');
  const loginRes = await fetch('https://stockai-v3-one.vercel.app/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'fahadhussain0282@gmail.com', password: 'admin123' })
  });

  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Login successful!');

  console.log('\n2. Calling /api/generate-metadata on live site...');
  
  const payload = {
    provider: 'openrouter',
    filename: 'test.jpg',
    mimetype: 'image/jpeg',
    imageType: 'photo',
    systemInstruction: 'Respond with OK',
    userPrompt: 'Test prompt',
    base64Image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCABQAFADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAaEAACAAMAAAAAAAAAAAAAAAAAAQIDERIh/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AL+ADKAAAAD/2Q=='
  };

  const genStart = Date.now();
  const genRes = await fetch('https://stockai-v3-one.vercel.app/api/generate-metadata', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
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
