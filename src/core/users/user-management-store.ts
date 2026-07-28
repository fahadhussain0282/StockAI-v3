import { UserProfile, UserPreferences, UserActivity, NotificationRecord, ActivitySummary } from './types';
import { DEFAULT_PREFERENCES } from './constants';
import { AuditLog } from '../auth/types';

// In-Memory store mimicking DB for enterprise user management
class UserManagementStoreImpl {
  private profiles: Map<string, UserProfile> = new Map();
  private preferences: Map<string, UserPreferences> = new Map();
  private activities: Map<string, UserActivity[]> = new Map();
  private notifications: Map<string, NotificationRecord[]> = new Map();
  private auditLogs: AuditLog[] = [];

  // Profile Methods
  public async getProfile(userId: string): Promise<UserProfile | null> {
    return this.profiles.get(userId) || null;
  }

  public async createOrUpdateProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    const existing = this.profiles.get(userId) || {
      userId,
      displayName: '',
      username: `user_${userId.substring(0, 5)}`,
      avatarUrl: null,
      bio: '',
      country: '',
      timezone: 'UTC',
      language: 'en-US',
      company: '',
      website: '',
      socialLinks: {},
      profileVisibility: 'public'
    };
    
    const updated = { ...existing, ...profileData };
    this.profiles.set(userId, updated);
    return updated;
  }

  // Preferences Methods
  public async getPreferences(userId: string): Promise<UserPreferences> {
    return this.preferences.get(userId) || { userId, ...DEFAULT_PREFERENCES };
  }

  public async updatePreferences(userId: string, prefsData: Partial<UserPreferences>): Promise<UserPreferences> {
    const existing = await this.getPreferences(userId);
    const updated = { ...existing, ...prefsData };
    this.preferences.set(userId, updated);
    return updated;
  }

  // Activity Methods
  public async logActivity(activity: UserActivity): Promise<void> {
    const userActivities = this.activities.get(activity.userId) || [];
    userActivities.unshift(activity); // Add to beginning
    this.activities.set(activity.userId, userActivities);
  }

  public async getActivities(userId: string, limit: number = 50): Promise<UserActivity[]> {
    const userActivities = this.activities.get(userId) || [];
    return userActivities.slice(0, limit);
  }

  public async getActivitySummary(userId: string): Promise<ActivitySummary> {
    const userActivities = this.activities.get(userId) || [];
    let uploads = 0;
    let exports = 0;
    let prompts = 0;
    let benchmarks = 0;
    let lastLogin = null;

    for (const act of userActivities) {
      if (act.action === 'LOGIN' && !lastLogin) lastLogin = act.timestamp;
      if (act.action === 'UPLOAD') uploads++;
      if (act.action === 'EXPORT') exports++;
      if (act.action === 'GENERATE_PROMPT') prompts++;
      if (act.action === 'RUN_BENCHMARK') benchmarks++;
    }

    return {
      lastLogin,
      totalUploads: uploads,
      totalExports: exports,
      totalPromptsGenerated: prompts,
      totalBenchmarkRuns: benchmarks
    };
  }

  // Notification Methods
  public async addNotification(notification: NotificationRecord): Promise<void> {
    const userNotifs = this.notifications.get(notification.userId) || [];
    userNotifs.unshift(notification);
    this.notifications.set(notification.userId, userNotifs);
  }

  public async getNotifications(userId: string, unreadOnly: boolean = false): Promise<NotificationRecord[]> {
    const userNotifs = this.notifications.get(userId) || [];
    if (unreadOnly) {
      return userNotifs.filter(n => !n.read);
    }
    return userNotifs;
  }

  public async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    const userNotifs = this.notifications.get(userId) || [];
    const notif = userNotifs.find(n => n.id === notificationId);
    if (notif) {
      notif.read = true;
    }
  }

  // Audit Methods (Dedicated to User Actions)
  public async logAudit(log: AuditLog): Promise<void> {
    this.auditLogs.unshift(log);
  }
}

export const userManagementStore = new UserManagementStoreImpl();
