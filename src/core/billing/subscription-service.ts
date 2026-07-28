import { Subscription } from './types';
import { subscriptionStore } from './store';
import { generateId, emitBillingEvent } from './utils';
import { PlanService } from './plan-service';
import { CreditService } from './credit-service';

export class SubscriptionService {
  public static async getActiveSubscription(orgId: string): Promise<Subscription | null> {
    return subscriptionStore.findByOrgId(orgId);
  }

  public static async createSubscription(orgId: string, planId: string, provider: string, providerSubscriptionId?: string): Promise<{ subscription?: Subscription, errors?: string[] }> {
    const plan = await PlanService.getPlan(planId);
    if (!plan) return { errors: ['Invalid plan ID'] };

    const existing = await this.getActiveSubscription(orgId);
    if (existing && existing.status === 'ACTIVE') {
      return { errors: ['Organization already has an active subscription'] };
    }

    const currentPeriodStart = new Date().toISOString();
    // Simplified: assuming all plans are monthly for now
    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const sub: Subscription = {
      id: generateId('sub'),
      orgId,
      planId,
      status: 'ACTIVE',
      provider,
      providerSubscriptionId,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await subscriptionStore.create(sub);
    emitBillingEvent('SubscriptionCreated', { subscriptionId: sub.id, orgId, planId });

    // Initialize/Top-up credits for the new plan
    await CreditService.topUpCredits(orgId, plan.limits.monthlyCredits, 'SUBSCRIPTION_RENEWAL');

    return { subscription: sub };
  }

  public static async cancelSubscription(orgId: string): Promise<{ success: boolean, errors?: string[] }> {
    const sub = await this.getActiveSubscription(orgId);
    if (!sub) return { success: false, errors: ['No active subscription found'] };

    // In a real app, call Provider.cancelSubscription here
    
    await subscriptionStore.update(sub.id, { cancelAtPeriodEnd: true, status: 'CANCELED' });
    emitBillingEvent('SubscriptionCanceled', { subscriptionId: sub.id, orgId });

    return { success: true };
  }
}
