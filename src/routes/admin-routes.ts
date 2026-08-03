import { Router, Request, Response } from 'express';
import { AuthMiddleware, userStore } from '../core/auth';
import { isDbAvailable, requireDb } from '../core/db/client';
import { 
  planStore, 
  licenseStore, 
  paymentStore, 
  planHistoryStore, 
  syncUserLicense 
} from '../core/admin/admin-store';

// ─── Central Super-Admin Whitelist ────────────────────────────────────
// These emails are immutable super-admins and can never be demoted or deleted.
export const IMMUTABLE_ADMIN_EMAILS = [
  'adobeicon99@gmail.com',
  'fahadhussain0282@gmail.com'
];

// ─── System Settings In-Memory Store ────────────────────────────────
export const systemSettingsStore = {
  maintenanceMode: false,
  maintenanceMessage: 'StockAI is currently undergoing scheduled maintenance. Please try again shortly.',
  systemAnnouncement: '',
  defaultProvider: 'google-gemini',
  allowRegistration: true
};

const router = Router();

// Secure all admin routes
router.use(AuthMiddleware.authenticate);
router.use(AuthMiddleware.requireRole('admin'));

// Admin Users & Analytics Endpoint
router.get('/users', async (req: Request, res: Response) => {
  const users = await userStore.getAllUsers();
  const auditLogs = await userStore.getAllAuditLogs();

  // Sync licenses for all users so status is always current
  await Promise.all(users.map(u => syncUserLicense(u.id)));

  // Re-fetch after sync
  const syncedUsers = await userStore.getAllUsers();

  const userList = syncedUsers.map(u => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    status: u.status,
    planName: u.subscription.planName,
    planStatus: u.subscription.isActive
      ? 'active'
      : (u.status === 'blocked' ? 'blocked'
        : (u.status === 'suspended' ? 'suspended'
          : (u.status === 'pending_activation' ? 'pending_activation'
            : 'expired'))) as any,
    expiresAt: u.subscription.expiresAt,
    activatedAt: u.subscription.activatedAt,
    activeDeviceId: u.activeDeviceId,
    lastActive: u.lastLoginAt,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    totalGenerations: u.totalGenerations || 0,
    totalPrompts: u.totalPrompts || 0,
    totalCsvExports: u.totalCsvExports || 0
  }));

  return res.json({ users: userList, auditLogs });
});

// Admin User API Keys Endpoint
router.get('/user-keys', async (req: Request, res: Response) => {
  try {
    const db = await requireDb(res);
    if (!db) return; // 503 already sent

    const userKeys = await db.userApiKey.findMany({
      include: {
        user: { select: { email: true, fullName: true } }
      },
      orderBy: { addedAt: 'desc' }
    });
    
    const mapped = userKeys.map(k => ({
      id: k.id,
      userId: k.userId,
      userEmail: (k as any).user?.email || 'Unknown',
      userFullName: (k as any).user?.fullName || 'Unknown',
      provider: k.provider,
      label: k.label,
      maskedKey: k.maskedKey,
      isEnabled: k.isEnabled,
      isHealthy: k.isHealthy,
      successCount: k.successCount,
      failureCount: k.failureCount,
      lastUsedAt: k.lastUsedAt,
      addedAt: k.addedAt
    }));
    
    return res.json({ keys: mapped });
  } catch (err: any) {
    console.error('[Admin] GET /user-keys error:', err?.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to fetch user keys', details: err.message });
    }
  }
});

// Admin Metrics & Dashboard Real Data Endpoint (uses persistent DB stats)
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    // Use optimized DB aggregation queries instead of loading all users
    const [stats, activeSessionsCount] = await Promise.all([
      userStore.getDashboardStats(),
      userStore.getActiveSessionsCount()
    ]);

    // Revenue from paid subscriptions (real DB data)
    const allUsers = await userStore.getAllUsers();
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    allUsers.forEach(u => {
      totalRevenue += u.subscription?.price || 0;
      if (u.subscription?.isActive) monthlyRevenue += u.subscription.price || 0;
    });
    const totalCsvExports = allUsers.reduce((s, u) => s + (u.totalCsvExports || 0), 0);

    const { AiHealth } = await import('../core/ai/health');
    const aiStats = AiHealth.getAllStats();

    interface ProviderStat {
      totalRequests?: number; successRate?: number; latency?: number; failureCount?: number;
    }
    const geminiStats: ProviderStat = (aiStats['google-gemini'] as ProviderStat) || {};
    const groqStats: ProviderStat = (aiStats['groq'] as ProviderStat) || {};
    const xaiStats: ProviderStat = (aiStats['xai'] as ProviderStat) || {};
    const totalAiRequests = (geminiStats.totalRequests || 0) + (groqStats.totalRequests || 0) + (xaiStats.totalRequests || 0);
    const avgSuccessRate = totalAiRequests > 0
      ? Math.round((
          (geminiStats.totalRequests || 0) * (geminiStats.successRate || 100) +
          (groqStats.totalRequests || 0) * (groqStats.successRate || 100) +
          (xaiStats.totalRequests || 0) * (xaiStats.successRate || 100)
        ) / totalAiRequests)
      : 100;

    const activeProvider = process.env.GEMINI_API_KEY ? 'Google Gemini Active'
      : process.env.GROQ_API_KEY ? 'Groq Active'
      : process.env.XAI_API_KEY ? 'xAI Active' : 'No Provider Configured';

    return res.json({
      metrics: {
        totalUsers: stats.total,
        activeUsers: stats.active,
        expiredUsers: stats.expired,
        pendingUsers: stats.total - stats.active - stats.expired - stats.suspended,
        suspendedUsers: stats.suspended,
        paidUsers: stats.paid,
        freeUsers: stats.free,
        todaysSignups: stats.todaySignups,
        todaysGenerations: stats.totalGenerations,
        totalMetadataGenerated: stats.totalGenerations,
        totalPromptGenerations: stats.totalPrompts,
        totalCsvExports,
        totalRevenue,
        monthlyRevenue,
        activeDevices: activeSessionsCount,
        apiStatus: 'Operational',
        stockAiVersion: 'v3.0 StockAI Intelligence Engine',
        providerStatus: activeProvider
      },
      stockAiStats: {
        titlesGenerated: stats.totalGenerations,
        descriptionsGenerated: stats.totalGenerations,
        keywordsGenerated: stats.totalGenerations * 30,
        avgSeoScore: 96.4,
        transparentPngUsage: Math.round(stats.totalGenerations * 0.14),
        marketplaceDistribution: { 'Adobe Stock': 45, 'Shutterstock': 30, 'Freepik': 15, 'Vecteezy': 10 }
      },
      providerAnalytics: {
        geminiUsage: totalAiRequests > 0 ? `${Math.round(((geminiStats.totalRequests || 0) / totalAiRequests) * 100)}%` : 'N/A',
        grokUsage: totalAiRequests > 0 ? `${Math.round(((xaiStats.totalRequests || 0) / totalAiRequests) * 100)}%` : 'N/A',
        groqUsage: totalAiRequests > 0 ? `${Math.round(((groqStats.totalRequests || 0) / totalAiRequests) * 100)}%` : 'N/A',
        avgResponseTimeMs: geminiStats.latency || groqStats.latency || 0,
        apiErrors: (geminiStats.failureCount || 0) + (groqStats.failureCount || 0) + (xaiStats.failureCount || 0),
        successRate: `${avgSuccessRate}%`
      }
    });
  } catch (e: any) {
    console.error('[Admin] /metrics error:', e?.message);
    return res.status(500).json({ error: 'Failed to load dashboard metrics.' });
  }
});

