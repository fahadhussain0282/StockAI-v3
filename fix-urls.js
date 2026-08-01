const { execSync } = require('child_process');

const dbUrl = "postgresql://postgres:Task.Flow$12521@db.ufthuufolbnvwcmgpsvf.supabase.co:5432/postgres";
const directUrl = "postgresql://postgres:Task.Flow$12521@db.ufthuufolbnvwcmgpsvf.supabase.co:5432/postgres";

try {
  execSync(`vercel env rm DATABASE_URL production -y`, { stdio: 'ignore' });
} catch (e) {}
try {
  execSync(`vercel env rm DIRECT_URL production -y`, { stdio: 'ignore' });
} catch (e) {}

execSync(`vercel env add DATABASE_URL production --value "${dbUrl}" --yes`, { stdio: 'inherit' });
execSync(`vercel env add DIRECT_URL production --value "${directUrl}" --yes`, { stdio: 'inherit' });

console.log("URLs updated successfully.");
