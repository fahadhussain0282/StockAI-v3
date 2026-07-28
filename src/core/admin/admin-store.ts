import { userStore } from '../auth';

export interface ServerPlanRecord {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  features: string[];
  visibility: 'public' | 'hidden' | 'custom';
  status: 'active' | 'archived';
  isDefault?: boolean;
  sortOrder: number;
}

export const planStore: Record<string, ServerPlanRecord> = {
  'plan_1m': {
    id: 'plan_1m',
    name: '1 Month',
    price: 300,
    currency: 'PKR',
    durationDays: 30,
    features: ['StockAI Intelligence', 'Metadata Generator', 'Prompt Generator', 'Transparent PNG', 'CSV Export', 'Single Device'],
    visibility: 'public',
    status: 'active',
    isDefault: true,
    sortOrder: 1
  },
  'plan_6m': {
    id: 'plan_6m',
    name: '6 Months',
    price: 2000,
    currency: 'PKR',
    durationDays: 180,
    features: ['All Premium Features', 'Transparent PNG', 'Marketplace Export', 'Priority Vision Processing', 'StockAI Intelligence', 'Single Device'],
    visibility: 'public',
    status: 'active',
    isDefault: false,
    sortOrder: 2
  },
  'plan_agency': {
    id: 'plan_agency',
    name: 'Agency Enterprise',
    price: 5000,
    currency: 'PKR',
    durationDays: 365,
    features: ['Unlimited Generations', 'Priority Vision Processing', 'Dedicated Account Manager', 'Multi-Device License (Custom)'],
    visibility: 'hidden',
    status: 'active',
    isDefault: false,
    sortOrder: 3
  }
};

export interface ServerLicenseRecord {
  id: string;
  userId: string;
  userEmail: string;
  planId: string;
  planName: string;
  activationDate: string;
  expirationDate: string;
  status: 'pending' | 'active' | 'expired' | 'suspended' | 'cancelled' | 'disabled';
  allowedDevices: number;
  deviceFingerprint: string;
  createdBy: string;
  lastUpdated: string;
}

export const licenseStore: Record<string, ServerLicenseRecord> = {
  'lic_admin_1': {
    id: 'lic_admin_1',
    userId: 'usr_admin_1',
    userEmail: 'fahadhussain0282@gmail.com',
    planId: 'plan_1m',
    planName: '1 Month',
    activationDate: new Date().toISOString(),
    expirationDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    status: 'active',
    allowedDevices: 1,
    deviceFingerprint: 'dev_admin_01',
    createdBy: 'SYSTEM',
    lastUpdated: new Date().toISOString()
  },
  'lic_admin_2': {
    id: 'lic_admin_2',
    userId: 'usr_admin_2',
    userEmail: 'adobeicon99@gmail.com',
    planId: 'plan_6m',
    planName: '6 Months',
    activationDate: new Date().toISOString(),
    expirationDate: new Date(Date.now() + 180 * 86400000).toISOString(),
    status: 'active',
    allowedDevices: 1,
    deviceFingerprint: 'dev_admin_02',
    createdBy: 'SYSTEM',
    lastUpdated: new Date().toISOString()
  }
};

export const paymentStore: Record<string, any> = {};

export interface ServerPlanHistoryEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: 'purchased' | 'activated' | 'renewed' | 'expired' | 'extended' | 'upgraded' | 'downgraded' | 'cancelled' | 'paused' | 'resumed';
  planName: string;
  durationDays: number;
  amount: number;
  performedBy: string;
  timestamp: string;
  paymentRef?: string;
}

export const planHistoryStore: ServerPlanHistoryEntry[] = [
  {
    id: 'hist_init_1',
    userId: 'usr_admin_1',
    userEmail: 'fahadhussain0282@gmail.com',
    action: 'activated',
    planName: '1 Month',
    durationDays: 30,
    amount: 300,
    performedBy: 'SYSTEM',
    timestamp: new Date().toISOString(),
    paymentRef: 'REF-ADMIN-01'
  },
  {
    id: 'hist_init_2',
    userId: 'usr_admin_2',
    userEmail: 'adobeicon99@gmail.com',
    action: 'activated',
    planName: '6 Months',
    durationDays: 180,
    amount: 2000,
    performedBy: 'SYSTEM',
    timestamp: new Date().toISOString(),
    paymentRef: 'REF-ADMIN-02'
  }
];

export const INTERNAL_WHATSAPP_NUMBERS = {
  sales: '923413516882',
  support: '923394377311'
};

export async function syncUserLicense(userId: string) {
  const user = await userStore.findUserById(userId);
  if (!user) return null;

  let license = Object.values(licenseStore).find(l => l.userId === userId);
  const now = new Date().getTime();
  let updated = false;

  if (license) {
    const exp = new Date(license.expirationDate).getTime();
    if (now > exp && license.status === 'active') {
      license.status = 'expired';
      license.lastUpdated = new Date().toISOString();
      user.subscription.isActive = false;
      user.subscription.isExpired = true;
      user.status = 'expired';

      planHistoryStore.unshift({
        id: `hist_exp_${Date.now()}`,
        userId: user.id,
        userEmail: user.email,
        action: 'expired',
        planName: license.planName,
        durationDays: user.subscription.durationDays,
        amount: user.subscription.price,
        performedBy: 'EXPIRATION_ENGINE',
        timestamp: new Date().toISOString()
      });
      updated = true;
    } else if (license.status === 'active' && !user.subscription.isActive) {
      user.subscription.isActive = true;
      user.subscription.isExpired = false;
      if (user.status === 'expired' || user.status === 'pending_activation') {
        user.status = 'active';
      }
      updated = true;
    }
  } else {
    const exp = new Date(user.subscription.expiresAt).getTime();
    if (now > exp && user.subscription.isActive) {
      user.subscription.isActive = false;
      user.subscription.isExpired = true;
      user.status = 'expired';
      updated = true;
    }
  }

  if (updated) {
    await userStore.updateUser(user.id, user);
  }
  return user;
}
