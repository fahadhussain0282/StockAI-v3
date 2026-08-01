const { Client } = require('pg');

const regions = [
  'ap-southeast-1',
  'us-east-1',
  'eu-central-1',
  'us-west-1',
  'eu-west-1',
  'ap-northeast-1',
  'ap-southeast-2'
];

async function checkRegion(region) {
  const url = `postgresql://postgres.ufthuufolbnvwcmgpsvf:Task.Flow$12521@aws-0-${region}.pooler.supabase.com:5432/postgres`;
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    console.log(`✅ SUCCESS: ${region}`);
    await client.end();
    return true;
  } catch (e) {
    if (e.message.includes('tenant/user') || e.message.includes('password')) {
        console.log(`❌ FAILED (Wrong Region Auth): ${region} - ${e.message}`);
    } else {
        console.log(`❌ FAILED (Connection): ${region} - ${e.message}`);
    }
    return false;
  }
}

async function run() {
  for (const r of regions) {
    const success = await checkRegion(r);
    if (success) {
      console.log(`Found pooler URL for region: ${r}`);
      process.exit(0);
    }
  }
}
run();
