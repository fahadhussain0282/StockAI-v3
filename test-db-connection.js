// Test Supabase DB connection directly
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://postgres.ufthuufolbnvwcmgpsvf:Task.Flow$12521@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true';

async function main() {
  console.log('Testing Supabase connection...');
  console.log('URL prefix:', DATABASE_URL.substring(0, 50) + '...');
  
  // Strip sslmode and add via ssl option (same as db/client.ts does)
  const rawUrl = new URL(DATABASE_URL);
  rawUrl.searchParams.delete('sslmode');
  const connectionString = rawUrl.toString();

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000
  });

  try {
    await client.connect();
    console.log('✅ Connected!');
    
    const v = await client.query('SELECT version()');
    console.log('DB Version:', v.rows[0].version.substring(0, 60));
    
    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('Tables found:', tables.rows.map(r => r.table_name).join(', '));
    
    if (tables.rows.some(r => r.table_name === 'User')) {
      const users = await client.query('SELECT count(*) FROM "User"');
      console.log('User count:', users.rows[0].count);
    } else {
      console.log('⚠️  No User table found — schema may not be pushed yet');
    }
    
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('Error code:', err.code);
  } finally {
    await client.end().catch(() => {});
  }
}

main();
