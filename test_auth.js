async function run() {
  try {
    const signup = await fetch('http://localhost:3002/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    // test me
    const me = await fetch('http://localhost:3002/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const meData = await me.json();
    console.log('Me status:', me.status, meData.user ? 'User ok' : meData);

    // test logout
    const logout = await fetch('http://localhost:3002/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Logout status:', logout.status);

    // test me after logout
    const meAfter = await fetch('http://localhost:3002/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Me after logout status:', meAfter.status); // Should be 401
    
    // test login
    const login = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: signupData.user.email,
        password: 'password123'
      })
    });
    const loginData = await login.json();
    console.log('Login status:', login.status, loginData.token ? 'Token ok' : loginData);

  } catch (e) {
    console.error('Error during fetch:', e);
  }
}
run();
