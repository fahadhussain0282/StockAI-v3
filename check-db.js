const { Client } = require('pg');
require('dotenv').config();

async function checkDb() {
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } 
  });
  await client.connect();
  const res = await client.query('SELECT "userId", provider, "isHealthy", "lastErrorMessage" FROM "UserApiKey"');
  console.log('User API Keys:', res.rows);
  const adminRes = await client.query('SELECT "keyId", provider, "isHealthy", "lastErrorMessage" FROM "AdminApiKey"');
  console.log('Admin API Keys:', adminRes.rows);
  await client.end();
}
checkDb().catch(console.error);
