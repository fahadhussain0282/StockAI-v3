/**
 * StockAI v3.0 Enterprise — JWT Token Service
 *
 * Generates and verifies HS256 JWT tokens.
 * Tokens are self-validating — the server does NOT need a session store
 * to verify a token's signature, expiry, and integrity.
 *
 * JWT payload:
 *   sub      = userId
 *   email    = user email (for fast display without DB lookup)
 *   role     = user role (admin | contributor | ...)
 *   deviceId = device this session was created on
 *   iat      = issued at (epoch seconds)
 *   exp      = expiry (epoch seconds, 30 days from issuance)
 *
 * Security:
 *   - HS256 with JWT_SECRET (min 32 chars, ideally 64 hex chars)
 *   - If JWT_SECRET is not set, falls back to a random per-process secret
 *     (safe for development, NOT suitable for production multi-instance)
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ─── JWT Secret ───────────────────────────────────────────────────────────────

// Fallback secret: random per process start (development only)
// In production, JWT_SECRET must be set in environment variables
const FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[StockAI Auth] CRITICAL: JWT_SECRET is not set or too short (< 32 chars).\n' +
        '  Sessions will NOT persist across Vercel instances.\n' +
        '  Set JWT_SECRET in your Vercel environment variables immediately.'
      );
    } else {
      console.warn('[StockAI Auth] JWT_SECRET not set — using random per-process key (dev only).');
    }
    return FALLBACK_SECRET;
  }
  return secret.trim();
}

// ─── Token Payload ────────────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;      // userId
  email: string;
  role: string;
  deviceId: string;
  iat?: number;
  exp?: number;
}

// ─── Token Service ────────────────────────────────────────────────────────────

export class TokenService {
  /**
   * Generates a signed JWT session token.
   * Expires in 30 days.
   */
  public static async generateSessionToken(
    userId: string,
    email?: string,
    role?: string,
    deviceId?: string
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: userId,
      email: email ?? '',
      role: role ?? 'contributor',
      deviceId: deviceId ?? '',
    };

    return jwt.sign(payload, getJwtSecret(), {
      algorithm: 'HS256',
      expiresIn: '30d',
    });
  }

  /**
   * Verifies and decodes a JWT token.
   * Returns the payload if valid, null if invalid or expired.
   */
  public static async verifyToken(token: string): Promise<JwtPayload | null> {
    try {
      const decoded = jwt.verify(token, getJwtSecret(), {
        algorithms: ['HS256'],
      }) as JwtPayload;
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Validates token format only (legacy opaque token or JWT).
   * Does NOT verify JWT signature — use verifyToken() for full validation.
   */
  public static async validateTokenFormat(token: string): Promise<boolean> {
    if (!token || token.length < 10) return false;
    // Accept both JWT format and legacy opaque tokens (tok_*)
    return token.startsWith('tok_') || token.split('.').length === 3;
  }

  /**
   * Extracts userId from a JWT without verification.
   * Use ONLY for logging/debugging — never for auth decisions.
   */
  public static extractUserIdUnsafe(token: string): string | null {
    try {
      const decoded = jwt.decode(token) as JwtPayload | null;
      return decoded?.sub ?? null;
    } catch {
      return null;
    }
  }
}
