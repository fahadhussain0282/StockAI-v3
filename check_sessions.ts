import 'dotenv/config';
import { getDb, initDb } from './src/core/db/client';

async function main() {
  await initDb();
  const db = getDb();
  const sessions = await db.session.findMany({
    where: { userId: 'usr_admin_fahadhussain0282' },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(sessions, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
