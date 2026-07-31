const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const BASE_URL = 'https://stockai-rose.vercel.app';
  
  try {
    console.log(`Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'home.jpg' });

    // Open Auth Modal
    console.log('Opening Auth Modal...');
    // The button might say "Sign In", "Get Started", "Login"
    const buttons = await page.$$('button');
    let loginBtn;
    for (let btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Sign In') || text.includes('Login') || text.includes('Get Started')) {
        loginBtn = btn;
        break;
      }
    }
    if (loginBtn) {
      await loginBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'login_modal.jpg' });

      // Click "Sign up" tab inside AuthModal if it exists
      const modalBtns = await page.$$('button');
      for (let btn of modalBtns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text === 'Sign up') {
          await btn.click();
          await page.waitForTimeout(500);
          break;
        }
      }

      console.log('Filling out signup form...');
      // It has inputs for email, password, maybe fullname
      const inputs = await page.$$('input');
      for (let input of inputs) {
        const type = await page.evaluate(el => el.type, input);
        const name = await page.evaluate(el => el.name, input);
        const placeholder = await page.evaluate(el => el.placeholder, input);
        if (type === 'email') await input.type('adobeicon99@gmail.com');
        else if (type === 'password') await input.type('legacy:admin_seed_2');
        else if (placeholder && placeholder.toLowerCase().includes('name')) await input.type('Admin Test');
      }

      // Submit
      for (let btn of modalBtns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.toLowerCase().includes('sign in') || text.toLowerCase().includes('sign up')) {
          await btn.click();
          break;
        }
      }

      console.log('Waiting for login to complete...');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'dashboard.jpg' });
    } else {
      console.log('Could not find Login button');
    }

    // Attempt to navigate to Admin Panel directly
    console.log('Navigating to Admin Panel...');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'admin_panel.jpg' });

    // Click on User API Keys tab
    console.log('Finding User API Keys tab...');
    const adminTabs = await page.$$('button');
    for (let btn of adminTabs) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('User API Keys') || text.includes('API Keys')) {
        await btn.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    await page.screenshot({ path: 'user_api_keys.jpg' });

    // Click on API Keys Modal (from top right settings or similar)
    // Wait, let's just go back to root and try to open settings
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    const navBtns = await page.$$('button');
    for (let btn of navBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Settings') || text.includes('API')) {
        await btn.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    await page.screenshot({ path: 'api_keys_manager.jpg' });

    console.log('Finished visual test sequence.');
  } catch (err) {
    console.error('Error during test:', err);
    await page.screenshot({ path: 'error_state.jpg' });
  }

  await browser.close();
})();
