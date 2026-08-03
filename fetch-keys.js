require('ts-node').register();
const { initDb, getDb } = require('./src/core/db/client');
require('dotenv').config();

async function checkDb() {
  await initDb();
  const db = getDb();
  if (!db) { console.error('No DB'); return; }
  
  const userKeys = await db.userApiKey.findMany({ select: { provider: true, apiKeyEncrypted: true, isHealthy: true } });
  console.log('User Keys:', userKeys.length);
  for (const k of userKeys) console.log(k);
}
checkDb().then(() => process.exit(0)).catch(console.error);
