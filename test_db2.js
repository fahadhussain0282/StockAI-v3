import 'dotenv/config';
import { initDb, getDb, isDbAvailable } from './src/core/db/client.ts';
async function main() {
  console.log('Initializing DB...');
  await initDb();
  if (isDbAvailable()) {
    const db = getDb();
    const count = await db.user.count();
    console.log(`Successfully connected! Found ${count} users in the database.`);
  } else {
    console.log('Failed to connect to Supabase. Using in-memory fallback.');
  }
  process.exit(0);
}
main();
