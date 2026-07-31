const { execSync } = require('child_process');
const fs = require('fs');
const envStr = fs.readFileSync('.env', 'utf8');
const dbUrl = envStr.split('\n').find(l=>l.startsWith('DATABASE_URL')).split('=')[1].replace(/"/g, '');
console.log("Using URL:", dbUrl.substring(0, 30) + "...");
execSync('npx prisma db push', { env: { ...process.env, DATABASE_URL: dbUrl, DIRECT_URL: dbUrl }, stdio: 'inherit' });
