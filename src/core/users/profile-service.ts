import { userManagementStore } from './user-management-store';
import { UserProfile } from './types';
import { validateProfileUpdate } from './validators';
import { sanitizeString } from './utils';
import { ActivityService } from './activity-service';

export class ProfileService {
  public static async getProfile(userId: string): Promise<UserProfile> {
    let profile = await userManagementStore.getProfile(userId);
    if (!profile) {
      profile = await userManagementStore.createOrUpdateProfile(userId, {});
    }
    return profile;
  }

  public static async updateProfile(userId: string, data: Partial<UserProfile>): Promise<{ profile?: UserProfile; errors?: string[] }> {
    const { valid, errors } = validateProfileUpdate(data);
    if (!valid) {
      return { errors };
    }

    const sanitizedData: Partial<UserProfile> = { ...data };
    if (sanitizedData.displayName) sanitizedData.displayName = sanitizeString(sanitizedData.displayName);
    if (sanitizedData.bio) sanitizedData.bio = sanitizeString(sanitizedData.bio);

    const updated = await userManagementStore.createOrUpdateProfile(userId, sanitizedData);
    
    await ActivityService.log(userId, 'UPDATE_PROFILE', { fieldsUpdated: Object.keys(sanitizedData) });
    
    return { profile: updated };
  }
}
