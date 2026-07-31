const { Pool } = require('pg');
const regions = ['us-east-1', 'us-west-1', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1'];
async function test() {
  for (const region of regions) {
    const pool = new Pool({ connectionString: `postgresql://postgres.dpqazemdcqkcakytxshx:Adobe.Icon$12521@aws-0-${region}.pooler.supabase.com:5432/postgres?pgbouncer=true`, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 3000 });
    try {
      await pool.query('SELECT 1');
      console.log('✅ Found Region:', region);
      return;
    } catch (e) {
      console.log('❌ Failed:', region, e.message);
    }
  }
}
test();
