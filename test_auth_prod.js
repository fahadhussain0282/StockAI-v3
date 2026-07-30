async function run() {
  const API_URL = 'https://stockai-rose.vercel.app/api/auth';
  try {
    console.log('Testing Signup on production...');
    const signup = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Prod Test User',
        email: 'prodtest' + Date.now() + '@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        termsAccepted: true
      })
    });
    const signupData = await signup.json().catch(() => signup.text());
    console.log('Signup status:', signup.status);
    
    if (signup.status !== 200) {
      console.error('Signup failed:', signupData);
      return;
    }
    const token = signupData.token;

    console.log('Testing Me (/me)...');
    const me = await fetch(`${API_URL}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const meData = await me.json();
    console.log('Me status:', me.status, meData.user ? 'User ok' : meData);

    console.log('Testing Logout...');
    const logout = await fetch(`${API_URL}/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Logout status:', logout.status);

    console.log('Testing Me (/me) after Logout...');
    const meAfter = await fetch(`${API_URL}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Me after logout status:', meAfter.status); // Should be 401
    
    console.log('Testing Login...');
    const login = await fetch(`${API_URL}/login`, {
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
