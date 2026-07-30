import { userStore } from './user-store';
import { TokenService } from './token-service';
import { SessionRecord, UserRecord } from './types';

export class SessionService {
  /**
   * Creates a new session and enforces the single-device limit.
   */
  public static async createSession(userId: string, deviceId: string): Promise<string> {
    // 1 Active Device Enforcement: invalidate previous sessions for this user
    await userStore.deleteSessionsByUserId(userId);

    const token = await TokenService.generateSessionToken(userId);
    const session: SessionRecord = {
      userId,
      deviceId,
      token,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };

    await userStore.createSession(session);
    
    // Update active device on user
    await userStore.updateUser(userId, { activeDeviceId: deviceId, lastLoginAt: new Date().toISOString() });

    return token;
  }

  /**
   * Validates a session token. Returns the UserRecord if valid.
   *
   * SESSION PERSISTENCE FIX: We validate the deviceId against the SESSION RECORD (not
   * user.activeDeviceId). This ensures that after browser refresh, the same token+device
   * combination always passes validation. user.activeDeviceId is only used for admin
   * revoke-device operations and should not gate session validation.
   */
  public static async validateSession(token: string, deviceId?: string): Promise<{ user: UserRecord; sessionToken: string } | null> {
    const session = await userStore.findSessionByToken(token);
    if (!session) return null;

    // Check expiration
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      await userStore.deleteSession(token);
      return null;
    }

    const user = await userStore.findUserById(session.userId);
    if (!user) return null;

    // Device validation: compare against the SESSION's registered deviceId (not user.activeDeviceId)
    // This is the key fix for session persistence across browser refreshes.
    // If the device presenting the token doesn't match what the session was created with,
    // it likely means a stolen token or a device switch — revoke for security.
    if (deviceId && session.deviceId && session.deviceId !== deviceId) {
      // Admins bypass device-lock (they may access from admin panel on different device context)
      if (user.role !== 'admin' && user.role !== 'team_owner') {
        await userStore.deleteSession(token);
        return null;
      }
    }

    return { user, sessionToken: token };
  }

  /**
   * Terminates a specific session.
   */
  public static async terminateSession(token: string): Promise<void> {
    await userStore.deleteSession(token);
  }
}
