async function run() {
  try {
    const TEST_DEVICE_ID = 'device_test_123';
    console.log('Testing Signup with X-Device-Id:', TEST_DEVICE_ID);
    const signup = await fetch('http://localhost:3002/api/auth/signup', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Device-Id': TEST_DEVICE_ID
      },
      body: JSON.stringify({
        fullName: 'Test User',
        email: 'test' + Date.now() + '@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        termsAccepted: true
      })
    });
    const signupData = await signup.json().catch(() => signup.text());
    console.log('Signup status:', signup.status);
    
    if (signup.status !== 200) return;
    const token = signupData.token;
    console.log('Signup generated token:', token);
    console.log('Active Device ID saved on user record:', signupData.user.activeDeviceId);

    console.log('Testing Me (/me) with SAME device id...');
    const me = await fetch('http://localhost:3002/api/auth/me', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'X-Device-Id': TEST_DEVICE_ID
      }
    });
    const meData = await me.json();
    console.log('Me status:', me.status, meData.user ? 'User ok, session validated!' : meData);

    console.log('Testing Me (/me) with WRONG device id...');
    const meWrong = await fetch('http://localhost:3002/api/auth/me', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'X-Device-Id': 'device_hacker_456'
      }
    });
    console.log('Me Wrong Device status:', meWrong.status); // Should be 401

  } catch (e) {
    console.error('Error during fetch:', e);
  }
}
run();
