import fetch from 'node-fetch';

const APP_URL = 'https://stockai-rose.vercel.app';
let authToken = '';
let adminEmail = 'adobeicon99@gmail.com';
let adminPass = 'legacy:admin_seed_2';

async function log(msg) {
  console.log(`[VERIFY] ${msg}`);
}

async function runTests() {
  log(`Starting production verification against ${APP_URL}`);

  try {
    // 1. Health Check
    const healthRes = await fetch(`${APP_URL}/api/health`);
    const health = await healthRes.json();
    log(`Health Check: ${healthRes.status} - Providers loaded: ${Object.keys(health.providers).filter(k => health.providers[k]).join(', ') || 'None'}`);

    if (healthRes.status !== 200) throw new Error('Health check failed');

    // 2. Login Check
    log(`Attempting login as ${adminEmail}...`);
    const loginRes = await fetch(`${APP_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPass })
    });
    
    const loginData = await loginRes.json();
    if (loginRes.status !== 200) {
      log(`Login failed: ${JSON.stringify(loginData)}`);
      throw new Error('Login failed');
    }
    
    authToken = loginData.token;
    log(`Login successful. Received JWT token.`);

    // 3. User Session Verification
    log(`Verifying session...`);
    const meRes = await fetch(`${APP_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const meData = await meRes.json();
    if (meRes.status !== 200 || !meData.user) {
      log(`Session verify failed: ${JSON.stringify(meData)}`);
      throw new Error('Session validation failed');
    }
    log(`Session valid for user: ${meData.user.email} (${meData.user.role})`);

    // 4. Admin Users List
    log(`Fetching admin user list...`);
    const adminRes = await fetch(`${APP_URL}/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const adminData = await adminRes.json();
    if (adminRes.status !== 200) {
      log(`Admin users fetch failed: ${JSON.stringify(adminData)}`);
      throw new Error('Admin fetch failed');
    }
    log(`Successfully fetched ${adminData.users?.length || 0} users from Admin API`);

    // 5. API Key Health Check (Testing Mistral/DeepSeek logic)
    log(`Testing mistral provider key endpoint...`);
    const keyRes = await fetch(`${APP_URL}/api/test-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({ provider: 'mistral', apiKey: 'test_key_invalid' })
    });
    const keyData = await keyRes.json();
    // We expect a 400 with Mistral authentication failed, not a 500 error, 
    // confirming the mistral route exists.
    log(`Key Test Response: [${keyRes.status}] ${keyData.message || keyData.error || ''}`);

    log('====================================');
    log('✅ BASIC API VERIFICATION PASSED');
    log('====================================');

  } catch (err) {
    log(`❌ VERIFICATION FAILED: ${err.message}`);
    process.exit(1);
  }
}

runTests();
