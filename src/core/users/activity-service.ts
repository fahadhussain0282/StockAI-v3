import { userManagementStore } from './user-management-store';
import { UserActivity, ActivitySummary } from './types';
import { generateId } from './utils';

export class ActivityService {
  public static async log(userId: string, action: string, metadata?: any, reqInfo?: { ip?: string, userAgent?: string }): Promise<void> {
    const activity: UserActivity = {
      id: generateId('act'),
      userId,
      action,
      metadata,
      timestamp: new Date().toISOString(),
      ipAddress: reqInfo?.ip,
      userAgent: reqInfo?.userAgent
    };
    
    await userManagementStore.logActivity(activity);
  }

  public static async getRecentActivity(userId: string, limit: number = 20): Promise<UserActivity[]> {
    return userManagementStore.getActivities(userId, limit);
  }

  public static async getSummary(userId: string): Promise<ActivitySummary> {
    return userManagementStore.getActivitySummary(userId);
  }
}
