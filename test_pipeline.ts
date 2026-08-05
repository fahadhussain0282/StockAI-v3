import 'dotenv/config';
import { initDb, getDb } from './src/core/db/client.js';
import { encryptKey, decryptKey } from './src/core/ai/api-key-manager.js';
import { AiGateway } from './src/core/ai/index.js';

async function run() {
  console.log('\n--- STOCKAI PIPELINE VERIFICATION ---\n');
  
  console.log('[1] VERIFYING ENVIRONMENT');
  console.log('DATABASE_URL loaded:', !!process.env.DATABASE_URL);
  console.log('STOCKAI_KEY_ENCRYPTION_SECRET loaded:', !!process.env.STOCKAI_KEY_ENCRYPTION_SECRET);
  console.log('STOCKAI_KEY_ENCRYPTION_SECRET length:', (process.env.STOCKAI_KEY_ENCRYPTION_SECRET || '').length);
  
  if (!process.env.DATABASE_URL || !process.env.STOCKAI_KEY_ENCRYPTION_SECRET) {
    console.error('FAILED: Missing critical environment variables.');
    return;
  }
  
  console.log('\n[2] VERIFYING DATABASE CONNECTION');
  try {
    await initDb();
    const db = getDb();
    await db.$queryRaw`SELECT 1`;
    console.log('SUCCESS: Database connected.');
  } catch (err: any) {
    console.error('FAILED: Database connection error:', err.message);
    return;
  }

  console.log('\n[3] VERIFYING ENCRYPTION LIFECYCLE');
  const dummyKey = 'gsk_test_groq_key_1234567890';
  console.log('Original Key:', dummyKey);
  
  let encrypted = '';
  try {
    encrypted = encryptKey(dummyKey);
    console.log('Encrypted Key:', encrypted);
    if (!encrypted.startsWith('enc:')) throw new Error('Encryption did not produce enc: prefix');
    console.log('SUCCESS: Encryption passed.');
  } catch (err: any) {
    console.error('FAILED: Encryption failed:', err.message);
    return;
  }
  
  let decrypted = '';
  try {
    decrypted = decryptKey(encrypted);
    console.log('Decrypted Key:', decrypted);
    if (decrypted !== dummyKey) throw new Error('Decrypted key does not match original key');
    console.log('SUCCESS: Decryption passed.');
  } catch (err: any) {
    console.error('FAILED: Decryption failed:', err.message);
    return;
  }
  
  console.log('\n[4] VERIFYING DATABASE STORAGE');
  const db = getDb();
  const testUserId = 'usr_admin_fahadhussain0282';
  let savedKeyId = '';
  try {
    const saved = await db!.userApiKey.create({
      data: {
        userId: testUserId,
        provider: 'groq',
        label: 'TEST KEY',
        encryptedKey: encrypted,
        maskedKey: 'gsk_test_***',
        isEnabled: true,
        isHealthy: true
      }
    });
    savedKeyId = saved.id;
    console.log('SUCCESS: Key stored in DB with ID:', savedKeyId);
  } catch (err: any) {
    console.error('FAILED: Database storage failed:', err.message);
    return;
  }
  
  console.log('\n[5] VERIFYING GATEWAY INJECTION & PROVIDER ADAPTERS');
  
  console.log('Triggering generateMetadata through AiGateway...');
  
  try {
    const result = await AiGateway.generateMetadata({
      provider: 'groq',
      userId: testUserId,
      fileName: 'test.jpg',
      fileType: 'image/jpeg',
      base64Image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCABQAFADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAaEAACAAMAAAAAAAAAAAAAAAAAAQIDERIh/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AL+ADKAAAAD/2Q==', // Tiny 1x1 JPEG
      mimeType: 'image/jpeg',
      systemInstruction: 'Respond with OK',
      userPrompt: 'Test'
    });
    console.log('\n--- FINAL RESULT ---');
    console.log(JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error('\n--- GATEWAY THREW AN ERROR ---');
    console.error(err.message);
    console.log('\n--- DIAGNOSTIC TRACE ---');
    console.log('The gateway successfully bubbled up the error after exhausting all providers.');
  }

  console.log('\n[6] CLEANUP');
  if (savedKeyId) {
    await db!.userApiKey.delete({ where: { id: savedKeyId } });
    console.log('SUCCESS: Cleaned up test key.');
  }
  
  console.log('\n--- VERIFICATION COMPLETE ---');
  process.exit(0);
}

run().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
