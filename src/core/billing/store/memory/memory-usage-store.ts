import { UsageRecord } from '../../types';
import { UsageRepository } from '../usage-repository';

export class MemoryUsageStore implements UsageRepository {
  private records: UsageRecord[] = [];

  async recordUsage(usage: UsageRecord): Promise<UsageRecord> {
    this.records.push(usage);
    return usage;
  }

  async getUsageByOrgAndMetric(orgId: string, metric: string, startDate: string, endDate: string): Promise<number> {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    const relevantRecords = this.records.filter(r => 
      r.orgId === orgId && 
      r.metric === metric && 
      new Date(r.timestamp).getTime() >= start && 
      new Date(r.timestamp).getTime() <= end
    );

    return relevantRecords.reduce((sum, record) => sum + record.amount, 0);
  }
}

export const usageStore = new MemoryUsageStore();
