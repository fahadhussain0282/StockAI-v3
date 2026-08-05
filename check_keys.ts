import 'dotenv/config';
import { getDb, initDb } from './src/core/db/client';

async function main() {
  await initDb();
  const db = getDb();
  const keys = await db.userApiKey.findMany({
    include: { user: true }
  });
  console.log(JSON.stringify(keys, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2));
}

main().catch(console.error).finally(() => process.exit(0));
