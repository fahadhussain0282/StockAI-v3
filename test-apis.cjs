const http = require('http');

function makeRequest(path, method, data, token) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    
    const req = http.request({
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: method,
      headers: headers
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: body
        });
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  let hasErrors = false;
  
  function assert(condition, message) {
    if (!condition) {
      console.error('❌ FAIL:', message);
      hasErrors = true;
    } else {
      console.log('✅ PASS:', message);
    }
  }

  try {
    // 1. Auth Signup
    console.log('Testing /api/auth/signup...');
    const signupData = {
      email: 'user' + Date.now() + '@test.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
      termsAccepted: true
    };
    const signupRes = await makeRequest('/api/auth/signup', 'POST', signupData);
    assert(signupRes.status === 200, 'Signup should return 200');
    const signupJson = JSON.parse(signupRes.body);
    const token = signupJson.token;
    assert(token, 'Signup should return a token');

    // 2. Auth Me
    console.log('Testing /api/auth/me...');
    const meRes = await makeRequest('/api/auth/me', 'GET', null, token);
    assert(meRes.status === 200, 'Me should return 200');

    // 3. Organization Create
    console.log('Testing /v1/org...');
    const orgRes = await makeRequest('/api/v1/org', 'POST', { name: 'My Org', plan: 'FREE' }, token);
    assert(orgRes.status === 200, 'Create Org should return 200');
    const orgId = JSON.parse(orgRes.body).org?.id;
    assert(orgId, 'Create Org should return an orgId');

    // 4. Team Create
    console.log('Testing /v1/team...');
    const teamRes = await makeRequest('/api/v1/team', 'POST', { orgId, name: 'My Team' }, token);
    assert(teamRes.status === 200, 'Create Team should return 200');
    const teamId = JSON.parse(teamRes.body).team?.id;
    assert(teamId, 'Create Team should return a teamId');

    // 5. Workspace Create
    console.log('Testing /v1/workspace...');
    const wsRes = await makeRequest('/api/v1/workspace', 'POST', { orgId, teamId, name: 'My Workspace', type: 'GENERAL' }, token);
    assert(wsRes.status === 200, 'Create Workspace should return 200');

    // 6. Billing Plans
    console.log('Testing /v1/billing/plans...');
    const plansRes = await makeRequest('/api/v1/billing/plans', 'GET', null, token);
    assert(plansRes.status === 200, 'Billing Plans should return 200');

    // 7. Credits
    console.log('Testing /v1/credits...');
    const creditsRes = await makeRequest('/api/v1/credits?orgId=' + orgId, 'GET', null, token);
    assert(creditsRes.status === 200, 'Credits should return 200');

    // 8. Usage
    console.log('Testing /v1/usage...');
    const usageRes = await makeRequest('/api/v1/usage?orgId=' + orgId + '&metric=API_CALL&startDate=2026-01-01&endDate=2026-12-31', 'GET', null, token);
    assert(usageRes.status === 200, 'Usage should return 200');

    // 9. Auth Logout
    console.log('Testing /api/auth/logout...');
    const logoutRes = await makeRequest('/api/auth/logout', 'POST', null, token);
    assert(logoutRes.status === 200, 'Logout should return 200');

    // 10. Unauthorized access
    console.log('Testing Unauthorized access...');
    const unauthRes = await makeRequest('/api/auth/me', 'GET', null, 'invalid_token');
    assert(unauthRes.status === 401, 'Invalid token should return 401');

    if (hasErrors) {
      console.log('Some tests failed.');
      process.exit(1);
    } else {
      console.log('All API tests passed successfully.');
    }

  } catch (err) {
    console.error('Error during testing:', err);
    process.exit(1);
  }
}

runTests();
