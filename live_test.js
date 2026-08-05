import fetch from 'node-fetch'; // We will use native fetch in node 18+

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

  console.log('\n2. Calling /api/generate-metadata with OpenAI provider...');
  
  // A tiny valid base64 image (1x1 red pixel)
  const tinyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAANSURBVBhXY3jP4PgfAAWgA4H/09H3AAAAAElFTkSuQmCC";

  const reqBody = {
    provider: "openai",
    selectedModel: "gpt-4o",
    fileName: "test_image.png",
    fileType: "image/png",
    base64Data: `data:image/png;base64,${tinyImage}`,
    settings: {
      targetPlatform: "general",
      customPrompt: "",
      language: "en"
    }
  };

  const genStart = Date.now();
  const genRes = await fetch('https://stockai-v3-one.vercel.app/api/generate-metadata', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(reqBody)
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
