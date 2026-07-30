import { UserRecord, SessionRecord, AuditLog } from './types';

// In-Memory implementation mimicking a future DB client (Prisma/TypeORM)
class UserStoreImpl {
  private users: Map<string, UserRecord> = new Map();
  private sessions: Map<string, SessionRecord> = new Map();
  private auditLogs: AuditLog[] = [];
  private resetTokens: Map<string, { userId: string; expiresAt: number }> = new Map();

  constructor() {
    this.seedInitialData();
  }

  // Users
  public async findUserById(id: string): Promise<UserRecord | null> {
    return this.users.get(id) || null;
  }

  public async findUserByEmail(email: string): Promise<UserRecord | null> {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  public async getAllUsers(): Promise<UserRecord[]> {
    return Array.from(this.users.values());
  }

  public async getAllAuditLogs(): Promise<AuditLog[]> {
    return [...this.auditLogs];
  }

  public async getActiveSessionsCount(): Promise<number> {
    return this.sessions.size;
  }

  public async createUser(user: UserRecord): Promise<void> {
    if (await this.findUserByEmail(user.email)) {
      throw new Error('User with this email already exists.');
    }
    this.users.set(user.id, user);
  }

  public async updateUser(id: string, updates: Partial<UserRecord>): Promise<void> {
    const user = await this.findUserById(id);
    if (user) {
      this.users.set(id, { ...user, ...updates });
    }
  }

  public async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }

  // ─── Generation / Prompt / CSV Counters ───────────────────────────────────
  public async incrementGeneration(userId: string): Promise<void> {
    const user = await this.findUserById(userId);
    if (user) {
      this.users.set(userId, { ...user, totalGenerations: (user.totalGenerations || 0) + 1 });
    }
  }

  public async incrementPrompt(userId: string): Promise<void> {
    const user = await this.findUserById(userId);
    if (user) {
      this.users.set(userId, { ...user, totalPrompts: (user.totalPrompts || 0) + 1 });
    }
  }

  public async incrementCsvExport(userId: string): Promise<void> {
    const user = await this.findUserById(userId);
    if (user) {
      this.users.set(userId, { ...user, totalCsvExports: (user.totalCsvExports || 0) + 1 });
    }
  }

  // Sessions
  public async findSessionByToken(token: string): Promise<SessionRecord | null> {
    return this.sessions.get(token) || null;
  }

  public async findSessionsByUserId(userId: string): Promise<SessionRecord[]> {
    const userSessions: SessionRecord[] = [];
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        userSessions.push(session);
      }
    }
    return userSessions;
  }

  public async createSession(session: SessionRecord): Promise<void> {
    this.sessions.set(session.token, session);
  }

  public async deleteSession(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  public async deleteSessionsByUserId(userId: string): Promise<void> {
    const tokensToDelete: string[] = [];
    for (const [token, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        tokensToDelete.push(token);
      }
    }
    tokensToDelete.forEach(token => this.sessions.delete(token));
  }

  // Password Reset Tokens
  public async createResetToken(userId: string, token: string): Promise<void> {
    // Token expires in 1 hour
    this.resetTokens.set(token, { userId, expiresAt: Date.now() + 60 * 60 * 1000 });
  }

  public async validateResetToken(token: string): Promise<string | null> {
    const entry = this.resetTokens.get(token);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.resetTokens.delete(token);
      return null;
    }
    return entry.userId;
  }

  public async deleteResetToken(token: string): Promise<void> {
    this.resetTokens.delete(token);
  }

  // Audit
  public async logAudit(log: AuditLog): Promise<void> {
    this.auditLogs.unshift(log);
  }

  // Seeding — admin users only (no demo/test users)
  // NOTE: These seeded admins use a special marker that the password verification
  // falls back to plaintext comparison. Admins should reset via Admin Panel after first login.
  private seedInitialData() {
    // SECURITY: seeded admin users are stored with a legacy marker.
    // They are NEVER auto-logged in. They must authenticate through the login form.
    // The in-memory store resets on each deploy — this is expected behavior
    // for the current architecture. Real activation happens via admin panel.
    this.users.set('usr_admin_1', {
      id: 'usr_admin_1',
      fullName: 'Fahad Hussain',
      email: 'fahadhussain0282@gmail.com',
      // SECURITY: Using legacy marker. Admin must login with their known password.
      // Password will be upgraded to PBKDF2 on first login via the update flow.
      passwordHash: 'legacy:admin_seed_1',
      provider: 'local',
      role: 'admin',
      status: 'active',
      subscription: {
        planId: 'plan_1m',
        planName: '1 Month Plan',
        price: 300,
        durationDays: 30,
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
        isActive: true,
        isExpired: false,
        deviceId: 'dev_admin_01'
      },
      activeDeviceId: 'dev_admin_01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      totalGenerations: 124,
      totalPrompts: 38,
      totalCsvExports: 21
    });

    this.users.set('usr_admin_2', {
      id: 'usr_admin_2',
      fullName: 'Adobe Icon Studio',
      email: 'adobeicon99@gmail.com',
      passwordHash: 'legacy:admin_seed_2',
      provider: 'local',
      role: 'admin',
      status: 'active',
      subscription: {
        planId: 'plan_6m',
        planName: '6 Months Plan',
        price: 2000,
        durationDays: 180,
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 180 * 86400000).toISOString(),
        isActive: true,
        isExpired: false,
        deviceId: 'dev_admin_02'
      },
      activeDeviceId: 'dev_admin_02',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      totalGenerations: 532,
      totalPrompts: 147,
      totalCsvExports: 89
    });

    this.auditLogs.push({
      id: 'audit_1',
      timestamp: new Date().toISOString(),
      adminEmail: 'fahadhussain0282@gmail.com',
      action: 'SYSTEM_BOOT',
      targetUser: 'SYSTEM',
      details: 'Enterprise Authentication Architecture initialized. StockAI v1.1'
    });
  }
}

// Export a singleton instance representing the DB connection
export const userStore = new UserStoreImpl();
