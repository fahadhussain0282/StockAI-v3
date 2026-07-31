import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

async function main() {
  console.log('Connecting to Supabase Database...');
  try {
    const userCount = await prisma.user.count();
    console.log(`Success! Connected to database. Found ${userCount} users.`);
    const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (adminUser) {
      console.log(`Admin User verified: ${adminUser.email}`);
    } else {
      console.log('No Admin user found.');
    }
  } catch (error) {
    console.error('Failed to connect to the database:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
