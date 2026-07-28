import { userManagementStore } from './user-management-store';
import { AuditLog } from '../auth/types';
import { generateId } from './utils';

export class AuditService {
  public static async recordEvent(adminEmail: string, action: string, targetUser: string, details: string): Promise<void> {
    const log: AuditLog = {
      id: generateId('audit'),
      timestamp: new Date().toISOString(),
      adminEmail,
      action,
      targetUser,
      details
    };
    
    await userManagementStore.logAudit(log);
  }
}