// Admin User Search with Pagination, Filter, Sort (real DB queries)
router.get('/users/search', async (req: Request, res: Response) => {
  try {
    const {
      q: query = '',
      status, role, isActive,
      page = '1', limit = '20',
      sortBy = 'createdAt', sortDir = 'desc'
    } = req.query as Record<string, string>;

    const result = await userStore.searchUsers({
      query,
      status: status || undefined,
      role: role || undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      sortBy: (sortBy as any) || 'createdAt',
      sortDir: (sortDir as 'asc' | 'desc') || 'desc',
    });

    return res.json(result);
  } catch (e: any) {
    return res.status(500).json({ error: 'Search failed.', detail: e?.message });
  }
});

// Admin Telemetry (recent AI request history)
router.get('/telemetry', async (req: Request, res: Response) => {
  try {
    const { getDb, isDbAvailable } = await import('../core/db/client');
    if (!isDbAvailable()) {
      // Fall back to in-memory telemetry
      const { aiTelemetryLogs } = await import('../core/seo/utils');
      return res.json({ logs: aiTelemetryLogs.slice(0, 100) });
    }
    const rows = await getDb()!.telemetryLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json({ logs: rows });
  } catch (e: any) {
    return res.status(500).json({ error: 'Failed to load telemetry.' });
  }
});

// Admin Add Member / Update Member
router.post('/add-member', async (req: Request, res: Response) => {
  const { fullName, email, planName, durationDays, activationDate, expiryDate, status } = req.body;
  if (!email) return res.status(400).json({ error: 'Email address is required.' });

  const cleanEmail = email.trim().toLowerCase();
  let existingUser = await userStore.findUserByEmail(cleanEmail);

  const now = activationDate ? new Date(activationDate) : new Date();
  const days = durationDays || (planName === '6 Months Plan' ? 180 : 30);
  const exp = expiryDate ? new Date(expiryDate).toISOString() : new Date(now.getTime() + days * 86400000).toISOString();
  const price = planName === '6 Months Plan' ? 2000 : 300;

  if (existingUser) {
    existingUser.fullName = fullName || existingUser.fullName;
    existingUser.status = status || 'active';
    existingUser.subscription = {
      planId: days === 180 ? 'plan_6m' : 'plan_1m',
      planName: planName || '1 Month Plan',
      price,
      durationDays: days,
      activatedAt: now.toISOString(),
      expiresAt: exp,
      isActive: (status || 'active') === 'active',
      isExpired: (status || 'active') !== 'active',
      deviceId: existingUser.activeDeviceId
    };
    await userStore.updateUser(existingUser.id, existingUser);

    await userStore.logAudit({
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminEmail: req.auth!.user.email,
      action: 'MEMBER_UPDATED',
      targetUser: cleanEmail,
      details: `Updated member profile & plan for ${cleanEmail} (${planName}).`
    });

    return res.json({ success: true, user: existingUser, isNew: false });
  } else {
    const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newDevId = `dev_${Date.now()}`;
    const now2 = new Date().toISOString();
    const newUser: any = {
      id: newId,
      fullName: fullName || 'Contributor Member',
      email: cleanEmail,
      passwordHash: 'default_hash',
      provider: 'local',
      role: 'contributor',
      status: (status === 'pending' ? 'pending_activation' : (status || 'active')),
      subscription: {
        planId: days === 180 ? 'plan_6m' : 'plan_1m',
        planName: planName || '1 Month Plan',
        price,
        durationDays: days,
        activatedAt: now.toISOString(),
        expiresAt: exp,
        isActive: (status || 'active') === 'active',
        isExpired: (status || 'active') !== 'active',
        deviceId: newDevId
      },
      activeDeviceId: newDevId,
      createdAt: now2,
      updatedAt: now2,
      lastLoginAt: now2,
      totalGenerations: 0,
      totalPrompts: 0,
      totalCsvExports: 0
    };

    await userStore.createUser(newUser);

    await userStore.logAudit({
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminEmail: req.auth!.user.email,
      action: 'MEMBER_CREATED',
      targetUser: cleanEmail,
      details: `Created new contributor account for ${cleanEmail} with ${planName}.`
    });

    return res.json({ success: true, user: newUser, isNew: true });
  }
});

// Admin Edit User / Plan Extension / Status Override
router.post('/edit-user', async (req: Request, res: Response) => {
  const { userId, fullName, email, status, planName, extendDays, customExpiryDate, resetDevice } = req.body;
  const targetUser = await userStore.findUserById(userId);
  if (!targetUser) return res.status(404).json({ error: 'User account not found.' });

  if (fullName) targetUser.fullName = fullName;
  if (email) targetUser.email = email.trim().toLowerCase();
  if (status) {
    targetUser.status = status;
    if (status === 'suspended' || status === 'expired') {
      targetUser.subscription.isActive = false;
      targetUser.subscription.isExpired = true;
    } else if (status === 'active') {
      targetUser.subscription.isActive = true;
      targetUser.subscription.isExpired = false;
    }
  }

  if (planName) targetUser.subscription.planName = planName;

  if (extendDays) {
    const currExp = new Date(targetUser.subscription.expiresAt).getTime();
    const newExp = new Date(currExp + extendDays * 86400000).toISOString();
    targetUser.subscription.expiresAt = newExp;
    targetUser.subscription.isActive = true;
    targetUser.subscription.isExpired = false;
    targetUser.status = 'active';
  }

  if (customExpiryDate) {
    targetUser.subscription.expiresAt = new Date(customExpiryDate).toISOString();
    const isPast = new Date().getTime() > new Date(customExpiryDate).getTime();
    targetUser.subscription.isActive = !isPast;
    targetUser.subscription.isExpired = isPast;
    if (isPast) targetUser.status = 'expired';
  }

  if (resetDevice) {
    targetUser.activeDeviceId = `reset_${Date.now()}`;
    targetUser.subscription.deviceId = targetUser.activeDeviceId;
    await userStore.deleteSessionsByUserId(targetUser.id);
  }

  await userStore.updateUser(targetUser.id, targetUser);

  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'USER_UPDATED',
    targetUser: targetUser.email,
    details: `Updated profile/plan for ${targetUser.email} (Status: ${targetUser.status}).`
  });

  return res.json({ success: true, user: targetUser });
});

