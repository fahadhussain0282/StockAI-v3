import 'dotenv/config';
import crypto from 'crypto';
import { initDb, getDb } from './src/core/db/client';

function decryptKey(stored, secret) {
  try {
    const parts = stored.split(':');
    const [, ivHex, tagHex, encHex] = parts;
    const keyBuf = crypto.scryptSync(secret.trim(), 'stockai-salt', 32);
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuf, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final('utf8');
  } catch (err) {
    return 'FAILED: ' + err.message;
  }
}

function encryptKey(plaintext, secret) {
  const keyBuf = crypto.scryptSync(secret.trim(), 'stockai-salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuf, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

async function run() {
  await initDb();
  const db = getDb();
  
  const SECRET_OLD = "";
  const SECRET_NEW = "my_local_dev_encryption_secret_123!";
  
  const keys = await db.userApiKey.findMany({ where: { provider: 'openai', userId: 'usr_admin_fahadhussain0282' } });
  
  for (const k of keys) {
    const decrypted = decryptKey(k.encryptedKey, SECRET_OLD);
    if (!decrypted.startsWith('FAILED')) {
      const newEncrypted = encryptKey(decrypted, SECRET_NEW);
      await db.userApiKey.update({
        where: { id: k.id },
        data: {
          encryptedKey: newEncrypted,
          isEnabled: true,
          isHealthy: true,
          consecutiveFails: 0
        }
      });
      console.log('Successfully rescued and updated key:', k.id);
    } else {
      console.log('Failed to decrypt key:', k.id, decrypted);
    }
  }
  
  console.log('Done!');
  process.exit(0);
}

run().catch(console.error);
