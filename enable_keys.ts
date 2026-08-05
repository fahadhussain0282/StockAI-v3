import 'dotenv/config';
import { initDb, getDb } from './src/core/db/client';

async function run() {
  await initDb();
  const db = getDb();
  await db!.userApiKey.updateMany({
    where: { provider: 'openai', userId: 'usr_admin_fahadhussain0282' },
    data: { isEnabled: true, isHealthy: true, consecutiveFails: 0 }
  });
  console.log('Keys enabled!');
  process.exit(0);
}

run().catch(console.error);
