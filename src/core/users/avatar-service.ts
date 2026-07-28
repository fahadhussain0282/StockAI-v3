import { userManagementStore } from './user-management-store';
import { AvatarUploadResult } from './types';
import { USER_CONSTANTS } from './constants';
import { ActivityService } from './activity-service';

export class AvatarService {
  public static async uploadAvatar(userId: string, fileData: string, mimeType: string, sizeBytes: number): Promise<{ result?: AvatarUploadResult; errors?: string[] }> {
    const errors: string[] = [];
    
    const sizeMb = sizeBytes / (1024 * 1024);
    if (sizeMb > USER_CONSTANTS.AVATAR_MAX_SIZE_MB) {
      errors.push(`Avatar size exceeds maximum limit of ${USER_CONSTANTS.AVATAR_MAX_SIZE_MB}MB.`);
    }

    if (!USER_CONSTANTS.AVATAR_ALLOWED_FORMATS.includes(mimeType)) {
      errors.push('Invalid image format. Allowed formats are JPEG, PNG, WEBP.');
    }

    if (errors.length > 0) {
      return { errors };
    }

    // In a real app, upload fileData (base64 or buffer) to S3/Cloud Storage here.
    // For now, we store the base64 URL directly in the in-memory profile.
    
    const avatarUrl = `data:${mimeType};base64,${fileData}`;
    
    await userManagementStore.createOrUpdateProfile(userId, { avatarUrl });
    
    await ActivityService.log(userId, 'UPDATE_AVATAR', { format: mimeType, size: sizeBytes });

    return {
      result: {
        url: avatarUrl,
        size: sizeBytes,
        format: mimeType
      }
    };
  }

  public static async removeAvatar(userId: string): Promise<void> {
    await userManagementStore.createOrUpdateProfile(userId, { avatarUrl: null });
    await ActivityService.log(userId, 'REMOVE_AVATAR');
  }
}
