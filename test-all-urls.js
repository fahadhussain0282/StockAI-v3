/**
 * Test against the newly deployed URL
 */
const https = require('https');

const TEST_URLS = [
  'stockai-rose.vercel.app',
  'stockai-v3-one.vercel.app',
  'stockai-v3-2ifqiiz38-fahad-hussains-projects-f3012f68.vercel.app'
];

function get(host, path) {
  return new Promise((resolve, reject) => {
    const req = https.get({ hostname: host, path, headers: {} }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data.substring(0, 100) }); }
      });
    });
    req.on('error', err => resolve({ status: 'ERR', body: err.message }));
    req.setTimeout(12000, () => { req.destroy(); resolve({ status: 'TIMEOUT', body: '' }); });
  });
}

async function main() {
  for (const host of TEST_URLS) {
    console.log(`\n🌐 Testing: https://${host}`);
    const h = await get(host, '/api/health');
    console.log(`  Health status: ${h.status}, NODE_ENV: ${h.body?.environment}, DB-indicators...`);
  }

  // Test DB route on all hosts
  console.log('\n--- API Keys route test (requires DB) ---');
  
  // Get a token first from the new deploy
  const newHost = 'stockai-v3-2ifqiiz38-fahad-hussains-projects-f3012f68.vercel.app';
  const tokenRes = await new Promise((resolve, reject) => {
    const body = JSON.stringify({ email: 'fahadhussain0282@gmail.com', password: 'admin123' });
    const req = https.request({
      hostname: newHost,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Device-Id': 'test-x' }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
  
  const token = tokenRes.token;
  console.log('Token from new deploy:', token ? `YES (${token.length} chars)` : 'NO');
  
  for (const host of TEST_URLS) {
    const keysReq = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: host,
        path: '/api/user/keys',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'X-Device-Id': 'test-x' }
      }, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
          catch { resolve({ status: res.statusCode, body: d.substring(0, 100) }); }
        });
      });
      req.on('error', err => resolve({ status: 'ERR', body: err.message }));
      req.setTimeout(12000, () => { req.destroy(); resolve({ status: 'TIMEOUT', body: '' }); });
      req.end();
    });
    const icon = keysReq.status === 200 ? '✅' : '❌';
    console.log(`  ${icon} ${host}: /api/user/keys → ${keysReq.status} — ${JSON.stringify(keysReq.body).substring(0, 80)}`);
  }
}

main().catch(console.error);
