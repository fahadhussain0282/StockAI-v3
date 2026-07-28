import { userManagementStore } from './user-management-store';
import { NotificationRecord } from './types';
import { generateId } from './utils';

export class NotificationService {
  public static async sendInAppNotification(userId: string, type: NotificationRecord['type'], title: string, message: string, actionUrl?: string): Promise<void> {
    const notification: NotificationRecord = {
      id: generateId('notif'),
      userId,
      type,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString(),
      actionUrl
    };
    
    await userManagementStore.addNotification(notification);
  }

  public static async getNotifications(userId: string, unreadOnly: boolean = false): Promise<NotificationRecord[]> {
    return userManagementStore.getNotifications(userId, unreadOnly);
  }

  public static async markAsRead(userId: string, notificationId: string): Promise<void> {
    await userManagementStore.markNotificationAsRead(userId, notificationId);
  }
}
