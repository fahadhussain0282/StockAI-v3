const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.userApiKey.findMany({ select: { userId: true, provider: true, isHealthy: true, lastErrorMessage: true } });
  console.log('User Keys:', users);
  const admin = await prisma.adminApiKey.findMany({ select: { keyId: true, provider: true, isHealthy: true, lastErrorMessage: true } });
  console.log('Admin Keys:', admin);
}
main().finally(() => prisma.$disconnect());
