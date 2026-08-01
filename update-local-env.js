const fs = require('fs');

const dbUrl = "postgresql://postgres.ufthuufolbnvwcmgpsvf:Task.Flow$12521@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true";
const directUrl = "postgresql://postgres.ufthuufolbnvwcmgpsvf:Task.Flow$12521@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true";

let env = fs.readFileSync('.env', 'utf8');
env = env.replace(/DATABASE_URL=".*"/, `DATABASE_URL="${dbUrl}"`);
env = env.replace(/DIRECT_URL=".*"/, `DIRECT_URL="${directUrl}"`);
fs.writeFileSync('.env', env);
console.log("Local .env updated");
