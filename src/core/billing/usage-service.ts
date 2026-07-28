import { UsageRecord } from './types';
import { usageStore } from './store';
import { generateId } from './utils';

export class UsageService {
  public static async recordUsage(orgId: string, metric: UsageRecord['metric'], amount: number = 1): Promise<void> {
    const record: UsageRecord = {
      id: generateId('use'),
      orgId,
      metric,
      amount,
      timestamp: new Date().toISOString()
    };

    await usageStore.recordUsage(record);
  }

  public static async getUsageForPeriod(orgId: string, metric: UsageRecord['metric'], startDate: string, endDate: string): Promise<number> {
    return usageStore.getUsageByOrgAndMetric(orgId, metric, startDate, endDate);
  }
}
