const path = require('path');
const dotenv = require('dotenv');
dotenv.config(); // load .env

async function check() {
  process.env.DATABASE_URL = "postgresql://postgres.ufthuufolbnvwcmgpsvf:Task.Flow$12521@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true";
  
  // Use dynamic import for tsx to execute TS file
  const { initDb, getDbAsync } = require('./src/core/db/client');
  await initDb();
  const db = await getDbAsync();
  if (db) {
    const sysKeys = await db.systemApiKey.findMany();
    console.log("SYS KEYS:", sysKeys.map(k => k.provider + " / " + k.maskedKey));
    
    const usrKeys = await db.userApiKey.findMany();
    console.log("USER KEYS:", usrKeys.map(k => k.provider + " / " + k.maskedKey));
    
    await db.$disconnect();
  }
}
check().catch(console.error);
