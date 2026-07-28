import { Plan } from './types';

export const BILLING_CONSTANTS = {
  DEFAULT_CURRENCY: 'usd',
  GRACE_PERIOD_DAYS: 3,
  TRIAL_PERIOD_DAYS: 14,
};

// Hardcoded for memory mock, typically these would live in DB or Stripe Products
export const DEFAULT_PLANS: Record<string, Plan> = {
  free: {
    id: 'plan_free',
    tier: 'FREE',
    name: 'Free Plan',
    price: 0,
    currency: 'usd',
    limits: {
      monthlyCredits: 100,
      apiLimits: 1000,
      teamLimits: 3,
      workspaceLimits: 5,
      storageLimitsMB: 500
    },
    features: ['Basic Metadata', 'Standard Support']
  },
  pro: {
    id: 'plan_pro',
    tier: 'PRO',
    name: 'Pro Plan',
    price: 2900, // in cents
    currency: 'usd',
    limits: {
      monthlyCredits: 5000,
      apiLimits: 50000,
      teamLimits: 25,
      workspaceLimits: 99999,
      storageLimitsMB: 50000
    },
    features: ['Advanced Metadata', 'Priority Support', 'API Access']
  },
  enterprise: {
    id: 'plan_enterprise',
    tier: 'ENTERPRISE',
    name: 'Enterprise Plan',
    price: 9900,
    currency: 'usd',
    limits: {
      monthlyCredits: 999999,
      apiLimits: 999999,
      teamLimits: 999999,
      workspaceLimits: 999999,
      storageLimitsMB: 999999
    },
    features: ['Unlimited Everything', 'Dedicated Success Manager', 'SLA']
  }
};
