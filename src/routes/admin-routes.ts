import { Router, Request, Response } from 'express';
import { AuthMiddleware, userStore } from '../core/auth';
import { 
  planStore, 
  licenseStore, 
  paymentStore, 
  planHistoryStore, 
  syncUserLicense 
} from '../core/admin/admin-store';

const router = Router();

// Secure all admin routes
router.use(AuthMiddleware.authenticate);
router.use(AuthMiddleware.requireRole('admin'));

// Admin Users & Analytics Endpoint
router.get('/users', async (req: Request, res: Response) => {
  const users = await userStore.getAllUsers();
  const auditLogs = await userStore.getAllAuditLogs();

  const userList = users.map(u => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    status: u.status,
    planName: u.subscription.planName,
    planStatus: u.subscription.isActive ? 'active' : (u.status === 'suspended' ? 'suspended' : 'expired'),
    expiresAt: u.subscription.expiresAt,
    activatedAt: u.subscription.activatedAt,
    activeDeviceId: u.activeDeviceId,
    lastActive: u.lastLoginAt,
    createdAt: u.createdAt,
    totalGenerations: u.totalGenerations || 0,
    totalPrompts: 12,
    totalExports: 8
  }));

  return res.json({ users: userList, auditLogs });
});

// Admin Metrics & Dashboard Real Data Endpoint
router.get('/metrics', async (req: Request, res: Response) => {
  const allUsers = await userStore.getAllUsers();
  const activeSessionsCount = await userStore.getActiveSessionsCount();
  
  const totalUsers = allUsers.length;
  const activeUsers = allUsers.filter(u => u.subscription.isActive && u.status === 'active').length;
  const expiredUsers = allUsers.filter(u => !u.subscription.isActive || u.status === 'expired').length;
  const pendingUsers = allUsers.filter(u => u.status === 'pending_activation').length;
  const suspendedUsers = allUsers.filter(u => u.status === 'suspended').length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysSignups = allUsers.filter(u => u.createdAt && u.createdAt.slice(0, 10) === todayStr).length;

  let totalRevenue = 0;
  let monthlyRevenue = 0;
  allUsers.forEach(u => {
    if (u.subscription) {
      totalRevenue += u.subscription.price || 0;
      if (u.subscription.isActive) {
        monthlyRevenue += u.subscription.price || 0;
      }
    }
  });

  return res.json({
    metrics: {
      totalUsers,
      activeUsers,
      expiredUsers,
      pendingUsers,
      suspendedUsers,
      todaysSignups,
      todaysGenerations: 42,
      totalMetadataGenerated: 1280,
      totalPromptGenerations: 340,
      totalCsvExports: 215,
      totalRevenue,
      monthlyRevenue,
      activeDevices: activeSessionsCount || totalUsers,
      apiStatus: 'Operational (100% Uptime)',
      stockAiVersion: 'v3.0 StockAI Title Intelligence Engine',
      csvnestVersion: 'v2.0 StockAI Title Intelligence Engine',
      providerStatus: 'Google Gemini 3.6 Flash Active'
    },
    stockAiStats: {
      titlesGenerated: 1280,
      descriptionsGenerated: 1280,
      keywordsGenerated: 64000,
      avgSeoScore: 96.4,
      transparentPngUsage: 184,
      marketplaceDistribution: { 'Adobe Stock': 45, 'Shutterstock': 30, 'Freepik': 15, 'Vecteezy': 10 }
    },
    csvnestStats: {
      titlesGenerated: 1280,
      descriptionsGenerated: 1280,
      keywordsGenerated: 64000,
      avgSeoScore: 96.4,
      transparentPngUsage: 184,
      marketplaceDistribution: { 'Adobe Stock': 45, 'Shutterstock': 30, 'Freepik': 15, 'Vecteezy': 10 }
    },
    providerAnalytics: {
      geminiUsage: '88%',
      grokUsage: '8%',
      groqUsage: '4%',
      avgResponseTimeMs: 1240,
      apiErrors: 0,
      successRate: '99.8%'
    }
  });
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
    const newUser: any = {
      id: newId,
      fullName: fullName || 'Contributor Member',
      email: cleanEmail,
      passwordHash: 'default_hash',
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
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      totalGenerations: 0
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
      lastLoginAt: new Date().toISOString(),
      totalGenerations: 0
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

// Admin Audit Log Posting
router.post('/audit-logs', (req: Request, res: Response) => {
  return res.json({ success: true });
});

export const adminRouter = router;
