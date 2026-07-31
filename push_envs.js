import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
const lines = envContent.split('\n');

for (const line of lines) {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...rest] = line.split('=');
    let value = rest.join('=');
    if (key && value !== undefined) {
      // Remove wrapping quotes if present
      value = value.replace(/^["'](.*)["']$/, '$1');
      
      console.log(`Pushing ${key}...`);
      try {
        // Use PowerShell to echo the value into the vercel env add command
        // Note: we're using production,preview,development environments
        execSync(`echo "${value}" | npx vercel env add ${key} production`, { 
          stdio: 'inherit',
          shell: 'powershell.exe'
        });
      } catch (err) {
        console.error(`Failed to push ${key}:`, err.message);
      }
    }
  }
}
console.log('Finished pushing env vars!');
