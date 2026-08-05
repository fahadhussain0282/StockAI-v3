const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

async function test() {
  const secret = "8936ba7e545e4707132e0571b441558a0ec3bc72645133596abbfc8b4bdae040";
  const token = jwt.sign(
    { sub: 'usr_admin_fahadhussain0282', email: 'fahadhussain0282@gmail.com', role: 'admin', deviceId: 'dev_test' },
    secret,
    { expiresIn: '1d', algorithm: 'HS256' }
  );

  console.log('Token generated, sending request to Vercel...');

  const payload = {
    fileName: "test.png",
    fileType: "image/png",
    base64Data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    provider: "google-gemini",
    selectedModel: "gemini-1.5-flash"
  };

  const res = await fetch('https://stockai-v3-one.vercel.app/api/generate-metadata', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  console.log('Status:', res.status);
  const data = await res.text();
  console.log('Response:', data);
}

test().catch(console.error);
