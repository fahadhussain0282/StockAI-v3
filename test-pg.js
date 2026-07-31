require('dotenv').config({ path: '.env.vercel.prod' });
const { Pool } = require('pg');

async function main() {
  const parsedUrl = new URL(process.env.DATABASE_URL); // Pooler URL
  parsedUrl.searchParams.delete('sslmode');
  
  const pool = new Pool({
    connectionString: parsedUrl.toString(),
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query('SELECT 1 as test');
    console.log('Connected to pooler successfully!', res.rows);
  } catch (err) {
    console.error('Pooler connection failed:', err);
  } finally {
    await pool.end();
  }
}

main();
