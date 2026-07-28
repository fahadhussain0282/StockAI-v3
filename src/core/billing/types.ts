export type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED' | 'INCOMPLETE';

export interface PlanLimits {
  monthlyCredits: number;
  apiLimits: number;
  teamLimits: number;
  workspaceLimits: number;
  storageLimitsMB: number;
}

export interface Plan {
  id: string;
  tier: PlanTier;
  name: string;
  price: number;
  currency: string;
  limits: PlanLimits;
  features: string[];
}

export interface Subscription {
  id: string;
  orgId: string;
  planId: string;
  status: SubscriptionStatus;
  provider: string; // 'stripe', 'paddle', 'manual', etc.
  providerSubscriptionId?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreditLedger {
  id: string;
  orgId: string;
  balance: number;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  orgId: string;
  amount: number; // positive for addition, negative for consumption
  type: 'AI_METADATA' | 'PROMPT' | 'IMAGE_ANALYSIS' | 'TOP_UP' | 'SUBSCRIPTION_RENEWAL';
  description: string;
  timestamp: string;
}

export interface UsageRecord {
  id: string;
  orgId: string;
  metric: 'METADATA_GEN' | 'PROMPT_GEN' | 'UPLOAD' | 'EXPORT' | 'API_CALL' | 'BENCHMARK_RUN' | 'STORAGE';
  amount: number;
  timestamp: string;
}

export interface Invoice {
  id: string;
  orgId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: 'DRAFT' | 'OPEN' | 'PAID' | 'UNCOLLECTIBLE' | 'VOID';
  invoiceUrl?: string;
  pdfUrl?: string;
  createdAt: string;
  paidAt?: string;
}

export interface PaymentMethod {
  id: string;
  orgId: string;
  provider: string;
  providerPaymentMethodId: string;
  type: 'CARD' | 'PAYPAL' | 'BANK_TRANSFER';
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}