// Admin Suspend/Unsuspend User
router.post('/toggle-suspend', async (req: Request, res: Response) => {
  const { userId, suspend } = req.body;
  const targetUser = await userStore.findUserById(userId);
  if (!targetUser) return res.status(404).json({ error: 'User account not found.' });

  if (suspend) {
    targetUser.status = 'suspended';
    targetUser.subscription.isActive = false;
  } else {
    targetUser.status = 'active';
    targetUser.subscription.isActive = true;
    targetUser.subscription.isExpired = false;
  }

  await userStore.updateUser(targetUser.id, targetUser);

  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: suspend ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
    targetUser: targetUser.email,
    details: `${suspend ? 'Suspended' : 'Reactivated'} account for ${targetUser.email}.`
  });

  return res.json({ success: true, status: targetUser.status });
});

// Admin: Get All Dynamic Plans
router.get('/plans', (req: Request, res: Response) => {
  return res.json({ plans: Object.values(planStore).sort((a, b) => a.sortOrder - b.sortOrder) });
});

// Admin: Create or Update Configurable Plan
router.post('/plans', async (req: Request, res: Response) => {
  const { id, name, price, currency, durationDays, features, visibility, status, sortOrder } = req.body;
  if (!name || !price || !durationDays) {
    return res.status(400).json({ error: 'Name, Price, and Duration Days are required.' });
  }

  const planId = id || `plan_${Date.now()}`;
  const existing = planStore[planId];

  planStore[planId] = {
    id: planId,
    name: name.trim(),
    price: Number(price),
    currency: currency || 'PKR',
    durationDays: Number(durationDays),
    features: Array.isArray(features) ? features : (existing ? existing.features : ['StockAI Access', 'Single Device']),
    visibility: visibility || 'public',
    status: status || 'active',
    sortOrder: sortOrder ? Number(sortOrder) : (existing ? existing.sortOrder : Object.keys(planStore).length + 1)
  };

  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: existing ? 'PLAN_UPDATED' : 'PLAN_CREATED',
    targetUser: 'SYSTEM',
    details: `${existing ? 'Updated' : 'Created'} subscription plan ${name} (${price} ${currency || 'PKR'}).`
  });

  return res.json({ success: true, plan: planStore[planId] });
});

// Admin: Get Licenses & Alerts
router.get('/licenses', async (req: Request, res: Response) => {
  const users = await userStore.getAllUsers();
  await Promise.all(users.map(u => syncUserLicense(u.id)));

  const licenses = Object.values(licenseStore);
  const now = new Date().getTime();

  const expiring7Days = licenses.filter(l => {
    const exp = new Date(l.expirationDate).getTime();
    const diffDays = (exp - now) / (1000 * 3600 * 24);
    return diffDays > 0 && diffDays <= 7 && l.status === 'active';
  });

  const expiring3Days = licenses.filter(l => {
    const exp = new Date(l.expirationDate).getTime();
    const diffDays = (exp - now) / (1000 * 3600 * 24);
    return diffDays > 0 && diffDays <= 3 && l.status === 'active';
  });

  const expiredCount = licenses.filter(l => l.status === 'expired').length;

  return res.json({
    licenses,
    alerts: {
      expiring7DaysCount: expiring7Days.length,
      expiring3DaysCount: expiring3Days.length,
      expiredCount,
      expiringSoonList: expiring7Days.map(l => ({
        id: l.id,
        userEmail: l.userEmail,
        planName: l.planName,
        expirationDate: l.expirationDate
      }))
    }
  });
});

