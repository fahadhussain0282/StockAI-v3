import crypto from 'crypto';

export class PasswordService {
  /**
   * Hashes a password using PBKDF2 with SHA-512.
   * This is a production-grade password hashing approach.
   * Format: iterations:salt:hash
   */
  public static async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(32).toString('hex');
    const iterations = 100000;
    const hash = await new Promise<string>((resolve, reject) => {
      crypto.pbkdf2(password, salt, iterations, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey.toString('hex'));
      });
    });
    return `pbkdf2:${iterations}:${salt}:${hash}`;
  }

  public static async verifyPassword(plain: string, storedHash: string): Promise<boolean> {
    if (!storedHash) return false;
    
    // Handle legacy admin seed marker — admins must contact admin panel to reset
    if (storedHash.startsWith('legacy:')) {
      // Admin seeded accounts: password is 'admin123' by default (server-only, never exposed to client)
      return plain === 'admin123';
    }
    // Support legacy plaintext for backwards compat during migration
    if (!storedHash.startsWith('pbkdf2:')) {
      // Legacy: direct comparison (only used for seeded dev users)
      return plain === storedHash;
    }
    const parts = storedHash.split(':');
    if (parts.length !== 4) return false;
    const [, iterStr, salt, hash] = parts;
    const iterations = parseInt(iterStr, 10);
    const derivedKey = await new Promise<string>((resolve, reject) => {
      crypto.pbkdf2(plain, salt, iterations, 64, 'sha512', (err, key) => {
        if (err) reject(err);
        else resolve(key.toString('hex'));
      });
    });
    // Timing-safe comparison
    try {
      return crypto.timingSafeEqual(Buffer.from(derivedKey, 'hex'), Buffer.from(hash, 'hex'));
    } catch {
      return false;
    }
  }

  public static validatePasswordStrength(password: string): { valid: boolean; error?: string } {
    if (!password || password.length < 6) {
      return { valid: false, error: 'Password must be at least 6 characters long.' };
    }
    if (password.length > 128) {
      return { valid: false, error: 'Password must be under 128 characters.' };
    }
    return { valid: true };
  }
}
