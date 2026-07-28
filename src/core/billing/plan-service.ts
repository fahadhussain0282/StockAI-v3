import { Plan, PlanTier } from './types';
import { DEFAULT_PLANS } from './constants';

export class PlanService {
  public static async getPlan(planId: string): Promise<Plan | null> {
    // In a real database, this queries the Plans table.
    const plans = Object.values(DEFAULT_PLANS);
    return plans.find(p => p.id === planId) || null;
  }

  public static async getPlanByTier(tier: PlanTier): Promise<Plan | null> {
    const plans = Object.values(DEFAULT_PLANS);
    return plans.find(p => p.tier === tier) || null;
  }

  public static async getAllPlans(): Promise<Plan[]> {
    return Object.values(DEFAULT_PLANS);
  }
}
