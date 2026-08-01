/**
 * Test the correct new deployment URL (stockai-v3-one.vercel.app)
 */
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
        catch { resolve({ s: res.statusCode, b: d.substring(0, 200) }); }
      });
    });
    r.on('error', reject);
    r.setTimeout(15000, () => { r.destroy(); resolve({ s: 'TIMEOUT', b: '' }); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function main() {
  console.log('Testing: https://' + HOST + '\n');

  // 1. Health
  const h = await req('/api/health', 'GET', {}, null);
  console.log('Health:', JSON.stringify(h.b, null, 2).substring(0, 300));

  // 2. Admin login
  const login = await req('/api/auth/login', 'POST', { 'X-Device-Id': 'dev-001' },
    { email: 'fahadhussain0282@gmail.com', password: 'admin123' });
  console.log('\nAdmin login:', login.s, 'role:', login.b.user?.role);
  const token = login.b.token;

  if (token) {
    // 3. GET /api/user/keys — the critical DB test
    const keys = await req('/api/user/keys', 'GET', {
      'Authorization': 'Bearer ' + token, 'X-Device-Id': 'dev-001'
    }, null);
    console.log('\nGET /api/user/keys:', keys.s);
    console.log('Response:', JSON.stringify(keys.b).substring(0, 300));

    // 4. Session validate
    const me = await req('/api/auth/me', 'GET', {
      'Authorization': 'Bearer ' + token, 'X-Device-Id': 'dev-001'
    }, null);
    console.log('\nGET /api/auth/me:', me.s, me.b.user?.email);
  }
}

main().catch(console.error);
