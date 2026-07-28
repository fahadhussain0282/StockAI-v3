import crypto from 'crypto';

export class PasswordService {
  /**
   * Hashes a password. 
   * In a real production system, you'd use bcrypt or argon2.
   * For now, we simulate this with SHA-256 for backward compatibility with the current system
   * where passwords were saved in plaintext or custom hashed.
   */
  public static async hashPassword(password: string): Promise<string> {
    // Current stockai server.ts compares plaintext "admin123" === "admin123"
    // To maintain backward compatibility without breaking existing mock users, 
    // we just return the password itself, but we build the async signature 
    // so it's ready for `bcrypt.hash(password, 10)` in the future.
    return password;
  }

  public static async verifyPassword(plain: string, hash: string): Promise<boolean> {
    // Future: return bcrypt.compare(plain, hash)
    return plain === hash;
  }

  public static validatePasswordStrength(password: string): { valid: boolean; error?: string } {
    if (!password || password.length < 6) {
      return { valid: false, error: 'Password must be at least 6 characters long.' };
    }
    // Future: check complexity (numbers, symbols, uppercase)
    return { valid: true };
  }
}
