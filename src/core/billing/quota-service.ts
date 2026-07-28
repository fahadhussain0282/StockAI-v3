import { SubscriptionService } from './subscription-service';
import { PlanService } from './plan-service';

export class QuotaService {
  public static async canPerformAction(orgId: string, actionType: 'CREATE_TEAM' | 'CREATE_WORKSPACE' | 'API_CALL', currentCount: number): Promise<boolean> {
    const sub = await SubscriptionService.getActiveSubscription(orgId);
    // If no active subscription, default to free plan limits
    const planId = sub?.status === 'ACTIVE' ? sub.planId : 'plan_free';
    
    const plan = await PlanService.getPlan(planId);
    if (!plan) return false;

    switch (actionType) {
      case 'CREATE_TEAM':
        return currentCount < plan.limits.teamLimits;
      case 'CREATE_WORKSPACE':
        return currentCount < plan.limits.workspaceLimits;
      case 'API_CALL':
        return currentCount < plan.limits.apiLimits;
      default:
        return false;
    }
  }
}
