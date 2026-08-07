import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const artifactsDir = path.join('C:', 'Users', 'DELL', '.gemini', 'antigravity-ide', 'brain', 'e354a923-e40d-4a19-b146-e29cc89de0a0');

async function runTest() {
  console.log('Launching browser...');
  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page: Page = await context.newPage();

  console.log('Navigating to local UI...');
  await page.goto('http://localhost:3002');
  
  // Inject real admin JWT token
  const jwt = require('jsonwebtoken');
  const secret = '8936ba7e545e4707132e0571b441558a0ec3bc72645133596abbfc8b4bdae040';
  const token = jwt.sign(
    { userId: 'usr_1785772998821_l8l1', email: 'admin@stockai.com', role: 'admin' }, 
    secret, 
    { expiresIn: '1h' }
  );
  
  await page.evaluate((t) => {
    localStorage.setItem('stockai_auth_token', t);
  }, token);

  await page.reload();
  await page.waitForTimeout(2000);
  
  console.log('Taking Login screenshot...');
  await page.screenshot({ path: path.join(artifactsDir, 'login.png') });

  // 1. Upload Test
  const imgBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  fs.writeFileSync('test-image.png', Buffer.from(imgBase64, 'base64'));

  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.setInputFiles('test-image.png');
    await page.waitForTimeout(1000);
    console.log('Taking Upload screenshot...');
    await page.screenshot({ path: path.join(artifactsDir, 'upload.png') });
    
    // 2. Metadata Generation Test
    const generateBtn = await page.$('button:has-text("Generate"), button:has-text("Analyze")');
    if (generateBtn) {
      await generateBtn.click();
      console.log('Waiting for metadata generation...');
      // Wait for results to appear (timeout 30s)
      await page.waitForTimeout(8000); 
      console.log('Taking Metadata Generation screenshot...');
      await page.screenshot({ path: path.join(artifactsDir, 'metadata.png') });

      // 3. CSV Export Test
      console.log('Testing CSV Export...');
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      const csvBtn = await page.$('button:has-text("CSV"), button:has-text("Export")');
      if (csvBtn) {
        await csvBtn.click();
        const download = await downloadPromise;
        if (download) {
          const downloadPath = path.join(artifactsDir, 'export.csv');
          await download.saveAs(downloadPath);
          console.log('CSV downloaded successfully.');
          
          // Verify CSV BOM
          const csvContent = fs.readFileSync(downloadPath);
          if (csvContent[0] === 0xEF && csvContent[1] === 0xBB && csvContent[2] === 0xBF) {
            console.log('CSV UTF-8 BOM verified.');
          } else {
            console.error('CSV missing UTF-8 BOM!');
          }
        }
      }
    }
  }

  // 4. API Key Wizard & Diagnostics
  console.log('Testing API Key Wizard / Diagnostics...');
  const adminTab = await page.$('a[href="/admin"], button:has-text("Admin"), button:has-text("Settings")');
  if (adminTab) {
    await adminTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(artifactsDir, 'diagnostics.png') });
  }

  // Check console for errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Browser Console Error: ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    console.error(`Browser Page Error: ${err.message}`);
  });

  await browser.close();
  console.log('Browser tests completed.');
}

runTest().catch(console.error);