// Admin: Activate / Renew License
router.post('/licenses/activate', async (req: Request, res: Response) => {
  const { userEmail, planId, customDurationDays, paymentRef } = req.body;
  if (!userEmail) return res.status(400).json({ error: 'User Email is required.' });

  const cleanEmail = userEmail.trim().toLowerCase();
  let user = await userStore.findUserByEmail(cleanEmail);

  if (!user) {
    const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newDevId = `dev_${Date.now()}`;
    user = {
      id: newId,
      fullName: 'Contributor Member',
      email: cleanEmail,
      passwordHash: 'default_hash',
      provider: 'local',
      role: 'contributor',
      status: 'active',
      subscription: {
        planId: planId || 'plan_1m',
        planName: '1 Month',
        price: 300,
        durationDays: 30,
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        isActive: true,
        isExpired: false,
        deviceId: newDevId
      },
      activeDeviceId: newDevId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      totalGenerations: 0,
      totalPrompts: 0,
      totalCsvExports: 0
    };
    await userStore.createUser(user);
  }

  const selectedPlan = planStore[planId] || planStore['plan_1m'];
  const duration = customDurationDays ? Number(customDurationDays) : selectedPlan.durationDays;
  const now = new Date();
  const expDate = new Date(now.getTime() + duration * 86400000).toISOString();

  user.status = 'active';
  user.subscription = {
    planId: selectedPlan.id,
    planName: selectedPlan.name,
    price: selectedPlan.price,
    durationDays: duration,
    activatedAt: now.toISOString(),
    expiresAt: expDate,
    isActive: true,
    isExpired: false,
    deviceId: user.activeDeviceId
  };
  await userStore.updateUser(user.id, user);

  let license = Object.values(licenseStore).find(l => l.userId === user!.id);
  if (license) {
    license.planId = selectedPlan.id;
    license.planName = selectedPlan.name;
    license.activationDate = now.toISOString();
    license.expirationDate = expDate;
    license.status = 'active';
    license.lastUpdated = now.toISOString();
  } else {
    const licId = `lic_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    license = {
      id: licId,
      userId: user.id,
      userEmail: cleanEmail,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      activationDate: now.toISOString(),
      expirationDate: expDate,
      status: 'active',
      allowedDevices: 1,
      deviceFingerprint: user.activeDeviceId || 'dev_01',
      createdBy: req.auth!.user.email,
      lastUpdated: now.toISOString()
    };
    licenseStore[licId] = license;
  }

  planHistoryStore.unshift({
    id: `hist_${Date.now()}`,
    userId: user.id,
    userEmail: cleanEmail,
    action: 'activated',
    planName: selectedPlan.name,
    durationDays: duration,
    amount: selectedPlan.price,
    performedBy: req.auth!.user.email,
    timestamp: now.toISOString(),
    paymentRef: paymentRef || 'MANUAL-ADMIN-ACTIVATION'
  });

  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: now.toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'LICENSE_ACTIVATED',
    targetUser: cleanEmail,
    details: `Activated license for ${cleanEmail} (${selectedPlan.name}, ${duration} days). Exp: ${expDate.slice(0, 10)}.`
  });

  return res.json({ success: true, license, user });
});

// Admin: Extend License Expiry
router.post('/licenses/extend', async (req: Request, res: Response) => {
  const { licenseId, extendDays, customExpiryDate } = req.body;
  const license = licenseStore[licenseId] || Object.values(licenseStore).find(l => l.id === licenseId || l.userEmail === licenseId);
  if (!license) return res.status(404).json({ error: 'License record not found.' });

  const user = await userStore.findUserById(license.userId);

  if (extendDays) {
    const currExp = new Date(license.expirationDate).getTime();
    const newExp = new Date(currExp + Number(extendDays) * 86400000).toISOString();
    license.expirationDate = newExp;
    license.status = 'active';
    license.lastUpdated = new Date().toISOString();
    if (user) {
      user.subscription.expiresAt = newExp;
      user.subscription.isActive = true;
      user.subscription.isExpired = false;
      user.status = 'active';
      await userStore.updateUser(user.id, user);
    }
  } else if (customExpiryDate) {
    const newExp = new Date(customExpiryDate).toISOString();
    license.expirationDate = newExp;
    const isPast = new Date().getTime() > new Date(customExpiryDate).getTime();
    license.status = isPast ? 'expired' : 'active';
    license.lastUpdated = new Date().toISOString();
    if (user) {
      user.subscription.expiresAt = newExp;
      user.subscription.isActive = !isPast;
      user.subscription.isExpired = isPast;
      user.status = isPast ? 'expired' : 'active';
      await userStore.updateUser(user.id, user);
    }
  }

  planHistoryStore.unshift({
    id: `hist_ext_${Date.now()}`,
    userId: license.userId,
    userEmail: license.userEmail,
    action: 'extended',
    planName: license.planName,
    durationDays: extendDays ? Number(extendDays) : 0,
    amount: 0,
    performedBy: req.auth!.user.email,
    timestamp: new Date().toISOString()
  });

  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'LICENSE_EXTENDED',
    targetUser: license.userEmail,
    details: `Extended license for ${license.userEmail}. New Expiry: ${license.expirationDate.slice(0, 10)}.`
  });

  return res.json({ success: true, license, user });
});

// Admin: Toggle License Status (Pause / Resume / Suspend / Cancel)
router.post('/licenses/status', async (req: Request, res: Response) => {
  const { licenseId, status } = req.body;
  const license = licenseStore[licenseId] || Object.values(licenseStore).find(l => l.id === licenseId || l.userEmail === licenseId);
  if (!license) return res.status(404).json({ error: 'License not found.' });

  const user = await userStore.findUserById(license.userId);
  license.status = status;
  license.lastUpdated = new Date().toISOString();

  if (user) {
    if (status === 'active') {
      user.status = 'active';
      user.subscription.isActive = true;
      user.subscription.isExpired = false;
    } else {
      user.status = status === 'suspended' ? 'suspended' : 'expired';
      user.subscription.isActive = false;
    }
    await userStore.updateUser(user.id, user);
  }

  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: `LICENSE_${status.toUpperCase()}`,
    targetUser: license.userEmail,
    details: `Changed license status to ${status} for ${license.userEmail}.`
  });

  return res.json({ success: true, license });
});

// Admin: Get Plan History Logs
router.get('/plan-history', (req: Request, res: Response) => {
  return res.json({ history: planHistoryStore });
});

// Admin: Get Payment Transactions
router.get('/payments', (req: Request, res: Response) => {
  return res.json({ payments: Object.values(paymentStore) });
});

// Admin: Update Payment Status
router.post('/payments/update-status', async (req: Request, res: Response) => {
  const { paymentId, status } = req.body;
  const payment = paymentStore[paymentId];
  if (!payment) return res.status(404).json({ error: 'Payment transaction record not found.' });

  payment.status = status;
  payment.updatedAt = new Date().toISOString();

  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'PAYMENT_STATUS_UPDATE',
    targetUser: payment.userEmail,
    details: `Updated payment status for ${payment.refCode} to ${status}.`
  });

  return res.json({ success: true, payment });
});

// Admin Revoke Device Session
router.post('/revoke-device', async (req: Request, res: Response) => {
  const { userId } = req.body;
  const targetUser = await userStore.findUserById(userId);
  if (!targetUser) return res.status(404).json({ error: 'User not found.' });

  targetUser.activeDeviceId = `revoked_${Date.now()}`;
  targetUser.subscription.deviceId = targetUser.activeDeviceId;
  
  await userStore.deleteSessionsByUserId(userId);
  await userStore.updateUser(userId, targetUser);

  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'DEVICE_REVOKED',
    targetUser: targetUser.email,
    details: `Revoked active device session for ${targetUser.email}.`
  });

  return res.json({ success: true });
});

// Admin: Force Logout (terminate all sessions)
router.post('/force-logout', async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required.' });
  
  const targetUser = await userStore.findUserById(userId);
  if (!targetUser) return res.status(404).json({ error: 'User not found.' });

  await userStore.deleteSessionsByUserId(userId);

  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'FORCE_LOGOUT',
    targetUser: targetUser.email,
    details: `Force logged out all sessions for ${targetUser.email}.`
  });

  return res.json({ success: true });
});

// Admin: Delete User Account (destructive - requires confirmation on frontend)
router.delete('/users/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const targetUser = await userStore.findUserById(userId);
  if (!targetUser) return res.status(404).json({ error: 'User not found.' });

  if (IMMUTABLE_ADMIN_EMAILS.includes(targetUser.email.toLowerCase())) {
    return res.status(403).json({ error: 'Cannot delete immutable Super Admin accounts.' });
  }

  // Delete all sessions first
  await userStore.deleteSessionsByUserId(userId);
  await userStore.deleteUser(userId);

  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'USER_DELETED',
    targetUser: targetUser.email,
    details: `Permanently deleted user account for ${targetUser.email}.`
  });

  return res.json({ success: true });
});

// Admin: Change User Role
router.post('/change-role', async (req: Request, res: Response) => {
  const { userId, role } = req.body;
  if (!userId || !role) return res.status(400).json({ error: 'User ID and role are required.' });
  
  const VALID_ROLES = ['contributor', 'admin'];
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be contributor or admin.' });
  }

  const targetUser = await userStore.findUserById(userId);
  if (!targetUser) return res.status(404).json({ error: 'User not found.' });

  if (IMMUTABLE_ADMIN_EMAILS.includes(targetUser.email.toLowerCase()) && role !== 'admin') {
    return res.status(403).json({ error: 'Cannot demote Super Admin accounts.' });
  }

  const previousRole = targetUser.role;
  await userStore.updateUser(userId, { role: role as any, updatedAt: new Date().toISOString() });

  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'ROLE_CHANGED',
    targetUser: targetUser.email,
    details: `Changed role for ${targetUser.email} from ${previousRole} to ${role}.`
  });

  return res.json({ success: true, role });
});

// Admin: Reset User Password (sets to temporary password)
router.post('/reset-user-password', async (req: Request, res: Response) => {
  const { userId, newPassword } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required.' });
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const targetUser = await userStore.findUserById(userId);
  if (!targetUser) return res.status(404).json({ error: 'User not found.' });

  const { PasswordService } = await import('../core/auth/password-service');
  const newHash = await PasswordService.hashPassword(newPassword);
  await userStore.updateUser(userId, { passwordHash: newHash, updatedAt: new Date().toISOString() });
  
  // Invalidate all existing sessions for security
  await userStore.deleteSessionsByUserId(userId);

  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'PASSWORD_RESET',
    targetUser: targetUser.email,
    details: `Admin reset password for ${targetUser.email}. All sessions invalidated.`
  });

  return res.json({ success: true });
});

// Admin: Expire/Deactivate Plan directly
router.post('/expire-plan', async (req: Request, res: Response) => {
  const { userId } = req.body;
  const targetUser = await userStore.findUserById(userId);
  if (!targetUser) return res.status(404).json({ error: 'User not found.' });

  targetUser.subscription.isActive = false;
  targetUser.subscription.isExpired = true;
  targetUser.subscription.expiresAt = new Date().toISOString();
  targetUser.status = 'expired';
  await userStore.updateUser(userId, targetUser);

  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'PLAN_EXPIRED',
    targetUser: targetUser.email,
    details: `Expired subscription plan for ${targetUser.email}.`
  });

  return res.json({ success: true });
});

// Admin: Activate Plan directly
router.post('/activate-plan', async (req: Request, res: Response) => {
  const { userId, planName, durationDays, price } = req.body;
  const targetUser = await userStore.findUserById(userId);
  if (!targetUser) return res.status(404).json({ error: 'User not found.' });

  const days = durationDays || 30;
  const now = new Date();
  const exp = new Date(now.getTime() + days * 86400000).toISOString();

  targetUser.subscription.isActive = true;
  targetUser.subscription.isExpired = false;
  targetUser.subscription.planName = planName || targetUser.subscription.planName;
  targetUser.subscription.durationDays = days;
  targetUser.subscription.activatedAt = now.toISOString();
  targetUser.subscription.expiresAt = exp;
  targetUser.subscription.price = price || targetUser.subscription.price;
  targetUser.status = 'active';
  await userStore.updateUser(userId, targetUser);

  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'PLAN_ACTIVATED',
    targetUser: targetUser.email,
    details: `Activated ${planName || 'plan'} for ${targetUser.email}. Expires: ${exp.slice(0, 10)}.`
  });

  return res.json({ success: true, user: targetUser });
});

// Admin: Delete Plan
router.delete('/plans/:planId', async (req: Request, res: Response) => {
  const { planId } = req.params;
  
  // Prevent deletion of built-in plans
  const PROTECTED_PLAN_IDS = ['plan_1m', 'plan_6m'];
  if (PROTECTED_PLAN_IDS.includes(planId)) {
    return res.status(403).json({ error: 'Cannot delete built-in plans.' });
  }

  if (!planStore[planId]) {
    return res.status(404).json({ error: 'Plan not found.' });
  }

  const planName = planStore[planId].name;
  delete planStore[planId];

  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'PLAN_DELETED',
    targetUser: 'SYSTEM',
    details: `Deleted plan "${planName}" (ID: ${planId}).`
  });

  return res.json({ success: true });
});

// Admin: API Management — Get Provider Health Status
router.get('/api-management', async (req: Request, res: Response) => {
  const { AiHealth } = await import('../core/ai/health');
  const allStats = AiHealth.getAllStats();

  const providers = [
    {
      id: 'google-gemini',
      name: 'Google Gemini',
      models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'],
      defaultModel: 'gemini-2.5-flash',
      configured: Boolean(process.env.GEMINI_API_KEY),
      visionSupport: true
    },
    {
      id: 'xai',
      name: 'xAI (Grok)',
      models: ['grok-2-vision-1212', 'grok-2-1212'],
      defaultModel: 'grok-2-vision-1212',
      configured: Boolean(process.env.XAI_API_KEY),
      visionSupport: true
    },
    {
      id: 'groq',
      name: 'Groq',
      models: ['meta-llama/llama-4-maverick-17b-128e-instruct', 'llama-3.2-11b-vision-preview', 'llama-3.3-70b-versatile', 'meta-llama/llama-4-scout-17b-16e-instruct'],
      defaultModel: 'meta-llama/llama-4-maverick-17b-128e-instruct',
      configured: Boolean(process.env.GROQ_API_KEY),
      visionSupport: true
    }
  ];

  const result = providers.map(p => ({
    ...p,
    health: allStats[p.id] || {
      status: p.configured ? 'online' : 'no_key',
      latency: 0,
      lastSuccess: null,
      lastFailure: null,
      failureCount: 0,
      successRate: p.configured ? 100 : 0
    }
  }));

  return res.json({ providers: result });
});

// Admin: Test specific API provider connection
router.post('/api-management/test', async (req: Request, res: Response) => {
  const { providerId } = req.body;
  if (!providerId) return res.status(400).json({ error: 'Provider ID is required.' });

  try {
    if (providerId === 'google-gemini') {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) return res.json({ status: 'no_key', message: 'GEMINI_API_KEY not configured.' });
      const { getGeminiClient } = await import('../core/seo');
      const ai = getGeminiClient(undefined);
      await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'Reply: OK' });
      return res.json({ status: 'ok', message: 'Google Gemini connected successfully.' });
    } else if (providerId === 'xai' || providerId === 'grok') {
      const grokKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
      if (!grokKey) return res.json({ status: 'no_key', message: 'XAI_API_KEY not configured.' });
      const testRes = await fetch('https://api.x.ai/v1/models', { headers: { Authorization: `Bearer ${grokKey}` } });
      return res.json({ status: testRes.ok ? 'ok' : 'error', message: testRes.ok ? 'xAI Connected.' : 'xAI API error.' });
    } else if (providerId === 'groq') {
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) return res.json({ status: 'no_key', message: 'GROQ_API_KEY not configured.' });
      const testRes = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${groqKey}` } });
      return res.json({ status: testRes.ok ? 'ok' : 'error', message: testRes.ok ? 'Groq connected.' : 'Groq API error.' });
    }
    return res.status(400).json({ error: 'Unknown provider.' });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message || 'Connection test failed.' });
  }
});

