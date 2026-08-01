const fs = require('fs');
const { execSync } = require('child_process');

const envContent = fs.readFileSync('.env', 'utf8');
const lines = envContent.split('\n');

for (const line of lines) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) {
    const key = match[1];
    let value = match[2].trim();
    
    // Remove surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    if (value && (key === 'DATABASE_URL' || key === 'DIRECT_URL')) {
        console.log(`Adding ${key}...`);
        try {
          execSync(`vercel env rm ${key} production -y`, { stdio: 'ignore' });
        } catch (e) {} // ignore if it doesn't exist
        try {
          execSync(`vercel env add ${key} production --value "${value}" --yes`, { stdio: 'inherit' });
        } catch (e) {
          console.error(`Failed to add ${key}: ${e.message}`);
        }
    }
  }
}
