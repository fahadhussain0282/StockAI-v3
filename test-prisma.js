require('dotenv').config({ path: '.env.vercel.prod' });
process.env.DATABASE_URL = process.env.DIRECT_URL;
const { PrismaClient } = require('@prisma/client');

async function main() {
  const client = new PrismaClient();

  try {
    await client.$connect();
    console.log('Connected to Prisma natively!');
    const count = await client.user.count();
    console.log('User count:', count);
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await client.$disconnect();
  }
}

main();
