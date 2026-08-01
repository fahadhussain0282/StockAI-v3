/**
 * post-deploy-test.js — Comprehensive live production test
 * Run: node post-deploy-test.js
 * 
 * Tests ALL critical auth and API flows on the live Vercel deployment.
 */

const https = require('https');

const BASE_URL = 'stockai-rose.vercel.app';
const RESULTS = [];

function makeRequest(path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: BASE_URL,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.status || res.statusCode, body: parsed, raw: data });
      });
    });
    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('TIMEOUT')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function check(name, condition, details) {
  const icon = condition ? '✅' : '❌';
  console.log(`  ${icon} ${name}${details ? ': ' + details : ''}`);
  RESULTS.push({ name, pass: condition });
}

async function main() {
  console.log('='.repeat(60));
  console.log('StockAI Production API Test Suite');
  console.log(`Target: https://${BASE_URL}`);
  console.log('='.repeat(60) + '\n');

  // ─── TEST 1: Health Check ───────────────────────────────────────
  console.log('📋 Test 1: Health Check');
  try {
    const r = await makeRequest('/api/health', 'GET', {}, null);
    check('HTTP 200', r.status === 200, `got ${r.status}`);
    check('Status ok', r.body.status === 'ok');
    check('NODE_ENV=production', r.body.environment === 'production', `got: ${r.body.environment}`);
    check('Gemini provider active', r.body.providers?.gemini === true);
    console.log('  Health:', JSON.stringify(r.body, null, 2).split('\n').slice(0, 10).join('\n'));
  } catch (e) {
    check('Health reachable', false, e.message);
  }
  console.log();

  // ─── TEST 2: Login with Admin credentials ──────────────────────
  console.log('🔐 Test 2: Admin Login');
  let adminToken = null;
  try {
    const r = await makeRequest('/api/auth/login', 'POST', { 'X-Device-Id': 'test-001' }, {
      email: 'fahadhussain0282@gmail.com',
      password: 'admin123'
    });
    check('HTTP 200', r.status === 200, `got ${r.status}`);
    check('Token received', Boolean(r.body.token), `length: ${r.body.token?.length}`);
    check('Admin role', r.body.user?.role === 'admin', `got: ${r.body.user?.role}`);
    adminToken = r.body.token;
  } catch (e) {
    check('Admin login', false, e.message);
  }
  console.log();

  // ─── TEST 3: Session Validate (GET /api/auth/me) ───────────────
  console.log('🔑 Test 3: Session Validation');
  if (adminToken) {
    try {
      const r = await makeRequest('/api/auth/me', 'GET', {
        'Authorization': `Bearer ${adminToken}`,
        'X-Device-Id': 'test-001'
      }, null);
      check('HTTP 200', r.status === 200, `got ${r.status}`);
      check('User returned', Boolean(r.body.user?.id));
      check('Correct email', r.body.user?.email === 'fahadhussain0282@gmail.com');
    } catch (e) {
      check('Session validate', false, e.message);
    }
  } else {
    check('Session validate', false, 'Skipped (no admin token)');
  }
  console.log();

  // ─── TEST 4: GET /api/user/keys (DB-backed) ────────────────────
  console.log('🗝️  Test 4: API Keys (requires DB)');
  if (adminToken) {
    try {
      const r = await makeRequest('/api/user/keys', 'GET', {
        'Authorization': `Bearer ${adminToken}`,
        'X-Device-Id': 'test-001'
      }, null);
      check('HTTP 200 (not 500)', r.status === 200, `got ${r.status} — ${typeof r.body === 'object' ? JSON.stringify(r.body).substring(0, 100) : r.body}`);
      check('Returns keys array', Array.isArray(r.body.keys), `got: ${typeof r.body.keys}`);
    } catch (e) {
      check('API Keys fetch', false, e.message);
    }
  } else {
    check('API Keys fetch', false, 'Skipped (no admin token)');
  }
  console.log();

  // ─── TEST 5: Signup with fresh email ─────────────────────────
  console.log('📝 Test 5: Signup Flow');
  const freshEmail = `testuser_${Date.now()}@example.com`;
  let userToken = null;
  try {
    const r = await makeRequest('/api/auth/signup', 'POST', { 'X-Device-Id': 'test-002' }, {
      email: freshEmail,
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!',
      fullName: 'Test User',
      termsAccepted: true
    });
    check('HTTP 200', r.status === 200, `got ${r.status}`);
    check('Token received', Boolean(r.body.token));
    check('User ID present', Boolean(r.body.user?.id));
    userToken = r.body.token;
  } catch (e) {
    check('Signup', false, e.message);
  }
  console.log();

  // ─── TEST 6: Generate metadata (should 403 for non-paying) ──
  console.log('🤖 Test 6: Generate Metadata (subscription guard)');
  if (userToken) {
    try {
      const r = await makeRequest('/api/generate-metadata', 'POST', {
        'Authorization': `Bearer ${userToken}`,
        'X-Device-Id': 'test-002'
      }, {
        fileName: 'test_photo.jpg',
        fileType: 'image',
        settings: { targetPlatform: 'general' }
      });
      // Expect 403 for non-paying user — this is correct behavior
      check('Subscription guard active (403)', r.status === 403, `got ${r.status}`);
      check('SUBSCRIPTION_REQUIRED code', r.body.code === 'SUBSCRIPTION_REQUIRED');
    } catch (e) {
      check('Generate metadata', false, e.message);
    }
  }
  console.log();

  // ─── SUMMARY ──────────────────────────────────────────────────
  const passed = RESULTS.filter(r => r.pass).length;
  const failed = RESULTS.filter(r => !r.pass).length;
  console.log('='.repeat(60));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED — Production is working!');
  } else {
    console.log('❌ FAILURES:');
    RESULTS.filter(r => !r.pass).forEach(r => console.log(`   - ${r.name}`));
  }
  console.log('='.repeat(60));
}

main().catch(console.error);
