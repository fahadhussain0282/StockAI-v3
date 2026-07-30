/**
 * StockAI v3.0 — Prisma Database Seed
 *
 * Seeds the admin users into the database on first deployment.
 * Run with: npx prisma db seed
 * Or automatically via: prisma migrate dev (in development)
 *
 * This is idempotent — re-running will not duplicate admins.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_USERS = [
  {
    id: 'usr_admin_fahadhussain0282',
    fullName: 'Fahad Hussain',
    email: 'fahadhussain0282@gmail.com',
    passwordHash: 'legacy:admin_seed_1',
    provider: 'local',
    role: 'admin',
    status: 'active',
    subscription: {
      planId: 'plan_1m',
      planName: '1 Month Plan',
      price: 300,
      durationDays: 30,
      daysFromNow: 30,
    }
  },
  {
    id: 'usr_admin_adobeicon99',
    fullName: 'Adobe Icon Studio',
    email: 'adobeicon99@gmail.com',
    passwordHash: 'legacy:admin_seed_2',
    provider: 'local',
    role: 'admin',
    status: 'active',
    subscription: {
      planId: 'plan_6m',
      planName: '6 Months Plan',
      price: 2000,
      durationDays: 180,
      daysFromNow: 180,
    }
  }
];

async function main() {
  console.log('🌱 StockAI — Seeding database...');

  for (const admin of ADMIN_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: admin.email } });
    if (existing) {
      console.log(`  ✓ Admin already exists: ${admin.email}`);
      continue;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + admin.subscription.daysFromNow * 86400000);

    await prisma.user.create({
      data: {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
        passwordHash: admin.passwordHash,
        provider: admin.provider,
        role: admin.role,
        status: admin.status,
        activeDeviceId: 'dev_admin',
        totalGenerations: 0,
        totalPrompts: 0,
        totalCsvExports: 0,
        subscription: {
          create: {
            planId: admin.subscription.planId,
            planName: admin.subscription.planName,
            price: admin.subscription.price,
            durationDays: admin.subscription.durationDays,
            activatedAt: now,
            expiresAt,
            isActive: true,
            isExpired: false,
            deviceId: 'dev_admin',
          }
        }
      }
    });
    console.log(`  ✅ Created admin: ${admin.email}`);
  }

  // Seed initial audit log
  await prisma.auditLog.create({
    data: {
      adminEmail: 'adobeicon99@gmail.com',
      action: 'SYSTEM_BOOT',
      targetUser: 'SYSTEM',
      details: 'StockAI v3.0 Enterprise database initialized with Prisma/PostgreSQL.',
    }
  }).catch(() => {}); // Ignore if already exists

  console.log('🌱 Seed complete.');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error('Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
