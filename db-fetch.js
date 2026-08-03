const { Client } = require('pg');
require('dotenv').config();

async function checkDb() {
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } 
  });
  
  // Monkey-patch pg to FORCE ssl rejectUnauthorized = false even with pooler
  client.connectionParameters.ssl = { rejectUnauthorized: false };

  await client.connect();
  const res = await client.query('SELECT "userId", provider, "isHealthy", "apiKeyEncrypted" FROM "UserApiKey" WHERE provider=$1', ['openai']);
  console.log('OpenAI Keys in DB:', res.rows.length);
  
  const crypto = require('crypto');
  const ENCRYPTION_KEY = process.env.STOCKAI_KEY_ENCRYPTION_SECRET;
  
  for (const row of res.rows) {
    if (row.apiKeyEncrypted && ENCRYPTION_KEY) {
      try {
        const parts = row.apiKeyEncrypted.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encryptedText = Buffer.from(parts[2], 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        const key = decrypted.toString();
        console.log(`Found OpenAI Key for user ${row.userId}: ${key.substring(0, 10)}...`);
        
        // Fetch OpenAI
        const fetchRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'test' }]
          })
        });
        
        const json = await fetchRes.text();
        console.log('\n--- RAW OPENAI RESPONSE ---');
        console.log(json);
        console.log('---------------------------\n');
      } catch (err) {
        console.error('Decryption/Fetch error:', err.message);
      }
    }
  }
  
  await client.end();
}
checkDb().catch(console.error);
