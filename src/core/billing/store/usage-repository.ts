import { UsageRecord } from '../types';

export interface UsageRepository {
  recordUsage(usage: UsageRecord): Promise<UsageRecord>;
  getUsageByOrgAndMetric(orgId: string, metric: string, startDate: string, endDate: string): Promise<number>;
}
