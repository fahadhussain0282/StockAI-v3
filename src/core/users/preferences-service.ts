import { userManagementStore } from './user-management-store';
import { UserPreferences } from './types';
import { validatePreferencesUpdate } from './validators';
import { ActivityService } from './activity-service';

export class PreferencesService {
  public static async getPreferences(userId: string): Promise<UserPreferences> {
    return userManagementStore.getPreferences(userId);
  }

  public static async updatePreferences(userId: string, data: Partial<UserPreferences>): Promise<{ preferences?: UserPreferences; errors?: string[] }> {
    const { valid, errors } = validatePreferencesUpdate(data);
    if (!valid) {
      return { errors };
    }

    const updated = await userManagementStore.updatePreferences(userId, data);
    
    await ActivityService.log(userId, 'UPDATE_PREFERENCES', { fieldsUpdated: Object.keys(data) });
    
    return { preferences: updated };
  }
}