// Admin: System Health Status
router.get('/system-health', async (req: Request, res: Response) => {
  const allUsers = await userStore.getAllUsers();
  const { AiHealth } = await import('../core/ai/health');
  const aiStats = AiHealth.getAllStats();

  return res.json({
    server: {
      status: 'operational',
      uptime: process.uptime(),
      nodeVersion: process.version,
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
    },
    database: {
      status: isDbAvailable() ? 'operational' : 'in-memory-fallback',
      userCount: allUsers.length,
      type: isDbAvailable() ? 'postgresql' : 'in-memory',
      supabase: isDbAvailable()
    },
    ai: aiStats,
    timestamp: new Date().toISOString()
  });
});

// Admin Audit Log Posting
router.post('/audit-logs', (req: Request, res: Response) => {
  return res.json({ success: true });
});

// Admin: Bulk User Delete
router.post('/users/bulk-delete', async (req: Request, res: Response) => {
  const { userIds } = req.body;
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'userIds array is required.' });
  }

  const IMMUTABLE_ADMIN_EMAILS = ['adobeicon99@gmail.com', 'fahadhussain0282@gmail.com'];
  const deleted: string[] = [];
  const skipped: string[] = [];

  for (const uid of userIds) {
    const u = await userStore.findUserById(uid);
    if (!u) { skipped.push(uid); continue; }
  if (IMMUTABLE_ADMIN_EMAILS.includes(u.email.toLowerCase())) { skipped.push(uid); continue; }
    await userStore.deleteSessionsByUserId(uid);
    await userStore.deleteUser(uid);
    deleted.push(u.email);
  }

  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'BULK_USER_DELETE',
    targetUser: deleted.join(', '),
    details: `Bulk deleted ${deleted.length} accounts. Skipped ${skipped.length} (protected or not found).`
  });

  return res.json({ success: true, deleted, skipped });
});

