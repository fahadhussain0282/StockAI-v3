const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.userApiKey.updateMany({
    where: { provider: 'openai', userId: 'usr_admin_fahadhussain0282' },
    data: { isEnabled: true, isHealthy: true, consecutiveFails: 0 }
  });
  console.log('Keys enabled!');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
