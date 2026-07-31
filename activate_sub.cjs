const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function activate() {
  const user = await prisma.user.findFirst({ where: { email: 'test_prod_1785516056353@example.com' } });
  if (!user) return console.error('User not found');
  
  const sub = user.subscription;
  sub.isActive = true;
  sub.isExpired = false;
  sub.expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
  
  await prisma.user.update({
    where: { id: user.id },
    data: { subscription: sub, status: 'active' }
  });
  console.log('✅ Subscription activated for:', user.email);
}
activate().catch(console.error).finally(() => prisma.$disconnect());
