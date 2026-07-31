const fs = require('fs');

async function logReq(name, url, options = {}) {
  console.log(`\n========================================================`);
  console.log(`[${name}] -> ${options.method || 'GET'} ${url}`);
  try {
    const res = await fetch(url, options);
    console.log(`STATUS: ${res.status} ${res.statusText}`);
    
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      console.log(`RESPONSE JSON:`);
      // Mask tokens and long strings for readability
      const maskData = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(maskData);
        const copy = { ...obj };
        for (const k in copy) {
           if (k === 'token' || k === 'accessToken' || k === 'password') copy[k] = '***MASKED***';
           else if (typeof copy[k] === 'object') copy[k] = maskData(copy[k]);
        }
        return copy;
      };
      console.log(JSON.stringify(maskData(data), null, 2));
      return { status: res.status, data };
    } else {
      const text = await res.text();
      console.log(`RESPONSE TEXT: ${text.substring(0, 200)}...`);
      return { status: res.status, text };
    }
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
    return { status: 500, error: err.message };
  }
}

async function run() {
  const BASE_URL = 'https://stockai-rose.vercel.app';
  const timestamp = Date.now();
  const testEmail = `evidence_${timestamp}@example.com`;
  const testPassword = 'Password123!';

  // 1. SIGNUP
  await logReq('Signup', `${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword, confirmPassword: testPassword, termsAccepted: true })
  });

  // 2. LOGIN
  const loginRes = await logReq('Login', `${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword })
  });
  const userToken = loginRes.data?.token;

  // 3. ADMIN LOGIN
  const adminLoginRes = await logReq('Admin Login', `${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'adobeicon99@gmail.com', password: 'admin123' })
  });
  const adminToken = adminLoginRes.data?.token;

  if (!adminToken) {
    console.log("Failed to get admin token!");
    return;
  }

  // 4. ADMIN LOAD USERS
  const usersRes = await logReq('Admin Fetch Users', `${BASE_URL}/api/admin/users`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  
  const targetUserId = loginRes.data?.user?.id;

  // 5. ADMIN BLOCK/UNBLOCK/SUSPEND/SUBSCRIPTION
  if (targetUserId) {
    await logReq('Admin Block User', `${BASE_URL}/api/admin/edit-user`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: targetUserId, isBlocked: true })
    });
    
    await logReq('Admin Unblock User', `${BASE_URL}/api/admin/edit-user`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: targetUserId, isBlocked: false })
    });

    await logReq('Admin Activate Subscription', `${BASE_URL}/api/admin/edit-user`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: targetUserId, 
        activePlan: 'pro', 
        planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        credits: 500
      })
    });
  }

  // 6. API KEY MANAGER (PROVIDERS)
  await logReq('Admin Fetch API Key Providers', `${BASE_URL}/api/admin/key-pool/stats`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  // 7. METADATA GENERATION
  // Re-login to get updated JWT token with Pro plan and credits
  const freshLoginRes = await logReq('User Login (Refresh Role)', `${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword })
  });
  const freshToken = freshLoginRes.data?.token;

  await logReq('Generate Metadata', `${BASE_URL}/api/generate-metadata`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${freshToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: 'stockai_test_image.jpg',
      fileType: 'image/jpeg',
      settings: { targetPlatform: 'adobe_stock' }
    })
  });
}

run();
