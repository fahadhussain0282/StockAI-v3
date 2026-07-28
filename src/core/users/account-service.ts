import { userStore } from '../auth/user-store';
import { ActivityService } from './activity-service';
import { AuditService } from './audit-service';
import { NotificationService } from './notification-service';
import { validateEmailChange, validatePasswordChange } from './validators';

export class AccountService {
  public static async changeEmail(userId: string, newEmail: string): Promise<{ success: boolean; errors?: string[] }> {
    if (!validateEmailChange(newEmail)) {
      return { success: false, errors: ['Invalid email format.'] };
    }

    const existingUser = await userStore.findUserByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      return { success: false, errors: ['Email is already in use by another account.'] };
    }

    const user = await userStore.findUserById(userId);
    if (!user) return { success: false, errors: ['User not found.'] };

    await userStore.updateUser(userId, { email: newEmail });
    
    await ActivityService.log(userId, 'CHANGE_EMAIL');
    await AuditService.recordEvent(user.email, 'EMAIL_CHANGE', userId, `Changed email to ${newEmail}`);
    await NotificationService.sendInAppNotification(userId, 'alert', 'Email Changed', 'Your account email address was recently updated.');

    return { success: true };
  }

  public static async changePassword(userId: string, newPassword: string): Promise<{ success: boolean; errors?: string[] }> {
    if (!validatePasswordChange(newPassword)) {
      return { success: false, errors: ['Password does not meet complexity requirements.'] };
    }

    const user = await userStore.findUserById(userId);
    if (!user) return { success: false, errors: ['User not found.'] };

    // In a real app, hash the password using bcrypt.
    await userStore.updateUser(userId, { passwordHash: newPassword });

    await ActivityService.log(userId, 'CHANGE_PASSWORD');
    await AuditService.recordEvent(user.email, 'PASSWORD_CHANGE', userId, 'Changed password');
    await NotificationService.sendInAppNotification(userId, 'alert', 'Password Changed', 'Your account password was recently updated. If this was not you, please contact support immediately.');
    
    // Revoke other sessions.
    await userStore.deleteSessionsByUserId(userId);

    return { success: true };
  }

  public static async deactivateAccount(userId: string): Promise<{ success: boolean; errors?: string[] }> {
    const user = await userStore.findUserById(userId);
    if (!user) return { success: false, errors: ['User not found.'] };

    await userStore.updateUser(userId, { status: 'suspended' });
    await userStore.deleteSessionsByUserId(userId);
    
    await ActivityService.log(userId, 'DEACTIVATE_ACCOUNT');
    await AuditService.recordEvent(user.email, 'ACCOUNT_DEACTIVATED', userId, 'User deactivated their own account');

    return { success: true };
  }
}
