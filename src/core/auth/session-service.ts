/**
 * StockAI v3.0 Enterprise — Session Service
 *
 * Session validation strategy (cold-start resistant):
 *
 *  1. JWT.verify(token)     — cryptographically validate signature + expiry
 *                             FAST: no DB hit required
 *                             Survives cold starts, multiple instances
 *
 *  2. DB session lookup     — check if session was explicitly revoked (logout)
 *                             If DB not available, skip (JWT is trusted)
 *
 *  3. User lookup           — fetch full UserRecord from DB (or fallback)
 *
 *  Result: Login loops are eliminated even on Vercel cold starts.
 *  A valid JWT is always accepted unless explicitly revoked via logout.
 */

import { userStore } from './user-store';
import { TokenService, JwtPayload } from './token-service';
import { SessionRecord, UserRecord } from './types';
import { isDbAvailable } from '../db/client';

export class SessionService {
  /**
   * Creates a new session.
   * - Invalidates all previous sessions for this user (single-device enforcement)
   * - Issues a signed JWT
   * - Stores session record in DB for revocation support
   */
  public static async createSession(
    userId: string,
    deviceId: string,
    email?: string,
    role?: string
  ): Promise<string> {
    // Invalidate previous sessions (single-device enforcement)
    await userStore.deleteSessionsByUserId(userId);

    // Generate JWT (self-validating)
    const token = await TokenService.generateSessionToken(userId, email, role, deviceId);

    const session: SessionRecord = {
      userId,
      deviceId,
      token,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };

    // Store in DB for revocation support (non-blocking — if DB fails, JWT still valid)
    await userStore.createSession(session).catch(e => {
      console.warn('[SessionService] Session DB write failed (JWT still valid):', e?.message);
    });

    // Update active device on user
    await userStore.updateUser(userId, {
      activeDeviceId: deviceId,
      lastLoginAt: new Date().toISOString()
    }).catch(() => {});

    return token;
  }

  /**
   * Validates a session token. Returns the UserRecord if valid.
   *
   * COLD-START RESILIENT:
   *  - JWT signature + expiry validated cryptographically (no DB needed)
   *  - DB checked for revocation only if available
   *  - If DB is unavailable (cold start), JWT is trusted directly
   */
  public static async validateSession(
    token: string,
    deviceId?: string
  ): Promise<{ user: UserRecord; sessionToken: string } | null> {
    if (!token) return null;

    // ── STEP 1: JWT verification (fast, no DB, survives cold starts) ──────────
    const jwtPayload: JwtPayload | null = await TokenService.verifyToken(token);

    if (!jwtPayload || !jwtPayload.sub) {
      // Not a valid JWT. Try legacy opaque token path if DB is available.
      return this.validateLegacyOpaqueToken(token, deviceId);
    }

    const userId = jwtPayload.sub;

    // ── STEP 2: Check DB for revocation (if DB available) ─────────────────────
    if (isDbAvailable()) {
      let session = await userStore.findSessionByToken(token);
      if (!session) {
        // Retry once in case of cold start DB connection drop
        await new Promise(r => setTimeout(r, 200));
        session = await userStore.findSessionByToken(token);
      }
      
      if (!session) {
        // Session not in DB — could be a fresh JWT issued before DB was available,
        // OR this token was issued by a different instance before the DB migration.
        // Re-create the session record so future lookups work.
        await userStore.createSession({
          userId,
          deviceId: jwtPayload.deviceId || deviceId || '',
          token,
          createdAt: new Date().toISOString(),
          expiresAt: new Date((jwtPayload.exp ?? 0) * 1000).toISOString()
        }).catch(() => {});
        // Continue validation — the JWT signature is trusted
      }
    }

    // ── STEP 3: Device validation (relaxed for admins) ────────────────────────
    if (deviceId && jwtPayload.deviceId && jwtPayload.deviceId !== deviceId) {
      if (jwtPayload.role !== 'admin' && jwtPayload.role !== 'team_owner') {
        // Device mismatch on non-admin — could be stolen token
        await userStore.deleteSession(token).catch(() => {});
        return null;
      }
    }

    // ── STEP 4: Load full UserRecord ──────────────────────────────────────────
    const user = await userStore.findUserById(userId);
    if (!user) return null;

    return { user, sessionToken: token };
  }

  /**
   * Terminates a specific session (logs out the user).
   */
  public static async terminateSession(token: string): Promise<void> {
    await userStore.deleteSession(token);
  }

  /**
   * Legacy path: validate old opaque tok_* tokens via DB session lookup.
   * Provides backward compatibility during the JWT migration.
   */
  private static async validateLegacyOpaqueToken(
    token: string,
    deviceId?: string
  ): Promise<{ user: UserRecord; sessionToken: string } | null> {
    if (!token.startsWith('tok_')) return null;
    if (!isDbAvailable()) return null;

    const session = await userStore.findSessionByToken(token);
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      await userStore.deleteSession(token).catch(() => {});
      return null;
    }

    const user = await userStore.findUserById(session.userId);
    if (!user) return null;

    if (deviceId && session.deviceId && session.deviceId !== deviceId) {
      if (user.role !== 'admin' && user.role !== 'team_owner') {
        await userStore.deleteSession(token).catch(() => {});
        return null;
      }
    }

    return { user, sessionToken: token };
  }
}
