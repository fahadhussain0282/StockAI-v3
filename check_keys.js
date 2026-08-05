const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = 'postgresql://postgres.ufthuufolbnvwcmgpsvf:Task.Flow$12521@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true';
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const keys = await prisma.userApiKey.findMany({
    include: { user: true }
  });
  console.log(JSON.stringify(keys, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
