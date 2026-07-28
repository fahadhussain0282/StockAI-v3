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

    // Enforce 1-device limit dynamically during token validation (Section 8)
    if (deviceId && user.activeDeviceId && user.activeDeviceId !== deviceId) {
      // This means the user logged in elsewhere since this token was issued
      await userStore.deleteSession(token);
      return null;
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