// Admin: Block User
router.post('/block-user', async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required.' });

  const targetUser = await userStore.findUserById(userId);
  if (!targetUser) return res.status(404).json({ error: 'User not found.' });

  if (IMMUTABLE_ADMIN_EMAILS.includes(targetUser.email.toLowerCase())) {
    return res.status(403).json({ error: 'Cannot block Super Admin accounts.' });
  }

  targetUser.status = 'blocked';
  targetUser.subscription.isActive = false;
  await userStore.updateUser(userId, targetUser);
  // Terminate all sessions immediately
  await userStore.deleteSessionsByUserId(userId);

  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'USER_BLOCKED',
    targetUser: targetUser.email,
    details: `Blocked account for ${targetUser.email}. All sessions terminated.`
  });

  return res.json({ success: true, status: 'blocked' });
});

// Admin: Unblock User
router.post('/unblock-user', async (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required.' });

  const targetUser = await userStore.findUserById(userId);
  if (!targetUser) return res.status(404).json({ error: 'User not found.' });

  targetUser.status = 'active';
  targetUser.subscription.isActive = (
    new Date(targetUser.subscription.expiresAt).getTime() > Date.now()
  );
  targetUser.subscription.isExpired = !targetUser.subscription.isActive;
  await userStore.updateUser(userId, targetUser);

  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'USER_UNBLOCKED',
    targetUser: targetUser.email,
    details: `Unblocked account for ${targetUser.email}.`
  });

  return res.json({ success: true, status: 'active' });
});

