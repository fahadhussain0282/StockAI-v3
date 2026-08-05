require('dotenv').config({ path: '.env' });
const { requireDb } = require('./dist/core/db/client');
const { decryptKey } = require('./dist/core/ai/api-key-manager');

async function main() {
  const db = await requireDb(null); // passing null as mock res
  if (!db) {
    console.error('DB not available');
    return;
  }
  const keys = await db.userApiKey.findMany();
  console.log(JSON.stringify(keys, null, 2));
  for (const k of keys) {
     try {
       console.log('Decrypted key for provider ' + k.provider + ': ' + decryptKey(k.encryptedKey));
     } catch (e) {
       console.log('Failed to decrypt key for ' + k.provider);
     }
  }
}
main().catch(console.error).finally(() => process.exit(0));
