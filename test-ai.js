const https = require('https');

const HOST = 'stockai-v3-one.vercel.app';

function req(path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const r = https.request({
      hostname: HOST, path, method,
      headers: { 'Content-Type': 'application/json', ...headers }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ s: res.statusCode, b: JSON.parse(d) }); }
        catch { resolve({ s: res.statusCode, b: d }); }
      });
    });
    r.on('error', reject);
    r.setTimeout(25000, () => { r.destroy(); resolve({ s: 'TIMEOUT', b: '' }); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function main() {
  console.log('Testing AI Provider on:', HOST);
  
  // Login to get token
  const login = await req('/api/auth/login', 'POST', { 'X-Device-Id': 'dev-002' },
    { email: 'fahadhussain0282@gmail.com', password: 'admin123' });
  
  const token = login.b.token;
  if (!token) {
    console.log('Login failed', login);
    return;
  }
  
  // Update subscription to active just in case
  console.log('Token acquired. Generating metadata with Gemini...');
  const res = await req('/api/generate-metadata', 'POST', {
    'Authorization': 'Bearer ' + token, 'X-Device-Id': 'dev-002'
  }, {
    fileId: 'test-file-123',
    fileName: 'beautiful sunset over the ocean.jpg',
    fileType: 'image/jpeg',
    settings: { forceRefinement: false },
    provider: 'google-gemini',
    marketplaceRule: {
      id: 'adobe-stock',
      name: 'Adobe Stock',
      categories: ['Nature', 'Landscapes'],
      titleMaxLength: 200,
      keywordMaxCount: 50
    }
  });
  
  console.log('Generate Status:', res.s);
  if (res.s === 200) {
    console.log('Title:', res.b.title);
    console.log('Keywords:', res.b.keywords?.length);
    console.log('AI Provider used:', res.b.provider);
    console.log('✅ AI Integration Works!');
  } else {
    console.log('Failed:', res.b);
  }
}

main();