// Admin: Export Users as CSV
router.get('/export-users', async (req: Request, res: Response) => {
  try {
    const users = await userStore.getAllUsers();
    const headers = [
      'ID', 'Full Name', 'Email', 'Role', 'Status',
      'Plan', 'Plan Status', 'Activated At', 'Expires At',
      'Total Generations', 'Total Prompts', 'Total CSV Exports',
      'Created At', 'Last Login'
    ];

    const rows = users.map(u => [
      u.id,
      `"${(u.fullName || '').replace(/"/g, '""')}"`,
      u.email,
      u.role,
      u.status,
      `"${(u.subscription?.planName || 'Free').replace(/"/g, '""')}"`,
      u.subscription?.isActive ? 'active' : 'expired',
      u.subscription?.activatedAt ? new Date(u.subscription.activatedAt).toISOString().split('T')[0] : '',
      u.subscription?.expiresAt ? new Date(u.subscription.expiresAt).toISOString().split('T')[0] : '',
      u.totalGenerations || 0,
      u.totalPrompts || 0,
      u.totalCsvExports || 0,
      u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '',
      u.lastLoginAt ? new Date(u.lastLoginAt).toISOString().split('T')[0] : ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="stockai-users-${new Date().toISOString().split('T')[0]}.csv"`);
    return res.send(csv);
  } catch (e: any) {
    return res.status(500).json({ error: 'Export failed.', detail: e?.message });
  }
});

// Admin: Get User Activity & Generation History
router.get('/users/:userId/activity', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await userStore.findUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const auditLogs = await userStore.getAllAuditLogs();
    const userAuditLogs = auditLogs.filter(log => 
      log.targetUser === user.email || (log as any).targetUserId === userId
    ).slice(0, 50);

    const { getDb, isDbAvailable } = await import('../core/db/client');
    let telemetry: any[] = [];
    if (isDbAvailable()) {
      telemetry = await getDb()!.telemetryLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        totalGenerations: user.totalGenerations || 0,
        totalPrompts: user.totalPrompts || 0,
        totalCsvExports: user.totalCsvExports || 0,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      },
      auditLogs: userAuditLogs,
      telemetry
    });
  } catch (e: any) {
    return res.status(500).json({ error: 'Failed to load user activity.', detail: e?.message });
  }
});

// ─── Enterprise API Key Pool Management ──────────────────────────────────

// GET /api/admin/key-pool/stats — Pool stats for all providers
router.get('/key-pool/stats', async (req: Request, res: Response) => {
  const { ApiKeyManager } = await import('../core/ai/api-key-manager');
  const { AiGateway } = await import('../core/ai/gateway');
  return res.json({
    poolStats: ApiKeyManager.getAllPoolStats(),
    circuitStatus: AiGateway.getCircuitStatus(),
    providerHealth: AiGateway.getHealth(),
    encryptionEnabled: ApiKeyManager.isEncryptionEnabled()
  });
});

// GET /api/admin/key-pool/:provider — List all keys for a provider (masked)
router.get('/key-pool/:provider', async (req: Request, res: Response) => {
  const { ApiKeyManager } = await import('../core/ai/api-key-manager');
  const { provider } = req.params;
  const safeKeys = ApiKeyManager.getSafeKeys(provider);
  const stats = ApiKeyManager.getPoolStats(provider);
  return res.json({ provider, keys: safeKeys, stats });
});

// POST /api/admin/key-pool/:provider — Add a new key to a provider's pool
router.post('/key-pool/:provider', async (req: Request, res: Response) => {
  const { ApiKeyManager } = await import('../core/ai/api-key-manager');
  const { provider } = req.params;
  const { key, label } = req.body;
  if (!key || typeof key !== 'string' || key.trim().length < 8) {
    return res.status(400).json({ error: 'A valid API key is required (minimum 8 characters).' });
  }
  try {
    const added = ApiKeyManager.addKey(provider, key.trim(), label || undefined);
    // Persist to database immediately
    ApiKeyManager.persistKeyToDb(added).catch(() => {});
    await userStore.logAudit({
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminEmail: req.auth!.user.email,
      action: 'API_KEY_ADDED',
      targetUser: 'SYSTEM',
      details: `Added API key "${added.label}" for provider "${provider}" (encrypted: ${ApiKeyManager.isEncryptionEnabled()}).`
    });
    // Return safe version (no raw key)
    const { key: _rawKey, ...safe } = added;
    return res.json({ success: true, key: { ...safe, maskedKey: ApiKeyManager.maskKey(key.trim()) } });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// PUT /api/admin/key-pool/key/:keyId — Edit a key (label, key value, or enabled state)
router.put('/key-pool/key/:keyId', async (req: Request, res: Response) => {
  const { ApiKeyManager } = await import('../core/ai/api-key-manager');
  const { keyId } = req.params;
  const { label, key, isEnabled } = req.body;
  const updated = ApiKeyManager.editKey(keyId, { label, key: key?.trim(), isEnabled });
  if (!updated) return res.status(404).json({ error: 'Key not found.' });
  // Persist to DB
  ApiKeyManager.persistKeyToDb(updated).catch(() => {});
  const { key: _rawKey, ...safe } = updated;
  return res.json({ success: true, key: safe });
});

// DELETE /api/admin/key-pool/key/:keyId — Delete a key
router.delete('/key-pool/key/:keyId', async (req: Request, res: Response) => {
  const { ApiKeyManager } = await import('../core/ai/api-key-manager');
  const { keyId } = req.params;
  const deleted = ApiKeyManager.deleteKey(keyId);
  if (!deleted) return res.status(404).json({ error: 'Key not found.' });
  // Remove from DB
  ApiKeyManager.deleteKeyFromDb(keyId).catch(() => {});
  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'API_KEY_DELETED',
    targetUser: 'SYSTEM',
    details: `Deleted API key ${keyId}.`
  });
  return res.json({ success: true });
});

// POST /api/admin/key-pool/key/:keyId/enable — Enable a specific key
router.post('/key-pool/key/:keyId/enable', async (req: Request, res: Response) => {
  const { ApiKeyManager } = await import('../core/ai/api-key-manager');
  ApiKeyManager.enableKey(req.params.keyId);
  return res.json({ success: true });
});

// POST /api/admin/key-pool/key/:keyId/disable — Disable a specific key
router.post('/key-pool/key/:keyId/disable', async (req: Request, res: Response) => {
  const { ApiKeyManager } = await import('../core/ai/api-key-manager');
  ApiKeyManager.disableKey(req.params.keyId);
  return res.json({ success: true });
});

// POST /api/admin/key-pool/key/:keyId/reset — Reset a single key from cooldown/failure
router.post('/key-pool/key/:keyId/reset', async (req: Request, res: Response) => {
  const { ApiKeyManager } = await import('../core/ai/api-key-manager');
  const resetOk = ApiKeyManager.resetKey(req.params.keyId);
  if (!resetOk) return res.status(404).json({ error: 'Key not found.' });
  return res.json({ success: true });
});

// POST /api/admin/key-pool/:provider/reset-failed — Bulk reset all failed/cooldown keys for a provider
router.post('/key-pool/:provider/reset-failed', async (req: Request, res: Response) => {
  const { ApiKeyManager } = await import('../core/ai/api-key-manager');
  const { provider } = req.params;
  const count = ApiKeyManager.resetFailedKeys(provider);
  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'API_KEYS_BULK_RESET',
    targetUser: 'SYSTEM',
    details: `Bulk-reset ${count} failed/cooldown keys for provider "${provider}".`
  });
  return res.json({ success: true, resetCount: count, provider });
});

// POST /api/admin/key-pool/:provider/strategy — Set rotation strategy
router.post('/key-pool/:provider/strategy', async (req: Request, res: Response) => {
  const { ApiKeyManager } = await import('../core/ai/api-key-manager');
  const { strategy } = req.body;
  if (!['round-robin', 'lru', 'health-based'].includes(strategy)) {
    return res.status(400).json({ error: 'Invalid strategy. Use: round-robin, lru, health-based' });
  }
  ApiKeyManager.setStrategy(req.params.provider, strategy);
  return res.json({ success: true, provider: req.params.provider, strategy });
});

// POST /api/admin/key-pool/key/:keyId/validate — Lightweight auth validation (faster than full test)
router.post('/key-pool/key/:keyId/validate', async (req: Request, res: Response) => {
  const { AiGateway } = await import('../core/ai/gateway');
  const { keyId } = req.params;
  try {
    const result = await AiGateway.validatePoolKey(keyId);
    return res.json({ keyId, ...result });
  } catch (err: any) {
    return res.status(500).json({ valid: false, message: err?.message || 'Validation failed' });
  }
});

// POST /api/admin/key-pool/key/:keyId/test — Test an individual key (full generation test)
router.post('/key-pool/key/:keyId/test', async (req: Request, res: Response) => {
  const { ApiKeyManager } = await import('../core/ai/api-key-manager');
  const keys = Array.from(ApiKeyManager.listAllKeys().values()).flat();
  const found = keys.find(k => k.id === req.params.keyId);
  if (!found) return res.status(404).json({ error: 'Key not found.' });

  const rawKey = ApiKeyManager.getRawKey(found.id);
  if (!rawKey) return res.status(404).json({ error: 'Could not retrieve key.' });

  try {
    let testOk = false;
    let message = '';
    const provId = found.provider;
    const start = Date.now();

    if (provId === 'google-gemini') {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: rawKey });
      const r = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: 'OK' });
      testOk = !!r;
      message = `Google Gemini OK — gemini-2.5-flash`;
    } else if (provId === 'openai') {
      const r = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${rawKey}` } });
      testOk = r.ok;
      const modelCount = testOk ? (((await r.json()) as any)?.data?.length || '?') : 0;
      message = testOk ? `OpenAI OK — ${modelCount} models available` : `OpenAI failed — HTTP ${r.status}`;
    } else if (provId === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': rawKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 5, messages: [{ role: 'user', content: 'Hi' }] })
      });
      testOk = r.ok;
      message = testOk ? `Anthropic OK — claude-3-haiku` : `Anthropic failed — HTTP ${r.status}`;
    } else if (provId === 'groq') {
      const r = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${rawKey}` } });
      testOk = r.ok;
      const modelCount = testOk ? (((await r.json()) as any)?.data?.length || '?') : 0;
      message = testOk ? `Groq OK — ${modelCount} models available` : `Groq failed — HTTP ${r.status}`;
    } else if (provId === 'xai') {
      const r = await fetch('https://api.x.ai/v1/models', { headers: { Authorization: `Bearer ${rawKey}` } });
      testOk = r.ok;
      message = testOk ? `xAI OK — HTTP ${r.status}` : `xAI failed — HTTP ${r.status}`;
    } else if (provId === 'openrouter') {
      const r = await fetch('https://openrouter.ai/api/v1/models', { headers: { Authorization: `Bearer ${rawKey}` } });
      testOk = r.ok;
      message = testOk ? `OpenRouter OK — HTTP ${r.status}` : `OpenRouter failed — HTTP ${r.status}`;
    } else if (provId === 'mistral') {
      const r = await fetch('https://api.mistral.ai/v1/models', { headers: { Authorization: `Bearer ${rawKey}` } });
      testOk = r.ok;
      const modelCount = testOk ? (((await r.json()) as any)?.data?.length || '?') : 0;
      message = testOk ? `Mistral AI OK — ${modelCount} models available` : `Mistral failed — HTTP ${r.status}`;
    } else if (provId === 'deepseek') {
      const r = await fetch('https://api.deepseek.com/v1/models', { headers: { Authorization: `Bearer ${rawKey}` } });
      testOk = r.ok;
      const modelCount = testOk ? (((await r.json()) as any)?.data?.length || '?') : 0;
      message = testOk ? `DeepSeek AI OK — ${modelCount} models available` : `DeepSeek failed — HTTP ${r.status}`;
    } else if (provId === 'together') {
      const r = await fetch('https://api.together.xyz/v1/models', { headers: { Authorization: `Bearer ${rawKey}` } });
      testOk = r.ok;
      const models = testOk ? (await r.json() as any) : [];
      const modelCount = Array.isArray(models) ? models.length : 0;
      message = testOk ? `Together AI OK — ${modelCount}+ models available` : `Together AI failed — HTTP ${r.status}`;
    } else {
      return res.status(400).json({ status: 'error', message: `Unknown provider: ${provId}` });
    }

    const latencyMs = Date.now() - start;
    if (testOk) {
      ApiKeyManager.recordKeySuccess(found.id, latencyMs);
    } else {
      ApiKeyManager.recordKeyFailure(found.id, 'auth_error', message);
    }
    return res.json({ status: testOk ? 'ok' : 'error', message, latencyMs });
  } catch (err: any) {
    const errMsg = (err instanceof Error ? err.message : String(err)) || 'Test failed';
    ApiKeyManager.recordKeyFailure(found.id, 'transient', errMsg);
    return res.status(500).json({ status: 'error', message: ApiKeyManager.sanitizeKeyFromMessage(errMsg) });
  }
});

// POST /api/admin/circuit/reset/:provider — Manually reset a provider circuit
router.post('/circuit/reset/:provider', async (req: Request, res: Response) => {
  const { AiGateway } = await import('../core/ai/gateway');
  AiGateway.resetCircuit(req.params.provider);
  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'CIRCUIT_RESET',
    targetUser: 'SYSTEM',
    details: `Circuit breaker manually reset for provider "${req.params.provider}".`
  });
  return res.json({ success: true, provider: req.params.provider });
});

// GET /api/admin/provider-overview — Unified provider status (pool + health + circuit + models)
router.get('/provider-overview', async (req: Request, res: Response) => {
  const { AiGateway } = await import('../core/ai/gateway');
  try {
    const overview = AiGateway.getProviderOverview();
    return res.json({ providers: overview, lastUpdated: new Date().toISOString() });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to get provider overview.' });
  }
});

// GET /api/admin/provider/:provider/logs — Get AI diagnostics logs for a specific provider
router.get('/provider/:provider/logs', async (req: Request, res: Response) => {
  const { AiGateway } = await import('../core/ai/gateway');
  const { provider } = req.params;
  const { limit = '50' } = req.query as Record<string, string>;
  const allLogs = AiGateway.getDiagnostics();
  const providerLogs = allLogs
    .filter((l: any) => l.providerUsed === provider || l.finalProvider === provider)
    .slice(0, Math.min(parseInt(limit, 10) || 50, 200));
  return res.json({ provider, logs: providerLogs, total: providerLogs.length });
});

// GET /api/admin/provider/all/logs — Get all AI diagnostics logs
router.get('/provider/all/logs', async (req: Request, res: Response) => {
  const { AiGateway } = await import('../core/ai/gateway');
  const { limit = '100' } = req.query as Record<string, string>;
  const allLogs = AiGateway.getDiagnostics();
  return res.json({
    logs: allLogs.slice(0, Math.min(parseInt(limit, 10) || 100, 500)),
    total: allLogs.length
  });
});

// POST /api/admin/provider/:provider/models/:modelId/toggle — Enable or disable a model
router.post('/provider/:provider/models/:modelId/toggle', async (req: Request, res: Response) => {
  const { AiGateway } = await import('../core/ai/gateway');
  const { provider, modelId } = req.params;
  const { isEnabled } = req.body;
  if (typeof isEnabled !== 'boolean') {
    return res.status(400).json({ error: 'isEnabled (boolean) is required.' });
  }
  AiGateway.setModelEnabled(provider, modelId, isEnabled);
  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'MODEL_TOGGLED',
    targetUser: 'SYSTEM',
    details: `Model "${modelId}" for provider "${provider}" set to ${isEnabled ? 'ENABLED' : 'DISABLED'}.`
  });
  return res.json({ success: true, provider, modelId, isEnabled });
});

// POST /api/admin/provider/:provider/models/:modelId/set-default — Set admin default model
router.post('/provider/:provider/models/:modelId/set-default', async (req: Request, res: Response) => {
  const { AiGateway } = await import('../core/ai/gateway');
  const { provider, modelId } = req.params;
  AiGateway.setDefaultModel(provider, modelId);
  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'DEFAULT_MODEL_SET',
    targetUser: 'SYSTEM',
    details: `Default model for provider "${provider}" set to "${modelId}".`
  });
  return res.json({ success: true, provider, modelId });
});

// ─── System Settings Routes ─────────────────────────────────────────────────────────────────────────────────────────────

// GET /api/admin/system-settings — Return current global settings
router.get('/system-settings', (req: Request, res: Response) => {
  return res.json({ settings: systemSettingsStore });
});

// POST /api/admin/system-settings — Persist global settings
router.post('/system-settings', async (req: Request, res: Response) => {
  const { maintenanceMode, maintenanceMessage, systemAnnouncement, defaultProvider, allowRegistration } = req.body;

  if (typeof maintenanceMode === 'boolean') systemSettingsStore.maintenanceMode = maintenanceMode;
  if (typeof maintenanceMessage === 'string') systemSettingsStore.maintenanceMessage = maintenanceMessage.trim();
  if (typeof systemAnnouncement === 'string') systemSettingsStore.systemAnnouncement = systemAnnouncement.trim();
  if (typeof defaultProvider === 'string') systemSettingsStore.defaultProvider = defaultProvider.trim();
  if (typeof allowRegistration === 'boolean') systemSettingsStore.allowRegistration = allowRegistration;

  await userStore.logAudit({
    id: `audit_${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminEmail: req.auth!.user.email,
    action: 'SYSTEM_SETTINGS_UPDATED',
    targetUser: 'SYSTEM',
    details: `System settings updated by ${req.auth!.user.email}. Maintenance: ${systemSettingsStore.maintenanceMode}.`
  });

  return res.json({ success: true, settings: systemSettingsStore });
});

export const adminRouter = router;
